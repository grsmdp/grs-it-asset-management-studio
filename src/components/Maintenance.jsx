import { useEffect, useMemo, useState } from "react";
import {
  createMaintenance,
  getAssets,
  getMaintenanceRecords,
  updateAsset,
  updateMaintenance,
} from "../services/assetService";
import { RefreshCw, Pencil, Wrench, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import FormCard from "@/components/layout/FormCard";
import TableCard from "@/components/layout/TableCard";
import StatCard from "@/components/layout/StatCard";

const statusStyles = {
  Scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-600 border border-slate-200",
};

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(true);
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
    setFormOpen(true);
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

  const statusCounts = useMemo(() => {
    const counts = { Scheduled: 0, "In Progress": 0, Completed: 0, Cancelled: 0 };
    records.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [records]);

  const columns = [
    { label: "Asset" },
    { label: "Type" },
    { label: "Status" },
    { label: "Cost" },
    { label: "Remarks" },
    { label: "Actions", className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="OPERATIONS"
        title="Maintenance"
        subtitle="Track repairs and service requests"
        accent="#f59f00"
      />

      <FilterCard>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input
          type="text"
          placeholder="Search maintenance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
        />
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </FilterCard>

      <FormCard
        title={editingId ? "Edit Maintenance Record" : "New Maintenance Record"}
        subtitle={editingId ? "Update the selected maintenance entry" : "Create a new repair or service entry"}
        open={formOpen}
        onToggle={() => setFormOpen(!formOpen)}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Asset *</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Maintenance Type</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Cost</label>
            <input
              type="number"
              value={form.cost}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cost: e.target.value }))
              }
              placeholder="0.00"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, remarks: e.target.value }))
              }
              placeholder="Additional notes"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create Record"}
            </button>
          </div>
        </form>
      </FormCard>

      <TableCard
        title="Maintenance History"
        count={filtered.length}
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No maintenance records found"
        emptyIcon={Wrench}
        renderRow={(record) => (
          <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm">
            <td className="px-5 py-3 text-slate-700 font-medium">
              {assetMap[record.asset_id] || record.asset_id}
            </td>
            <td className="px-5 py-3 text-slate-600">{record.maintenance_type}</td>
            <td className="px-5 py-3">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyles[record.status] || statusStyles.Scheduled}`}>
                {record.status}
              </span>
            </td>
            <td className="px-5 py-3 text-slate-600">
              {record.cost != null
                ? `\u20B9${Number(record.cost).toLocaleString()}`
                : "-"}
            </td>
            <td className="px-5 py-3 text-slate-500">{record.remarks || "-"}</td>
            <td className="px-5 py-3">
              <div className="flex items-center justify-end gap-1">
                {record.status !== "Completed" &&
                  record.status !== "Cancelled" && (
                    <select
                      className="h-7 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                      value={record.status}
                      onChange={(e) =>
                        handleStatusChange(record, e.target.value)
                      }
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                <button
                  onClick={() => handleEdit(record)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Scheduled"
          value={statusCounts.Scheduled}
          color="#3b82f6"
        />
        <StatCard
          icon={AlertTriangle}
          label="In Progress"
          value={statusCounts["In Progress"]}
          color="#f59e0b"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={statusCounts.Completed}
          color="#10b981"
        />
        <StatCard
          icon={XCircle}
          label="Cancelled"
          value={statusCounts.Cancelled}
          color="#6b7280"
        />
      </div>
    </div>
  );
}

export default Maintenance;
