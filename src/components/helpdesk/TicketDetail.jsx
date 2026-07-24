import { useEffect, useState } from "react";
import {
  getTicketById,
  updateTicket,
  getTicketComments,
  addTicketComment,
  getTicketPhotos,
  addTicketPhoto,
  getTicketHistory,
  addTicketHistory,
} from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";

function TicketDetail({ ticketId, setCurrentPage }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [commentText, setCommentText] = useState("");
  const [commentUser, setCommentUser] = useState(() => localStorage.getItem("hd_engineer") || "");
  const [photoForm, setPhotoForm] = useState({ photo_type: "Problem", file_name: "", file_url: "" });
  const [assignForm, setAssignForm] = useState({ assigned_to: "", assigned_type: "Internal" });
  const [costForm, setCostForm] = useState({ cost: "", spare_parts: "" });

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function loadTicket() {
    if (!ticketId) return;
    try {
      setLoading(true);
      const [t, c, p, h] = await Promise.all([
        getTicketById(ticketId),
        getTicketComments(ticketId),
        getTicketPhotos(ticketId),
        getTicketHistory(ticketId),
      ]);
      setTicket(t);
      setComments(c);
      setPhotos(p);
      setHistory(h);
      if (t) {
        setAssignForm({ assigned_to: t.assigned_to || "", assigned_type: t.assigned_type || "Internal" });
        setCostForm({ cost: t.cost ?? "", spare_parts: t.spare_parts || "" });
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getPriorityBadgeClass(priority) {
    switch (priority) {
      case "Critical": return "bg-danger";
      case "High": return "bg-warning text-dark";
      case "Medium": return "bg-info text-dark";
      case "Low": return "bg-secondary";
      default: return "bg-secondary";
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      const updates = { status: newStatus };
      if (newStatus === "Completed") updates.completed_at = new Date().toISOString();
      if (newStatus === "Closed") updates.closed_at = new Date().toISOString();
      await updateTicket(ticketId, updates);
      await addTicketHistory({
        ticket_id: ticketId,
        action: "Status Changed",
        description: `Status changed to ${newStatus}`,
        performed_by: commentUser || "System",
        old_value: ticket.status,
        new_value: newStatus,
      });
      loadTicket();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssign() {
    if (!assignForm.assigned_to.trim()) {
      alert("Engineer name is required.");
      return;
    }
    try {
      await updateTicket(ticketId, {
        assigned_to: assignForm.assigned_to.trim(),
        assigned_type: assignForm.assigned_type,
      });
      await addTicketHistory({
        ticket_id: ticketId,
        action: "Assigned",
        description: `Assigned to ${assignForm.assigned_to} (${assignForm.assigned_type})`,
        performed_by: commentUser || "System",
        old_value: ticket.assigned_to,
        new_value: assignForm.assigned_to,
      });
      loadTicket();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    if (!commentUser.trim()) {
      alert("Please set your name first.");
      return;
    }
    try {
      const now = new Date();
      await addTicketComment({
        ticket_id: ticketId,
        user_name: commentUser.trim(),
        comment: commentText.trim(),
        created_at: now.toISOString(),
      });
      await addTicketHistory({
        ticket_id: ticketId,
        action: "Comment Added",
        description: `Comment by ${commentUser}`,
        performed_by: commentUser,
      });
      setCommentText("");
      loadTicket();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddPhoto() {
    if (!photoForm.file_name.trim()) {
      alert("Photo name is required.");
      return;
    }
    try {
      await addTicketPhoto({
        ticket_id: ticketId,
        photo_type: photoForm.photo_type,
        file_url: photoForm.file_url || null,
        file_name: photoForm.file_name.trim(),
        uploaded_by: commentUser || "System",
      });
      await addTicketHistory({
        ticket_id: ticketId,
        action: "Photo Added",
        description: `${photoForm.photo_type} photo: ${photoForm.file_name}`,
        performed_by: commentUser || "System",
      });
      setPhotoForm({ photo_type: "Problem", file_name: "", file_url: "" });
      loadTicket();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveCost() {
    try {
      const updates = {};
      updates.cost = costForm.cost === "" ? null : Number(costForm.cost);
      updates.spare_parts = costForm.spare_parts.trim() || null;
      await updateTicket(ticketId, updates);
      await addTicketHistory({
        ticket_id: ticketId,
        action: "Cost Updated",
        description: `Cost: ${costForm.cost || "0"}, Parts: ${costForm.spare_parts || "None"}`,
        performed_by: commentUser || "System",
      });
      loadTicket();
      alert("Cost and spare parts saved.");
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="page-panel">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page-panel">
        <div className="text-center py-5 text-muted">Ticket not found</div>
      </div>
    );
  }

  const tabs = [
    { id: "info", label: "Info", icon: "bi-info-circle" },
    { id: "comments", label: `Comments (${comments.length})`, icon: "bi-chat-dots" },
    { id: "photos", label: `Photos (${photos.length})`, icon: "bi-image" },
    { id: "timeline", label: `Timeline (${history.length})`, icon: "bi-clock-history" },
  ];

  const engineerActions = [
    { label: "Accept", status: "Assigned", icon: "bi-person-check", color: "info" },
    { label: "Start Work", status: "In Progress", icon: "bi-play-circle", color: "warning" },
    { label: "Completed", status: "Completed", icon: "bi-check-circle", color: "success" },
    { label: "Close", status: "Closed", icon: "bi-archive", color: "secondary" },
  ];

  const photoTypeColors = {
    Problem: "danger",
    Progress: "warning",
    Completed: "success",
  };

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="mb-0">{ticket.ticket_number}</h2>
            <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>{ticket.status}</span>
            <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>{ticket.priority}</span>
          </div>
          <small className="text-muted">{ticket.problem_title}</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setCurrentPage("allTickets")}>
            <i className="bi bi-arrow-left me-1" />
            All Tickets
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={loadTicket}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bi ${tab.icon} me-1`} />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "info" && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title mb-3">Ticket Details</h6>
                <div className="row g-2" style={{ fontSize: "0.9rem" }}>
                  <div className="col-md-6">
                    <strong>Requested By:</strong> {ticket.requested_by}
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong> {ticket.requested_by_email || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong> {ticket.requested_by_phone || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Created:</strong> {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Category ID:</strong> {ticket.category_id || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Department ID:</strong> {ticket.department_id || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Location ID:</strong> {ticket.location_id || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Asset ID:</strong> {ticket.asset_id || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Cost:</strong> {ticket.cost != null ? `₹${Number(ticket.cost).toLocaleString()}` : "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Spare Parts:</strong> {ticket.spare_parts || "-"}
                  </div>
                  <div className="col-12">
                    <strong>Description:</strong>
                    <p className="mb-0 mt-1 text-muted">{ticket.problem_description || "No description provided."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="section-title mb-2">Quick Actions</h6>
                {ticket.status !== "Completed" && ticket.status !== "Closed" && ticket.status !== "Cancelled" && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {engineerActions.map((act) => (
                      <button
                        key={act.status}
                        className={`btn btn-sm btn-outline-${act.color}`}
                        onClick={() => handleStatusChange(act.status)}
                      >
                        <i className={`bi ${act.icon} me-1`} />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}

                <h6 className="section-title mb-2">Assignment</h6>
                <div className="row g-1 mb-2">
                  <div className="col-8">
                    <input
                      className="form-control form-control-sm"
                      value={assignForm.assigned_to}
                      onChange={(e) => setAssignForm((p) => ({ ...p, assigned_to: e.target.value }))}
                      placeholder="Engineer name"
                    />
                  </div>
                  <div className="col-4">
                    <button className="btn btn-sm btn-primary w-100" onClick={handleAssign}>Assign</button>
                  </div>
                  <div className="col-12 mt-1">
                    <select
                      className="form-select form-select-sm"
                      value={assignForm.assigned_type}
                      onChange={(e) => setAssignForm((p) => ({ ...p, assigned_type: e.target.value }))}
                    >
                      <option value="Internal">Internal IT</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h6 className="section-title mb-2">Cost & Parts</h6>
                <div className="row g-1">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={costForm.cost}
                      onChange={(e) => setCostForm((p) => ({ ...p, cost: e.target.value }))}
                      placeholder="Cost (₹)"
                    />
                  </div>
                  <div className="col-6">
                    <button className="btn btn-sm btn-outline-success w-100" onClick={handleSaveCost}>
                      Save
                    </button>
                  </div>
                  <div className="col-12 mt-1">
                    <input
                      className="form-control form-control-sm"
                      value={costForm.spare_parts}
                      onChange={(e) => setCostForm((p) => ({ ...p, spare_parts: e.target.value }))}
                      placeholder="Spare parts used"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title mb-2">Comments</h6>
                {comments.length === 0 ? (
                  <p className="text-muted small mb-0">No comments yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {comments.map((c) => (
                      <div key={c.id} className="border rounded p-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong style={{ fontSize: "0.85rem" }}>{c.user_name}</strong>
                          <small className="text-muted">
                            {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                          </small>
                        </div>
                        <p className="mb-0" style={{ fontSize: "0.9rem" }}>{c.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title mb-2">Add Comment</h6>
                <div className="mb-2">
                  <input
                    className="form-control form-control-sm"
                    value={commentUser}
                    onChange={(e) => setCommentUser(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <textarea
                  className="form-control form-control-sm mb-2"
                  rows="3"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment..."
                />
                <button className="btn btn-sm btn-primary w-100" onClick={handleAddComment}>
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "photos" && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title mb-2">Photos</h6>
                {photos.length === 0 ? (
                  <p className="text-muted small mb-0">No photos uploaded yet.</p>
                ) : (
                  <div className="row g-2">
                    {photos.map((ph) => (
                      <div className="col-md-4 col-6" key={ph.id}>
                        <div className="card h-100">
                          <div className="card-body p-2 text-center">
                            <i className="bi bi-image text-muted" style={{ fontSize: 30 }} />
                            <div className="mt-1" style={{ fontSize: "0.85rem" }}>
                              <strong>{ph.file_name}</strong>
                            </div>
                            <span className={`badge bg-${photoTypeColors[ph.photo_type] || "secondary"} mt-1`}>
                              {ph.photo_type}
                            </span>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {ph.uploaded_by} | {ph.created_at ? new Date(ph.created_at).toLocaleDateString() : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title mb-2">Upload Photo</h6>
                <div className="mb-2">
                  <label className="form-label">Photo Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={photoForm.photo_type}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, photo_type: e.target.value }))}
                  >
                    <option value="Problem">Problem</option>
                    <option value="Progress">Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">File Name</label>
                  <input
                    className="form-control form-control-sm"
                    value={photoForm.file_name}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, file_name: e.target.value }))}
                    placeholder="e.g., error_screenshot.png"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">URL (optional)</label>
                  <input
                    className="form-control form-control-sm"
                    value={photoForm.file_url}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, file_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <button className="btn btn-sm btn-primary w-100" onClick={handleAddPhoto}>
                  Add Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="section-title mb-3">Timeline</h6>
            {history.length === 0 ? (
              <p className="text-muted small mb-0">No history records.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {history.map((h) => (
                  <div key={h.id} className="d-flex gap-3 align-items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                        style={{ width: 32, height: 32, fontSize: 14 }}
                      >
                        <i className="bi bi-clock-history" />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong style={{ fontSize: "0.85rem" }}>{h.action}</strong>
                        <small className="text-muted">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : ""}
                        </small>
                      </div>
                      <p className="mb-0 text-muted" style={{ fontSize: "0.85rem" }}>{h.description}</p>
                      {(h.old_value || h.new_value) && (
                        <small className="text-muted">
                          {h.old_value && <span>From: {h.old_value}</span>}
                          {h.old_value && h.new_value && <span> &rarr; </span>}
                          {h.new_value && <span>To: {h.new_value}</span>}
                        </small>
                      )}
                      <div><small className="text-muted">By: {h.performed_by}</small></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
