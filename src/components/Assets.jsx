import { useEffect, useMemo, useState } from "react";
import { deleteAsset, getAssets, loadMasterData } from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import TableCard from "@/components/layout/TableCard";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Package,
  Download,
  Upload,
  FileSpreadsheet,
  X,
} from "lucide-react";
import {
  MASTER_META,
  generateTemplate,
  downloadWorkbook,
  exportToExcel,
  flattenAssetForExport,
  buildDateString,
} from "./common/ExcelUtils";
import ExcelImport from "./common/ExcelImport";

function statusBadgeVariant(status) {
  switch (status) {
    case "Active":
      return "default";
    case "Spare":
      return "secondary";
    case "Under Repair":
      return "outline";
    case "Scrapped":
      return "destructive";
    default:
      return "default";
  }
}

const EMPTY_FILTERS = {
  asset_code: "",
  asset_name: "",
  category_id: "",
  location_id: "",
  department_id: "",
  status: "",
};

function Assets({ setCurrentPage, onEditAsset }) {
  const [assets, setAssets] = useState([]);
  const [masters, setMasters] = useState({
    categories: [],
    subcategories: [],
    locations: [],
    departments: [],
    vendors: [],
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showImport, setShowImport] = useState(false);

  const meta = MASTER_META.assets;

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);

    try {
      const [assetData, masterData] = await Promise.all([
        getAssets(),
        loadMasterData(),
      ]);

      setAssets(assetData || []);
      setMasters(masterData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmDelete) return;

    try {
      await deleteAsset(id);
      alert("Asset deleted successfully.");
      loadAssets();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  function handleDownloadTemplate() {
    const wb = generateTemplate(meta);
    downloadWorkbook(wb, `${meta.fileName}_Template.xlsx`);
  }

  function handleExport() {
    const rows = filteredAssets.map((asset) => flattenAssetForExport(asset, masters));
    const wb = exportToExcel(rows, meta);
    downloadWorkbook(wb, `${meta.fileName}_${buildDateString()}.xlsx`);
  }

  function handleImportComplete() {
    setShowImport(false);
    loadAssets();
  }

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const lookupMaps = useMemo(
    () => ({
      categories: Object.fromEntries(
        masters.categories.map((item) => [item.id, item.category_name])
      ),
      locations: Object.fromEntries(
        masters.locations.map((item) => [item.id, item.location_name])
      ),
      departments: Object.fromEntries(
        masters.departments.map((item) => [item.id, item.department_name])
      ),
    }),
    [masters]
  );

  const categoryOptions = useMemo(
    () =>
      [...masters.categories]
        .sort((a, b) => a.category_name.localeCompare(b.category_name))
        .map((c) => ({ value: String(c.id), label: c.category_name })),
    [masters.categories]
  );

  const locationOptions = useMemo(
    () =>
      [...masters.locations]
        .sort((a, b) => a.location_name.localeCompare(b.location_name))
        .map((l) => ({ value: String(l.id), label: l.location_name })),
    [masters.locations]
  );

  const departmentOptions = useMemo(
    () =>
      [...masters.departments]
        .sort((a, b) => a.department_name.localeCompare(b.department_name))
        .map((d) => ({ value: String(d.id), label: d.department_name })),
    [masters.departments]
  );

  const filteredAssets = useMemo(() => {
    const codeQ = filters.asset_code.trim().toLowerCase();
    const nameQ = filters.asset_name.trim().toLowerCase();

    return assets.filter((asset) => {
      if (codeQ && !String(asset.asset_code || "").toLowerCase().includes(codeQ)) {
        return false;
      }
      if (nameQ && !String(asset.asset_name || "").toLowerCase().includes(nameQ)) {
        return false;
      }
      if (filters.category_id && String(asset.category_id) !== filters.category_id) {
        return false;
      }
      const locId = asset.current_location_id || asset.location_id;
      if (filters.location_id && String(locId || "") !== filters.location_id) {
        return false;
      }
      if (
        filters.department_id &&
        String(asset.department_id || "") !== filters.department_id
      ) {
        return false;
      }
      if (filters.status && asset.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [assets, filters]);

  const hasActiveFilters = Object.values(filters).some((v) => String(v).trim());

  const columns = useMemo(
    () => [
      {
        label: "Asset Code",
        filter: {
          type: "text",
          value: filters.asset_code,
          onChange: (v) => setFilter("asset_code", v),
          placeholder: "Filter code...",
        },
      },
      {
        label: "Asset Name",
        filter: {
          type: "text",
          value: filters.asset_name,
          onChange: (v) => setFilter("asset_name", v),
          placeholder: "Filter name...",
        },
      },
      {
        label: "Category",
        filter: {
          type: "select",
          value: filters.category_id,
          onChange: (v) => setFilter("category_id", v),
          placeholder: "All categories",
          options: categoryOptions,
        },
      },
      {
        label: "Location",
        filter: {
          type: "select",
          value: filters.location_id,
          onChange: (v) => setFilter("location_id", v),
          placeholder: "All locations",
          options: locationOptions,
        },
      },
      {
        label: "Department",
        filter: {
          type: "select",
          value: filters.department_id,
          onChange: (v) => setFilter("department_id", v),
          placeholder: "All departments",
          options: departmentOptions,
        },
      },
      {
        label: "Status",
        filter: {
          type: "select",
          value: filters.status,
          onChange: (v) => setFilter("status", v),
          placeholder: "All statuses",
          options: [
            { value: "Active", label: "Active" },
            { value: "Spare", label: "Spare" },
            { value: "Under Repair", label: "Under Repair" },
            { value: "Scrapped", label: "Scrapped" },
          ],
        },
      },
      { label: "Actions", className: "text-right" },
    ],
    [filters, categoryOptions, locationOptions, departmentOptions]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        pretitle="INVENTORY"
        title="IT Asset Register"
        subtitle={`Showing ${filteredAssets.length} of ${assets.length} assets`}
        accent="#20c997"
      >
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setCurrentPage("addAsset")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Asset
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Download Template</span>
          <span className="sm:hidden">Template</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
          <Upload className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Import Excel</span>
          <span className="sm:hidden">Import</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileSpreadsheet className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </PageHeader>

      <FilterCard>
        <Button variant="outline" size="sm" onClick={loadAssets}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-slate-500"
          >
            <X className="mr-1 h-4 w-4" />
            Clear column filters
          </Button>
        )}
        <p className="text-xs text-slate-400 sm:ml-auto">
          Use the filter boxes under each column header
        </p>
      </FilterCard>

      <TableCard
        title="Assets"
        count={filteredAssets.length}
        columns={columns}
        data={filteredAssets}
        loading={loading}
        emptyMessage="No assets found"
        emptyIcon={Package}
        renderRow={(asset) => (
          <TableRow key={asset.id} className="hover:bg-slate-50 transition-colors">
            <TableCell className="font-semibold">{asset.asset_code}</TableCell>
            <TableCell>{asset.asset_name}</TableCell>
            <TableCell>
              {lookupMaps.categories[asset.category_id] || "-"}
            </TableCell>
            <TableCell>
              {lookupMaps.locations[
                asset.current_location_id || asset.location_id
              ] || "-"}
            </TableCell>
            <TableCell>
              {lookupMaps.departments[asset.department_id] || "-"}
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(asset.status)}>
                {asset.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditAsset(asset.id)}
                  title="Edit"
                  className="h-8 w-8 text-slate-400 hover:text-amber-600"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(asset.id)}
                  title="Delete"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {showImport && (
        <ExcelImport
          masterType="assets"
          existingRecords={assets}
          lookups={masters}
          onImportComplete={handleImportComplete}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

export default Assets;
