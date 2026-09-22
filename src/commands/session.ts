/**
 * surprise whoami | surprise logout
 */

import { getValidSession, logout } from "../net/auth.ts";
import { fetchProfile, isSupporter, profileLabel } from "../api/profile.ts";
import { bold, dim, green } from "../ui/term.ts";

export async function whoamiCommand(argv: readonly string[]): Promise<number> {
  const asJson = argv.includes("--json");
  const session = await getValidSession();

  if (!session) {
    if (asJson) process.stdout.write(`${JSON.stringify({ authenticated: false })}\n`);
    else process.stdout.write(`${dim("Не в аккаунте.")} Вход: surprise login\n`);
    // Код возврата 1: скрипт вида `surprise whoami && ...` не должен считать
    // отсутствие сессии успехом.
    return 1;
  }

  const profile = await fetchProfile(session.access_token, session.user_id).catch(() => null);
  const supporter = await isSupporter(session.access_token, session.user_id);

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify({
        authenticated: true,
        user_id: session.user_id,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        supporter,
        expires_at: session.expires_at,
      })}\n`,
    );
    return 0;
  }

  process.stdout.write(`${bold(profileLabel(profile, session.user_id))}${supporter ? ` ${green("supporter")}` : ""}\n`);
  process.stdout.write(`${dim(session.user_id)}\n`);
  return 0;
}

export async function logoutCommand(): Promise<number> {
  await logout();
  process.stdout.write("Вышли из аккаунта.\n");
  return 0;
}
