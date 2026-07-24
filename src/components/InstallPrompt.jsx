import { useEffect, useState } from "react";

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa_install_dismissed") === "true";
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    }

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [dismissed]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "true");
  }

  if (isInstalled || !showBanner) return null;

  return (
    <div className="pwa-install-banner">
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-download text-primary" style={{ fontSize: 18 }} />
        <div className="flex-grow-1">
          <strong style={{ fontSize: "0.85rem" }}>Install GRS Assets</strong>
          <div style={{ fontSize: "0.75rem" }} className="text-muted">
            Add to home screen for quick access
          </div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={handleInstall}>
          Install
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={handleDismiss}
          title="Dismiss"
        >
          <i className="bi bi-x" />
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
