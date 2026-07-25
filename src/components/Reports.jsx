import { useEffect, useMemo, useState } from "react";
import { getReportSummary } from "../services/assetService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Printer,
  RefreshCw,
  Package,
  ArrowUpDown,
  Wrench,
} from "lucide-react";

function getStatusBadgeClasses(status) {
  switch (status) {
    case "Active":
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
    case "Under Repair":
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
    case "Spare":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
    case "Scrapped":
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
    case "Scheduled":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
  }
}

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const data = await getReportSummary();
      setReport(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = useMemo(() => {
    if (!report) return [];
    return report.assets.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (categoryFilter && String(a.category_id) !== categoryFilter) return false;
      if (locationFilter && String(a.current_location_id) !== locationFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${a.asset_code} ${a.asset_name} ${a.brand || ""} ${a.model || ""} ${a.serial_number || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [report, search, statusFilter, categoryFilter, locationFilter]);

  const filteredMovements = useMemo(() => {
    if (!report) return [];
    return report.movements.filter((m) => {
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${m.reason || ""} ${m.remarks || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [report, search]);

  const filteredMaintenance = useMemo(() => {
    if (!report) return [];
    return report.maintenance.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${m.maintenance_type || ""} ${m.status || ""} ${m.remarks || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [report, search, statusFilter]);

  function exportCSV(rows, filename) {
    if (!rows || rows.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
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
    if (activeTab === "assets") {
      exportCSV(
        filteredAssets.map((a) => ({
          "Asset Code": a.asset_code,
          "Asset Name": a.asset_name,
          "Category": report.categories.find((c) => c.id === a.category_id)?.category_name || "",
          "Location": report.locations.find((l) => l.id === a.current_location_id)?.location_name || "",
          "Department": report.departments.find((d) => d.id === a.department_id)?.department_name || "",
          "Status": a.status,
          "Purchase Cost": a.purchase_cost ?? "",
          "Warranty Expiry": a.warranty_expiry || "",
        })),
        "assets_report.csv"
      );
    } else if (activeTab === "movements") {
      exportCSV(
        filteredMovements.map((m) => ({
          "Date": m.movement_date || "",
          "Asset ID": m.asset_id || "",
          "From Location ID": m.from_location_id || "",
          "To Location ID": m.to_location_id || "",
          "Reason": m.reason || "",
          "Remarks": m.remarks || "",
        })),
        "movements_report.csv"
      );
    } else {
      exportCSV(
        filteredMaintenance.map((m) => ({
          "Type": m.maintenance_type,
          "Status": m.status,
          "Cost": m.cost ?? "",
          "Remarks": m.remarks || "",
        })),
        "maintenance_report.csv"
      );
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleTabChange(value) {
    setActiveTab(value);
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setLocationFilter("");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  if (!report) return null;

  const assetStatuses = ["Active", "Spare", "Under Repair", "Scrapped"];

  const statusCounts = {};
  assetStatuses.forEach((s) => {
    statusCounts[s] = report.statusBreakdown[s] || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Asset inventory summary and operational insights
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Assets", value: report.assets.length, color: "border-l-blue-500" },
          { label: "Active", value: statusCounts.Active, color: "border-l-green-500" },
          { label: "Under Repair", value: statusCounts["Under Repair"], color: "border-l-yellow-500" },
          { label: "Spare", value: statusCounts.Spare, color: "border-l-cyan-500" },
          { label: "Scrapped", value: statusCounts.Scrapped, color: "border-l-gray-400" },
          { label: "Total Value", value: `₹${report.totalValue.toLocaleString()}`, color: "border-l-red-500" },
        ].map((card) => (
          <Card key={card.label} className={`border-0 shadow-sm border-l-4 ${card.color}`}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-lg font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="assets" className="gap-1">
                    <Package className="h-4 w-4" />
                    Assets
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {filteredAssets.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="movements" className="gap-1">
                    <ArrowUpDown className="h-4 w-4" />
                    Movements
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {filteredMovements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="maintenance" className="gap-1">
                    <Wrench className="h-4 w-4" />
                    Maintenance
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {filteredMaintenance.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="mt-0 space-y-3">
                  <div className="flex gap-2 flex-wrap print:hidden">
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-[170px]"
                    />
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      {assetStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {report.categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="">All Locations</option>
                      {report.locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.location_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No assets found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAssets.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.asset_code}</TableCell>
                              <TableCell>{a.asset_name}</TableCell>
                              <TableCell>{report.categories.find((c) => c.id === a.category_id)?.category_name || "-"}</TableCell>
                              <TableCell>{report.locations.find((l) => l.id === a.current_location_id)?.location_name || "-"}</TableCell>
                              <TableCell>{report.departments.find((d) => d.id === a.department_id)?.department_name || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeClasses(a.status)}>{a.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {a.purchase_cost != null ? `₹${Number(a.purchase_cost).toLocaleString()}` : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="movements" className="mt-0 space-y-3">
                  <div className="flex gap-2 flex-wrap print:hidden">
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-[170px]"
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Asset</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No movement records
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMovements.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell>{m.movement_date || "-"}</TableCell>
                              <TableCell>{report.assets.find((a) => a.id === m.asset_id)?.asset_code || m.asset_id}</TableCell>
                              <TableCell>{report.locations.find((l) => l.id === m.from_location_id)?.location_name || "-"}</TableCell>
                              <TableCell>{report.locations.find((l) => l.id === m.to_location_id)?.location_name || "-"}</TableCell>
                              <TableCell>{m.reason || m.remarks || "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="maintenance" className="mt-0 space-y-3">
                  <div className="flex gap-2 flex-wrap print:hidden">
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-[170px]"
                    />
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMaintenance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No maintenance records
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMaintenance.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell>{m.maintenance_type}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeClasses(m.status)}>{m.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {m.cost != null ? `₹${Number(m.cost).toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell>{m.remarks || "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(report.statusBreakdown).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell>
                          <Badge className={getStatusBadgeClasses(status)}>{status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Operational Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { label: "Total Movements", value: report.movements.length },
                  { label: "Maintenance Records", value: report.maintenance.length },
                  { label: "Categories", value: report.categories.length },
                  { label: "Locations", value: report.locations.length },
                  { label: "Departments", value: report.departments.length },
                  { label: "Vendors", value: report.vendors.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Reports;
