import { useEffect, useMemo, useState } from "react";
import { getReportSummary } from "../services/assetService";
import { getStatusBadgeClass } from "../utils/statusBadge";

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

  if (loading) {
    return (
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Generating reports...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const tabs = [
    { id: "assets", label: "Assets", icon: "bi-pc-display", count: filteredAssets.length },
    { id: "movements", label: "Movements", icon: "bi-arrow-left-right", count: filteredMovements.length },
    { id: "maintenance", label: "Maintenance", icon: "bi-tools", count: filteredMaintenance.length },
  ];

  const statusCounts = {};
  const assetStatuses = ["Active", "Spare", "Under Repair", "Scrapped"];
  assetStatuses.forEach((s) => {
    statusCounts[s] = report.statusBreakdown[s] || 0;
  });

  return (
    <div className="page-panel report-page">
      <div className="page-panel-header d-print-none">
        <div>
          <h2 className="mb-0">Reports</h2>
          <small className="text-muted">
            Asset inventory summary and operational insights
          </small>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-success" onClick={handleExport}>
            <i className="bi bi-download me-1" />
            Export CSV
          </button>
          <button className="btn btn-sm btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1" />
            Print
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadReport}>
            <i className="bi bi-arrow-clockwise me-1" />
            Refresh
          </button>
        </div>
      </div>

      <section className="row g-2 mb-3">
        {[
          { label: "Total Assets", value: report.assets.length, color: "primary" },
          { label: "Active", value: statusCounts.Active, color: "success" },
          { label: "Under Repair", value: statusCounts["Under Repair"], color: "warning" },
          { label: "Spare", value: statusCounts.Spare, color: "info" },
          { label: "Scrapped", value: statusCounts.Scrapped, color: "secondary" },
          { label: "Total Value", value: `₹${report.totalValue.toLocaleString()}`, color: "danger" },
        ].map((card) => (
          <div className="col-xl-2 col-md-4 col-6" key={card.label}>
            <div className={`card border-0 shadow-sm h-100 border-start border-3 border-${card.color}`}>
              <div className="card-body py-2 px-3">
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>{card.label}</div>
                <h5 className="mb-0">{card.value}</h5>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <ul className="nav nav-tabs mb-2">
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearch("");
                        setStatusFilter("");
                        setCategoryFilter("");
                        setLocationFilter("");
                      }}
                    >
                      <i className={`bi ${tab.icon} me-1`} />
                      {tab.label}
                      <span className="badge bg-secondary ms-1">{tab.count}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="d-flex gap-2 mb-2 flex-wrap d-print-none">
                <input
                  className="form-control form-control-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 170 }}
                />
                {activeTab === "assets" && (
                  <>
                    <select
                      className="form-select form-select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: 130 }}
                    >
                      <option value="">All Status</option>
                      {assetStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      className="form-select form-select-sm"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{ width: 140 }}
                    >
                      <option value="">All Categories</option>
                      {report.categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                    <select
                      className="form-select form-select-sm"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      style={{ width: 140 }}
                    >
                      <option value="">All Locations</option>
                      {report.locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.location_name}</option>
                      ))}
                    </select>
                  </>
                )}
                {activeTab === "maintenance" && (
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 130 }}
                  >
                    <option value="">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}
              </div>

              <div className="table-responsive">
                {activeTab === "assets" && (
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-3 text-muted">No assets found</td></tr>
                      ) : (
                        filteredAssets.map((a) => (
                          <tr key={a.id}>
                            <td className="fw-semibold">{a.asset_code}</td>
                            <td>{a.asset_name}</td>
                            <td>{report.categories.find((c) => c.id === a.category_id)?.category_name || "-"}</td>
                            <td>{report.locations.find((l) => l.id === a.current_location_id)?.location_name || "-"}</td>
                            <td>{report.departments.find((d) => d.id === a.department_id)?.department_name || "-"}</td>
                            <td><span className={`badge ${getStatusBadgeClass(a.status)}`}>{a.status}</span></td>
                            <td>{a.purchase_cost != null ? `₹${Number(a.purchase_cost).toLocaleString()}` : "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "movements" && (
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Asset</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-3 text-muted">No movement records</td></tr>
                      ) : (
                        filteredMovements.map((m) => (
                          <tr key={m.id}>
                            <td>{m.movement_date || "-"}</td>
                            <td>{report.assets.find((a) => a.id === m.asset_id)?.asset_code || m.asset_id}</td>
                            <td>{report.locations.find((l) => l.id === m.from_location_id)?.location_name || "-"}</td>
                            <td>{report.locations.find((l) => l.id === m.to_location_id)?.location_name || "-"}</td>
                            <td>{m.reason || m.remarks || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "maintenance" && (
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Cost</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaintenance.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-3 text-muted">No maintenance records</td></tr>
                      ) : (
                        filteredMaintenance.map((m) => (
                          <tr key={m.id}>
                            <td>{m.maintenance_type}</td>
                            <td><span className={`badge ${getStatusBadgeClass(m.status)}`}>{m.status}</span></td>
                            <td>{m.cost != null ? `₹${Number(m.cost).toLocaleString()}` : "-"}</td>
                            <td>{m.remarks || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="section-title">Status Breakdown</h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead className="table-light">
                    <tr><th>Status</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.statusBreakdown).map(([status, count]) => (
                      <tr key={status}>
                        <td><span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span></td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title">Operational Summary</h6>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Total Movements</span>
                  <strong>{report.movements.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Maintenance Records</span>
                  <strong>{report.maintenance.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Categories</span>
                  <strong>{report.categories.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Locations</span>
                  <strong>{report.locations.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Departments</span>
                  <strong>{report.departments.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Vendors</span>
                  <strong>{report.vendors.length}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
