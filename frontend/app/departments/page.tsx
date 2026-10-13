"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

export default function Departments() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.departments, () =>
    api.publicDepartments()
  );

  return (
    <>
      <PageBanner kicker="OUR SCHOOLS" title="Departments" text="Every school has dedicated labs, faculty, and placement cells." />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
        {isPending ? (
          <p className="text-sm text-ink/50">Loading departments...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">No departments available yet.</p>
        ) : rows.map((d) => (
          <div key={d.id} className="rounded-2xl border border-ink/10 bg-white p-6 hover:-translate-y-1 hover:shadow-md transition">
            <h3 className="font-display text-lg font-bold text-maroon">{d.name}</h3>
            <p className="text-xs text-ink/40">{d.code}</p>
            <p className="mt-2 text-sm text-ink/60">{d.description || "-"}</p>
            <p className="mt-3 text-xs font-semibold text-maroon/70">
              {d.courses_count ?? 0} programs
            </p>
          </div>
        ))}
      </section>
    </>
  );
}