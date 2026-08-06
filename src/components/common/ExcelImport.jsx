import { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MASTER_META,
  parseFile,
  normalizeParsedRows,
  classifyImportRows,
  buildRowPayload,
  buildAssetRowPayload,
} from "./ExcelUtils";
import { supabase } from "@/services/supabase";
import { generateAssetCode } from "@/services/assetService";
import ImportSummary from "./ImportSummary";

function ExcelImport({ masterType, existingRecords, onImportComplete, onClose, lookups }) {
  const meta = MASTER_META[masterType];
  const fileRef = useRef(null);
  const [step, setStep] = useState("select");
  const [previewRows, setPreviewRows] = useState([]);
  const [importOption, setImportOption] = useState(
    masterType === "assets" ? "upsert" : "insert"
  );
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

  const isAssets = masterType === "assets";
  const statNew = previewRows.filter((r) => r.result === "new" && r.errors.length === 0).length;
  const statDuplicate = previewRows.filter((r) => r.result === "duplicate").length;
  const statInvalid = previewRows.filter((r) => r.errors.length > 0).length;

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");

    try {
      const rawRows = await parseFile(file);
      const rows = normalizeParsedRows(rawRows, meta);
      if (rows.length === 0) {
        setParseError("The file is empty. Please check and try again.");
        return;
      }
      const classified = classifyImportRows(rows, meta, existingRecords, lookups);
      setPreviewRows(classified);
      setStep("preview");
    } catch (err) {
      setParseError(err.message);
    }
  }

  async function ensureLocationInLookups(locationName) {
    const name = String(locationName || "").trim();
    if (!name) return;
    const list = lookups?.locations || [];
    const exists = list.some(
      (l) => String(l.location_name || "").trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) return;
    const { data, error } = await supabase
      .from("locations")
      .insert([{ location_name: name, location_type: "Site", is_active: true }])
      .select()
      .single();
    if (error) throw new Error(`Could not create Location "${name}": ${error.message}`);
    lookups.locations = [...list, data];
  }

  async function doImport() {
    setImporting(true);
    setImportProgress(0);

    const results = { imported: 0, updated: 0, skipped: 0, errors: [], details: [] };
    const table = meta.getTable();
    const total = previewRows.length;

    for (let i = 0; i < total; i++) {
      const item = previewRows[i];
      setImportProgress(Math.round(((i + 1) / total) * 100));

      if (item.errors.length > 0) {
        results.skipped++;
        results.details.push({ name: item.name, action: "Skipped", reason: item.errors.join("; ") });
        continue;
      }

      try {
        let payload;
        if (isAssets) {
          // Auto-create Location from template so Asset Name + Location can be rewritten on re-upload
          if (item.row?.location) {
            await ensureLocationInLookups(item.row.location);
          }
          const built = buildAssetRowPayload(item.row, lookups);
          if (built.errors.length) throw new Error(built.errors.join("; "));
          payload = built.payload;
          if (!payload.asset_code) {
            payload.asset_code = await generateAssetCode(payload.category_id);
          }
        } else {
          payload = buildRowPayload(item.row);
        }

        if (item.result === "new") {
          const { error } = await supabase.from(table).insert([payload]);
          if (error) throw error;
          results.imported++;
          results.details.push({ name: item.name || payload.asset_code, action: "Imported" });
        } else if (item.result === "duplicate" && importOption !== "insert") {
          const updatePayload = isAssets
            ? { ...payload, updated_at: new Date().toISOString() }
            : payload;
          const { error } = await supabase
            .from(table)
            .update(updatePayload)
            .eq(meta.idField || "id", item.existing.id);
          if (error) throw error;
          results.updated++;
          results.details.push({ name: item.name, action: "Updated" });
        } else {
          results.skipped++;
          results.details.push({
            name: item.name,
            action: "Skipped",
            reason: "Already exists (Insert only mode)",
          });
        }
      } catch (err) {
        results.errors.push(`${item.name}: ${err.message}`);
        results.details.push({ name: item.name, action: "Error", reason: err.message });
      }
    }

    setImportResult(results);
    setImporting(false);
  }

  function handleClose() {
    if (importResult && onImportComplete) {
      onImportComplete(importResult);
    }
    if (onClose) onClose();
  }

  if (importResult) {
    return <ImportSummary result={importResult} onClose={handleClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4 bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Import {meta.fileName}</h2>
              <p className="text-[11px] text-slate-400">
                {step === "select"
                  ? "Choose an Excel file to import"
                  : `${previewRows.length} records found`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {step === "select" && (
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-slate-700">Click to select an Excel file</p>
              <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls formats</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mt-4">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">New</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{statNew}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Duplicate</span>
                  </div>
                  <p className="text-xl font-bold text-amber-700 mt-1">{statDuplicate}</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">Invalid</span>
                  </div>
                  <p className="text-xl font-bold text-red-700 mt-1">{statInvalid}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <span className="text-xs font-semibold text-slate-600">Mode:</span>
                {[
                  { value: "insert", label: "Insert New Only" },
                  { value: "update", label: "Update Existing" },
                  { value: "upsert", label: "Insert + Update" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setImportOption(opt.value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      importOption === opt.value
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {isAssets && (
                <p className="text-[11px] text-slate-400">
                  Leave Asset Code blank to auto-generate. Category / Sub Category / Location /
                  Department / Vendor must match existing master names exactly. Sub Category is
                  optional and must belong to the given Category.
                </p>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500">
                        #
                      </th>
                      {meta.columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500 whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2 text-xs text-slate-400">{item.rowNum}</td>
                        {meta.columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-2 text-xs text-slate-700 max-w-[160px] truncate"
                          >
                            {String(item.row[col.key] || "").trim() || "-"}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {item.errors.length > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600"
                              title={item.errors.join("; ")}
                            >
                              <X className="h-3 w-3" />
                              Invalid
                            </span>
                          ) : item.result === "duplicate" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              {importOption !== "insert" ? "Update" : "Skip"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {step === "preview" && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="h-4 w-4" />
              {fileName}
            </div>
            <div className="flex items-center gap-2">
              {importing && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importing... {importProgress}%
                </div>
              )}
              <Button variant="outline" size="sm" onClick={onClose} disabled={importing}>
                Cancel
              </Button>
              <Button size="sm" onClick={doImport} disabled={importing || previewRows.length === 0}>
                {importing ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-4 w-4" />
                )}
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExcelImport;
