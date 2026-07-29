import * as XLSX from "xlsx";

export const MASTER_META = {
  categories: {
    sheetName: "Categories",
    fileName: "Categories",
    nameField: "category_name",
    idField: "id",
    getTable: () => "asset_categories",
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
    columns: [
      { key: "location_name", label: "Location Name", required: true },
      { key: "location_type", label: "Location Type", required: false },
      { key: "area_name", label: "Area Name", required: false },
      { key: "park_region", label: "Park / Region", required: false },
      { key: "status", label: "Status", required: true },
    ],
    sampleRow: { location_name: "Main Office", location_type: "Office", area_name: "Downtown", park_region: "Central", status: "Active" },
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

export function validateRow(row, columns) {
  const errors = [];
  for (const col of columns) {
    if (col.required) {
      const val = String(row[col.key] || "").trim();
      if (!val) {
        errors.push(`${col.label} is required`);
      }
    }
  }
  const statusVal = String(row.status || "").trim().toLowerCase();
  if (statusVal && !["active", "inactive"].includes(statusVal)) {
    errors.push("Status must be Active or Inactive");
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
  const dataRows = records.map((rec) => {
    return meta.columns.map((c) => {
      if (c.key === "status") {
        return rec.is_active !== false ? "Active" : "Inactive";
      }
      return rec[c.key] ?? "";
    });
  });
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

export function classifyImportRows(parsedRows, columns, existingRecords) {
  const existingNames = new Map();
  existingRecords.forEach((r) => {
    const name = String(r[columns[0].key] || "").trim().toLowerCase();
    existingNames.set(name, r);
  });

  const resultRows = parsedRows.map((row, idx) => {
    const rowNum = idx + 2;
    const nameVal = String(row[columns[0].key] || "").trim();
    const nameLower = nameVal.toLowerCase();
    const errors = validateRow(row, columns);
    const existing = existingNames.get(nameLower);
    let result = "new";
    if (errors.length > 0) {
      result = "invalid";
    } else if (existing) {
      result = "duplicate";
    }
    return { row, rowNum, name: nameVal, errors, existing, result };
  });

  return resultRows;
}

export function buildDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
