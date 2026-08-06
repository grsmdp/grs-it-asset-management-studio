import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

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
const filePath = process.argv[2] || "C:/Users/mdp/Downloads/Assets_Template.xlsx";

const CAT_PREFIX = {
  Desktop: "GRS-DTPC",
  "Mini PC": "GRS-MIPC",
  "Thin PC": "GRS-TNPC",
  "Touch POS": "GRS-TPOS",
  Laptop: "GRS-LPT",
  "Head set": "GRS-HS",
  Mobile: "GRS-MOB",
  "Pen Drive": "GRS-PD",
  "IP Camera": "GRS-IPC",
};

function val(row, labels) {
  for (const [k, v] of Object.entries(row)) {
    const n = String(k)
      .toLowerCase()
      .replace(/\s*\(required\)\s*/gi, "")
      .trim();
    if (labels.includes(n)) return String(v ?? "").trim();
  }
  return "";
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function excelDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 30000) {
    const d = XLSX.SSF.parse_date_code(Number(s));
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  // Accept only real calendar dates (reject Excel drag garbage like 2024-01-32)
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === mo - 1 &&
      dt.getUTCDate() === d
    ) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return null;
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

function normStatus(s) {
  const n = String(s || "").trim().toLowerCase();
  if (n === "spare") return "Spare";
  if (n === "under repair") return "Under Repair";
  if (n === "scrapped") return "Scrapped";
  return "Active";
}

async function ensureMaster(table, nameField, names, extraFn) {
  const { data: existing, error } = await supabase.from(table).select("*");
  if (error) throw error;
  const map = new Map(
    (existing || []).map((r) => [String(r[nameField]).trim().toLowerCase(), r])
  );
  let created = 0;
  for (const name of names) {
    const key = name.toLowerCase();
    if (map.has(key)) continue;
    const payload = {
      [nameField]: name,
      is_active: true,
      ...(extraFn ? extraFn(name) : {}),
    };
    const { data, error: e } = await supabase
      .from(table)
      .insert([payload])
      .select()
      .single();
    if (e) throw new Error(`${table} "${name}": ${e.message}`);
    map.set(key, data);
    created++;
  }
  return { map, created, total: map.size };
}

async function main() {
  const wb = XLSX.readFile(filePath);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const rows = raw
    .map((r) => ({
      asset_code: val(r, ["asset code"]),
      asset_name: val(r, ["asset name"]),
      category: val(r, ["category"]),
      subcategory: val(r, ["sub category", "subcategory"]),
      brand: val(r, ["brand"]),
      model: val(r, ["model"]),
      serial_number: val(r, ["serial number"]),
      vendor: val(r, ["vendor"]),
      purchase_date: val(r, ["purchase date"]),
      purchase_cost: val(r, ["purchase cost"]),
      warranty_expiry: val(r, ["warranty expiry"]),
      department: val(r, ["department"]),
      location: val(r, ["location"]),
      status: val(r, ["status"]) || "Active",
      remarks: val(r, ["remarks"]),
    }))
    .filter((r) => r.asset_name && r.category);

  const blankLocation = rows.filter((r) => !r.location).length;
  console.log(`Loaded ${rows.length} asset rows from ${filePath}`);
  console.log(`  Blank Location: ${blankLocation} (allowed — left empty)`);
  console.log(
    `  Blank optional cols kept as null (Sub Category / Brand / Vendor / dates / etc.)`
  );

  const categories = uniq(rows.map((r) => r.category));
  const departments = uniq(rows.map((r) => r.department));
  const locations = uniq(rows.map((r) => r.location));
  const vendors = uniq(rows.map((r) => r.vendor));

  console.log("Creating missing masters...");
  const catRes = await ensureMaster(
    "asset_categories",
    "category_name",
    categories,
    (name) => ({
      code_prefix:
        CAT_PREFIX[name] ||
        name.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase(),
    })
  );
  console.log(`  Categories: +${catRes.created} (total ${catRes.total})`);

  const deptRes = await ensureMaster("departments", "department_name", departments);
  console.log(`  Departments: +${deptRes.created} (total ${deptRes.total})`);

  const locRes = await ensureMaster("locations", "location_name", locations, () => ({
    location_type: "Site",
  }));
  console.log(`  Locations: +${locRes.created} (total ${locRes.total})`);

  const vendRes = await ensureMaster("vendors", "vendor_name", vendors);
  console.log(`  Vendors: +${vendRes.created} (total ${vendRes.total})`);

  // Subcategories (optional) under each category
  const { data: existingSubs, error: subErr } = await supabase
    .from("asset_subcategories")
    .select("*");
  if (subErr) throw subErr;
  const subMap = new Map();
  for (const s of existingSubs || []) {
    const key = `${s.category_id}::${String(s.subcategory_name).trim().toLowerCase()}`;
    subMap.set(key, s);
  }
  let subCreated = 0;
  for (const r of rows) {
    if (!r.subcategory || !r.category) continue;
    const cat = catRes.map.get(r.category.toLowerCase());
    if (!cat) continue;
    const key = `${cat.id}::${r.subcategory.toLowerCase()}`;
    if (subMap.has(key)) continue;
    const { data, error } = await supabase
      .from("asset_subcategories")
      .insert([
        {
          category_id: cat.id,
          subcategory_name: r.subcategory,
          is_active: true,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(`Sub Category "${r.subcategory}": ${error.message}`);
    subMap.set(key, data);
    subCreated++;
  }
  console.log(`  Sub Categories: +${subCreated} (total ${subMap.size})`);

  const { data: existingAssets, error: aErr } = await supabase
    .from("assets")
    .select("id, asset_code");
  if (aErr) throw aErr;

  const byCode = new Map(
    (existingAssets || []).map((a) => [String(a.asset_code).trim().toLowerCase(), a])
  );

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  console.log("Importing assets...");
  for (const r of rows) {
    try {
      const cat = catRes.map.get(r.category.toLowerCase());
      const loc = r.location ? locRes.map.get(r.location.toLowerCase()) : null;
      const dept = r.department
        ? deptRes.map.get(r.department.toLowerCase())
        : null;
      const vend = r.vendor ? vendRes.map.get(r.vendor.toLowerCase()) : null;

      if (!cat) throw new Error(`Category missing: ${r.category}`);
      if (r.location && !loc) throw new Error(`Location missing: ${r.location}`);

      let subcategory_id = null;
      if (r.subcategory) {
        const key = `${cat.id}::${r.subcategory.toLowerCase()}`;
        subcategory_id = subMap.get(key)?.id || null;
      }

      const serial =
        r.serial_number === "0" || r.serial_number === ""
          ? null
          : r.serial_number;
      const cost =
        r.purchase_cost === "" ? null : Number(r.purchase_cost);

      const payload = {
        asset_code: r.asset_code || null,
        asset_name: r.asset_name,
        category_id: cat.id,
        subcategory_id,
        brand: r.brand || null,
        model: r.model || null,
        serial_number: serial,
        vendor_id: vend?.id || null,
        purchase_date: excelDate(r.purchase_date),
        purchase_cost: Number.isNaN(cost) ? null : cost,
        warranty_expiry: excelDate(r.warranty_expiry),
        department_id: dept?.id || null,
        current_location_id: loc?.id || null,
        status: normStatus(r.status),
        remarks: r.remarks || null,
      };

      if (!payload.asset_code) {
        const prefix = cat.code_prefix;
        const { data: last } = await supabase
          .from("assets")
          .select("asset_code")
          .like("asset_code", `${prefix}%`)
          .order("asset_code", { ascending: false })
          .limit(1);
        let next = 1;
        if (last?.length) {
          const m = String(last[0].asset_code).match(/(\d+)$/);
          if (m) next = parseInt(m[1], 10) + 1;
        }
        payload.asset_code = `${prefix}-${String(next).padStart(3, "0")}`;
      }

      const existing = byCode.get(payload.asset_code.toLowerCase());
      if (existing) {
        const { error } = await supabase
          .from("assets")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        updated++;
      } else {
        let { data, error } = await supabase
          .from("assets")
          .insert([payload])
          .select("id, asset_code")
          .single();
        // Duplicate serial: retry with serial cleared (keep other fields)
        if (error && /serial_number/i.test(error.message) && payload.serial_number) {
          payload.serial_number = null;
          payload.remarks = [payload.remarks, "Serial cleared (duplicate in DB)"]
            .filter(Boolean)
            .join(" | ");
          ({ data, error } = await supabase
            .from("assets")
            .insert([payload])
            .select("id, asset_code")
            .single());
        }
        if (error) throw error;
        byCode.set(data.asset_code.toLowerCase(), data);
        imported++;
      }
    } catch (e) {
      skipped++;
      errors.push(`${r.asset_code || r.asset_name}: ${e.message}`);
    }
  }

  console.log(
    JSON.stringify(
      { imported, updated, skipped, errorCount: errors.length, errors: errors.slice(0, 20) },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
