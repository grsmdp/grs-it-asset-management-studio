import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import InstallPrompt from "@/components/InstallPrompt";

function AppLayout({ currentPage, setCurrentPage, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      if (desktop) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setShowUpdateBanner(true);
      });
    }
  }, []);

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9997] border-b border-primary/20 bg-primary/5 py-2 text-center lg:left-[260px]">
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              A new version is available.
            </span>
            <button
              className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
              onClick={() => window.location.reload()}
            >
              Update
            </button>
          </div>
        </div>
      )}

      <InstallPrompt />

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-200"
        style={{
          marginLeft: isDesktop ? sidebarWidth : 0,
        }}
      >
        <TopHeader
          currentPage={currentPage}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;