import { useEffect, useMemo, useState } from "react";
import { getTickets, updateTicket } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, RefreshCw, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Tickets</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCurrentPage("newTicket")}>
            <Plus className="mr-1 h-4 w-4" />
            New Ticket
          </Button>
          <Button variant="outline" size="sm" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-4 flex-wrap">
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
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-3">Loading tickets...</TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-3 text-muted-foreground">No tickets found</TableCell>
                  </TableRow>
                ) : (
                  paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold">{t.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.problem_title}</TableCell>
                      <TableCell>{t.requested_by}</TableCell>
                      <TableCell>
                        <span className={getPriorityColor(t.priority)}>
                          <Badge variant={getPriorityBadgeVariant(t.priority)}>
                            {t.priority}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>{t.assigned_to || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeClass(t.status)}>{t.status}</Badge>
                      </TableCell>
                      <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPageNum} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPageNum === 1} onClick={() => setCurrentPageNum(1)}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPageNum === 1} onClick={() => setCurrentPageNum((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs">{currentPageNum}/{totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPageNum === totalPages} onClick={() => setCurrentPageNum((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPageNum === totalPages} onClick={() => setCurrentPageNum(totalPages)}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AllTickets;
