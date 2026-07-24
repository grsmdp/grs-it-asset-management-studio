import { useEffect, useMemo, useState } from "react";
import { deleteAsset, getAssets, loadMasterData } from "../services/assetService";
import { getStatusBadgeClass } from "../utils/statusBadge";

function Assets({ setCurrentPage, onEditAsset }) {
  const [assets, setAssets] = useState([]);
  const [masters, setMasters] = useState({
    categories: [],
    locations: [],
    departments: [],
    vendors: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);

    try {
      const [assetData, masterData] = await Promise.all([
        getAssets(),
        loadMasterData(),
      ]);

      setAssets(assetData || []);
      setMasters(masterData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmDelete) return;

    try {
      await deleteAsset(id);
      alert("Asset deleted successfully.");
      loadAssets();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const lookupMaps = useMemo(
    () => ({
      categories: Object.fromEntries(
        masters.categories.map((item) => [item.id, item.category_name])
      ),
      locations: Object.fromEntries(
        masters.locations.map((item) => [item.id, item.location_name])
      ),
      departments: Object.fromEntries(
        masters.departments.map((item) => [item.id, item.department_name])
      ),
    }),
    [masters]
  );

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = `${asset.asset_code || ""} ${asset.asset_name || ""} ${asset.brand || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter ? asset.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">IT Asset Register</h2>
          <small className="text-muted">
            Total Assets: <b>{filteredAssets.length}</b>
          </small>
        </div>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => setCurrentPage("addAsset")}
        >
          <i className="bi bi-plus-lg me-1" />
          Add Asset
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <input
                className="form-control form-control-sm"
                placeholder="Search asset code, name, or brand"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Spare">Spare</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>

            <div className="col-md-2">
              <button className="btn btn-sm btn-success w-100" onClick={loadAssets}>
                <i className="bi bi-arrow-clockwise me-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
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
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    Loading assets...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    No assets found
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="fw-semibold">{asset.asset_code}</td>
                    <td>{asset.asset_name}</td>
                    <td>
                      {lookupMaps.categories[asset.category_id] || "-"}
                    </td>
                    <td>
                      {lookupMaps.locations[
                        asset.current_location_id || asset.location_id
                      ] || "-"}
                    </td>
                    <td>
                      {lookupMaps.departments[asset.department_id] || "-"}
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusBadgeClass(asset.status)}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-warning me-1"
                        onClick={() => onEditAsset(asset.id)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(asset.id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Assets;
