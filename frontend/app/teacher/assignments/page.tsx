"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TeacherAssignments() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", subject_id: "", section: "", due_date: "" });

  function load() {
    setLoading(true);
    api.teacherAssignments().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    api.teacherSubjects().then((res) => res.success && setSubjects(res.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.teacherAddAssignment({
      title: form.title,
      description: form.description || undefined,
      subject_id: form.subject_id,
      section: form.section || undefined,
      due_date: form.due_date || undefined,
    });
    if (res.success) {
      setMessage("Assignment added.");
      setForm({ title: "", description: "", subject_id: "", section: "", due_date: "" });
      load();
    } else {
      setMessage(res.message || "Failed to add assignment");
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Assignments</h1>
      <p className="mt-1 text-ink/80">Create and track assignments for your sections.</p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-2">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5">
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.subject_name || `Subject ${s.subject_id}`}
            </option>
          ))}
        </select>
        <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <input placeholder="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5 md:col-span-2" />
        <button className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream md:col-span-2 w-fit">Add Assignment</button>
      </form>
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
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
                  {r.description && <div className="text-xs text-ink/50">{r.description}</div>}
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
