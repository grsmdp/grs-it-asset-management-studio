import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  success: { icon: CheckCircle, bg: "bg-emerald-50 border-emerald-200 text-emerald-800", iconColor: "text-emerald-500" },
  error: { icon: XCircle, bg: "bg-red-50 border-red-200 text-red-800", iconColor: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200 text-amber-800", iconColor: "text-amber-500" },
  info: { icon: Info, bg: "bg-blue-50 border-blue-200 text-blue-800", iconColor: "text-blue-500" },
};

let toastId = 0;
let addToastFn = null;

export function toast(message, type = "info", duration = 4000) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration);
    };
    return () => { addToastFn = null; };
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const v = VARIANTS[t.type] || VARIANTS.info;
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-right-2 fade-in duration-200",
              v.bg
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", v.iconColor)} />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
