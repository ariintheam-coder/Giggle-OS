import { pb } from "./pb";

export const PART = 15000000;
export const MAX_TOTAL = 500000000;

/* Files bigger than one piece are saved as a main entry plus numbered pieces. */
export async function saveBig(file, meta, onProgress) {
  const n = Math.ceil(file.size / PART);
  const main = await pb.collection("os_files").create({ ...meta, kind: "file", size: file.size, parts: n }, { requestKey: null });
  try {
    for (let i = 0; i < n; i++) {
      onProgress?.(i + 1, n);
      const fd = new FormData();
      fd.append("owner", meta.owner);
      fd.append("name", `${meta.name}.part${i + 1}`);
      fd.append("kind", "part");
      fd.append("grp", main.id);
      fd.append("part", String(i));
      fd.append("file", file.slice(i * PART, (i + 1) * PART), `part${i + 1}`);
      await pb.collection("os_files").create(fd, { requestKey: null });
    }
  } catch (e) {
    await deleteParts(main.id).catch(() => {});
    await pb.collection("os_files").delete(main.id, { requestKey: null }).catch(() => {});
    throw e;
  }
  return main;
}

export async function listParts(id) {
  const rows = await pb.collection("os_files").getFullList({ filter: `grp="${id}"`, sort: "part", requestKey: null });
  return rows;
}

export async function deleteParts(id) {
  for (const r of await listParts(id)) await pb.collection("os_files").delete(r.id, { requestKey: null });
}

export async function bigBlob(rec, onProgress) {
  const rows = await listParts(rec.id);
  if (rows.length !== rec.parts) throw new Error("incomplete");
  const token = await pb.files.getToken({ requestKey: null });
  const bufs = [];
  for (let i = 0; i < rows.length; i++) {
    onProgress?.(i + 1, rows.length);
    const r = await fetch(pb.files.getURL(rows[i], rows[i].file, { token }));
    if (!r.ok) throw new Error("part");
    bufs.push(await r.blob());
  }
  return new Blob(bufs, { type: rec.mime || "application/octet-stream" });
}

export async function downloadBig(rec, onProgress) {
  const blob = await bigBlob(rec, onProgress);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = rec.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
