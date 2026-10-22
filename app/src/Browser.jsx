import { useEffect, useRef, useState } from "react";
import { pb } from "./lib/pb.js";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gg-accent";
const btn = `grid min-h-10 min-w-10 place-items-center rounded-lg px-2 text-sm text-gg-fg hover:bg-gg-raised disabled:opacity-40 ${ring}`;
const HOME = [
  ["Wikipedia", "https://en.wikipedia.org/wiki/Main_Page"],
  ["Wikipedia Simple", "https://simple.wikipedia.org/wiki/Main_Page"],
  ["Wikimedia Commons", "https://commons.wikimedia.org/wiki/Main_Page"],
  ["Wiktionary", "https://en.wiktionary.org/wiki/Wiktionary:Main_Page"],
  ["OpenStreetMap", "https://www.openstreetmap.org/export/embed.html"],
  ["Project Gutenberg", "https://www.gutenberg.org/"],
  ["Internet Archive", "https://archive.org/"],
  ["NASA", "https://www.nasa.gov/"],
];

function toUrl(t) {
  t = t.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !/\s/.test(t)) return "https://" + t;
  return "https://en.wikipedia.org/w/index.php?search=" + encodeURIComponent(t);
}
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export default function Browser({ user }) {
  const [tabs, setTabs] = useState([{ id: 1, stack: [], i: -1 }]);
  const [active, setActive] = useState(1);
  const [text, setText] = useState("");
  const [data, setData] = useState({ marks: [], hist: [] });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [bump, setBump] = useState(0);
  const [panel, setPanel] = useState("");
  const next = useRef(2);
  const recId = useRef(null);
  const chain = useRef(Promise.resolve());
  const tab = tabs.find((t) => t.id === active) || tabs[0];
  const url = tab.i >= 0 ? tab.stack[tab.i] : "";

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        const rec = await pb.collection("os_data").getFirstListItem('appId="browser-data"', { signal: ctl.signal, requestKey: null });
        recId.current = rec.id;
        if (rec.blob) { const r = await fetch(pb.files.getURL(rec, rec.blob), { signal: ctl.signal }); if (r.ok) { const d = await r.json(); setData((x) => ({ marks: [...x.marks, ...(d.marks || []).filter((m) => !x.marks.some((y) => y.url === m.url))], hist: [...x.hist, ...(d.hist || []).filter((m) => !x.hist.some((y) => y.url === m.url && y.at === m.at))].slice(0, 100) })); } }
      } catch { /* first visit */ }
      if (!ctl.signal.aborted) setReady(true);
    })();
    return () => ctl.abort();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const body = JSON.stringify(data);
      chain.current = chain.current.then(async () => {
        const fd = new FormData();
        fd.append("blob", new Blob([body], { type: "application/json" }), "data.json");
        if (recId.current) await pb.collection("os_data").update(recId.current, fd, { requestKey: null });
        else { fd.append("owner", user.id); fd.append("appId", "browser-data"); recId.current = (await pb.collection("os_data").create(fd, { requestKey: null })).id; }
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [data, ready, user.id]);

  useEffect(() => {
    setText(url);
    if (!url) { setLoading(false); setSlow(false); return; }
    setLoading(true); setSlow(false);
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [url, active, bump]);

  const patch = (fn) => setTabs((ts) => ts.map((t) => (t.id === active ? fn(t) : t)));
  const go = (raw) => {
    const u = toUrl(raw);
    if (!u) return;
    setPanel("");
    patch((t) => { const stack = [...t.stack.slice(0, t.i + 1), u]; return { ...t, stack, i: stack.length - 1 }; });
    setData((d) => ({ ...d, hist: [{ url: u, at: Date.now() }, ...d.hist].slice(0, 100) }));
  };
  const marked = data.marks.some((m) => m.url === url);
  const toggleMark = () => setData((d) => ({ ...d, marks: marked ? d.marks.filter((m) => m.url !== url) : [{ url, title: host(url) }, ...d.marks].slice(0, 60) }));
  const addTab = () => { const id = next.current++; setTabs((t) => [...t, { id, stack: [], i: -1 }].slice(0, 8)); setActive(id); setPanel(""); };
  const closeTab = (id) => {
    if (tabs.length === 1) { patch((t) => ({ ...t, stack: [], i: -1 })); return; }
    const rest = tabs.filter((t) => t.id !== id); setTabs(rest);
    if (active === id) setActive(rest[rest.length - 1].id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col text-gg-fg">
      <div className="flex gap-1 overflow-x-auto border-b border-gg-line bg-gg-panel px-2 pt-2" role="tablist" aria-label="Open pages">
        {tabs.map((t) => {
          const u = t.i >= 0 ? t.stack[t.i] : "";
          return (
            <div key={t.id} className={`flex shrink-0 items-center rounded-t-lg border border-b-0 ${t.id === active ? "border-gg-line2 bg-gg-base" : "border-transparent hover:bg-gg-raised"}`}>
              <button type="button" role="tab" aria-selected={t.id === active} onClick={() => { setActive(t.id); setPanel(""); }} className={`max-w-40 truncate px-3 py-2 text-sm ${ring}`}>{u ? host(u) : "New tab"}</button>
              <button type="button" onClick={() => closeTab(t.id)} className={`px-2 py-2 text-gg-fg2 ${ring}`}>×<span className="sr-only">Close tab {u ? host(u) : "New tab"}</span></button>
            </div>
          );
        })}
        <button type="button" onClick={addTab} className={`${btn} shrink-0`}>+<span className="sr-only">New tab</span></button>
      </div>
      <form className="flex flex-wrap items-center gap-1 border-b border-gg-line p-2" onSubmit={(e) => { e.preventDefault(); go(text); }}>
        <button type="button" className={btn} disabled={tab.i < 1} onClick={() => patch((t) => ({ ...t, i: t.i - 1 }))}>←<span className="sr-only">Back</span></button>
        <button type="button" className={btn} disabled={tab.i >= tab.stack.length - 1} onClick={() => patch((t) => ({ ...t, i: t.i + 1 }))}>→<span className="sr-only">Forward</span></button>
        <button type="button" className={btn} disabled={!url} onClick={() => setBump((b) => b + 1)}>↻<span className="sr-only">Reload</span></button>
        <button type="button" className={btn} onClick={() => patch((t) => ({ ...t, stack: [], i: -1 }))}>⌂<span className="sr-only">Home</span></button>
        <label htmlFor="br-url" className="sr-only">Web address or search</label>
        <input id="br-url" value={text} onChange={(e) => setText(e.target.value)} onFocus={(e) => e.target.select()} placeholder="Type a web address or search" className={`min-h-10 min-w-0 flex-1 basis-40 rounded-lg border border-gg-line2 bg-gg-panel2 px-3 text-gg-fg placeholder:text-gg-fg3 ${ring}`} />
        <button type="button" className={btn} disabled={!url} onClick={toggleMark} aria-pressed={marked}>{marked ? "★" : "☆"}<span className="sr-only">{marked ? "Remove bookmark" : "Bookmark this page"}</span></button>
        <button type="button" className={btn} aria-pressed={panel === "marks"} onClick={() => setPanel(panel === "marks" ? "" : "marks")}>Bookmarks</button>
        <button type="button" className={btn} aria-pressed={panel === "hist"} onClick={() => setPanel(panel === "hist" ? "" : "hist")}>History</button>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className={`${btn} no-underline`}>Open in new tab</a>}
      </form>
      {url && loading && <div className="h-0.5 w-full animate-pulse bg-gg-accent" role="progressbar" aria-label="Loading page" />}
      {url && slow && loading && <p role="status" className="border-b border-gg-line bg-gg-panel px-3 py-2 text-sm text-gg-fg2">Taking a while? Many websites refuse to open inside another page. Use <strong>Open in new tab</strong> to visit it directly.</p>}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panel ? (
          <div className="mx-auto max-w-2xl p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{panel === "marks" ? "Bookmarks" : "History"}</h2>
              {panel === "hist" && data.hist.length > 0 && <button type="button" className={btn} onClick={() => setData((d) => ({ ...d, hist: [] }))}>Clear history</button>}</div>
            {(panel === "marks" ? data.marks : data.hist).length === 0 && <p className="text-gg-fg2">{panel === "marks" ? "No bookmarks yet. Press the star on a page to save it." : "Pages you visit will appear here."}</p>}
            <ul className="space-y-1">
              {(panel === "marks" ? data.marks : data.hist).map((m, k) => (
                <li key={m.url + k} className="flex items-center gap-2 rounded-lg border border-gg-line bg-gg-panel">
                  <button type="button" onClick={() => go(m.url)} className={`min-h-11 min-w-0 flex-1 truncate px-3 text-left text-sm ${ring}`}>{panel === "marks" ? m.title : host(m.url)} <span className="text-gg-fg3">{m.url}</span></button>
                  {panel === "marks" && <button type="button" onClick={() => setData((d) => ({ ...d, marks: d.marks.filter((x) => x.url !== m.url) }))} className={btn}>×<span className="sr-only">Remove {m.title}</span></button>}
                </li>
              ))}
            </ul>
          </div>
        ) : url ? (
          <iframe key={`${active}-${bump}-${url}`} title={`Web page: ${host(url)}`} src={url} onLoad={() => setLoading(false)} referrerPolicy="no-referrer" sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-popups-to-escape-sandbox" className="size-full min-h-[24rem] border-0 bg-white" />
        ) : (
          <div className="mx-auto max-w-2xl p-4">
            <h2 className="text-xl font-semibold">Browse the web</h2>
            <p className="mt-1 text-sm text-gg-fg2">Type an address above, or search. Searches use Wikipedia. Start with one of these:</p>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HOME.map(([n, u]) => <li key={u}><button type="button" onClick={() => go(u)} className={`min-h-16 w-full rounded-xl border border-gg-line bg-gg-panel p-3 text-sm font-medium hover:bg-gg-raised ${ring}`}>{n}</button></li>)}
            </ul>
            {data.marks.length > 0 && <><h3 className="mt-6 font-semibold">Your bookmarks</h3><ul className="mt-2 flex flex-wrap gap-2">{data.marks.slice(0, 12).map((m) => <li key={m.url}><button type="button" onClick={() => go(m.url)} className={`min-h-10 rounded-full border border-gg-line2 px-3 text-sm hover:bg-gg-raised ${ring}`}>{m.title}</button></li>)}</ul></>}
          </div>
        )}
      </div>
    </div>
  );
}
