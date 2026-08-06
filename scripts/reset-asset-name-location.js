/**
 * Reset Asset Name + Location for a clean template re-upload.
 * - Clears current_location_id on all assets
 * - Deletes all locations (Location master)
 * - Optionally blanks asset_name to a placeholder (keeps asset_code / other fields)
 *
 * Usage: node scripts/reset-asset-name-location.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: assets, error: aErr } = await supabase
    .from("assets")
    .select("id, asset_code, asset_name, current_location_id");
  if (aErr) throw aErr;

  console.log(`Assets found: ${(assets || []).length}`);

  // 1) Clear location assignment + reset asset_name placeholder (kept for NOT NULL)
  let cleared = 0;
  for (const a of assets || []) {
    const { error } = await supabase
      .from("assets")
      .update({
        current_location_id: null,
        asset_name: `[RESET] ${a.asset_code || a.id}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);
    if (error) throw error;
    cleared++;
  }
  console.log(`Cleared location + reset asset_name on ${cleared} assets`);

  // 2) Delete all locations
  const { data: locs, error: lErr } = await supabase.from("locations").select("id, location_name");
  if (lErr) throw lErr;

  let deleted = 0;
  for (const loc of locs || []) {
    const { error } = await supabase.from("locations").delete().eq("id", loc.id);
    if (error) {
      console.warn(`  Could not delete location "${loc.location_name}": ${error.message}`);
      continue;
    }
    deleted++;
  }
  console.log(`Deleted ${deleted} locations (of ${(locs || []).length})`);

  console.log("Done. Re-upload Assets_Template.xlsx and run import-assets-template.js");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
