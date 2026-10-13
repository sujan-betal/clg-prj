"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission from "@/components/RequirePermission";

export default function AdminReports() {
  const { data, isPending } = useApiQuery<any>(qk.adminReports, () => api.adminReports());

  return (
    <RequirePermission permission="REPORT_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Reports</h1>
      <p className="mt-1 text-ink/80">Key institutional metrics.</p>
      {isPending ? (
        <p className="mt-6 text-sm">Loading...</p>
      ) : !data ? (
        <p className="mt-6 text-sm">No report data.</p>
      ) : Array.isArray(data) ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i} className={i % 2 ? "bg-cream/60" : ""}>
                  {Object.values(row).slice(0, 6).map((v: any, j: number) => (
                    <td key={j} className="px-4 py-3">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "-")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
              <p className="font-display text-3xl font-black text-maroon">
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </p>
              <p className="mt-1 text-sm tracking-widest text-ink/60">{k.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
    </RequirePermission>
  );
}
