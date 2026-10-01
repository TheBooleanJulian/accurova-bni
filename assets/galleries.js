// Row <-> view-model mapping for the `galleries` table — mirrors
// xymiku-site/lib/data.ts's getAllEvents()/eventToUplinkEvent().
import { supabase } from "./supabase-client.js";
import { driveThumbUrl, driveGalleryUrl } from "./luxsync.js";

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
    imageCount: row.drive_folder_id ? 0 : (row.image_count_override ?? 0),
    status: row.status,
    cover: row.cover_drive_file_id ? driveThumbUrl(row.cover_drive_file_id) : "",
    coverPosition: row.cover_position,
    url: row.drive_folder_id ? driveGalleryUrl(row.drive_folder_id) : row.external_url || "#",
  };
}

// Doesn't call LuxSync per row (rate-limited to 20/min) — fine for a hub
// page, not meant for precise live image counts. Admin panel shows the raw
// row instead.
export async function getAllGalleries() {
  const { data, error } = await supabase
    .from("galleries")
    .select(SELECT_COLUMNS)
    .order("gallery_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toView);
}
