/**
 * Многопанельный интерфейс: разделы слева, список справа, подробности под ним,
 * плеер во всю ширину внизу.
 *
 * Три состояния намеренно разведены и видны одновременно:
 *   активный РАЗДЕЛ  — что открыто;
 *   ВЫБРАННАЯ строка — куда смотрит человек;
 *   ИГРАЮЩЕЕ         — что звучит.
 * Поэтому каталог листается без остановки музыки.
 */

import { Box, Text, useApp, useInput, useStdout } from "ink";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  elapsedSec,
  fetchLiveChannelId,
  fetchRadioSchedule,
  fetchStationSettings,
  formatRadioItem,
  leavePresence,
  resolveLiveStream,
  sendHeartbeat,
  SCHEDULE_INTERVAL_MS,
  type RadioItem,
} from "../api/radio.ts";
import { showsByArtist, showsByHost, type Artist, type Host, type Release } from "../api/catalog.ts";
import {
  currentTrackIndex,
  fetchShowStream,
  fetchTracklist,
  findShow,
  searchShows,
  type Show,
  type TracklistItem,
} from "../api/shows.ts";
import { listPlaylistItems, type Find, type LikedShow, type PlaylistSummary } from "../api/library.ts";
import {
  listReleaseTracks,
  resolveTrackAccess,
  TrackAccessDeniedError,
  type StoreTrack,
  type TrackAccess,
} from "../api/store.ts";
import {
  TelegramUnavailableError,
  logout as logoutSession,
  loginWithPassword,
  startTelegramLogin,
  waitForTelegramLogin,
} from "../net/auth.ts";
import { parseJwt } from "../net/jwt.ts";
import { renderQr } from "../ui/term.ts";
import { HEARTBEAT_INTERVAL_MS } from "../config.ts";
import { formatDuration } from "../lib/format.ts";
import { getListenerId, getSessionId } from "../lib/ids.ts";
import { parseEntityParam } from "../lib/publicId.ts";
import type { AudioBackend } from "../player/backend.ts";
import { CommandLine } from "./CommandLine.tsx";
import { parseCommand, resolveCommand, suggestCommands, SECTION_ALIASES } from "./commands.ts";
import { DetailsPanel, type Details } from "./DetailsPanel.tsx";
import { HelpOverlay } from "./HelpOverlay.tsx";
import { LOGIN_METHODS, LoginOverlay, type LoginPhase } from "./LoginOverlay.tsx";
import { ListPanel } from "./ListPanel.tsx";
import { PlayerBar } from "./PlayerBar.tsx";
import { SECTIONS, sectionById, type ColumnSpec, type SavedRow, type SectionId } from "./sections.ts";
import { Sidebar } from "./Sidebar.tsx";
import { theme } from "./theme.ts";
import { usePlayer } from "./usePlayer.ts";

type Focus = "sidebar" | "list" | "details";

interface NowPlaying {
  kind: "radio" | "show" | "track";
  title: string;
  subtitle: string | null;
  showId: string | null;
  totalSec: number | null;
  /** Ограничение превью: секунда, на которой обязаны остановиться. */
  previewEndSec: number | null;
  badge: string | null;
}

/**
 * Строка внутри карточки — выпуск или трек релиза.
 *
 * Карточка (артист, автор, релиз, плейлист) открывается поверх списка раздела,
 * а не вместо него: выйти назад — Esc, и человек возвращается ровно туда, где был.
 */
type DrillRow =
  | { kind: "show"; id: string; title: string; subtitle: string | null; duration: number | null }
  | { kind: "track"; track: StoreTrack; title: string; subtitle: string | null; duration: number | null };

interface Drill {
  title: string;
  rows: DrillRow[];
  selected: number;
}

export interface AppProps {
  backend: AudioBackend;
  backendName: string;
  accessToken: string | null;
  userId: string;
  onExit: () => Promise<void>;
}

// Ширина под самое длинное название раздела с номером: «6 Моя коллекция».
const SIDEBAR_WIDTH = 24;

const DRILL_COLUMNS: ReadonlyArray<ColumnSpec<DrillRow>> = [
  { header: "", width: 6, value: (row) => (row.kind === "track" ? "трек" : "выпуск") },
  { header: "Название", width: 0, flex: true, value: (row) => row.title },
  { header: "Кто", width: 22, value: (row) => row.subtitle ?? "—" },
  { header: "Длит.", width: 8, value: (row) => formatDuration(row.duration) },
];

export function App({
  backend,
  backendName,
  accessToken: initialToken,
  userId: initialUserId,
  onExit,
}: AppProps): React.ReactElement {
  // Токен — состояние, а не просто входной параметр: после `/login` личные
  // разделы обязаны ожить сразу, без перезапуска программы.
  const [accessToken, setAccessToken] = useState<string | null>(initialToken);
  const [userId, setUserId] = useState(initialUserId);
  const [login, setLogin] = useState<LoginPhase | null>(null);

  const { exit } = useApp();
  const { stdout } = useStdout();
  const status = usePlayer(backend);

  // Ноль — реальное значение columns там, где размер терминала неизвестен
  // (псевдотерминал без управляющего tty). Без защиты интерфейс схлопывался
  // в колонку шириной в один символ.
  const width = clampSize(stdout?.columns, 100, 40);
  const height = clampSize(stdout?.rows, 30, 12);

  const [focus, setFocus] = useState<Focus>("list");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("radio");

  const [rowsBySection, setRows] = useState<Partial<Record<SectionId, unknown[]>>>({});
  const [selectedBySection, setSelected] = useState<Partial<Record<SectionId, number>>>({});
  const [loading, setLoading] = useState<SectionId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [drill, setDrill] = useState<Drill | null>(null);

  const [now, setNow] = useState<NowPlaying | null>(null);
  const [volume, setVolume] = useState(100);
  const [mutedFrom, setMutedFrom] = useState(100);
  const [showHelp, setShowHelp] = useState(false);

  const [radioNow, setRadioNow] = useState<RadioItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const [tracklist, setTracklist] = useState<TracklistItem[]>([]);
  const [detailShow, setDetailShow] = useState<Show | null>(null);

  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);

  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [commandHighlight, setCommandHighlight] = useState(0);
  const [commandError, setCommandError] = useState<string | null>(null);

  const section = sectionById(activeSection);
  const sectionRows = rowsBySection[activeSection] ?? [];
  const rows: readonly unknown[] = drill ? drill.rows : sectionRows;
  const selected = drill
    ? drill.selected
    : Math.min(selectedBySection[activeSection] ?? 0, Math.max(0, sectionRows.length - 1));

  const say = useCallback((text: string | null) => setMessage(text), []);
  const setSelectedFor = useCallback(
    (id: SectionId, value: number) => setSelected((previous) => ({ ...previous, [id]: value })),
    [],
  );

  // ── Загрузка раздела при первом открытии ──

  useEffect(() => {
    if (rowsBySection[activeSection] || activeSection === "radio" || activeSection === "search") return;
    const spec = sectionById(activeSection);
    if (spec.needsAuth && !accessToken) return;

    let cancelled = false;
    setLoading(activeSection);
    void spec
      .load({ accessToken, userId })
      .then((loaded) => {
        if (!cancelled) setRows((previous) => ({ ...previous, [activeSection]: loaded }));
      })
      .catch((error: unknown) => {
        if (!cancelled) say(`Раздел не загрузился: ${(error as Error).message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSection, accessToken, userId, rowsBySection, say]);

  // ── Эфир ──

  const playRadio = useCallback(async () => {
    const url = streamUrl;
    if (!url) return;
    try {
      await backend.load(url);
      setNow({
        kind: "radio",
        title: "SURPRISE.FM",
        subtitle: null,
        showId: null,
        totalSec: null,
        previewEndSec: null,
        badge: null,
      });
      say(null);
    } catch (error) {
      say(`Эфир не запустился: ${(error as Error).message}`);
    }
  }, [backend, streamUrl, say]);

  useEffect(() => {
    void (async () => {
      const settings = await fetchStationSettings();
      const url = await resolveLiveStream(settings);
      setStreamUrl(url);
      try {
        await backend.load(url);
        setNow({
          kind: "radio",
          title: "SURPRISE.FM",
          subtitle: null,
          showId: null,
          totalSec: null,
          previewEndSec: null,
          badge: null,
        });
      } catch (error) {
        say(`Эфир не запустился: ${(error as Error).message}`);
      }
    })();
    // Один раз при запуске: backend за жизнь интерфейса не меняется.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const schedule = await fetchRadioSchedule().catch(() => null);
      if (!schedule) return;
      setRadioNow(schedule.now);
      setRows((previous) => ({
        ...previous,
        radio: [
          ...(schedule.next ? [{ ...schedule.next, when: "дальше" }] : []),
          ...(schedule.now ? [{ ...schedule.now, when: "сейчас" }] : []),
          ...schedule.history.map((item) => ({ ...item, when: "" })),
        ],
      }));
    };
    void refresh();
    const timer = setInterval(() => void refresh(), SCHEDULE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (now?.kind !== "radio") return;
    const sessionId = getSessionId();
    let channelId: string | null = null;
    let timer: NodeJS.Timeout | null = null;

    void (async () => {
      channelId = await fetchLiveChannelId();
      if (!channelId) return;
      await sendHeartbeat(channelId, sessionId, accessToken);
      timer = setInterval(() => {
        if (channelId) void sendHeartbeat(channelId, sessionId, accessToken);
      }, HEARTBEAT_INTERVAL_MS);
    })();

    return () => {
      if (timer) clearInterval(timer);
      // Уходим из эфира явно: иначе слушатель висит в счётчике до TTL.
      if (channelId) void leavePresence(sessionId, accessToken);
    };
  }, [now?.kind, accessToken]);

  // ── Поиск ──

  useEffect(() => {
    if (activeSection !== "search") return;
    if (query.trim().length < 2) {
      setRows((previous) => ({ ...previous, search: [] }));
      return;
    }
    const timer = setTimeout(() => {
      void searchShows(query.trim(), 50, accessToken)
        .then((found) => setRows((previous) => ({ ...previous, search: found })))
        .catch(() => setRows((previous) => ({ ...previous, search: [] })));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeSection, accessToken]);

  // ── Подробности выбранного ──

  const selectedRow = rows[selected];

  useEffect(() => {
    const show = asShow(activeSection, drill, selectedRow);
    if (!show) {
      setDetailShow(null);
      setTracklist([]);
      return;
    }
    setDetailShow(show);

    let cancelled = false;
    void fetchTracklist(show, accessToken)
      .then((items) => {
        if (!cancelled) setTracklist(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeSection, drill, selectedRow, accessToken]);

  // ── Воспроизведение ──

  const playShow = useCallback(
    async (show: Show) => {
      say(`Открываем «${show.title ?? "выпуск"}»…`);
      const stream = await fetchShowStream(show.id, accessToken).catch(() => null);
      if (!stream?.audio_url) {
        say("У выпуска нет аудио");
        return;
      }
      try {
        await backend.load(stream.audio_url);
      } catch (error) {
        say(`Не вышло: ${(error as Error).message}`);
        return;
      }
      setNow({
        kind: "show",
        title: show.title ?? "Без названия",
        subtitle: show.artists.map((artist) => artist.name).join(", ") || null,
        showId: show.id,
        totalSec: show.duration,
        previewEndSec: null,
        badge: null,
      });
      say(null);
    },
    [backend, accessToken, say],
  );

  const playById = useCallback(
    async (showId: string) => {
      const show = await findShow(parseEntityParam(showId), accessToken).catch(() => null);
      if (show) await playShow(show);
      else say("Выпуск не открылся");
    },
    [accessToken, playShow, say],
  );

  /**
   * Трек магазина. Доступ решает сервер: store-stream смотрит покупку, подписку
   * и квоту бесплатных прослушиваний. Наше дело — показать причину отказа и
   * остановиться на границе превью, потому что сервер отдаёт файл целиком.
   */
  const playStoreTrack = useCallback(
    async (track: StoreTrack) => {
      if (!accessToken) {
        say("Треки — только для вошедших. Наберите /login");
        return;
      }
      say(`Открываем «${track.title ?? "трек"}»…`);
      let access: TrackAccess;
      try {
        access = await resolveTrackAccess(track, await getListenerId(), accessToken);
      } catch (error) {
        say(error instanceof TrackAccessDeniedError ? error.message : `Не вышло: ${(error as Error).message}`);
        return;
      }

      try {
        await backend.load(access.url, { startSec: access.window?.startSec });
      } catch (error) {
        say(`Не вышло: ${(error as Error).message}`);
        return;
      }

      setNow({
        kind: "track",
        title: track.title ?? "Без названия",
        subtitle: track.artist_name ?? track.releaseTitle,
        showId: null,
        totalSec: access.window ? access.window.durationSec : track.duration,
        previewEndSec: access.window?.endSec ?? null,
        badge:
          access.kind === "preview"
            ? "превью"
            : access.kind === "free_listen"
              ? `бесплатно${access.playsLeft === null ? "" : ` · осталось ${access.playsLeft}`}`
              : null,
      });
      say(null);
    },
    [accessToken, backend, say],
  );

  // Превью обязан обрывать клиент: в бакете лежит ПОЛНАЯ копия трека, и без
  // этой проверки «превью» оказалось бы треком целиком.
  useEffect(() => {
    const limit = now?.previewEndSec;
    if (!limit || status.positionSec === null) return;
    if (status.positionSec >= limit) {
      void backend.setPaused(true);
      say("Конец превью. Полный трек — по подписке или после покупки.");
    }
  }, [now?.previewEndSec, status.positionSec, backend, say]);

  // ── Открытие карточки ──

  const openDrill = useCallback(
    async (title: string, load: () => Promise<DrillRow[]>) => {
      say(`Открываем «${title}»…`);
      const loaded = await load().catch(() => []);
      if (loaded.length === 0) {
        say(`В «${title}» нечего слушать`);
        return;
      }
      setDrill({ title, rows: loaded, selected: 0 });
      setFocus("list");
      say(null);
    },
    [say],
  );

  const activate = useCallback(async () => {
    // Внутри карточки Enter играет выбранное — выпуск или трек.
    if (drill) {
      const row = drill.rows[drill.selected];
      if (!row) return;
      return row.kind === "show" ? playById(row.id) : playStoreTrack(row.track);
    }

    const row = sectionRows[selected];
    if (!row) return;

    switch (activeSection) {
      case "radio":
        // Эфир — это поток, а не список для запуска. Расписание показывает, что
        // играло и что дальше, но открывать по нему архивные записи нельзя:
        // человек нажимал Enter в ЭФИРЕ, а получал выпуск с начала.
        return playRadio();

      case "shows":
      case "search":
        return playShow(row as Show);

      case "likes":
        return playById((row as LikedShow).id);

      case "finds": {
        const find = row as Find;
        if (!find.show) return;
        await playById(find.show.id);
        // Находка — метка внутри выпуска: без прыжка к ней смысл теряется.
        if (find.timestampSec !== null && backend.canSeek) {
          await backend.seek(find.timestampSec, "absolute");
        }
        return;
      }

      case "saved": {
        const saved = row as SavedRow;
        if (saved.isShow) return playById(saved.id);
        say(`«${saved.entityType}» из терминала пока не открыть`);
        return;
      }

      case "artists": {
        const artist = row as Artist;
        return openDrill(artist.name, async () =>
          (await showsByArtist(artist.id, accessToken)).map((show) => ({
            kind: "show" as const,
            id: show.id,
            title: show.title ?? "Без названия",
            subtitle: artist.name,
            duration: show.duration,
          })),
        );
      }

      case "hosts": {
        const host = row as Host;
        return openDrill(host.name, async () =>
          (await showsByHost(host.id, accessToken)).map((show) => ({
            kind: "show" as const,
            id: show.id,
            title: show.title ?? "Без названия",
            subtitle: host.name,
            duration: show.duration,
          })),
        );
      }

      case "releases": {
        const release = row as Release;
        if (!accessToken) {
          say("Треки релизов — только для вошедших. Наберите /login");
          return;
        }
        return openDrill(release.title, async () =>
          (await listReleaseTracks(release.id, accessToken)).map((track) => ({
            kind: "track" as const,
            track,
            title: track.title ?? "Без названия",
            subtitle: track.artist_name ?? (release.artists.join(", ") || null),
            duration: track.duration,
          })),
        );
      }

      case "playlists": {
        const playlist = row as PlaylistSummary;
        if (!accessToken) return;
        return openDrill(playlist.title, async () => {
          const items = await listPlaylistItems(accessToken, playlist.id);
          return items
            .filter((item) => item.kind === "show")
            .map((item) => ({
              kind: "show" as const,
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              duration: item.durationSec,
            }));
        });
      }

      default:
        say("Здесь пока нечего играть");
    }
  }, [
    drill,
    sectionRows,
    selected,
    activeSection,
    accessToken,
    backend,
    playRadio,
    playShow,
    playById,
    playStoreTrack,
    openDrill,
    say,
  ]);

  // ── Навигация ──

  const moveSelection = useCallback(
    (delta: number) => {
      if (focus === "sidebar") {
        setSectionIndex((previous) => Math.min(SECTIONS.length - 1, Math.max(0, previous + delta)));
        return;
      }
      if (drill) {
        setDrill((previous) =>
          previous
            ? { ...previous, selected: Math.min(previous.rows.length - 1, Math.max(0, previous.selected + delta)) }
            : previous,
        );
        return;
      }
      setSelectedFor(activeSection, Math.min(sectionRows.length - 1, Math.max(0, selected + delta)));
    },
    [focus, drill, activeSection, sectionRows.length, selected, setSelectedFor],
  );

  const openSection = useCallback((index: number) => {
    const target = SECTIONS[index];
    if (!target) return;
    setSectionIndex(index);
    setActiveSection(target.id);
    setDrill(null);
    setFocus("list");
    setTyping(target.id === "search");
  }, []);

  const gotoSection = useCallback(
    (id: SectionId) => {
      const index = SECTIONS.findIndex((candidate) => candidate.id === id);
      if (index >= 0) openSection(index);
    },
    [openSection],
  );

  // ── Командная строка ──

  /**
   * Вход, не выходя из интерфейса.
   *
   * Сессию сохраняет сам waitForTelegramLogin — здесь остаётся подхватить токен
   * в состояние и сбросить кэш разделов: под новым пользователем они другие, а
   * показывать чужое «Избранное» до перезапуска — прямая ложь.
   */
  const loginAbort = React.useRef<AbortController | null>(null);

  /** Успешный вход: подхватываем токен и сбрасываем кэш разделов. */
  const applySession = useCallback(
    (session: { access_token: string; user_id: string }) => {
      setAccessToken(session.access_token);
      setUserId(session.user_id);
      setLogin(null);
      // Разделы перечитаются под новым токеном — старые строки принадлежали
      // другому (или никакому) пользователю.
      setRows((previous) => ({ radio: previous.radio }));
      setSelected({});
      setDrill(null);
      const claims = parseJwt(session.access_token);
      say(`Вошли${claims.email && !claims.email.endsWith("@telegram.user") ? ` · ${claims.email}` : ""}`);
    },
    [say],
  );

  const submitEmailLogin = useCallback(
    async (email: string, password: string) => {
      setLogin({ kind: "email", email, password, field: "password", busy: true });
      try {
        const session = await loginWithPassword(email, password);
        applySession(session);
      } catch (error) {
        setLogin({
          kind: "failed",
          error: (error as Error).message,
          hint: "Пароля нет? На сайте это «Забыли пароль» — surprise.fm/login",
        });
      }
    },
    [applySession],
  );

  const startTelegram = useCallback(async () => {
    setLogin({ kind: "starting" });

    let pending;
    try {
      pending = await startTelegramLogin();
    } catch (error) {
      setLogin({
        kind: "failed",
        error:
          error instanceof TelegramUnavailableError
            ? "Сервер пока не пускает терминал в telegram-вход: правка на бэкенде не выкачена."
            : (error as Error).message,
        hint:
          error instanceof TelegramUnavailableError
            ? "Войдите почтой и паролем — это работает всегда. Или запустите с SURPRISE_PLATFORM_HINT=extension."
            : null,
      });
      return;
    }

    const qr = await renderQr(pending.url);
    setLogin({
      kind: "waiting",
      url: pending.url,
      qr,
      secondsLeft: Math.max(0, pending.expiresAt - Math.floor(Date.now() / 1000)),
    });

    const abort = new AbortController();
    loginAbort.current = abort;

    const result = await waitForTelegramLogin(pending, {
      signal: abort.signal,
      onTick: (secondsLeft) =>
        setLogin((previous) => (previous?.kind === "waiting" ? { ...previous, secondsLeft } : previous)),
    });
    loginAbort.current = null;

    if (result.status === "ok") return applySession(result.session);
    if (result.status === "expired") {
      setLogin({ kind: "failed", error: "Время на подтверждение вышло", hint: "Наберите /login заново" });
      return;
    }
    setLogin({ kind: "failed", error: result.error, hint: null });
  }, [applySession]);

  const startLogin = useCallback(() => {
    setCommandOpen(false);
    setLogin({ kind: "choose", index: 0 });
  }, []);

  const doLogout = useCallback(async () => {
    await logoutSession().catch(() => {});
    setAccessToken(null);
    setUserId("");
    setRows((previous) => ({ radio: previous.radio }));
    setSelected({});
    setDrill(null);
    say("Вышли из аккаунта");
  }, [say]);

  const suggestions = useMemo(() => suggestCommands(commandInput), [commandInput]);

  const runCommand = useCallback(
    async (raw: string) => {
      const parsed = parseCommand(raw);
      if (!parsed) return setCommandOpen(false);

      const command = resolveCommand(parsed.name);
      if (!command) {
        setCommandError(`Нет команды «${parsed.name}»`);
        return;
      }

      setCommandOpen(false);
      setCommandInput("");
      setCommandError(null);

      switch (command.name) {
        case "radio":
          return void playRadio();
        case "play":
          return void activate();
        case "pause":
          return void backend.setPaused(!status.paused);
        case "search":
          gotoSection("search");
          setQuery(parsed.argument);
          setTyping(parsed.argument.length === 0);
          return;
        case "goto": {
          const target = SECTION_ALIASES[parsed.argument.toLowerCase()];
          if (!target) return say(`Не знаю раздел «${parsed.argument}»`);
          return gotoSection(target);
        }
        case "volume": {
          const value = Number.parseInt(parsed.argument, 10);
          if (Number.isNaN(value)) return say("Громкость — число от 0 до 130");
          const next = Math.min(130, Math.max(0, value));
          setVolume(next);
          void backend.setVolume(next);
          return;
        }
        case "mute":
          setVolume((value) => {
            const next = value === 0 ? mutedFrom || 100 : 0;
            setMutedFrom(value === 0 ? mutedFrom : value);
            void backend.setVolume(next);
            return next;
          });
          return;
        case "back":
          setDrill(null);
          return;
        case "login":
          startLogin();
          return;
        case "logout":
          return void doLogout();
        case "whoami":
          return say(accessToken ? `Вы вошли · ${userId}` : "Вы не вошли — наберите /login");
        case "help":
          return setShowHelp(true);
        case "quit":
          return void onExit().then(() => exit());
        default:
          return;
      }
    },
    [
      playRadio,
      activate,
      backend,
      status.paused,
      gotoSection,
      mutedFrom,
      accessToken,
      userId,
      say,
      onExit,
      exit,
      startLogin,
      doLogout,
    ],
  );

  useInput((input, key) => {
    // Оверлей входа держит ввод: пока ждём подтверждения, навигация по каталогу
    // только сбивала бы с толку — на экране нет ни списка, ни панелей.
    if (login) {
      if (key.escape) {
        loginAbort.current?.abort();
        loginAbort.current = null;
        setLogin(null);
        return;
      }

      if (login.kind === "choose") {
        if (key.downArrow || input === "j") {
          return setLogin({ kind: "choose", index: Math.min(LOGIN_METHODS.length - 1, login.index + 1) });
        }
        if (key.upArrow || input === "k") {
          return setLogin({ kind: "choose", index: Math.max(0, login.index - 1) });
        }
        if (key.return) {
          const method = LOGIN_METHODS[login.index];
          if (method?.id === "telegram") return void startTelegram();
          return setLogin({ kind: "email", email: "", password: "", field: "email", busy: false });
        }
        return;
      }

      if (login.kind === "email" && !login.busy) {
        if (key.backspace || key.delete) {
          return setLogin({
            ...login,
            [login.field]: login[login.field].slice(0, -1),
          } as LoginPhase);
        }
        if (key.tab) {
          return setLogin({ ...login, field: login.field === "email" ? "password" : "email" });
        }
        if (input && !key.ctrl && !key.meta) {
          // Ввод приходит пачкой (вставка, быстрый набор), поэтому разбираем её
          // целиком: иначе вставленная почта потерялась бы вся разом.
          const { text, submitted } = splitBurst(input);
          const nextValue = login[login.field] + text;
          const next = { ...login, [login.field]: nextValue } as LoginPhase & { kind: "email" };

          if (!submitted) return setLogin(next);
          // Enter на почте переводит к паролю, на пароле — отправляет.
          if (login.field === "email") return setLogin({ ...next, field: "password" });
          if (next.email && next.password) return void submitEmailLogin(next.email, next.password);
          return setLogin(next);
        }
        if (key.return) {
          if (login.field === "email") return setLogin({ ...login, field: "password" });
          if (login.email && login.password) return void submitEmailLogin(login.email, login.password);
        }
        return;
      }

      return;
    }

    // Командная строка перехватывает ввод целиком: иначе «q» в команде вышло бы
    // из программы, а «j» уехало бы в список.
    if (commandOpen) {
      if (key.escape) {
        setCommandOpen(false);
        setCommandInput("");
        setCommandError(null);
        return;
      }
      if (key.return) return void runCommand(commandInput);
      if (key.tab) {
        const pick = suggestions[commandHighlight];
        if (pick) setCommandInput(`/${pick.name}${pick.arg ? " " : ""}`);
        return;
      }
      if (key.downArrow) return setCommandHighlight((value) => Math.min(suggestions.length - 1, value + 1));
      if (key.upArrow) return setCommandHighlight((value) => Math.max(0, value - 1));
      if (key.backspace || key.delete) {
        setCommandError(null);
        return setCommandInput((value) => value.slice(0, -1));
      }
      if (input && !key.ctrl && !key.meta) {
        const { text, submitted } = splitBurst(input);
        setCommandError(null);
        setCommandHighlight(0);
        const next = commandInput + text;
        setCommandInput(next);
        // Enter внутри той же пачки — выполняем сразу: иначе «/login⏎», пришедший
        // одной строкой, просто осел бы в поле ввода.
        if (submitted) void runCommand(next);
      }
      return;
    }

    if (typing) {
      if (key.escape || key.return) return setTyping(false);
      if (key.backspace || key.delete) return setQuery((value) => value.slice(0, -1));
      if (input && !key.ctrl && !key.meta) {
        const { text, submitted } = splitBurst(input);
        if (text) setQuery((value) => value + text);
        if (submitted) setTyping(false);
      }
      return;
    }

    if (showHelp) return setShowHelp(false);

    // Слэш открывает строку команд со списком: это и есть ответ на вопрос
    // «что тут вообще можно». Проверяем НАЧАЛО пачки, а не равенство: при
    // быстром наборе «/login» прилетает одной строкой.
    if (input.startsWith("/") || input.startsWith(":")) {
      const { text, submitted } = splitBurst(input.slice(1));
      setCommandOpen(true);
      setCommandInput(text);
      setCommandHighlight(0);
      setCommandError(null);
      if (submitted && text) void runCommand(text);
      return;
    }

    if (input === "q" || (key.ctrl && input === "c")) {
      void onExit().then(() => exit());
      return;
    }
    if (input === "?") return setShowHelp(true);

    // Выход из карточки — туда же, откуда пришли.
    if (key.escape && drill) return setDrill(null);

    if (key.tab) {
      const order: Focus[] = ["sidebar", "list", "details"];
      const index = order.indexOf(focus);
      setFocus(order[(index + (key.shift ? order.length - 1 : 1)) % order.length] ?? "list");
      return;
    }
    if (input === "h") {
      if (drill) return setDrill(null);
      return setFocus("sidebar");
    }
    if (input === "l") return setFocus("list");

    const digit = Number.parseInt(input, 10);
    if (!Number.isNaN(digit) && digit >= 1 && digit <= Math.min(9, SECTIONS.length)) {
      return openSection(digit - 1);
    }

    if (input === "j" || key.downArrow) return moveSelection(1);
    if (input === "k" || key.upArrow) return moveSelection(-1);
    if (key.pageDown) return moveSelection(10);
    if (key.pageUp) return moveSelection(-10);
    if (input === "g") {
      if (focus === "sidebar") setSectionIndex(0);
      else if (drill) setDrill((previous) => (previous ? { ...previous, selected: 0 } : previous));
      else setSelectedFor(activeSection, 0);
      return;
    }
    if (input === "G") {
      if (focus === "sidebar") setSectionIndex(SECTIONS.length - 1);
      else if (drill) setDrill((previous) => (previous ? { ...previous, selected: previous.rows.length - 1 } : previous));
      else setSelectedFor(activeSection, sectionRows.length - 1);
      return;
    }

    if (key.return) {
      if (focus === "sidebar") return openSection(sectionIndex);
      void activate();
      return;
    }

    // Плеер слушается из любой панели. Сочетания те же, что на сайте
    // (src/hooks/usePlayerKeyboard.ts): space, ←/→ на 30 секунд, m, n, p.
    if (input === " ") return void backend.setPaused(!status.paused);
    if (input === "r") return void playRadio();
    if (input === "m" && backend.canSetVolume) {
      setVolume((value) => {
        const next = value === 0 ? mutedFrom || 100 : 0;
        setMutedFrom(value === 0 ? mutedFrom : value);
        void backend.setVolume(next);
        return next;
      });
      return;
    }
    if (input === "n" || input === "p") {
      say("Очередь появится позже — пока выбирайте в списке");
      return;
    }
    if (key.rightArrow && backend.canSeek && now?.kind !== "radio") void backend.seek(30, "relative");
    if (key.leftArrow && backend.canSeek && now?.kind !== "radio") void backend.seek(-30, "relative");
    if ((input === "+" || input === "=") && backend.canSetVolume) {
      setVolume((value) => {
        const next = Math.min(130, value + 5);
        void backend.setVolume(next);
        return next;
      });
    }
    if (input === "-" && backend.canSetVolume) {
      setVolume((value) => {
        const next = Math.max(0, value - 5);
        void backend.setVolume(next);
        return next;
      });
    }
  });

  // ── Отрисовка ──

  const playingIndex = useMemo(() => {
    if (drill) {
      return drill.rows.findIndex((row) => row.kind === "show" && row.id === now?.showId);
    }
    if (activeSection === "radio" && radioNow) {
      return (sectionRows as RadioItem[]).findIndex((item) => item.played_at === radioNow.played_at);
    }
    if (!now?.showId) return -1;
    if (activeSection === "shows" || activeSection === "search") {
      return (sectionRows as Show[]).findIndex((show) => show.id === now.showId);
    }
    if (activeSection === "likes") return (sectionRows as LikedShow[]).findIndex((show) => show.id === now.showId);
    return -1;
  }, [drill, activeSection, sectionRows, radioNow, now?.showId]);

  const details: Details | null = useMemo(() => {
    if (!rows[selected]) return null;

    if (detailShow) {
      const artistLine = detailShow.artists.map((artist) => artist.name).join(", ");
      return {
        title: detailShow.title ?? "Без названия",
        subtitle: dropIfSame(artistLine, detailShow.title),
        facts: [
          ["длительность", formatDuration(detailShow.duration)],
          ["опубликован", detailShow.published_at?.slice(0, 10) ?? "—"],
        ],
        description: detailShow.description,
        tracklist,
        // Подсветка трека — только у ИГРАЮЩЕГО выпуска: у чужого позиция плеера
        // к его треклисту отношения не имеет.
        playingTrack: now?.showId === detailShow.id ? currentTrackIndex(tracklist, status.positionSec) : -1,
      };
    }
    return describeRow(activeSection, drill, rows[selected]);
  }, [rows, selected, detailShow, tracklist, now?.showId, status.positionSec, activeSection, drill]);

  const info = useMemo(() => {
    if (now?.kind === "radio") {
      return {
        title: formatRadioItem(radioNow) || "SURPRISE.FM",
        subtitle: radioNow?.show?.description?.replace(/\s+/g, " ").trim() ?? null,
        // Позиция эфира — «сколько идёт текущий выпуск»: её знает расписание,
        // а не плеер, у бесконечного потока своей позиции нет.
        position: elapsedSec(radioNow),
        total: radioNow?.duration ?? null,
        live: true,
        badge: null as string | null,
      };
    }
    if (now) {
      // У превью своя шкала: показываем прогресс внутри окна, иначе полоса
      // стоит почти на нуле и ничего не сообщает.
      const start = now.previewEndSec !== null && now.totalSec ? now.previewEndSec - now.totalSec : 0;
      const position = status.positionSec === null ? null : Math.max(0, status.positionSec - start);
      return {
        title: now.title,
        subtitle: now.subtitle,
        position: now.previewEndSec === null ? status.positionSec : position,
        total: status.durationSec ?? now.totalSec,
        live: false,
        badge: now.badge,
      };
    }
    return { title: "Ничего не играет", subtitle: null, position: null, total: null, live: false, badge: null };
  }, [now, radioNow, status]);

  if (login) return <LoginOverlay phase={login} width={width} />;
  if (showHelp) return <HelpOverlay width={width} />;

  const contentWidth = Math.max(40, width - SIDEBAR_WIDTH);
  const bodyHeight = Math.max(8, height - (commandOpen ? 18 : 6));
  const listHeight = Math.max(3, Math.floor(bodyHeight * 0.55) - 3);

  const listTitle = drill
    ? `${drill.title} — Esc назад`
    : activeSection === "search"
      ? `Поиск: ${query || "…"}${typing ? "▌" : ""}`
      : loading === activeSection
        ? `${section.listTitle} — загружаем…`
        : activeSection === "radio"
          ? `${section.listTitle} · только для справки`
          : section.listTitle;

  return (
    <Box flexDirection="column" width={width}>
      <Box>
        <Sidebar
          sections={SECTIONS.map((candidate, index) => ({
            id: candidate.id,
            label: index < 9 ? `${index + 1} ${candidate.label}` : `  ${candidate.label}`,
            needsAuth: candidate.needsAuth,
            group: candidate.group,
          }))}
          activeId={activeSection}
          selectedIndex={sectionIndex}
          focused={focus === "sidebar"}
          hasAuth={!!accessToken}
          width={SIDEBAR_WIDTH}
          height={bodyHeight - 2}
        />

        <Box flexDirection="column" width={contentWidth}>
          <ListPanel<unknown>
            title={listTitle}
            rows={rows}
            columns={(drill ? DRILL_COLUMNS : section.columns) as never}
            selected={selected}
            playing={playingIndex}
            height={listHeight}
            width={contentWidth}
            focused={focus === "list"}
            emptyHint={section.needsAuth && !accessToken ? "Нужен вход — наберите /login" : section.emptyHint}
          />

          <DetailsPanel
            details={details}
            focused={focus === "details"}
            width={contentWidth}
            height={Math.max(6, bodyHeight - listHeight - 2)}
          />
        </Box>
      </Box>

      {commandOpen ? (
        <CommandLine
          input={commandInput}
          suggestions={suggestions}
          highlighted={commandHighlight}
          width={width}
          error={commandError}
        />
      ) : null}

      <PlayerBar
        title={info.title}
        subtitle={info.subtitle}
        position={info.position}
        total={info.total}
        live={info.live}
        state={status}
        backend={backendName}
        volume={volume}
        badge={info.badge}
        width={width}
      />

      <Box paddingX={1}>
        <Text color={message ? theme.paused : theme.muted}>
          {message ?? "/ — команды · Tab — панели · j/k — список · Enter — играть · space — пауза · ? — помощь · q — выход"}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Разбор пачки символов из одного события ввода.
 *
 * ink отдаёт быстрый набор и ВСТАВКУ целиком: `/login` + Enter приходят одной
 * строкой «/login\r», а не семью событиями. Обработчики, сравнивавшие input с
 * одиночным символом, на такой строке не срабатывали вовсе — команда молча
 * игнорировалась, а вставленная в поиск ссылка терялась.
 */
function splitBurst(input: string): { text: string; submitted: boolean } {
  const submitted = /[\r\n]/.test(input);
  // Управляющие символы в текст не пускаем: они рисуются мусором.
  const text = input.replace(/[\r\n]/g, "").replace(/[\u0000-\u001F\u007F]/g, "");
  return { text, submitted };
}

function clampSize(value: number | undefined, fallback: number, minimum: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum ? value : fallback;
}

/** Подзаголовок, повторяющий заголовок, — шум: в этом случае его нет. */
function dropIfSame(value: string | null | undefined, title: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  return !text || sameText(text, title) ? null : text;
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

/** Строки, которые сами по себе являются выпуском (у них есть треклист). */
function asShow(sectionId: SectionId, drill: Drill | null, row: unknown): Show | null {
  if (!row || drill) return null;
  if (sectionId === "shows" || sectionId === "search") return row as Show;
  return null;
}

/** Подробности для всего, у чего нет треклиста — из того, что уже в списке. */
function describeRow(sectionId: SectionId, drill: Drill | null, row: unknown): Details | null {
  const empty = { tracklist: [] as TracklistItem[], playingTrack: -1 };

  if (drill) {
    const item = row as DrillRow;
    return {
      title: item.title,
      subtitle: dropIfSame(item.subtitle, item.title),
      facts: [
        ["длительность", formatDuration(item.duration)],
        ["что это", item.kind === "track" ? "трек релиза" : "выпуск"],
      ],
      description: null,
      ...empty,
    };
  }

  switch (sectionId) {
    case "artists": {
      const artist = row as Artist;
      return {
        title: artist.name,
        subtitle: artist.is_resident ? "резидент" : null,
        facts: [],
        description: artist.bio,
        ...empty,
      };
    }
    case "hosts": {
      const host = row as Host;
      return {
        title: host.name,
        subtitle: host.is_verified ? "подтверждённый автор" : null,
        facts: [["слаг", host.slug]],
        description: host.bio,
        ...empty,
      };
    }
    case "releases": {
      const release = row as Release;
      return {
        title: release.title,
        subtitle: dropIfSame(release.artists.join(", "), release.title),
        facts: [
          ["дата", release.release_date ?? "—"],
          ["тип", release.type ?? "—"],
        ],
        description: null,
        ...empty,
      };
    }
    case "likes": {
      const show = row as LikedShow;
      return {
        title: show.title ?? "Без названия",
        subtitle: dropIfSame(show.artists.join(", "), show.title),
        facts: [["длительность", formatDuration(show.duration)]],
        description: null,
        ...empty,
      };
    }
    case "finds": {
      const find = row as Find;
      return {
        title: [find.artist, find.title].filter(Boolean).join(" — ") || "Находка",
        subtitle: find.show?.title ?? null,
        facts: [["метка", formatDuration(find.timestampSec)]],
        description: null,
        ...empty,
      };
    }
    case "playlists": {
      const playlist = row as PlaylistSummary;
      return {
        title: playlist.title,
        subtitle: playlist.is_public === false ? "приватный" : null,
        facts: [["треков", String(playlist.itemCount)]],
        description: playlist.description,
        ...empty,
      };
    }
    case "radio": {
      const item = row as RadioItem;
      return {
        title: formatRadioItem(item),
        subtitle: dropIfSame(item.show?.artists?.join(", "), formatRadioItem(item)),
        facts: [["длительность", formatDuration(item.duration)]],
        description: item.show?.description ?? null,
        ...empty,
      };
    }
    default:
      return null;
  }
}
