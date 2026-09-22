/**
 * Мост между аудио-бэкендом и React-состоянием.
 *
 * Зачем свой хук, а не подписка в компоненте: mpv присылает time-pos несколько
 * раз в секунду, и прямая установка состояния на каждое событие перерисовывала бы
 * весь экран десятки раз в секунду. В терминале это заметно — мигание и высокий
 * расход процессора на простое воспроизведение. Поэтому состояние обновляется
 * не чаще, чем нужно глазу.
 */

import { useEffect, useRef, useState } from "react";

import type { AudioBackend, PlaybackStatus } from "../player/backend.ts";

const IDLE: PlaybackStatus = { positionSec: null, durationSec: null, paused: false, idle: true };

/** Четыре раза в секунду: секунды на экране сменяются ровно, мигания нет. */
const THROTTLE_MS = 250;

export function usePlayer(backend: AudioBackend | null): PlaybackStatus {
  const [status, setStatus] = useState<PlaybackStatus>(backend?.status() ?? IDLE);
  const pending = useRef<PlaybackStatus | null>(null);

  useEffect(() => {
    if (!backend) return;

    // Состояние копится в ref, а в React уезжает по таймеру. Событий бэкенда
    // может быть много, перерисовок — ровно столько, сколько мы разрешили.
    const flush = setInterval(() => {
      if (!pending.current) return;
      setStatus(pending.current);
      pending.current = null;
    }, THROTTLE_MS);

    const onStatus = (next: PlaybackStatus) => {
      pending.current = next;
    };
    backend.on("status", onStatus);

    // Пауза и смена трека должны быть видны мгновенно — ждать такта тут нельзя,
    // иначе нажатие space выглядит как «не сработало».
    const onImmediate = () => setStatus(backend.status());
    backend.on("ended", onImmediate);
    backend.on("exit", onImmediate);

    setStatus(backend.status());

    return () => {
      clearInterval(flush);
      // AudioBackend намеренно не предоставляет off(): бэкенд живёт столько же,
      // сколько процесс, и снимать слушателей не нужно. Достаточно погасить
      // таймер, иначе после размонтирования он продолжал бы дёргать setState.
      pending.current = null;
    };
  }, [backend]);

  return status;
}

/**
 * Немедленная синхронизация состояния — для мест, где ждать такта нельзя
 * (нажали пробел, переключили трек).
 */
export function useImmediateSync(backend: AudioBackend | null): () => void {
  const [, force] = useState(0);
  return () => {
    void backend;
    force((tick) => tick + 1);
  };
}
