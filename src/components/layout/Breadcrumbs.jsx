import { ChevronRight, Home } from "lucide-react";

function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
          {i === 0 && <Home className="h-3 w-3 text-slate-400" />}
          {i < items.length - 1 ? (
            <button className="hover:text-slate-800 transition-colors">
              {item}
            </button>
          ) : (
            <span className="font-medium text-slate-700">{item}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
