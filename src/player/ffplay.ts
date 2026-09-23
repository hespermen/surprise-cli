/**
 * Запасной бэкенд на ffplay.
 *
 * ffplay приезжает вместе с ffmpeg, который стоит у большинства, кто вообще
 * работает со звуком в терминале. Управляющего канала у него нет — поэтому всё
 * здесь делается грубее, и интерфейс об этом честно сообщает флагами:
 *
 *   позиция — по часам, а не от декодера (сеть подтормозила — разойдётся);
 *   пауза   — SIGSTOP/SIGCONT процессу;
 *   перемотка — перезапуск с новым -ss;
 *   громкость — только при запуске, на лету не меняется.
 *
 * Это осознанно деградированный режим: он позволяет слушать сразу, не уходя
 * ставить mpv, но mpv лучше во всём и предлагается первым.
 */

import { spawn, type ChildProcess } from "node:child_process";

import {
  BackendEmitter,
  BackendUnavailableError,
  clampVolume,
  type AudioBackend,
  type LoadOptions,
  type PlaybackStatus,
} from "./backend.ts";
import { assertPlayable } from "./playable.ts";
import { describeFailure } from "./failure.ts";

/** Короче этого «воспроизведение» — точно не воспроизведение. */
const TOO_FAST_MS = 1_500;

export class FfplayBackend extends BackendEmitter implements AudioBackend {
  readonly name = "ffplay";
  readonly canSeek = true;
  readonly canSetVolume = false;
  readonly positionIsExact = false;

  #child: ChildProcess | null = null;
  #url: string | null = null;
  #volume = 100;
  #paused = false;

  /** Секунда, с которой стартовал текущий процесс. */
  #offsetSec = 0;
  /** Момент старта процесса по часам. */
  #startedAt = 0;
  /** Сколько суммарно простояли на паузе. */
  #pausedTotalMs = 0;
  #pausedAt = 0;

  #ticker: NodeJS.Timeout | null = null;
  /** Свой перезапуск (перемотка) — не повод сообщать «доиграл» или «упал». */
  #restarting = false;

  /**
   * Имя бинаря отдельным полем, а не parameter property: Node снимает типы
   * «в лоб» и на `constructor(private x)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
   * esbuild такое переваривает, поэтому сборка проходила, а `node --test` — нет.
   */
  readonly #binary: string;

  constructor(binary = process.env.SURPRISE_FFPLAY ?? "ffplay") {
    super();
    this.#binary = binary;
  }

  status(): PlaybackStatus {
    return {
      positionSec: this.#child ? this.#position() : null,
      // Длительность знает только декодер, а канала к нему нет. null честнее
      // выдуманного числа: интерфейс нарисует время без общей шкалы.
      durationSec: null,
      paused: this.#paused,
      idle: this.#child === null,
    };
  }

  #position(): number {
    const pausedMs = this.#pausedTotalMs + (this.#paused ? Date.now() - this.#pausedAt : 0);
    return this.#offsetSec + Math.max(0, (Date.now() - this.#startedAt - pausedMs) / 1000);
  }

  async start(): Promise<void> {
    // Держать простаивающий процесс незачем: без IPC он всё равно ничего не
    // умеет до появления адреса.
  }

  async load(url: string, options: LoadOptions = {}): Promise<void> {
    assertPlayable(url);
    this.#url = url;
    await this.#spawnAt(options.startSec ?? 0);
  }

  async #spawnAt(startSec: number): Promise<void> {
    const url = this.#url;
    if (!url) throw new Error("нечего играть");

    await this.#kill();

    const args = [
      "-nodisp",
      "-autoexit",
      "-loglevel",
      "error",
      "-volume",
      String(clampVolume(this.#volume)),
    ];
    if (startSec > 0) args.push("-ss", String(Math.floor(startSec)));
    args.push(url);

    const child = spawn(this.#binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    this.#child = child;

    // Держим хвост stderr: ffplay сообщает причину отказа только туда, а код
    // возврата при этом может оказаться нулевым (см. ниже).
    let stderrTail = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (text: string) => {
      stderrTail = (stderrTail + text).slice(-2_000);
    });
    this.#offsetSec = startSec;
    this.#startedAt = Date.now();
    this.#pausedTotalMs = 0;
    this.#pausedAt = 0;
    this.#paused = false;

    child.on("error", (error) => {
      const wrapped =
        (error as NodeJS.ErrnoException).code === "ENOENT"
          ? new BackendUnavailableError(`Не найден ${this.#binary}`)
          : error;
      this.fire("error", wrapped);
    });

    child.on("exit", (code, signal) => {
      const playedMs = Date.now() - this.#startedAt;
      this.#child = null;
      this.#stopTicker();
      if (this.#restarting) return;

      // Мгновенный выход с нулевым кодом — это НЕ «доиграл».
      //
      // ffplay, которому не досталось звукового устройства, честно пишет
      // причину в stderr, но завершается кодом 0. Приняв это за конец файла,
      // мы печатали человеку «Остановлено.» и умолкали: часовой выпуск
      // «доигрывал» за полсекунды, и почему — узнать было неоткуда.
      // Отличаем по времени жизни: настоящий трек столько не длится.
      if (code === 0 && playedMs < TOO_FAST_MS) {
        this.fire("error", new Error(describeFailure(stderrTail, this.#binary)));
        this.fire("exit", { code, signal });
        return;
      }

      // -autoexit завершает процесс нулевым кодом ровно тогда, когда файл
      // доиграл. Всё остальное — падение, и очередь двигать нельзя.
      if (code === 0) this.fire("ended");
      else this.fire("exit", { code, signal });
    });

    this.#startTicker();
  }

  /**
   * ffplay не сообщает позицию — шлём её сами раз в секунду, чтобы у интерфейса
   * был один и тот же источник событий для обоих бэкендов.
   */
  #startTicker(): void {
    this.#stopTicker();
    this.#ticker = setInterval(() => {
      if (!this.#paused) this.fire("status", this.status());
    }, 1_000);
    // Тикер не должен удерживать процесс живым сам по себе.
    this.#ticker.unref?.();
  }

  #stopTicker(): void {
    if (this.#ticker) clearInterval(this.#ticker);
    this.#ticker = null;
  }

  async #kill(): Promise<void> {
    const child = this.#child;
    if (!child) return;

    this.#restarting = true;
    try {
      // Остановленный SIGSTOP процесс SIGTERM не обработает — сначала отпустим.
      if (this.#paused) child.kill("SIGCONT");
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 800);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    } finally {
      this.#restarting = false;
      this.#child = null;
      this.#stopTicker();
    }
  }

  async setPaused(paused: boolean): Promise<void> {
    const child = this.#child;
    if (!child || paused === this.#paused) return;

    // Настоящей паузы у ffplay нет: замораживаем процесс целиком. Звуковой
    // буфер при этом дослушивается — отсюда доля секунды «лишнего» звука.
    child.kill(paused ? "SIGSTOP" : "SIGCONT");

    if (paused) {
      this.#pausedAt = Date.now();
    } else {
      this.#pausedTotalMs += Date.now() - this.#pausedAt;
      this.#pausedAt = 0;
    }
    this.#paused = paused;
    this.fire("status", this.status());
  }

  async seek(seconds: number, mode: "absolute" | "relative"): Promise<void> {
    const target = mode === "absolute" ? seconds : this.#position() + seconds;
    await this.#spawnAt(Math.max(0, target));
  }

  async setVolume(percent: number): Promise<void> {
    // Применится со следующего запуска: менять громкость на лету нечем.
    this.#volume = clampVolume(percent);
  }

  async stop(): Promise<void> {
    await this.#kill();
    this.#url = null;
  }

  // levels() намеренно не реализован: у ffplay нет управляющего канала, и
  // получить уровни звучащего потока неоткуда.
}
