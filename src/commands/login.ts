/**
 * surprise login [--email] [--no-open]
 */

import {
  TelegramUnavailableError,
  getValidSession,
  loginWithPassword,
  startTelegramLogin,
  waitForTelegramLogin,
} from "../net/auth.ts";
import { fetchProfile, isSupporter, profileLabel } from "../api/profile.ts";
import { bold, cyan, dim, green, isInteractive, openUrl, promptHidden, promptLine, red, renderQr, yellow } from "../ui/term.ts";

async function announce(accessToken: string, userId: string): Promise<void> {
  const profile = await fetchProfile(accessToken, userId).catch(() => null);
  const supporter = await isSupporter(accessToken, userId);
  const badge = supporter ? ` ${green("supporter")}` : "";
  process.stdout.write(`${green("✓")} Вошли как ${bold(profileLabel(profile, userId))}${badge}\n`);
}

async function loginByEmail(): Promise<number> {
  if (!isInteractive()) {
    process.stderr.write(`${red("Вход по почте требует интерактивного терминала.")}\n`);
    return 1;
  }
  const email = await promptLine("Почта: ");
  if (!email) {
    process.stderr.write(`${red("Почта не введена.")}\n`);
    return 1;
  }
  const password = await promptHidden("Пароль: ");
  if (!password) {
    process.stderr.write(`${red("Пароль не введён.")}\n`);
    return 1;
  }

  try {
    const session = await loginWithPassword(email, password);
    await announce(session.access_token, session.user_id);
    return 0;
  } catch (error) {
    process.stderr.write(`${red("Не вошли:")} ${(error as Error).message}\n`);
    return 1;
  }
}

async function loginByTelegram(autoOpen: boolean): Promise<number> {
  let pending;
  try {
    pending = await startTelegramLogin();
  } catch (error) {
    if (error instanceof TelegramUnavailableError) {
      process.stderr.write(`${yellow("!")} ${error.message}\n`);
      return 2;
    }
    process.stderr.write(`${red("Не удалось начать вход:")} ${(error as Error).message}\n`);
    return 1;
  }

  process.stdout.write(`\n${bold("Вход через Telegram")}\n`);
  const qr = await renderQr(pending.url);
  if (qr) process.stdout.write(`${qr}\n`);
  process.stdout.write(`${dim("Отсканируйте QR или откройте ссылку:")}\n  ${cyan(pending.url)}\n`);
  process.stdout.write(`${dim("Затем нажмите Start у бота. Ждём подтверждения…")}\n\n`);

  if (autoOpen) openUrl(pending.url);

  const result = await waitForTelegramLogin(pending);

  switch (result.status) {
    case "ok":
      await announce(result.session.access_token, result.session.user_id);
      return 0;
    case "expired":
      process.stderr.write(`${yellow("!")} Время на подтверждение вышло. Запустите вход заново.\n`);
      return 1;
    default:
      process.stderr.write(`${red("Не вошли:")} ${result.error}\n`);
      return 1;
  }
}

export async function loginCommand(argv: readonly string[]): Promise<number> {
  const existing = await getValidSession();
  if (existing && !argv.includes("--force")) {
    await announce(existing.access_token, existing.user_id);
    process.stdout.write(`${dim("Уже в аккаунте. Сменить — surprise login --force")}\n`);
    return 0;
  }

  if (argv.includes("--email")) return loginByEmail();

  // --no-open: по SSH и в контейнере открывать нечего, а xdg-open в этот момент
  // печатает свою ошибку поверх нашей инструкции.
  const autoOpen = !argv.includes("--no-open") && isInteractive();
  const code = await loginByTelegram(autoOpen);

  // Бот недоступен (метод oauth) — честно предлагаем запасной путь, а не молчим.
  if (code === 2) {
    process.stdout.write(`${dim("Запасной вход:")} surprise login --email\n`);
    return 1;
  }
  return code;
}
