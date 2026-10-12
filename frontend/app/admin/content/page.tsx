"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import RequirePermission from "@/components/RequirePermission";

export default function AdminContent() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminContent().then((res) => {
      if (res.success) {
        setMaterials(res.data?.materials || []);
        setAssignments(res.data?.assignments || []);
      }
      setLoading(false);
    });
  }, []);

  function renderTable(rows: any[], label: string) {
    return (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-3">No {label}.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.subject_name || `Subject ${r.subject_id}`}</td>
                <td className="px-4 py-3">{r.file_url || r.due_date || r.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <RequirePermission permission="CONTENT_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Content</h1>
      <p className="mt-1 text-ink/80">All uploaded materials and assignments.</p>
      <h2 className="mt-8 font-display text-xl font-bold text-maroon">Materials</h2>
      {renderTable(materials, "materials")}
      <h2 className="mt-8 font-display text-xl font-bold text-maroon">Assignments</h2>
      {renderTable(assignments, "assignments")}
    </RequirePermission>
  );
}
