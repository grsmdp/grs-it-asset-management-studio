function StatCard({ icon: Icon, label, value, color, borderColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm p-4 relative overflow-hidden ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ backgroundColor: borderColor || color || "#64748b" }}
      />
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color || "#64748b"}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: color || "#64748b" }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
          <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
