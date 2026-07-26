import { useEffect, useMemo, useState } from "react";
import {
  createMovement,
  getAssets,
  getMovements,
  loadMasterData,
  updateAsset,
} from "../services/assetService";
import { RefreshCw, ArrowRightLeft, CalendarDays, TrendingUp, ArrowLeftRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import FormCard from "@/components/layout/FormCard";
import TableCard from "@/components/layout/TableCard";
import StatCard from "@/components/layout/StatCard";

function AssetMovement({ setCurrentPage }) {
  const [movements, setMovements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(true);
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

  const thisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return movements.filter((m) => m.movement_date && m.movement_date.startsWith(ym)).length;
  }, [movements]);

  const uniqueAssets = useMemo(
    () => new Set(movements.map((m) => m.asset_id)).size,
    [movements]
  );

  const columns = [
    { label: "Date" },
    { label: "Asset" },
    { label: "From" },
    { label: "To" },
    { label: "Reason" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="OPERATIONS"
        title="Asset Movement"
        subtitle="Transfer assets between locations"
        accent="#f76707"
      >
        <button
          onClick={() => setCurrentPage("assets")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          View Assets
        </button>
      </PageHeader>

      <FilterCard>
        <input
          type="text"
          placeholder="Search movements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
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
        title="Record Movement"
        subtitle="Log a new asset transfer"
        open={formOpen}
        onToggle={() => setFormOpen(!formOpen)}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Asset *</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">From Location</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">To Location *</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Movement Date *</label>
            <input
              type="date"
              value={form.movement_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  movement_date: e.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Reason</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Transfer reason"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, remarks: e.target.value }))
              }
              placeholder="Additional notes"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors resize-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Record Movement"}
            </button>
          </div>
        </form>
      </FormCard>

      <TableCard
        title="Movement History"
        count={filtered.length}
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No movement records found"
        emptyIcon={ArrowRightLeft}
        renderRow={(movement) => (
          <tr key={movement.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm">
            <td className="px-5 py-3 text-slate-600">{movement.movement_date || "-"}</td>
            <td className="px-5 py-3 text-slate-700 font-medium">
              {assetMap[movement.asset_id] || movement.asset_id}
            </td>
            <td className="px-5 py-3 text-slate-600">
              {locationMap[movement.from_location_id] || "-"}
            </td>
            <td className="px-5 py-3 text-slate-600">
              {locationMap[movement.to_location_id] || "-"}
            </td>
            <td className="px-5 py-3 text-slate-500">
              {movement.reason || movement.remarks || "-"}
            </td>
          </tr>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={ArrowRightLeft}
          label="Total Movements"
          value={movements.length}
          color="#3b82f6"
        />
        <StatCard
          icon={CalendarDays}
          label="This Month"
          value={thisMonth}
          color="#8b5cf6"
        />
        <StatCard
          icon={TrendingUp}
          label="Unique Assets Moved"
          value={uniqueAssets}
          color="#10b981"
        />
      </div>
    </div>
  );
}

export default AssetMovement;
