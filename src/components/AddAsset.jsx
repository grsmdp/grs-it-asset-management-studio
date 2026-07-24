import { useEffect, useState } from "react";
import { loadMasterData } from "../services/assetService";
import AssetForm from "./AssetForm";

function AddAsset({ setCurrentPage }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMasters();
  }, []);

  async function loadMasters() {
    try {
      setLoading(true);
      const masters = await loadMasterData();
      setCategories(masters.categories);
      setLocations(masters.locations);
      setDepartments(masters.departments);
      setVendors(masters.vendors);
    } catch (err) {
      console.error("Error loading master data:", err);
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
          <p className="mt-3 text-muted">Loading master data...</p>
        </div>
      </div>
    );
  }

  return (
    <AssetForm
      categories={categories}
      locations={locations}
      departments={departments}
      vendors={vendors}
      setCurrentPage={setCurrentPage}
      onSaved={() => setCurrentPage("assets")}
    />
  );
}

export default AddAsset;
