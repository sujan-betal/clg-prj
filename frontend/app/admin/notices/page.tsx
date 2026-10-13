"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission from "@/components/RequirePermission";

export default function AdminNotices() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.adminNotices, () =>
    api.adminNotices()
  );

  return (
    <RequirePermission permission="NOTICE_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Notices</h1>
      <p className="mt-1 text-ink/80">Institute-wide announcements.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Audience</th>
              <th className="px-4 py-3 text-left font-semibold">Posted</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={3} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-3">No notices.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-ink/50">{r.content || r.body}</div>
                </td>
                <td className="px-4 py-3">{r.audience}</td>
                <td className="px-4 py-3">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
