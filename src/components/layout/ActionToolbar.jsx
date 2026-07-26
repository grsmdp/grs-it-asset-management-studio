import { Button } from "@/components/ui/button";

const colorMap = {
  add: "bg-emerald-600 hover:bg-emerald-700 text-white",
  save: "bg-emerald-600 hover:bg-emerald-700 text-white",
  transfer: "bg-blue-600 hover:bg-blue-700 text-white",
  repair: "bg-orange-500 hover:bg-orange-600 text-white",
  export: "bg-indigo-600 hover:bg-indigo-700 text-white",
  reports: "bg-purple-600 hover:bg-purple-700 text-white",
  delete: "bg-red-500 hover:bg-red-600 text-white",
  refresh: "bg-cyan-500 hover:bg-cyan-600 text-white",
  reset: "bg-slate-400 hover:bg-slate-500 text-white",
  default: "",
};

function ActionToolbar({ actions = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action, i) => {
        const Icon = action.icon;
        const colorClass = colorMap[action.variant] || colorMap.default;
        return (
          <Button
            key={i}
            variant={action.variant && colorMap[action.variant] ? undefined : "outline"}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className={colorClass ? `${colorClass} gap-1.5` : "gap-1.5"}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

export default ActionToolbar;
