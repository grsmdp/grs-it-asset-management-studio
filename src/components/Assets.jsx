import { useEffect, useMemo, useState } from "react";
import { deleteAsset, getAssets, loadMasterData } from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, RefreshCw, Package } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IT Asset Register</h2>
          <p className="text-sm text-muted-foreground">
            Total Assets: <span className="font-semibold">{filteredAssets.length}</span>
          </p>
        </div>

        <Button size="sm" onClick={() => setCurrentPage("addAsset")}>
          <Plus className="mr-1 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search asset code, name, or brand"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
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

            <Button variant="outline" size="sm" onClick={loadAssets} className="md:w-auto w-full">
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Asset Code</TableHead>
              <TableHead>Asset Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" />
                    <p>No assets found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
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
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(asset.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Assets;
