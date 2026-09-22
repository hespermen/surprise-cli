/**
 * surprise — запуск полноэкранного интерфейса.
 *
 * ink импортируется динамически: он тянет React и бандлится в полмегабайта, а
 * нужен только здесь. При `surprise radio --json` из скрипта это лишняя работа
 * на каждый запуск.
 */

import { getValidSession } from "../net/auth.ts";
import { NoAudioBackendError, pickBackend } from "../player/detect.ts";
import { isInteractive, red, yellow } from "../ui/term.ts";

export async function tuiCommand(): Promise<number> {
  if (!isInteractive()) {
    process.stderr.write(
      `${red("Интерфейсу нужен терминал.")} В пайпе и в скрипте пользуйтесь командами с --json:\n` +
        "  surprise radio --json\n  surprise library likes --json\n",
    );
    return 1;
  }

  let choice;
  try {
    choice = await pickBackend();
  } catch (error) {
    if (error instanceof NoAudioBackendError) {
      process.stderr.write(`${red(error.message)}\n`);
      return 1;
    }
    throw error;
  }

  const { backend, name, degraded } = choice;
  if (degraded) {
    process.stderr.write(
      `${yellow("!")} Играем через ${name}: без плавной перемотки и регулировки громкости. ` +
        "Поставьте mpv — станет лучше.\n",
    );
  }

  const session = await getValidSession();
  const [{ render }, React, { App }] = await Promise.all([
    import("ink"),
    import("react"),
    import("../tui/App.tsx"),
  ]);

  await backend.start();

  const instance = render(
    React.createElement(App, {
      backend,
      backendName: name,
      accessToken: session?.access_token ?? null,
      onExit: async () => {
        await backend.stop().catch(() => {});
      },
    }),
    // Альтернативный экран: интерфейс не затирает историю терминала, и после
    // выхода человек видит ровно то, что было до запуска.
    { exitOnCtrlC: false },
  );

  await instance.waitUntilExit();
  await backend.stop().catch(() => {});
  return 0;
}
