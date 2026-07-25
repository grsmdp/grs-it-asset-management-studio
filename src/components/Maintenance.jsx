import { useEffect, useMemo, useState } from "react";
import {
  createMaintenance,
  getAssets,
  getMaintenanceRecords,
  updateAsset,
  updateMaintenance,
} from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { RefreshCw, Pencil } from "lucide-react";

const statusVariantMap = {
  Scheduled: { variant: "default", className: "" },
  "In Progress": { variant: "outline", className: "border-amber-500 text-amber-700 bg-amber-50" },
  Completed: { variant: "default", className: "bg-emerald-600 text-white hover:bg-emerald-600/80" },
  Cancelled: { variant: "secondary", className: "" },
};

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    asset_id: "",
    maintenance_type: "Repair",
    status: "Scheduled",
    cost: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [maintenanceData, assetData] = await Promise.all([
        getMaintenanceRecords(),
        getAssets(),
      ]);
      setRecords(maintenanceData);
      setAssets(assetData);
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

  const emptyForm = {
    asset_id: "",
    maintenance_type: "Repair",
    status: "Scheduled",
    cost: "",
    remarks: "",
  };

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(record) {
    setEditingId(record.id);
    setForm({
      asset_id: record.asset_id ? String(record.asset_id) : "",
      maintenance_type: record.maintenance_type || "Repair",
      status: record.status || "Scheduled",
      cost: record.cost ?? "",
      remarks: record.remarks || "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.asset_id || !form.maintenance_type || !form.status) {
      alert("Please fill all required maintenance fields.");
      return;
    }

    const payload = {
      asset_id: Number(form.asset_id),
      maintenance_type: form.maintenance_type,
      status: form.status,
      cost: form.cost === "" ? null : Number(form.cost),
      remarks: form.remarks || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateMaintenance(editingId, payload);
        alert("Maintenance record updated.");
      } else {
        await createMaintenance(payload);
        alert("Maintenance record created.");
      }

      if (form.status === "In Progress" || form.status === "Scheduled") {
        await updateAsset(Number(form.asset_id), { status: "Under Repair" });
      }
      if (form.status === "Completed") {
        await updateAsset(Number(form.asset_id), { status: "Active" });
      }
      if (form.status === "Cancelled") {
        await updateAsset(Number(form.asset_id), { status: "Active" });
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record, newStatus) {
    try {
      await updateMaintenance(record.id, { status: newStatus });

      if (newStatus === "Completed") {
        await updateAsset(record.asset_id, { status: "Active" });
      } else if (newStatus === "In Progress") {
        await updateAsset(record.asset_id, { status: "Under Repair" });
      } else if (newStatus === "Cancelled") {
        await updateAsset(record.asset_id, { status: "Active" });
      }

      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const filtered = records.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const label = assetMap[r.asset_id] || "";
      const haystack = `${label} ${r.maintenance_type} ${r.remarks || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Maintenance</h2>
        <p className="text-sm text-muted-foreground">
          Track repairs, service requests, and maintenance status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-4">
                {editingId ? "Edit Maintenance Record" : "New Maintenance Record"}
              </h6>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Asset *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.asset_id}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, asset_id: e.target.value }))
                    }
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
                  <Label className="text-sm">Maintenance Type</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.maintenance_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maintenance_type: e.target.value,
                      }))
                    }
                  >
                    <option value="Repair">Repair</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Cost</Label>
                  <Input
                    type="number"
                    value={form.cost}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cost: e.target.value }))
                    }
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

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Create Record"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  )}
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
                  Maintenance History ({filtered.length})
                </h6>
                <div className="flex items-center gap-2">
                  <select
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-36"
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
                      <TableHead className="text-sm">Asset</TableHead>
                      <TableHead className="text-sm">Type</TableHead>
                      <TableHead className="text-sm">Status</TableHead>
                      <TableHead className="text-sm">Cost</TableHead>
                      <TableHead className="text-sm">Remarks</TableHead>
                      <TableHead className="text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                          No maintenance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((record) => {
                        const badgeInfo = statusVariantMap[record.status] || statusVariantMap.Scheduled;
                        return (
                          <TableRow key={record.id} className="text-sm">
                            <TableCell>
                              {assetMap[record.asset_id] || record.asset_id}
                            </TableCell>
                            <TableCell>{record.maintenance_type}</TableCell>
                            <TableCell>
                              <Badge variant={badgeInfo.variant} className={badgeInfo.className}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {record.cost != null
                                ? `₹${Number(record.cost).toLocaleString()}`
                                : "-"}
                            </TableCell>
                            <TableCell>{record.remarks || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {record.status !== "Completed" &&
                                  record.status !== "Cancelled" && (
                                    <select
                                      className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                                      value={record.status}
                                      onChange={(e) =>
                                        handleStatusChange(
                                          record,
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="Scheduled">
                                        Scheduled
                                      </option>
                                      <option value="In Progress">
                                        In Progress
                                      </option>
                                      <option value="Completed">
                                        Completed
                                      </option>
                                      <option value="Cancelled">
                                        Cancelled
                                      </option>
                                    </select>
                                  )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(record)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default Maintenance;
