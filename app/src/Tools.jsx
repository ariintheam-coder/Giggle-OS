import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayIcon from "icon:play";
import PauseIcon from "icon:pause";
import PrevIcon from "icon:skip-back";
import NextIcon from "icon:skip-forward";
import ShuffleIcon from "icon:shuffle";
import RepeatIcon from "icon:repeat";
import PlusIcon from "icon:plus";
import TrashIcon from "icon:trash-2";
import XIcon from "icon:x";
import ChevL from "icon:chevron-left";
import ChevR from "icon:chevron-right";
import { pb } from "./lib/pb";
import { bigBlob } from "./lib/bigfile";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gg-accent";
const inputCls = `min-h-11 rounded-lg border border-gg-line2 bg-gg-panel2 px-3 text-gg-fg placeholder:text-gg-fg3 ${ring}`;
const btn = `min-h-11 rounded-lg border border-gg-line2 bg-gg-panel2 px-4 text-sm font-medium text-gg-fg hover:bg-gg-raised ${ring}`;
const primary = `min-h-11 rounded-lg bg-gg-accent px-4 text-sm font-semibold text-gg-onaccent hover:bg-gg-accent2 ${ring}`;
const iconBtn = `grid size-11 shrink-0 place-items-center rounded-lg text-gg-fg2 hover:bg-gg-raised hover:text-gg-fg ${ring}`;
const pad = (n) => String(n).padStart(2, "0");
const uid = () => Math.random().toString(36).slice(2, 10);

/* Per-account saved data (same storage the other apps use). */
function useSaved(user, appId, init) {
  const [data, setData] = useState(init);
  const [ready, setReady] = useState(false);
  const rec = useRef(null);
  const chain = useRef(Promise.resolve());
  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        const r = await pb.collection("os_data").getFirstListItem(`appId="${appId}"`, { signal: ctl.signal, requestKey: null });
        rec.current = r.id;
        if (r.blob) {
          const res = await fetch(pb.files.getURL(r, r.blob), { signal: ctl.signal });
          if (res.ok) setData(await res.json());
        }
      } catch { /* first visit */ }
      if (!ctl.signal.aborted) setReady(true);
    })();
    return () => ctl.abort();
  }, [appId]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const body = JSON.stringify(data);
      chain.current = chain.current.then(async () => {
        const fd = new FormData();
        fd.append("blob", new Blob([body], { type: "application/json" }), "data.json");
        if (rec.current) await pb.collection("os_data").update(rec.current, fd, { requestKey: null });
        else { fd.append("owner", user.id); fd.append("appId", appId); rec.current = (await pb.collection("os_data").create(fd, { requestKey: null })).id; }
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [data, ready, user.id, appId]);
  return [data, setData, ready];
}

/* ---------------- Calculator ---------------- */
const OPS = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => (b === 0 ? NaN : a / b) };
export function Calculator() {
  const [cur, setCur] = useState("0");
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const fmt = (n) => (Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : "Error");
  const digit = (d) => { if (cur === "Error") return; setCur(fresh || cur === "0" ? d : cur + d); setFresh(false); };
  const dot = () => { if (fresh || cur === "Error") { setCur("0."); setFresh(false); } else if (!cur.includes(".")) setCur(cur + "."); };
  const apply = () => (acc !== null && op ? OPS[op](acc, parseFloat(cur)) : parseFloat(cur));
  const pick = (o) => { if (cur === "Error") return; const v = fresh && op ? acc : apply(); setAcc(v); setCur(fmt(v)); setOp(o); setFresh(true); };
  const equals = () => { if (!op || cur === "Error") return; const v = apply(); setCur(fmt(v)); setAcc(null); setOp(null); setFresh(true); };
  const clear = () => { setCur("0"); setAcc(null); setOp(null); setFresh(true); };
  const back = () => { if (fresh || cur === "Error") return; setCur(cur.length > 1 && !(cur.length === 2 && cur[0] === "-") ? cur.slice(0, -1) : "0"); };
  const sign = () => { if (cur !== "0" && cur !== "Error") setCur(cur[0] === "-" ? cur.slice(1) : "-" + cur); };
  const percent = () => { if (cur !== "Error") { setCur(fmt(parseFloat(cur) / 100)); setFresh(true); } };
  const key = (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) digit(k); else if (k === ".") dot();
    else if (k === "+" || k === "-" || k === "*" || k === "/") pick({ "-": "−", "*": "×", "/": "÷", "+": "+" }[k]);
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); } else if (k === "Backspace") back(); else if (k === "Escape") clear();
  };
  const B = ({ children, onClick, kind, label }) => (
    <button type="button" onClick={onClick} aria-label={label} className={`min-h-14 rounded-xl text-xl font-semibold ${ring} ${kind === "op" ? "bg-gg-accent text-gg-onaccent hover:bg-gg-accent2" : kind === "fn" ? "bg-gg-raised text-gg-fg hover:bg-gg-panel3" : "bg-gg-panel2 text-gg-fg hover:bg-gg-raised"}`}>{children}</button>
  );
  return (
    <div onKeyDown={key} className="mx-auto flex h-full max-w-sm flex-col gap-3 overflow-y-auto bg-gg-panel p-4 text-gg-fg">
      <div className="min-h-8 text-right text-sm text-gg-fg2" aria-hidden="true">{acc !== null && op ? `${fmt(acc)} ${op}` : ""}</div>
      <output aria-live="polite" aria-label="Result" className="block overflow-x-auto rounded-xl bg-gg-panel2 px-4 py-4 text-right font-display text-4xl font-bold tabular-nums">{cur}</output>
      <div className="grid flex-1 grid-cols-4 gap-2">
        <B kind="fn" onClick={clear}>AC</B><B kind="fn" onClick={sign} label="Plus or minus">±</B><B kind="fn" onClick={percent} label="Percent">%</B><B kind="op" onClick={() => pick("÷")} label="Divide">÷</B>
        {["7", "8", "9"].map((d) => <B key={d} onClick={() => digit(d)}>{d}</B>)}<B kind="op" onClick={() => pick("×")} label="Multiply">×</B>
        {["4", "5", "6"].map((d) => <B key={d} onClick={() => digit(d)}>{d}</B>)}<B kind="op" onClick={() => pick("−")} label="Subtract">−</B>
        {["1", "2", "3"].map((d) => <B key={d} onClick={() => digit(d)}>{d}</B>)}<B kind="op" onClick={() => pick("+")} label="Add">+</B>
        <B onClick={() => digit("0")}>0</B><B onClick={dot} label="Decimal point">.</B><B kind="fn" onClick={back} label="Delete last digit">⌫</B><B kind="op" onClick={equals} label="Equals">=</B>
      </div>
    </div>
  );
}

/* ---------------- Clock, timer, stopwatch ---------------- */
function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((t) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.2); });
  } catch { /* no audio */ }
}
const hms = (ms, tenths) => { const s = Math.max(0, ms) / 1000, h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h ? pad(h) + ":" : ""}${pad(m)}:${pad(Math.floor(s % 60))}${tenths ? "." + Math.floor((s * 10) % 10) : ""}`; };
export function ClockTimer() {
  const [tab, setTab] = useState("clock");
  const [now, setNow] = useState(() => new Date());
  const [mins, setMins] = useState("5");
  const [secs, setSecs] = useState("0");
  const [left, setLeft] = useState(null);
  const [endAt, setEndAt] = useState(null);
  const [done, setDone] = useState(false);
  const [sw, setSw] = useState({ run: false, base: 0, start: 0 });
  const [laps, setLaps] = useState([]);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => { setNow(new Date()); tick((n) => n + 1); }, 100); return () => clearInterval(t); }, []);
  const remaining = endAt ? endAt - Date.now() : left;
  useEffect(() => { if (endAt && endAt - Date.now() <= 0) { setEndAt(null); setLeft(0); setDone(true); beep(); } });
  const total = (parseInt(mins) || 0) * 60000 + (parseInt(secs) || 0) * 1000;
  const swMs = sw.base + (sw.run ? Date.now() - sw.start : 0);
  const tabs = [["clock", "Clock"], ["timer", "Timer"], ["stopwatch", "Stopwatch"]];
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gg-panel p-4 text-gg-fg">
      <div role="tablist" aria-label="Clock tools" className="mb-4 flex gap-2">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`${btn} flex-1 ${tab === k ? "!bg-gg-accent !text-gg-onaccent" : ""}`}>{l}</button>)}
      </div>
      <div role="tabpanel" className="grid flex-1 place-content-center gap-4 text-center">
        {tab === "clock" && (<>
          <p className="font-display text-5xl font-bold tabular-nums sm:text-6xl">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
          <p className="text-lg text-gg-fg2">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <p className="text-sm text-gg-fg2">Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </>)}
        {tab === "timer" && (<>
          {remaining === null ? (
            <div className="flex items-end justify-center gap-2">
              <label className="grid gap-1 text-sm text-gg-fg2">Minutes<input type="number" min="0" max="999" value={mins} onChange={(e) => setMins(e.target.value)} className={`${inputCls} w-24 text-center text-2xl`} /></label>
              <label className="grid gap-1 text-sm text-gg-fg2">Seconds<input type="number" min="0" max="59" value={secs} onChange={(e) => setSecs(e.target.value)} className={`${inputCls} w-24 text-center text-2xl`} /></label>
            </div>
          ) : <p className="font-display text-6xl font-bold tabular-nums" role="timer">{hms(Math.ceil(remaining / 1000) * 1000)}</p>}
          {done && <p role="status" className="text-lg font-semibold text-gg-accent-text">Time's up!</p>}
          <div className="flex justify-center gap-2">
            {endAt ? <button className={primary} onClick={() => { setLeft(endAt - Date.now()); setEndAt(null); }}>Pause</button>
              : <button className={primary} disabled={remaining === null && total <= 0} onClick={() => { setDone(false); setEndAt(Date.now() + (left && left > 0 ? left : total)); }}>{left > 0 ? "Resume" : "Start"}</button>}
            <button className={btn} onClick={() => { setEndAt(null); setLeft(null); setDone(false); }}>Reset</button>
          </div>
        </>)}
        {tab === "stopwatch" && (<>
          <p className="font-display text-6xl font-bold tabular-nums">{hms(swMs, true)}</p>
          <div className="flex justify-center gap-2">
            <button className={primary} onClick={() => setSw(sw.run ? { run: false, base: swMs, start: 0 } : { run: true, base: sw.base, start: Date.now() })}>{sw.run ? "Stop" : sw.base ? "Resume" : "Start"}</button>
            <button className={btn} disabled={!sw.run} onClick={() => setLaps((l) => [swMs, ...l])}>Lap</button>
            <button className={btn} onClick={() => { setSw({ run: false, base: 0, start: 0 }); setLaps([]); }}>Reset</button>
          </div>
          {laps.length > 0 && <ol className="mx-auto max-h-40 w-56 overflow-y-auto text-left text-sm tabular-nums">{laps.map((l, i) => <li key={i} className="flex justify-between border-b border-gg-line py-1"><span className="text-gg-fg2">Lap {laps.length - i}</span><span>{hms(l, true)}</span></li>)}</ol>}
        </>)}
      </div>
    </div>
  );
}

/* ---------------- Calendar & reminders ---------------- */
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function CalendarApp({ user }) {
  const [data, setData, ready] = useSaved(user, "calendar", { items: [] });
  const today = ymd(new Date());
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(today);
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const items = data.items || [];
  const byDay = useMemo(() => { const m = {}; items.forEach((i) => { (m[i.date] ||= []).push(i); }); return m; }, [items]);
  const first = view.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const dayItems = (byDay[sel] || []).slice().sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const upcoming = items.filter((i) => !i.done && i.date >= today).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))).slice(0, 5);
  const overdue = items.filter((i) => !i.done && i.date < today).length;
  const setItems = (fn) => setData((d) => ({ ...d, items: fn(d.items || []) }));
  const add = (e) => { e.preventDefault(); if (!text.trim()) return; setItems((l) => [...l, { id: uid(), date: sel, text: text.trim(), time, done: false }]); setText(""); setTime(""); };
  const shift = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  if (!ready) return <p className="p-4 text-gg-fg2">Loading your calendar…</p>;
  return (
    <div className="grid h-full gap-4 overflow-y-auto bg-gg-panel p-4 text-gg-fg md:grid-cols-[1fr_18rem]">
      <section aria-label="Month">
        <div className="mb-2 flex items-center justify-between">
          <button className={iconBtn} onClick={() => shift(-1)} aria-label="Previous month"><ChevL size={20} aria-hidden="true" /></button>
          <h2 className="font-display text-lg font-bold">{view.toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
          <button className={iconBtn} onClick={() => shift(1)} aria-label="Next month"><ChevR size={20} aria-hidden="true" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gg-fg2" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((n, i) => {
            if (!n) return <span key={"e" + i} />;
            const key = `${view.getFullYear()}-${pad(view.getMonth() + 1)}-${pad(n)}`;
            const c = (byDay[key] || []).filter((x) => !x.done).length;
            return (
              <button key={key} onClick={() => setSel(key)} aria-pressed={sel === key} aria-label={`${new Date(key + "T00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}${c ? `, ${c} reminder${c > 1 ? "s" : ""}` : ""}`}
                className={`relative grid min-h-11 place-items-center rounded-lg text-sm ${ring} ${sel === key ? "bg-gg-accent font-bold text-gg-onaccent" : key === today ? "border border-gg-accentline bg-gg-panel2" : "bg-gg-panel2 hover:bg-gg-raised"}`}>
                {n}{c > 0 && <span aria-hidden="true" className={`absolute bottom-1 size-1.5 rounded-full ${sel === key ? "bg-gg-onaccent" : "bg-gg-accent"}`} />}
              </button>
            );
          })}
        </div>
        {overdue > 0 && <p className="mt-3 text-sm text-gg-fg2">{overdue} earlier reminder{overdue > 1 ? "s" : ""} not ticked off yet.</p>}
        {upcoming.length > 0 && (<div className="mt-4"><h3 className="mb-1 text-sm font-semibold">Coming up</h3>
          <ul className="grid gap-1 text-sm">{upcoming.map((i) => <li key={i.id}><button className={`w-full rounded-lg px-2 py-1.5 text-left hover:bg-gg-raised ${ring}`} onClick={() => { setSel(i.date); setView(new Date(i.date.slice(0, 4), +i.date.slice(5, 7) - 1, 1)); }}><span className="text-gg-fg2">{new Date(i.date + "T00:00").toLocaleDateString([], { day: "numeric", month: "short" })}{i.time ? ` ${i.time}` : ""}</span> · {i.text}</button></li>)}</ul></div>)}
      </section>
      <section aria-label="Reminders for the selected day" className="rounded-xl border border-gg-line bg-gg-panel2 p-3">
        <h3 className="mb-2 font-display font-bold">{new Date(sel + "T00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</h3>
        <form onSubmit={add} className="mb-3 grid gap-2">
          <label className="grid gap-1 text-sm text-gg-fg2">New reminder<input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="e.g. Dentist" className={`${inputCls} text-base`} /></label>
          <div className="flex items-end gap-2">
            <label className="grid flex-1 gap-1 text-sm text-gg-fg2">Time (optional)<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} w-full`} /></label>
            <button className={primary} type="submit"><PlusIcon size={16} className="mr-1 inline" aria-hidden="true" />Add</button>
          </div>
        </form>
        {dayItems.length === 0 ? <p className="text-sm text-gg-fg2">Nothing planned for this day.</p> : (
          <ul className="grid gap-1">{dayItems.map((i) => (
            <li key={i.id} className="flex items-center gap-2">
              <input type="checkbox" id={"r" + i.id} checked={i.done} onChange={() => setItems((l) => l.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)))} className="size-5 accent-[var(--c-accent)]" />
              <label htmlFor={"r" + i.id} className={`min-w-0 flex-1 break-words py-2 text-sm ${i.done ? "text-gg-fg2 line-through" : ""}`}>{i.time && <b className="mr-1">{i.time}</b>}{i.text}</label>
              <button className={iconBtn} onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))} aria-label={`Delete reminder ${i.text}`}><TrashIcon size={16} aria-hidden="true" /></button>
            </li>))}</ul>)}
      </section>
    </div>
  );
}

/* ---------------- Files helpers ---------------- */
const TEXT_RE = /\.(txt|md|csv|json|html?|css|js|xml|log)$/i;
const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac|flac|oga|opus)$/i;
function useFileList(user, test) {
  const [files, setFiles] = useState([]);
  const [token, setToken] = useState("");
  const [state, setState] = useState("loading");
  const load = useCallback(async () => {
    try {
      const all = await pb.collection("os_files").getFullList({ filter: 'kind="file"', sort: "name", requestKey: null });
      setFiles(all.filter(test));
      setState("ok");
    } catch { setState("error"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let on = true;
    const get = () => pb.files.getToken({ requestKey: null }).then((t) => on && setToken(t)).catch(() => {});
    get(); const t = setInterval(get, 90000);
    return () => { on = false; clearInterval(t); };
  }, []);
  const url = (f) => pb.files.getURL(f, f.file, { token });
  return { files, token, state, load, url };
}

/* ---------------- Text editor ---------------- */
export function TextEditor({ user }) {
  const isText = useCallback((f) => (f.mime || "").startsWith("text/") || TEXT_RE.test(f.name), []);
  const { files, state, load, url, token } = useFileList(user, isText);
  const [cur, setCur] = useState(null);
  const [name, setName] = useState("Untitled.txt");
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const confirmLose = () => !dirty || window.confirm("You have unsaved changes. Continue without saving?");
  const fresh = () => { if (!confirmLose()) return; setCur(null); setName("Untitled.txt"); setText(""); setDirty(false); setMsg(""); };
  const openFile = async (f) => {
    if (!confirmLose()) return;
    try { const r = await fetch(url(f)); if (!r.ok) throw 0; setText(await r.text()); setCur(f); setName(f.name); setDirty(false); setOpen(false); setMsg(""); }
    catch { setMsg("Couldn't open that file. Please try again."); }
  };
  const save = async () => {
    let n = name.trim() || "Untitled.txt";
    if (!/\.[a-z0-9]{1,5}$/i.test(n)) n += ".txt";
    const fd = new FormData();
    const mime = cur?.mime?.startsWith("text/") ? cur.mime : "text/plain";
    fd.append("file", new File([text], n, { type: mime }));
    fd.append("size", String(new Blob([text]).size));
    if (new Blob([text]).size > 16000000) { setMsg("This document is too big to save (16 MB limit)."); return; }
    try {
      if (cur) setCur(await pb.collection("os_files").update(cur.id, { ...Object.fromEntries([["size", fd.get("size")]]), file: fd.get("file"), name: n }, { requestKey: null }));
      else { fd.append("owner", user.id); fd.append("name", n); fd.append("kind", "file"); fd.append("parent", ""); fd.append("mime", mime); setCur(await pb.collection("os_files").create(fd, { requestKey: null })); }
      setName(n); setDirty(false); setMsg(`Saved to Files as "${n}".`); load();
    } catch { setMsg("Couldn't save. Please try again."); }
  };
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="relative flex h-full flex-col bg-gg-panel text-gg-fg">
      <div className="flex flex-wrap items-end gap-2 border-b border-gg-line p-3">
        <button className={btn} onClick={fresh}>New</button>
        <button className={btn} onClick={() => { setOpen(true); load(); }}>Open…</button>
        <button className={primary} onClick={save}>Save</button>
        <label className="ml-auto grid min-w-40 flex-1 gap-0.5 text-xs text-gg-fg2 sm:max-w-xs sm:flex-none">File name<input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} className={`${inputCls} min-h-10 text-sm`} /></label>
      </div>
      <label htmlFor="doc-body" className="sr-only">Document text</label>
      <textarea id="doc-body" value={text} onChange={(e) => { setText(e.target.value); setDirty(true); }} spellCheck placeholder="Start writing…" className={`min-h-0 flex-1 resize-none bg-gg-panel p-4 text-base leading-relaxed text-gg-fg placeholder:text-gg-fg3 ${ring}`} />
      <div className="flex justify-between gap-2 border-t border-gg-line px-3 py-2 text-xs text-gg-fg2">
        <span role="status">{msg || (dirty ? "Unsaved changes" : cur ? "All changes saved" : "New document")}</span>
        <span>{words} word{words === 1 ? "" : "s"} · {text.length} characters</span>
      </div>
      {open && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 p-3" onPointerDown={() => setOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="Open a document" onPointerDown={(e) => e.stopPropagation()} className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-gg-line2 bg-gg-panel p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Open a document</h2><button className={iconBtn} onClick={() => setOpen(false)} aria-label="Close"><XIcon size={18} aria-hidden="true" /></button></div>
            {state === "loading" && <p className="text-gg-fg2">Loading…</p>}
            {state === "error" && <p className="text-gg-error">Couldn't load your files.</p>}
            {state === "ok" && files.length === 0 && <p className="text-gg-fg2">No text documents in Files yet. Write something and press Save.</p>}
            <ul className="grid gap-1">{files.map((f) => <li key={f.id}><button disabled={!token} onClick={() => openFile(f)} className={`w-full rounded-lg px-3 py-2.5 text-left hover:bg-gg-raised ${ring}`}>{f.name}</button></li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------------- Music player ---------------- */
export function MusicPlayer({ user }) {
  const isAudio = useCallback((f) => (f.mime || "").startsWith("audio/") || AUDIO_RE.test(f.name), []);
  const { files, state, url, token } = useFileList(user, isAudio);
  const [pl, setPl, ready] = useSaved(user, "music-playlist", { ids: [] });
  const [tab, setTab] = useState("all");
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [qid, setQid] = useState(null);
  const au = useRef(null);
  const [bigSrc, setBigSrc] = useState({ id: null, url: "", busy: "" });
  const ids = pl.ids || [];
  const list = tab === "all" ? files : ids.map((i) => files.find((f) => f.id === i)).filter(Boolean);
  const nowF = files.find((f) => f.id === qid);
  useEffect(() => {
    if (!nowF?.parts) return;
    let on = true, made = "";
    setBigSrc({ id: nowF.id, url: "", busy: "Loading this big song…" });
    bigBlob(nowF, (i, n) => on && setBigSrc({ id: nowF.id, url: "", busy: `Loading this big song — piece ${i} of ${n}…` }))
      .then((b) => { made = URL.createObjectURL(b); if (on) setBigSrc({ id: nowF.id, url: made, busy: "" }); else URL.revokeObjectURL(made); })
      .catch(() => on && setBigSrc({ id: nowF.id, url: "", busy: "Couldn't load this song. Try again." }));
    return () => { on = false; if (made) URL.revokeObjectURL(made); };
  }, [qid, nowF?.parts]);
  const srcUrl = nowF ? (nowF.parts ? (bigSrc.id === nowF.id ? bigSrc.url : "") : token ? url(nowF) : "") : "";
  const busyMsg = nowF?.parts && bigSrc.id === nowF.id ? bigSrc.busy : "";
  const play = (f) => { setQid(f.id); setIdx(list.findIndex((x) => x.id === f.id)); setPlaying(true); };
  const step = (d) => { if (!list.length) return; const i = shuffle ? Math.floor(Math.random() * list.length) : (idx + d + list.length) % list.length; play(list[i]); };
  useEffect(() => { const a = au.current; if (!a || !nowF || !srcUrl) return; if (playing) a.play().catch(() => setPlaying(false)); else a.pause(); }, [playing, qid, srcUrl]);
  useEffect(() => { if (au.current) au.current.volume = vol; }, [vol]);
  const fmt = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const toggleList = (id) => setPl((p) => ({ ...p, ids: (p.ids || []).includes(id) ? p.ids.filter((x) => x !== id) : [...(p.ids || []), id] }));
  return (
    <div className="flex h-full flex-col bg-gg-panel text-gg-fg">
      <div className="border-b border-gg-line p-4">
        <p className="truncate font-display text-lg font-bold" aria-live="polite">{nowF ? nowF.name : "Pick a song to play"}</p>
        {busyMsg && <p role="status" className="text-sm text-gg-fg2">{busyMsg}</p>}
        {nowF && srcUrl && <audio ref={au} src={srcUrl} onTimeUpdate={(e) => setPos(e.target.currentTime)} onLoadedMetadata={(e) => setDur(e.target.duration || 0)} onEnded={() => (loop ? au.current.play() : step(1))} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />}
        <label className="mt-2 grid gap-1 text-xs text-gg-fg2">Seek
          <input type="range" min="0" max={dur || 0} step="1" value={Math.min(pos, dur || 0)} disabled={!nowF} onChange={(e) => { au.current.currentTime = +e.target.value; setPos(+e.target.value); }} className="w-full accent-[var(--c-accent)]" />
        </label>
        <div className="flex justify-between text-xs tabular-nums text-gg-fg2"><span>{fmt(pos)}</span><span>{fmt(dur)}</span></div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
          <button className={`${iconBtn} ${shuffle ? "!text-gg-accent-text" : ""}`} aria-pressed={shuffle} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle"><ShuffleIcon size={18} aria-hidden="true" /></button>
          <button className={iconBtn} onClick={() => step(-1)} aria-label="Previous song" disabled={!list.length}><PrevIcon size={20} aria-hidden="true" /></button>
          <button className="grid size-14 place-items-center rounded-full bg-gg-accent text-gg-onaccent hover:bg-gg-accent2 disabled:opacity-50" onClick={() => (nowF ? setPlaying(!playing) : list[0] && play(list[0]))} disabled={!list.length} aria-label={playing ? "Pause" : "Play"}>{playing ? <PauseIcon size={24} aria-hidden="true" /> : <PlayIcon size={24} aria-hidden="true" />}</button>
          <button className={iconBtn} onClick={() => step(1)} aria-label="Next song" disabled={!list.length}><NextIcon size={20} aria-hidden="true" /></button>
          <button className={`${iconBtn} ${loop ? "!text-gg-accent-text" : ""}`} aria-pressed={loop} onClick={() => setLoop(!loop)} aria-label="Repeat this song"><RepeatIcon size={18} aria-hidden="true" /></button>
          <label className="ml-2 flex items-center gap-2 text-xs text-gg-fg2">Volume<input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-24 accent-[var(--c-accent)]" /></label>
        </div>
      </div>
      <div role="tablist" aria-label="Song lists" className="flex gap-2 p-3 pb-0">
        <button role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")} className={`${btn} ${tab === "all" ? "!bg-gg-accent !text-gg-onaccent" : ""}`}>All music ({files.length})</button>
        <button role="tab" aria-selected={tab === "pl"} onClick={() => setTab("pl")} className={`${btn} ${tab === "pl" ? "!bg-gg-accent !text-gg-onaccent" : ""}`}>Playlist ({list.length && tab === "pl" ? list.length : ids.filter((i) => files.some((f) => f.id === i)).length})</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {state === "loading" && <p className="text-gg-fg2">Loading your music…</p>}
        {state === "error" && <p className="text-gg-error">Couldn't load your music. Please try again.</p>}
        {state === "ok" && files.length === 0 && <p className="text-gg-fg2">No songs yet. Open <b>Files</b>, upload some audio (MP3, WAV, M4A…) and it will appear here.</p>}
        {state === "ok" && files.length > 0 && tab === "pl" && list.length === 0 && <p className="text-gg-fg2">Your playlist is empty. In <b>All music</b>, press + next to a song to add it.</p>}
        <ul className="grid gap-1">{list.map((f) => (
          <li key={f.id} className={`flex items-center gap-1 rounded-lg ${f.id === qid ? "bg-gg-raised" : ""}`}>
            <button onClick={() => play(f)} className={`min-h-11 min-w-0 flex-1 truncate rounded-lg px-3 text-left text-sm hover:bg-gg-raised ${ring}`}>{f.id === qid && playing ? "▶ " : ""}{f.name}</button>
            <button disabled={!ready} onClick={() => toggleList(f.id)} className={`${btn} !min-h-9 !px-3`} aria-label={ids.includes(f.id) ? `Remove ${f.name} from playlist` : `Add ${f.name} to playlist`}>{ids.includes(f.id) ? "In playlist ✓" : "+ Playlist"}</button>
          </li>))}</ul>
      </div>
    </div>
  );
}
