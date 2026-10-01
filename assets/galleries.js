// Row <-> view-model mapping for the `galleries` table — mirrors
// xymiku-site/lib/data.ts's getAllEvents()/eventToUplinkEvent().
import { supabase } from "./supabase-client.js";
import { driveThumbUrl, driveGalleryUrl, listDriveFolder } from "./luxsync.js";

const SELECT_COLUMNS =
  "id,name,gallery_date,status,drive_folder_id,cover_drive_file_id,external_url,cover_position,image_count_override";

function formatDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${day} ${month} ${d.getUTCFullYear()}`;
}

function toView(row) {
  return {
    id: row.id,
    name: row.name,
    date: formatDate(row.gallery_date),
    // Real count for Drive-folder galleries arrives later via
    // loadImageCounts() — null here means "not fetched yet", distinct from
    // a real 0. Non-Drive galleries just use the manual override.
    imageCount: row.drive_folder_id ? null : (row.image_count_override ?? 0),
    status: row.status,
    cover: row.cover_drive_file_id ? driveThumbUrl(row.cover_drive_file_id) : "",
    coverPosition: row.cover_position,
    url: row.drive_folder_id ? driveGalleryUrl(row.drive_folder_id) : row.external_url || "#",
    driveFolderId: row.drive_folder_id || null,
  };
}

export async function getAllGalleries() {
  const { data, error } = await supabase
    .from("galleries")
    .select(SELECT_COLUMNS)
    .order("gallery_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toView);
}

// Fetches real Drive-folder image counts and reports each one back via
// onCount as it resolves, instead of blocking on the whole batch — so the
// hub can show counts progressively. Capped concurrency respects LuxSync's
// /api/gallery rate limit (20/min) rather than firing every request at once.
export async function loadImageCounts(galleries, onCount, concurrency = 4) {
  const withFolders = galleries.filter((g) => g.driveFolderId);
  let next = 0;

  async function worker() {
    while (next < withFolders.length) {
      const gallery = withFolders[next++];
      try {
        const { files } = await listDriveFolder(gallery.driveFolderId);
        onCount(gallery.id, files.length);
      } catch (err) {
        console.error(`image count fetch failed for gallery ${gallery.id}`, err);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, withFolders.length) }, worker));
}
