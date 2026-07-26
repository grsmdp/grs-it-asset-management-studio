import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import InstallPrompt from "@/components/InstallPrompt";

function AppLayout({ currentPage, setCurrentPage, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div
          className="flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out"
          style={{ marginLeft: sidebarWidth }}
        >
          <TopHeader
            currentPage={currentPage}
            onMenuClick={() => setMobileOpen(true)}
            sidebarWidth={sidebarWidth}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {children}
          </main>
        </div>

        <InstallPrompt />
      </div>
    </TooltipProvider>
  );
}

export default AppLayout;
