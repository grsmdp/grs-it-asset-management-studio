import { useEffect, useMemo, useState } from "react";
import { deleteAsset, getAssets, loadMasterData } from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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

const columns = [
  { label: "Asset Code" },
  { label: "Asset Name" },
  { label: "Category" },
  { label: "Location" },
  { label: "Department" },
  { label: "Status" },
  { label: "Actions", className: "text-right" },
];

function Assets({ setCurrentPage, onEditAsset }) {
  const [assets, setAssets] = useState([]);
  const [masters, setMasters] = useState({
    categories: [],
    locations: [],
    departments: [],
    vendors: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = `${asset.asset_code || ""} ${asset.asset_name || ""} ${asset.brand || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter ? asset.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

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
        <div className="flex-1 min-w-0 sm:max-w-xs">
          <Input
            placeholder="Search asset code, name, or brand"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={statusFilter || "__all__"}
            onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Spare">Spare</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Scrapped">Scrapped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={loadAssets}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
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
