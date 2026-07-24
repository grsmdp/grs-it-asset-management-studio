import { useEffect, useState } from "react";
import {
  getAssetById,
  loadMasterData,
  mapAssetToForm,
} from "../services/assetService";
import AssetForm from "./AssetForm";

function EditAsset({ assetId, setCurrentPage }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [assetId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [masters, asset] = await Promise.all([
        loadMasterData(),
        getAssetById(assetId),
      ]);

      setCategories(masters.categories);
      setLocations(masters.locations);
      setDepartments(masters.departments);
      setVendors(masters.vendors);
      setInitialData(mapAssetToForm(asset));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-panel">
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-outline-primary"
          onClick={() => setCurrentPage("assets")}
        >
          Back to Assets
        </button>
      </div>
    );
  }

  return (
    <AssetForm
      mode="edit"
      assetId={assetId}
      initialData={initialData}
      categories={categories}
      locations={locations}
      departments={departments}
      vendors={vendors}
      setCurrentPage={setCurrentPage}
      onSaved={() => setCurrentPage("assets")}
    />
  );
}

export default EditAsset;
