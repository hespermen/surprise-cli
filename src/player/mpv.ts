/**
 * Бэкенд на mpv: процесс в режиме простоя + управление по JSON-IPC.
 *
 * Почему не свой декодер. Нам нужно играть mp3 по HTTP с Range-перемоткой,
 * зашифрованный AES-128 HLS и бесконечный icecast-поток с переподключением.
 * mpv умеет всё это годами и лучше, чем получилось бы у нас; задачи уровня
 * librespot (реверс закрытого протокола) здесь нет вовсе.
 *
 * Протокол IPC: по одной JSON-команде на строку в unix-сокет, ответы и события
 * приходят тем же потоком. Ответ на команду опознаётся по request_id.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { connect, type Socket } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BackendEmitter,
  BackendUnavailableError,
  clampVolume,
  type AudioBackend,
  type LoadOptions,
  type PlaybackStatus,
} from "./backend.ts";
import { PLAYBACK_WATCHDOG_MS, describeFailure } from "./failure.ts";

interface PendingCommand {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

const CONNECT_TIMEOUT_MS = 5_000;
const COMMAND_TIMEOUT_MS = 5_000;

/** Свойства, за которыми следим: их изменения приходят как события. */
const OBSERVED = ["time-pos", "duration", "pause", "core-idle"] as const;

export class MpvBackend extends BackendEmitter implements AudioBackend {
  readonly name = "mpv";
  readonly canSeek = true;
  readonly canSetVolume = true;
  readonly positionIsExact = true;

  #child: ChildProcess | null = null;
  #socket: Socket | null = null;
  #socketDir: string | null = null;
  #buffer = "";
  #nextRequestId = 1;
  #pending = new Map<number, PendingCommand>();
  #stopping = false;

  #state: PlaybackStatus = { positionSec: null, durationSec: null, paused: false, idle: true };

  /** Хвост stderr: mpv объясняет отказ только туда, а сам при этом не падает. */
  #stderrTail = "";
  /** Сторож запуска — см. комментарий в #armWatchdog. */
  #watchdog: NodeJS.Timeout | null = null;
  /**
   * Первая позиция после загрузки — точка отсчёта для сторожа.
   *
   * Проверять «позиция появилась» недостаточно: mpv присылает time-pos = 0 сразу
   * при открытии файла, ещё до того, как что-то зазвучало. На этом нуле сторож
   * снимался, а часы потом так и не шли — ровно тот случай, который он должен
   * был поймать. Признак настоящего воспроизведения — что позиция СДВИНУЛАСЬ.
   */
  #firstPosition: number | null = null;
  #positionMoved = false;

  /**
   * Имя бинаря отдельным полем, а не parameter property: Node снимает типы
   * «в лоб» и на `constructor(private x)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
   * esbuild такое переваривает, поэтому сборка проходила, а `node --test` — нет.
   */
  readonly #binary: string;

  constructor(binary = process.env.SURPRISE_MPV ?? "mpv") {
    super();
    this.#binary = binary;
  }

  status(): PlaybackStatus {
    return { ...this.#state };
  }

  async start(): Promise<void> {
    if (this.#child) return;

    this.#socketDir = await mkdtemp(join(tmpdir(), "surprise-mpv-"));
    const socketPath =
      process.platform === "win32"
        ? `\\\\.\\pipe\\surprise-mpv-${process.pid}`
        : join(this.#socketDir, "ipc.sock");

    const child = spawn(
      this.#binary,
      [
        "--idle=yes",
        "--no-video",
        "--no-terminal",
        // Конфиг пользователя может содержать что угодно — вплоть до
        // видеовыхода и своих привязок клавиш. Нам нужен предсказуемый плеер.
        "--no-config",
        "--audio-display=no",
        // Поток icecast рвётся на ровном месте: без этого одна сетевая икота
        // заканчивала бы эфир навсегда.
        "--stream-lavf-o=reconnect=1,reconnect_streamed=1,reconnect_delay_max=5",
        `--input-ipc-server=${socketPath}`,
      ],
      // stderr в трубу, а не в никуда: без него причина отказа теряется целиком.
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (text: string) => {
      this.#stderrTail = (this.#stderrTail + text).slice(-4_000);
    });

    this.#child = child;

    child.on("error", (error) => {
      // ENOENT здесь — самый частый случай: mpv просто не установлен.
      const wrapped =
        (error as NodeJS.ErrnoException).code === "ENOENT"
          ? new BackendUnavailableError(`Не найден ${this.#binary}`)
          : error;
      this.fire("error", wrapped);
    });

    child.on("exit", (code, signal) => {
      this.#child = null;
      this.#state = { positionSec: null, durationSec: null, paused: false, idle: true };
      this.#rejectAllPending(new Error("mpv завершился"));
      if (!this.#stopping) this.fire("exit", { code, signal });
    });

    await this.#connect(socketPath);
    for (const [index, property] of OBSERVED.entries()) {
      await this.#command(["observe_property", index + 1, property]).catch(() => {});
    }
  }

  /**
   * Сокет появляется не в момент спавна, а когда mpv дойдёт до его создания —
   * поэтому подключаемся с повторами, а не один раз.
   */
  async #connect(socketPath: string): Promise<void> {
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;

    for (;;) {
      if (!this.#child) throw new BackendUnavailableError(`${this.#binary} не запустился`);
      try {
        this.#socket = await new Promise<Socket>((resolve, reject) => {
          const socket = connect(socketPath);
          socket.once("connect", () => resolve(socket));
          socket.once("error", reject);
        });
        break;
      } catch {
        if (Date.now() > deadline) {
          throw new BackendUnavailableError(
            `Не удалось подключиться к ${this.#binary} за ${CONNECT_TIMEOUT_MS / 1000} с`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }

    const socket = this.#socket;
    if (!socket) throw new BackendUnavailableError("сокет mpv не открылся");

    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => this.#ingest(chunk));
    socket.on("error", () => {
      // Обрыв сокета сам по себе не событие для пользователя: следом придёт
      // exit процесса, вот его и покажем.
    });
  }

  /**
   * Разбор входящего потока.
   *
   * Сообщения разделены переводом строки, но чанк может оборваться на середине
   * JSON — поэтому копим хвост, а не парсим каждый чанк целиком.
   */
  #ingest(chunk: string): void {
    this.#buffer += chunk;
    let index = this.#buffer.indexOf("\n");

    while (index !== -1) {
      const line = this.#buffer.slice(0, index).trim();
      this.#buffer = this.#buffer.slice(index + 1);
      if (line) this.#handleMessage(line);
      index = this.#buffer.indexOf("\n");
    }
  }

  #handleMessage(line: string): void {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }

    if (typeof message.request_id === "number") {
      const pending = this.#pending.get(message.request_id);
      if (pending) {
        this.#pending.delete(message.request_id);
        clearTimeout(pending.timer);
        if (message.error === "success") pending.resolve(message.data);
        else pending.reject(new Error(String(message.error ?? "ошибка mpv")));
      }
      return;
    }

    if (message.event === "property-change") this.#applyProperty(String(message.name), message.data);
    else if (message.event === "end-file") this.#handleEndFile(String(message.reason ?? ""));
  }

  #applyProperty(name: string, value: unknown): void {
    const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;

    switch (name) {
      case "time-pos":
        if (numeric !== null) {
          if (this.#firstPosition === null) this.#firstPosition = numeric;
          else if (numeric !== this.#firstPosition) {
            // Часы пошли — воспроизведение действительно идёт.
            this.#positionMoved = true;
            this.#disarmWatchdog();
          }
        }
        this.#state.positionSec = numeric;
        break;
      case "duration":
        // У живого потока длительности нет — mpv шлёт 0 или null. Ноль в этом
        // месте означал бы «трек нулевой длины» и ломал бы прогресс-бар.
        this.#state.durationSec = numeric && numeric > 0 ? numeric : null;
        break;
      case "pause":
        this.#state.paused = value === true;
        break;
      case "core-idle":
        this.#state.idle = value === true;
        break;
      default:
        return;
    }
    this.fire("status", this.status());
  }

  #handleEndFile(reason: string): void {
    // 'eof' — доиграл сам; 'stop'/'quit' — это мы его остановили, и очередь
    // двигать не надо, иначе переключение трека само себя перепрыгнет.
    if (reason === "eof") this.fire("ended");
  }

  #rejectAllPending(error: Error): void {
    for (const [, pending] of this.#pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.#pending.clear();
  }

  #command(args: readonly unknown[]): Promise<unknown> {
    const socket = this.#socket;
    if (!socket || socket.destroyed) return Promise.reject(new Error("mpv не запущен"));

    const requestId = this.#nextRequestId++;
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(requestId);
        reject(new Error(`mpv не ответил на ${String(args[0])}`));
      }, COMMAND_TIMEOUT_MS);

      this.#pending.set(requestId, { resolve, reject, timer });
      socket.write(`${JSON.stringify({ command: args, request_id: requestId })}\n`);
    });
  }

  async load(url: string, options: LoadOptions = {}): Promise<void> {
    await this.start();
    this.#state = { positionSec: null, durationSec: null, paused: false, idle: false };

    // start=<sec> передаётся именно как опция loadfile, а не отдельным seek
    // после загрузки: seek по ещё не открытому файлу mpv игнорирует молча.
    const startSec = options.startSec && options.startSec > 0 ? options.startSec : null;
    const args: unknown[] = ["loadfile", url, "replace"];
    if (startSec) args.push({ start: String(Math.floor(startSec)) });

    await this.#command(args);
    this.#armWatchdog();
  }

  /**
   * Сторож запуска воспроизведения.
   *
   * mpv без звукового устройства файл ОТКРЫВАЕТ — кодек определяется, дорожка
   * выбирается, процесс живёт, — но часы не запускает: time-pos остаётся
   * «property unavailable» навсегда. Ни падения, ни сообщения; строка состояния
   * вечно висит на `--:--`, и с точки зрения человека плеер просто не работает,
   * не объясняя почему. Поймано на машине без звуковой карты.
   *
   * Поэтому: не пришло ни одной позиции за отведённое время — говорим, в чём
   * дело, разобрав stderr.
   */
  #armWatchdog(): void {
    this.#disarmWatchdog();
    this.#firstPosition = null;
    this.#positionMoved = false;

    this.#watchdog = setTimeout(() => {
      if (this.#positionMoved || !this.#child) return;
      this.fire("error", new Error(describeFailure(this.#stderrTail, this.#binary)));
      this.fire("exit", { code: null, signal: null });
    }, Number(process.env.SURPRISE_MPV_WATCHDOG_MS) || PLAYBACK_WATCHDOG_MS);
    this.#watchdog.unref?.();
  }

  #disarmWatchdog(): void {
    if (this.#watchdog) clearTimeout(this.#watchdog);
    this.#watchdog = null;
  }

  async setPaused(paused: boolean): Promise<void> {
    await this.#command(["set_property", "pause", paused]);
    this.#state.paused = paused;
    this.fire("status", this.status());
  }

  async seek(seconds: number, mode: "absolute" | "relative"): Promise<void> {
    await this.#command(["seek", seconds, mode]);
  }

  async setVolume(percent: number): Promise<void> {
    await this.#command(["set_property", "volume", clampVolume(percent)]);
  }

  async stop(): Promise<void> {
    this.#stopping = true;
    this.#disarmWatchdog();
    const child = this.#child;

    try {
      await this.#command(["quit"]).catch(() => {});
    } finally {
      this.#socket?.destroy();
      this.#socket = null;
      // Дать mpv закрыться самому, но не ждать вечно: подвисший процесс не
      // должен держать выход из CLI.
      if (child && child.exitCode === null) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            child.kill("SIGKILL");
            resolve();
          }, 1_000);
          child.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
      if (this.#socketDir) await rm(this.#socketDir, { recursive: true, force: true }).catch(() => {});
      this.#socketDir = null;
      this.#child = null;
      this.#stopping = false;
    }
  }
}
