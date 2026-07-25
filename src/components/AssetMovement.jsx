import { useEffect, useMemo, useState } from "react";
import {
  createMovement,
  getAssets,
  getMovements,
  loadMasterData,
  updateAsset,
} from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

function AssetMovement({ setCurrentPage }) {
  const [movements, setMovements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    asset_id: "",
    from_location_id: "",
    to_location_id: "",
    movement_date: new Date().toISOString().slice(0, 10),
    reason: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [movementData, assetData, masterData] = await Promise.all([
        getMovements(),
        getAssets(),
        loadMasterData(),
      ]);
      setMovements(movementData);
      setAssets(assetData);
      setLocations(masterData.locations);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const assetMap = useMemo(
    () =>
      Object.fromEntries(
        assets.map((a) => [a.id, `${a.asset_code} - ${a.asset_name}`])
      ),
    [assets]
  );

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l.location_name])),
    [locations]
  );

  function handleAssetChange(assetId) {
    const selected = assets.find((a) => String(a.id) === String(assetId));
    setForm((prev) => ({
      ...prev,
      asset_id: assetId,
      from_location_id: selected
        ? String(selected.current_location_id || selected.location_id || "")
        : "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.asset_id || !form.movement_date) {
      alert("Please select an asset and movement date.");
      return;
    }

    if (!form.to_location_id) {
      alert("Destination location is required.");
      return;
    }

    if (form.from_location_id && form.from_location_id === form.to_location_id) {
      alert("Destination must be different from the current location.");
      return;
    }

    try {
      setSaving(true);

      await createMovement({
        asset_id: Number(form.asset_id),
        from_location_id: form.from_location_id
          ? Number(form.from_location_id)
          : null,
        to_location_id: Number(form.to_location_id),
        movement_date: form.movement_date,
        reason: form.reason || null,
        remarks: form.remarks || null,
      });

      if (form.to_location_id) {
        await updateAsset(Number(form.asset_id), {
          current_location_id: Number(form.to_location_id),
        });
      }

      alert("Asset movement recorded successfully.");

      setForm({
        asset_id: "",
        from_location_id: "",
        to_location_id: "",
        movement_date: new Date().toISOString().slice(0, 10),
        reason: "",
        remarks: "",
      });

      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = movements.filter((m) => {
    if (search) {
      const term = search.toLowerCase();
      const assetLabel = assetMap[m.asset_id] || "";
      const fromLoc = locationMap[m.from_location_id] || "";
      const toLoc = locationMap[m.to_location_id] || "";
      const haystack = `${assetLabel} ${fromLoc} ${toLoc} ${m.reason || ""} ${m.remarks || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Asset Movement</h2>
          <p className="text-sm text-muted-foreground">
            Transfer assets between locations and track movement history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage("assets")}>
          View Assets
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-4">Record Movement</h6>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Asset</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.asset_id}
                    onChange={(e) => handleAssetChange(e.target.value)}
                  >
                    <option value="">Select Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_code} - {asset.asset_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">From Location</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.from_location_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        from_location_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Current / Unknown</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">To Location</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.to_location_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        to_location_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Destination</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Movement Date</Label>
                  <Input
                    type="date"
                    value={form.movement_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        movement_date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Reason</Label>
                  <Input
                    type="text"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Transfer reason"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Remarks</Label>
                  <Textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Record Movement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h6 className="text-sm font-semibold">
                  Movement History ({filtered.length})
                </h6>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-40"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={loadData}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Date</TableHead>
                      <TableHead className="text-sm">Asset</TableHead>
                      <TableHead className="text-sm">From</TableHead>
                      <TableHead className="text-sm">To</TableHead>
                      <TableHead className="text-sm">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                          No movement records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((movement) => (
                        <TableRow key={movement.id} className="text-sm">
                          <TableCell>{movement.movement_date || "-"}</TableCell>
                          <TableCell>
                            {assetMap[movement.asset_id] ||
                              movement.asset_id}
                          </TableCell>
                          <TableCell>
                            {locationMap[movement.from_location_id] || "-"}
                          </TableCell>
                          <TableCell>
                            {locationMap[movement.to_location_id] || "-"}
                          </TableCell>
                          <TableCell>
                            {movement.reason || movement.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AssetMovement;
