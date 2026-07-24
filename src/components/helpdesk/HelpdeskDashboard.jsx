import { useEffect, useState } from "react";
import { getTicketStats, getTicketChartData } from "../../services/helpdeskService";

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
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading helpdesk dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Open Tickets", value: stats.openCount, icon: "bi-folder2-open", bgClass: "bg-primary-subtle text-primary", page: "allTickets" },
    { label: "Assigned", value: stats.assignedCount, icon: "bi-person-check", bgClass: "bg-info-subtle text-info", page: "allTickets" },
    { label: "In Progress", value: stats.inProgressCount, icon: "bi-gear", bgClass: "bg-warning-subtle text-warning", page: "allTickets" },
    { label: "Completed Today", value: stats.completedToday, icon: "bi-check-circle", bgClass: "bg-success-subtle text-success", page: "allTickets" },
    { label: "Critical", value: stats.criticalCount, icon: "bi-exclamation-triangle", bgClass: "bg-danger-subtle text-danger", page: "allTickets" },
    { label: "Closed (Month)", value: stats.closedThisMonth, icon: "bi-archive", bgClass: "bg-secondary-subtle text-secondary", page: "allTickets" },
  ];

  const quickActions = [
    { label: "New Ticket", icon: "bi-plus-circle", color: "primary", page: "newTicket", desc: "Create a new helpdesk ticket" },
    { label: "All Tickets", icon: "bi-list-ul", color: "info", page: "allTickets", desc: "View all helpdesk tickets" },
    { label: "My Tickets", icon: "bi-person-lines-fill", color: "warning", page: "myTickets", desc: "Tickets assigned to me" },
    { label: "Reports", icon: "bi-bar-chart", color: "success", page: "helpdeskReports", desc: "Ticket analytics & reports" },
  ];

  const priorityColors = {
    Critical: "danger",
    High: "warning",
    Medium: "info",
    Low: "secondary",
  };

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">Helpdesk Dashboard</h2>
          <small className="text-muted">
            IT support ticket overview and analytics
          </small>
        </div>
        <button className="btn btn-sm btn-outline-success" onClick={loadDashboard}>
          <i className="bi bi-arrow-clockwise me-1" />
          Refresh
        </button>
      </div>

      <section className="row g-3 mb-3">
        {statCards.map((card) => (
          <div className="col-xl-2 col-md-4 col-6" key={card.label}>
            <div
              className="card border-0 shadow-sm h-100"
              role="button"
              onClick={() => setCurrentPage(card.page)}
            >
              <div className="card-body d-flex align-items-center gap-2 py-2">
                <div
                  className={`rounded d-flex align-items-center justify-content-center flex-shrink-0 ${card.bgClass}`}
                  style={{ width: 40, height: 40, fontSize: 17 }}
                >
                  <i className={`bi ${card.icon}`} />
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {card.label}
                  </div>
                  <h4 className="mb-0 lh-1">{card.value}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="section-title mb-0">Quick Actions</h6>
        </div>
        <div className="row g-2">
          {quickActions.map((action) => (
            <div className="col-xl-3 col-md-6" key={action.label}>
              <button
                className="card border-0 shadow-sm h-100 text-start w-100 quick-action-card"
                onClick={() => setCurrentPage(action.page)}
              >
                <div className="card-body py-2 px-3">
                  <div
                    className={`rounded d-inline-flex align-items-center justify-content-center bg-${action.color}-subtle text-${action.color} mb-1`}
                    style={{ width: 34, height: 34, fontSize: 16 }}
                  >
                    <i className={`bi ${action.icon}`} />
                  </div>
                  <h6 className="mb-0">{action.label}</h6>
                  <small className="text-muted">{action.desc}</small>
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {chartData && (
        <section className="row g-3">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title">Tickets by Priority</h6>
                {Object.keys(chartData.byPriority).length === 0 ? (
                  <p className="text-muted small mb-0">No data</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr><th>Priority</th><th>Count</th><th className="w-50">Distribution</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(chartData.byPriority).map(([pri, count]) => {
                          const total = Object.values(chartData.byPriority).reduce((s, v) => s + v, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <tr key={pri}>
                              <td>
                                <span className={`badge bg-${priorityColors[pri] || "secondary"}`}>{pri}</span>
                              </td>
                              <td>{count}</td>
                              <td>
                                <div className="progress" style={{ height: 6 }}>
                                  <div
                                    className={`progress-bar bg-${priorityColors[pri] || "secondary"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title">Tickets by Engineer</h6>
                {Object.keys(chartData.byEngineer).length === 0 ? (
                  <p className="text-muted small mb-0">No data</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr><th>Engineer</th><th>Tickets</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(chartData.byEngineer)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([eng, count]) => (
                            <tr key={eng}>
                              <td>{eng}</td>
                              <td>{count}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HelpdeskDashboard;
