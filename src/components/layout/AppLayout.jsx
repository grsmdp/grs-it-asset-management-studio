import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import InstallPrompt from "@/components/InstallPrompt";

const SIDEBAR_GAP = 16;
const SIDEBAR_EXPANDED = 248;
const SIDEBAR_COLLAPSED = 84;

function AppLayout({ currentPage, setCurrentPage, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    function handleResize() {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const contentOffset = sidebarWidth + SIDEBAR_GAP * 2;

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-screen overflow-hidden bg-[#e9eef2]">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          width={sidebarWidth}
        />

        <div
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isDesktop ? contentOffset : 0,
            paddingRight: isDesktop ? SIDEBAR_GAP : 0,
            paddingTop: isDesktop ? SIDEBAR_GAP : 0,
            paddingBottom: isDesktop ? SIDEBAR_GAP : 0,
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none lg:rounded-[28px] bg-transparent">
            <TopHeader
              currentPage={currentPage}
              onMenuClick={() => setMobileOpen(true)}
            />

            <main className="flex-1 overflow-y-auto overflow-x-auto px-4 pb-8 pt-2 lg:px-6 lg:pb-8">
              {children}
            </main>
          </div>
        </div>

        <InstallPrompt />
      </div>
    </TooltipProvider>
  );
}

export default AppLayout;
