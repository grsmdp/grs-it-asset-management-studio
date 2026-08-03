import { useState } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  User,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageMeta = {
  dashboard: { title: "Asset Management", subtitle: null },
  assets: { title: "Assets", subtitle: "Inventory list" },
  addAsset: { title: "Add Asset", subtitle: "Create a new record" },
  editAsset: { title: "Edit Asset", subtitle: "Update asset details" },
  movement: { title: "Asset Movement", subtitle: "Location transfers" },
  maintenance: { title: "Maintenance", subtitle: "Service & repairs" },
  reports: { title: "Reports", subtitle: "Analytics & exports" },
  categories: { title: "Categories", subtitle: "Master data" },
  departments: { title: "Departments", subtitle: "Master data" },
  vendors: { title: "Vendors", subtitle: "Master data" },
  locations: { title: "Locations", subtitle: "Master data" },
  helpdesk: { title: "Helpdesk", subtitle: "Ticket overview" },
  newTicket: { title: "New Ticket", subtitle: "Create a request" },
  allTickets: { title: "All Tickets", subtitle: "Full ticket list" },
  myTickets: { title: "My Tickets", subtitle: "Assigned to you" },
  ticketDetail: { title: "Ticket Detail", subtitle: "Conversation & history" },
  helpdeskReports: { title: "Helpdesk Reports", subtitle: "Ticket analytics" },
};

function TopHeader({ currentPage, onMenuClick }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const meta = pageMeta[currentPage] || { title: "GRS IT Studio", subtitle: null };

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex shrink-0 flex-col gap-4 px-4 pt-4 lg:flex-row lg:items-center lg:gap-6 lg:px-6 lg:pt-5 lg:pb-2">
      <div className="flex items-start gap-3 lg:min-w-[220px] lg:flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="mt-0.5 rounded-xl p-2 text-slate-500 hover:bg-white/80 hover:text-slate-700 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900 leading-tight sm:text-[30px]">
            {meta.title}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-slate-400">
            {meta.subtitle || dateStr}
          </p>
        </div>
      </div>

      {/* Centered pill search */}
      <div className="order-3 w-full lg:order-none lg:mx-auto lg:max-w-md lg:flex-1">
        <div
          className={cn(
            "relative mx-auto w-full max-w-md transition-all duration-200",
            searchFocused && "scale-[1.01]"
          )}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets, tickets..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="h-11 w-full rounded-full border-0 bg-white pl-11 pr-4 text-[13px] text-slate-700 shadow-[0_2px_16px_rgba(15,40,60,0.06)] placeholder:text-slate-400 ring-1 ring-black/[0.03] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:flex-1 lg:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_2px_16px_rgba(15,40,60,0.06)] ring-1 ring-black/[0.03] hover:text-slate-700 transition-colors outline-none"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-xs">Notifications</span>
              <span className="text-[10px] font-normal text-slate-400">No new</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <Bell className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs font-medium text-slate-500">No notifications</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-[0_2px_16px_rgba(15,40,60,0.06)] ring-1 ring-black/[0.03] hover:bg-slate-50 transition-colors outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                MD
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-[12px] font-semibold text-slate-800 leading-none">
                  IT Admin
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 leading-none">
                  Administrator
                </p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  MD
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    IT Administrator
                  </p>
                  <p className="truncate text-[11px] font-normal text-slate-400">
                    admin@grs.com
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <User className="h-3.5 w-3.5 text-slate-400" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default TopHeader;
