import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

function TableCard({ title, count, children, columns, data, loading, emptyMessage, emptyIcon: EmptyIcon, renderRow, pagination, className }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className || ""}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-xs font-normal text-slate-400">({count})</span>
            )}
          </h3>
        </div>
      )}

      {children ? (
        children
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={`text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${col.className || ""}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      {EmptyIcon && (
                        <div className="rounded-full bg-slate-100 p-3">
                          <EmptyIcon className="h-8 w-8" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {emptyMessage || "No data found"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, i) => renderRow(row, i))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-500">
            Showing {pagination.from} to {pagination.to} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={pagination.onPrev}
              disabled={!pagination.hasPrev}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pagination.pages.map((p) => (
              <button
                key={p}
                onClick={() => pagination.onPage(p)}
                className={`h-7 min-w-7 rounded-lg text-xs font-medium transition-colors ${
                  p === pagination.current
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={pagination.onNext}
              disabled={!pagination.hasNext}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableCard;
