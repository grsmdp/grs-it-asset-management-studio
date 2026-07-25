import { useEffect, useState } from "react";
import { getTicketStats, getTicketChartData } from "../../services/helpdeskService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
  Users,
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
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Open Tickets", value: stats.openCount, icon: FolderOpen, color: "text-blue-600", bg: "bg-blue-50", page: "allTickets" },
    { label: "Assigned", value: stats.assignedCount, icon: UserCheck, color: "text-cyan-600", bg: "bg-cyan-50", page: "allTickets" },
    { label: "In Progress", value: stats.inProgressCount, icon: Loader2, color: "text-yellow-600", bg: "bg-yellow-50", page: "allTickets" },
    { label: "Completed Today", value: stats.completedToday, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", page: "allTickets" },
    { label: "Critical", value: stats.criticalCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", page: "allTickets" },
    { label: "Closed (Month)", value: stats.closedThisMonth, icon: Archive, color: "text-gray-600", bg: "bg-gray-50", page: "allTickets" },
  ];

  const quickActions = [
    { label: "New Ticket", icon: Plus, color: "text-blue-600 bg-blue-50", page: "newTicket", desc: "Create a new helpdesk ticket" },
    { label: "All Tickets", icon: List, color: "text-cyan-600 bg-cyan-50", page: "allTickets", desc: "View all helpdesk tickets" },
    { label: "My Tickets", icon: User, color: "text-yellow-600 bg-yellow-50", page: "myTickets", desc: "Tickets assigned to me" },
    { label: "Reports", icon: BarChart3, color: "text-green-600 bg-green-50", page: "helpdeskReports", desc: "Ticket analytics & reports" },
  ];

  const priorityColors = {
    Critical: "destructive",
    High: "default",
    Medium: "secondary",
    Low: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Helpdesk Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            IT support ticket overview and analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentPage(card.page)}
            >
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className={`flex items-center justify-center rounded-lg ${card.bg} ${card.color} shrink-0`} style={{ width: 40, height: 40 }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold leading-tight">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section>
        <h6 className="text-sm font-semibold mb-2">Quick Actions</h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="card border-0 shadow-sm h-100 text-start w-100 hover:shadow-md transition-shadow rounded-lg"
                onClick={() => setCurrentPage(action.page)}
              >
                <div className="py-3 px-4">
                  <div className={`inline-flex items-center justify-center rounded-lg ${action.color} mb-2`} style={{ width: 34, height: 34 }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h6 className="text-sm font-semibold mb-0">{action.label}</h6>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {chartData && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-3">Tickets by Priority</h6>
              {Object.keys(chartData.byPriority).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead className="w-1/2">Distribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(chartData.byPriority).map(([pri, count]) => {
                      const total = Object.values(chartData.byPriority).reduce((s, v) => s + v, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <TableRow key={pri}>
                          <TableCell>
                            <Badge variant={priorityColors[pri] || "secondary"}>{pri}</Badge>
                          </TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  pri === "Critical" ? "bg-red-500" :
                                  pri === "High" ? "bg-orange-500" :
                                  pri === "Medium" ? "bg-blue-500" :
                                  "bg-gray-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-3">Tickets by Engineer</h6>
              {Object.keys(chartData.byEngineer).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Engineer</TableHead>
                      <TableHead>Tickets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(chartData.byEngineer)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([eng, count]) => (
                        <TableRow key={eng}>
                          <TableCell>{eng}</TableCell>
                          <TableCell>{count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

export default HelpdeskDashboard;
