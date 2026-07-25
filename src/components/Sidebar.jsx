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
  ChevronDown,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuSections = [
  {
    title: "Main",
    items: [
      { id: "dashboard", icon: LayoutDashboard, name: "Dashboard" },
      { id: "assets", icon: Monitor, name: "Assets" },
      { id: "movement", icon: ArrowLeftRight, name: "Asset Movement" },
      { id: "maintenance", icon: Wrench, name: "Maintenance" },
      { id: "reports", icon: BarChart3, name: "Reports" },
    ],
  },
  {
    title: "Helpdesk",
    items: [
      { id: "helpdesk", icon: Headset, name: "Dashboard" },
      { id: "newTicket", icon: PlusCircle, name: "New Ticket" },
      { id: "allTickets", icon: List, name: "All Tickets" },
      { id: "myTickets", icon: UserCheck, name: "My Tickets" },
      { id: "helpdeskReports", icon: FileBarChart, name: "Reports" },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "categories", icon: Tags, name: "Categories" },
      { id: "departments", icon: Building2, name: "Departments" },
      { id: "vendors", icon: Truck, name: "Vendors" },
      { id: "locations", icon: MapPin, name: "Locations" },
    ],
  },
];

function Sidebar({ currentPage, setCurrentPage, mobileOpen, onCloseMobile }) {
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
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex w-[260px] flex-col bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[64px] items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-extrabold text-xs">
            GRS
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-tight">GRS IT</h2>
            <span className="text-[11px] text-slate-400">Asset Management</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold">
              MD
            </div>
            <div>
              <strong className="block text-[11px]">IT Administrator</strong>
              <small className="text-[10px] text-slate-400">GRS IT Department</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
