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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import FormCard from "@/components/layout/FormCard";
import TableCard from "@/components/layout/TableCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Save, X, RefreshCw, Loader2, FolderOpen } from "lucide-react";

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

  const initialForm = { [config.nameField]: "", is_active: true };
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

    const payload = { [config.nameField]: nameValue, is_active: form.is_active };
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
    const formData = { [config.nameField]: record[config.nameField] || "", is_active: record.is_active ?? true };
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

  const columns = [
    { label: "#", width: "50px", className: "text-center" },
    { label: config.nameLabel },
    ...config.extraFields.map((f) => ({ label: f.label })),
    { label: "Active", width: "80px" },
    { label: "Actions", className: "text-right" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="SETTINGS"
        title={config.title}
        subtitle={config.subtitle}
        accent="#64748b"
      />

      <FilterCard>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[180px]"
        />
        <Button variant="outline" size="sm" onClick={loadRecords}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </FilterCard>

      <FormCard
        title={editingId ? "Edit Record" : "New Record"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`field-${config.nameField}`}>{config.nameLabel}</Label>
              <Input
                id={`field-${config.nameField}`}
                value={form[config.nameField]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [config.nameField]: e.target.value }))
                }
                placeholder={`Enter ${config.nameLabel.toLowerCase()}`}
              />
            </div>

            {config.extraFields.map((field) => (
              <div className="space-y-2" key={field.key}>
                <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                <Input
                  id={`field-${field.key}`}
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="flex items-end">
              <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
                <Label htmlFor="field-is_active" className="text-sm cursor-pointer text-slate-700">
                  Active
                </Label>
                <Switch
                  id="field-is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="mr-1 h-4 w-4" />
              ) : null}
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </FormCard>

      <TableCard
        title="Records"
        count={filtered.length}
        columns={columns}
        data={filtered}
        emptyMessage="No records found"
        emptyIcon={FolderOpen}
        renderRow={(record, idx) => (
          <TableRow key={record.id} className="hover:bg-slate-50/50">
            <TableCell className="text-center text-slate-500">{idx + 1}</TableCell>
            <TableCell className="font-medium">{record[config.nameField]}</TableCell>
            {config.extraFields.map((f) => (
              <TableCell key={f.key}>{record[f.key] || "-"}</TableCell>
            ))}
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                record.is_active !== false
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {record.is_active !== false ? "Yes" : "No"}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-amber-600"
                  onClick={() => handleEdit(record)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => handleDelete(record.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}

export default Masters;
