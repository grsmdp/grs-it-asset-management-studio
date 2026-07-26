import { ChevronRight, Home } from "lucide-react";

function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-0.5 text-xs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-slate-300 mx-0.5" />
            )}
            {i === 0 && (
              <Home className="h-3 w-3 text-slate-400 mr-1" />
            )}
            {isLast ? (
              <span className="font-semibold text-slate-700">{item}</span>
            ) : (
              <button className="text-slate-400 hover:text-slate-600 transition-colors font-medium">
                {item}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
