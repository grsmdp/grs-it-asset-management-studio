import { useEffect, useMemo, useState } from "react";
import {
  createMaintenance,
  getAssets,
  getMaintenanceRecords,
  updateAsset,
  updateMaintenance,
} from "../services/assetService";
import { getStatusBadgeClass } from "../utils/statusBadge";

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    asset_id: "",
    maintenance_type: "Repair",
    status: "Scheduled",
    cost: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [maintenanceData, assetData] = await Promise.all([
        getMaintenanceRecords(),
        getAssets(),
      ]);
      setRecords(maintenanceData);
      setAssets(assetData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const assetMap = useMemo(
    () =>
      Object.fromEntries(
        assets.map((a) => [a.id, `${a.asset_code} - ${a.asset_name}`])
      ),
    [assets]
  );

  const emptyForm = {
    asset_id: "",
    maintenance_type: "Repair",
    status: "Scheduled",
    cost: "",
    remarks: "",
  };

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleEdit(record) {
    setEditingId(record.id);
    setForm({
      asset_id: record.asset_id ? String(record.asset_id) : "",
      maintenance_type: record.maintenance_type || "Repair",
      status: record.status || "Scheduled",
      cost: record.cost ?? "",
      remarks: record.remarks || "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.asset_id || !form.maintenance_type || !form.status) {
      alert("Please fill all required maintenance fields.");
      return;
    }

    const payload = {
      asset_id: Number(form.asset_id),
      maintenance_type: form.maintenance_type,
      status: form.status,
      cost: form.cost === "" ? null : Number(form.cost),
      remarks: form.remarks || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateMaintenance(editingId, payload);
        alert("Maintenance record updated.");
      } else {
        await createMaintenance(payload);
        alert("Maintenance record created.");
      }

      if (form.status === "In Progress" || form.status === "Scheduled") {
        await updateAsset(Number(form.asset_id), { status: "Under Repair" });
      }
      if (form.status === "Completed") {
        await updateAsset(Number(form.asset_id), { status: "Active" });
      }
      if (form.status === "Cancelled") {
        await updateAsset(Number(form.asset_id), { status: "Active" });
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record, newStatus) {
    try {
      await updateMaintenance(record.id, { status: newStatus });

      if (newStatus === "Completed") {
        await updateAsset(record.asset_id, { status: "Active" });
      } else if (newStatus === "In Progress") {
        await updateAsset(record.asset_id, { status: "Under Repair" });
      } else if (newStatus === "Cancelled") {
        await updateAsset(record.asset_id, { status: "Active" });
      }

      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const filtered = records.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const label = assetMap[r.asset_id] || "";
      const haystack = `${label} ${r.maintenance_type} ${r.remarks || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">Maintenance</h2>
          <small className="text-muted">
            Track repairs, service requests, and maintenance status
          </small>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title">
                {editingId ? "Edit Maintenance Record" : "New Maintenance Record"}
              </h6>

              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-12">
                  <label className="form-label">Asset *</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.asset_id}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, asset_id: e.target.value }))
                    }
                  >
                    <option value="">Select Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_code} - {asset.asset_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Maintenance Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.maintenance_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maintenance_type: e.target.value,
                      }))
                    }
                  >
                    <option value="Repair">Repair</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Cost</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={form.cost}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cost: e.target.value }))
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </div>

                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary flex-fill"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Create Record"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h6 className="section-title mb-0">
                  Maintenance History ({filtered.length})
                </h6>
                <div className="d-flex gap-2">
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
                  <input
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 140 }}
                  />
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={loadData}
                  >
                    <i className="bi bi-arrow-clockwise" />
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Cost</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-3">
                          Loading maintenance records...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-3 text-muted">
                          No maintenance records found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((record) => (
                        <tr key={record.id}>
                          <td>
                            {assetMap[record.asset_id] || record.asset_id}
                          </td>
                          <td>{record.maintenance_type}</td>
                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td>
                            {record.cost != null
                              ? `₹${Number(record.cost).toLocaleString()}`
                              : "-"}
                          </td>
                          <td>{record.remarks || "-"}</td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {record.status !== "Completed" &&
                                record.status !== "Cancelled" && (
                                  <select
                                    className="form-select form-select-sm"
                                    value={record.status}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        record,
                                        e.target.value
                                      )
                                    }
                                    style={{ width: 110 }}
                                  >
                                    <option value="Scheduled">
                                      Scheduled
                                    </option>
                                    <option value="In Progress">
                                      In Progress
                                    </option>
                                    <option value="Completed">
                                      Completed
                                    </option>
                                    <option value="Cancelled">
                                      Cancelled
                                    </option>
                                  </select>
                                )}
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(record)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil-square" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Maintenance;
