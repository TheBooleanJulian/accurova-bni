// LuxSync helpers — mirrors xymiku-site/lib/luxsync.ts so both projects talk
// to the shared LuxSync instance the same way.
import { LUXSYNC_URL as CONFIGURED_URL } from "../config.js";

const LUXSYNC_URL = (CONFIGURED_URL ?? "https://luxsync-v3.thebooleanjulian.dev").replace(/\/$/, "");

export async function listDriveFolder(folderId) {
  const res = await fetch(`${LUXSYNC_URL}/api/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "drive", source: folderId }),
  });
  if (!res.ok) {
    throw new Error(`LuxSync /api/gallery failed for folder ${folderId}: ${res.status}`);
  }
  return res.json();
}

export function driveThumbUrl(fileId) {
  return `${LUXSYNC_URL}/api/thumb/drive/${fileId}`;
}

export function driveFullUrl(fileId) {
  return `${LUXSYNC_URL}/api/full/drive/${fileId}`;
}

// LuxSync's own gallery page for a Drive folder — lightbox, multi-select,
// zip/single-file download built in, so gallery cards link straight here.
export function driveGalleryUrl(folderId, sort = "date-asc") {
  return `${LUXSYNC_URL}/?provider=drive&source=${folderId}&sort=${sort}`;
}
