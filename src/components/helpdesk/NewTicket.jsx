import { useEffect, useState } from "react";
import {
  createTicket,
  generateTicketNumber,
  getTicketCategories,
  addTicketHistory,
} from "../../services/helpdeskService";
import { getAssets, loadMasterData } from "../../services/assetService";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

function NewTicket({ setCurrentPage, setViewingTicketId }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    problem_title: "",
    problem_description: "",
    requested_by: "",
    requested_by_email: "",
    requested_by_phone: "",
    department_id: "",
    location_id: "",
    asset_id: "",
    category_id: "",
    priority: "Medium",
    assigned_to: "",
    assigned_type: "Internal",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [assetData, catData, masterData] = await Promise.all([
        getAssets(),
        getTicketCategories(),
        loadMasterData(),
      ]);
      setAssets(assetData);
      setCategories(catData);
      setDepartments(masterData.departments);
      setLocations(masterData.locations);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.problem_title.trim()) {
      alert("Problem title is required.");
      return;
    }
    if (!form.requested_by.trim()) {
      alert("Requested by is required.");
      return;
    }

    try {
      setSaving(true);
      const ticketNumber = await generateTicketNumber();
      const now = new Date().toISOString();

      const ticket = {
        ticket_number: ticketNumber,
        status: "Open",
        priority: form.priority,
        problem_title: form.problem_title.trim(),
        problem_description: form.problem_description.trim() || null,
        requested_by: form.requested_by.trim(),
        requested_by_email: form.requested_by_email.trim() || null,
        requested_by_phone: form.requested_by_phone.trim() || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        location_id: form.location_id ? Number(form.location_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        assigned_to: form.assigned_to.trim() || null,
        assigned_type: form.assigned_to.trim() ? form.assigned_type : null,
        created_at: now,
        updated_at: now,
      };

      const result = await createTicket(ticket);

      if (result && result[0]) {
        await addTicketHistory({
          ticket_id: result[0].id,
          action: "Ticket Created",
          description: `Ticket ${ticketNumber} created by ${form.requested_by}`,
          performed_by: form.requested_by,
        });
      }

      alert(`Ticket ${ticketNumber} created successfully.`);

      if (form.assigned_to.trim() && result && result[0]) {
        await addTicketHistory({
          ticket_id: result[0].id,
          action: "Assigned",
          description: `Assigned to ${form.assigned_to} (${form.assigned_type})`,
          performed_by: "System",
          new_value: form.assigned_to,
        });
      }

      if (result && result[0]) {
        setViewingTicketId(result[0].id);
        setCurrentPage("ticketDetail");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title="New Helpdesk Ticket"
        subtitle="Log a new IT support request"
        accent="#6f42c1"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage("allTickets")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          All Tickets
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4">
        <h6 className="text-sm font-semibold text-slate-700 mb-2">Guidelines</h6>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
          <li>Provide a clear, concise problem title</li>
          <li>Include error messages and screenshots if possible</li>
          <li>Select the correct asset if it relates to a specific device</li>
          <li>Set priority based on business impact</li>
          <li>Critical issues will be escalated immediately</li>
        </ul>
      </div>

      <FormCard title="Ticket Details" subtitle="Fill in the form to create a new support ticket">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Problem Title *</Label>
              <Input
                value={form.problem_title}
                onChange={(e) => handleChange("problem_title", e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Problem Description</Label>
              <Textarea
                rows={4}
                value={form.problem_description}
                onChange={(e) => handleChange("problem_description", e.target.value)}
                placeholder="Detailed description including steps to reproduce, error messages, etc."
              />
            </div>
          </div>

          <h6 className="text-sm font-semibold text-slate-700">Requester Information</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Requested By *</Label>
              <Input
                value={form.requested_by}
                onChange={(e) => handleChange("requested_by", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.requested_by_email}
                onChange={(e) => handleChange("requested_by_email", e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.requested_by_phone}
                onChange={(e) => handleChange("requested_by_phone", e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={(v) => handleChange("department_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={form.location_id} onValueChange={(v) => handleChange("location_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.location_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <h6 className="text-sm font-semibold text-slate-700">Issue Details</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Asset (if applicable)</Label>
              <Select value={form.asset_id} onValueChange={(v) => handleChange("asset_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.asset_code} - {a.asset_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => handleChange("category_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.category_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Input
                value={form.assigned_to}
                onChange={(e) => handleChange("assigned_to", e.target.value)}
                placeholder="Engineer / team name"
              />
            </div>
            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <Select value={form.assigned_type} onValueChange={(v) => handleChange("assigned_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal IT Engineer</SelectItem>
                  <SelectItem value="Vendor">Vendor</SelectItem>
                  <SelectItem value="Other">Other Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}

export default NewTicket;
