"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

export default function TeacherAttendance() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.teacherAttendance, () =>
    api.teacherAttendance()
  );
  const { data: students = [] } = useApiQuery<any[]>(qk.teacherStudents, () => api.teacherStudents());
  const { data: subjects = [] } = useApiQuery<any[]>(qk.teacherSubjects, () => api.teacherSubjects());
  const [form, setForm] = useState({ student_id: "", subject_id: "", date: today, status: "PRESENT" });
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: (records: { student_id: string; subject_id: string; date: string; status: string }[]) =>
      api.teacherMarkAttendance(records),
    onSuccess: (res) => {
      if (res.success) {
        setMessage("Attendance saved.");
      } else {
        setMessage(res.message || "Could not save attendance.");
      }
      queryClient.invalidateQueries({ queryKey: qk.teacherAttendance });
    },
  });

  function mark(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    save.mutate([
      {
        student_id: form.student_id,
        subject_id: form.subject_id,
        date: form.date,
        status: form.status,
      },
    ]);
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Attendance</h1>
      <p className="mt-1 text-ink/80">Pick the student and subject, then mark them present or absent.</p>

      <form
        onSubmit={mark}
        className="mt-6 grid gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm md:grid-cols-2"
      >
        <label className="text-sm font-semibold text-ink/70">
          Student
          <select
            required
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-normal"
          >
            <option value="">Choose a student...</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.roll_no} — {s.username}
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <span className="mt-1 block text-xs text-ink/50">No students found.</span>
          )}
        </label>

        <label className="text-sm font-semibold text-ink/70">
          Subject
          <select
            required
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-normal"
          >
            <option value="">Choose a subject...</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name || `Subject ${s.subject_id}`}
                {s.section ? ` (Section ${s.section})` : ""}
              </option>
            ))}
          </select>
          {subjects.length === 0 && (
            <span className="mt-1 block text-xs text-ink/50">
              No subjects assigned to you yet.
            </span>
          )}
        </label>

        <label className="text-sm font-semibold text-ink/70">
          Date
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-normal"
          />
        </label>

        <label className="text-sm font-semibold text-ink/70">
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-normal"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </label>

        <button
          disabled={students.length === 0 || subjects.length === 0}
          className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2 md:w-fit"
        >
          Save Attendance
        </button>
      </form>

      {message && (
        <p className="mt-3 rounded-lg bg-saffron-soft px-3 py-2 text-sm text-ink/80">{message}</p>
      )}

      <h2 className="mt-8 font-display text-xl font-bold text-maroon">Records so far</h2>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Student</th>
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={4} className="px-4 py-3">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3">Nothing marked yet.</td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const stu = students.find((s) => s.student_id === r.student_id);
                const sub = subjects.find((s) => s.subject_id === r.subject_id);
                return (
                  <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                    <td className="px-4 py-3">
                      {stu ? `${stu.roll_no} — ${stu.username}` : `Student #${r.student_id}`}
                    </td>
                    <td className="px-4 py-3">{sub?.subject_name || `Subject #${r.subject_id}`}</td>
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.status === "ABSENT"
                            ? "border border-red-300 text-red-600"
                            : "border border-emerald-300 text-emerald-700"
                        }`}
                      >
                        {r.status === "ABSENT" ? "Absent" : "Present"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}