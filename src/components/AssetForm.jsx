import { useEffect, useState } from "react";
import {
  generateAssetCode,
  mapFormToAsset,
  saveAsset,
  updateAsset,
} from "../services/assetService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Save, ArrowLeft } from "lucide-react";

const emptyForm = {
  assetCode: "Auto Generate",
  assetName: "",
  category: "",
  subCategory: "",
  brand: "",
  model: "",
  serialNumber: "",
  vendor: "",
  purchaseDate: "",
  purchaseCost: "",
  warrantyExpiry: "",
  department: "",
  location: "",
  status: "Active",
  remarks: "",
};

function AssetForm({
  mode = "add",
  assetId,
  initialData,
  categories,
  locations,
  departments,
  vendors,
  onSaved,
  setCurrentPage,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  async function handleChange(e) {
    const { name, value } = e.target;

    if (name === "category" && !isEdit) {
      const code = await generateAssetCode(value);

      setFormData((prev) => ({
        ...prev,
        category: value,
        assetCode: code,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSelectChange(name, value) {
    if (name === "category" && !isEdit) {
      const code = await generateAssetCode(value);

      setFormData((prev) => ({
        ...prev,
        category: value,
        assetCode: code,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    try {
      if (!formData.assetName || !formData.category || !formData.location) {
        alert("Please fill all mandatory fields.");
        return;
      }

      setSaving(true);
      const payload = mapFormToAsset(formData);

      if (isEdit) {
        await updateAsset(assetId, payload);
        alert("Asset updated successfully.");
      } else {
        await saveAsset(payload);
        alert("Asset saved successfully.");
        setFormData(emptyForm);
      }

      if (onSaved) {
        onSaved();
      } else if (setCurrentPage) {
        setCurrentPage("assets");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    if (isEdit && initialData) {
      setFormData(initialData);
      return;
    }

    setFormData(emptyForm);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Asset" : "Add New Asset"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update asset details and assignment information"
              : "Register a new IT asset in the system"}
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Asset Information</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Asset Code</Label>
                <Input
                  type="text"
                  value={formData.assetCode}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Asset Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                  <Select
                    value={formData.category ? String(formData.category) : ""}
                    onValueChange={(v) => handleSelectChange("category", v)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Purchase Details</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select
                  value={formData.vendor ? String(formData.vendor) : ""}
                  onValueChange={(v) => handleSelectChange("vendor", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Cost</Label>
                <Input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Warranty Expiry</Label>
                <Input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assignment</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department ? String(formData.department) : ""}
                  onValueChange={(v) => handleSelectChange("department", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.location ? String(formData.location) : ""}
                  onValueChange={(v) => handleSelectChange("location", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleSelectChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Spare">Spare</SelectItem>
                    <SelectItem value="Under Repair">Under Repair</SelectItem>
                    <SelectItem value="Scrapped">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              rows={2}
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : isEdit ? "Update Asset" : "Save Asset"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleClear}>
              {isEdit ? "Reset Changes" : "Clear Form"}
            </Button>

            {setCurrentPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage("assets")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssetForm;
