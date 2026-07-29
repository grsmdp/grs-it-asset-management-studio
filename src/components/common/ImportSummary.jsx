import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function ImportSummary({ result, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Import Completed</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
              <p className="text-2xl font-bold text-emerald-700">{result.imported}</p>
              <p className="text-xs font-medium text-emerald-600">Imported</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <ArrowRight className="h-5 w-5 text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
              <p className="text-xs font-medium text-blue-600">Updated</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mb-1" />
              <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
              <p className="text-xs font-medium text-amber-600">Skipped</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <XCircle className="h-5 w-5 text-red-600 mb-1" />
              <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
              <p className="text-xs font-medium text-red-600">Errors</p>
            </div>
          </div>

          {/* Detail list */}
          {result.details && result.details.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500">Name</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500">Action</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-slate-500">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((d, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 text-xs text-slate-700">{d.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          d.action === "Imported" ? "bg-emerald-50 text-emerald-700" :
                          d.action === "Updated" ? "bg-blue-50 text-blue-700" :
                          d.action === "Error" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {d.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">{d.reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

export default ImportSummary;
