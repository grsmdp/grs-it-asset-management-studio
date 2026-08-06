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
  Layers,
  Building2,
  Truck,
  MapPin,
  PanelLeftClose,
  PanelLeft,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuSections = [
  {
    title: "Main",
    items: [
      { id: "dashboard", icon: LayoutDashboard, name: "Dashboard", color: "#0f6b6d", light: "#e6f3f3" },
      { id: "assets", icon: Monitor, name: "Assets", color: "#2563eb", light: "#e8f0fe" },
      { id: "movement", icon: ArrowLeftRight, name: "Asset Movement", color: "#ea580c", light: "#fff1e8" },
      { id: "maintenance", icon: Wrench, name: "Maintenance", color: "#d97706", light: "#fff8e8" },
      { id: "reports", icon: BarChart3, name: "Reports", color: "#dc2626", light: "#fdeceb" },
    ],
  },
  {
    title: "Helpdesk",
    items: [
      { id: "helpdesk", icon: Headset, name: "Dashboard", color: "#7c3aed", light: "#f3eeff" },
      { id: "newTicket", icon: PlusCircle, name: "New Ticket", color: "#0891b2", light: "#e7f7fb" },
      { id: "allTickets", icon: List, name: "All Tickets", color: "#4f46e5", light: "#eef0ff" },
      { id: "myTickets", icon: UserCheck, name: "My Tickets", color: "#059669", light: "#e8f8f1" },
      { id: "helpdeskReports", icon: FileBarChart, name: "Reports", color: "#db2777", light: "#fce8f2" },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "categories", icon: Tags, name: "Categories", color: "#0d9488", light: "#e6f7f5" },
      { id: "subcategories", icon: Layers, name: "Sub Categories", color: "#0891b2", light: "#e7f7fb" },
      { id: "departments", icon: Building2, name: "Departments", color: "#6366f1", light: "#eef0ff" },
      { id: "vendors", icon: Truck, name: "Vendors", color: "#c2410c", light: "#fff0e8" },
      { id: "locations", icon: MapPin, name: "Locations", color: "#65a30d", light: "#f2f8e8" },
    ],
  },
];

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon;

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center rounded-2xl text-[13.5px] font-medium transition-all duration-200",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
      )}
      style={
        active
          ? {
              backgroundColor: item.color,
              color: "#fff",
              boxShadow: `0 6px 16px ${item.color}33`,
            }
          : {
              backgroundColor: item.light,
              color: item.color,
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = item.color;
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.boxShadow = `0 6px 16px ${item.color}28`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = item.light;
          e.currentTarget.style.color = item.color;
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
          collapsed ? "h-9 w-9" : "h-8 w-8"
        )}
        style={{
          backgroundColor: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.7)",
          color: active ? "#fff" : item.color,
        }}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.2 : 1.9} />
      </span>
      {!collapsed && <span className="truncate tracking-[-0.01em]">{item.name}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={14} className="font-medium">
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
  width = 248,
}) {
  function isActive(item) {
    return (
      currentPage === item.id ||
      (item.id === "assets" && ["addAsset", "editAsset"].includes(currentPage)) ||
      (item.id === "allTickets" && currentPage === "ticketDetail")
    );
  }

  function handleNavigate(pageId) {
    setCurrentPage(pageId);
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed z-50 flex flex-col bg-white transition-[width,transform] duration-300 ease-in-out",
          "top-0 bottom-0 left-0 rounded-none",
          "lg:top-4 lg:bottom-4 lg:left-4 lg:rounded-[28px]",
          "shadow-[0_8px_40px_rgba(15,40,60,0.08)] ring-1 ring-black/[0.03]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width }}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-[72px] shrink-0 items-center",
            collapsed ? "justify-center px-2" : "gap-3 px-5"
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Waves className="h-5 w-5" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900 leading-none">
                GRS IT
              </h2>
              <p className="mt-1 text-[11px] font-medium text-slate-400 leading-none">
                Asset Studio
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 sidebar-scroll">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <div className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {section.title}
                </div>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 rounded-full bg-slate-100" />
              )}
              <div className="space-y-1.5">
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

        {/* Footer */}
        <div className="shrink-0 p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center rounded-2xl text-[12px] font-medium text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700",
              collapsed ? "justify-center py-3" : "gap-2.5 px-4 py-3"
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
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
