import { useEffect, useRef, useState } from "react";
import { pb } from "./lib/pb.js";

function parse(input) {
  const t = input.trim();
  if (/^[\w-]{11}$/.test(t)) return { id: t };
  try {
    const u = new URL(/^https?:/i.test(t) ? t : "https://" + t);
    const h = u.hostname.replace(/^(www|m|music)\./, "");
    const list = u.searchParams.get("list");
    let id = null;
    if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (h === "youtube.com" || h === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (/^\/(shorts|embed|live|v)\//.test(u.pathname)) id = u.pathname.split("/")[2];
      else if (u.pathname === "/playlist" && list) return { list };
    }
    if (id && /^[\w-]{6,}$/.test(id)) {
      return { id, list, start: parseInt(u.searchParams.get("t") || u.searchParams.get("start") || "0", 10) || 0 };
    }
  } catch {
    /* not a link */
  }
  return null;
}

function embed(v, autoplay, loop) {
  const p = new URLSearchParams({ playsinline: "1", rel: "0" });
  if (autoplay) p.set("autoplay", "1");
  if (v.start) p.set("start", v.start);
  if (v.list) p.set("list", v.list);
  if (loop && v.id) { p.set("loop", "1"); if (!v.list) p.set("playlist", v.id); }
  return "https://www.youtube-nocookie.com/embed/" + (v.id || "videoseries") + "?" + p;
}

const watchUrl = (v) => v.id ? "https://www.youtube.com/watch?v=" + v.id + (v.list ? "&list=" + v.list : "") : "https://www.youtube.com/playlist?list=" + v.list;
const btn = "min-h-11 rounded-lg border border-[#55556e] bg-[#262636] px-4 text-sm font-semibold text-white";

export default function VideoPlayer({ user }) {
  const [text, setText] = useState("");
  const [cur, setCur] = useState(null);
  const [error, setError] = useState("");
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(false);
  const [wide, setWide] = useState(false);
  const [recent, setRecent] = useState([]);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");
  const recId = useRef(null);
  const [ready, setReady] = useState(false);
  const chain = useRef(Promise.resolve());

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        const rec = await pb.collection("os_data").getFirstListItem('appId="video-history"', { signal: ctl.signal });
        recId.current = rec.id;
        if (rec.blob) {
          const res = await fetch(pb.files.getURL(rec, rec.blob), { signal: ctl.signal });
          if (res.ok) { const d = await res.json(); if (Array.isArray(d)) setRecent((r) => [...r.map((x) => ({ ...x, fav: x.fav || (d.find((y) => y.key === x.key) || {}).fav })), ...d.filter((x) => !r.some((y) => y.key === x.key))]); }
        }
      } catch { /* first visit */ }
      if (!ctl.signal.aborted) setReady(true);
    })();
    return () => ctl.abort();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const body = JSON.stringify(recent);
      chain.current = chain.current.then(async () => {
        const fd = new FormData();
        fd.append("blob", new Blob([body], { type: "application/json" }), "data.json");
        if (recId.current) await pb.collection("os_data").update(recId.current, fd);
        else { fd.append("owner", user.id); fd.append("appId", "video-history"); recId.current = (await pb.collection("os_data").create(fd)).id; }
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [recent, ready, user.id]);

  function play(v) {
    setError(""); setCur(v);
    const key = watchUrl(v);
    setRecent((r) => { const old = r.find((x) => x.key === key) || {}; const rest = r.filter((x) => x.key !== key); return [{ v, key, at: Date.now(), title: old.title, fav: old.fav }, ...rest].slice(0, 50 + rest.filter((x) => x.fav).length); });
    if (v.id) fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + v.id)).then((x) => x.json()).then((d) => d.title && setRecent((r) => r.map((x) => x.key === key ? { ...x, title: d.title } : x))).catch(() => {});
  }
  function watch(e) {
    e.preventDefault();
    const v = parse(text);
    if (!v) { setCur(null); setError("That doesn't look like a YouTube link. Try copying it again from the video's Share button."); return; }
    play(v);
  }
  const remove = (key) => setRecent((r) => r.filter((x) => x.key !== key));
  const curTitle = cur && (recent.find((x) => x.key === watchUrl(cur)) || {}).title;
  const toggleFav = (key) => setRecent((r) => r.map((x) => (x.key === key ? { ...x, fav: !x.fav } : x)));
  const needle = q.trim().toLowerCase();
  const shown = recent.filter((r) => !needle || (r.title || "").toLowerCase().includes(needle) || r.key.toLowerCase().includes(needle));
  const favs = shown.filter((r) => r.fav);
  const others = shown.filter((r) => !r.fav);
  const row = (r) => (
    <li key={r.key} className="flex gap-2">
      <button type="button" onClick={() => { setText(r.key); play(r.v); }} className="min-h-11 min-w-0 flex-1 truncate rounded-lg bg-[#1c1c28] px-3 text-left text-sm text-white">{r.title || r.key.replace("https://www.youtube.com/", "")}</button>
      <button type="button" onClick={() => remove(r.key)} aria-label={"Remove " + (r.title || "video") + " from history"} className="min-h-11 w-11 shrink-0 rounded-lg border border-[#55556e] bg-[#262636] text-white">✕</button>
      <button type="button" onClick={() => toggleFav(r.key)} aria-pressed={!!r.fav} className="min-h-11 w-24 shrink-0 rounded-lg border border-[#55556e] bg-[#262636] text-sm font-semibold text-white">{r.fav ? "★ Saved" : "☆ Favorite"}</button>
    </li>
  );
  async function copy() {
    try { await navigator.clipboard.writeText(watchUrl(cur)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#12121a] text-white">
      <form onSubmit={watch} className="flex flex-wrap gap-2 bg-[#1c1c28] p-3">
        <label htmlFor="yt-link" className="sr-only">YouTube link</label>
        <input id="yt-link" type="text" value={text} onChange={(e) => setText(e.target.value)} onPaste={(e) => { const v = parse(e.clipboardData.getData("text")); if (v) { e.preventDefault(); setText(e.clipboardData.getData("text").trim()); play(v); } }} placeholder="Paste a YouTube link here" autoComplete="off" className="min-h-11 min-w-[200px] flex-1 rounded-lg border border-[#55556e] bg-[#0d0d14] px-3 text-base text-white" />
        <button type="submit" className="min-h-11 rounded-lg bg-[#ff4d5e] px-5 font-bold text-[#111]">Watch</button>
      </form>
      <div className="flex flex-col gap-3 p-3">
        {error && <p className="m-0 text-[#ffb3ba]">{error}</p>}
        <details open={!cur} className="mx-auto w-full max-w-3xl rounded-xl border border-[#55556e] bg-[#1c1c28] p-4">
          <summary className="cursor-pointer text-base font-bold text-white">How to play a YouTube video</summary>
          <ol className="m-0 mt-3 grid list-decimal gap-2 pl-5 text-[#e6e6f0]">
            <li>Open <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="font-semibold text-[#ffb3ba] underline">YouTube</a> in a new tab and find the video you want.</li>
            <li>Under the video, press <b>Share</b>, then <b>Copy</b>. On your phone, tap <b>Share</b> and choose <b>Copy link</b>. You can also copy the address from the top of your browser.</li>
            <li>Come back here and click the box at the top that says <b>YouTube link</b>.</li>
            <li>Paste the link: press <b>Ctrl + V</b> (<b>Cmd + V</b> on a Mac), or press and hold on a phone and choose <b>Paste</b>.</li>
            <li>The video starts playing straight away. If it doesn't, press <b>Watch</b> or the Enter key.</li>
          </ol>
          <p className="m-0 mt-3 text-sm text-[#d6d6e4]">Normal links, short youtu.be links, Shorts and playlists all work. Every video you play is saved to <b>Your video history</b> so you can play it again without the link. If a video won't play here, the owner has blocked it, so use <b>Open on YouTube</b> under the player.</p>
        </details>
        {cur && (
          <>
            {curTitle && <h2 className="mx-auto m-0 w-full max-w-3xl text-lg font-bold">{curTitle}</h2>}
            <div className={"mx-auto w-full " + (wide ? "" : "max-w-3xl")} style={{ aspectRatio: "16 / 9" }}>
              <iframe key={embed(cur, autoplay, loop)} src={embed(cur, autoplay, loop)} title="YouTube video player" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full rounded-xl border-0 bg-black" />
            </div>
            <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2">
              <a href={watchUrl(cur)} target="_blank" rel="noreferrer" className={btn + " inline-flex items-center"}>Open on YouTube</a>
              <button type="button" onClick={copy} className={btn}>{copied ? "Copied" : "Copy link"}</button>
              <button type="button" onClick={() => setWide(!wide)} aria-pressed={wide} className={btn}>{wide ? "Normal size" : "Wide view"}</button>
              <button type="button" onClick={() => setLoop(!loop)} aria-pressed={loop} className={btn}>Repeat: {loop ? "on" : "off"}</button>
              <button type="button" onClick={() => setAutoplay(!autoplay)} aria-pressed={autoplay} className={btn}>Autoplay: {autoplay ? "on" : "off"}</button>
            </div>
          </>
        )}
        {recent.length > 0 && (
          <section className="mx-auto w-full max-w-3xl" aria-label="Recently watched">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-base font-bold">Your video history</h2>
              <button type="button" onClick={() => setRecent((r) => r.filter((x) => x.fav))} className="min-h-11 px-2 text-sm text-[#ffb3ba] underline">Clear all but favorites</button>
            </div>
            <label htmlFor="yt-search" className="sr-only">Search your video history</label>
            <input id="yt-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your videos" className="mb-3 min-h-11 w-full rounded-lg border border-[#55556e] bg-[#0d0d14] px-3 text-base text-white" />
            {shown.length === 0 && <p className="m-0 text-[#d6d6e4]">No videos match your search.</p>}
            {favs.length > 0 && (<><h3 className="mb-2 mt-0 text-sm font-bold text-[#ffd479]">Favorites</h3><ul className="m-0 mb-3 flex list-none flex-col gap-2 p-0">{favs.map(row)}</ul></>)}
            {others.length > 0 && (<>{favs.length > 0 && <h3 className="mb-2 mt-0 text-sm font-bold text-[#d6d6e4]">Everything else</h3>}<ul className="m-0 flex list-none flex-col gap-2 p-0">{others.map(row)}</ul></>)}
          </section>
        )}
      </div>
    </div>
  );
}
