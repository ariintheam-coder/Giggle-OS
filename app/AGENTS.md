# Project Setup

Last updated: Giggle OS desktop with sandboxed HTML apps

Factual state of this project, for the assistant's reference. Record project
state here only — structure, installed packages, active patterns. Keep it brief.

## Stack

A **Vite + React** single-page app (JSX), styled with **Tailwind CSS v4**. The
dev server runs with live reload, so edits appear in the preview immediately —
no build or restart needed to see a change.

The app is rendered inside **React StrictMode** in dev. StrictMode
intentionally double-invokes components, effects, and state updaters (mounting
each component twice on the first render) to surface unsafe side effects. Write
code that tolerates this: effects must clean up after themselves (return a
teardown from `useEffect`), and rendering, reducers, and state updaters must be
pure — no side effects, mutation, or one-off work outside an effect. Don't treat
the double render as a bug or try to suppress it; just write idempotent,
effect-safe code and it behaves correctly in production (where StrictMode adds
no double-invocation).

Provided by the platform (available at runtime — never add these to
`package.json`): React, react-dom, react-router, Vite, @vitejs/plugin-react,
lucide-react, pocketbase, `tailwind-merge`, and the Tailwind v4 engine itself.
This project has **no dependencies of its own** — `package.json` is empty and
there is no `node_modules`. Do not `npm install` anything for styling.

## Tailwind v4 notes

This is Tailwind **v4**, not v3. Almost all utilities are identical, but:

- The stylesheet entry is `@import "tailwindcss";` (not the three `@tailwind`
  directives). Already set up in `src/index.css`.
- **Theme customization goes in `tailwind.config.cjs`** (custom colors, fonts,
  spacing under `theme.extend`). It is wired in via `@config` in `index.css` —
  edit the config file as you would in v3. You may instead define tokens with a
  `@theme { --color-brand: …; }` block in `index.css`.
- **Never add `postcss.config`, `postcss`, or `autoprefixer`** — vendor
  prefixing is built into the v4 engine. Adding them breaks the build.
- A few renamed utilities vs v3: `shadow` → `shadow-sm`, `shadow-sm` →
  `shadow-xs`, `rounded` → `rounded-sm`, `outline-none` → `outline-hidden`,
  `flex-shrink-0` → `shrink-0`, and `bg-opacity-50` → the `bg-black/50` slash
  syntax. The default border color is now `currentColor` (set one explicitly,
  e.g. `border border-gray-200`).
- Arbitrary values (`w-[473px]`, `text-[#1da1f2]`, `grid-cols-[1fr_2fr]`) work
  exactly as in v3.

## Structure

```
src/
  App.jsx      # Root component — replace with the user's app
  main.jsx     # Entry point — renders <App/> into #root, imports index.css
  index.css    # @import "tailwindcss" + @config bridge
public/
  favicon.svg  # Placeholder — replace with the user's mark
index.html
package.json · vite.config.js · tailwind.config.cjs
```

`dist/` is committed (the deploy reads from it); `node_modules/` is ignored.

## Starting point

`App.jsx` ships a placeholder welcome page. Replace its contents with whatever
the user is building. Also replace the placeholder `<title>`, meta
description and `public/favicon.svg` with ones that match the
business — see your instructions for the full checklist.

## Routing & asset paths

The published `dist/` is served from more than one base path (the live site at
`/`, and read-only history snapshots under a longer prefix). The build uses a
relative asset base plus a `<base href>` in `index.html` so the same output
works from any of them — so two rules keep links and assets from breaking:

- **Never hardcode root-absolute URLs** (a leading `/`) for in-app assets or
  links — `/logo.png`, `/about`, `fetch("/data.json")`. Import assets
  (`import logo from "./logo.png"`) or reference them relatively; they then
  resolve against the base automatically.
  - **Exception — `/static/…`.** Files in the project's `static/` directory are
    served by the platform at the fixed absolute URL `/static/<filename>`, which
    resolves the same on every base path (live, preview, snapshots) because it's
    mapped outside the app, not bundled into `dist/`. Reference these **exactly**
    as `/static/<file>` (e.g. `<img src="/static/photo.jpg">`) — leading slash and
    all. This is the one allowed root-absolute path. Never copy a `static/` asset
    into the app (`public/`, `src/`) and never reach it with a relative `../`
    path. (The get-image skill saves design images into `static/` and prints the
    `/static/<file>` path to use verbatim.)
- **If you add a router**, set its basename from the document base, never a
  literal `/`:

  ```jsx
  import { createBrowserRouter } from "react-router";
  // strip the trailing slash; "/" becomes "" which react-router wants
  const basename = new URL(document.baseURI).pathname.replace(/\/$/, "");
  const router = createBrowserRouter(routes, { basename });
  ```

  (or `<BrowserRouter basename={basename}>`). This makes the app mount
  correctly whether served from `/` or a longer prefix.

## Current app

Request form: collection app_requests (requester, title, link, details); users see only their own; desktop tile + start menu item open RequestApp.
Admin: os_users.role=admin sees all app_requests (rules enforce it; UI button 'Admin: view requests' in Start menu). Promote via agent script only; role can't be set by clients.

Games folder: apps with folder:"games" in APPS (static/apps/games/*.html) show in the Games folder panel (desktop tile + Start menu), not the main lists.
Games in subfolders (static/apps/games/<id>/index.html) use <base href="__ORIGIN__/static/...">; HtmlApp replaces __ORIGIN__ with window.location.origin.
NotePlate app (static/apps/noteplate.html) added to APPS.
Sign-in: username or email (usernames map to <name>@users.giggleos.app internally; shownName() in App.jsx). Sign-up is username-only.
Desktop customization (Customize component in App.jsx): wallpaper, accent, icon size, theme; saved per account in os_data appId 'desktop-prefs'.
LocalMind refreshed from repo index.html.
Feedback: Start menu 'Send feedback' (Feedback component) saves to app_feedback; admins see 'Admin: view feedback'.

## Offline file storage for apps
Sandboxed app frames have no Cache Storage of their own. `src/lib/sandbox.js` shims `window.caches` and bridges it via postMessage to `handleCache` in `src/HtmlApp.jsx`, which uses the host's real Cache Storage (names prefixed `gg-app:`). Used by LocalMind (web-llm model downloads). Iframe also has `allow="webgpu"`.

## Files app & desktop folders
- `src/Files.jsx`: built-in **Files** app (kind "files" in `APPS`) — private per-account file manager (folders, upload/drag-drop, rename, move, delete, download, image preview, search, sort). Stored in the `os_files` collection (owner-only rules; protected `file` field, 16 MB each; folders are rows with `kind: "folder"` and a `parent` id). File URLs use a short-lived `pb.files.getToken()` refreshed every 90 s.
- Desktop prefs (`desktop-prefs` in `os_data`) now also hold `folders` (`[{id,name,color,apps[]}]`), `taskbar` ("top"/"bottom"), `clock24`, `wallFile` (an image id from `os_files` used as wallpaper). Apps inside a custom folder are hidden from the desktop list; `FolderManager`, `FolderView`, `FolderTile` live in `App.jsx`.
- Videos app (static/apps/videos.html): pastes YouTube link, embeds via youtube-nocookie.
- Videos is a native window (src/VideoPlayer.jsx), plain youtube-nocookie iframe, no-referrer.
- VideoPlayer must send referrer (strict-origin-when-cross-origin) or YouTube shows error 153.
- VideoPlayer extras: open on YouTube, copy, wide, repeat, autoplay, session recents (in-memory).
- Video history saved in os_data appId video-history (JSON blob, up to 50).
- Video history: fav flag per item, search box; clear keeps favorites.
- Desktop: drag app icon onto custom folder tile (text/giggle-app).
- Desktop tiles reorderable by drag (prefs.order keys: appId, games, f:<id>); drop app on custom folder moves it in; folder window has drop strip to move apps back out (prefs.folders[].apps).
- Built-in apps in src/Tools.jsx: Calculator, ClockTimer, CalendarApp (os_data appId 'calendar'), TextEditor (reads/writes os_files), MusicPlayer (audio from os_files; playlist in os_data 'music-playlist'). Kinds: calculator/clock/calendar/editor/music in APPS.
- Big files: >15 MB are split into pieces (os_files kind=part, grp=main id, part index; main row has parts count). Helpers in src/lib/bigfile.js; Files limit 500 MB; Music loads big songs as a blob.
Tips app (src/Tips.jsx, kind "tips"): searchable per-app how-to tabs; edit TIPS array when apps change.
Sign-in is username-only (no email). Admin account login is username 'ariintheam'. Live site: recreate admin then ask assistant to set role.
Settings modal (Start menu): change own password (oldPassword required), re-auths after.
Music app replaced by musmobile (static/apps/musmobile.html, uploaded player, kind html). Music.jsx unused.
LocalMind: added extras block (conversation search, Style presets, Edit/Continue buttons, download chat as .md).
LocalMind: PDF attach (pdf.js from CDN, in-page chunk search feeds excerpts into system prompt).
Share app: src/Share.jsx, collection shared_files (all signed-in users read; owner/admin delete; 500MB via split pieces (kind=part, grp), not true P2P).
shared_files needs created/updated autodate fields (sort -created); Share pieces are 8MB.
Share: default action saves into os_files (parent root) via saveBig for >15MB; 'To my device' keeps browser download.
Browser app: src/Browser.jsx, iframe-based (sites blocking framing need Open in new tab), bookmarks+history in os_data appId browser-data.
