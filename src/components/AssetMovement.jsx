import { useEffect, useMemo, useState } from "react";
import {
  createMovement,
  getAssets,
  getMovements,
  loadMasterData,
  updateAsset,
} from "../services/assetService";

function AssetMovement({ setCurrentPage }) {
  const [movements, setMovements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    asset_id: "",
    from_location_id: "",
    to_location_id: "",
    movement_date: new Date().toISOString().slice(0, 10),
    reason: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [movementData, assetData, masterData] = await Promise.all([
        getMovements(),
        getAssets(),
        loadMasterData(),
      ]);
      setMovements(movementData);
      setAssets(assetData);
      setLocations(masterData.locations);
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

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l.location_name])),
    [locations]
  );

  function handleAssetChange(assetId) {
    const selected = assets.find((a) => String(a.id) === String(assetId));
    setForm((prev) => ({
      ...prev,
      asset_id: assetId,
      from_location_id: selected
        ? String(selected.current_location_id || selected.location_id || "")
        : "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.asset_id || !form.movement_date) {
      alert("Please select an asset and movement date.");
      return;
    }

    if (!form.to_location_id) {
      alert("Destination location is required.");
      return;
    }

    if (form.from_location_id && form.from_location_id === form.to_location_id) {
      alert("Destination must be different from the current location.");
      return;
    }

    try {
      setSaving(true);

      await createMovement({
        asset_id: Number(form.asset_id),
        from_location_id: form.from_location_id
          ? Number(form.from_location_id)
          : null,
        to_location_id: Number(form.to_location_id),
        movement_date: form.movement_date,
        reason: form.reason || null,
        remarks: form.remarks || null,
      });

      if (form.to_location_id) {
        await updateAsset(Number(form.asset_id), {
          current_location_id: Number(form.to_location_id),
        });
      }

      alert("Asset movement recorded successfully.");

      setForm({
        asset_id: "",
        from_location_id: "",
        to_location_id: "",
        movement_date: new Date().toISOString().slice(0, 10),
        reason: "",
        remarks: "",
      });

      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = movements.filter((m) => {
    if (search) {
      const term = search.toLowerCase();
      const assetLabel = assetMap[m.asset_id] || "";
      const fromLoc = locationMap[m.from_location_id] || "";
      const toLoc = locationMap[m.to_location_id] || "";
      const haystack = `${assetLabel} ${fromLoc} ${toLoc} ${m.reason || ""} ${m.remarks || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">Asset Movement</h2>
          <small className="text-muted">
            Transfer assets between locations and track movement history
          </small>
        </div>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => setCurrentPage("assets")}
        >
          View Assets
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title">Record Movement</h6>

              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-12">
                  <label className="form-label">Asset</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.asset_id}
                    onChange={(e) => handleAssetChange(e.target.value)}
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
                  <label className="form-label">From Location</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.from_location_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        from_location_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Current / Unknown</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">To Location</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.to_location_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        to_location_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Destination</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Movement Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.movement_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        movement_date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Reason</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Transfer reason"
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

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary w-100"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Record Movement"}
                  </button>
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
                  Movement History ({filtered.length})
                </h6>
                <div className="d-flex gap-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 160 }}
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
                      <th>Date</th>
                      <th>Asset</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-3">
                          Loading movements...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-3 text-muted">
                          No movement records found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((movement) => (
                        <tr key={movement.id}>
                          <td>{movement.movement_date || "-"}</td>
                          <td>
                            {assetMap[movement.asset_id] ||
                              movement.asset_id}
                          </td>
                          <td>
                            {locationMap[movement.from_location_id] || "-"}
                          </td>
                          <td>
                            {locationMap[movement.to_location_id] || "-"}
                          </td>
                          <td>
                            {movement.reason || movement.remarks || "-"}
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

export default AssetMovement;
