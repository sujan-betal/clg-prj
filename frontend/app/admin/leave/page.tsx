"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, hasPermission } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission, { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminLeave() {
  usePermissionRefresh();
  const canManage = hasPermission("LEAVE_APPROVE");
  const queryClient = useQueryClient();

  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.adminLeave, () =>
    api.adminLeave()
  );

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.adminUpdateLeave(id, status),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: qk.adminLeave });
      }
    },
  });

  function setStatus(id: string, status: string) {
    setStatusMutation.mutate({ id, status });
  }

  return (
    <RequirePermission permission="LEAVE_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Leave Requests</h1>
      <p className="mt-1 text-ink/80">Review and action staff leave applications.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Teacher</th>
              <th className="px-4 py-3 text-left font-semibold">From</th>
              <th className="px-4 py-3 text-left font-semibold">To</th>
              <th className="px-4 py-3 text-left font-semibold">Reason</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              {canManage && <th className="px-4 py-3 text-left font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={6} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-3">No leave requests.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.teacher_id ?? r.teacher_name}</td>
                <td className="px-4 py-3">{r.from_date}</td>
                <td className="px-4 py-3">{r.to_date}</td>
                <td className="px-4 py-3">{r.reason}</td>
                <td className="px-4 py-3">{r.status}</td>
                {canManage && (
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => setStatus(r.id, "APPROVED")} className="rounded-full bg-maroon px-4 py-1 text-xs font-semibold text-cream">Approve</button>
                  <button onClick={() => setStatus(r.id, "REJECTED")} className="rounded-full border border-ink/20 px-4 py-1 text-xs font-semibold">Reject</button>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
