"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TeacherMarks() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [form, setForm] = useState({ student_id: "", exam_id: "", subject_id: "", marks_obtained: "", marks_total: "" });

  function load() {
    setLoading(true);
    api.teacherMarks().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    api.teacherSubjects().then((res) => res.success && setSubjects(res.data || []));
    api.teacherStudents().then((res) => res.success && setStudents(res.data || []));
    api.teacherExams().then((res) => res.success && setExams(res.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.teacherAddMarks({
      student_id: form.student_id,
      exam_id: form.exam_id,
      subject_id: form.subject_id,
      marks_obtained: Number(form.marks_obtained),
      marks_total: Number(form.marks_total),
    });
    if (res.success) {
      setMessage("Marks added.");
      setForm({ student_id: "", exam_id: "", subject_id: "", marks_obtained: "", marks_total: "" });
      load();
    } else {
      setMessage(res.message || "Failed to add marks");
    }
  }

  const columns = [
    { key: "username", label: "Student" },
    { key: "roll_no", label: "Roll" },
    { key: "exam_name", label: "Exam" },
    { key: "subject_name", label: "Subject" },
    { key: "marks_obtained", label: "Marks" },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Marks</h1>
      <p className="mt-1 text-ink/80">Enter marks for exams in your assigned subjects only.</p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-3">
        <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5">
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.username} ({s.roll_no})
            </option>
          ))}
        </select>
        <select required value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5">
          <option value="">Select exam</option>
          {exams.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
        <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5">
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.subject_name || `Subject ${s.subject_id}`}
            </option>
          ))}
        </select>
        <input required placeholder="Marks obtained" type="number" value={form.marks_obtained} onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <input required placeholder="Marks total" type="number" value={form.marks_total} onChange={(e) => setForm({ ...form, marks_total: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <button className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream">Add Marks</button>
      </form>
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-3">No marks records.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.key === "marks_obtained"
                      ? `${r.marks_obtained}/${r.marks_total}`
                      : String(r[c.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
