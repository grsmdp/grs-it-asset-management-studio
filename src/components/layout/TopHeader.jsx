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
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Breadcrumbs from "./Breadcrumbs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const crumbs = breadcrumbMap[currentPage] || ["Home", "Dashboard"];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-4 lg:px-5">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="hidden md:block">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div
        className={cn(
          "relative hidden sm:block transition-all duration-200",
          searchFocused ? "w-64" : "w-48"
        )}
      >
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-14 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-sm">
          /
        </kbd>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors outline-none">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              0
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs">Notifications</span>
            <span className="text-[10px] font-normal text-slate-400">No new</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs font-medium text-slate-500">No notifications</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              You're all caught up
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Divider */}
      <div className="h-5 w-px bg-slate-200" />

      {/* Profile menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors outline-none cursor-pointer">
            <div className="relative">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                MD
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-400" />
            </div>
            <span className="hidden text-xs font-medium text-slate-700 lg:inline">
              IT Admin
            </span>
            <ChevronDown className="hidden h-3 w-3 text-slate-400 lg:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  MD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  IT Administrator
                </p>
                <p className="text-[11px] font-normal text-slate-400 truncate">
                  admin@grs.com
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
            <User className="h-3.5 w-3.5 text-slate-400" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
            <Moon className="h-3.5 w-3.5 text-slate-400" />
            Theme
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-xs text-red-600 focus:text-red-600 cursor-pointer">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default TopHeader;
