import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadIcon from "icon:upload";
import DownloadIcon from "icon:download";
import TrashIcon from "icon:trash-2";
import SearchIcon from "icon:search";
import { pb } from "./lib/pb";
import { saveBig } from "./lib/bigfile";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gg-accent";
const inputCls = `min-h-11 w-full rounded-lg border border-gg-line2 bg-gg-panel2 px-3 text-gg-fg placeholder:text-gg-fg3 ${ring}`;
const PART = 8000000;
const MAX = 500000000;
const fmt = (n = 0) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const kindOf = (m = "", n = "") => (m.startsWith("audio/") || /\.(mp3|flac|wav|m4a|ogg)$/i.test(n) ? "Music" : m.startsWith("image/") ? "Pictures" : m.startsWith("video/") ? "Video" : /pdf|text|word|sheet|document/.test(m) || /\.(pdf|txt|md|docx?|xlsx?|csv)$/i.test(n) ? "Documents" : "Other");
const TABS = ["All", "Music", "Pictures", "Documents", "Video", "Other"];

const partsOf = (id) => pb.collection("shared_files").getFullList({ filter: `grp="${id}"`, sort: "part", requestKey: null });
const dropParts = async (id) => { for (const r of await partsOf(id)) await pb.collection("shared_files").delete(r.id, { requestKey: null }); };

export default function Share({ user }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState("new");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const picker = useRef(null);
  const isAdmin = user.role === "admin";

  const load = useCallback(async (signal) => {
    try {
      setItems(await pb.collection("shared_files").getFullList({ filter: 'kind != "part"', sort: "-created", signal, requestKey: null }));
      setState("ready");
    } catch (e) { if (!e?.isAbort) setState("error"); }
  }, []);
  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);

  const share = async (files) => {
    for (const f of files) {
      if (f.size > MAX) { setMsg({ err: true, t: `${f.name} is over the 500 MB sharing limit.` }); continue; }
      setBusy(`Sharing ${f.name}…`);
      let main = null;
      try {
        const meta = { owner: user.id, uploader: user.name || "member", name: f.name, note: note.trim().slice(0, 140), mime: f.type || "", size: f.size };
        if (f.size <= PART) {
          const fd = new FormData();
          Object.entries(meta).forEach(([k, v]) => fd.append(k, String(v)));
          fd.append("kind", "file"); fd.append("file", f);
          main = await pb.collection("shared_files").create(fd, { requestKey: null });
        } else {
          const n = Math.ceil(f.size / PART);
          main = await pb.collection("shared_files").create({ ...meta, kind: "file", parts: n }, { requestKey: null });
          for (let i = 0; i < n; i++) {
            setBusy(`Sharing ${f.name}… piece ${i + 1} of ${n}`);
            const fd = new FormData();
            fd.append("owner", user.id); fd.append("name", `${f.name}.part${i + 1}`); fd.append("kind", "part");
            fd.append("grp", main.id); fd.append("part", String(i));
            fd.append("file", f.slice(i * PART, (i + 1) * PART), `part${i + 1}`);
            await pb.collection("shared_files").create(fd, { requestKey: null });
          }
        }
        setItems((p) => [main, ...p]);
        setMsg({ t: `${f.name} is now shared. Everyone can find it.` });
      } catch {
        if (main) { await dropParts(main.id).catch(() => {}); await pb.collection("shared_files").delete(main.id, { requestKey: null }).catch(() => {}); }
        setMsg({ err: true, t: `Couldn't share ${f.name}. Please try again.` });
      }
    }
    setBusy(""); setNote("");
  };

  const get = async (it, toDevice = false) => {
    setBusy(`Downloading ${it.name}…`);
    try {
      const token = await pb.files.getToken({ requestKey: null });
      let blob;
      if (it.parts > 1) {
        const rows = await partsOf(it.id);
        if (rows.length !== it.parts) throw new Error();
        const bufs = [];
        for (let i = 0; i < rows.length; i++) {
          setBusy(`Downloading ${it.name}… piece ${i + 1} of ${rows.length}`);
          const r = await fetch(pb.files.getURL(rows[i], rows[i].file, { token }));
          if (!r.ok) throw new Error();
          bufs.push(await r.blob());
        }
        blob = new Blob(bufs, { type: it.mime || "application/octet-stream" });
      } else {
        const r = await fetch(pb.files.getURL(it, it.file, { token }));
        if (!r.ok) throw new Error();
        blob = await r.blob();
      }
      if (toDevice) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = it.name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      } else {
        const file = new File([blob], it.name, { type: it.mime || "application/octet-stream" });
        if (file.size <= 15000000) {
          const fd = new FormData();
          fd.append("owner", user.id); fd.append("name", it.name); fd.append("kind", "file"); fd.append("parent", "");
          fd.append("size", String(file.size)); fd.append("mime", file.type); fd.append("file", file);
          await pb.collection("os_files").create(fd, { requestKey: null });
        } else {
          await saveBig(file, { owner: user.id, name: it.name, parent: "", mime: file.type }, (i, n) => setBusy(`Saving ${it.name} to Files… piece ${i} of ${n}`));
        }
        setMsg({ t: `${it.name} is saved in your Files. Open Files to find it.` });
      }
    } catch { setMsg({ err: true, t: `Couldn't save ${it.name} to your Files. It may have been removed.` }); }
    setBusy("");
  };

  const remove = async (it) => {
    if (!window.confirm(`Stop sharing "${it.name}"? Nobody will be able to download it any more.`)) return;
    try { if (it.parts > 1) await dropParts(it.id); await pb.collection("shared_files").delete(it.id, { requestKey: null }); setItems((p) => p.filter((x) => x.id !== it.id)); }
    catch { setMsg({ err: true, t: "Couldn't remove that file. Please try again." }); }
  };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = items.filter((i) => (!mine || i.owner === user.id) && (tab === "All" || kindOf(i.mime, i.name) === tab) && (!s || `${i.name} ${i.note} ${i.uploader}`.toLowerCase().includes(s)));
    return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : sort === "size" ? [...list].sort((a, b) => b.size - a.size) : list;
  }, [items, q, tab, mine, sort, user.id]);

  return (
    <div className="flex h-full min-h-0 flex-col text-gg-fg">
      <div className="space-y-3 border-b border-gg-line p-3">
        <p className="text-sm text-gg-fg2">Share files with everyone on Giggle OS, and find what others have shared. Only share files you have the right to share.</p>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="sh-note" className="sr-only">Short note about the file you are sharing (optional)</label>
          <input id="sh-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="Add a short note (optional)" className={`${inputCls} min-w-0 flex-1 basis-48`} />
          <input ref={picker} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { share([...e.target.files]); e.target.value = ""; }} />
          <button type="button" disabled={!!busy} onClick={() => picker.current?.click()} className={`flex min-h-11 items-center gap-2 rounded-lg bg-gg-accent px-4 text-sm font-semibold text-gg-onaccent disabled:opacity-60 ${ring}`}><UploadIcon size={16} aria-hidden="true" />Share a file</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-48">
            <SearchIcon size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gg-fg3" />
            <label htmlFor="sh-q" className="sr-only">Search shared files</label>
            <input id="sh-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shared files" className={`${inputCls} pl-9`} />
          </div>
          <label htmlFor="sh-sort" className="sr-only">Sort by</label>
          <select id="sh-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputCls} !w-auto`}>
            <option value="new">Newest</option><option value="name">Name</option><option value="size">Largest</option>
          </select>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="size-4 accent-[var(--color-gg-accent)]" />Just mine</label>
        </div>
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="File type">
          {TABS.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`min-h-9 shrink-0 rounded-full px-3 text-sm ${tab === t ? "bg-gg-accent font-semibold text-gg-onaccent" : "border border-gg-line2 hover:bg-gg-raised"} ${ring}`}>{t}</button>)}
        </div>
        <p role="status" className={`min-h-5 text-sm ${msg?.err ? "text-gg-error" : "text-gg-fg2"}`}>{busy || msg?.t}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {state === "loading" && <p className="text-gg-fg2">Looking for shared files…</p>}
        {state === "error" && <p className="text-gg-error">Couldn't load the shared files. Please try again.</p>}
        {state === "ready" && shown.length === 0 && <p className="text-gg-fg2">{items.length ? "Nothing matches that search." : "Nothing is shared yet. Be the first. Press Share a file."}</p>}
        <ul className="space-y-2">
          {shown.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gg-line bg-gg-panel p-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-medium">{it.name}</p>
                <p className="text-sm text-gg-fg2">{kindOf(it.mime, it.name)} · {fmt(it.size)} · shared by {it.owner === user.id ? "you" : it.uploader || "a member"} · {new Date(it.created).toLocaleDateString()}</p>
                {it.note && <p className="text-sm text-gg-fg2">{it.note}</p>}
              </div>
              <button type="button" disabled={!!busy} onClick={() => get(it)} className={`flex min-h-10 items-center gap-2 rounded-lg bg-gg-accent px-3 text-sm font-semibold text-gg-onaccent disabled:opacity-60 ${ring}`}><DownloadIcon size={16} aria-hidden="true" />Save to Files<span className="sr-only"> {it.name}</span></button>
              <button type="button" disabled={!!busy} onClick={() => get(it, true)} className={`min-h-10 rounded-lg border border-gg-line2 px-3 text-sm hover:bg-gg-raised disabled:opacity-60 ${ring}`}>To my device<span className="sr-only">: {it.name}</span></button>
              {(it.owner === user.id || isAdmin) && <button type="button" onClick={() => remove(it)} className={`grid size-10 place-items-center rounded-lg text-gg-fg2 hover:bg-gg-raised ${ring}`}><TrashIcon size={18} aria-hidden="true" /><span className="sr-only">Stop sharing {it.name}</span></button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
