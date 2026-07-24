import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../services/assetService";

const MASTER_CONFIG = {
  categories: {
    title: "Category Management",
    subtitle: "Manage asset categories and code prefixes",
    fetchFn: getCategories,
    createFn: createCategory,
    updateFn: updateCategory,
    deleteFn: deleteCategory,
    nameLabel: "Category Name",
    nameField: "category_name",
    extraFields: [
      { key: "code_prefix", label: "Code Prefix", type: "text", placeholder: "e.g. LAP, DSK" },
    ],
  },
  departments: {
    title: "Department Management",
    subtitle: "Manage organizational departments",
    fetchFn: getDepartments,
    createFn: createDepartment,
    updateFn: updateDepartment,
    deleteFn: deleteDepartment,
    nameLabel: "Department Name",
    nameField: "department_name",
    extraFields: [],
  },
  vendors: {
    title: "Vendor Management",
    subtitle: "Manage IT vendors and suppliers",
    fetchFn: getVendors,
    createFn: createVendor,
    updateFn: updateVendor,
    deleteFn: deleteVendor,
    nameLabel: "Vendor Name",
    nameField: "vendor_name",
    extraFields: [
      { key: "contact_person", label: "Contact Person", type: "text", placeholder: "Primary contact name" },
      { key: "phone", label: "Phone", type: "text", placeholder: "Phone number" },
      { key: "email", label: "Email", type: "email", placeholder: "vendor@example.com" },
      { key: "gst_number", label: "GST Number", type: "text", placeholder: "GSTIN" },
    ],
  },
  locations: {
    title: "Location Management",
    subtitle: "Manage asset locations and sites",
    fetchFn: getLocations,
    createFn: createLocation,
    updateFn: updateLocation,
    deleteFn: deleteLocation,
    nameLabel: "Location Name",
    nameField: "location_name",
    extraFields: [
      { key: "location_type", label: "Location Type", type: "text", placeholder: "e.g. Office, Warehouse" },
      { key: "area_name", label: "Area Name", type: "text", placeholder: "Area or zone" },
      { key: "park_region", label: "Park / Region", type: "text", placeholder: "Park or region name" },
    ],
  },
};

function Masters({ masterType }) {
  const config = MASTER_CONFIG[masterType];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const initialForm = { [config.nameField]: "" };
  config.extraFields.forEach((f) => { initialForm[f.key] = ""; });
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadRecords();
  }, [masterType]);

  async function loadRecords() {
    try {
      setLoading(true);
      const data = await config.fetchFn();
      setRecords(data || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...initialForm });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nameValue = form[config.nameField]?.trim();
    if (!nameValue) {
      alert(`Please enter the ${config.nameLabel}.`);
      return;
    }

    const payload = { [config.nameField]: nameValue };
    config.extraFields.forEach((f) => {
      payload[f.key] = form[f.key]?.trim() || null;
    });

    try {
      setSaving(true);
      if (editingId) {
        await config.updateFn(editingId, payload);
        alert(`${config.title.split(" ")[0]} updated successfully.`);
      } else {
        await config.createFn(payload);
        alert(`${config.title.split(" ")[0]} created successfully.`);
      }
      resetForm();
      loadRecords();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record) {
    setEditingId(record.id);
    const formData = { [config.nameField]: record[config.nameField] || "" };
    config.extraFields.forEach((f) => {
      formData[f.key] = record[f.key] || "";
    });
    setForm(formData);
  }

  async function handleDelete(id) {
    if (!window.confirm(`Are you sure you want to delete this record?`)) return;
    try {
      await config.deleteFn(id);
      alert("Record deleted successfully.");
      loadRecords();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const filtered = records.filter((r) => {
    const name = r[config.nameField] || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">{config.title}</h2>
          <small className="text-muted">{config.subtitle}</small>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title mb-2">
                {editingId ? "Edit Record" : "Add New Record"}
              </h6>

              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-12">
                  <label className="form-label">{config.nameLabel}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form[config.nameField]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [config.nameField]: e.target.value }))
                    }
                    placeholder={`Enter ${config.nameLabel.toLowerCase()}`}
                  />
                </div>

                {config.extraFields.map((field) => (
                  <div className="col-12" key={field.key}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type={field.type}
                      className="form-control form-control-sm"
                      value={form[field.key]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary flex-fill"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Add"}
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="section-title mb-0">
                  Records ({filtered.length})
                </h6>
                <div className="d-flex gap-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 160 }}
                  />
                  <button className="btn btn-sm btn-outline-success" onClick={loadRecords}>
                    <i className="bi bi-arrow-clockwise" />
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>{config.nameLabel}</th>
                      {config.extraFields.map((f) => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={2 + config.extraFields.length + 1}
                          className="text-center py-3"
                        >
                          Loading records...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2 + config.extraFields.length + 1}
                          className="text-center py-3 text-muted"
                        >
                          No records found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((record, idx) => (
                        <tr key={record.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-semibold">{record[config.nameField]}</td>
                          {config.extraFields.map((f) => (
                            <td key={f.key}>{record[f.key] || "-"}</td>
                          ))}
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => handleEdit(record)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil-square" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(record.id)}
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
        </div>
      </div>
    </div>
  );
}

export default Masters;
