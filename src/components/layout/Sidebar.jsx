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
  PanelLeftClose,
  PanelLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      { id: "departments", icon: Building2, name: "Departments", color: "#64748b" },
      { id: "vendors", icon: Truck, name: "Vendors", color: "#64748b" },
      { id: "locations", icon: MapPin, name: "Locations", color: "#64748b" },
    ],
  },
];

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon;

  const button = (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
        active
          ? "shadow-sm"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/80"
      )}
      style={
        active
          ? {
              backgroundColor: `${item.color}0A`,
              color: item.color,
              boxShadow: `inset 3px 0 0 ${item.color}`,
            }
          : undefined
      }
      title={collapsed ? item.name : undefined}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-all duration-150",
          active ? "" : "group-hover:scale-105"
        )}
        style={active ? { color: item.color } : undefined}
        strokeWidth={active ? 2.2 : 1.8}
      />
      {!collapsed && (
        <span className="truncate">{item.name}</span>
      )}
      {collapsed && (
        <span className="absolute left-full ml-2 hidden group-hover:block z-[60]">
          <span className="whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
            {item.name}
          </span>
        </span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function Sidebar({
  currentPage,
  setCurrentPage,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  function isActive(item) {
    return (
      currentPage === item.id ||
      (item.id === "assets" && ["addAsset", "editAsset"].includes(currentPage)) ||
      (item.id === "allTickets" && currentPage === "ticketDetail") ||
      (item.id === "helpdesk" &&
        ["newTicket", "allTickets", "myTickets", "ticketDetail", "helpdeskReports"].includes(
          currentPage
        ))
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
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen
            ? "translate-x-0 shadow-2xl lg:shadow-md"
            : "-translate-x-full lg:translate-x-0"
        )}
        style={{ transitionProperty: "width, transform" }}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-slate-100 transition-all duration-300",
            collapsed ? "justify-center px-2" : "gap-3 px-5"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/20">
            <Shield className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
              <h2 className="text-[13px] font-bold text-slate-900 leading-tight tracking-tight">
                GRS IT
              </h2>
              <span className="text-[10px] font-medium text-slate-400 leading-none">
                Asset Management
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 sidebar-scroll">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400/80">
                  {section.title}
                </div>
              )}
              {collapsed && <div className="mx-auto mb-2 h-px w-5 bg-slate-200" />}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={isActive(item)}
                    collapsed={collapsed}
                    onClick={() => handleNavigate(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info (collapsed) */}
        {collapsed && (
          <div className="border-t border-slate-100 px-2 py-3 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative cursor-default">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 ring-2 ring-white">
                    MD
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <div>
                  <p className="font-medium">IT Administrator</p>
                  <p className="text-slate-400">GRS IT Department</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* User info (expanded) */}
        {!collapsed && (
          <div className="border-t border-slate-100 px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 ring-2 ring-white">
                  MD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                  IT Administrator
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  GRS IT Department
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div
          className={cn(
            "border-t border-slate-100 shrink-0",
            collapsed ? "px-2 py-2" : "px-3 py-2"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg text-xs font-medium text-slate-400 transition-all duration-150 hover:bg-slate-50 hover:text-slate-600",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
                )}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
