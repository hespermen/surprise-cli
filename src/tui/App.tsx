/**
 * Многопанельный интерфейс: разделы слева, список справа, подробности под ним,
 * плеер внизу во всю ширину.
 *
 * Три состояния намеренно разведены и видны одновременно:
 *   активный РАЗДЕЛ  — что открыто;
 *   ВЫБРАННАЯ строка — куда смотрит человек;
 *   ИГРАЮЩЕЕ         — что звучит.
 * Смешать их — значит заставить прерывать музыку ради просмотра каталога.
 * Ровно этого не умеет построчный режим.
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
import { showsByArtist, type Artist, type Host, type Release } from "../api/catalog.ts";
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
import { HEARTBEAT_INTERVAL_MS } from "../config.ts";
import { formatDuration } from "../lib/format.ts";
import { getSessionId } from "../lib/ids.ts";
import { parseEntityParam } from "../lib/publicId.ts";
import type { AudioBackend } from "../player/backend.ts";
import { DetailsPanel, type Details } from "./DetailsPanel.tsx";
import { HelpOverlay } from "./HelpOverlay.tsx";
import { ListPanel } from "./ListPanel.tsx";
import { PlayerBar } from "./PlayerBar.tsx";
import { SECTIONS, sectionById, type SavedRow, type SectionId } from "./sections.ts";
import { Sidebar } from "./Sidebar.tsx";
import { theme } from "./theme.ts";
import { usePlayer } from "./usePlayer.ts";

type Focus = "sidebar" | "list" | "details";

interface NowPlaying {
  kind: "radio" | "show";
  title: string;
  subtitle: string | null;
  showId: string | null;
  totalSec: number | null;
}

export interface AppProps {
  backend: AudioBackend;
  backendName: string;
  accessToken: string | null;
  userId: string;
  onExit: () => Promise<void>;
}

// Ширина под самое длинное название раздела с номером: «6 Моя коллекция».
// На 20 колонках половина пунктов обрезалась в многоточие.
const SIDEBAR_WIDTH = 24;

export function App({ backend, backendName, accessToken, userId, onExit }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const status = usePlayer(backend);

  // Ноль — реальное значение columns там, где размер терминала неизвестен
  // (псевдотерминал без управляющего tty, запуск под supervisor). Без защиты
  // интерфейс схлопывался в колонку шириной в один символ.
  const width = clampSize(stdout?.columns, 100, 40);
  const height = clampSize(stdout?.rows, 30, 12);

  const [focus, setFocus] = useState<Focus>("list");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("radio");

  const [rowsBySection, setRows] = useState<Partial<Record<SectionId, unknown[]>>>({});
  const [selectedBySection, setSelected] = useState<Partial<Record<SectionId, number>>>({});
  const [loading, setLoading] = useState<SectionId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [now, setNow] = useState<NowPlaying | null>(null);
  const [volume, setVolume] = useState(100);
  /** Громкость до выключения звука — чтобы вернуть ту же, а не 100. */
  const [mutedFrom, setMutedFrom] = useState(100);
  const [showHelp, setShowHelp] = useState(false);

  const [radioNow, setRadioNow] = useState<RadioItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const [tracklist, setTracklist] = useState<TracklistItem[]>([]);
  const [detailShow, setDetailShow] = useState<Show | null>(null);

  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);

  const section = sectionById(activeSection);
  const rows = rowsBySection[activeSection] ?? [];
  const selected = Math.min(selectedBySection[activeSection] ?? 0, Math.max(0, rows.length - 1));

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

  useEffect(() => {
    void (async () => {
      const settings = await fetchStationSettings();
      const url = await resolveLiveStream(settings);
      setStreamUrl(url);
      try {
        await backend.load(url);
        setNow({ kind: "radio", title: "SURPRISE.FM", subtitle: null, showId: null, totalSec: null });
      } catch (error) {
        say(`Эфир не запустился: ${(error as Error).message}`);
      }
    })();
    // Один раз при запуске: backend за жизнь интерфейса не меняется, а его
    // добавление в зависимости перезапускало бы эфир на каждой перерисовке.
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
          ...(schedule.next ? [{ ...schedule.next, title: `дальше · ${formatRadioItem(schedule.next)}` }] : []),
          ...(schedule.now ? [{ ...schedule.now, title: formatRadioItem(schedule.now) }] : []),
          ...schedule.history.map((item) => ({ ...item, title: formatRadioItem(item) })),
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
    // Задержка: запрос на каждую букву — это несколько обращений на слово.
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
    // Треклист и описание есть только у выпуска; остальные сущности описываются
    // тем, что уже пришло вместе со списком.
    const show = asShow(activeSection, selectedRow);
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
  }, [activeSection, selectedRow, accessToken]);

  // ── Воспроизведение ──

  const playRadio = useCallback(async () => {
    if (!streamUrl) return;
    try {
      await backend.load(streamUrl);
      setNow({ kind: "radio", title: "SURPRISE.FM", subtitle: null, showId: null, totalSec: null });
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

  /** Enter: у каждого раздела своё осмысленное действие. */
  const activate = useCallback(async () => {
    const row = rows[selected];
    if (!row) return;

    switch (activeSection) {
      case "radio": {
        const item = row as RadioItem;
        const slug = item.show?.slug;
        // У элемента эфира есть привязка к архивной записи — открываем её.
        // «Перемотать» живой поток нельзя, он этого не умеет.
        if (!slug) return playRadio();
        const show = await findShow(parseEntityParam(slug), accessToken).catch(() => null);
        return show ? playShow(show) : playRadio();
      }
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
        const found = await showsByArtist(artist.id, accessToken).catch(() => []);
        const first = found[0];
        if (!first) return say(`У «${artist.name}» нет выпусков`);
        return playById(first.id);
      }
      case "playlists": {
        const playlist = row as PlaylistSummary;
        if (!accessToken) return;
        const items = await listPlaylistItems(accessToken, playlist.id).catch(() => []);
        const firstShow = items.find((item) => item.kind === "show");
        if (!firstShow) return say("В плейлисте нет выпусков");
        return playById(firstShow.id);
      }
      default:
        say("Здесь пока нечего играть");
    }
  }, [rows, selected, activeSection, accessToken, backend, playRadio, playShow, playById, say]);

  // ── Клавиатура ──

  const moveSelection = useCallback(
    (delta: number) => {
      if (focus === "sidebar") {
        setSectionIndex((previous) => Math.min(SECTIONS.length - 1, Math.max(0, previous + delta)));
        return;
      }
      setSelectedFor(activeSection, Math.min(rows.length - 1, Math.max(0, selected + delta)));
    },
    [focus, activeSection, rows.length, selected, setSelectedFor],
  );

  const openSection = useCallback((index: number) => {
    const target = SECTIONS[index];
    if (!target) return;
    setSectionIndex(index);
    setActiveSection(target.id);
    setFocus("list");
    setTyping(target.id === "search");
  }, []);

  useInput((input, key) => {
    if (typing) {
      // В режиме ввода клавиши принадлежат строке: иначе «q» в запросе набрать
      // было бы нельзя.
      if (key.escape || key.return) return setTyping(false);
      if (key.backspace || key.delete) return setQuery((value) => value.slice(0, -1));
      if (input && !key.ctrl && !key.meta) setQuery((value) => value + input);
      return;
    }

    if (showHelp) return setShowHelp(false);

    if (input === "q" || (key.ctrl && input === "c")) {
      void onExit().then(() => exit());
      return;
    }
    if (input === "?") return setShowHelp(true);

    if (key.tab) {
      const order: Focus[] = ["sidebar", "list", "details"];
      const index = order.indexOf(focus);
      setFocus(order[(index + (key.shift ? order.length - 1 : 1)) % order.length] ?? "list");
      return;
    }
    if (input === "h") return setFocus("sidebar");
    if (input === "l") return setFocus("list");

    // Прямой переход цифрой — самый быстрый путь, когда знаешь, куда идёшь.
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
      else setSelectedFor(activeSection, 0);
      return;
    }
    if (input === "G") {
      if (focus === "sidebar") setSectionIndex(SECTIONS.length - 1);
      else setSelectedFor(activeSection, rows.length - 1);
      return;
    }

    if (key.return) {
      if (focus === "sidebar") return openSection(sectionIndex);
      void activate();
      return;
    }

    // Плеер слушается из любой панели: музыка важнее навигации. Сочетания
    // намеренно те же, что на сайте (src/hooks/usePlayerKeyboard.ts) — space,
    // ←/→ на 30 секунд, m, n, p.
    if (input === " ") return void backend.setPaused(!status.paused);
    if (input === "r") return void playRadio();
    if (input === "m" && backend.canSetVolume) {
      // Прежнюю громкость помним, иначе включение звука ставило бы её в 100
      // и било бы по ушам того, кто слушал тихо.
      setVolume((value) => {
        const next = value === 0 ? mutedFrom || 100 : 0;
        setMutedFrom(value === 0 ? 0 : value);
        void backend.setVolume(next);
        return next;
      });
      return;
    }
    if (input === "n" || input === "p") {
      // Очереди пока нет: честно говорим об этом вместо молчаливого бездействия.
      say("Очередь появится позже — пока выбирайте в списке");
      return;
    }
    if (input === "/") {
      const index = SECTIONS.findIndex((candidate) => candidate.id === "search");
      return openSection(index);
    }
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

  // ── Раскладка ──

  const playingIndex = useMemo(() => {
    if (activeSection === "radio" && radioNow) {
      return (rows as RadioItem[]).findIndex((item) => item.played_at === radioNow.played_at);
    }
    if (!now?.showId) return -1;
    if (activeSection === "shows" || activeSection === "search") {
      return (rows as Show[]).findIndex((show) => show.id === now.showId);
    }
    if (activeSection === "likes") return (rows as LikedShow[]).findIndex((show) => show.id === now.showId);
    return -1;
  }, [activeSection, rows, radioNow, now?.showId]);

  const details: Details | null = useMemo(() => {
    const row = rows[selected];
    if (!row) return null;

    if (detailShow) {
      const isPlaying = now?.showId === detailShow.id;
      const artistLine = detailShow.artists.map((artist) => artist.name).join(", ");
      return {
        title: detailShow.title ?? "Без названия",
        subtitle: sameText(artistLine, detailShow.title) ? null : artistLine || null,
        facts: [
          ["длительность", formatDuration(detailShow.duration)],
          ["опубликован", detailShow.published_at?.slice(0, 10) ?? "—"],
        ],
        description: detailShow.description,
        tracklist,
        // Подсветка трека — только у ИГРАЮЩЕГО выпуска: у чужого позиция плеера
        // к его треклисту отношения не имеет.
        playingTrack: isPlaying ? currentTrackIndex(tracklist, status.positionSec) : -1,
      };
    }
    return describeRow(activeSection, row);
  }, [rows, selected, detailShow, tracklist, now?.showId, status.positionSec, activeSection]);

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
      };
    }
    if (now?.kind === "show") {
      return {
        title: now.title,
        subtitle: now.subtitle,
        position: status.positionSec,
        total: status.durationSec ?? now.totalSec,
        live: false,
      };
    }
    return { title: "Ничего не играет", subtitle: null, position: null, total: null, live: false };
  }, [now, radioNow, status]);

  if (showHelp) return <HelpOverlay width={width} />;

  const contentWidth = Math.max(40, width - SIDEBAR_WIDTH);
  const bodyHeight = Math.max(8, height - 6);
  const listHeight = Math.max(3, Math.floor(bodyHeight * 0.55) - 3);

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
            title={
              activeSection === "search"
                ? `Поиск: ${query || "…"}${typing ? "▌" : ""}`
                : loading === activeSection
                  ? `${section.listTitle} — загружаем…`
                  : section.listTitle
            }
            rows={rows}
            columns={section.columns as never}
            selected={selected}
            playing={playingIndex}
            height={listHeight}
            width={contentWidth}
            focused={focus === "list"}
            emptyHint={section.needsAuth && !accessToken ? "Нужен вход: surprise login" : section.emptyHint}
          />

          <DetailsPanel
            details={details}
            focused={focus === "details"}
            width={contentWidth}
            height={Math.max(6, bodyHeight - listHeight - 2)}
          />
        </Box>
      </Box>

      <PlayerBar
        title={info.title}
        subtitle={info.subtitle}
        position={info.position}
        total={info.total}
        live={info.live}
        state={status}
        backend={backendName}
        volume={volume}
        badge={null}
        width={width}
      />

      <Box paddingX={1}>
        <Text color={message ? theme.paused : theme.muted}>
          {message ??
            "Tab/h/l — панели · j/k — список · Enter — играть · space — пауза · / — поиск · ? — помощь · q — выход"}
        </Text>
      </Box>
    </Box>
  );
}

/** Подзаголовок, повторяющий заголовок, — шум: в этом случае его нет. */
function dropIfSame(value: string | null | undefined, title: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  return !text || sameText(text, title) ? null : text;
}

/** Одинаковы ли строки с точностью до регистра и пробелов. */
function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

function clampSize(value: number | undefined, fallback: number, minimum: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum ? value : fallback;
}

/** Строки, которые сами по себе являются выпуском. */
function asShow(sectionId: SectionId, row: unknown): Show | null {
  if (!row) return null;
  if (sectionId === "shows" || sectionId === "search") return row as Show;
  return null;
}

/** Подробности для сущностей без треклиста — из того, что уже есть в списке. */
function describeRow(sectionId: SectionId, row: unknown): Details | null {
  const empty = { tracklist: [] as TracklistItem[], playingTrack: -1 };

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
