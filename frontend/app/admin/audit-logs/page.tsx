"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission from "@/components/RequirePermission";

export default function AuditLogs() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.adminAuditLogs, () =>
    api.adminAuditLogs()
  );

  const columns = rows.length > 0 ? Object.keys(rows[0]).slice(0, 6) : [];

  return (
    <RequirePermission permission="AUDIT_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Audit Logs</h1>
      <p className="mt-1 text-ink/80">Administrative activity across the portal.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-3">No audit logs.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                {columns.map((c) => (
                  <td key={c} className="px-4 py-3">{typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "-")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
