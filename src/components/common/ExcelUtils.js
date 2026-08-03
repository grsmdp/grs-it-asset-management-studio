import * as XLSX from "xlsx";

export const MASTER_META = {
  categories: {
    sheetName: "Categories",
    fileName: "Categories",
    nameField: "category_name",
    idField: "id",
    getTable: () => "asset_categories",
    statusType: "active",
    columns: [
      { key: "category_name", label: "Category Name", required: true },
      { key: "code_prefix", label: "Code Prefix", required: false },
      { key: "status", label: "Status", required: true },
    ],
    sampleRow: { category_name: "Desktop", code_prefix: "DESK", status: "Active" },
  },
  departments: {
    sheetName: "Departments",
    fileName: "Departments",
    nameField: "department_name",
    idField: "id",
    getTable: () => "departments",
    statusType: "active",
    columns: [
      { key: "department_name", label: "Department Name", required: true },
      { key: "status", label: "Status", required: true },
    ],
    sampleRow: { department_name: "IT Department", status: "Active" },
  },
  vendors: {
    sheetName: "Vendors",
    fileName: "Vendors",
    nameField: "vendor_name",
    idField: "id",
    getTable: () => "vendors",
    statusType: "active",
    columns: [
      { key: "vendor_name", label: "Vendor Name", required: true },
      { key: "contact_person", label: "Contact Person", required: false },
      { key: "phone", label: "Phone", required: false },
      { key: "email", label: "Email", required: false },
      { key: "status", label: "Status", required: true },
    ],
    sampleRow: {
      vendor_name: "Tech Supplies Inc",
      contact_person: "John Doe",
      phone: "9876543210",
      email: "john@techsupplies.com",
      status: "Active",
    },
  },
  locations: {
    sheetName: "Locations",
    fileName: "Locations",
    nameField: "location_name",
    idField: "id",
    getTable: () => "locations",
    statusType: "active",
    columns: [
      { key: "location_name", label: "Location Name", required: true },
      { key: "location_type", label: "Location Type", required: false },
      { key: "area_name", label: "Area Name", required: false },
      { key: "park_region", label: "Park / Region", required: false },
      { key: "status", label: "Status", required: true },
    ],
    sampleRow: {
      location_name: "Main Office",
      location_type: "Office",
      area_name: "Downtown",
      park_region: "Central",
      status: "Active",
    },
  },
  assets: {
    sheetName: "Assets",
    fileName: "Assets",
    nameField: "asset_code",
    idField: "id",
    getTable: () => "assets",
    statusType: "asset",
    columns: [
      { key: "asset_code", label: "Asset Code", required: false },
      { key: "asset_name", label: "Asset Name", required: true },
      { key: "category", label: "Category", required: true },
      { key: "brand", label: "Brand", required: false },
      { key: "model", label: "Model", required: false },
      { key: "serial_number", label: "Serial Number", required: false },
      { key: "vendor", label: "Vendor", required: false },
      { key: "purchase_date", label: "Purchase Date", required: false },
      { key: "purchase_cost", label: "Purchase Cost", required: false },
      { key: "warranty_expiry", label: "Warranty Expiry", required: false },
      { key: "department", label: "Department", required: false },
      { key: "location", label: "Location", required: true },
      { key: "status", label: "Status", required: true },
      { key: "remarks", label: "Remarks", required: false },
    ],
    sampleRow: {
      asset_code: "DESK-001",
      asset_name: "Dell OptiPlex",
      category: "Desktop",
      brand: "Dell",
      model: "OptiPlex 7090",
      serial_number: "SN123456",
      vendor: "Tech Supplies Inc",
      purchase_date: "2024-01-15",
      purchase_cost: "45000",
      warranty_expiry: "2027-01-15",
      department: "IT Department",
      location: "Main Office",
      status: "Active",
      remarks: "",
    },
  },
};

const DB_FIELD_MAP = {
  category_name: "category_name",
  code_prefix: "code_prefix",
  department_name: "department_name",
  vendor_name: "vendor_name",
  contact_person: "contact_person",
  phone: "phone",
  email: "email",
  location_name: "location_name",
  location_type: "location_type",
  area_name: "area_name",
  park_region: "park_region",
};

const ASSET_STATUSES = ["active", "spare", "under repair", "scrapped"];

function buildNameLookup(list, nameKey) {
  const map = new Map();
  (list || []).forEach((item) => {
    const name = String(item[nameKey] || "").trim().toLowerCase();
    if (name) map.set(name, item);
  });
  return map;
}

function resolveByName(lookup, value, label) {
  const name = String(value || "").trim();
  if (!name) return { id: null, error: null };
  const match = lookup.get(name.toLowerCase());
  if (!match) return { id: null, error: `${label} "${name}" not found` };
  return { id: match.id, error: null };
}

export function buildRowPayload(row) {
  const payload = {};
  for (const [colKey, dbField] of Object.entries(DB_FIELD_MAP)) {
    if (row[colKey] !== undefined && row[colKey] !== null) {
      const val = String(row[colKey]).trim();
      if (val) payload[dbField] = val;
    }
  }
  const statusVal = String(row.status || "").trim().toLowerCase();
  if (statusVal) {
    payload.is_active = statusVal === "active";
  }
  return payload;
}

export function buildAssetRowPayload(row, lookups = {}) {
  const errors = [];
  const categories = buildNameLookup(lookups.categories, "category_name");
  const departments = buildNameLookup(lookups.departments, "department_name");
  const vendors = buildNameLookup(lookups.vendors, "vendor_name");
  const locations = buildNameLookup(lookups.locations, "location_name");

  const category = resolveByName(categories, row.category, "Category");
  const location = resolveByName(locations, row.location, "Location");
  const department = resolveByName(departments, row.department, "Department");
  const vendor = resolveByName(vendors, row.vendor, "Vendor");

  if (category.error) errors.push(category.error);
  if (location.error) errors.push(location.error);
  if (String(row.department || "").trim() && department.error) errors.push(department.error);
  if (String(row.vendor || "").trim() && vendor.error) errors.push(vendor.error);

  const statusRaw = String(row.status || "").trim();
  const statusNorm = statusRaw.toLowerCase();
  let status = "Active";
  if (statusNorm === "active") status = "Active";
  else if (statusNorm === "spare") status = "Spare";
  else if (statusNorm === "under repair") status = "Under Repair";
  else if (statusNorm === "scrapped") status = "Scrapped";
  else if (statusRaw) errors.push("Status must be Active, Spare, Under Repair, or Scrapped");

  const costRaw = String(row.purchase_cost ?? "").trim();
  let purchase_cost = null;
  if (costRaw) {
    const n = Number(costRaw);
    if (Number.isNaN(n)) errors.push("Purchase Cost must be a number");
    else purchase_cost = n;
  }

  const payload = {
    asset_code: String(row.asset_code || "").trim() || null,
    asset_name: String(row.asset_name || "").trim(),
    category_id: category.id,
    brand: String(row.brand || "").trim() || null,
    model: String(row.model || "").trim() || null,
    serial_number: String(row.serial_number || "").trim() || null,
    vendor_id: vendor.id,
    purchase_date: String(row.purchase_date || "").trim() || null,
    purchase_cost,
    warranty_expiry: String(row.warranty_expiry || "").trim() || null,
    department_id: department.id,
    current_location_id: location.id,
    status,
    remarks: String(row.remarks || "").trim() || null,
  };

  return { payload, errors };
}

export function flattenAssetForExport(asset, lookups = {}) {
  const cat = Object.fromEntries((lookups.categories || []).map((c) => [c.id, c.category_name]));
  const dept = Object.fromEntries((lookups.departments || []).map((d) => [d.id, d.department_name]));
  const vend = Object.fromEntries((lookups.vendors || []).map((v) => [v.id, v.vendor_name]));
  const loc = Object.fromEntries((lookups.locations || []).map((l) => [l.id, l.location_name]));

  return {
    asset_code: asset.asset_code || "",
    asset_name: asset.asset_name || "",
    category: cat[asset.category_id] || "",
    brand: asset.brand || "",
    model: asset.model || "",
    serial_number: asset.serial_number || "",
    vendor: vend[asset.vendor_id] || "",
    purchase_date: asset.purchase_date || "",
    purchase_cost: asset.purchase_cost ?? "",
    warranty_expiry: asset.warranty_expiry || "",
    department: dept[asset.department_id] || "",
    location: loc[asset.current_location_id || asset.location_id] || "",
    status: asset.status || "Active",
    remarks: asset.remarks || "",
  };
}

export function validateRow(row, columns, meta = null) {
  const errors = [];
  for (const col of columns) {
    if (col.required) {
      const val = String(row[col.key] || "").trim();
      if (!val) errors.push(`${col.label} is required`);
    }
  }

  const statusVal = String(row.status || "").trim().toLowerCase();
  if (statusVal) {
    if (meta?.statusType === "asset") {
      if (!ASSET_STATUSES.includes(statusVal)) {
        errors.push("Status must be Active, Spare, Under Repair, or Scrapped");
      }
    } else if (!["active", "inactive"].includes(statusVal)) {
      errors.push("Status must be Active or Inactive");
    }
  }

  if (row.email) {
    const email = String(row.email).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }
  }
  if (row.phone) {
    const phone = String(row.phone).trim();
    if (phone && !/^[\d\s\-+()]{6,20}$/.test(phone)) {
      errors.push("Invalid phone number");
    }
  }
  return errors;
}

export function normalizeParsedRows(rows, meta) {
  const labelToKey = {};
  meta.columns.forEach((c) => {
    labelToKey[c.label.toLowerCase()] = c.key;
    labelToKey[`${c.label} (required)`.toLowerCase()] = c.key;
    labelToKey[c.key.toLowerCase()] = c.key;
  });

  return rows
    .map((row) => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        const key = labelToKey[String(k).trim().toLowerCase()];
        if (key) out[key] = v;
      }
      return out;
    })
    .filter((row) =>
      meta.columns.some((c) => String(row[c.key] || "").trim() !== "")
    );
}

export function generateTemplate(meta) {
  const wb = XLSX.utils.book_new();
  const headerRow = meta.columns.map((c) => `${c.label}${c.required ? " (Required)" : ""}`);
  const sampleRow = meta.columns.map((c) => meta.sampleRow[c.key] || "");
  const emptyRow = meta.columns.map(() => "");
  const wsData = [
    headerRow,
    sampleRow,
    emptyRow,
    ...Array.from({ length: 18 }, () => emptyRow),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = meta.columns.map((c) => {
    const headerLen = c.label.length + (c.required ? 12 : 0);
    return { wch: Math.max(headerLen, 18) };
  });
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, meta.sheetName);
  return wb;
}

export function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}

export function exportToExcel(records, meta) {
  const wb = XLSX.utils.book_new();
  const headerRow = meta.columns.map((c) => c.label);
  const dataRows = records.map((rec) =>
    meta.columns.map((c) => {
      if (c.key === "status" && meta.statusType !== "asset") {
        return rec.is_active !== false ? "Active" : "Inactive";
      }
      return rec[c.key] ?? "";
    })
  );
  const wsData = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = meta.columns.map((c) => ({ wch: Math.max(c.label.length, 18) }));
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, meta.sheetName);
  return wb;
}

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        resolve(json);
      } catch (err) {
        reject(new Error("Failed to parse Excel file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function classifyImportRows(parsedRows, meta, existingRecords, lookups = null) {
  const nameField = meta.nameField || meta.columns[0].key;
  const existingNames = new Map();
  existingRecords.forEach((r) => {
    const name = String(r[nameField] || "").trim().toLowerCase();
    if (name) existingNames.set(name, r);
  });

  return parsedRows.map((row, idx) => {
    const rowNum = idx + 2;
    const nameVal = String(row[nameField] || row.asset_name || "").trim();
    const matchKey = String(row[nameField] || "").trim().toLowerCase();
    let errors = validateRow(row, meta.columns, meta);

    if (meta.statusType === "asset" && lookups) {
      const { errors: lookupErrors } = buildAssetRowPayload(row, lookups);
      errors = [...errors, ...lookupErrors];
    }

    const existing = matchKey ? existingNames.get(matchKey) : null;
    let result = "new";
    if (errors.length > 0) result = "invalid";
    else if (existing) result = "duplicate";

    return { row, rowNum, name: nameVal || `Row ${rowNum}`, errors, existing, result };
  });
}

export function buildDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
