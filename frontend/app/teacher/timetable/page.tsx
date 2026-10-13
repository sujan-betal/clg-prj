"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

export default function TeacherTimetable() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.teacherSubjects, () =>
    api.teacherSubjects()
  );

  const sections = rows.map((r) => r.section).filter(Boolean);
  const uniqueSections = Array.from(new Set(sections));

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Timetable</h1>
      <p className="mt-1 text-ink/80">Subjects and sections assigned to you.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Section</th>
              <th className="px-4 py-3 text-left font-semibold">Academic Year</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No subjects assigned.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">
                  {r.subject_name || `Subject ${r.subject_id}`}
                  <span className="ml-2 text-xs text-ink/40">{r.subject_code}</span>
                </td>
                <td className="px-4 py-3">{r.course_name || `Course ${r.course_id}`}</td>
                <td className="px-4 py-3">{r.section}</td>
                <td className="px-4 py-3">{r.academic_year || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink/40">
        Sections: {uniqueSections.length > 0 ? uniqueSections.join(", ") : "none"}
      </p>
    </>
  );
}