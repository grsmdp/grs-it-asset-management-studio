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
import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  RefreshCw,
  Info,
  MessageSquare,
  Image,
  Clock,
  UserCheck,
  PlayCircle,
  CheckCircle,
  Archive,
  Send,
  Upload,
} from "lucide-react";

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
      <div className="space-y-6">
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Ticket not found</p>
      </div>
    );
  }

  const engineerActions = [
    { label: "Accept", status: "Assigned", icon: UserCheck },
    { label: "Start Work", status: "In Progress", icon: PlayCircle },
    { label: "Completed", status: "Completed", icon: CheckCircle },
    { label: "Close", status: "Closed", icon: Archive },
  ];

  const photoTypeColors = {
    Problem: "destructive",
    Progress: "default",
    Completed: "secondary",
  };

  const pageSubtitle = (
    <span className="inline-flex items-center gap-2 flex-wrap">
      {ticket.problem_title}
      <Badge variant={getStatusBadgeClass(ticket.status)}>{ticket.status}</Badge>
      <span className={getPriorityColor(ticket.priority)}>
        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
      </span>
    </span>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="HELPDESK"
        title={ticket.ticket_number}
        subtitle={pageSubtitle}
        accent="#6f42c1"
      >
        <Button variant="outline" size="sm" onClick={() => setCurrentPage("allTickets")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={loadTicket}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">
            <Info className="mr-1 h-4 w-4" />
            Info
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-1 h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="photos">
            <Image className="mr-1 h-4 w-4" />
            Photos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="mr-1 h-4 w-4" />
            Timeline ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-3">Ticket Details</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Requested By:</span>{" "}
                  <span className="text-slate-600">{ticket.requested_by}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Email:</span>{" "}
                  <span className="text-slate-600">{ticket.requested_by_email || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Phone:</span>{" "}
                  <span className="text-slate-600">{ticket.requested_by_phone || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Created:</span>{" "}
                  <span className="text-slate-600">{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Category ID:</span>{" "}
                  <span className="text-slate-600">{ticket.category_id || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Department ID:</span>{" "}
                  <span className="text-slate-600">{ticket.department_id || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Location ID:</span>{" "}
                  <span className="text-slate-600">{ticket.location_id || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Asset ID:</span>{" "}
                  <span className="text-slate-600">{ticket.asset_id || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Cost:</span>{" "}
                  <span className="text-slate-600">{ticket.cost != null ? `\u20B9${Number(ticket.cost).toLocaleString()}` : "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Spare Parts:</span>{" "}
                  <span className="text-slate-600">{ticket.spare_parts || "-"}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-slate-700">Description:</span>
                  <p className="mt-1 text-slate-500">{ticket.problem_description || "No description provided."}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-2">Quick Actions</h6>
              {ticket.status !== "Completed" && ticket.status !== "Closed" && ticket.status !== "Cancelled" && (
                <div className="flex flex-wrap gap-1">
                  {engineerActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <Button
                        key={act.status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(act.status)}
                      >
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {act.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-2">Assignment</h6>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={assignForm.assigned_to}
                    onChange={(e) => setAssignForm((p) => ({ ...p, assigned_to: e.target.value }))}
                    placeholder="Engineer name"
                  />
                  <Button size="sm" onClick={handleAssign}>Assign</Button>
                </div>
                <Select value={assignForm.assigned_type} onValueChange={(v) => setAssignForm((p) => ({ ...p, assigned_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal IT</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-2">Cost & Parts</h6>
              <div className="flex gap-2">
                <Input
                  type="number"
                  className="flex-1"
                  value={costForm.cost}
                  onChange={(e) => setCostForm((p) => ({ ...p, cost: e.target.value }))}
                  placeholder="Cost (\u20B9)"
                />
                <Button variant="outline" size="sm" onClick={handleSaveCost}>Save</Button>
              </div>
              <Input
                className="mt-2"
                value={costForm.spare_parts}
                onChange={(e) => setCostForm((p) => ({ ...p, spare_parts: e.target.value }))}
                placeholder="Spare parts used"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-3">Comments</h6>
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500">No comments yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((c) => (
                    <div key={c.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-800">{c.user_name}</span>
                        <span className="text-xs text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-2">Add Comment</h6>
              <div className="space-y-2">
                <Input
                  value={commentUser}
                  onChange={(e) => setCommentUser(e.target.value)}
                  placeholder="Your name"
                />
                <Textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment..."
                />
                <Button size="sm" className="w-full" onClick={handleAddComment}>
                  <Send className="mr-1 h-4 w-4" />
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-3">Photos</h6>
              {photos.length === 0 ? (
                <p className="text-sm text-slate-500">No photos uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((ph) => (
                    <div key={ph.id} className="border border-slate-100 rounded-lg p-3 text-center">
                      <Image className="h-8 w-8 text-slate-400 mx-auto" />
                      <div className="mt-1 text-sm font-semibold text-slate-700">{ph.file_name}</div>
                      <Badge variant={photoTypeColors[ph.photo_type] || "secondary"} className="mt-1">
                        {ph.photo_type}
                      </Badge>
                      <div className="text-xs text-slate-400 mt-1">
                        {ph.uploaded_by} | {ph.created_at ? new Date(ph.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h6 className="text-sm font-semibold text-slate-800 mb-2">Upload Photo</h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Photo Type</Label>
                  <Select value={photoForm.photo_type} onValueChange={(v) => setPhotoForm((p) => ({ ...p, photo_type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Problem">Problem</SelectItem>
                      <SelectItem value="Progress">Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>File Name</Label>
                  <Input
                    value={photoForm.file_name}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, file_name: e.target.value }))}
                    placeholder="e.g., error_screenshot.png"
                  />
                </div>
                <div className="space-y-1">
                  <Label>URL (optional)</Label>
                  <Input
                    value={photoForm.file_url}
                    onChange={(e) => setPhotoForm((p) => ({ ...p, file_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Button size="sm" className="mt-3" onClick={handleAddPhoto}>
                <Upload className="mr-1 h-4 w-4" />
                Add Photo
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h6 className="text-sm font-semibold text-slate-800 mb-3">Timeline</h6>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No history records.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((h) => (
                  <div key={h.id} className="flex gap-3 items-start">
                    <div className="shrink-0 mt-1">
                      <div className="flex items-center justify-center rounded-full bg-blue-50 text-blue-600" style={{ width: 32, height: 32, fontSize: 14 }}>
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-slate-800">{h.action}</span>
                        <span className="text-xs text-slate-400">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{h.description}</p>
                      {(h.old_value || h.new_value) && (
                        <span className="text-xs text-slate-400">
                          {h.old_value && <span>From: {h.old_value}</span>}
                          {h.old_value && h.new_value && <span> {"\u2192"} </span>}
                          {h.new_value && <span>To: {h.new_value}</span>}
                        </span>
                      )}
                      <div><span className="text-xs text-slate-400">By: {h.performed_by}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TicketDetail;
