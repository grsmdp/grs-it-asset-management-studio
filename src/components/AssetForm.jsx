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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
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
  subcategories = [],
  locations,
  departments,
  vendors,
  onSaved,
  setCurrentPage,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === "edit";

  const filteredSubcategories = subcategories.filter(
    (s) =>
      String(s.category_id) === String(formData.category) &&
      s.is_active !== false
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  async function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSelectChange(name, value) {
    if (name === "category") {
      if (!isEdit) {
        const code = await generateAssetCode(value);
        setFormData((prev) => ({
          ...prev,
          category: value,
          subCategory: "",
          assetCode: code,
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: "",
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
    <div className="space-y-5">
      <PageHeader
        pretitle="INVENTORY"
        title={isEdit ? "Edit Asset" : "Add New Asset"}
        subtitle={
          isEdit
            ? "Update asset details and assignment information"
            : "Register a new IT asset in the system"
        }
        accent="#20c997"
      />

      <FormCard
        title="Asset Information"
        subtitle="Basic details, purchase info, and assignment"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Asset Details
            </h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Asset Code</Label>
                <Input
                  type="text"
                  value={formData.assetCode}
                  readOnly
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">
                  Asset Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                  placeholder="Enter asset name"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">
                  Category <span className="text-red-500">*</span>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">
                  Sub Category
                </Label>
                <Select
                  value={formData.subCategory ? String(formData.subCategory) : "__none__"}
                  onValueChange={(v) =>
                    handleSelectChange("subCategory", v === "__none__" ? "" : v)
                  }
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.category
                          ? filteredSubcategories.length
                            ? "Select Sub Category"
                            : "No sub categories for this category"
                          : "Select category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {filteredSubcategories.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.subcategory_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category && filteredSubcategories.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    Add types under Settings → Sub Categories (e.g. Dome, Bullet, Laser).
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Brand</Label>
                <Input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Dell, HP, Lenovo"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Model</Label>
                <Input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. Latitude 5520"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Serial Number</Label>
                <Input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Enter serial number"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Purchase Details
            </h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Vendor</Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Purchase Date</Label>
                <Input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Purchase Cost</Label>
                <Input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Warranty Expiry</Label>
                <Input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Assignment
            </h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Department</Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">
                  Location <span className="text-red-500">*</span>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Status</Label>
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

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Additional Notes
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Remarks</Label>
              <Textarea
                rows={3}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Any additional notes about this asset..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : isEdit ? "Update Asset" : "Save Asset"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleClear}>
              {isEdit ? "Reset Changes" : "Clear Form"}
            </Button>

            {setCurrentPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage("assets")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </FormCard>
    </div>
  );
}

export default AssetForm;
