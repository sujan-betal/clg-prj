"use client";

import { api, hasPermission } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminDashboard() {
  usePermissionRefresh();
  const canViewStats = hasPermission("USER_VIEW");

  const { data: stats, error: statsError } = useApiQuery<{
    total_users: number;
    students: number;
    teachers: number;
  }>(qk.stats, () => api.adminStats(), { enabled: canViewStats });
  const error = statsError ? statsError.message : "";

  const cards = [
    { n: stats ? String(stats.total_users) : "-", l: "Total Users" },
    { n: stats ? String(stats.students) : "-", l: "Students" },
    { n: stats ? String(stats.teachers) : "-", l: "Teachers" },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Admin Dashboard</h1>
      <p className="mt-1 text-ink/60">Everything happening across the institute, today.</p>
      {!canViewStats ? (
        <p className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 text-sm text-ink/70 shadow-sm">
          Welcome! Use the sidebar to open the sections you have access to.
        </p>
      ) : (
        <>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((s) => (
              <div key={s.l} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                <p className="font-display text-3xl font-black text-maroon">{s.n}</p>
                <p className="text-xs tracking-widest text-ink/50">{s.l}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
