"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

export default function TeacherMarks() {
  const queryClient = useQueryClient();
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.teacherMarks, () => api.teacherMarks());
  const { data: subjects = [] } = useApiQuery<any[]>(qk.teacherSubjects, () => api.teacherSubjects());
  const { data: students = [] } = useApiQuery<any[]>(qk.teacherStudents, () => api.teacherStudents());
  const { data: exams = [] } = useApiQuery<any[]>(qk.teacherExams, () => api.teacherExams());
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ student_id: "", exam_id: "", subject_id: "", marks_obtained: "", marks_total: "" });

  const add = useMutation({
    mutationFn: (payload: {
      student_id: string;
      exam_id: string;
      subject_id: string;
      marks_obtained: number;
      marks_total: number;
    }) => api.teacherAddMarks(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage("Marks added.");
        setForm({ student_id: "", exam_id: "", subject_id: "", marks_obtained: "", marks_total: "" });
      } else {
        setMessage(res.message || "Failed to add marks");
      }
      queryClient.invalidateQueries({ queryKey: qk.teacherMarks });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    add.mutate({
      student_id: form.student_id,
      exam_id: form.exam_id,
      subject_id: form.subject_id,
      marks_obtained: Number(form.marks_obtained),
      marks_total: Number(form.marks_total),
    });
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
            {isPending ? (
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
