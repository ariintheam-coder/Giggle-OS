import { useEffect, useMemo, useRef, useState } from "react";
import BookIcon from "icon:book-open";
import SwordsIcon from "icon:swords";
import BrainIcon from "icon:brain";
import NotebookIcon from "icon:notebook-pen";
import VideoPlayer from "./VideoPlayer.jsx";
import Tips from "./Tips.jsx";
import LightbulbIcon from "icon:lightbulb";
import PlayIcon from "icon:circle-play";
import GamepadIcon from "icon:gamepad-2";
import FolderIcon from "icon:folder";
import MinusIcon from "icon:minus";
import SquareIcon from "icon:square";
import CopyIcon from "icon:copy";
import XIcon from "icon:x";
import GridIcon from "icon:layout-grid";
import LogOutIcon from "icon:log-out";
import PlusIcon from "icon:plus-circle";
import InboxIcon from "icon:inbox";
import SunIcon from "icon:sun";
import PaletteIcon from "icon:palette";
import SettingsIcon from "icon:settings";
import MessageIcon from "icon:message-square-heart";
import MoonIcon from "icon:moon";
import HardDriveIcon from "icon:hard-drive";
import FolderPlusIcon from "icon:folder-plus";
import FileManager from "./Files.jsx";
import Share from "./Share.jsx";
import Browser from "./Browser.jsx";
import GlobeIcon from "icon:globe";
import ShareIcon from "icon:share-2";
import { Calculator, ClockTimer, CalendarApp, TextEditor, MusicPlayer } from "./Tools.jsx";
import CalcIcon from "icon:calculator";
import TimerIcon from "icon:alarm-clock";
import CalendarIcon from "icon:calendar-days";
import FilePenIcon from "icon:file-pen-line";
import MusicNoteIcon from "icon:music";
import { pb } from "./lib/pb";
import HtmlApp from "./HtmlApp.jsx";

const APPS = [
  { id: "files", name: "Files", blurb: "Store and organise your important files", Icon: HardDriveIcon, tint: "#6cc4ff", kind: "files" },
  { id: "browser", name: "Browser", blurb: "Browse the web in tabs, with bookmarks and history", Icon: GlobeIcon, tint: "#5ec8ff", kind: "browser" },
  { id: "share", name: "Share", blurb: "Share files with other users and find what they share", Icon: ShareIcon, tint: "#ff9f6e", kind: "share" },
  { id: "calculator", name: "Calculator", blurb: "Quick sums, with keyboard support", Icon: CalcIcon, tint: "#9bd1ff", kind: "calculator" },
  { id: "clock", name: "Clock & Timer", blurb: "Clock, countdown timer and stopwatch", Icon: TimerIcon, tint: "#ffd166", kind: "clock" },
  { id: "calendar", name: "Calendar", blurb: "Dates and reminders saved to your account", Icon: CalendarIcon, tint: "#ff8fa3", kind: "calendar" },
  { id: "editor", name: "Text Editor", blurb: "Write documents and save them to Files", Icon: FilePenIcon, tint: "#c3b1ff", kind: "editor" },
  { id: "musmobile", name: "musmobile", blurb: "Your music player, with playlists and FLAC", Icon: MusicNoteIcon, tint: "#7be0b0", kind: "html", src: "/static/apps/musmobile.html" },
  { id: "tips", name: "Tips", blurb: "How to use every app, step by step", Icon: LightbulbIcon, tint: "#ffd166", kind: "tips" },
  { id: "carrel", name: "Carrel", blurb: "Your personal book library and reader", Icon: BookIcon, tint: "#5f9e6e", kind: "html", src: "/static/apps/carrel.html" },
  { id: "haven", name: "Haven", blurb: "A fantasy adventure game", Icon: SwordsIcon, tint: "#b5543f", kind: "html", src: "/static/apps/haven.html" },
  { id: "localmind", name: "LocalMind", blurb: "A private AI assistant that runs on your device", Icon: BrainIcon, tint: "#b8f28b", kind: "html", src: "/static/apps/localmind.html" },
  { id: "videos", name: "Videos", blurb: "Paste a YouTube link and watch it here", Icon: PlayIcon, tint: "#ff4d5e", kind: "videos" },
  { id: "noteplate", name: "NotePlate", blurb: "Your personal knowledge space for notes", Icon: NotebookIcon, tint: "#e6aa62", kind: "html", src: "/static/apps/noteplate.html" },
  { id: "game-asciispace", name: "ASCII Space", blurb: "Shoot down waves in a text-art space shooter", Icon: GamepadIcon, tint: "#7fd1ff", kind: "html", folder: "games", src: "/static/apps/games/asciispace.html" },
  { id: "game-captaincallisto", name: "Captain Callisto", blurb: "A pocket space adventure", Icon: GamepadIcon, tint: "#f2a65a", kind: "html", folder: "games", src: "/static/apps/games/captaincallisto.html" },
  { id: "game-chromedino", name: "Dino Run", blurb: "Jump the cacti in the classic dino runner", Icon: GamepadIcon, tint: "#c8c8c8", kind: "html", folder: "games", src: "/static/apps/games/chromedino.html" },
  { id: "game-packabunchas", name: "Packabunchas", blurb: "A cheerful puzzle-and-collect game", Icon: GamepadIcon, tint: "#e58fb0", kind: "html", folder: "games", src: "/static/apps/games/packabunchas.html" },
  { id: "game-spacehuggers", name: "Space Huggers", blurb: "A quick space action game", Icon: GamepadIcon, tint: "#9b8cf0", kind: "html", folder: "games", src: "/static/apps/games/spacehuggers.html" },
  { id: "game-offlineparadise", name: "Offline Paradise", blurb: "Relax on a tiny island getaway", Icon: GamepadIcon, tint: "#6fd6a8", kind: "html", folder: "games", src: "/static/apps/games/offlineparadise.html" },
  { id: "game-9007199254740992", name: "9007199254740992 (2048 Remix)", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#7fd1ff", kind: "html", folder: "games", src: "/static/apps/games/9007199254740992/index.html" },
  { id: "game-connect3", name: "Connect 3", blurb: "Match three and score", Icon: GamepadIcon, tint: "#f2a65a", kind: "html", folder: "games", src: "/static/apps/games/connect3/index.html" },
  { id: "game-doge2048", name: "DOGE 2048", blurb: "Slide and merge in a doge-themed 2048", Icon: GamepadIcon, tint: "#e58fb0", kind: "html", folder: "games", src: "/static/apps/games/doge2048/index.html" },
  { id: "game-edgenotfound", name: "Edge Not Found", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#9b8cf0", kind: "html", folder: "games", src: "/static/apps/games/edgenotfound/index.html" },
  { id: "game-evil-glitch", name: "Evil Glitch 2", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#6fd6a8", kind: "html", folder: "games", src: "/static/apps/games/evil-glitch/index.html" },
  { id: "game-exo", name: "Exo", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#f0d36b", kind: "html", folder: "games", src: "/static/apps/games/exo/index.html" },
  { id: "game-konnekt", name: "konnekt", blurb: "Link up the pieces", Icon: GamepadIcon, tint: "#ef8f7a", kind: "html", folder: "games", src: "/static/apps/games/konnekt/index.html" },
  { id: "game-missiles", name: "Missile Game", blurb: "Dodge and survive the missiles", Icon: GamepadIcon, tint: "#8fc7a0", kind: "html", folder: "games", src: "/static/apps/games/missiles/index.html" },
  { id: "game-ninja", name: "Ninja", blurb: "Slice and leap as a ninja", Icon: GamepadIcon, tint: "#7fd1ff", kind: "html", folder: "games", src: "/static/apps/games/ninja/index.html" },
  { id: "game-ninjavsevilcorp", name: "Ninja vs EVILCORP", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#f2a65a", kind: "html", folder: "games", src: "/static/apps/games/ninjavsevilcorp/index.html" },
  { id: "game-sand-game", name: "Sand Game", blurb: "Pour sand and watch it flow", Icon: GamepadIcon, tint: "#e58fb0", kind: "html", folder: "games", src: "/static/apps/games/sand-game/index.html" },
  { id: "game-shuttledeck", name: "SHUTTLEDECK", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#9b8cf0", kind: "html", folder: "games", src: "/static/apps/games/shuttledeck/index.html" },
  { id: "game-spacegarden", name: "Space Garden", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#6fd6a8", kind: "html", folder: "games", src: "/static/apps/games/spacegarden/index.html" },
  { id: "game-xx142-b2exe", name: "xx142-b2.exe", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#f0d36b", kind: "html", folder: "games", src: "/static/apps/games/xx142-b2exe/index.html" },
  { id: "game-chromaincident", name: "Chroma Incident", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#ef8f7a", kind: "html", folder: "games", src: "/static/apps/games/chromaincident/index.html" },
  { id: "game-evilglitch", name: "Evil Glitch", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#8fc7a0", kind: "html", folder: "games", src: "/static/apps/games/evilglitch/index.html" },
  { id: "game-pushback", name: "Pushback", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#7fd1ff", kind: "html", folder: "games", src: "/static/apps/games/pushback/index.html" },
  { id: "game-radiusraid", name: "Radius Raid", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#f2a65a", kind: "html", folder: "games", src: "/static/apps/games/radiusraid/index.html" },
  { id: "game-retrohaunt", name: "Retrohaunt", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#e58fb0", kind: "html", folder: "games", src: "/static/apps/games/retrohaunt/index.html" },
  { id: "game-roadblocks", name: "ROADBLOCKS", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#9b8cf0", kind: "html", folder: "games", src: "/static/apps/games/roadblocks/index.html" },
  { id: "game-themazeofspacegoblins", name: "Maze of Space Goblins", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#6fd6a8", kind: "html", folder: "games", src: "/static/apps/games/themazeofspacegoblins/index.html" },
  { id: "game-underrun", name: "UNDERRUN", blurb: "A quick game to play in its own window", Icon: GamepadIcon, tint: "#f0d36b", kind: "html", folder: "games", src: "/static/apps/games/underrun/index.html" },
];
const TASKBAR = 48;
const MAIN_APPS = APPS.filter((a) => !a.folder);
const GAMES = APPS.filter((a) => a.folder === "games");
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gg-accent";
const field = `min-h-11 w-full rounded-lg border border-gg-line2 bg-gg-panel2 px-3 text-gg-fg placeholder:text-gg-fg3 ${focusRing}`;

function useMobile() {
  const q = "(max-width: 767px)";
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

function AppTile({ app, size = 40 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-xl text-[#1b1410]" style={{ background: app.tint, width: size, height: size }}>
      <app.Icon size={size * 0.55} aria-hidden="true" />
    </span>
  );
}

const USER_DOMAIN = "users.giggleos.app";
const cleanName = (s) => s.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._-]/g, "");
const toLogin = (s) => cleanName(s) + "@" + USER_DOMAIN;
const shownName = (u) => (u?.email || "").endsWith("@" + USER_DOMAIN) ? "@" + u.email.split("@")[0] : (u?.name || u?.email || "");

function SignIn({ onDone }) {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "up") {
        const u = cleanName(email);
        if (!/^[a-z0-9_.-]{3,20}$/.test(u)) { setErr("Choose a username of 3 to 20 letters, numbers, dots, dashes or underscores, with no spaces or @."); setBusy(false); return; }
        await pb.collection("os_users").create({ email: toLogin(u), password: pw, passwordConfirm: pw, name: u });
      }
      await pb.collection("os_users").authWithPassword(toLogin(email), pw);
      onDone();
    } catch (ex) {
      setErr(mode === "up" ? "We couldn't create that account. That username may already be taken, or the password is shorter than 8 characters. Try another username, or sign in if you already have an account." : "That username (or email) and password don't match. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="grid min-h-dvh place-items-center bg-gg-base p-4 text-gg-fg">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-gg-line bg-gg-panel p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <span className="gg-logo grid size-12 place-items-center rounded-xl bg-gg-accent text-2xl text-gg-onaccent" aria-hidden="true">☺</span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">Giggle OS</h1>
            <p className="text-sm text-gg-fg2">Your apps and progress, wherever you sign in.</p>
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="e" className="mb-1 block text-sm font-medium">{mode === "up" ? "Choose a username" : "Username"}</label>
          <input id="e" type="text" required minLength={3} maxLength={30} pattern="[A-Za-z0-9._-]+" title="Letters, numbers, dots, dashes and underscores only" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="mb-4">
          <label htmlFor="p" className="mb-1 block text-sm font-medium">Password</label>
          <input id="p" type="password" required minLength={8} className={field} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
        </div>
        {err && <p role="alert" className="mb-3 text-sm text-gg-error">{err}</p>}
        <button disabled={busy} className={`min-h-11 w-full rounded-lg bg-gg-accent font-semibold text-gg-onaccent disabled:opacity-60 ${focusRing}`}>
          {busy ? "One moment…" : mode === "up" ? "Create my account" : "Sign in"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }} className={`mt-3 min-h-11 w-full rounded-lg text-sm text-gg-accent-text underline ${focusRing}`}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}


function FolderView({ title, sub, apps, onClose, onPick, onEdit, onTakeOut }) {
  const [over, setOver] = useState(false);
  return (
    <Modal id="fv-t" title={title} sub={sub} onClose={onClose} wide>
      {apps.length === 0 ? (
        <p className="py-6 text-center text-sm text-gg-fg2">This folder is empty. Choose “Edit folder” to add apps to it.</p>
      ) : (
        <ul className="grid max-h-[55dvh] gap-1 overflow-y-auto sm:grid-cols-2">
          {apps.map((g) => (
            <li key={g.id} draggable={!!onTakeOut} onDragStart={(e) => e.dataTransfer.setData("text/giggle-tile", g.id)}>
              <button onClick={() => onPick(g)} className={`flex min-h-14 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gg-raised ${focusRing}`}>
                <AppTile app={g} />
                <span><span className="block text-sm font-semibold">{g.name}</span><span className="block text-xs text-gg-fg2">{g.blurb}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {onTakeOut && apps.length > 0 && (
        <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData("text/giggle-tile"); if (id) onTakeOut(id); }}
          className={`mt-3 rounded-lg border-2 border-dashed p-3 text-center text-sm ${over ? "border-gg-accent bg-gg-raised" : "border-gg-line2"}`}>
          Drag an app here to move it back to the desktop
        </div>
      )}
      {onEdit && <div className="mt-3 flex justify-end"><button type="button" onClick={onEdit} className={`min-h-11 rounded-lg border border-gg-line2 px-4 text-sm font-medium hover:bg-gg-raised ${focusRing}`}>Edit folder</button></div>}
    </Modal>
  );
}

function RequestApp({ user, onClose }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState([]);
  const first = useRef(null);
  const load = () => pb.collection("app_requests").getList(1, 20, { sort: "-created" }).then((r) => setMine(r.items)).catch(() => {});
  useEffect(() => {
    first.current?.focus();
    load();
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSent(false);
    setBusy(true);
    try {
      await pb.collection("app_requests").create({ requester: user.id, title: title.trim(), link: link.trim(), details: details.trim() });
      setSent(true); setTitle(""); setLink(""); setDetails("");
      load();
    } catch {
      setErr("We couldn't send that just now. Please check it and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="absolute inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3" onPointerDown={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="rq-t" onSubmit={submit} onPointerDown={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gg-line2 bg-gg-panel p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="rq-t" className="font-display text-xl font-bold">Request an app</h2>
            <p className="text-sm text-gg-fg2">Tell us what you would like on the desktop. Every request is saved and waiting for us.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`grid size-11 shrink-0 place-items-center rounded-lg hover:bg-gg-raised ${focusRing}`}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        <div className="mb-3">
          <label htmlFor="rq-n" className="mb-1 block text-sm font-medium">App name</label>
          <input ref={first} id="rq-n" required maxLength={120} className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label htmlFor="rq-l" className="mb-1 block text-sm font-medium">Link to the app (optional)</label>
          <input id="rq-l" type="url" maxLength={500} placeholder="https://github.com/…" className={field} value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="mb-4">
          <label htmlFor="rq-d" className="mb-1 block text-sm font-medium">What should it do? (optional)</label>
          <textarea id="rq-d" rows={3} maxLength={2000} className={`${field} py-2`} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        {err && <p role="alert" className="mb-3 text-sm text-gg-error">{err}</p>}
        {sent && <p role="status" className="mb-3 text-sm text-gg-ok">Thanks! Your request is saved.</p>}
        <button disabled={busy} className={`min-h-11 w-full rounded-lg bg-gg-accent font-semibold text-gg-onaccent disabled:opacity-60 ${focusRing}`}>{busy ? "Sending…" : "Send request"}</button>
        {mine.length > 0 && (
          <div className="mt-4 border-t border-gg-line pt-3">
            <h3 className="mb-1 text-sm font-semibold">Your requests</h3>
            <ul className="max-h-28 overflow-y-auto text-sm text-gg-fg2">{mine.map((r) => <li key={r.id} className="truncate py-0.5">{r.title}</li>)}</ul>
          </div>
        )}
      </form>
    </div>
  );
}

const KINDS = [["general", "General"], ["idea", "An idea"], ["problem", "A problem"], ["praise", "Something I like"]];

function Modal({ id, title, sub, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3" onPointerDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby={id} onPointerDown={(e) => e.stopPropagation()} className={`flex max-h-full w-full flex-col overflow-y-auto rounded-2xl border border-gg-line2 bg-gg-panel p-5 shadow-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><h2 id={id} className="font-display text-xl font-bold">{title}</h2><p className="text-sm text-gg-fg2">{sub}</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className={`grid size-11 shrink-0 place-items-center rounded-lg hover:bg-gg-raised ${focusRing}`}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Settings({ user, onClose }) {
  const [oldPw, setOld] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setDone(false);
    if (pw.length < 8) return setErr("Your new password needs at least 8 characters.");
    if (pw !== pw2) return setErr("The two new passwords don't match.");
    if (pw === oldPw) return setErr("Your new password should be different from the current one.");
    setBusy(true);
    try {
      const login = user.email;
      await pb.collection("os_users").update(user.id, { oldPassword: oldPw, password: pw, passwordConfirm: pw2 });
      await pb.collection("os_users").authWithPassword(login, pw);
      setDone(true); setOld(""); setPw(""); setPw2("");
    } catch (x) {
      const bad = x?.response?.data?.oldPassword;
      if (bad) setErr("Your current password isn't right. Please try again.");
      else if (pb.authStore.isValid) setErr("We couldn't change your password. Please try again in a moment.");
      else { pb.authStore.clear(); window.location.reload(); }
    } finally { setBusy(false); }
  };
  return (
    <Modal id="st-t" title="Settings" sub={"Signed in as " + shownName(user)} onClose={onClose}>
      <form onSubmit={submit} autoComplete="off">
        <h3 className="mb-2 text-base font-semibold">Change your password</h3>
        <input type="text" name="username" value={shownName(user).replace(/^@/, "")} readOnly hidden autoComplete="username" />
        <div className="mb-3"><label htmlFor="st-o" className="mb-1 block text-sm font-medium">Current password</label>
          <input id="st-o" type="password" required className={field} value={oldPw} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" /></div>
        <div className="mb-3"><label htmlFor="st-n" className="mb-1 block text-sm font-medium">New password (at least 8 characters)</label>
          <input id="st-n" type="password" required minLength={8} className={field} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
        <div className="mb-3"><label htmlFor="st-c" className="mb-1 block text-sm font-medium">Type the new password again</label>
          <input id="st-c" type="password" required minLength={8} className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
        {err && <p role="alert" className="mb-3 text-sm text-gg-error">{err}</p>}
        {done && <p role="status" className="mb-3 text-sm text-gg-ok">Your password has been changed. You're still signed in.</p>}
        <button disabled={busy} className={`min-h-11 w-full rounded-lg bg-gg-accent px-5 text-sm font-semibold text-gg-onaccent disabled:opacity-60 ${focusRing}`}>{busy ? "Saving…" : "Change password"}</button>
      </form>
    </Modal>
  );
}

function Feedback({ user, onClose }) {
  const [kind, setKind] = useState("general");
  const [rating, setRating] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setSent(false); setBusy(true);
    try {
      await pb.collection("app_feedback").create({ author: user.id, kind, rating: rating || null, message: msg.trim() });
      setSent(true); setMsg(""); setRating(0);
    } catch { setErr("We couldn't send that. Please try again in a moment."); }
    finally { setBusy(false); }
  };
  return (
    <Modal id="fb-t" title="Send feedback" sub="Tell us what you think of Giggle OS. Every message is saved and waiting for us." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mb-3"><label htmlFor="fb-k" className="mb-1 block text-sm font-medium">What is it about?</label>
          <select id="fb-k" className={field} value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
        <fieldset className="mb-3"><legend className="mb-1 text-sm font-medium">How is it going so far? (optional)</legend>
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={rating === n} aria-label={`${n} out of 5`} onClick={() => setRating(rating === n ? 0 : n)} className={`grid size-11 place-items-center rounded-lg border text-lg ${n <= rating ? "border-gg-accentline bg-gg-accent text-gg-onaccent" : "border-gg-line2 text-gg-fg2 hover:bg-gg-raised"} ${focusRing}`}>★</button>))}</div></fieldset>
        <div className="mb-3"><label htmlFor="fb-m" className="mb-1 block text-sm font-medium">Your feedback</label>
          <textarea id="fb-m" required rows={5} maxLength={2000} className={`${field} py-2`} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        {err && <p role="alert" className="mb-3 text-sm text-gg-error">{err}</p>}
        {sent && <p role="status" className="mb-3 text-sm text-gg-ok">Thank you! Your feedback has been saved.</p>}
        <button disabled={busy || !msg.trim()} className={`min-h-11 w-full rounded-lg bg-gg-accent px-5 text-sm font-semibold text-gg-onaccent disabled:opacity-60 ${focusRing}`}>{busy ? "Sending…" : "Send feedback"}</button>
      </form>
    </Modal>
  );
}

function AdminFeedback({ onClose }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const ctl = new AbortController();
    pb.collection("app_feedback").getList(1, 100, { sort: "-created", expand: "author", signal: ctl.signal })
      .then((r) => setItems(r.items)).catch((e) => { if (!e?.isAbort) setErr(true); });
    return () => ctl.abort();
  }, []);
  return (
    <Modal id="af-t" wide title="Feedback" sub={items ? `${items.length} message${items.length === 1 ? "" : "s"}, newest first` : "Everything people have told you."} onClose={onClose}>
      {err && <p role="alert" className="text-gg-error">We couldn't load the feedback. Close this and try again.</p>}
      {!err && !items && <p className="text-gg-fg2">Loading…</p>}
      {items && items.length === 0 && <p className="text-gg-fg2">No feedback yet. It will show up here as soon as someone sends it.</p>}
      <ul className="grid gap-3">{(items || []).map((r) => (
        <li key={r.id} className="rounded-xl border border-gg-line bg-gg-panel2 p-3">
          <p className="font-semibold">{KINDS.find((k) => k[0] === r.kind)?.[1] || "General"}{r.rating ? <span className="ml-2 text-gg-accent-text" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}</span> : null}</p>
          <p className="text-sm text-gg-fg2">From {shownName(r.expand?.author) || "unknown user"} on {new Date(r.created).toLocaleDateString()}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{r.message}</p>
        </li>))}</ul>
    </Modal>
  );
}

function AdminRequests({ onClose }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const ctl = new AbortController();
    pb.collection("app_requests").getList(1, 100, { sort: "-created", expand: "requester", signal: ctl.signal })
      .then((r) => setItems(r.items))
      .catch((e) => { if (!e?.isAbort) setErr(true); });
    return () => { window.removeEventListener("keydown", k); ctl.abort(); };
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3" onPointerDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="ad-t" onPointerDown={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl border border-gg-line2 bg-gg-panel p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="ad-t" className="font-display text-xl font-bold">App requests</h2>
            <p className="text-sm text-gg-fg2">{items ? `${items.length} request${items.length === 1 ? "" : "s"}, newest first` : "Everything people have asked for."}</p>
          </div>
          <button type="button" autoFocus onClick={onClose} aria-label="Close" className={`grid size-11 shrink-0 place-items-center rounded-lg hover:bg-gg-raised ${focusRing}`}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        {err && <p role="alert" className="text-gg-error">We couldn't load the requests. Close this and try again.</p>}
        {!err && !items && <p className="text-gg-fg2">Loading…</p>}
        {items && items.length === 0 && <p className="text-gg-fg2">No requests yet. They will show up here as soon as someone sends one.</p>}
        {items && items.length > 0 && (
          <ul className="min-h-0 divide-y divide-gg-line overflow-y-auto">
            {items.map((r) => (
              <li key={r.id} className="py-3">
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-gg-fg2">From {r.expand?.requester?.name || "Someone"} ({shownName(r.expand?.requester) || "unknown user"}) on {new Date(r.created).toLocaleDateString()}</p>
                {r.link && <p className="text-sm"><a href={r.link} target="_blank" rel="noopener noreferrer" className="break-all text-gg-accent-text underline">{r.link}</a></p>}
                {r.details && <p className="mt-1 whitespace-pre-wrap text-sm">{r.details}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const WALLS = [
  { id: "sunrise", name: "Sunrise", a: "var(--c-accent)", b: "var(--c-accent2)" },
  { id: "ocean", name: "Ocean", a: "#3a8dde", b: "#2fc9c0" },
  { id: "forest", name: "Forest", a: "#3f9a5c", b: "#b5c94a" },
  { id: "dusk", name: "Dusk", a: "#7a5cd6", b: "#e0609a" },
  { id: "ember", name: "Ember", a: "#e0607a", b: "#f2a65a" },
  { id: "plain", name: "Plain", a: null, b: null },
];
const wallCss = (w) => (w.a ? `radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${w.a} 24%, transparent), transparent 55%), radial-gradient(ellipse at 90% 90%, color-mix(in srgb, ${w.b} 18%, transparent), transparent 50%)` : "none");
const ACCENTS = [
  { id: "amber", name: "Amber", c: "#ffb347", c2: "#ffc56e", lt: "#8a4b00", ll: "#b35c00" },
  { id: "sky", name: "Sky", c: "#6cc4ff", c2: "#9ad8ff", lt: "#005f99", ll: "#00669e" },
  { id: "mint", name: "Mint", c: "#6fe0a8", c2: "#9aeac3", lt: "#0b6b3f", ll: "#0e7a47" },
  { id: "rose", name: "Rose", c: "#ff8fb1", c2: "#ffb3cb", lt: "#a3194f", ll: "#b01c57" },
  { id: "violet", name: "Violet", c: "#b9a2ff", c2: "#d0c0ff", lt: "#5b35c2", ll: "#6540cf" },
  { id: "coral", name: "Coral", c: "#ff8a73", c2: "#ffb09f", lt: "#a8341c", ll: "#b83a20" },
];
const ICON_SIZES = [{ id: "s", name: "Small", px: 40, w: 84 }, { id: "m", name: "Medium", px: 48, w: 96 }, { id: "l", name: "Large", px: 64, w: 116 }];
const DEFAULT_PREFS = { wall: "sunrise", accent: "amber", icons: "m", folders: [], order: [], taskbar: "bottom", clock24: false, wallFile: "" };
const FOLDER_COLORS = [["Gold", "#e0a84a"], ["Sky", "#6cc4ff"], ["Mint", "#6fe0a8"], ["Rose", "#ff8fb1"], ["Violet", "#b9a2ff"], ["Coral", "#ff8a73"]];
const makeFolder = (list) => ({ id: Math.random().toString(36).slice(2, 9), name: "New folder", color: FOLDER_COLORS[list.length % FOLDER_COLORS.length][1], apps: [] });

function FolderTile({ name, color, size, w, onClick, labelCls = "", dashed, onDropApp }) {
  const [over, setOver] = useState(false);
  return (
    <button onClick={onClick}
      onDragOver={onDropApp ? (e) => { e.preventDefault(); setOver(true); } : undefined}
      onDragLeave={onDropApp ? () => setOver(false) : undefined}
      onDrop={onDropApp ? (e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData("text/giggle-app"); if (id) onDropApp(id); } : undefined} style={{ width: w }} className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-sm font-medium hover:bg-gg-raised/70 ${over ? "scale-110 bg-gg-raised" : ""} ${focusRing}`}>
      <span className={`grid place-items-center rounded-xl ${dashed ? "border-2 border-dashed border-gg-line2 text-gg-fg" : "text-[#1b1410]"}`} style={{ width: size, height: size, background: dashed ? undefined : color }}>
        {dashed ? <FolderPlusIcon size={size * 0.5} aria-hidden="true" /> : <FolderIcon size={size * 0.55} aria-hidden="true" />}
      </span>
      <span className={`leading-tight ${labelCls}`}>{name}</span>
    </button>
  );
}

function FolderManager({ prefs, setPrefs, apps, onClose }) {
  const folders = prefs.folders || [];
  const [fresh, setFresh] = useState(null);
  const setFolders = (fn) => setPrefs((p) => ({ ...p, folders: fn(p.folders || []) }));
  const add = () => { if (folders.length >= 12) return; const f = makeFolder(folders); setFresh(f.id); setFolders((l) => [...l, f]); };
  const upd = (id, patch) => setFolders((l) => l.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const toggle = (id, appId, on) => setFolders((l) => l.map((f) => (f.id === id ? { ...f, apps: on ? [...f.apps.filter((x) => x !== appId), appId] : f.apps.filter((x) => x !== appId) } : on ? { ...f, apps: f.apps.filter((x) => x !== appId) } : f)));
  const del = (id) => setFolders((l) => l.filter((f) => f.id !== id));
  return (
    <Modal id="fm-t" title="Desktop folders" sub="Group your apps into folders. Your folders are saved to your account." onClose={onClose} wide>
      {folders.length === 0 && <p className="mb-3 rounded-lg bg-gg-panel2 p-4 text-sm text-gg-fg2">You don’t have any folders yet. Make one, give it a name, and tick the apps you want inside it.</p>}
      <div className="grid gap-3">
        {folders.map((f) => (
          <section key={f.id} aria-label={f.name} className="rounded-xl border border-gg-line2 bg-gg-panel2 p-3">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={`fn-${f.id}`} className="mb-1 block text-sm font-semibold">Folder name</label>
                <input id={`fn-${f.id}`} autoFocus={f.id === fresh} maxLength={24} value={f.name} onChange={(e) => upd(f.id, { name: e.target.value })} onBlur={() => !f.name.trim() && upd(f.id, { name: "Folder" })} className={field} />
              </div>
              <button type="button" onClick={() => del(f.id)} className={`min-h-11 shrink-0 rounded-lg border border-gg-line2 px-3 text-sm font-medium hover:bg-gg-raised ${focusRing}`}>Delete folder</button>
            </div>
            <fieldset className="mt-3"><legend className="mb-1 text-sm font-semibold">Color</legend>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(([n, c]) => (
                  <button key={c} type="button" aria-pressed={f.color === c} onClick={() => upd(f.id, { color: c })} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${f.color === c ? "border-gg-accentline ring-2 ring-gg-accent" : "border-gg-line2 hover:bg-gg-raised"} ${focusRing}`}>
                    <span className="size-4 rounded-full border border-gg-line2" style={{ background: c }} aria-hidden="true" />{n}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-3"><legend className="mb-1 text-sm font-semibold">Apps inside</legend>
              <ul className="grid gap-1 sm:grid-cols-2">
                {apps.map((a) => (
                  <li key={a.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-gg-raised">
                      <input type="checkbox" checked={f.apps.includes(a.id)} onChange={(e) => toggle(f.id, a.id, e.target.checked)} className={`size-5 accent-[var(--c-accent)] ${focusRing}`} />
                      <AppTile app={a} size={26} /><span className="text-sm">{a.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </section>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button type="button" onClick={add} disabled={folders.length >= 12} className={`flex min-h-11 items-center gap-2 rounded-lg border border-gg-line2 px-4 text-sm font-semibold hover:bg-gg-raised disabled:opacity-50 ${focusRing}`}><FolderPlusIcon size={16} aria-hidden="true" />New folder</button>
        <button type="button" onClick={onClose} className={`min-h-11 rounded-lg bg-gg-accent px-5 text-sm font-semibold text-gg-onaccent ${focusRing}`}>Done</button>
      </div>
    </Modal>
  );
}

function Customize({ prefs, setPrefs, theme, setTheme, onClose, onFolders }) {
  const [pics, setPics] = useState([]);
  useEffect(() => {
    const ctl = new AbortController();
    pb.collection("os_files").getFullList({ filter: 'kind="file" && mime ~ "image/"', sort: "name", fields: "id,name", signal: ctl.signal, requestKey: null }).then(setPics).catch(() => {});
    return () => ctl.abort();
  }, []);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const set = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const opt = (on) => `flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium ${on ? "border-gg-accentline bg-gg-raised text-gg-fg ring-2 ring-gg-accent" : "border-gg-line2 text-gg-fg2 hover:bg-gg-raised"} ${focusRing}`;
  return (
    <div className="absolute inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/60 p-3" onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="cz-t" onPointerDown={(e) => e.stopPropagation()} className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-gg-line2 bg-gg-panel p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="cz-t" className="font-display text-xl font-bold">Customize your desktop</h2>
            <p className="text-sm text-gg-fg2">Changes show right away and are saved to your account.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`grid size-11 shrink-0 place-items-center rounded-lg hover:bg-gg-raised ${focusRing}`}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Wallpaper</legend>
          <div className="grid grid-cols-3 gap-2">
            {WALLS.map((w) => (
              <button key={w.id} type="button" aria-pressed={prefs.wall === w.id} onClick={() => set("wall", w.id)} className={`${opt(prefs.wall === w.id)} flex-col !gap-1 py-2`}>
                <span className="block h-8 w-full rounded-md border border-gg-line bg-gg-base" style={{ backgroundImage: wallCss(w) }} aria-hidden="true" />
                {w.name}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="-mt-2 mb-4">
          <label htmlFor="cz-pic" className="mb-1 block text-sm font-semibold">Or use a picture from your Files</label>
          <select id="cz-pic" value={prefs.wallFile || ""} onChange={(e) => set("wallFile", e.target.value)} className={field}>
            <option value="">No picture — use the colors above</option>
            {pics.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            {prefs.wallFile && !pics.some((p) => p.id === prefs.wallFile) && <option value={prefs.wallFile}>Current picture</option>}
          </select>
          {pics.length === 0 && <p className="mt-1 text-xs text-gg-fg2">Upload a picture in Files and it will show up here.</p>}
        </div>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Accent color</legend>
          <div className="grid grid-cols-3 gap-2">
            {ACCENTS.map((c) => (
              <button key={c.id} type="button" aria-pressed={prefs.accent === c.id} onClick={() => set("accent", c.id)} className={opt(prefs.accent === c.id)}>
                <span className="size-4 rounded-full border border-gg-line2" style={{ background: c.c }} aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Icon size</legend>
          <div className="grid grid-cols-3 gap-2">
            {ICON_SIZES.map((s) => <button key={s.id} type="button" aria-pressed={prefs.icons === s.id} onClick={() => set("icons", s.id)} className={opt(prefs.icons === s.id)}>{s.name}</button>)}
          </div>
        </fieldset>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Taskbar</legend>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={prefs.taskbar !== "top"} onClick={() => set("taskbar", "bottom")} className={opt(prefs.taskbar !== "top")}>At the bottom</button>
            <button type="button" aria-pressed={prefs.taskbar === "top"} onClick={() => set("taskbar", "top")} className={opt(prefs.taskbar === "top")}>At the top</button>
          </div>
        </fieldset>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Clock</legend>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={!prefs.clock24} onClick={() => set("clock24", false)} className={opt(!prefs.clock24)}>12-hour</button>
            <button type="button" aria-pressed={!!prefs.clock24} onClick={() => set("clock24", true)} className={opt(!!prefs.clock24)}>24-hour</button>
          </div>
        </fieldset>
        <div className="mb-4"><button type="button" onClick={onFolders} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gg-line2 px-3 text-sm font-medium hover:bg-gg-raised ${focusRing}`}><FolderPlusIcon size={16} aria-hidden="true" />Organise apps into folders</button></div>
        <fieldset className="mb-4"><legend className="mb-2 text-sm font-semibold">Theme</legend>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} className={opt(theme === "dark")}><MoonIcon size={16} aria-hidden="true" />Dark</button>
            <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")} className={opt(theme === "light")}><SunIcon size={16} aria-hidden="true" />Light</button>
          </div>
        </fieldset>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => setPrefs((p) => ({ ...DEFAULT_PREFS, folders: p.folders || [] }))} className={`min-h-11 rounded-lg px-3 text-sm text-gg-accent-text underline ${focusRing}`}>Reset to default</button>
          <button type="button" onClick={onClose} className={`min-h-11 rounded-lg bg-gg-accent px-5 text-sm font-semibold text-gg-onaccent ${focusRing}`}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Desktop({ user, onSignOut }) {
  const mobile = useMobile();
  const area = useRef(null);
  const zTop = useRef(10);
  const [wins, setWins] = useState([]);
  const [start, setStart] = useState(false);
  const [req, setReq] = useState(false);
  const [folder, setFolder] = useState(null);
  const [fm, setFm] = useState(false);
  const [wallUrl, setWallUrl] = useState("");
  const [adm, setAdm] = useState(false);
  const [cz, setCz] = useState(false);
  const [fb, setFb] = useState(false);
  const [stg, setStg] = useState(false);
  const [afb, setAfb] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const prefId = useRef(null);
  const prefsLoaded = useRef(false);
  const prefsChain = useRef(Promise.resolve());
  const [now, setNow] = useState(() => new Date());
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        const rec = await pb.collection("os_data").getFirstListItem('appId="desktop-prefs"', { signal: ctl.signal });
        prefId.current = rec.id;
        if (rec.blob) {
          const res = await fetch(pb.files.getURL(rec, rec.blob), { signal: ctl.signal });
          if (res.ok) {
            const p = await res.json();
            setPrefs({ ...DEFAULT_PREFS, ...p, folders: Array.isArray(p.folders) ? p.folders : [] });
            if (p.theme === "light" || p.theme === "dark") setTheme(p.theme);
          }
        }
      } catch { /* first visit or offline: keep defaults */ }
      if (!ctl.signal.aborted) prefsLoaded.current = true;
    })();
    return () => ctl.abort();
  }, []);
  useEffect(() => {
    if (!prefsLoaded.current) return;
    const t = setTimeout(() => {
      const body = JSON.stringify({ ...prefs, theme });
      prefsChain.current = prefsChain.current.then(async () => {
        const fd = new FormData();
        fd.append("blob", new Blob([body], { type: "application/json" }), "data.json");
        if (prefId.current) await pb.collection("os_data").update(prefId.current, fd);
        else {
          fd.append("owner", user.id);
          fd.append("appId", "desktop-prefs");
          prefId.current = (await pb.collection("os_data").create(fd)).id;
        }
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [prefs, theme, user.id]);
  useEffect(() => {
    const r = document.documentElement.style;
    const c = ACCENTS.find((x) => x.id === prefs.accent) || ACCENTS[0];
    const light = theme === "light";
    r.setProperty("--c-accent", c.c); r.setProperty("--c-accent2", c.c2);
    r.setProperty("--c-accenttext", light ? c.lt : c.c); r.setProperty("--c-accentline", light ? c.ll : c.c);
    return () => ["--c-accent", "--c-accent2", "--c-accenttext", "--c-accentline"].forEach((k) => r.removeProperty(k));
  }, [prefs.accent, theme]);
  useEffect(() => {
    if (!prefs.wallFile) { setWallUrl(""); return; }
    const ctl = new AbortController();
    (async () => {
      try {
        const rec = await pb.collection("os_files").getOne(prefs.wallFile, { signal: ctl.signal, requestKey: null });
        const token = await pb.files.getToken({ signal: ctl.signal, requestKey: null });
        setWallUrl(pb.files.getURL(rec, rec.file, { token }));
      } catch { if (!ctl.signal.aborted) setWallUrl(""); }
    })();
    return () => ctl.abort();
  }, [prefs.wallFile]);
  const folders = prefs.folders || [];
  const inFolder = new Set(folders.flatMap((f) => f.apps));
  const [dropKey, setDropKey] = useState(null);
  const baseTiles = [
    ...MAIN_APPS.filter((a) => !inFolder.has(a.id)).map((a) => ({ key: a.id, app: a })),
    { key: "games", id: "games", name: "Games", color: "#e0a84a" },
    ...folders.map((f) => ({ key: "f:" + f.id, id: f.id, name: f.name, color: f.color })),
  ];
  const ord = prefs.order || [];
  const deskTiles = [...baseTiles].sort((x, y) => { const i = ord.indexOf(x.key), j = ord.indexOf(y.key); return (i < 0 ? 1e6 : i) - (j < 0 ? 1e6 : j) || baseTiles.indexOf(x) - baseTiles.indexOf(y); });
  const dropOnTile = (from, to) => {
    if (!from || from === to) return;
    const target = to.startsWith("f:") ? folders.find((f) => "f:" + f.id === to) : null;
    const isApp = !from.startsWith("f:") && from !== "games";
    if (target && isApp) {
      setPrefs((p) => ({ ...p, folders: (p.folders || []).map((x) => ({ ...x, apps: x.id === target.id ? [...x.apps.filter((y) => y !== from), from] : x.apps.filter((y) => y !== from) })) }));
      return;
    }
    const keys = deskTiles.map((t) => t.key).filter((k) => k !== from);
    keys.splice(Math.max(0, keys.indexOf(to)), 0, from);
    setPrefs((p) => ({ ...p, order: keys }));
  };
  const takeOut = (appId) => setPrefs((p) => ({ ...p, folders: (p.folders || []).map((x) => ({ ...x, apps: x.apps.filter((y) => y !== appId) })) }));
  const lbl = wallUrl ? "rounded-md bg-gg-base/85 px-1.5 py-0.5" : "";
  const top = prefs.taskbar === "top";
  const wall = WALLS.find((w) => w.id === prefs.wall) || WALLS[0];
  const isz = ICON_SIZES.find((s) => s.id === prefs.icons) || ICON_SIZES[1];
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!start) return;
    const k = (e) => e.key === "Escape" && setStart(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [start]);

  const front = (id) => setWins((w) => w.map((x) => (x.id === id ? { ...x, z: ++zTop.current, min: false } : x)));
  const open = (app) => {
    setStart(false);
    const ex = wins.find((w) => w.appId === app.id);
    if (ex) return front(ex.id);
    const n = wins.length;
    const W = area.current?.clientWidth || 1000;
    const H = area.current?.clientHeight || 600;
    const w = Math.min(980, W - 40), h = Math.min(640, H - 30);
    setWins((l) => [...l, { id: app.id, appId: app.id, x: Math.max(8, (W - w) / 2 + n * 28 - 28), y: Math.max(8, (H - h) / 2 + n * 22 - 22), w, h, z: ++zTop.current, min: false, max: false }]);
  };
  const patch = (id, p) => setWins((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const close = (id) => setWins((l) => l.filter((x) => x.id !== id));
  const topId = useMemo(() => wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0]?.id, [wins]);

  const drag = (e, w) => {
    if (mobile || w.max || e.target.closest("button")) return;
    const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      const W = area.current.clientWidth, H = area.current.clientHeight;
      patch(w.id, { x: Math.min(W - 80, Math.max(-w.w + 120, ox + ev.clientX - sx)), y: Math.min(H - 36, Math.max(0, oy + ev.clientY - sy)) });
    };
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
  };
  const resize = (e, w) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ow = w.w, oh = w.h;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const mv = (ev) => patch(w.id, { w: Math.max(320, ow + ev.clientX - sx), h: Math.max(240, oh + ev.clientY - sy) });
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
  };

  const ctl = `grid size-9 place-items-center rounded-md text-gg-fg hover:bg-gg-raised ${focusRing}`;

  return (
    <div className={`relative flex h-dvh overflow-hidden bg-gg-base text-gg-fg ${top ? "flex-col-reverse" : "flex-col"}`} style={wallUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2)),url("${wallUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundImage: wallCss(wall) }}>
      <main ref={area} className="relative min-h-0 flex-1 overflow-hidden" onPointerDown={() => setStart(false)}>
        <h1 className="sr-only">Giggle OS desktop</h1>
        <ul className="pointer-events-none absolute inset-3 flex flex-col flex-wrap content-start gap-1">
          {deskTiles.map((t) => (
            <li key={t.key} draggable onDragStart={(e) => { e.dataTransfer.setData("text/giggle-tile", t.key); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={(e) => { e.preventDefault(); setDropKey(t.key); }} onDragLeave={() => setDropKey((k) => (k === t.key ? null : k))}
              onDrop={(e) => { e.preventDefault(); setDropKey(null); dropOnTile(e.dataTransfer.getData("text/giggle-tile"), t.key); }}
              className={`pointer-events-auto rounded-xl ${dropKey === t.key ? "bg-gg-raised ring-2 ring-gg-accent" : ""}`}>
              {t.app ? (
                <button onClick={() => open(t.app)} style={{ width: isz.w }} className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-sm font-medium hover:bg-gg-raised/70 ${focusRing}`}>
                  <AppTile app={t.app} size={isz.px} />
                  <span className={`leading-tight ${lbl}`}>{t.app.name}</span>
                </button>
              ) : (
                <FolderTile name={t.name} color={t.color} size={isz.px} w={isz.w} labelCls={lbl} onClick={() => setFolder(t.id)} />
              )}
            </li>
          ))}
          <li className="pointer-events-auto"><FolderTile dashed name="New folder" size={isz.px} w={isz.w} labelCls={lbl} onClick={() => { setPrefs((p) => ({ ...p, folders: (p.folders || []).length >= 12 ? p.folders : [...(p.folders || []), makeFolder(p.folders || [])] })); setFm(true); }} /></li>
          <li className="pointer-events-auto">
            <button onClick={() => setReq(true)} style={{ width: isz.w }} className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-sm font-medium hover:bg-gg-raised/70 ${focusRing}`}>
              <span className="grid place-items-center rounded-xl border-2 border-dashed border-gg-line2 text-gg-fg" style={{ width: isz.px, height: isz.px }}><PlusIcon size={isz.px * 0.5} aria-hidden="true" /></span>
              <span className={`leading-tight ${lbl}`}>Request an app</span>
            </button>
          </li>
        </ul>
        {wins.map((w) => {
          const app = APPS.find((a) => a.id === w.appId);
          const full = mobile || w.max;
          const style = full ? { inset: 0, zIndex: w.z } : { left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z };
          return (
            <section key={w.id} aria-label={app.name} hidden={w.min} onPointerDown={() => w.id !== topId && front(w.id)} className={`absolute flex flex-col overflow-hidden border border-gg-line2 bg-gg-panel shadow-2xl ${full ? "" : "rounded-xl"} ${w.id === topId ? "" : "opacity-95"}`} style={style}>
              <header onPointerDown={(e) => drag(e, w)} onDoubleClick={() => !mobile && patch(w.id, { max: !w.max })} className="flex h-11 shrink-0 touch-none items-center gap-2 border-b border-gg-line bg-gg-panel2 pl-3 pr-1 select-none">
                <AppTile app={app} size={24} />
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{app.name}</h2>
                <button className={ctl} onClick={() => patch(w.id, { min: true })} aria-label={`Minimise ${app.name}`}><MinusIcon size={16} aria-hidden="true" /></button>
                {!mobile && <button className={ctl} onClick={() => patch(w.id, { max: !w.max })} aria-label={w.max ? `Restore ${app.name}` : `Maximise ${app.name}`}>{w.max ? <CopyIcon size={14} aria-hidden="true" /> : <SquareIcon size={14} aria-hidden="true" />}</button>}
                <button className={ctl} onClick={() => close(w.id)} aria-label={`Close ${app.name}`}><XIcon size={16} aria-hidden="true" /></button>
              </header>
              <div className="min-h-0 flex-1">
                {app.kind === "files" ? <FileManager user={user} /> : app.kind === "calculator" ? <Calculator /> : app.kind === "clock" ? <ClockTimer /> : app.kind === "calendar" ? <CalendarApp user={user} /> : app.kind === "editor" ? <TextEditor user={user} /> : app.kind === "music" ? <MusicPlayer user={user} /> : app.kind === "videos" ? <VideoPlayer user={user} /> : app.kind === "tips" ? <Tips /> : app.kind === "share" ? <Share user={user} /> : app.kind === "browser" ? <Browser user={user} /> : <HtmlApp app={app} userId={user.id} />}
              </div>
              {!full && <div onPointerDown={(e) => resize(e, w)} aria-hidden="true" className="absolute bottom-0 right-0 size-5 cursor-nwse-resize touch-none" />}
            </section>
          );
        })}
        {adm && user.role === "admin" && <AdminRequests onClose={() => setAdm(false)} />}
        {folder === "games" && <FolderView title="Games" sub="Pick a game to play in its own window." apps={GAMES} onClose={() => setFolder(null)} onPick={(g) => { setFolder(null); open(g); }} />}
        {folder && folder !== "games" && (() => {
          const f = folders.find((x) => x.id === folder);
          if (!f) return null;
          return <FolderView title={f.name} sub="Pick an app to open." apps={f.apps.map((id) => APPS.find((a) => a.id === id)).filter(Boolean)} onClose={() => setFolder(null)} onPick={(g) => { setFolder(null); open(g); }} onEdit={() => { setFolder(null); setFm(true); }} onTakeOut={takeOut} />;
        })()}
        {fm && <FolderManager prefs={prefs} setPrefs={setPrefs} apps={MAIN_APPS} onClose={() => setFm(false)} />}
        {cz && <Customize prefs={prefs} setPrefs={setPrefs} theme={theme} setTheme={setTheme} onClose={() => setCz(false)} onFolders={() => { setCz(false); setFm(true); }} />}
        {fb && <Feedback user={user} onClose={() => setFb(false)} />}
        {stg && <Settings user={user} onClose={() => setStg(false)} />}
        {afb && <AdminFeedback onClose={() => setAfb(false)} />}
        {req && <RequestApp user={user} onClose={() => setReq(false)} />}
        {start && (
          <div onPointerDown={(e) => e.stopPropagation()} role="dialog" aria-label="Start menu" className={`absolute left-2 z-[9999] ${top ? "top-2" : "bottom-2"} w-[min(22rem,calc(100%-1rem))] max-h-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-gg-line2 bg-gg-panel p-3 shadow-2xl`}>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gg-fg2">Apps</p>
            <ul>
              {MAIN_APPS.map((a) => (
                <li key={a.id}>
                  <button onClick={() => open(a)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gg-raised ${focusRing}`}>
                    <AppTile app={a} />
                    <span><span className="block text-sm font-semibold">{a.name}</span><span className="block text-xs text-gg-fg2">{a.blurb}</span></span>
                  </button>
                </li>
              ))}
              <li><button onClick={() => { setStart(false); setFolder("games"); }} className={`flex min-h-12 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gg-raised ${focusRing}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e0a84a] text-[#1b1410]"><FolderIcon size={22} aria-hidden="true" /></span><span><span className="block text-sm font-semibold">Games</span><span className="block text-xs text-gg-fg2">{GAMES.length} games to play</span></span></button></li>
            </ul>
            <div className="mt-2 border-t border-gg-line pt-2">
              <button onClick={() => { setStart(false); setReq(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><PlusIcon size={16} aria-hidden="true" /> Request an app</button>
              {user.role === "admin" && <button onClick={() => { setStart(false); setAdm(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><InboxIcon size={16} aria-hidden="true" /> Admin: view requests</button>}
              <p className="truncate px-2 pb-1 text-sm text-gg-fg2">Signed in as {shownName(user)}</p>
              <button onClick={() => { setStart(false); setStg(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><SettingsIcon size={16} aria-hidden="true" />Settings</button>
              <button onClick={() => { setStart(false); setFb(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><MessageIcon size={16} aria-hidden="true" />Send feedback</button>
              {user.role === "admin" && <button onClick={() => { setStart(false); setAfb(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><MessageIcon size={16} aria-hidden="true" />Admin: view feedback</button>}
              <button onClick={() => { setStart(false); setFm(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><FolderPlusIcon size={16} aria-hidden="true" />Organise apps into folders</button>
              <button onClick={() => { setStart(false); setCz(true); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}><PaletteIcon size={16} aria-hidden="true" />Customize desktop</button>
              <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}>
                {theme === "light" ? <MoonIcon size={16} aria-hidden="true" /> : <SunIcon size={16} aria-hidden="true" />}
                {theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              </button>
              <button onClick={onSignOut} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-gg-raised ${focusRing}`}>
                <LogOutIcon size={16} aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        )}
      </main>
      <nav aria-label="Taskbar" className={`flex shrink-0 items-center gap-2 ${top ? "border-b" : "border-t"} border-gg-line bg-gg-panel px-2`} style={{ height: TASKBAR }}>
        <button onClick={() => setStart((s) => !s)} aria-expanded={start} className={`flex min-h-11 items-center gap-2 rounded-lg bg-gg-accent px-3 text-sm font-semibold text-gg-onaccent ${focusRing}`}>
          <GridIcon size={18} aria-hidden="true" /> <span className="hidden sm:inline">Start</span><span className="sm:hidden">Apps</span>
        </button>
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {wins.map((w) => {
            const app = APPS.find((a) => a.id === w.appId);
            const active = w.id === topId;
            return (
              <li key={w.id}>
                <button onClick={() => (active ? patch(w.id, { min: true }) : front(w.id))} aria-pressed={active} className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm ${active ? "bg-gg-raised" : "hover:bg-gg-raised/60"} ${focusRing}`}>
                  <AppTile app={app} size={22} />
                  <span className="hidden max-w-28 truncate sm:inline">{app.name}</span>
                  <span className="sr-only sm:hidden">{app.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <time dateTime={now.toISOString()} className="px-2 text-sm text-gg-fg2">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !prefs.clock24 })}</time>
      </nav>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => (pb.authStore.isValid ? pb.authStore.record : null));
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    pb.collection("os_users").authRefresh().then(() => setUser(pb.authStore.record)).catch(() => { pb.authStore.clear(); setUser(null); });
  }, []);
  if (!user) return <SignIn onDone={() => setUser(pb.authStore.record)} />;
  return <Desktop user={user} onSignOut={() => { pb.authStore.clear(); setUser(null); }} />;
}
