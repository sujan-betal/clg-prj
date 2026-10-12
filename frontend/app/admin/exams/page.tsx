"use client";

import { useEffect, useState } from "react";
import { api, hasPermission } from "@/lib/api";
import RequirePermission, { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminExams() {
  const [rows, setRows] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", course_id: "", semester: "", start_date: "", is_published: "0" });
  usePermissionRefresh();
  const canManage = hasPermission("EXAM_MANAGE");

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name || `Course #${id}`;

  function load() {
    setLoading(true);
    api.adminExams().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    api.adminCourses().then((res) => res.success && setCourses(res.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.adminCreateExam({
      name: form.name,
      course_id: form.course_id || undefined,
      semester: form.semester ? Number(form.semester) : undefined,
      start_date: form.start_date || undefined,
      is_published: Number(form.is_published),
    });
    if (res.success) {
      setMessage("Exam created.");
      setForm({ name: "", course_id: "", semester: "", start_date: "", is_published: "0" });
      load();
    } else {
      setMessage(res.message || "Failed to create exam");
    }
  }

  return (
    <RequirePermission permission="EXAM_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Exams</h1>
      <p className="mt-1 text-ink/80">Exam schedules, results publishing, and admit cards.</p>
      {canManage && (
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-ink/70">
          Exam name
          <input required placeholder="e.g. Midterm Exam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Course <span className="font-normal text-ink/40">(optional)</span>
          <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 font-normal">
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Semester
          <input placeholder="1" type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Start date
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Visibility
          <select value={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 font-normal">
            <option value="0">Not visible to students yet</option>
            <option value="1">Visible to students</option>
          </select>
        </label>
        <button className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream md:col-span-2 w-fit">Add Exam</button>
      </form>
      )}
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Semester</th>
              <th className="px-4 py-3 text-left font-semibold">Start</th>
              <th className="px-4 py-3 text-left font-semibold">Published</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-3">No exams.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.course_id ? courseName(r.course_id) : "All courses"}</td>
                <td className="px-4 py-3">{r.semester}</td>
                <td className="px-4 py-3">{r.start_date}</td>
                <td className="px-4 py-3">{r.is_published ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
