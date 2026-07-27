import { useEffect, useMemo, useState } from "react";
import { getTickets, updateTicket } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";
import PageHeader from "@/components/layout/PageHeader";
import FilterCard from "@/components/layout/FilterCard";
import TableCard from "@/components/layout/TableCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, RefreshCw, Eye, Inbox } from "lucide-react";

const STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts", "Vendor Support", "Completed", "Closed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

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

  function getPageNumbers() {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  const columns = [
    { label: "Ticket #" },
    { label: "Title" },
    { label: "Priority" },
    { label: "Status" },
    { label: "Requested By" },
    { label: "Assigned To" },
    { label: "Created" },
    { label: "Actions", className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title="All Tickets"
        subtitle={`${filtered.length} ticket${filtered.length !== 1 ? "s" : ""} found`}
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
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPageNum(1); }}
          className="w-48"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPageNum(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPageNum(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCard>

      <TableCard
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="No tickets found"
        emptyIcon={Inbox}
        renderRow={(t) => (
          <TableRow
            key={t.id}
            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
            onClick={() => handleView(t.id)}
          >
            <TableCell className="font-semibold text-slate-800">{t.ticket_number}</TableCell>
            <TableCell className="max-w-[200px] truncate text-slate-600">{t.problem_title}</TableCell>
            <TableCell>
              <span className={getPriorityColor(t.priority)}>
                <Badge variant={getPriorityBadgeVariant(t.priority)}>
                  {t.priority}
                </Badge>
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeClass(t.status)}>{t.status}</Badge>
            </TableCell>
            <TableCell className="text-slate-600">{t.requested_by}</TableCell>
            <TableCell className="text-slate-600">{t.assigned_to || <span className="text-slate-400">Unassigned</span>}</TableCell>
            <TableCell className="text-slate-500 text-xs">
              {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(t.id)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {t.status !== "Completed" && t.status !== "Closed" && t.status !== "Cancelled" && (
                  <Select value={t.status} onValueChange={(v) => handleQuickStatusChange(t.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Waiting for Parts">W. Parts</SelectItem>
                      <SelectItem value="Vendor Support">Vendor</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
        pagination={
          totalPages > 1
            ? {
                from: (currentPageNum - 1) * PAGE_SIZE + 1,
                to: Math.min(currentPageNum * PAGE_SIZE, filtered.length),
                total: filtered.length,
                current: currentPageNum,
                pages: getPageNumbers(),
                hasPrev: currentPageNum > 1,
                hasNext: currentPageNum < totalPages,
                onPrev: () => setCurrentPageNum((p) => p - 1),
                onNext: () => setCurrentPageNum((p) => p + 1),
                onPage: (p) => setCurrentPageNum(p),
              }
            : undefined
        }
      />
    </div>
  );
}

export default AllTickets;
