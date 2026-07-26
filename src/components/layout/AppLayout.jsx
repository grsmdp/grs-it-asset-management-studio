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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={isDesktop ? collapsed : true}
        onToggleCollapse={isDesktop ? () => setCollapsed((v) => !v) : undefined}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className="flex flex-col h-screen bg-slate-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={
          isDesktop
            ? { marginLeft: collapsed ? 72 : 260 }
            : { marginLeft: 0 }
        }
      >
        <TopHeader
          currentPage={currentPage}
          onMenuClick={() => setMobileOpen(true)}
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
