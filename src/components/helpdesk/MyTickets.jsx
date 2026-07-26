import { useEffect, useMemo, useState } from "react";
import { getTickets } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import TableCard from "@/components/layout/TableCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, RefreshCw, Eye, Pencil, User, Inbox } from "lucide-react";

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

  function getPriorityBadgeVariant(priority) {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "default";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "outline";
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case "Critical": return "text-red-600";
      case "High": return "text-orange-500";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  }

  if (!myEngineer && !editMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          pretitle="HELPDESK"
          title="My Tickets"
          accent="#6f42c1"
        />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="mb-3 text-slate-400">
            <User className="h-10 w-10" />
          </div>
          <h6 className="font-semibold text-slate-800">Set Your Engineer Name</h6>
          <p className="text-sm text-slate-500 mb-3">
            Enter your name to see tickets assigned to you
          </p>
          <div className="flex gap-2">
            <Input
              value={engineerInput}
              onChange={(e) => setEngineerInput(e.target.value)}
              placeholder="Your name"
              className="w-56"
              onKeyDown={(e) => e.key === "Enter" && saveEngineer()}
            />
            <Button size="sm" onClick={saveEngineer}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  const columns = [
    { label: "Ticket #" },
    { label: "Title" },
    { label: "Requested By" },
    { label: "Priority" },
    { label: "Status" },
    { label: "Created" },
    { label: "Actions", className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title="My Tickets"
        subtitle={
          <span className="inline-flex items-center gap-1">
            Assigned to: <strong className="text-slate-800">{myEngineer}</strong>
            <button
              className="text-slate-400 hover:text-slate-600 ml-1 inline-flex items-center"
              onClick={() => setEditMode(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {editMode && (
              <>
                <Input
                  value={engineerInput}
                  onChange={(e) => setEngineerInput(e.target.value)}
                  className="inline-block w-36 h-7 ml-2 text-sm"
                />
                <Button size="sm" className="ml-1" onClick={saveEngineer}>OK</Button>
              </>
            )}
          </span>
        }
        accent="#6f42c1"
      >
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setCurrentPage("newTicket")}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Ticket
        </Button>
        <Button variant="outline" size="sm" onClick={loadTickets}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </PageHeader>

      <FilterCard>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-44"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
            <SelectItem value="Vendor Support">Vendor Support</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </FilterCard>

      <TableCard
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No tickets assigned to you"
        emptyIcon={Inbox}
        renderRow={(t) => (
          <TableRow
            key={t.id}
            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
            onClick={() => { setViewingTicketId(t.id); setCurrentPage("ticketDetail"); }}
          >
            <TableCell className="font-semibold text-slate-800">{t.ticket_number}</TableCell>
            <TableCell className="max-w-[200px] truncate text-slate-600">{t.problem_title}</TableCell>
            <TableCell className="text-slate-600">{t.requested_by}</TableCell>
            <TableCell>
              <span className={getPriorityColor(t.priority)}>
                <Badge variant={getPriorityBadgeVariant(t.priority)}>{t.priority}</Badge>
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeClass(t.status)}>{t.status}</Badge>
            </TableCell>
            <TableCell className="text-slate-500 text-xs">
              {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setViewingTicketId(t.id); setCurrentPage("ticketDetail"); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}

export default MyTickets;
