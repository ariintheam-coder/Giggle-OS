import { useEffect, useRef, useState } from "react";
import { pb } from "./lib/pb";
import { buildSrcdoc, SANDBOX } from "./lib/sandbox";

const PFX = "gg-app:";

// Lets sandboxed apps use the browser's offline file storage (needed for downloaded AI models).
async function handleCache(m, win) {
  const reply = (o) => win.postMessage({ gg: "cacheRes", id: m.id, ...o }, "*");
  try {
    if (!("caches" in window)) throw new Error("Offline storage is unavailable in this browser.");
    const name = m.n ? PFX + m.n : null;
    let res = null;
    switch (m.op) {
      case "open":
        await caches.open(name);
        break;
      case "has":
        res = await caches.has(name);
        break;
      case "delcache":
        res = await caches.delete(name);
        break;
      case "names":
        res = (await caches.keys()).filter((k) => k.startsWith(PFX)).map((k) => k.slice(PFX.length));
        break;
      case "match": {
        if (!(await caches.has(name))) break;
        const r = await (await caches.open(name)).match(m.u);
        if (r) res = { b: await r.blob(), s: r.status, t: r.statusText, h: [...r.headers.entries()] };
        break;
      }
      case "add": {
        const c = await caches.open(name);
        if (!(await c.match(m.u))) await c.add(m.u);
        break;
      }
      case "put": {
        const c = await caches.open(name);
        const body = [204, 205, 304].includes(m.s) ? null : m.b;
        await c.put(m.u, new Response(body, { status: m.s, statusText: m.t, headers: m.h }));
        break;
      }
      case "del":
        res = await (await caches.open(name)).delete(m.u);
        break;
      case "keys":
        res = (await (await caches.open(name)).keys()).map((r) => r.url);
        break;
      default:
        throw new Error("Unsupported");
    }
    reply({ ok: true, res });
  } catch (e) {
    reply({ ok: false, err: String(e?.message || e) });
  }
}

// Loads a single-file HTML app, restores this user's saved data into it, and saves changes back.
export default function HtmlApp({ app, userId }) {
  const frame = useRef(null);
  const latest = useRef(null);
  const recId = useRef(null);
  const timer = useRef(null);
  const chain = useRef(Promise.resolve());
  const [doc, setDoc] = useState(null);
  const [state, setState] = useState("loading");
  const [save, setSave] = useState("saved");

  const persist = () => {
    clearTimeout(timer.current);
    timer.current = null;
    const snap = latest.current;
    if (!snap) return;
    latest.current = null;
    setSave("saving");
    chain.current = chain.current
      .then(async () => {
        const fd = new FormData();
        fd.append("blob", new Blob([JSON.stringify(snap)], { type: "application/json" }), "data.json");
        if (recId.current) {
          await pb.collection("os_data").update(recId.current, fd);
        } else {
          fd.append("owner", userId);
          fd.append("appId", app.id);
          const r = await pb.collection("os_data").create(fd);
          recId.current = r.id;
        }
        setSave(latest.current ? "saving" : "saved");
      })
      .catch(() => setSave("error"));
  };

  useEffect(() => {
    const ctl = new AbortController();
    setState("loading");
    (async () => {
      try {
        let snap = null;
        try {
          const rec = await pb.collection("os_data").getFirstListItem(`appId="${app.id}"`, { signal: ctl.signal });
          recId.current = rec.id;
          if (rec.blob) {
            const res = await fetch(pb.files.getURL(rec, rec.blob), { signal: ctl.signal });
            if (res.ok) snap = await res.json();
          }
        } catch (e) {
          if (e?.isAbort || e?.name === "AbortError") return;
          if (e?.status !== 404) throw e;
        }
        const html = (await (await fetch(app.src, { signal: ctl.signal })).text()).replace(/__ORIGIN__/g, window.location.origin);
        setDoc(buildSrcdoc(html, snap));
        setState("ready");
      } catch (e) {
        if (e?.isAbort || e?.name === "AbortError") return;
        setState("error");
      }
    })();
    return () => ctl.abort();
  }, [app.id, app.src, userId]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.gg === "cache") {
        handleCache(e.data, e.source);
        return;
      }
      if (e.data?.gg !== "save") return;
      latest.current = e.data.snap;
      setSave("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(persist, 800);
    };
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      if (latest.current) persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "error")
    return (
      <div className="grid h-full place-items-center p-6 text-center text-gg-fg">
        <p>This app couldn't start. Close it and open it again.</p>
      </div>
    );
  if (state === "loading")
    return <div className="grid h-full place-items-center text-gg-fg2">Opening {app.name}…</div>;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe ref={frame} title={app.name} srcDoc={doc} sandbox={SANDBOX} allow="webgpu; clipboard-write; autoplay; fullscreen; encrypted-media; picture-in-picture" className="min-h-0 flex-1 border-0 bg-white" />
      <div role="status" className="flex h-7 shrink-0 items-center justify-end border-t border-gg-line bg-gg-panel px-3 text-xs text-gg-fg2">
        {save === "saving" && "Saving your progress…"}
        {save === "saved" && "Everything is saved to your account"}
        {save === "error" && "Couldn't save just now. Keep this window open and try again."}
      </div>
    </div>
  );
}
