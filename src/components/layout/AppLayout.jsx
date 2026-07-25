import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { PageContainer } from "./PageContainer"

function AppLayout({ currentPage, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNavigate(page) {
    onNavigate(page)
    setMobileOpen(false)
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r">
          <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-3 left-3 z-40 lg:hidden h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header currentPage={currentPage} onNavigate={handleNavigate} />
          <PageContainer>{children}</PageContainer>
        </div>
      </div>
    </TooltipProvider>
  )
}

export { AppLayout }
