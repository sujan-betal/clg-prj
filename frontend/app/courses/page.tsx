"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

type Course = {
  id: string;
  department_name?: string;
  name: string;
  code: string;
  total_seats: number;
  duration_years: number;
  subjects_count?: number;
  annual_fee: number;
};

export default function Courses() {
  const { data: rows = [], isPending } = useApiQuery<Course[]>(qk.courses, () =>
    api.publicCourses()
  );

  return (
    <>
      <PageBanner
        kicker="ACADEMICS"
        title="Courses & Programs"
        text="Industry-aligned programs with mandatory internships, live projects, and a credit system built for flexibility."
      />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-2">
        {isPending ? (
          <p className="text-sm text-ink/50">Loading courses...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">No courses available yet.</p>
        ) : rows.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-ink/10 bg-white p-6 hover:-translate-y-1 hover:shadow-md transition"
          >
            <p className="text-xs font-semibold tracking-widest text-maroon/70">
              {c.department_name || "General"}
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-maroon">{c.name}</h3>
            <p className="text-xs text-ink/40">{c.code}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-cream px-3 py-1">{c.total_seats} seats</span>
              <span className="rounded-full bg-cream px-3 py-1">{c.duration_years} yrs</span>
              <span className="rounded-full bg-cream px-3 py-1">{c.subjects_count ?? 0} subjects</span>
              <span className="rounded-full bg-saffron-soft px-3 py-1 font-semibold">Rs {c.annual_fee}</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}