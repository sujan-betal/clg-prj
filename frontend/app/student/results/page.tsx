"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

export default function StudentResults() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.studentMarks, () =>
    api.studentMarks()
  );

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Results</h1>
      <p className="mt-1 text-ink/80">Your exam results and marks.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Exam</th>
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Marks</th>
              <th className="px-4 py-3 text-left font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No marks available.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.exam_name || `Exam ${r.exam_id}`}</td>
                <td className="px-4 py-3">{r.subject_name || `Subject ${r.subject_id}`}</td>
                <td className="px-4 py-3">{r.marks_obtained}/{r.marks_total}</td>
                <td className="px-4 py-3">{r.percentage ?? "-"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
