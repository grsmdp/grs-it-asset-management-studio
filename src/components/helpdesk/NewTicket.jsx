import { useEffect, useState } from "react";
import {
  createTicket,
  generateTicketNumber,
  getTicketCategories,
  addTicketHistory,
} from "../../services/helpdeskService";
import { getAssets, loadMasterData } from "../../services/assetService";

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
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">New Helpdesk Ticket</h2>
          <small className="text-muted">
            Log a new IT support request
          </small>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setCurrentPage("allTickets")}
        >
          <i className="bi bi-arrow-left me-1" />
          All Tickets
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Problem Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.problem_title}
                    onChange={(e) => handleChange("problem_title", e.target.value)}
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Problem Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={form.problem_description}
                    onChange={(e) => handleChange("problem_description", e.target.value)}
                    placeholder="Detailed description including steps to reproduce, error messages, etc."
                  />
                </div>

                <div className="col-12">
                  <h6 className="section-title">Requester Information</h6>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Requested By *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.requested_by}
                    onChange={(e) => handleChange("requested_by", e.target.value)}
                    placeholder="Full name"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.requested_by_email}
                    onChange={(e) => handleChange("requested_by_email", e.target.value)}
                    placeholder="Email address"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.requested_by_phone}
                    onChange={(e) => handleChange("requested_by_phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={form.department_id}
                    onChange={(e) => handleChange("department_id", e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <select
                    className="form-select"
                    value={form.location_id}
                    onChange={(e) => handleChange("location_id", e.target.value)}
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.location_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <h6 className="section-title">Issue Details</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Asset (if applicable)</label>
                  <select
                    className="form-select"
                    value={form.asset_id}
                    onChange={(e) => handleChange("asset_id", e.target.value)}
                  >
                    <option value="">Select Asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{a.asset_code} - {a.asset_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category_id}
                    onChange={(e) => handleChange("category_id", e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={form.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Assign To</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.assigned_to}
                    onChange={(e) => handleChange("assigned_to", e.target.value)}
                    placeholder="Engineer / team name"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Assignment Type</label>
                  <select
                    className="form-select"
                    value={form.assigned_type}
                    onChange={(e) => handleChange("assigned_type", e.target.value)}
                  >
                    <option value="Internal">Internal IT Engineer</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Other">Other Team Member</option>
                  </select>
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Create Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="section-title">Guidelines</h6>
              <ul className="mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="mb-2">Provide a clear, concise problem title</li>
                <li className="mb-2">Include error messages and screenshots if possible</li>
                <li className="mb-2">Select the correct asset if it relates to a specific device</li>
                <li className="mb-2">Set priority based on business impact</li>
                <li className="mb-2">Critical issues will be escalated immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTicket;
