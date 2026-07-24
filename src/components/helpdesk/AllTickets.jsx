import { useEffect, useMemo, useState } from "react";
import { getTickets, updateTicket } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";

const STATUSES = ["", "Open", "Assigned", "In Progress", "Waiting for Parts", "Vendor Support", "Completed", "Closed", "Cancelled"];
const PRIORITIES = ["", "Low", "Medium", "High", "Critical"];

function AllTickets({ setCurrentPage, setViewingTicketId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${t.ticket_number} ${t.problem_title} ${t.requested_by} ${t.assigned_to || ""} ${t.problem_description || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPageNum - 1) * PAGE_SIZE, currentPageNum * PAGE_SIZE);

  function handleView(id) {
    setViewingTicketId(id);
    setCurrentPage("ticketDetail");
  }

  async function handleQuickStatusChange(id, newStatus) {
    try {
      const updates = { status: newStatus };
      if (newStatus === "Completed") updates.completed_at = new Date().toISOString();
      if (newStatus === "Closed") updates.closed_at = new Date().toISOString();
      await updateTicket(id, updates);
      loadTickets();
    } catch (err) {
      alert(err.message);
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

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">All Tickets</h2>
          <small className="text-muted">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} found
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-primary" onClick={() => setCurrentPage("newTicket")}>
            <i className="bi bi-plus-circle me-1" />
            New Ticket
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={loadTickets}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 mb-2 flex-wrap">
            <input
              className="form-control form-control-sm"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPageNum(1); }}
              style={{ width: 200 }}
            />
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPageNum(1); }}
              style={{ width: 140 }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s || "All Status"}</option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPageNum(1); }}
              style={{ width: 130 }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p || "All Priority"}</option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket #</th>
                  <th>Title</th>
                  <th>Requested By</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-3">Loading tickets...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-3 text-muted">No tickets found</td></tr>
                ) : (
                  paginated.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-semibold">{t.ticket_number}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.problem_title}
                      </td>
                      <td>{t.requested_by}</td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{t.assigned_to || <span className="text-muted">Unassigned</span>}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleView(t.id)}
                            title="View Details"
                          >
                            <i className="bi bi-eye" />
                          </button>
                          {t.status !== "Completed" && t.status !== "Closed" && t.status !== "Cancelled" && (
                            <select
                              className="form-select form-select-sm"
                              value={t.status}
                              onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                              style={{ width: 110 }}
                            >
                              <option value="Open">Open</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Waiting for Parts">W. Parts</option>
                              <option value="Vendor Support">Vendor</option>
                              <option value="Completed">Completed</option>
                              <option value="Closed">Closed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <span className="pagination-info">
                Page {currentPageNum} of {totalPages}
              </span>
              <div className="pagination-controls">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum(1)}
                >
                  <i className="bi bi-chevron-double-left" />
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <span className="px-2" style={{ fontSize: 12 }}>{currentPageNum}/{totalPages}</span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum((p) => p + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum(totalPages)}
                >
                  <i className="bi bi-chevron-double-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllTickets;
