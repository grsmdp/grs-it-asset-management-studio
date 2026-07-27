import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

const breadcrumbMap = {
  dashboard: ["Home", "Dashboard"],
  assets: ["Home", "Assets"],
  addAsset: ["Home", "Assets", "Add Asset"],
  editAsset: ["Home", "Assets", "Edit Asset"],
  movement: ["Home", "Asset Movement"],
  maintenance: ["Home", "Maintenance"],
  reports: ["Home", "Reports"],
  categories: ["Home", "Settings", "Categories"],
  departments: ["Home", "Settings", "Departments"],
  vendors: ["Home", "Settings", "Vendors"],
  locations: ["Home", "Settings", "Locations"],
  helpdesk: ["Home", "Helpdesk", "Dashboard"],
  newTicket: ["Home", "Helpdesk", "New Ticket"],
  allTickets: ["Home", "Helpdesk", "All Tickets"],
  myTickets: ["Home", "Helpdesk", "My Tickets"],
  ticketDetail: ["Home", "Helpdesk", "Ticket Detail"],
  helpdeskReports: ["Home", "Helpdesk", "Reports"],
};

function TopHeader({ currentPage, onMenuClick }) {
  const crumbs = breadcrumbMap[currentPage] || ["Home", "Dashboard"];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 lg:px-5">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="flex-1" />

      <div className="relative hidden sm:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
        />
      </div>

      <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          0
        </span>
      </button>

      <div className="h-5 w-px bg-slate-200" />

      <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
          MD
        </div>
        <span className="hidden text-xs font-medium text-slate-700 lg:inline">IT Admin</span>
        <ChevronDown className="hidden h-3 w-3 text-slate-400 lg:block" />
      </button>
    </header>
  );
}

export default TopHeader;
