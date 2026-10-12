"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StudentAssignments() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.studentAssignments().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Assignments</h1>
      <p className="mt-1 text-ink/80">Your coursework and deadlines.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Section</th>
              <th className="px-4 py-3 text-left font-semibold">Due</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No assignments.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-ink/50">{r.description || ""}</div>
                </td>
                <td className="px-4 py-3">{r.subject_name || `Subject ${r.subject_id}`}</td>
                <td className="px-4 py-3">{r.section || "All"}</td>
                <td className="px-4 py-3">{r.due_date ? new Date(r.due_date).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
