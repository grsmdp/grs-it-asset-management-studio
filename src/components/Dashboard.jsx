import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Calendar,
  Activity,
  Server,
  Clock,
  ArrowRightLeft,
  Headset,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  Package,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import {
  getDashboardStats,
  getRecentAssets,
  getRecentMovements,
  getAssets,
  getDepartments,
} from "../services/assetService";
import { getTicketStats } from "../services/helpdeskService";

function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
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

      const [statsR, assetsR, movementsR, ticketR, allAssetsR, deptsR] =
        await Promise.allSettled([
          getDashboardStats(),
          getRecentAssets(5),
          getRecentMovements(5),
          getTicketStats(),
          getAssets(),
          getDepartments(),
        ]);

      if (statsR.status === "fulfilled") setStats(statsR.value);
      if (assetsR.status === "fulfilled") setRecentAssets(assetsR.value);
      if (movementsR.status === "fulfilled") setRecentMovements(movementsR.value);
      if (ticketR.status === "fulfilled") setTicketStats(ticketR.value);
      if (allAssetsR.status === "fulfilled") setAllAssets(allAssetsR.value);
      if (deptsR.status === "fulfilled") setDepartments(deptsR.value);

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

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const KPI_BASE = [
    {
      label: "Total Assets",
      value: stats?.totalAssets,
      icon: Monitor,
      hex: "#066fd1",
      light: "#eef4ff",
      change: null,
    },
    {
      label: "Active",
      value: stats?.activeAssets,
      icon: CheckCircle2,
      hex: "#20c997",
      light: "#ecfdf5",
      change: stats ? Math.round((stats.activeAssets / stats.totalAssets) * 100) + "%" : null,
    },
    {
      label: "Under Repair",
      value: stats?.repairAssets,
      icon: Wrench,
      hex: "#f59f00",
      light: "#fffbeb",
      change: null,
    },
    {
      label: "Spare",
      value: stats?.spareAssets,
      icon: FolderOpen,
      hex: "#6f42c1",
      light: "#f3f0ff",
      change: null,
    },
    {
      label: "Scrapped",
      value: stats?.scrappedAssets,
      icon: Trash2,
      hex: "#94a3b8",
      light: "#f1f5f9",
      change: null,
    },
    {
      label: "Warranty Expiring",
      value: stats?.warrantyExpiring,
      icon: ShieldAlert,
      hex: "#dc3545",
      light: "#fef2f2",
      change: null,
    },
  ];

  const statusColorMap = {
    Active: "bg-emerald-100 text-emerald-700",
    "Under Repair": "bg-amber-100 text-amber-700",
    Spare: "bg-violet-100 text-violet-700",
    Scrapped: "bg-slate-100 text-slate-600",
  };

  const healthItems = [
    {
      label: "Supabase Connection",
      ok: stats !== null,
      detail: stats !== null ? "Connected" : "Unreachable",
    },
    {
      label: "Asset Records",
      ok: allAssets.length > 0,
      detail: allAssets.length > 0 ? `${allAssets.length} records` : "No data",
      count: allAssets.length,
    },
    {
      label: "Ticket System",
      ok: ticketStats !== null,
      detail: ticketStats !== null ? `${ticketStats.totalCount || 0} tickets` : "Unavailable",
      count: ticketStats?.totalCount || 0,
    },
    {
      label: "Maintenance Log",
      ok: (stats?.maintenanceCount ?? 0) > 0,
      detail: stats?.maintenanceCount ? `${stats.maintenanceCount} records` : "No records",
      count: stats?.maintenanceCount || 0,
    },
  ];

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
    <div className="space-y-6 animate-fade-in">
      {/* Error banner */}
      {error && (
        <div className="group relative overflow-hidden rounded-2xl border border-red-200/60 bg-white p-4 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Greeting + Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-transparent" />
        <div className="relative px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600 mb-1">
                {dateStr}
              </p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {greeting}, IT Administrator
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Here's what's happening with your assets today.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage("addAsset")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-600 hover:to-blue-800 active:scale-[0.97] transition-all duration-150"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Asset
              </button>
              <button
                onClick={() => setCurrentPage("movement")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow active:scale-[0.97] transition-all duration-150"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transfer
              </button>
              <button
                onClick={() => setCurrentPage("maintenance")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow active:scale-[0.97] transition-all duration-150"
              >
                <Wrench className="h-3.5 w-3.5" />
                Repair
              </button>
              <button
                onClick={() => setCurrentPage("reports")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow active:scale-[0.97] transition-all duration-150"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Reports
              </button>
              <div className="h-6 w-px bg-slate-200 mx-0.5" />
              <button
                onClick={loadDashboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 active:scale-[0.97] transition-all duration-150"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_BASE.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                style={{ backgroundColor: kpi.hex }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: kpi.light }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: kpi.hex }}
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: kpi.hex }}
                  >
                    {kpi.value ?? "--"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {kpi.label}
                  </p>
                </div>
              </div>
              {kpi.change && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  {kpi.change} of total
                </div>
              )}
              <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 opacity-[0.03]">
                <Icon className="h-full w-full" style={{ color: kpi.hex }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Asset Health Bar Chart */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Asset Health</h3>
              <p className="text-[11px] text-slate-400">Status breakdown</p>
            </div>
          </div>
          {assetStatusData.length > 0 ? (
            <div className="space-y-4">
              {assetStatusData.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      {item.count}
                      <span className="text-slate-400 font-normal ml-1">
                        ({item.pct}%)
                      </span>
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
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total assets</span>
                  <span className="font-semibold text-slate-900">
                    {stats?.totalAssets ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Package className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No asset data available</p>
            </div>
          )}
        </div>

        {/* Department Overview */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Department Overview
                </h3>
                <p className="text-[11px] text-slate-400">
                  Asset distribution across departments
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {deptDistribution.reduce((s, d) => s + d.count, 0)} assets
            </span>
          </div>
          {deptDistribution.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deptDistribution.map((dept, i) => {
                const maxCount = deptDistribution[0]?.count || 1;
                const pct = Math.round((dept.count / maxCount) * 100);
                const colors = [
                  { bar: "#066fd1", bg: "#eef4ff" },
                  { bar: "#20c997", bg: "#ecfdf5" },
                  { bar: "#6f42c1", bg: "#f3f0ff" },
                  { bar: "#f59f00", bg: "#fffbeb" },
                  { bar: "#dc3545", bg: "#fef2f2" },
                  { bar: "#15aabf", bg: "#ecfdf5" },
                ];
                const c = colors[i % colors.length];
                return (
                  <div
                    key={dept.name}
                    className="rounded-xl p-3.5 transition-all duration-150 hover:shadow-sm"
                    style={{ backgroundColor: c.bg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[70%]">
                        {dept.name}
                      </span>
                      <span className="text-xs font-bold" style={{ color: c.bar }}>
                        {dept.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: c.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No department data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent Asset Movements
                </h3>
                <p className="text-[11px] text-slate-400">Latest location changes</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage("movement")}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {recentMovements.length > 0 ? (
            <div className="space-y-2">
              {recentMovements.map((m, i) => (
                <div
                  key={m.id}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-150 hover:bg-slate-50"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {m.asset?.asset_name || m.asset?.asset_code || "Asset moved"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
              <ArrowRightLeft className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No recent movements</p>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions + Health */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                <Package className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentPage("addAsset")}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm active:scale-[0.97] transition-all duration-150"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Add Asset</span>
              </button>
              <button
                onClick={() => setCurrentPage("movement")}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:bg-amber-50 hover:border-amber-200 hover:shadow-sm active:scale-[0.97] transition-all duration-150"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <ArrowLeftRight className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Transfer</span>
              </button>
              <button
                onClick={() => setCurrentPage("maintenance")}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm active:scale-[0.97] transition-all duration-150"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Repair</span>
              </button>
              <button
                onClick={() => setCurrentPage("reports")}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:bg-purple-50 hover:border-purple-200 hover:shadow-sm active:scale-[0.97] transition-all duration-150"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Reports</span>
              </button>
            </div>
          </div>

          {/* Warranty + Repair Summary */}
          <div className="grid grid-cols-1 gap-4">
            {/* Warranty Expiry */}
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Warranty Expiry
                  </h3>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-red-600">
                  {stats?.warrantyExpiring ?? 0}
                </span>
                <span className="text-xs text-slate-400">assets</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                Assets with warranty expiring within the next 30 days.
              </p>
              {(stats?.warrantyExpiring ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[11px] font-medium text-red-700">
                    Review required soon
                  </span>
                </div>
              )}
            </div>

            {/* Repair Summary */}
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                  <Wrench className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Repair Summary
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Maintenance</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {stats?.maintenanceCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Movements</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {stats?.movementCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helpdesk Summary Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/5 to-violet-500/10 shadow-sm border border-violet-200/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
              <Headset className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Helpdesk Overview</h3>
              <p className="text-[11px] text-violet-500/70">
                Ticket status breakdown
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage("helpdesk")}
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 transition-colors"
          >
            Open Helpdesk
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {ticketStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Open",
                value: ticketStats.openCount,
                hex: "#066fd1",
                light: "#eef4ff",
              },
              {
                label: "Assigned",
                value: ticketStats.assignedCount,
                hex: "#6f42c1",
                light: "#f3f0ff",
              },
              {
                label: "In Progress",
                value: ticketStats.inProgressCount,
                hex: "#f59f00",
                light: "#fffbeb",
              },
              {
                label: "Completed Today",
                value: ticketStats.completedToday,
                hex: "#20c997",
                light: "#ecfdf5",
              },
              {
                label: "Critical",
                value: ticketStats.criticalCount,
                hex: "#dc3545",
                light: "#fef2f2",
              },
              {
                label: "Closed (Month)",
                value: ticketStats.closedThisMonth,
                hex: "#64748b",
                light: "#f1f5f9",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3 transition-all duration-150 hover:shadow-sm"
                style={{ backgroundColor: item.light }}
              >
                <p className="text-xl font-bold" style={{ color: item.hex }}>
                  {item.value ?? 0}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Headset className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">Ticket data unavailable</p>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
            <Server className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">System Health</h3>
            <p className="text-[11px] text-slate-400">Service status overview</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {healthItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`relative flex h-2.5 w-2.5 ${item.ok ? "" : ""}`}
                >
                  <span
                    className={`absolute inset-0 rounded-full ${item.ok ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  {item.ok && (
                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-700">{item.label}</p>
                  {item.count !== undefined && (
                    <p className="text-[11px] font-bold text-slate-900">
                      {item.count}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`text-[11px] font-medium ${item.ok ? "text-emerald-600" : "text-red-600"}`}
              >
                {item.detail}
              </span>
            </div>
          ))}
        </div>
        {loadTimestamp && (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Last refreshed: {loadTimestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Recently Added Assets */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
              <Monitor className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recently Added Assets
              </h3>
              <p className="text-[11px] text-slate-400">
                Latest {recentAssets.length} assets
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage("assets")}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            View All
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {recentAssets.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Asset Code
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                    Category
                  </th>
                  <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                    Location
                  </th>
                  <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-50 transition-colors hover:bg-blue-50/30 last:border-0"
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {asset.asset_code}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{asset.asset_name}</td>
                    <td className="hidden px-4 py-3.5 text-slate-500 sm:table-cell">
                      {asset.asset_categories?.category_name || "-"}
                    </td>
                    <td className="hidden px-4 py-3.5 text-slate-500 md:table-cell">
                      {asset.current_location?.location_name || "-"}
                    </td>
                    <td className="hidden px-4 py-3.5 text-slate-500 lg:table-cell">
                      {asset.departments?.department_name || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColorMap[asset.status] || "bg-slate-100 text-slate-600"
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
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Monitor className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">
              No assets found. Add your first asset to get started.
            </p>
            <button
              onClick={() => setCurrentPage("addAsset")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
