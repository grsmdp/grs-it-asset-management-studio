import { useEffect, useMemo, useState } from "react";
import { getTickets } from "../../services/helpdeskService";
import { getStatusBadgeClass } from "../../utils/statusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, RefreshCw, Eye, Pencil, User } from "lucide-react";

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
        <div>
          <h2 className="text-2xl font-bold">My Tickets</h2>
          <p className="text-sm text-muted-foreground">Tickets assigned to you</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 text-muted-foreground">
              <User className="h-10 w-10" />
            </div>
            <h6 className="font-semibold">Set Your Engineer Name</h6>
            <p className="text-sm text-muted-foreground mb-3">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Tickets</h2>
          <p className="text-sm text-muted-foreground">
            Assigned to: <strong>{myEngineer}</strong>{" "}
            <button
              className="text-muted-foreground hover:text-foreground ml-1 inline-flex items-center"
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
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-3">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-3 text-muted-foreground">No tickets assigned to you</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold">{t.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.problem_title}</TableCell>
                      <TableCell>{t.requested_by}</TableCell>
                      <TableCell>
                        <span className={getPriorityColor(t.priority)}>
                          <Badge variant={getPriorityBadgeVariant(t.priority)}>{t.priority}</Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeClass(t.status)}>{t.status}</Badge>
                      </TableCell>
                      <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setViewingTicketId(t.id); setCurrentPage("ticketDetail"); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyTickets;
