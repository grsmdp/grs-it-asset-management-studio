import { useEffect, useMemo, useState } from "react";
import { getReportSummary } from "../services/assetService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import StatCard from "@/components/layout/StatCard";
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
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

  const statCards = [
    { label: "Total Assets", value: report.assets.length, color: "#3b82f6", borderColor: "#3b82f6" },
    { label: "Active", value: statusCounts.Active, color: "#22c55e", borderColor: "#22c55e" },
    { label: "Under Repair", value: statusCounts["Under Repair"], color: "#eab308", borderColor: "#eab308" },
    { label: "Spare", value: statusCounts.Spare, color: "#06b6d4", borderColor: "#06b6d4" },
    { label: "Scrapped", value: statusCounts.Scrapped, color: "#9ca3af", borderColor: "#9ca3af" },
    { label: "Total Value", value: `\u20B9${report.totalValue.toLocaleString()}`, color: "#ef4444", borderColor: "#ef4444" },
  ];

  const operationalItems = [
    { label: "Total Movements", value: report.movements.length },
    { label: "Maintenance Records", value: report.maintenance.length },
    { label: "Categories", value: report.categories.length },
    { label: "Locations", value: report.locations.length },
    { label: "Departments", value: report.departments.length },
    { label: "Vendors", value: report.vendors.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="ANALYTICS"
        title="Reports"
        subtitle="Asset inventory summary and insights"
        accent="#dc3545"
      >
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
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            borderColor={card.borderColor}
          />
        ))}
      </div>

      <FilterCard>
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
      </FilterCard>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-0">
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
          </Tabs>
        </div>

        <div className="overflow-auto max-h-[500px]">
          {activeTab === "assets" && (
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Code</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Category</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Location</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Department</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="rounded-full bg-slate-100 p-3">
                          <Package className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No assets found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((a) => (
                    <TableRow key={a.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">{a.asset_code}</TableCell>
                      <TableCell>{a.asset_name}</TableCell>
                      <TableCell>{report.categories.find((c) => c.id === a.category_id)?.category_name || "-"}</TableCell>
                      <TableCell>{report.locations.find((l) => l.id === a.current_location_id)?.location_name || "-"}</TableCell>
                      <TableCell>{report.departments.find((d) => d.id === a.department_id)?.department_name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClasses(a.status)}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.purchase_cost != null ? `\u20B9${Number(a.purchase_cost).toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === "movements" && (
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Asset</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">From</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">To</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="rounded-full bg-slate-100 p-3">
                          <ArrowUpDown className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No movement records</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/50">
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
          )}

          {activeTab === "maintenance" && (
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Cost</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="rounded-full bg-slate-100 p-3">
                          <Wrench className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No maintenance records</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaintenance.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/50">
                      <TableCell>{m.maintenance_type}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClasses(m.status)}>{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.cost != null ? `\u20B9${Number(m.cost).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>{m.remarks || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Status Breakdown</h3>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(report.statusBreakdown).map(([status, count]) => (
                  <TableRow key={status} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Badge className={getStatusBadgeClasses(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Operational Summary</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {operationalItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50/50">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
