import { useEffect, useState } from "react";
import {
  getAssetById,
  loadMasterData,
  mapAssetToForm,
} from "../services/assetService";
import AssetForm from "./AssetForm";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";

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
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage("assets")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Assets
        </Button>
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
