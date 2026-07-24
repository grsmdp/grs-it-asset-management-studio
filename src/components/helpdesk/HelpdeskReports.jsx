import { useEffect, useState } from "react";
import { getTicketReportData } from "../../services/helpdeskService";

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
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Generating reports...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filtered = getFilteredTickets();
  const statusTabs = [
    { id: "status", label: "By Status", icon: "bi-list-check" },
    { id: "priority", label: "By Priority", icon: "bi-flag" },
    { id: "engineer", label: "By Engineer", icon: "bi-person" },
    { id: "category", label: "By Category", icon: "bi-tags" },
    { id: "ageing", label: "Ageing", icon: "bi-clock" },
    { id: "cost", label: "Cost Analysis", icon: "bi-currency-rupee" },
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

  return (
    <div className="page-panel report-page">
      <div className="page-panel-header d-print-none">
        <div>
          <h2 className="mb-0">Helpdesk Reports</h2>
          <small className="text-muted">
            Ticket analytics and performance insights
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
          { label: "Total Tickets", value: filtered.length, color: "primary" },
          { label: "Open", value: data.statusBreakdown["Open"] || 0, color: "info" },
          { label: "In Progress", value: data.statusBreakdown["In Progress"] || 0, color: "warning" },
          { label: "Completed", value: data.statusBreakdown["Completed"] || 0, color: "success" },
          { label: "Closed", value: data.statusBreakdown["Closed"] || 0, color: "secondary" },
          { label: "Total Cost", value: `₹${totalCost.toLocaleString()}`, color: "danger" },
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

      <div className="d-flex gap-2 mb-3 flex-wrap d-print-none">
        <input
          type="date"
          className="form-control form-control-sm"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ width: 150 }}
        />
        <input
          type="date"
          className="form-control form-control-sm"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ width: 150 }}
        />
        <select
          className="form-select form-select-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: 130 }}
        >
          <option value="">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <ul className="nav nav-tabs mb-2">
                {statusTabs.map((tab) => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <i className={`bi ${tab.icon} me-1`} />
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>

              {activeTab === "status" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Status</th><th>Count</th><th>%</th><th className="w-50">Bar</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.statusBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([status, count]) => {
                          const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                          return (
                            <tr key={status}>
                              <td>{status}</td>
                              <td>{count}</td>
                              <td>{pct}%</td>
                              <td>
                                <div className="progress" style={{ height: 8 }}>
                                  <div className="progress-bar bg-primary" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "priority" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Priority</th><th>Count</th><th>%</th><th className="w-50">Bar</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.priorityBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([pri, count]) => {
                          const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                          const colors = { Critical: "danger", High: "warning", Medium: "info", Low: "secondary" };
                          return (
                            <tr key={pri}>
                              <td><span className={`badge bg-${colors[pri] || "secondary"}`}>{pri}</span></td>
                              <td>{count}</td>
                              <td>{pct}%</td>
                              <td>
                                <div className="progress" style={{ height: 8 }}>
                                  <div className={`progress-bar bg-${colors[pri] || "secondary"}`} style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "engineer" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Engineer</th><th>Tickets</th><th>%</th></tr>
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
                            <tr key={eng}>
                              <td>{eng}</td>
                              <td>{count}</td>
                              <td>{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "category" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Category</th><th>Tickets</th><th>%</th></tr>
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
                            <tr key={cat}>
                              <td>{cat}</td>
                              <td>{count}</td>
                              <td>{filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0}%</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "ageing" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Age</th><th>Count</th><th>%</th><th className="w-50">Bar</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(ageBuckets).map(([age, count]) => {
                        const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                        return (
                          <tr key={age}>
                            <td>{age}</td>
                            <td>{count}</td>
                            <td>{pct}%</td>
                            <td>
                              <div className="progress" style={{ height: 8 }}>
                                <div className="progress-bar bg-info" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "cost" && (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Metric</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Total Cost</td><td>₹{totalCost.toLocaleString()}</td></tr>
                      <tr><td>Average Cost per Ticket</td><td>₹{avgCost.toLocaleString()}</td></tr>
                      <tr><td>Tickets with Cost</td><td>{filtered.filter((t) => t.cost > 0).length}</td></tr>
                      <tr><td>Highest Cost Ticket</td><td>
                        {(() => {
                          const max = filtered.reduce((m, t) => (Number(t.cost) || 0) > (Number(m.cost) || 0) ? t : m, { cost: 0 });
                          return max.cost > 0 ? `${max.ticket_number} (₹${Number(max.cost).toLocaleString()})` : "-";
                        })()}
                      </td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="section-title">Operational Summary</h6>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Total Tickets</span>
                  <strong>{data.tickets.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Active (Open/In Progress)</span>
                  <strong>{(data.statusBreakdown["Open"] || 0) + (data.statusBreakdown["In Progress"] || 0) + (data.statusBreakdown["Assigned"] || 0)}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Completed + Closed</span>
                  <strong>{(data.statusBreakdown["Completed"] || 0) + (data.statusBreakdown["Closed"] || 0)}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Categories</span>
                  <strong>{data.categories.length}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Critical Issues</span>
                  <strong className="text-danger">{data.priorityBreakdown["Critical"] || 0}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span>Total Maintenance Cost</span>
                  <strong>₹{totalCost.toLocaleString()}</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title">Quick Links</h6>
              <div className="d-grid gap-1">
                <button className="btn btn-sm btn-outline-primary text-start" onClick={() => setCurrentPage("allTickets")}>
                  <i className="bi bi-list-ul me-2" />View All Tickets
                </button>
                <button className="btn btn-sm btn-outline-primary text-start" onClick={() => setCurrentPage("newTicket")}>
                  <i className="bi bi-plus-circle me-2" />Create New Ticket
                </button>
                <button className="btn btn-sm btn-outline-primary text-start" onClick={() => setCurrentPage("myTickets")}>
                  <i className="bi bi-person-lines-fill me-2" />My Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpdeskReports;
