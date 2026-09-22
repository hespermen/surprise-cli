/**
 * Сборка одного исполняемого файла.
 *
 * Бандлим всё, кроме тяжёлых рантайм-зависимостей: `npx @surprise/cli` не должен
 * на каждый запуск разрешать сотню модулей, но и React внутрь бандла тащить
 * нельзя — он ломается на собственных проверках окружения.
 */
import { build } from "esbuild";
import { chmod } from "node:fs/promises";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/cli.js",
  // Шебанг + шим require.
  //
  // qrcode — пакет CommonJS, и его серверная точка входа тянет require("fs").
  // В ESM-бандле esbuild подставляет заглушку, которая на таком require честно
  // падает («Dynamic require of "fs" is not supported») — причём не при сборке,
  // а при первом запуске. Возвращаем настоящий require через createRequire:
  // заглушка esbuild уважает уже определённый в области видимости require.
  banner: {
    js: [
      "#!/usr/bin/env node",
      'import { createRequire as __cliCreateRequire } from "node:module";',
      "const require = __cliCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  external: ["ink", "react", "react-devtools-core", "yoga-wasm-web"],
  logLevel: "info",
});

await chmod("dist/cli.js", 0o755);
