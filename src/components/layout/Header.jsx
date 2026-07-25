import { Search, Bell, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const breadcrumbMap = {
  dashboard: [{ label: "Home" }, { label: "Dashboard" }],
  assets: [{ label: "Home" }, { label: "Assets" }],
  addAsset: [{ label: "Home" }, { label: "Assets" }, { label: "Add Asset" }],
  editAsset: [
    { label: "Home" },
    { label: "Assets" },
    { label: "Edit Asset" },
  ],
  movement: [{ label: "Home" }, { label: "Asset Movement" }],
  maintenance: [{ label: "Home" }, { label: "Maintenance" }],
  reports: [{ label: "Home" }, { label: "Reports" }],
  categories: [
    { label: "Home" },
    { label: "Settings" },
    { label: "Categories" },
  ],
  departments: [
    { label: "Home" },
    { label: "Settings" },
    { label: "Departments" },
  ],
  vendors: [
    { label: "Home" },
    { label: "Settings" },
    { label: "Vendors" },
  ],
  locations: [
    { label: "Home" },
    { label: "Settings" },
    { label: "Locations" },
  ],
  helpdesk: [{ label: "Home" }, { label: "Helpdesk" }],
  newTicket: [
    { label: "Home" },
    { label: "Helpdesk" },
    { label: "New Ticket" },
  ],
  allTickets: [
    { label: "Home" },
    { label: "Helpdesk" },
    { label: "All Tickets" },
  ],
  myTickets: [
    { label: "Home" },
    { label: "Helpdesk" },
    { label: "My Tickets" },
  ],
  ticketDetail: [
    { label: "Home" },
    { label: "Helpdesk" },
    { label: "Ticket Detail" },
  ],
  helpdeskReports: [
    { label: "Home" },
    { label: "Helpdesk" },
    { label: "Reports" },
  ],
}

function Header({ currentPage, onNavigate }) {
  const crumbs = breadcrumbMap[currentPage] || [{ label: "Home" }]

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {i < crumbs.length - 1 ? (
              <button
                onClick={() => onNavigate("dashboard")}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="relative hidden sm:block w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8 h-9" />
      </div>

      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full px-1 text-[10px]">
          3
        </Badge>
      </Button>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                MD
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline text-sm font-medium">
              IT Admin
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">IT Administrator</span>
              <span className="text-xs text-muted-foreground font-normal">
                admin@grs.com
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Help</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export { Header }
