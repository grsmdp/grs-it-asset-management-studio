/**
 * Creates sample subcategories after asset_subcategories table exists.
 * Usage: node scripts/setup-subcategories.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const SEEDS = {
  CCTV: ["Dome", "Bullet"],
  Printer: ["Thermal", "Laser", "Inkjet"],
  Desktop: ["Tower", "AIO"],
  Laptop: ["Business", "Workstation"],
};

async function main() {
  const { data: probe, error: probeErr } = await supabase
    .from("asset_subcategories")
    .select("id")
    .limit(1);

  if (probeErr) {
    console.error("Table missing or inaccessible:", probeErr.message);
    console.error("Run this SQL in Supabase SQL Editor first:");
    console.error("  src/sql/asset_subcategories.sql");
    process.exit(1);
  }

  const { data: categories, error: catErr } = await supabase
    .from("asset_categories")
    .select("id, category_name");
  if (catErr) throw catErr;

  const { data: existing } = await supabase
    .from("asset_subcategories")
    .select("category_id, subcategory_name");

  const have = new Set(
    (existing || []).map(
      (r) => `${r.category_id}::${String(r.subcategory_name).toLowerCase()}`
    )
  );

  let created = 0;
  for (const [catName, types] of Object.entries(SEEDS)) {
    const cat = (categories || []).find(
      (c) => String(c.category_name).toLowerCase() === catName.toLowerCase()
    );
    if (!cat) {
      console.log(`Skip ${catName}: category not found (create category first)`);
      continue;
    }
    for (const type of types) {
      const key = `${cat.id}::${type.toLowerCase()}`;
      if (have.has(key)) continue;
      const { error } = await supabase.from("asset_subcategories").insert([
        {
          category_id: cat.id,
          subcategory_name: type,
          is_active: true,
        },
      ]);
      if (error) {
        console.error(`Fail ${catName}/${type}:`, error.message);
      } else {
        created++;
        console.log(`+ ${catName} → ${type}`);
      }
    }
  }

  console.log(`Done. Created ${created} subcategories. Existing probe ok (${probe?.length ?? 0}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
