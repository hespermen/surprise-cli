#!/usr/bin/env node
/**
 * Поддельный mpv для тестов: говорит на том же JSON-IPC, но звука не издаёт.
 *
 * Нужен, чтобы обёртка проверялась там, где mpv не установлен — то есть в CI и
 * в контейнере без звуковой карты. Проверяем ровно протокольную часть: сборку
 * строк из чанков, сопоставление ответов по request_id, перевод property-change
 * в состояние и разницу между «доиграл сам» и «мы остановили».
 *
 * Отвечает на управляющие флаги через переменные окружения:
 *   FAKE_MPV_SPLIT=1  — резать ответы на половинки, чтобы проверить сборку буфера
 *   FAKE_MPV_EOF=1    — после loadfile прислать end-file reason=eof
 *   FAKE_MPV_STUCK=1  — изображать mpv без звукового устройства: файл открыт,
 *                       time-pos пришёл ровно один раз со значением 0 и больше
 *                       не двигается
 */

import { createServer } from "node:net";

const socketArg = process.argv.find((arg) => arg.startsWith("--input-ipc-server="));
if (!socketArg) {
  process.stderr.write("нет --input-ipc-server\n");
  process.exit(2);
}
const socketPath = socketArg.slice("--input-ipc-server=".length);

const splitWrites = process.env.FAKE_MPV_SPLIT === "1";
const emitEof = process.env.FAKE_MPV_EOF === "1";
const stuck = process.env.FAKE_MPV_STUCK === "1";

const server = createServer((socket) => {
  /**
   * Очередь отправки.
   *
   * Резать сообщения можно только по очереди. Наивная версия («написал половину,
   * через 5 мс допишу вторую») на трёх подряд идущих send давала в сокете
   * `1a 2a 3a 1b 2b 3b` — перемешанные половинки, которых настоящий mpv не
   * порождает никогда. Тест падал, хотя обёртка была права.
   */
  let queue = Promise.resolve();

  const send = (payload) => {
    const line = `${JSON.stringify(payload)}\n`;
    queue = queue.then(() => {
      if (!splitWrites) {
        socket.write(line);
        return undefined;
      }
      const cut = Math.floor(line.length / 2);
      socket.write(line.slice(0, cut));
      return new Promise((resolve) =>
        setTimeout(() => {
          socket.write(line.slice(cut));
          resolve();
        }, 5),
      );
    });
  };

  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index = buffer.indexOf("\n");

    while (index !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      index = buffer.indexOf("\n");
      if (!line) continue;

      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }

      const [name, ...args] = message.command ?? [];
      const requestId = message.request_id;

      switch (name) {
        case "observe_property":
          send({ error: "success", data: null, request_id: requestId });
          break;

        case "loadfile":
          send({ error: "success", data: null, request_id: requestId });
          // Порядок как у настоящего mpv: сначала длительность, потом позиция.
          setTimeout(() => {
            if (stuck) {
              // Ровно то, что делает настоящий mpv без звукового выхода: файл
              // открыт, ноль прислан один раз, часы стоят навсегда.
              send({ event: "property-change", name: "time-pos", data: 0 });
              send({ event: "property-change", name: "core-idle", data: true });
              return;
            }
            send({ event: "property-change", name: "duration", data: 212.5 });
            send({ event: "property-change", name: "time-pos", data: 0 });
            send({ event: "property-change", name: "time-pos", data: 0.4 });
            send({ event: "property-change", name: "core-idle", data: false });
            if (emitEof) setTimeout(() => send({ event: "end-file", reason: "eof" }), 20);
          }, 10);
          break;

        case "set_property": {
          const [property, value] = args;
          send({ error: "success", data: null, request_id: requestId });
          if (property === "pause") send({ event: "property-change", name: "pause", data: value });
          break;
        }

        case "seek":
          send({ error: "success", data: null, request_id: requestId });
          send({ event: "property-change", name: "time-pos", data: args[0] });
          break;

        case "quit":
          send({ error: "success", data: null, request_id: requestId });
          setTimeout(() => process.exit(0), 5);
          break;

        default:
          send({ error: "unknown command", request_id: requestId });
      }
    }
  });
});

server.listen(socketPath);

// Страховка: тест мог упасть, не позвав quit — не оставляем висящий процесс.
setTimeout(() => process.exit(0), 30_000).unref();
