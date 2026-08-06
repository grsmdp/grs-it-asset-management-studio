import { useEffect, useState } from "react";
import { loadMasterData } from "../services/assetService";
import AssetForm from "./AssetForm";
import { Loader2 } from "lucide-react";

function AddAsset({ setCurrentPage }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
      setSubcategories(masters.subcategories || []);
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
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">Loading master data...</p>
      </div>
    );
  }

  return (
    <AssetForm
      categories={categories}
      subcategories={subcategories}
      locations={locations}
      departments={departments}
      vendors={vendors}
      setCurrentPage={setCurrentPage}
      onSaved={() => setCurrentPage("assets")}
    />
  );
}

export default AddAsset;
