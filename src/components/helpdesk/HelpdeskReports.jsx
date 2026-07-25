import { useEffect, useState } from "react";
import { getTicketReportData } from "../../services/helpdeskService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
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
    { label: "Total Tickets", value: filtered.length, border: "border-l-blue-500" },
    { label: "Open", value: data.statusBreakdown["Open"] || 0, border: "border-l-cyan-500" },
    { label: "In Progress", value: data.statusBreakdown["In Progress"] || 0, border: "border-l-yellow-500" },
    { label: "Completed", value: data.statusBreakdown["Completed"] || 0, border: "border-l-green-500" },
    { label: "Closed", value: data.statusBreakdown["Closed"] || 0, border: "border-l-gray-400" },
    { label: "Total Cost", value: `\u20B9${totalCost.toLocaleString()}`, border: "border-l-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Helpdesk Reports</h2>
          <p className="text-sm text-muted-foreground">
            Ticket analytics and performance insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={loadReport}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border-0 shadow-sm border-l-4 ${card.border}`}>
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <h5 className="font-bold mt-0.5">{card.value}</h5>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex gap-2 mb-4 flex-wrap">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-3">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead className="w-1/2">Bar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.statusBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([status, count]) => {
                          const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                          return (
                            <TableRow key={status}>
                              <TableCell>{status}</TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{pct}%</TableCell>
                              <TableCell>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="priority">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Priority</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead className="w-1/2">Bar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.priorityBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([pri, count]) => {
                          const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                          const colors = { Critical: "bg-red-500", High: "bg-orange-500", Medium: "bg-blue-500", Low: "bg-gray-400" };
                          const variants = { Critical: "destructive", High: "default", Medium: "secondary", Low: "outline" };
                          return (
                            <TableRow key={pri}>
                              <TableCell>
                                <Badge variant={variants[pri] || "secondary"}>{pri}</Badge>
                              </TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{pct}%</TableCell>
                              <TableCell>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${colors[pri] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="engineer">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Engineer</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const byEng = {};
                        filtered.forEach((t) => {
                          const eng = t.assigned_to || "Unassigned";
                          byEng[eng] = (byEng[eng] || 0) + 1;
                        });
                        return Object.entries(byEng)
                          .sort((a, b) => b[1] - a[1])
                          .map(([eng, count]) => (
                            <TableRow key={eng}>
                              <TableCell>{eng}</TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</TableCell>
                            </TableRow>
                          ));
                      })()}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="category">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
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
                            <TableRow key={cat}>
                              <TableCell>{cat}</TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</TableCell>
                            </TableRow>
                          ));
                      })()}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="ageing">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Age</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead className="w-1/2">Bar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(ageBuckets).map(([age, count]) => {
                        const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                        return (
                          <TableRow key={age}>
                            <TableCell>{age}</TableCell>
                            <TableCell>{count}</TableCell>
                            <TableCell>{pct}%</TableCell>
                            <TableCell>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="cost">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell>Total Cost</TableCell><TableCell>\u20B9{totalCost.toLocaleString()}</TableCell></TableRow>
                      <TableRow><TableCell>Average Cost per Ticket</TableCell><TableCell>\u20B9{avgCost.toLocaleString()}</TableCell></TableRow>
                      <TableRow><TableCell>Tickets with Cost</TableCell><TableCell>{filtered.filter((t) => t.cost > 0).length}</TableCell></TableRow>
                      <TableRow><TableCell>Highest Cost Ticket</TableCell><TableCell>
                        {(() => {
                          const max = filtered.reduce((m, t) => (Number(t.cost) || 0) > (Number(m.cost) || 0) ? t : m, { cost: 0 });
                          return max.cost > 0 ? `${max.ticket_number} (\u20B9${Number(max.cost).toLocaleString()})` : "-";
                        })()}
                      </TableCell></TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-3">Operational Summary</h6>
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
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-semibold ${item.highlight ? "text-red-600" : ""}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h6 className="text-sm font-semibold mb-3">Quick Links</h6>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HelpdeskReports;
