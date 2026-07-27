import {
  LayoutDashboard,
  Monitor,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  Headset,
  PlusCircle,
  List,
  UserCheck,
  FileBarChart,
  Tags,
  Building2,
  Truck,
  MapPin,
  Users,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuSections = [
  {
    title: "MAIN",
    items: [
      { id: "dashboard", icon: LayoutDashboard, name: "Dashboard", color: "#066fd1" },
      { id: "assets", icon: Monitor, name: "Assets", color: "#20c997" },
      { id: "movement", icon: ArrowLeftRight, name: "Asset Movement", color: "#f76707" },
      { id: "maintenance", icon: Wrench, name: "Maintenance", color: "#f59f00" },
      { id: "reports", icon: BarChart3, name: "Reports", color: "#dc3545" },
    ],
  },
  {
    title: "HELPDESK",
    items: [
      { id: "helpdesk", icon: Headset, name: "Dashboard", color: "#6f42c1" },
      { id: "newTicket", icon: PlusCircle, name: "New Ticket", color: "#6f42c1" },
      { id: "allTickets", icon: List, name: "All Tickets", color: "#6f42c1" },
      { id: "myTickets", icon: UserCheck, name: "My Tickets", color: "#6f42c1" },
      { id: "helpdeskReports", icon: FileBarChart, name: "Reports", color: "#dc3545" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { id: "categories", icon: Tags, name: "Categories", color: "#64748b" },
      { id: "departments", icon: Building2, name: "Locations", color: "#64748b" },
      { id: "vendors", icon: Truck, name: "Vendors", color: "#64748b" },
      { id: "locations", icon: MapPin, name: "Users", color: "#64748b" },
    ],
  },
];

function Sidebar({ currentPage, setCurrentPage, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  function isActive(item) {
    return (
      currentPage === item.id ||
      (item.id === "assets" && ["addAsset", "editAsset"].includes(currentPage)) ||
      (item.id === "allTickets" && currentPage === "ticketDetail") ||
      (item.id === "helpdesk" &&
        ["newTicket", "allTickets", "myTickets", "ticketDetail", "helpdeskReports"].includes(currentPage))
    );
  }

  function handleNavigate(pageId) {
    setCurrentPage(pageId);
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white transition-all duration-200 border-r border-slate-100",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className={cn(
          "flex h-14 items-center shrink-0 border-b border-slate-100",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-[13px] font-bold text-slate-900 leading-tight truncate">GRS IT</h2>
              <span className="text-[10px] text-slate-400">Asset Management</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                        collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2",
                        active
                          ? "text-slate-900"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      )}
                      style={
                        active
                          ? { backgroundColor: `${item.color}12`, color: item.color }
                          : undefined
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0"
                        style={active ? { color: item.color } : undefined}
                        strokeWidth={active ? 2 : 1.5}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile */}
        {!collapsed && (
          <div className="border-t border-slate-100 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                  MD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-[11px] font-medium text-slate-800 truncate">IT Administrator</strong>
                <small className="text-[10px] text-slate-400">GRS IT Department</small>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={cn("border-t border-slate-100", collapsed ? "px-1.5 py-2" : "px-2.5 py-2")}>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors",
              collapsed ? "justify-center px-2 py-2" : "px-2.5 py-2"
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
