import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FolderIcon from "icon:folder";
import FolderPlusIcon from "icon:folder-plus";
import FileIcon from "icon:file";
import FileTextIcon from "icon:file-text";
import ImageIcon from "icon:image";
import MusicIcon from "icon:music";
import VideoIcon from "icon:video";
import ArchiveIcon from "icon:file-archive";
import UploadIcon from "icon:upload";
import DownloadIcon from "icon:download";
import PencilIcon from "icon:pencil";
import TrashIcon from "icon:trash-2";
import MoveIcon from "icon:folder-input";
import ChevronIcon from "icon:chevron-right";
import SearchIcon from "icon:search";
import XIcon from "icon:x";
import { pb } from "./lib/pb";
import { saveBig, deleteParts, downloadBig, PART, MAX_TOTAL } from "./lib/bigfile";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gg-accent";
const MAX_BYTES = MAX_TOTAL;
const inputCls = `min-h-11 w-full rounded-lg border border-gg-line2 bg-gg-panel2 px-3 text-gg-fg placeholder:text-gg-fg3 ${ring}`;
const iconBtn = `grid size-10 shrink-0 place-items-center rounded-lg text-gg-fg2 hover:bg-gg-raised hover:text-gg-fg ${ring}`;

const fmtSize = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(n < 10485760 ? 1 : 0)} MB`;
  return `${(n / 1073741824).toFixed(1)} GB`;
};
const fmtDate = (s) => {
  const d = new Date(String(s || "").replace(" ", "T"));
  return isNaN(d) ? "" : d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};
const typeOf = (it) => {
  const m = it.mime || "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("text/") || m === "application/pdf" || /\.(txt|md|pdf|docx?|rtf)$/i.test(it.name)) return "text";
  if (/zip|compressed|tar|rar|7z/.test(m) || /\.(zip|rar|7z|tar|gz)$/i.test(it.name)) return "archive";
  return "other";
};
const TYPE_ICON = { image: ImageIcon, audio: MusicIcon, video: VideoIcon, text: FileTextIcon, archive: ArchiveIcon, other: FileIcon };

function Sheet({ id, title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-black/60 p-3" onPointerDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby={id} onPointerDown={(e) => e.stopPropagation()} className={`max-h-full w-full overflow-y-auto rounded-2xl border border-gg-line2 bg-gg-panel p-4 shadow-2xl ${wide ? "max-w-xl" : "max-w-sm"}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id={id} className="min-w-0 break-words font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={`${iconBtn} -mr-1 -mt-1`}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function FileManager({ user }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [cwd, setCwd] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [token, setToken] = useState("");
  const [dlg, setDlg] = useState(null);
  const [status, setStatus] = useState("");
  const [over, setOver] = useState(false);
  const picker = useRef(null);

  const load = useCallback(async (signal) => {
    try {
      const list = await pb.collection("os_files").getFullList({ filter: "kind != \"part\"", sort: "name", signal, requestKey: null });
      setItems(list);
      setErr("");
    } catch (e) {
      if (e?.isAbort || e?.name === "AbortError") return;
      setErr("We couldn't open your files just now.");
    }
  }, []);
  useEffect(() => {
    const ctl = new AbortController();
    load(ctl.signal);
    return () => ctl.abort();
  }, [load]);
  useEffect(() => {
    let on = true;
    const get = () => pb.files.getToken({ requestKey: null }).then((t) => on && setToken(t)).catch(() => {});
    get();
    const i = setInterval(get, 90000);
    return () => { on = false; clearInterval(i); };
  }, []);

  const byId = useMemo(() => new Map((items || []).map((i) => [i.id, i])), [items]);
  const here = byId.has(cwd) ? cwd : "";
  const pathIds = (id) => {
    const out = [];
    let cur = byId.get(id);
    let guard = 0;
    while (cur && guard++ < 50) { out.unshift(cur); cur = byId.get(cur.parent); }
    return out;
  };
  const pathLabel = (id) => ["My files", ...pathIds(id).map((p) => p.name)].join(" / ");
  const crumbs = pathIds(here);
  const descendants = (id) => {
    const out = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const i of items || []) if (!out.has(i.id) && out.has(i.parent)) { out.add(i.id); grew = true; }
    }
    return out;
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let l = (items || []).filter((i) => (term ? i.name.toLowerCase().includes(term) : (i.parent || "") === here));
    const cmp = {
      name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
      new: (a, b) => String(b.created).localeCompare(String(a.created)),
      size: (a, b) => (b.size || 0) - (a.size || 0),
    }[sort];
    l = [...l].sort((a, b) => (a.kind === b.kind ? cmp(a, b) : a.kind === "folder" ? -1 : 1));
    return l;
  }, [items, q, here, sort]);

  const fileCount = (items || []).filter((i) => i.kind === "file").length;
  const used = (items || []).reduce((s, i) => s + (i.size || 0), 0);

  const url = (it, o = {}) => {
    let u = pb.files.getURL(it, it.file, { token, ...(o.thumb ? { thumb: o.thumb } : {}) });
    if (o.download) u += (u.includes("?") ? "&" : "?") + "download=1";
    return u;
  };
  const upsert = (rec) => setItems((l) => (l.some((x) => x.id === rec.id) ? l.map((x) => (x.id === rec.id ? rec : x)) : [...l, rec]));

  const run = async (fn, fail) => {
    try { await fn(); } catch { setStatus(fail); }
  };

  const upload = async (files) => {
    const list = [...files];
    if (!list.length) return;
    let done = 0, skipped = 0, failed = 0;
    for (const f of list) {
      if (f.size > MAX_BYTES) { skipped++; continue; }
      setStatus(`Uploading ${done + skipped + failed + 1} of ${list.length}…`);
      try {
        if (f.size > PART) {
          const n = Math.ceil(f.size / PART);
          upsert(await saveBig(f, { owner: user.id, name: f.name, parent: here, mime: f.type || "application/octet-stream" }, (i) => setStatus(`Uploading “${f.name}” — piece ${i} of ${n}…`)));
          done++; continue;
        }
        const fd = new FormData();
        fd.append("owner", user.id);
        fd.append("name", f.name);
        fd.append("kind", "file");
        fd.append("parent", here);
        fd.append("size", String(f.size));
        fd.append("mime", f.type || "application/octet-stream");
        fd.append("file", f);
        upsert(await pb.collection("os_files").create(fd, { requestKey: null }));
        done++;
      } catch { failed++; }
    }
    const bits = [];
    if (done) bits.push(`${done} file${done === 1 ? "" : "s"} saved`);
    if (skipped) bits.push(`${skipped} too large (500 MB is the limit per file)`);
    if (failed) bits.push(`${failed} couldn't be saved — please try again`);
    setStatus(bits.join(". ") + ".");
  };

  const newFolder = (name) => run(async () => {
    upsert(await pb.collection("os_files").create({ owner: user.id, name, kind: "folder", parent: here }, { requestKey: null }));
    setStatus(`Folder “${name}” created.`);
    setDlg(null);
  }, "The folder couldn't be created. Please try again.");
  const rename = (it, name) => run(async () => {
    upsert(await pb.collection("os_files").update(it.id, { name }, { requestKey: null }));
    setStatus(`Renamed to “${name}”.`);
    setDlg(null);
  }, "That couldn't be renamed. Please try again.");
  const move = (it, parent) => run(async () => {
    upsert(await pb.collection("os_files").update(it.id, { parent }, { requestKey: null }));
    setStatus(`“${it.name}” moved to ${parent ? byId.get(parent)?.name : "My files"}.`);
    setDlg(null);
  }, "That couldn't be moved. Please try again.");
  const remove = (it) => run(async () => {
    const ids = [...descendants(it.id)].reverse();
    for (const id of ids) {
      const r = (items || []).find((x) => x.id === id);
      if (r?.parts) await deleteParts(id);
      await pb.collection("os_files").delete(id, { requestKey: null });
    }
    setItems((l) => l.filter((x) => !ids.includes(x.id)));
    setStatus(`“${it.name}” deleted.`);
    setDlg(null);
  }, "That couldn't be deleted. Please try again.");

  const bigDownload = (it) => run(async () => {
    setStatus(`Preparing “${it.name}”…`);
    await downloadBig(it, (i, n) => setStatus(`Preparing “${it.name}” — piece ${i} of ${n}…`));
    setStatus(`“${it.name}” downloaded.`);
  }, "That couldn't be downloaded. Please try again.");
  const openItem = (it) => {
    if (it.kind === "folder") { setQ(""); setCwd(it.id); return; }
    if (typeOf(it) === "image") setDlg({ t: "preview", it });
    else if (it.parts) bigDownload(it);
    else window.open(url(it), "_blank", "noopener");
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-gg-panel text-gg-fg" onDragOver={(e) => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setOver(true); } }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gg-line bg-gg-panel2 p-2">
        <input ref={picker} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <button type="button" onClick={() => picker.current?.click()} className={`flex min-h-10 items-center gap-2 rounded-lg bg-gg-accent px-3 text-sm font-semibold text-gg-onaccent ${ring}`}><UploadIcon size={16} aria-hidden="true" />Upload</button>
        <button type="button" onClick={() => setDlg({ t: "folder" })} className={`flex min-h-10 items-center gap-2 rounded-lg border border-gg-line2 px-3 text-sm font-medium hover:bg-gg-raised ${ring}`}><FolderPlusIcon size={16} aria-hidden="true" />New folder</button>
        <div className="relative min-w-36 flex-1">
          <label htmlFor="fm-q" className="sr-only">Search your files</label>
          <SearchIcon size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gg-fg3" />
          <input id="fm-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your files" className={`${inputCls} !min-h-10 pl-9`} />
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="fm-sort" className="text-sm text-gg-fg2">Sort</label>
          <select id="fm-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputCls} !min-h-10 !w-auto`}>
            <option value="name">Name</option><option value="new">Newest</option><option value="size">Largest</option>
          </select>
        </div>
      </div>

      <nav aria-label="Folder path" className="flex flex-wrap items-center gap-0.5 border-b border-gg-line px-2 py-1 text-sm">
        <button type="button" onClick={() => { setQ(""); setCwd(""); }} aria-current={!here && !q ? "page" : undefined} className={`min-h-9 rounded-md px-2 font-medium hover:bg-gg-raised ${ring} ${!here ? "text-gg-fg" : "text-gg-accent-text"}`}>My files</button>
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex items-center gap-0.5">
            <ChevronIcon size={14} aria-hidden="true" className="text-gg-fg3" />
            <button type="button" onClick={() => { setQ(""); setCwd(c.id); }} aria-current={i === crumbs.length - 1 && !q ? "page" : undefined} className={`min-h-9 max-w-40 truncate rounded-md px-2 font-medium hover:bg-gg-raised ${ring} ${i === crumbs.length - 1 ? "text-gg-fg" : "text-gg-accent-text"}`}>{c.name}</button>
          </span>
        ))}
        {q && <span className="px-2 text-gg-fg2">Search results for “{q}”</span>}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {err ? (
          <div className="p-6 text-center"><p className="mb-3 text-gg-error">{err}</p><button type="button" onClick={() => load()} className={`min-h-11 rounded-lg bg-gg-accent px-4 font-semibold text-gg-onaccent ${ring}`}>Try again</button></div>
        ) : !items ? (
          <p className="p-6 text-center text-gg-fg2">Opening your files…</p>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center gap-2 p-8 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-gg-panel2 text-gg-fg2"><FolderIcon size={30} aria-hidden="true" /></span>
            <p className="font-display text-lg font-bold">{q ? "Nothing matches your search" : here ? "This folder is empty" : "Your file space is ready"}</p>
            <p className="max-w-xs text-sm text-gg-fg2">{q ? "Try a different word." : "Drop files anywhere in this window, or choose Upload. Only you can see what you store here."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gg-line">
            {shown.map((it) => {
              const T = it.kind === "folder" ? FolderIcon : TYPE_ICON[typeOf(it)];
              const isImg = it.kind === "file" && typeOf(it) === "image" && token;
              const kids = it.kind === "folder" ? (items || []).filter((x) => x.parent === it.id).length : 0;
              return (
                <li key={it.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-gg-panel2/60">
                  <button type="button" onClick={() => openItem(it)} className={`flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left ${ring}`}>
                    <span className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg ${it.kind === "folder" ? "bg-[#e0a84a] text-[#1b1410]" : "bg-gg-panel3 text-gg-fg"}`}>
                      {isImg ? <img src={url(it, { thumb: "96x96" })} alt="" loading="lazy" className="size-full object-cover" /> : <T size={20} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{it.name}</span>
                      <span className="block truncate text-xs text-gg-fg2">
                        {it.kind === "folder" ? `${kids} item${kids === 1 ? "" : "s"}` : fmtSize(it.size)} · {fmtDate(it.created)}{q ? ` · ${pathLabel(it.parent)}` : ""}
                      </span>
                    </span>
                  </button>
                  {it.kind === "file" && (it.parts ? <button type="button" onClick={() => bigDownload(it)} aria-label={`Download ${it.name}`} className={iconBtn}><DownloadIcon size={17} aria-hidden="true" /></button> : <a href={url(it, { download: true })} download={it.name} aria-label={`Download ${it.name}`} className={iconBtn}><DownloadIcon size={17} aria-hidden="true" /></a>)}
                  <button type="button" onClick={() => setDlg({ t: "rename", it })} aria-label={`Rename ${it.name}`} className={iconBtn}><PencilIcon size={17} aria-hidden="true" /></button>
                  <button type="button" onClick={() => setDlg({ t: "move", it })} aria-label={`Move ${it.name}`} className={iconBtn}><MoveIcon size={17} aria-hidden="true" /></button>
                  <button type="button" onClick={() => setDlg({ t: "delete", it })} aria-label={`Delete ${it.name}`} className={iconBtn}><TrashIcon size={17} aria-hidden="true" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-4 border-t border-gg-line bg-gg-panel2 px-3 py-1.5 text-xs text-gg-fg2">
        <p role="status" className="min-w-0 flex-1 basis-48">{status || "Private to your account."}</p>
        <p>{fileCount} file{fileCount === 1 ? "" : "s"} · {fmtSize(used)} used</p>
      </footer>

      {over && <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-gg-accentline bg-gg-panel/90 text-lg font-semibold">Drop to save in {here ? byId.get(here)?.name : "My files"}</div>}

      {dlg?.t === "folder" && <NameDialog id="fm-d" title="New folder" label="Folder name" action="Create folder" initial="" onSubmit={newFolder} onClose={() => setDlg(null)} />}
      {dlg?.t === "rename" && <NameDialog id="fm-d" title="Rename" label="New name" action="Save name" initial={dlg.it.name} onSubmit={(n) => rename(dlg.it, n)} onClose={() => setDlg(null)} />}
      {dlg?.t === "move" && <MoveDialog it={dlg.it} items={items} pathLabel={pathLabel} bad={descendants(dlg.it.id)} onSubmit={(p) => move(dlg.it, p)} onClose={() => setDlg(null)} />}
      {dlg?.t === "delete" && (
        <Sheet id="fm-d" title={`Delete “${dlg.it.name}”?`} onClose={() => setDlg(null)}>
          <p className="mb-4 text-sm text-gg-fg2">{dlg.it.kind === "folder" ? "This folder and everything inside it will be removed for good." : "This file will be removed for good."}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDlg(null)} className={`min-h-11 rounded-lg border border-gg-line2 px-4 text-sm font-medium hover:bg-gg-raised ${ring}`}>Keep it</button>
            <button type="button" autoFocus onClick={() => remove(dlg.it)} className={`min-h-11 rounded-lg bg-gg-error px-4 text-sm font-semibold text-gg-base ${ring}`}>Delete</button>
          </div>
        </Sheet>
      )}
      {dlg?.t === "preview" && (
        <Sheet id="fm-d" title={dlg.it.name} wide onClose={() => setDlg(null)}>
          <img src={url(dlg.it)} alt={`Preview of ${dlg.it.name}`} className="mx-auto mb-3 max-h-[55dvh] max-w-full rounded-lg object-contain" />
          <div className="flex flex-wrap justify-end gap-2">
            <a href={url(dlg.it)} target="_blank" rel="noopener" className={`grid min-h-11 place-items-center rounded-lg border border-gg-line2 px-4 text-sm font-medium hover:bg-gg-raised ${ring}`}>Open in new tab</a>
            <a href={url(dlg.it, { download: true })} download={dlg.it.name} className={`grid min-h-11 place-items-center rounded-lg bg-gg-accent px-4 text-sm font-semibold text-gg-onaccent ${ring}`}>Download</a>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function NameDialog({ id, title, label, action, initial, onSubmit, onClose }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const ok = v.trim().length > 0 && v.trim().length <= 200;
  return (
    <Sheet id={id} title={title} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!ok || busy) return; setBusy(true); await onSubmit(v.trim()); setBusy(false); }}>
        <label htmlFor="fm-name" className="mb-1 block text-sm font-semibold">{label}</label>
        <input id="fm-name" autoFocus value={v} maxLength={200} onChange={(e) => setV(e.target.value)} onFocus={(e) => e.target.select()} className={inputCls} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`min-h-11 rounded-lg border border-gg-line2 px-4 text-sm font-medium hover:bg-gg-raised ${ring}`}>Cancel</button>
          <button type="submit" disabled={!ok || busy} className={`min-h-11 rounded-lg bg-gg-accent px-4 text-sm font-semibold text-gg-onaccent disabled:opacity-50 ${ring}`}>{action}</button>
        </div>
      </form>
    </Sheet>
  );
}

function MoveDialog({ it, items, pathLabel, bad, onSubmit, onClose }) {
  const [to, setTo] = useState(it.parent || "");
  const folders = items.filter((i) => i.kind === "folder" && !bad.has(i.id)).map((f) => ({ id: f.id, label: pathLabel(f.id) })).sort((a, b) => a.label.localeCompare(b.label));
  return (
    <Sheet id="fm-d" title={`Move “${it.name}”`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(to); }}>
        <label htmlFor="fm-to" className="mb-1 block text-sm font-semibold">Move to</label>
        <select id="fm-to" autoFocus value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
          <option value="">My files</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`min-h-11 rounded-lg border border-gg-line2 px-4 text-sm font-medium hover:bg-gg-raised ${ring}`}>Cancel</button>
          <button type="submit" className={`min-h-11 rounded-lg bg-gg-accent px-4 text-sm font-semibold text-gg-onaccent ${ring}`}>Move here</button>
        </div>
      </form>
    </Sheet>
  );
}
