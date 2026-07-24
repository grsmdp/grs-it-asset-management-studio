import { useEffect, useState } from "react";
import {
  generateAssetCode,
  mapFormToAsset,
  saveAsset,
  updateAsset,
} from "../services/assetService";

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
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">{isEdit ? "Edit Asset" : "Add New Asset"}</h2>
          <small className="text-muted">
            {isEdit
              ? "Update asset details and assignment information"
              : "Register a new IT asset in the system"}
          </small>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="section-title mb-2">Asset Information</h6>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Asset Code</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.assetCode}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Asset Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="assetName"
                className="form-control form-control-sm"
                value={formData.assetName}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Category <span className="text-danger">*</span>
              </label>
              <select
                name="category"
                className="form-select form-select-sm"
                value={formData.category}
                onChange={handleChange}
                disabled={isEdit}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                className="form-control form-control-sm"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Model</label>
              <input
                type="text"
                name="model"
                className="form-control form-control-sm"
                value={formData.model}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                className="form-control form-control-sm"
                value={formData.serialNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-3" />
          <h6 className="section-title mb-2">Purchase Details</h6>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Vendor</label>
              <select
                name="vendor"
                className="form-select form-select-sm"
                value={formData.vendor}
                onChange={handleChange}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                className="form-control form-control-sm"
                value={formData.purchaseDate}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Purchase Cost</label>
              <input
                type="number"
                name="purchaseCost"
                className="form-control form-control-sm"
                value={formData.purchaseCost}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Warranty Expiry</label>
              <input
                type="date"
                name="warrantyExpiry"
                className="form-control form-control-sm"
                value={formData.warrantyExpiry}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-3" />
          <h6 className="section-title mb-2">Assignment</h6>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Department</label>
              <select
                name="department"
                className="form-select form-select-sm"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Location <span className="text-danger">*</span>
              </label>
              <select
                name="location"
                className="form-select form-select-sm"
                value={formData.location}
                onChange={handleChange}
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select form-select-sm"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Spare">Spare</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>
          </div>

          <hr className="my-3" />

          <label className="form-label">Remarks</label>
          <textarea
            rows="2"
            name="remarks"
            className="form-control form-control-sm"
            value={formData.remarks}
            onChange={handleChange}
          />

          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <i className="bi bi-save me-1" />
              {saving ? "Saving..." : isEdit ? "Update Asset" : "Save Asset"}
            </button>

            <button className="btn btn-sm btn-outline-secondary" onClick={handleClear}>
              {isEdit ? "Reset Changes" : "Clear Form"}
            </button>

            {setCurrentPage && (
              <button
                className="btn btn-sm btn-light"
                onClick={() => setCurrentPage("assets")}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetForm;
