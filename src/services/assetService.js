import { supabase } from "./supabase";

/* ==========================================================
   LOAD MASTER DATA
========================================================== */

export async function getCategories() {
  const { data, error } = await supabase
    .from("asset_categories")
    .select("*")
    .order("category_name");

  if (error) throw error;

  return data;
}

export async function getLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("location_name");

  if (error) throw error;

  return data;
}

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("department_name");

  if (error) throw error;

  return data;
}

export async function getVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("vendor_name");

  if (error) throw error;

  return data;
}

export async function getSubcategories() {
  const { data, error } = await supabase
    .from("asset_subcategories")
    .select("*")
    .order("subcategory_name");

  if (error) throw error;

  return data || [];
}

export async function createSubcategory(record) {
  const { data, error } = await supabase
    .from("asset_subcategories")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateSubcategory(id, record) {
  const { data, error } = await supabase
    .from("asset_subcategories")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteSubcategory(id) {
  const { error } = await supabase.from("asset_subcategories").delete().eq("id", id);
  if (error) throw error;
}

export async function loadMasterData() {
  const [categories, locations, departments, vendors, subcategories] = await Promise.all([
    getCategories(),
    getLocations(),
    getDepartments(),
    getVendors(),
    getSubcategories().catch(() => []),
  ]);

  return { categories, locations, departments, vendors, subcategories };
}

/* ==========================================================
   MASTER CRUD
========================================================== */

export async function createCategory(record) {
  const { data, error } = await supabase
    .from("asset_categories")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, record) {
  const { data, error } = await supabase
    .from("asset_categories")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("asset_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function createDepartment(record) {
  const { data, error } = await supabase
    .from("departments")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id, record) {
  const { data, error } = await supabase
    .from("departments")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id) {
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw error;
}

export async function createVendor(record) {
  const { data, error } = await supabase
    .from("vendors")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateVendor(id, record) {
  const { data, error } = await supabase
    .from("vendors")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteVendor(id) {
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) throw error;
}

export async function createLocation(record) {
  const { data, error } = await supabase
    .from("locations")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateLocation(id, record) {
  const { data, error } = await supabase
    .from("locations")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteLocation(id) {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

/* ==========================================================
   LOAD ALL ASSETS
========================================================== */

export async function getAssets() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("asset_code");

  if (error) throw error;

  return data;
}

export async function getAssetById(id) {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

/* ==========================================================
   GENERATE NEXT ASSET CODE
========================================================== */

export async function generateAssetCode(categoryId) {
  if (!categoryId) return "";

  const { data: category, error: categoryError } = await supabase
    .from("asset_categories")
    .select("code_prefix")
    .eq("id", categoryId)
    .single();

  if (categoryError) throw categoryError;

  const prefix = category.code_prefix;

  const { data: assets, error: assetError } = await supabase
    .from("assets")
    .select("asset_code")
    .like("asset_code", `${prefix}%`)
    .order("asset_code", { ascending: false })
    .limit(1);

  if (assetError) throw assetError;

  let nextNumber = 1;

  if (assets.length > 0) {
    const lastCode = assets[0].asset_code;

    const lastNumber = parseInt(
      lastCode.substring(prefix.length + 1),
      10
    );

    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

function buildAssetPayload(formData) {
  const toId = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  return {
    asset_code: formData.asset_code,
    asset_name: formData.asset_name,
    category_id: toId(formData.category_id),
    subcategory_id: toId(formData.subcategory_id),
    brand: formData.brand || null,
    model: formData.model || null,
    serial_number: formData.serial_number || null,
    vendor_id: toId(formData.vendor_id),
    purchase_date: formData.purchase_date || null,
    purchase_cost:
      formData.purchase_cost === "" || formData.purchase_cost == null
        ? null
        : Number(formData.purchase_cost),
    warranty_expiry: formData.warranty_expiry || null,
    department_id: toId(formData.department_id),
    current_location_id: toId(formData.current_location_id),
    status: formData.status,
    remarks: formData.remarks || null,
  };
}

/* ==========================================================
   SAVE / UPDATE / DELETE ASSET
========================================================== */

export async function saveAsset(asset) {
  const { data, error } = await supabase
    .from("assets")
    .insert([asset])
    .select();

  if (error) throw error;

  return data;
}

export async function updateAsset(id, asset) {
  const { data, error } = await supabase
    .from("assets")
    .update({ ...asset, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteAsset(id) {
  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) throw error;
}

export function mapAssetToForm(asset) {
  return {
    assetCode: asset.asset_code || "",
    assetName: asset.asset_name || "",
    category: asset.category_id ? String(asset.category_id) : "",
    subCategory: asset.subcategory_id ? String(asset.subcategory_id) : "",
    brand: asset.brand || "",
    model: asset.model || "",
    serialNumber: asset.serial_number || "",
    vendor: asset.vendor_id ? String(asset.vendor_id) : "",
    purchaseDate: asset.purchase_date || "",
    purchaseCost: asset.purchase_cost ?? "",
    warrantyExpiry: asset.warranty_expiry || "",
    department: asset.department_id ? String(asset.department_id) : "",
    location: asset.current_location_id
      ? String(asset.current_location_id)
      : asset.location_id
        ? String(asset.location_id)
        : "",
    status: asset.status || "Active",
    remarks: asset.remarks || "",
  };
}

export function mapFormToAsset(formData) {
  return buildAssetPayload({
    asset_code: formData.assetCode,
    asset_name: formData.assetName,
    category_id: formData.category,
    subcategory_id: formData.subCategory,
    brand: formData.brand,
    model: formData.model,
    serial_number: formData.serialNumber,
    vendor_id: formData.vendor,
    purchase_date: formData.purchaseDate,
    purchase_cost: formData.purchaseCost,
    warranty_expiry: formData.warrantyExpiry,
    department_id: formData.department,
    current_location_id: formData.location,
    status: formData.status,
    remarks: formData.remarks,
  });
}

/* ==========================================================
   ASSET MOVEMENTS
========================================================== */

export async function getMovements() {
  const { data, error } = await supabase
    .from("asset_movements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function createMovement(movement) {
  const { data, error } = await supabase
    .from("asset_movements")
    .insert([movement])
    .select();

  if (error) throw error;

  return data;
}

/* ==========================================================
   MAINTENANCE
========================================================== */

export async function getMaintenanceRecords() {
  const { data, error } = await supabase
    .from("asset_maintenance")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function createMaintenance(record) {
  const { data, error } = await supabase
    .from("asset_maintenance")
    .insert([record])
    .select();

  if (error) throw error;

  return data;
}

export async function updateMaintenance(id, record) {
  const { data, error } = await supabase
    .from("asset_maintenance")
    .update(record)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

/* ==========================================================
   DASHBOARD / REPORTS
========================================================== */

export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const getCount = (result) =>
    result.status === "fulfilled" ? result.value?.count || 0 : 0;

  const results = await Promise.allSettled([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Under Repair"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Spare"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Scrapped"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .not("warranty_expiry", "is", null)
      .lte("warranty_expiry", thirtyDaysLater)
      .gte("warranty_expiry", today),
    supabase
      .from("asset_movements")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("asset_maintenance")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    totalAssets: getCount(results[0]),
    activeAssets: getCount(results[1]),
    repairAssets: getCount(results[2]),
    spareAssets: getCount(results[3]),
    scrappedAssets: getCount(results[4]),
    warrantyExpiring: getCount(results[5]),
    movementCount: getCount(results[6]),
    maintenanceCount: getCount(results[7]),
  };
}

export async function getRecentAssets(limit = 5) {
  const { data, error } = await supabase
    .from("assets")
    .select("*, asset_categories(category_name), current_location:current_location_id(location_name), departments(department_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

export async function getRecentMovements(limit = 5) {
  const { data, error } = await supabase
    .from("asset_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

export async function getReportSummary() {
  const [assets, categories, locations, departments, vendors, movements, maintenance] =
    await Promise.all([
      getAssets(),
      getCategories(),
      getLocations(),
      getDepartments(),
      getVendors(),
      getMovements(),
      getMaintenanceRecords(),
    ]);

  const statusBreakdown = assets.reduce((acc, asset) => {
    const status = asset.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalValue = assets.reduce(
    (sum, asset) => sum + (Number(asset.purchase_cost) || 0),
    0
  );

  return {
    assets,
    categories,
    locations,
    departments,
    vendors,
    movements,
    maintenance,
    statusBreakdown,
    totalValue,
  };
}
