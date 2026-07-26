import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import InstallPrompt from "@/components/InstallPrompt";

function AppLayout({ currentPage, setCurrentPage, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={isDesktop ? collapsed : true}
        onToggleCollapse={isDesktop ? () => setCollapsed((v) => !v) : undefined}
        mobileOpen={isDesktop ? mobileOpen : true}
        onCloseMobile={isDesktop ? () => setMobileOpen(false) : undefined}
      />

      <div
        className="flex flex-col h-screen bg-slate-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isDesktop ? (collapsed ? 72 : 260) : 72,
        }}
      >
        <TopHeader
          currentPage={currentPage}
          onMenuClick={isDesktop ? () => setMobileOpen(true) : undefined}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          {children}
        </main>
      </div>

      <InstallPrompt />
    </TooltipProvider>
  );
}

export default AppLayout;
