import { useEffect, useState } from "react";
import { getDashboardStats, getRecentAssets } from "../services/assetService";
import { getStatusBadgeClass } from "../utils/statusBadge";

function Dashboard({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsData, assetsData] = await Promise.all([
        getDashboardStats(),
        getRecentAssets(5),
      ]);
      setStats(statsData);
      setRecentAssets(assetsData);
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
          <p className="mt-2 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Assets",
      value: stats.totalAssets,
      icon: "bi-pc-display",
      bgClass: "bg-primary-subtle text-primary",
      desc: "Registered assets",
    },
    {
      label: "Active Assets",
      value: stats.activeAssets,
      icon: "bi-check-circle",
      bgClass: "bg-success-subtle text-success",
      desc: "Currently in use",
    },
    {
      label: "Under Repair",
      value: stats.repairAssets,
      icon: "bi-tools",
      bgClass: "bg-warning-subtle text-warning",
      desc: "Maintenance required",
    },
    {
      label: "Scrapped",
      value: stats.scrappedAssets,
      icon: "bi-trash",
      bgClass: "bg-secondary-subtle text-secondary",
      desc: "Decommissioned",
    },
    {
      label: "Warranty Expiring",
      value: stats.warrantyExpiring,
      icon: "bi-shield-exclamation",
      bgClass: "bg-danger-subtle text-danger",
      desc: "Within 30 days",
    },
  ];

  const quickActions = [
    {
      label: "Add New Asset",
      icon: "bi-plus-circle",
      color: "primary",
      page: "addAsset",
      desc: "Register a new IT asset",
    },
    {
      label: "Transfer Asset",
      icon: "bi-arrow-left-right",
      color: "info",
      page: "movement",
      desc: "Move asset to another location",
    },
    {
      label: "Send for Repair",
      icon: "bi-tools",
      color: "warning",
      page: "maintenance",
      desc: "Record maintenance activity",
    },
    {
      label: "View Reports",
      icon: "bi-bar-chart",
      color: "success",
      page: "reports",
      desc: "Asset inventory summary",
    },
  ];

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">Dashboard</h2>
          <small className="text-muted">
            Overview of your IT asset inventory
          </small>
        </div>
        <button
          className="btn btn-sm btn-outline-success"
          onClick={loadDashboard}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          Refresh
        </button>
      </div>

      <section className="row g-3 mb-3">
        {statCards.map((card) => (
          <div className="col-xl col-md-4 col-6" key={card.label}>
            <div className="card border-0 shadow-sm h-100">
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
                  <h6 className="mb-0">
                    {action.label}
                  </h6>
                  <small className="text-muted">
                    {action.desc}
                  </small>
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="section-title mb-0">Recently Added Assets</h6>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setCurrentPage("assets")}
          >
            View All
          </button>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Asset Code</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-3 text-muted">
                      No assets found. Add your first asset to get started.
                    </td>
                  </tr>
                ) : (
                  recentAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="fw-semibold">{asset.asset_code}</td>
                      <td>{asset.asset_name}</td>
                      <td>{asset.asset_categories?.category_name || "-"}</td>
                      <td>{asset.current_location?.location_name || "-"}</td>
                      <td>{asset.departments?.department_name || "-"}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(asset.status)}`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
