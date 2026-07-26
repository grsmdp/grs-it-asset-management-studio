import { useEffect, useState } from "react";
import { getTicketReportData } from "../../services/helpdeskService";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import StatCard from "@/components/layout/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Printer, RefreshCw, ListChecks, Flag, User, Tag, Clock, Banknote, List, Plus, UserCircle } from "lucide-react";

function HelpdeskReports({ setCurrentPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const result = await getTicketReportData();
      setData(result);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getFilteredTickets() {
    if (!data) return [];
    return data.tickets.filter((t) => {
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (dateFrom && t.created_at && t.created_at < dateFrom) return false;
      if (dateTo && t.created_at && t.created_at.slice(0, 10) > dateTo) return false;
      return true;
    });
  }

  function exportCSV(rows, filename) {
    if (!rows || rows.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    const filtered = getFilteredTickets();
    exportCSV(
      filtered.map((t) => ({
        "Ticket #": t.ticket_number,
        "Title": t.problem_title,
        "Requested By": t.requested_by,
        "Priority": t.priority,
        "Status": t.status,
        "Assigned To": t.assigned_to || "",
        "Created": t.created_at || "",
        "Completed": t.completed_at || "",
        "Closed": t.closed_at || "",
        "Cost": t.cost ?? "",
      })),
      "helpdesk_report.csv"
    );
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const filtered = getFilteredTickets();
  const statusTabs = [
    { id: "status", label: "By Status", icon: ListChecks },
    { id: "priority", label: "By Priority", icon: Flag },
    { id: "engineer", label: "By Engineer", icon: User },
    { id: "category", label: "By Category", icon: Tag },
    { id: "ageing", label: "Ageing", icon: Clock },
    { id: "cost", label: "Cost Analysis", icon: Banknote },
  ];

  const totalCost = filtered.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const avgCost = filtered.length > 0 ? Math.round(totalCost / filtered.length) : 0;

  const ageBuckets = { "0-1 days": 0, "2-3 days": 0, "4-7 days": 0, "8-14 days": 0, "15+ days": 0 };
  filtered.forEach((t) => {
    if (!t.created_at) return;
    const days = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
    if (days <= 1) ageBuckets["0-1 days"]++;
    else if (days <= 3) ageBuckets["2-3 days"]++;
    else if (days <= 7) ageBuckets["4-7 days"]++;
    else if (days <= 14) ageBuckets["8-14 days"]++;
    else ageBuckets["15+ days"]++;
  });

  const summaryCards = [
    { label: "Total Tickets", value: filtered.length, color: "#3b82f6", borderColor: "#3b82f6" },
    { label: "Open", value: data.statusBreakdown["Open"] || 0, color: "#06b6d4", borderColor: "#06b6d4" },
    { label: "In Progress", value: data.statusBreakdown["In Progress"] || 0, color: "#eab308", borderColor: "#eab308" },
    { label: "Completed", value: data.statusBreakdown["Completed"] || 0, color: "#22c55e", borderColor: "#22c55e" },
    { label: "Closed", value: data.statusBreakdown["Closed"] || 0, color: "#6b7280", borderColor: "#6b7280" },
    { label: "Total Cost", value: `\u20B9${totalCost.toLocaleString()}`, color: "#ef4444", borderColor: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title="Helpdesk Reports"
        subtitle="Analytics and performance"
        accent="#6f42c1"
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={loadReport}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            borderColor={card.borderColor}
          />
        ))}
      </section>

      <FilterCard>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
        />
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </FilterCard>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 pt-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    <Icon className="mr-1 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="status">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Status</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Count</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">%</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left w-1/2">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.statusBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => {
                        const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                        return (
                          <tr key={status} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 text-slate-700">{status}</td>
                            <td className="px-5 py-3 text-slate-600">{count}</td>
                            <td className="px-5 py-3 text-slate-600">{pct}%</td>
                            <td className="px-5 py-3">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="priority">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Priority</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Count</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">%</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left w-1/2">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.priorityBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([pri, count]) => {
                        const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                        const colors = { Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-blue-500", Low: "bg-gray-400" };
                        const variants = { Critical: "destructive", High: "default", Medium: "secondary", Low: "outline" };
                        return (
                          <tr key={pri} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <Badge variant={variants[pri] || "secondary"}>{pri}</Badge>
                            </td>
                            <td className="px-5 py-3 text-slate-600">{count}</td>
                            <td className="px-5 py-3 text-slate-600">{pct}%</td>
                            <td className="px-5 py-3">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${colors[pri] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="engineer">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Engineer</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Tickets</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const byEng = {};
                      filtered.forEach((t) => {
                        const eng = t.assigned_to || "Unassigned";
                        byEng[eng] = (byEng[eng] || 0) + 1;
                      });
                      return Object.entries(byEng)
                        .sort((a, b) => b[1] - a[1])
                        .map(([eng, count]) => (
                          <tr key={eng} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 text-slate-700">{eng}</td>
                            <td className="px-5 py-3 text-slate-600">{count}</td>
                            <td className="px-5 py-3 text-slate-600">{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="category">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Category</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Tickets</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const byCat = {};
                      filtered.forEach((t) => {
                        const cat = data.categories.find((c) => c.id === t.category_id);
                        const catName = cat ? cat.category_name : "Uncategorized";
                        byCat[catName] = (byCat[catName] || 0) + 1;
                      });
                      return Object.entries(byCat)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => (
                          <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 text-slate-700">{cat}</td>
                            <td className="px-5 py-3 text-slate-600">{count}</td>
                            <td className="px-5 py-3 text-slate-600">{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="ageing">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Age</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Count</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">%</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left w-1/2">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ageBuckets).map(([age, count]) => {
                      const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                      return (
                        <tr key={age} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 text-slate-700">{age}</td>
                          <td className="px-5 py-3 text-slate-600">{count}</td>
                          <td className="px-5 py-3 text-slate-600">{pct}%</td>
                          <td className="px-5 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="cost">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Metric</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-700">Total Cost</td>
                      <td className="px-5 py-3 text-slate-600">\u20B9{totalCost.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-700">Average Cost per Ticket</td>
                      <td className="px-5 py-3 text-slate-600">\u20B9{avgCost.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-700">Tickets with Cost</td>
                      <td className="px-5 py-3 text-slate-600">{filtered.filter((t) => t.cost > 0).length}</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-700">Highest Cost Ticket</td>
                      <td className="px-5 py-3 text-slate-600">
                        {(() => {
                          const max = filtered.reduce((m, t) => (Number(t.cost) || 0) > (Number(m.cost) || 0) ? t : m, { cost: 0 });
                          return max.cost > 0 ? `${max.ticket_number} (\u20B9${Number(max.cost).toLocaleString()})` : "-";
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h6 className="text-sm font-semibold text-slate-800 mb-3">Operational Summary</h6>
          <div className="space-y-3">
            {[
              { label: "Total Tickets", value: data.tickets.length },
              { label: "Active (Open/In Progress)", value: (data.statusBreakdown["Open"] || 0) + (data.statusBreakdown["In Progress"] || 0) + (data.statusBreakdown["Assigned"] || 0) },
              { label: "Completed + Closed", value: (data.statusBreakdown["Completed"] || 0) + (data.statusBreakdown["Closed"] || 0) },
              { label: "Categories", value: data.categories.length },
              { label: "Critical Issues", value: data.priorityBreakdown["Critical"] || 0, highlight: true },
              { label: "Total Maintenance Cost", value: `\u20B9${totalCost.toLocaleString()}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className={`font-semibold ${item.highlight ? "text-red-600" : "text-slate-800"}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h6 className="text-sm font-semibold text-slate-800 mb-3">Quick Links</h6>
          <div className="space-y-1">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setCurrentPage("allTickets")}>
              <List className="mr-2 h-4 w-4" />View All Tickets
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setCurrentPage("newTicket")}>
              <Plus className="mr-2 h-4 w-4" />Create New Ticket
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setCurrentPage("myTickets")}>
              <UserCircle className="mr-2 h-4 w-4" />My Tickets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpdeskReports;
