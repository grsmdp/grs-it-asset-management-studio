import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Activity,
  Clock,
  ArrowRightLeft,
  Headset,
  ChevronRight,
  Package,
  Users,
  Search,
} from "lucide-react";
import {
  getDashboardStats,
  getRecentAssets,
  getRecentMovements,
  getAssets,
  getDepartments,
  getCategories,
} from "../services/assetService";
import { getTicketStats } from "../services/helpdeskService";

function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadTimestamp, setLoadTimestamp] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [statsR, assetsR, movementsR, ticketR, allAssetsR, deptsR, catsR] =
        await Promise.allSettled([
          getDashboardStats(),
          getRecentAssets(5),
          getRecentMovements(5),
          getTicketStats(),
          getAssets(),
          getDepartments(),
          getCategories(),
        ]);

      if (statsR.status === "fulfilled") setStats(statsR.value);
      if (assetsR.status === "fulfilled") setRecentAssets(assetsR.value);
      if (movementsR.status === "fulfilled") setRecentMovements(movementsR.value);
      if (ticketR.status === "fulfilled") setTicketStats(ticketR.value);
      if (allAssetsR.status === "fulfilled") setAllAssets(allAssetsR.value);
      if (deptsR.status === "fulfilled") setDepartments(deptsR.value);
      if (catsR.status === "fulfilled") setCategories(catsR.value);

      const failed = [];
      if (statsR.status === "rejected")
        failed.push("Dashboard statistics could not be loaded.");
      if (assetsR.status === "rejected")
        failed.push("Recent assets could not be loaded.");
      if (movementsR.status === "rejected")
        failed.push("Recent movements could not be loaded.");
      if (ticketR.status === "rejected")
        failed.push("Ticket stats could not be loaded.");
      if (failed.length) setError(failed.join(" "));

      setLoadTimestamp(new Date());
    } catch {
      setError("An unexpected error occurred while loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const categoryNameById = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.category_name;
    });
    return map;
  }, [categories]);

  const categoryTotals = useMemo(() => {
    const counts = {};
    allAssets.forEach((a) => {
      const name = categoryNameById[a.category_id] || "Unassigned";
      counts[name] = (counts[name] || 0) + 1;
    });

    const palette = [
      { hex: "#0f6b6d", light: "#d8f0f0" },
      { hex: "#2563eb", light: "#dbe7fe" },
      { hex: "#7c3aed", light: "#ebe4ff" },
      { hex: "#ea580c", light: "#ffe8d6" },
      { hex: "#059669", light: "#d1fae5" },
      { hex: "#db2777", light: "#fce7f3" },
      { hex: "#ca8a04", light: "#fef3c7" },
      { hex: "#0891b2", light: "#cffafe" },
      { hex: "#4f46e5", light: "#e0e7ff" },
      { hex: "#dc2626", light: "#fee2e2" },
      { hex: "#65a30d", light: "#ecfccb" },
      { hex: "#9333ea", light: "#f3e8ff" },
    ];

    // Show every category from masters (plus Unassigned if any), sorted by count
    const fromMaster = (categories || []).map((c) => ({
      name: c.category_name,
      count: counts[c.category_name] || 0,
    }));
    const masterNames = new Set(fromMaster.map((c) => c.name.toLowerCase()));
    if (counts.Unassigned && !masterNames.has("unassigned")) {
      fromMaster.push({ name: "Unassigned", count: counts.Unassigned });
    }

    return fromMaster
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map((item, i) => ({
        ...item,
        ...palette[i % palette.length],
      }));
  }, [allAssets, categoryNameById, categories]);

  const deptDistribution = useMemo(() => {
    if (!allAssets.length || !departments.length) return [];
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.id] = d.department_name;
    });
    const counts = {};
    allAssets.forEach((a) => {
      const name = deptMap[a.department_id] || "Unassigned";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allAssets, departments]);

  const assetStatusData = useMemo(() => {
    if (!stats) return [];
    const total = stats.totalAssets || 1;
    return [
      {
        label: "Active",
        count: stats.activeAssets,
        hex: "#20c997",
        light: "#ecfdf5",
      },
      {
        label: "Under Repair",
        count: stats.repairAssets,
        hex: "#f59f00",
        light: "#fffbeb",
      },
      {
        label: "Spare",
        count: stats.spareAssets,
        hex: "#6f42c1",
        light: "#f3f0ff",
      },
      {
        label: "Scrapped",
        count: stats.scrappedAssets,
        hex: "#94a3b8",
        light: "#f1f5f9",
      },
    ].map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }));
  }, [stats]);

  const KPI_BASE = [
    {
      label: "Total Assets",
      caption: "All registered inventory",
      value: stats?.totalAssets,
      icon: Monitor,
      hex: "#0f6b6d",
      light: "#d8f0f0",
    },
    {
      label: "Active",
      caption: "Currently in service",
      value: stats?.activeAssets,
      icon: CheckCircle2,
      hex: "#d97757",
      light: "#ffe8dc",
    },
    {
      label: "Under Repair",
      caption: "Needs attention soon",
      value: stats?.repairAssets,
      icon: Wrench,
      hex: "#e05a5a",
      light: "#fde2e2",
    },
    {
      label: "Warranty Expiring",
      caption: "Within next 30 days",
      value: stats?.warrantyExpiring,
      icon: ShieldAlert,
      hex: "#4b5563",
      light: "#e5e9ef",
    },
  ];

  const statusColorMap = {
    Active: "text-emerald-600",
    "Under Repair": "text-amber-600",
    Spare: "text-violet-600",
    Scrapped: "text-slate-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {error && (
        <div className="rounded-[24px] bg-white p-4 shadow-[0_4px_24px_rgba(15,40,60,0.06)] ring-1 ring-red-100">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Status totals — medium light cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {KPI_BASE.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl px-4 py-3.5 shadow-sm"
              style={{ backgroundColor: kpi.light }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70"
                >
                  <Icon className="h-4 w-4" style={{ color: kpi.hex }} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: kpi.hex }}>
                    {kpi.label}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{kpi.caption}</p>
                </div>
                <p
                  className="shrink-0 text-[26px] font-bold tracking-[-0.03em] leading-none tabular-nums"
                  style={{ color: kpi.hex }}
                >
                  {kpi.value ?? "--"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category totals — all categories */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {categoryTotals.map((cat) => (
          <div
            key={cat.name}
            className="rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: cat.light }}
              >
                <Package className="h-4 w-4" style={{ color: cat.hex }} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-800">
                  {cat.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">Category total</p>
              </div>
              <p
                className="shrink-0 text-[26px] font-bold tracking-[-0.03em] leading-none tabular-nums"
                style={{ color: cat.hex }}
              >
                {cat.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCurrentPage("addAsset")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Asset
        </button>
        <button
          onClick={() => setCurrentPage("movement")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 shadow-[0_2px_12px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.03] hover:bg-slate-50 transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Transfer
        </button>
        <button
          onClick={() => setCurrentPage("maintenance")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 shadow-[0_2px_12px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.03] hover:bg-slate-50 transition-colors"
        >
          <Wrench className="h-3.5 w-3.5" />
          Repair
        </button>
        <button
          onClick={() => setCurrentPage("reports")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 shadow-[0_2px_12px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.03] hover:bg-slate-50 transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Reports
        </button>
        <button
          onClick={loadDashboard}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-500 shadow-[0_2px_12px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.03] hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">Asset Health</h3>
              <p className="text-[12px] text-slate-400">Status breakdown</p>
            </div>
          </div>
          {assetStatusData.length > 0 ? (
            <div className="space-y-4">
              {assetStatusData.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="text-[13px] font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold text-slate-900">
                      {item.count}
                      <span className="ml-1 font-normal text-slate-400">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(item.pct, 2)}%`,
                        backgroundColor: item.hex,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Package className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs font-medium">No asset data available</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Department Overview
                </h3>
                <p className="text-[12px] text-slate-400">
                  Asset distribution across departments
                </p>
              </div>
            </div>
          </div>
          {deptDistribution.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {deptDistribution.map((dept, i) => {
                const maxCount = deptDistribution[0]?.count || 1;
                const pct = Math.round((dept.count / maxCount) * 100);
                const colors = [
                  { bar: "#0f6b6d", bg: "#e6f3f3" },
                  { bar: "#d97757", bg: "#fdeee8" },
                  { bar: "#6f42c1", bg: "#f3f0ff" },
                  { bar: "#f59f00", bg: "#fffbeb" },
                  { bar: "#e05a5a", bg: "#fceaea" },
                  { bar: "#15aabf", bg: "#ecfdf5" },
                ];
                const c = colors[i % colors.length];
                return (
                  <div
                    key={dept.name}
                    className="rounded-2xl p-3.5"
                    style={{ backgroundColor: c.bg }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="max-w-[70%] truncate text-[13px] font-semibold text-slate-800">
                        {dept.name}
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: c.bar }}>
                        {dept.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: c.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Users className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs font-medium">No department data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                Recent Asset Movements
              </h3>
              <p className="text-[12px] text-slate-400">Latest location changes</p>
            </div>
            <button
              onClick={() => setCurrentPage("movement")}
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:opacity-80 transition-opacity"
            >
              View All
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentMovements.length > 0 ? (
            <div className="space-y-1">
              {recentMovements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-700">
                      {m.asset?.asset_name || m.asset?.asset_code || "Asset moved"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                      <span>{m.from_location?.location_name || "?"}</span>
                      <ArrowRightLeft className="h-2.5 w-2.5" />
                      <span>{m.to_location?.location_name || "?"}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">
                    {new Date(m.movement_date || m.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <ArrowRightLeft className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs font-medium">No recent movements</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">Warranty Expiry</h3>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] font-bold tracking-[-0.04em] text-slate-900">
                {stats?.warrantyExpiring ?? 0}
              </span>
              <span className="text-[12px] text-slate-400">assets</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              Assets with warranty expiring within the next 30 days.
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <Wrench className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">Repair Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#e9eef2]/70 p-3.5">
                <p className="text-[12px] text-slate-400">Maintenance</p>
                <p className="mt-1 text-[22px] font-bold text-slate-900">
                  {stats?.maintenanceCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-[#e9eef2]/70 p-3.5">
                <p className="text-[12px] text-slate-400">Movements</p>
                <p className="mt-1 text-[22px] font-bold text-slate-900">
                  {stats?.movementCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helpdesk */}
      <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Helpdesk Overview</h3>
            <p className="text-[12px] text-slate-400">Ticket status breakdown</p>
          </div>
          <button
            onClick={() => setCurrentPage("helpdesk")}
            className="flex items-center gap-1 text-[13px] font-medium text-primary hover:opacity-80 transition-opacity"
          >
            Open Helpdesk
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {ticketStats ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Open", value: ticketStats.openCount, hex: "#0f6b6d", light: "#e6f3f3" },
              { label: "Assigned", value: ticketStats.assignedCount, hex: "#6f42c1", light: "#f3f0ff" },
              { label: "In Progress", value: ticketStats.inProgressCount, hex: "#f59f00", light: "#fffbeb" },
              { label: "Completed Today", value: ticketStats.completedToday, hex: "#20c997", light: "#ecfdf5" },
              { label: "Critical", value: ticketStats.criticalCount, hex: "#e05a5a", light: "#fceaea" },
              { label: "Closed (Month)", value: ticketStats.closedThisMonth, hex: "#64748b", light: "#f1f5f9" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: item.light }}
              >
                <p className="text-[22px] font-bold tracking-[-0.03em]" style={{ color: item.hex }}>
                  {item.value ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Headset className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-xs font-medium">Ticket data unavailable</p>
          </div>
        )}
      </div>

      {/* Asset Overview table — inspiration style */}
      <div className="rounded-[28px] bg-white p-6 shadow-[0_4px_24px_rgba(15,40,60,0.05)] ring-1 ring-black/[0.02]">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">
            Asset Overview
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets..."
                readOnly
                onFocus={() => setCurrentPage("assets")}
                className="h-10 w-44 rounded-full bg-[#e9eef2]/80 pl-9 pr-3 text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none sm:w-52"
              />
            </div>
            <button
              onClick={() => setCurrentPage("assets")}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#e9eef2]/80 px-4 text-[12px] font-medium text-slate-600 hover:bg-[#e0e6eb] transition-colors"
            >
              Filter
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
            <button
              onClick={() => setCurrentPage("addAsset")}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[12px] font-semibold text-white shadow-md shadow-primary/20 hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Asset
            </button>
          </div>
        </div>

        {recentAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 pr-4 text-left text-[12px] font-medium text-slate-400">
                    Asset Code
                  </th>
                  <th className="pb-3 pr-4 text-left text-[12px] font-medium text-slate-400">
                    Name
                  </th>
                  <th className="hidden pb-3 pr-4 text-left text-[12px] font-medium text-slate-400 sm:table-cell">
                    Category
                  </th>
                  <th className="hidden pb-3 pr-4 text-left text-[12px] font-medium text-slate-400 md:table-cell">
                    Location
                  </th>
                  <th className="pb-3 text-left text-[12px] font-medium text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 pr-4 font-semibold text-slate-800">
                      {asset.asset_code}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{asset.asset_name}</td>
                    <td className="hidden py-4 pr-4 text-slate-500 sm:table-cell">
                      {asset.asset_categories?.category_name || "-"}
                    </td>
                    <td className="hidden py-4 pr-4 text-slate-500 md:table-cell">
                      {asset.current_location?.location_name || "-"}
                    </td>
                    <td className="py-4">
                      <span
                        className={`text-[13px] font-semibold ${
                          statusColorMap[asset.status] || "text-slate-500"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Monitor className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-xs font-medium">
              No assets found. Add your first asset to get started.
            </p>
            <button
              onClick={() => setCurrentPage("addAsset")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Asset
            </button>
          </div>
        )}
      </div>

      {loadTimestamp && (
        <div className="flex items-center justify-center gap-1.5 pb-2 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          Last refreshed: {loadTimestamp.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
