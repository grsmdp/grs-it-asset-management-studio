import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

function FilterCard({ children, open: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle || (() => setInternalOpen((v) => !v));

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50/50 transition-colors rounded-t-xl"
      >
        <span className="text-sm font-semibold text-slate-700">Filters</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">{children}</div>
        </div>
      )}
    </div>
  );
}

export default FilterCard;
