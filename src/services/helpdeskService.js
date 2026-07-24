import { supabase } from "./supabase";

/* ==========================================================
   TICKET CATEGORIES
========================================================== */

export async function getTicketCategories() {
  const { data, error } = await supabase
    .from("ticket_categories")
    .select("*")
    .order("category_name");
  if (error) throw error;
  return data;
}

export async function createTicketCategory(record) {
  const { data, error } = await supabase
    .from("ticket_categories")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

export async function updateTicketCategory(id, record) {
  const { data, error } = await supabase
    .from("ticket_categories")
    .update(record)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteTicketCategory(id) {
  const { error } = await supabase
    .from("ticket_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/* ==========================================================
   TICKET NUMBER GENERATION
========================================================== */

export async function generateTicketNumber() {
  const { data, error } = await supabase
    .from("tickets")
    .select("ticket_number")
    .like("ticket_number", "TKT-%")
    .order("ticket_number", { ascending: false })
    .limit(1);

  if (error) throw error;

  let next = 1;
  if (data && data.length > 0) {
    const last = data[0].ticket_number;
    const num = parseInt(last.replace("TKT-", ""), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `TKT-${String(next).padStart(6, "0")}`;
}

/* ==========================================================
   TICKETS CRUD
========================================================== */

export async function createTicket(ticket) {
  const { data, error } = await supabase
    .from("tickets")
    .insert([ticket])
    .select();
  if (error) throw error;
  return data;
}

export async function getTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTicketById(id) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id, updates) {
  const { data, error } = await supabase
    .from("tickets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteTicket(id) {
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) throw error;
}

/* ==========================================================
   TICKET COMMENTS
========================================================== */

export async function getTicketComments(ticketId) {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTicketComment(record) {
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

/* ==========================================================
   TICKET PHOTOS
========================================================== */

export async function getTicketPhotos(ticketId) {
  const { data, error } = await supabase
    .from("ticket_photos")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTicketPhoto(record) {
  const { data, error } = await supabase
    .from("ticket_photos")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

/* ==========================================================
   TICKET HISTORY / TIMELINE
========================================================== */

export async function getTicketHistory(ticketId) {
  const { data, error } = await supabase
    .from("ticket_history")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTicketHistory(record) {
  const { data, error } = await supabase
    .from("ticket_history")
    .insert([record])
    .select();
  if (error) throw error;
  return data;
}

/* ==========================================================
   DASHBOARD STATS
========================================================== */

export async function getTicketStats() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const [
    { count: openCount },
    { count: assignedCount },
    { count: inProgressCount },
    { count: completedToday },
    { count: criticalCount },
    { count: closedThisMonth },
    { count: totalCount },
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Open"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Assigned"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "In Progress"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Completed")
      .gte("completed_at", today),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("priority", "Critical")
      .not("status", "in", "(Completed,Closed,Cancelled)"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Closed")
      .gte("closed_at", monthStart),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    openCount: openCount || 0,
    assignedCount: assignedCount || 0,
    inProgressCount: inProgressCount || 0,
    completedToday: completedToday || 0,
    criticalCount: criticalCount || 0,
    closedThisMonth: closedThisMonth || 0,
    totalCount: totalCount || 0,
  };
}

export async function getTicketChartData() {
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("department_id, category_id, priority, assigned_to");
  if (error) throw error;

  const byDept = {};
  const byCategory = {};
  const byPriority = {};
  const byEngineer = {};

  (tickets || []).forEach((t) => {
    const dept = t.department_id || "Unassigned";
    byDept[dept] = (byDept[dept] || 0) + 1;

    const cat = t.category_id || "Uncategorized";
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    byPriority[t.priority || "Medium"] = (byPriority[t.priority || "Medium"] || 0) + 1;

    const eng = t.assigned_to || "Unassigned";
    byEngineer[eng] = (byEngineer[eng] || 0) + 1;
  });

  return { byDept, byCategory, byPriority, byEngineer };
}

/* ==========================================================
   REPORTS
========================================================== */

import { getDepartments, getLocations } from "./assetService";

export async function getTicketReportData() {
  const [tickets, categories, departments, locations] = await Promise.all([
    getTickets(),
    getTicketCategories(),
    getDepartments(),
    getLocations(),
  ]);

  const statusBreakdown = {};
  const priorityBreakdown = {};
  tickets.forEach((t) => {
    statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
  });

  return {
    tickets,
    categories,
    departments,
    locations,
    statusBreakdown,
    priorityBreakdown,
  };
}
