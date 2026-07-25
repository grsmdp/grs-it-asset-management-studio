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
  Wifi,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardStats,
  getRecentAssets,
  getRecentMovements,
  getAssets,
  getDepartments,
} from "../services/assetService";
import { getTicketStats } from "../services/helpdeskService";

const STATUS_COLORS = {
  Active: { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  "Under Repair": { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  Spare: { bar: "bg-violet-500", text: "text-violet-600", bg: "bg-violet-50" },
  Scrapped: { bar: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50" },
};

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
        color: "bg-emerald-500",
        textColor: "text-emerald-600",
      },
      {
        label: "Under Repair",
        count: stats.repairAssets,
        color: "bg-amber-500",
        textColor: "text-amber-600",
      },
      {
        label: "Spare",
        count: stats.spareAssets,
        color: "bg-violet-500",
        textColor: "text-violet-600",
      },
      {
        label: "Scrapped",
        count: stats.scrappedAssets,
        color: "bg-slate-400",
        textColor: "text-slate-500",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      label: "Add Asset",
      icon: Plus,
      page: "addAsset",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      label: "Transfer",
      icon: ArrowLeftRight,
      page: "movement",
      color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
    },
    {
      label: "Repair",
      icon: Wrench,
      page: "maintenance",
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    },
    {
      label: "Reports",
      icon: BarChart3,
      page: "reports",
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
  ];

  const statCards = [
    {
      label: "Total Assets",
      value: stats?.totalAssets ?? "--",
      icon: Monitor,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Assets",
      value: stats?.activeAssets ?? "--",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Under Repair",
      value: stats?.repairAssets ?? "--",
      icon: Wrench,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Spare Assets",
      value: stats?.spareAssets ?? "--",
      icon: FolderOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Scrapped",
      value: stats?.scrappedAssets ?? "--",
      icon: Trash2,
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
    {
      label: "Warranty Expiring",
      value: stats?.warrantyExpiring ?? "--",
      icon: ShieldAlert,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const statusColorMap = {
    Active: "bg-emerald-100 text-emerald-700",
    "Under Repair": "bg-amber-100 text-amber-700",
    Spare: "bg-violet-100 text-violet-700",
    Scrapped: "bg-slate-100 text-slate-600",
  };

  const ticketPriorityColor = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-sky-100 text-sky-700",
  };

  const healthItems = [
    {
      label: "Supabase",
      ok: stats !== null,
      detail: stats !== null ? "Connected" : "Unreachable",
    },
    {
      label: "Asset Data",
      ok: allAssets.length > 0,
      detail: allAssets.length > 0 ? `${allAssets.length} records` : "No data",
    },
    {
      label: "Ticket System",
      ok: ticketStats !== null,
      detail: ticketStats !== null ? `${ticketStats.totalCount || 0} tickets` : "Unavailable",
    },
    {
      label: "Service Worker",
      ok: "serviceWorker" in navigator,
      detail: "serviceWorker" in navigator ? "Supported" : "Not supported",
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-amber-600 hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, IT Administrator
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>{dateStr}</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Overview of your IT asset inventory
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => setCurrentPage(action.page)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${action.color}`}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </button>
            );
          })}
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {card.label}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Asset Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assetStatusData.length > 0 ? (
              <div className="space-y-4">
                {assetStatusData.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                      <span className={item.textColor}>
                        {item.count}{" "}
                        <span className="text-slate-400">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${Math.max(item.pct, 1)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No asset data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-violet-500" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deptDistribution.length > 0 ? (
              <div className="space-y-4">
                {deptDistribution.map((dept) => {
                  const maxCount = deptDistribution[0]?.count || 1;
                  const pct = Math.round((dept.count / maxCount) * 100);
                  return (
                    <div key={dept.name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 truncate max-w-[60%]">
                          {dept.name}
                        </span>
                        <span className="text-slate-500">{dept.count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No department data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-cyan-500" />
                Recent Asset Movements
              </CardTitle>
              <button
                onClick={() => setCurrentPage("movement")}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50">
                      <ArrowRightLeft className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {m.asset?.asset_name || m.asset?.asset_code || "Asset moved"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {m.from_location?.location_name || "?"} →{" "}
                        {m.to_location?.location_name || "?"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(m.movement_date || m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No recent movements
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Headset className="h-4 w-4 text-orange-500" />
                Helpdesk Summary
              </CardTitle>
              <button
                onClick={() => setCurrentPage("helpdesk")}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Open Helpdesk
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {ticketStats ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Open",
                    value: ticketStats.openCount,
                    color: "bg-blue-50 text-blue-700",
                  },
                  {
                    label: "Assigned",
                    value: ticketStats.assignedCount,
                    color: "bg-violet-50 text-violet-700",
                  },
                  {
                    label: "In Progress",
                    value: ticketStats.inProgressCount,
                    color: "bg-amber-50 text-amber-700",
                  },
                  {
                    label: "Completed Today",
                    value: ticketStats.completedToday,
                    color: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    label: "Critical",
                    value: ticketStats.criticalCount,
                    color: "bg-red-50 text-red-700",
                  },
                  {
                    label: "Closed (Month)",
                    value: ticketStats.closedThisMonth,
                    color: "bg-slate-100 text-slate-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 ${item.color}`}
                  >
                    <p className="text-2xl font-bold">{item.value ?? 0}</p>
                    <p className="text-xs font-medium opacity-80">{item.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                Ticket data unavailable
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Maintenance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Wrench className="h-4 w-4" />
                  Total Records
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {stats?.maintenanceCount ?? "--"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ArrowRightLeft className="h-4 w-4" />
                  Total Movements
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {stats?.movementCount ?? "--"}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-medium text-slate-700">Warranty Alerts</p>
              <p className="mt-1 text-sm text-slate-500">
                {stats?.warrantyExpiring ?? 0} asset
                {(stats?.warrantyExpiring ?? 0) !== 1 ? "s" : ""} with warranty
                expiring within the next 30 days.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    {item.ok ? (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-400" />
                    )}
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${item.ok ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
            {loadTimestamp && (
              <p className="mt-4 text-center text-xs text-slate-400">
                Last refreshed:{" "}
                {loadTimestamp.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Recently Added Assets
            </CardTitle>
            <button
              onClick={() => setCurrentPage("assets")}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {recentAssets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-medium text-slate-500">
                      Asset Code
                    </th>
                    <th className="pb-2 text-left font-medium text-slate-500">
                      Name
                    </th>
                    <th className="hidden pb-2 text-left font-medium text-slate-500 sm:table-cell">
                      Category
                    </th>
                    <th className="hidden pb-2 text-left font-medium text-slate-500 md:table-cell">
                      Location
                    </th>
                    <th className="hidden pb-2 text-left font-medium text-slate-500 lg:table-cell">
                      Department
                    </th>
                    <th className="pb-2 text-left font-medium text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2.5 font-semibold text-slate-700">
                        {asset.asset_code}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {asset.asset_name}
                      </td>
                      <td className="hidden py-2.5 text-slate-500 sm:table-cell">
                        {asset.asset_categories?.category_name || "-"}
                      </td>
                      <td className="hidden py-2.5 text-slate-500 md:table-cell">
                        {asset.current_location?.location_name || "-"}
                      </td>
                      <td className="hidden py-2.5 text-slate-500 lg:table-cell">
                        {asset.departments?.department_name || "-"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColorMap[asset.status] || "bg-slate-100 text-slate-600"}`}
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
            <p className="py-8 text-center text-sm text-slate-400">
              No assets found. Add your first asset to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
