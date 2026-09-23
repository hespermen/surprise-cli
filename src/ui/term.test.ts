import assert from "node:assert/strict";
import { test } from "node:test";

import { isOpenableUrl } from "./term.ts";

/**
 * Главная проверка файла.
 *
 * `xdg-open` и `open` — это не «показать страницу», а «отдать строку тому, кто
 * на неё подписан». Подписаны бывают vscode://, ms-msdt:, search-ms:, smb:// —
 * через них запускают обработчики и уводят NTLM-хеш. Адрес сюда приходит из
 * ответа сервера, и до появления этой проверки от него требовалась только
 * непустота.
 */
test("в систему уходят только свои https-адреса", () => {
  for (const url of [
    "https://surprise.fm/cli?code=ABC123",
    "https://www.surprise.fm/login",
    "https://t.me/SurpriseAppBot?start=xyz",
    "https://telegram.me/SurpriseAppBot",
    "https://oauth.telegram.org/auth?bot_id=1",
  ]) {
    assert.equal(isOpenableUrl(url), true, `свой адрес отвергли: ${url}`);
  }
});

test("чужие схемы не открываются", () => {
  for (const url of [
    "file:///etc/passwd",
    "file:///Applications/Calculator.app",
    "vscode://ms-vscode.remote/x",
    "ms-msdt:/id PCWDiagnostic",
    "search-ms:query=x&crumb=location:\\\\evil.tld\\share",
    "smb://evil.tld/share",
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
  ]) {
    assert.equal(isOpenableUrl(url), false, `опасную схему пропустили: ${url}`);
  }
});

/** Чужой хост по https — тоже нет: ссылку прислал сервер, а он мог быть подменён. */
test("https на чужой хост не открывается", () => {
  for (const url of [
    "https://evil.tld/cli?code=1",
    "https://surprise.fm.evil.tld/",
    "https://evil.tld/?x=surprise.fm",
    "https://t.me.evil.tld/bot",
  ]) {
    assert.equal(isOpenableUrl(url), false, `чужой хост пропустили: ${url}`);
  }
});

/** http не бывает во флоу входа ни у нас, ни у Telegram. */
test("http не открывается даже на своём хосте", () => {
  assert.equal(isOpenableUrl("http://surprise.fm/cli?code=1"), false);
  assert.equal(isOpenableUrl("http://t.me/bot"), false);
});

/** Строка без схемы не разбирается как адрес — значит и не открывается. */
test("строки, не являющиеся адресом, отвергаются", () => {
  for (const url of ["", "   ", "-g", "--help", "surprise.fm", "/Applications/X.app", "не адрес"]) {
    assert.equal(isOpenableUrl(url), false, `мусор пропустили: ${JSON.stringify(url)}`);
  }
});
