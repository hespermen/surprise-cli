/**
 * Язык интерфейса: русский и английский.
 *
 * Словарь плоский и типизированный ключами: пропущенный перевод становится
 * ошибкой компиляции, а не пустой строкой на экране у человека.
 *
 * Язык живёт в модульной переменной, как и палитра, — он одинаков для всего
 * экрана и меняется раз в жизни.
 */

export type Lang = "ru" | "en";

export const LANGS: ReadonlyArray<{ id: Lang; label: string }> = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
];

const RU = {
  "sections.title": "Разделы",
  "section.radio": "Эфир",
  "section.shows": "Новое",
  "section.artists": "Резиденты",
  "section.hosts": "Авторы",
  "section.releases": "Музыка",
  "section.playlists": "Моя коллекция",
  "section.likes": "Избранное",
  "section.finds": "Мои находки",
  "section.saved": "Сохранённое",
  "section.following": "Подписки",
  "section.search": "Поиск",
  "section.settings": "Настройки",

  "list.radio": "Эфир — расписание",
  "list.shows": "Новое — свежие выпуски",
  "list.artists": "Резиденты",
  "list.hosts": "Авторы",
  "list.releases": "Музыка — релизы",
  "list.playlists": "Моя коллекция — плейлисты",
  "list.likes": "Избранное",
  "list.finds": "Мои находки",
  "list.saved": "Сохранённое",
  "list.following": "Подписки",
  "list.search": "Поиск",
  "list.settings": "Настройки",

  "col.when": "Когда",
  "col.show": "Выпуск",
  "col.start": "Начало",
  "col.artists": "Артисты",
  "col.duration": "Длит.",
  "col.name": "Имя",
  "col.release": "Релиз",
  "col.date": "Дата",
  "col.playlist": "Плейлист",
  "col.tracks": "Треков",
  "col.track": "Трек",
  "col.fromShow": "Из выпуска",
  "col.mark": "Метка",
  "col.what": "Что",
  "col.kind": "Тип",
  "col.who": "Кто",
  "col.title": "Название",
  "col.setting": "Настройка",
  "col.value": "Значение",

  "empty.radio": "Расписание пока недоступно",
  "empty.generic": "Список пуст",
  "empty.nobody": "Никого не нашли",
  "empty.releases": "Релизов не нашли",
  "empty.playlists": "Плейлистов пока нет",
  "empty.likes": "Лайков пока нет",
  "empty.finds": "Находок пока нет",
  "empty.saved": "Сохранённого пока нет",
  "empty.following": "Подписок пока нет",
  "empty.search": "Введите запрос — минимум две буквы",
  "empty.auth": "Нужен вход — наберите /login",

  "player.nothing": "Ничего не играет",
  "player.live": "эфир",
  "hint.bar": "/ — команды · Tab — панели · j/k — список · Enter — играть · f — избранное · ? — помощь · q — выход",
  "hint.radioInfo": "только для справки",
  "hint.loading": "загружаем…",
  "hint.back": "Esc назад",
  "tooSmall.title": "Окно слишком маленькое",
  "tooSmall.need": "Нужно хотя бы {cols}×{rows}, сейчас {haveCols}×{haveRows}.",
  "tooSmall.how": "Растяните окно или уменьшите шрифт — интерфейс появится сам.",

  "settings.theme": "Тема",
  "settings.language": "Язык",
  "settings.hint": "Enter переключает",
  "like.added": "Добавлено в избранное",
  "like.removed": "Убрано из избранного",
  "like.needAuth": "Нужен вход — наберите /login",
  "like.unsupported": "Это в избранное не добавить",
} as const;

export type MessageKey = keyof typeof RU;

const EN: Record<MessageKey, string> = {
  "sections.title": "Sections",
  "section.radio": "Live",
  "section.shows": "New",
  "section.artists": "Residents",
  "section.hosts": "Hosts",
  "section.releases": "Music",
  "section.playlists": "My collection",
  "section.likes": "Favourites",
  "section.finds": "My finds",
  "section.saved": "Saved",
  "section.following": "Following",
  "section.search": "Search",
  "section.settings": "Settings",

  "list.radio": "Live — schedule",
  "list.shows": "New — latest episodes",
  "list.artists": "Residents",
  "list.hosts": "Hosts",
  "list.releases": "Music — releases",
  "list.playlists": "My collection — playlists",
  "list.likes": "Favourites",
  "list.finds": "My finds",
  "list.saved": "Saved",
  "list.following": "Following",
  "list.search": "Search",
  "list.settings": "Settings",

  "col.when": "When",
  "col.show": "Episode",
  "col.start": "Started",
  "col.artists": "Artists",
  "col.duration": "Length",
  "col.name": "Name",
  "col.release": "Release",
  "col.date": "Date",
  "col.playlist": "Playlist",
  "col.tracks": "Tracks",
  "col.track": "Track",
  "col.fromShow": "From episode",
  "col.mark": "Mark",
  "col.what": "What",
  "col.kind": "Kind",
  "col.who": "Who",
  "col.title": "Title",
  "col.setting": "Setting",
  "col.value": "Value",

  "empty.radio": "Schedule is unavailable",
  "empty.generic": "Nothing here",
  "empty.nobody": "Nobody found",
  "empty.releases": "No releases found",
  "empty.playlists": "No playlists yet",
  "empty.likes": "No favourites yet",
  "empty.finds": "No finds yet",
  "empty.saved": "Nothing saved yet",
  "empty.following": "Not following anyone yet",
  "empty.search": "Type at least two letters",
  "empty.auth": "Sign in first — type /login",

  "player.nothing": "Nothing is playing",
  "player.live": "live",
  "hint.bar": "/ — commands · Tab — panels · j/k — list · Enter — play · f — favourite · ? — help · q — quit",
  "hint.radioInfo": "for reference only",
  "hint.loading": "loading…",
  "hint.back": "Esc to go back",
  "tooSmall.title": "Window too small",
  "tooSmall.need": "Needs at least {cols}×{rows}, currently {haveCols}×{haveRows}.",
  "tooSmall.how": "Resize the window or lower the font size — the interface will appear.",

  "settings.theme": "Theme",
  "settings.language": "Language",
  "settings.hint": "Enter to switch",
  "like.added": "Added to favourites",
  "like.removed": "Removed from favourites",
  "like.needAuth": "Sign in first — type /login",
  "like.unsupported": "This can't be favourited",
};

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { ru: RU, en: EN };

let current: Lang = "ru";

export function setLang(lang: Lang): void {
  current = lang;
}

export function getLang(): Lang {
  return current;
}

export function t(key: MessageKey): string {
  return DICTIONARIES[current][key];
}

/**
 * Перевод с подстановкой значений вида {имя}.
 *
 * Числа подставляются, а не склеиваются из кусков строки: порядок слов в
 * языках разный, и «нужно 104×44» по-английски собирается иначе. Склейка
 * работает ровно до первого языка, который так не строит фразу.
 */
export function tf(key: MessageKey, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/** Подпись раздела по его идентификатору. */
export function sectionLabel(id: string): string {
  return t(`section.${id}` as MessageKey);
}

/** Заголовок панели списка по идентификатору раздела. */
export function sectionListTitle(id: string): string {
  return t(`list.${id}` as MessageKey);
}
