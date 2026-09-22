# SURPRISE.FM in your terminal

*[Русская версия](README.md)*

Live radio, the show archive and your own library — without a browser.

```bash
curl -fsSL https://surprise.fm/cli | sh
```

The player opens by itself. After that, run it with `surprise`.

The installer checks Node, removes an older version if there was one, and tells
you about mpv. Reading it first is a sound habit — it is served as plain text for
exactly that reason:

```bash
curl -fsSL https://surprise.fm/cli | less
```

Straight through npm works too, if you would rather not run a script from the
network:

```bash
npm i -g "$(npm pack -s github:hespermen/surprise-cli)"
```

That form is longer than the usual `npm i -g github:…` and it isn't fussiness: on
npm 10.x the short one answers "added 1 package" and leaves an **empty** package
directory — the command appears but won't run. The failure looks like success. On
npm 11 and newer the short form is fine too.

## Installing

### If you had `surprise-fm` before

That was this package's name before the rename, and it installs **the same
command**, `surprise`. Two packages cannot own one command: the new one installs,
says "added 1 package", and `surprise` still runs the old one. The update looks
successful and changes nothing.

```bash
npm rm -g surprise-fm
```

To check what actually runs:

```bash
surprise --version    # surprise-cli 0.2.0
```

An answer without the package name (just `0.1.0`) is the old install.

### `EEXIST: file already exists`

```
npm error code EEXIST
npm error path ~/.local/bin/surprise
npm error File exists: ~/.local/bin/surprise
```

The old package's shim owns the command and npm refuses to overwrite it — rightly
so: anything at all could be sitting under that name. `npm rm -g` doesn't always
remove it after a rename, and the shim is left orphaned, with no owner to answer
for it.

```bash
ls -l ~/.local/bin/surprise    # see where it points
rm ~/.local/bin/surprise
```

Take the path from the error text — everyone's npm prefix differs.

### The package itself

It's a single self-contained file (~250 KB, Node built-ins only), so installing
it doesn't drag in a dependency tree.

You need **mpv** — it plays the audio:

```bash
brew install mpv          # macOS
apt install mpv           # Debian/Ubuntu
winget install mpv        # Windows
```

Without mpv it falls back to `ffplay` from ffmpeg, if present. Everything works,
just worse: seeking restarts the stream, volume can't change on the fly, and the
position is counted by the clock rather than by the decoder. The CLI warns you
about this at startup.

## First run

The very first launch asks three questions: language, theme, sign-in. Then it
opens and never asks again.

Language comes first on purpose — everything shown afterwards is written in it,
and picking a theme from labels in a language you don't read is no way to start.
The theme applies while you choose: the screen repaints as you move through the
list, so you decide by what you see rather than by a name.

Sign-in can be skipped: the live stream plays without an account. You can sign in
at any time with `/login`, and rerun the wizard with `/setup`.

## The interface

Run it without arguments and you get the multi-panel view: sections on the left,
list on the right, details below it, player full width at the bottom.

```bash
surprise
```

The sections and their order mirror the site's navigation — Live, New, Residents,
Hosts, Music, My collection, Favourites, My finds, Saved, Following, Search. The
live stream starts immediately.

**Live is a stream.** The Live section shows the schedule for reference: what's on
and what's next. You can't start archive recordings from it — someone pressing
Enter on the live stream wants the live stream, not an episode from the top.

**Cards open inward.** Enter on a resident or host shows their episodes, on a
release its tracks, on a playlist its contents. Enter again plays. `Esc` returns
exactly where you were.

Residents are only those marked as such (a dozen or so, not the full catalogue of
fifteen hundred artists). Hosts are only the verified ones. Release tracks are
available to signed-in listeners: the server decides access.

**Commands.** `/` opens an input line with the command list and hints: `/radio`,
`/play`, `/pause`, `/search <query>`, `/goto <section>`, `/volume <0-130>`,
`/mute`, `/back`, `/login`, `/logout`, `/whoami`, `/help`, `/quit`. Tab completes
the highlighted one, Enter runs it.

**Signing in without leaving.** `/login` shows a QR right on screen: point your
phone at it, press Start in the bot, and the personal sections come alive at once,
no restart.

Three states are kept apart and visible at the same time: which section is open,
which row is selected, and what is actually playing. That's why you can browse the
catalogue without interrupting the music.

| Keys | What they do |
|---|---|
| `j` / `k`, `↑` / `↓` | move through the list |
| `g` / `G`, `PgUp` / `PgDn` | top / bottom, ten rows at a time |
| `Tab`, `h` / `l` | switch panels |
| `1` … `9` | jump straight to a section |
| `Enter` | open or play |
| `/` | command line with the list |
| `Esc` | back out of a card |
| `?` | help |
| `q` | quit |

Player keys match the website: `space` pause, `←` / `→` thirty seconds, `m` mute,
`n` / `p` adjacent track, `r` back to the live stream. One thing differs: on the
site `↑`/`↓` change the volume, here they move through the list — in an interface
built of lists that habit is the stronger one. Volume is on `+` and `−`.

## Commands

Everything is available line by line, for scripts and quick actions:

| Command | What it does |
|---|---|
| `surprise` | full-screen interface |
| `surprise radio` | play the live stream, show what's on |
| `surprise play <url\|query>` | an episode, a track or a release |
| `surprise library [section]` | playlists, likes, finds, saved, following |
| `surprise playlist [title]` | contents of a playlist |
| `surprise login` | sign in |
| `surprise whoami` / `logout` | who's signed in / sign out |

`play` takes both a site URL and plain text:

```bash
surprise play https://surprise.fm/episodes/837393
surprise play shuliko
```

Controls: `space` pause, `←`/`→` seek, `q` quit.

## Signing in

Telegram by default. The terminal shows a QR code and a link to the bot: scan it
with your phone or open the link, press Start, and the CLI picks up the session
itself.

The QR isn't decoration. The typical case is a terminal over SSH on a server with
neither a browser nor Telegram: there's nothing to click, and the phone is right
there. For the same reason the flow doesn't use a local port for a redirect —
inside a container or an SSH session there's nowhere to receive it.

```bash
surprise login              # Telegram + QR
surprise login --no-open    # don't try to open the link
surprise login --email      # email fallback
```

The password is typed hidden and is not accepted as an argument: arguments are
visible in `ps` to other users of the machine and stay in the shell history.

The session lives in `~/.config/surprise-fm/session.json` with mode `0600`.

## For scripts

Every command has `--json`:

```bash
surprise radio --json | jq -r '.now.label'     # what's playing now
surprise library likes --json | jq length
surprise whoami --json | jq -r '.supporter'
```

`whoami` exits with code 1 when there's no session, so that `surprise whoami && …`
doesn't read "not signed in" as success.

## What is sent to the server

The player is a surprise.fm client, so it talks to `api.surprise.fm`. The list is
complete, including what happens without your involvement:

| What is sent | When | Why |
|---|---|---|
| A play event | after 10 seconds of audio, at most once per half hour per item | platform statistics — the same numbers the site counts |
| Listener identifier | together with a store track play | free-play quota |
| Presence ping | every 15 seconds while the live stream plays | the "how many are listening" counter |
| `x-client-info: surprise-cli/<version>` | on every request | to tell the terminal from the site in statistics |

**The listener identifier is persistent.** It lives in
`~/.config/surprise-fm/listener-id`, survives restarts and isn't tied to an
account — it's how the count of free plays of a particular track is kept. Delete
the file and the count starts over; that is the only thing it affects.

Presence pings and play statistics work **without signing in** too: they belong to
the platform, not to an account. If that doesn't suit you — the player is open
source, and all of the above lives in `src/api/plays.ts` and `src/api/radio.ts`.

What the player does NOT do: it goes nowhere except surprise.fm, collects no
telemetry about your environment, sends no contents of your files. The access
token is kept only on your machine, in `~/.config/surprise-fm/session.json` with
mode `0600`.

## Development

```bash
git clone https://github.com/hespermen/surprise-cli
cd surprise-cli
npm install       # dependencies only; building is a separate command
npm test          # pure functions plus the mpv wrapper on a fake process
npm run typecheck
npm run build
```

The mpv wrapper is tested without mpv installed — against a fake process speaking
the same JSON-IPC (`src/player/fixtures/fake-mpv.mjs`). That way the tests run in
a container and on a machine with no sound card.

### Environment variables

| Variable | Purpose |
|---|---|
| `SURPRISE_API_URL` | a different backend (default `https://api.surprise.fm`) |
| `SURPRISE_MPV` / `SURPRISE_FFPLAY` | paths to the players |
| `SURPRISE_BACKEND` | `mpv` or `ffplay` — force a player |
| `SURPRISE_SESSION_PATH` | where to keep the session |
| `SURPRISE_PLATFORM_HINT` | temporary workaround while the `pickLoginMethod` fix isn't in production |
| `NO_COLOR` | turn colour off |

### Why the built file is in the repository

`dist/cli.js` is committed. That's deliberate, even though it isn't usually done.

Installing from git (`npm i -g github:…`) cannot build the project itself: for a
GLOBAL install npm doesn't install devDependencies, and without them there's no
bundler. The `prepare` script failed right there with "Cannot find package
esbuild" — while the install reported success and left an empty directory, so the
command appeared but wouldn't run. A failure that looks like success is worse than
an honest error.

So the repository carries the built file, and the package has no runtime
dependencies at all: everything is compiled in, and installing downloads nothing.

The price is discipline: after editing `src/` you have to rebuild and commit
`dist/cli.js` along with it. `prepublishOnly` covers publishing to npm, but not an
ordinary commit.

### About the names

There are two, and they differ on purpose:

| | |
|---|---|
| repository and package | `surprise-cli` |
| terminal command | `surprise` |

You type the command every day and the package name once, at install time, so the
short form went to the command. They can't match: the name `surprise` on npm is
taken by someone else's package.

The config directory is nevertheless `~/.config/surprise-fm/` — named after the
station, not the package. Renaming it would sign out everyone who already has the
player installed, for cosmetics.

### Publishing to npm

```bash
npm publish
```

`prepublishOnly` runs the type checker and the tests — a package that fails them
won't reach the registry.

### What is deliberately absent

**`@supabase/supabase-js`.** About a dozen endpoints are needed, and in exchange
the library would take over session management — precisely the thing a CLI must
keep under its own control. GoTrue rotates the `refresh_token`, and refreshing
here runs under a cross-process lock: `surprise` in two terminal tabs is ordinary,
and two parallel refreshes with one token would sign the person out of both.

**A homegrown audio decoder.** HTTP range seeking, AES-128 encrypted HLS and
reconnecting to icecast are all needed — mpv does them better than we would.

## Licence

MIT. See [LICENSE](LICENSE).
