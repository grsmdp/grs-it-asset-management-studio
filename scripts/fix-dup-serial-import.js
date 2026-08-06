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

async function catId(name) {
  const { data } = await supabase
    .from("asset_categories")
    .select("id")
    .ilike("category_name", name)
    .maybeSingle();
  return data?.id;
}

async function subId(categoryId, name) {
  if (!name) return null;
  const { data } = await supabase
    .from("asset_subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .ilike("subcategory_name", name)
    .maybeSingle();
  return data?.id;
}

async function main() {
  const hsCat = await catId("Head set");
  const ipcCat = await catId("IP Camera");
  const bullet = await subId(ipcCat, "Bullet Camera");

  const rows = [
    {
      asset_code: "GRSHS-15",
      asset_name: "GRS HEAD SET 15",
      category_id: hsCat,
      brand: "Logitech",
      model: "Logitech\\H111",
      serial_number: null,
      status: "Active",
      remarks: "Serial in file was @ IT STORES (duplicate note - left blank)",
    },
    {
      asset_code: "GRS-IPC-214",
      asset_name: "GRS IP Camera 214",
      category_id: ipcCat,
      subcategory_id: bullet,
      brand: null,
      model: "CP-UNC-TS41PL3",
      serial_number: null,
      status: "Active",
      remarks: "Serial already on GRS-IPC-064 - left blank",
    },
  ];

  for (const payload of rows) {
    const { data, error } = await supabase
      .from("assets")
      .insert([payload])
      .select("asset_code")
      .single();
    console.log(payload.asset_code, error ? error.message : `OK ${data.asset_code}`);
  }

  const { count } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true });
  console.log("Total assets now:", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
