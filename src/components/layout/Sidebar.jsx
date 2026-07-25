import { useState } from "react"
import {
  LayoutDashboard,
  Monitor,
  ArrowLeftRight,
  Wrench,
  Headset,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Box,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "assets", label: "Assets", icon: Monitor },
      { id: "movement", label: "Asset Movement", icon: ArrowLeftRight },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Helpdesk",
    items: [
      { id: "helpdesk", label: "Dashboard", icon: Headset },
      {
        id: "helpdesk-tickets",
        label: "Tickets",
        icon: Box,
        children: [
          { id: "newTicket", label: "New Ticket" },
          { id: "allTickets", label: "All Tickets" },
          { id: "myTickets", label: "My Tickets" },
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "categories", label: "Categories", icon: Settings },
      { id: "departments", label: "Departments", icon: Settings },
      { id: "vendors", label: "Vendors", icon: Settings },
      { id: "locations", label: "Locations", icon: Settings },
    ],
  },
]

function Sidebar({ currentPage, onNavigate, collapsed = false }) {
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {}
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          initial[item.id] = item.children.some((c) => c.id === currentPage)
        }
      })
    })
    return initial
  })

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function isActive(id) {
    if (id === currentPage) return true
    const parent = navSections
      .flatMap((s) => s.items)
      .find((item) => item.children?.some((c) => c.id === currentPage))
    if (parent?.id === id) return true
    return false
  }

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          GRS
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">GRS IT</span>
            <span className="text-xs text-muted-foreground leading-tight">
              Asset Management
            </span>
          </div>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.id)
              const hasChildren = item.children && item.children.length > 0
              const isGroupOpen = openGroups[item.id]

              if (hasChildren) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isGroupOpen ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </>
                      )}
                    </button>

                    {!collapsed && isGroupOpen && (
                      <div className="ml-4 mt-0.5 border-l pl-2">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => onNavigate(child.id)}
                            className={cn(
                              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              currentPage === child.id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              const button = (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    currentPage === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )

              return collapsed ? (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{button}</div>
              )
            })}
          </div>
        ))}
      </ScrollArea>

      <Separator />

      <div className="flex items-center gap-2 px-3 py-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            MD
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium leading-tight truncate">
              IT Administrator
            </span>
            <span className="text-xs text-muted-foreground leading-tight truncate">
              GRS IT Department
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return content
}

export { Sidebar }
