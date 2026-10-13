"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, hasPermission } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission, { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminAdmissions() {
  usePermissionRefresh();
  const canManage = hasPermission("ADMISSION_MANAGE");
  const queryClient = useQueryClient();

  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.adminAdmissions, () =>
    api.adminAdmissions()
  );

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.adminUpdateAdmission(id, status),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: qk.adminAdmissions });
      }
    },
  });

  function setStatus(id: string, status: string) {
    setStatusMutation.mutate({ id, status });
  }

  return (
    <RequirePermission permission="ADMISSION_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Admissions</h1>
      <p className="mt-1 text-ink/80">Applications queue — review, approve, or reject.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
          <tr className="bg-maroon text-cream">
                <th className="px-4 py-3 text-left font-semibold">Applicant</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Applied On</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                {canManage && <th className="px-4 py-3 text-left font-semibold">Actions</th>}
              </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={5} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-3">No admissions applications.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.applicant_name || r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</td>
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
