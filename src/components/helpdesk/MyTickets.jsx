import { useEffect, useMemo, useState } from "react";
import { getTickets } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";

function MyTickets({ setCurrentPage, setViewingTicketId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myEngineer, setMyEngineer] = useState(() => localStorage.getItem("hd_engineer") || "");
  const [editMode, setEditMode] = useState(false);
  const [engineerInput, setEngineerInput] = useState(myEngineer);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadTickets();
  }, [myEngineer]);

  async function loadTickets() {
    if (!myEngineer) {
      setTickets([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getTickets();
      const my = data.filter((t) => t.assigned_to === myEngineer);
      setTickets(my);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function saveEngineer() {
    const val = engineerInput.trim();
    setMyEngineer(val);
    localStorage.setItem("hd_engineer", val);
    setEditMode(false);
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${t.ticket_number} ${t.problem_title} ${t.requested_by}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter]);

  function getPriorityBadgeClass(priority) {
    switch (priority) {
      case "Critical": return "bg-danger";
      case "High": return "bg-warning text-dark";
      case "Medium": return "bg-info text-dark";
      case "Low": return "bg-secondary";
      default: return "bg-secondary";
    }
  }

  if (!myEngineer && !editMode) {
    return (
      <div className="page-panel">
        <div className="page-panel-header">
          <div>
            <h2 className="mb-0">My Tickets</h2>
            <small className="text-muted">Tickets assigned to you</small>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="mb-3" style={{ fontSize: 40 }}>
              <i className="bi bi-person-badge text-muted" />
            </div>
            <h6>Set Your Engineer Name</h6>
            <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
              Enter your name to see tickets assigned to you
            </p>
            <div className="d-flex justify-content-center gap-2">
              <input
                className="form-control form-control-sm"
                value={engineerInput}
                onChange={(e) => setEngineerInput(e.target.value)}
                placeholder="Your name"
                style={{ width: 220 }}
                onKeyDown={(e) => e.key === "Enter" && saveEngineer()}
              />
              <button className="btn btn-sm btn-primary" onClick={saveEngineer}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <h2 className="mb-0">My Tickets</h2>
          <small className="text-muted">
            Assigned to: <strong>{myEngineer}</strong>{" "}
            <button
              className="btn btn-sm btn-link p-0 ms-1"
              onClick={() => setEditMode(true)}
            >
              <i className="bi bi-pencil-square" />
            </button>
            {editMode && (
              <>
                <input
                  className="form-control form-control-sm d-inline-block ms-2"
                  value={engineerInput}
                  onChange={(e) => setEngineerInput(e.target.value)}
                  style={{ width: 150 }}
                />
                <button className="btn btn-sm btn-primary ms-1" onClick={saveEngineer}>OK</button>
              </>
            )}
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 180 }}
            />
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Vendor Support">Vendor Support</option>
              <option value="Completed">Completed</option>
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
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-3">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-3 text-muted">No tickets assigned to you</td></tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-semibold">{t.ticket_number}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.problem_title}
                      </td>
                      <td>{t.requested_by}</td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>{t.priority}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(t.status)}`}>{t.status}</span>
                      </td>
                      <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => { setViewingTicketId(t.id); setCurrentPage("ticketDetail"); }}
                        >
                          <i className="bi bi-eye" />
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
  );
}

export default MyTickets;
