/**
 * Полноэкранный интерфейс: панель воспроизведения сверху, список снизу,
 * вкладки по разделам.
 *
 * Выбранная строка и играющая — разные состояния, и оба видны одновременно:
 * человек ходит по списку, пока играет что-то другое. Это главное, чего не
 * может построчный режим.
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
import {
  currentTrackIndex,
  fetchShowStream,
  fetchTracklist,
  listShows,
  searchShows,
  type Show,
  type TracklistItem,
} from "../api/shows.ts";
import { listLikedShows, listPlaylists, type LikedShow, type PlaylistSummary } from "../api/library.ts";
import { HEARTBEAT_INTERVAL_MS } from "../config.ts";
import { formatDuration } from "../lib/format.ts";
import { getSessionId } from "../lib/ids.ts";
import type { AudioBackend } from "../player/backend.ts";
import { ListPanel } from "./ListPanel.tsx";
import { PlaybackPanel, type PlaybackInfo } from "./PlaybackPanel.tsx";
import { theme } from "./theme.ts";
import { usePlayer } from "./usePlayer.ts";

type Tab = "radio" | "shows" | "library" | "search";

const TABS: Array<{ id: Tab; label: string; needsAuth?: boolean }> = [
  { id: "radio", label: "Эфир" },
  { id: "shows", label: "Выпуски" },
  { id: "library", label: "Библиотека", needsAuth: true },
  { id: "search", label: "Поиск" },
];

/** Что сейчас в плеере — нужно и для панели, и чтобы подсветить строку списка. */
interface NowPlaying {
  kind: "radio" | "show";
  title: string;
  subtitle: string | null;
  /** id выпуска — по нему находим играющую строку в списке. */
  showId: string | null;
  totalSec: number | null;
}

export interface AppProps {
  backend: AudioBackend;
  backendName: string;
  accessToken: string | null;
  /** Куда уходить при выходе — чтобы снять присутствие в эфире. */
  onExit: () => Promise<void>;
}

export function App({ backend, backendName, accessToken, onExit }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const status = usePlayer(backend);

  // Ноль — реальное значение columns там, где размер терминала неизвестен:
  // псевдотерминал без управляющего tty, запуск под supervisor, некоторые
  // эмуляторы при старте. Без защиты интерфейс схлопывался в колонку шириной в
  // один символ — рамки есть, содержимого не прочесть.
  const width = clampSize(stdout?.columns, 80, 40);
  const height = clampSize(stdout?.rows, 24, 10);

  const [tab, setTab] = useState<Tab>("radio");
  const [message, setMessage] = useState<string | null>(null);
  const [volume, setVolume] = useState(100);
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Эфир
  const [radioNow, setRadioNow] = useState<RadioItem | null>(null);
  const [radioList, setRadioList] = useState<RadioItem[]>([]);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Выпуски + треклист играющего
  const [shows, setShows] = useState<Show[]>([]);
  const [tracklist, setTracklist] = useState<TracklistItem[]>([]);
  const [showTracklist, setShowTracklist] = useState(false);

  // Библиотека и поиск
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [likes, setLikes] = useState<LikedShow[]>([]);
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [results, setResults] = useState<Show[]>([]);

  const [selected, setSelected] = useState<Record<Tab, number>>({
    radio: 0,
    shows: 0,
    library: 0,
    search: 0,
  });

  const say = useCallback((text: string | null) => setMessage(text), []);

  // ── Загрузка данных ──

  useEffect(() => {
    void (async () => {
      const settings = await fetchStationSettings();
      const url = await resolveLiveStream(settings);
      setStreamUrl(url);
      try {
        await backend.load(url);
        setNow({ kind: "radio", title: "SURPRISE.FM", subtitle: null, showId: null, totalSec: null });
      } catch (error) {
        setMessage(`Эфир не запустился: ${(error as Error).message}`);
      }
    })();
    // Один раз при запуске: backend за время жизни интерфейса не меняется, а
    // добавление его в зависимости перезапускало бы эфир на каждой перерисовке.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const schedule = await fetchRadioSchedule().catch(() => null);
      if (!schedule) return;
      setRadioNow(schedule.now);
      // Порядок как в эфире: сначала что дальше, потом что играло.
      setRadioList([
        ...(schedule.next ? [schedule.next] : []),
        ...(schedule.now ? [schedule.now] : []),
        ...schedule.history,
      ]);
    };
    void refresh();
    const timer = setInterval(() => void refresh(), SCHEDULE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void listShows({ limit: 60, accessToken }).then(setShows).catch(() => setShows([]));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      const [ownPlaylists, likedShows] = await Promise.all([
        listPlaylists(accessToken, tokenUserId(accessToken)).catch(() => []),
        listLikedShows(accessToken, tokenUserId(accessToken)).catch(() => []),
      ]);
      setPlaylists(ownPlaylists);
      setLikes(likedShows);
    })();
  }, [accessToken]);

  // Присутствие в эфире — только пока играет именно эфир.
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
      if (channelId) void leavePresence(sessionId, accessToken);
    };
  }, [now?.kind, accessToken]);

  // Поиск с задержкой: запрос на каждую букву — это шесть запросов на слово.
  useEffect(() => {
    if (tab !== "search" || query.trim().length < 2) return;
    const timer = setTimeout(() => {
      void searchShows(query.trim(), 40, accessToken).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tab, accessToken]);

  // ── Воспроизведение ──

  const playRadio = useCallback(async () => {
    if (!streamUrl) return;
    say("Подключаемся к эфиру…");
    try {
      await backend.load(streamUrl);
      setNow({ kind: "radio", title: "SURPRISE.FM", subtitle: null, showId: null, totalSec: null });
      setShowTracklist(false);
      say(null);
    } catch (error) {
      say(`Не вышло: ${(error as Error).message}`);
    }
  }, [backend, streamUrl, say]);

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
      });
      say(null);
      const items = await fetchTracklist(show, accessToken).catch(() => []);
      setTracklist(items);
      // Треклист показываем сразу: ради него сюда и приходят.
      setShowTracklist(items.length > 0);
    },
    [backend, accessToken, say],
  );

  // ── Списки по вкладкам ──

  const currentRows = useMemo(() => {
    switch (tab) {
      case "radio":
        return radioList;
      case "shows":
        return showTracklist && tracklist.length > 0 ? tracklist : shows;
      case "library":
        return likes.length > 0 ? likes : playlists;
      case "search":
        return results;
    }
  }, [tab, radioList, shows, tracklist, showTracklist, likes, playlists, results]);

  const selectedIndex = Math.min(selected[tab], Math.max(0, currentRows.length - 1));

  const playingIndex = useMemo(() => {
    if (tab === "shows" && showTracklist) {
      return currentTrackIndex(tracklist, status.positionSec);
    }
    if (tab === "shows" && now?.showId) {
      return shows.findIndex((show) => show.id === now.showId);
    }
    if (tab === "radio" && radioNow) {
      return radioList.findIndex((item) => item === radioNow);
    }
    return -1;
  }, [tab, showTracklist, tracklist, status.positionSec, now?.showId, shows, radioNow, radioList]);

  const move = useCallback(
    (delta: number) => {
      setSelected((previous) => {
        const count = currentRows.length;
        if (count === 0) return previous;
        const next = Math.min(count - 1, Math.max(0, (previous[tab] ?? 0) + delta));
        return { ...previous, [tab]: next };
      });
    },
    [currentRows.length, tab],
  );

  const activate = useCallback(async () => {
    const row = currentRows[selectedIndex];
    if (!row) return;

    if (tab === "radio") {
      const item = row as RadioItem;
      // У элемента эфира есть привязка к выпуску — открываем архивную запись,
      // а не пытаемся «перемотать» живой поток, чего он не умеет.
      const slug = item.show?.slug;
      if (!slug) {
        await playRadio();
        return;
      }
      const found = await searchShows(item.show?.title ?? "", 5, accessToken).catch(() => []);
      const match = found.find((candidate) => candidate.slug === slug) ?? found[0];
      if (match) await playShow(match);
      else await playRadio();
      return;
    }

    if (tab === "shows") {
      if (showTracklist) {
        const item = row as TracklistItem;
        if (item.timestamp_sec !== null && backend.canSeek) {
          await backend.seek(item.timestamp_sec, "absolute");
        }
        return;
      }
      await playShow(row as Show);
      return;
    }

    if (tab === "library" && likes.length > 0) {
      const liked = row as LikedShow;
      const match = shows.find((show) => show.id === liked.id);
      await playShow(
        match ?? {
          id: liked.id,
          public_id: liked.public_id,
          slug: liked.slug,
          title: liked.title,
          description: null,
          cover_url: null,
          duration: liked.duration,
          status: "published",
          published_at: null,
          tracklist_disabled: null,
          artists: liked.artists.map((name) => ({ id: name, name, slug: null })),
        },
      );
      return;
    }

    if (tab === "search") await playShow(row as Show);
  }, [currentRows, selectedIndex, tab, showTracklist, backend, playRadio, playShow, accessToken, likes.length, shows]);

  // ── Клавиатура ──

  useInput((input, key) => {
    // В режиме ввода поиска клавиши принадлежат строке, а не навигации —
    // иначе набрать «q» в запросе было бы невозможно.
    if (typing) {
      if (key.escape || key.return) {
        setTyping(false);
        return;
      }
      if (key.backspace || key.delete) {
        setQuery((value) => value.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) setQuery((value) => value + input);
      return;
    }

    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (input === "q" || (key.ctrl && input === "c")) {
      void onExit().then(() => exit());
      return;
    }
    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (input === "1") setTab("radio");
    if (input === "2") setTab("shows");
    if (input === "3") setTab("library");
    if (input === "4") {
      setTab("search");
      setTyping(true);
    }
    if (key.tab) {
      const index = TABS.findIndex((candidate) => candidate.id === tab);
      const next = TABS[(index + 1) % TABS.length];
      if (next) setTab(next.id);
    }

    if (input === "j" || key.downArrow) move(1);
    if (input === "k" || key.upArrow) move(-1);
    if (input === "g") setSelected((previous) => ({ ...previous, [tab]: 0 }));
    if (input === "G") setSelected((previous) => ({ ...previous, [tab]: currentRows.length - 1 }));
    if (key.pageDown) move(10);
    if (key.pageUp) move(-10);

    if (key.return) void activate();
    if (input === "/") {
      setTab("search");
      setTyping(true);
    }

    if (input === " ") void backend.setPaused(!status.paused);
    if (input === "t" && tracklist.length > 0) setShowTracklist((value) => !value);
    if (input === "r") void playRadio();

    if (key.rightArrow && backend.canSeek && now?.kind === "show") void backend.seek(30, "relative");
    if (key.leftArrow && backend.canSeek && now?.kind === "show") void backend.seek(-30, "relative");

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

  const info: PlaybackInfo = useMemo(() => {
    if (now?.kind === "radio") {
      return {
        title: formatRadioItem(radioNow) || "SURPRISE.FM",
        subtitle: radioNow?.show?.artists?.join(", ") ?? null,
        note: radioNow?.show?.description?.replace(/\s+/g, " ").trim() ?? null,
        // У эфира позиция — это «сколько идёт текущий выпуск», её знает
        // расписание, а не плеер: у бесконечного потока своей позиции нет.
        position: elapsedSec(radioNow),
        total: radioNow?.duration ?? null,
        backend: backendName,
        volume,
        badge: null,
        live: true,
      };
    }
    if (now?.kind === "show") {
      return {
        title: now.title,
        subtitle: now.subtitle,
        note: null,
        position: status.positionSec,
        total: status.durationSec ?? now.totalSec,
        backend: backendName,
        volume,
        badge: null,
        live: false,
      };
    }
    return {
      title: "Ничего не играет",
      subtitle: null,
      note: "r — эфир, Enter — выбранное в списке",
      position: null,
      total: null,
      backend: backendName,
      volume,
      badge: null,
      live: false,
    };
  }, [now, radioNow, status, backendName, volume]);

  const listHeight = Math.max(3, height - 14);

  if (showHelp) return <Help width={width} />;

  return (
    <Box flexDirection="column" width={width}>
      <PlaybackPanel info={info} state={status} width={width} />

      <Box paddingX={1}>
        {TABS.map((candidate, index) => {
          const active = candidate.id === tab;
          const locked = candidate.needsAuth && !accessToken;
          return (
            <Text
              key={candidate.id}
              color={active ? theme.accent : locked ? theme.muted : undefined}
              bold={active}
              underline={active}
            >
              {index > 0 ? "   " : ""}
              {index + 1} {candidate.label}
              {locked ? " (вход)" : ""}
            </Text>
          );
        })}
      </Box>

      {renderList({
        tab,
        rows: currentRows,
        selected: selectedIndex,
        playing: playingIndex,
        height: listHeight,
        width,
        showTracklist,
        query,
        typing,
        hasAuth: !!accessToken,
        likesCount: likes.length,
      })}

      <Box paddingX={1}>
        <Text color={message ? theme.paused : theme.muted}>
          {message ?? "j/k — список · Enter — играть · space — пауза · t — треклист · / — поиск · ? — помощь · q — выход"}
        </Text>
      </Box>
    </Box>
  );
}

/** Размер терминала с защитой от нуля и мусора. */
function clampSize(value: number | undefined, fallback: number, minimum: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum ? value : fallback;
}

/** user_id из токена: он лежит в claim sub, отдельный запрос не нужен. */
function tokenUserId(accessToken: string): string {
  const segment = accessToken.split(".")[1];
  if (!segment) return "";
  try {
    const json = JSON.parse(Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return String(json.sub ?? "");
  } catch {
    return "";
  }
}

function renderList(params: {
  tab: Tab;
  rows: readonly unknown[];
  selected: number;
  playing: number;
  height: number;
  width: number;
  showTracklist: boolean;
  query: string;
  typing: boolean;
  hasAuth: boolean;
  likesCount: number;
}): React.ReactElement {
  const { tab, rows, selected, playing, height, width, showTracklist, query, typing, hasAuth } = params;

  if (tab === "radio") {
    return (
      <ListPanel<RadioItem>
        title="Эфир — что играло и что дальше"
        rows={rows as RadioItem[]}
        selected={selected}
        playing={playing}
        height={height}
        width={width}
        focused
        emptyHint="Расписание пока недоступно"
        columns={[
          { header: "", width: 6, value: (item) => (item === (rows as RadioItem[])[playing] ? "сейчас" : "") },
          { header: "Выпуск", width: 0, flex: true, value: (item) => formatRadioItem(item) },
          { header: "Длит.", width: 7, value: (item) => formatDuration(item.duration) },
        ]}
      />
    );
  }

  if (tab === "shows" && showTracklist) {
    return (
      <ListPanel<TracklistItem>
        title="Треклист — Enter прыгает на таймкод"
        rows={rows as TracklistItem[]}
        selected={selected}
        playing={playing}
        height={height}
        width={width}
        focused
        emptyHint="У выпуска нет треклиста"
        columns={[
          { header: "#", width: 3, value: (_item, index) => String(index + 1) },
          { header: "Время", width: 7, value: (item) => formatDuration(item.timestamp_sec) },
          { header: "Артист", width: 24, value: (item) => item.artist ?? "—" },
          { header: "Трек", width: 0, flex: true, value: (item) => item.title ?? "—" },
        ]}
      />
    );
  }

  if (tab === "shows") {
    return (
      <ListPanel<Show>
        title="Выпуски — t показывает треклист играющего"
        rows={rows as Show[]}
        selected={selected}
        playing={playing}
        height={height}
        width={width}
        focused
        emptyHint="Список пуст"
        columns={[
          { header: "Выпуск", width: 0, flex: true, value: (show) => show.title ?? "Без названия" },
          { header: "Артисты", width: 26, value: (show) => show.artists.map((a) => a.name).join(", ") },
          { header: "Длит.", width: 7, value: (show) => formatDuration(show.duration) },
        ]}
      />
    );
  }

  if (tab === "library") {
    if (!hasAuth) {
      return (
        <ListPanel<never>
          title="Библиотека"
          rows={[]}
          selected={0}
          playing={-1}
          height={height}
          width={width}
          focused
          emptyHint="Нужен вход: surprise login"
          columns={[]}
        />
      );
    }
    if (params.likesCount > 0) {
      return (
        <ListPanel<LikedShow>
          title="Лайки"
          rows={rows as LikedShow[]}
          selected={selected}
          playing={playing}
          height={height}
          width={width}
          focused
          emptyHint="Лайков пока нет"
          columns={[
            { header: "Выпуск", width: 0, flex: true, value: (show) => show.title ?? "Без названия" },
            { header: "Артисты", width: 26, value: (show) => show.artists.join(", ") },
            { header: "Длит.", width: 7, value: (show) => formatDuration(show.duration) },
          ]}
        />
      );
    }
    return (
      <ListPanel<PlaylistSummary>
        title="Плейлисты"
        rows={rows as PlaylistSummary[]}
        selected={selected}
        playing={-1}
        height={height}
        width={width}
        focused
        emptyHint="Плейлистов пока нет"
        columns={[
          { header: "Плейлист", width: 0, flex: true, value: (playlist) => playlist.title },
          { header: "Треков", width: 7, value: (playlist) => String(playlist.itemCount) },
        ]}
      />
    );
  }

  return (
    <ListPanel<Show>
      title={`Поиск: ${query || "…"}${typing ? " ▌" : ""}`}
      rows={rows as Show[]}
      selected={selected}
      playing={playing}
      height={height}
      width={width}
      focused
      emptyHint={query.length < 2 ? "Введите минимум две буквы" : "Ничего не нашли"}
      columns={[
        { header: "Выпуск", width: 0, flex: true, value: (show) => show.title ?? "Без названия" },
        { header: "Артисты", width: 26, value: (show) => show.artists.map((a) => a.name).join(", ") },
        { header: "Длит.", width: 7, value: (show) => formatDuration(show.duration) },
      ]}
    />
  );
}

function Help({ width }: { width: number }): React.ReactElement {
  const rows: Array<[string, string]> = [
    ["j / k, ↑ / ↓", "по списку"],
    ["g / G", "в начало / в конец"],
    ["PgUp / PgDn", "на десять строк"],
    ["Enter", "играть выбранное (в треклисте — прыгнуть на таймкод)"],
    ["space", "пауза"],
    ["← / →", "перемотка на 30 секунд (только у выпусков)"],
    ["+ / -", "громкость"],
    ["r", "вернуться в эфир"],
    ["t", "показать/скрыть треклист играющего выпуска"],
    ["1…4, Tab", "разделы"],
    ["/", "поиск"],
    ["?", "эта справка"],
    ["q", "выход"],
  ];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={2} paddingY={1} width={width}>
      <Text bold color={theme.accent}>
        Управление
      </Text>
      <Box marginTop={1} flexDirection="column">
        {rows.map(([keys, what]) => (
          <Box key={keys}>
            <Text color={theme.accent}>{keys.padEnd(16)}</Text>
            <Text>{what}</Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color={theme.muted}>Любая клавиша — закрыть</Text>
      </Box>
    </Box>
  );
}
