"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageBanner from "@/components/PageBanner";

export default function Faculty() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.publicFaculty().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageBanner kicker="OUR TEAM" title="Faculty" text="Educators and researchers, many published in top-tier journals and invited to global conferences." />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 md:grid-cols-3">
        {loading ? (
          <p className="text-sm text-ink/50">Loading faculty...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">No faculty records yet.</p>
) : rows.map((f) => (
          <div key={f.id} className="rounded-2xl border border-ink/10 bg-white p-6 hover:-translate-y-1 hover:shadow-md transition">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-maroon font-display text-xl font-black text-saffron">
              {String(f.username || f.name || f.employee_id).slice(0, 1).toUpperCase()}
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-maroon">
              {f.username || f.name || f.employee_id}
            </h3>
            <p className="text-sm text-ink/60">{f.designation || "-"}</p>
            <p className="mt-1 text-xs text-ink/40">
              {f.department_name || (f.is_department_head ? "Department Head" : "Dept ID: " + (f.department_id ?? "-"))}
            </p>
            <p className="mt-1 text-xs text-ink/30">{f.employee_id}</p>
          </div>
        ))}
      </section>
    </>
  );
}