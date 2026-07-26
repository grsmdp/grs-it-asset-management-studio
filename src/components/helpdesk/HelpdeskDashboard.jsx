import { useEffect, useState } from "react";
import { getTicketStats, getTicketChartData } from "../../services/helpdeskService";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  UserCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Archive,
  Plus,
  List,
  User,
  BarChart3,
  RefreshCw,
} from "lucide-react";

function HelpdeskDashboard({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsData, chartDataResult] = await Promise.all([
        getTicketStats(),
        getTicketChartData(),
      ]);
      setStats(statsData);
      setChartData(chartDataResult);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Open Tickets", value: stats.openCount, icon: FolderOpen, color: "#3b82f6", borderColor: "#3b82f6", page: "allTickets" },
    { label: "Assigned", value: stats.assignedCount, icon: UserCheck, color: "#06b6d4", borderColor: "#06b6d4", page: "allTickets" },
    { label: "In Progress", value: stats.inProgressCount, icon: Loader2, color: "#eab308", borderColor: "#eab308", page: "allTickets" },
    { label: "Completed Today", value: stats.completedToday, icon: CheckCircle, color: "#22c55e", borderColor: "#22c55e", page: "allTickets" },
    { label: "Critical", value: stats.criticalCount, icon: AlertTriangle, color: "#ef4444", borderColor: "#ef4444", page: "allTickets" },
    { label: "Closed (Month)", value: stats.closedThisMonth, icon: Archive, color: "#6b7280", borderColor: "#6b7280", page: "allTickets" },
  ];

  const quickActions = [
    { label: "New Ticket", icon: Plus, color: "#3b82f6", borderColor: "#3b82f6", page: "newTicket", desc: "Create a new helpdesk ticket" },
    { label: "All Tickets", icon: List, color: "#06b6d4", borderColor: "#06b6d4", page: "allTickets", desc: "View all helpdesk tickets" },
    { label: "My Tickets", icon: User, color: "#eab308", borderColor: "#eab308", page: "myTickets", desc: "Tickets assigned to me" },
    { label: "Reports", icon: BarChart3, color: "#22c55e", borderColor: "#22c55e", page: "helpdeskReports", desc: "Ticket analytics & reports" },
  ];

  const priorityColors = {
    Critical: "destructive",
    High: "default",
    Medium: "secondary",
    Low: "outline",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title="Helpdesk Dashboard"
        subtitle="IT support ticket overview"
        accent="#6f42c1"
      >
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            borderColor={card.borderColor}
            onClick={() => setCurrentPage(card.page)}
          />
        ))}
      </section>

      <section>
        <h6 className="text-sm font-semibold mb-3 text-slate-700">Quick Actions</h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <StatCard
              key={action.label}
              icon={action.icon}
              label={action.label}
              value={action.desc}
              color={action.color}
              borderColor={action.borderColor}
              onClick={() => setCurrentPage(action.page)}
            />
          ))}
        </div>
      </section>

      {chartData && (
        <section className="space-y-4">
          <h6 className="text-sm font-semibold text-slate-700">Charts</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-3">Tickets by Priority</h6>
              {Object.keys(chartData.byPriority).length === 0 ? (
                <p className="text-sm text-slate-500">No data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(chartData.byPriority).map(([pri, count]) => {
                    const total = Object.values(chartData.byPriority).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={pri} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant={priorityColors[pri] || "secondary"}>{pri}</Badge>
                          <span className="text-sm font-medium text-slate-600">{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              pri === "Critical" ? "bg-red-500" :
                              pri === "High" ? "bg-orange-500" :
                              pri === "Medium" ? "bg-blue-500" :
                              "bg-slate-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-3">Tickets by Engineer</h6>
              {Object.keys(chartData.byEngineer).length === 0 ? (
                <p className="text-sm text-slate-500">No data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(chartData.byEngineer)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([eng, count]) => (
                      <div key={eng} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{eng}</span>
                        <span className="text-sm font-medium text-slate-600">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HelpdeskDashboard;
