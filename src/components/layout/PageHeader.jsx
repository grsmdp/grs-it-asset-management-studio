function PageHeader({ pretitle, title, subtitle, accent, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div
          className="text-[11px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: accent || "#64748b" }}
        >
          {pretitle}
        </div>
        <h2 className="text-[22px] font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export default PageHeader;
