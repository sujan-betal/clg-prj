"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { qk, useApiQuery } from "@/lib/queries";

export default function TeacherOverview() {
  const queryClient = useQueryClient();
  const session = useSession();
  const { data: profile } = useApiQuery<any>(qk.teacherProfile, () => api.teacherProfile());
  const { data: subjects = [] } = useApiQuery<any[]>(qk.teacherSubjects, () => api.teacherSubjects());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ designation: "", department_id: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        designation: profile.designation || "",
        department_id: profile.department_id ?? "",
      });
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: (payload: { designation?: string; department_id?: string }) =>
      api.teacherUpdateProfile(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage(res.message || "Profile updated");
        setEditing(false);
      } else {
        setMessage(res.message || "Failed to update profile");
      }
      queryClient.invalidateQueries({ queryKey: qk.teacherProfile });
    },
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    update.mutate({
      designation: form.designation || undefined,
      department_id: form.department_id || undefined,
    });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Welcome, {session?.username || "Teacher"}</h1>
<p className="mt-1 text-ink/60">
        {profile
          ? `${profile.designation || "Faculty"} · ${profile.department_name || "No department"} · ${profile.employee_id}`
          : "Loading your profile..."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{subjects.length}</p>
          <p className="text-xs tracking-widest text-ink/50">SUBJECTS</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-black text-maroon">{profile?.department_name || "-"}</p>
          <p className="mt-2 text-xs tracking-widest text-ink/50">DEPARTMENT</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">
            {subjects.reduce((sum, s) => sum + (s.students_count || 0), 0)}
          </p>
          <p className="text-xs tracking-widest text-ink/50">STUDENTS</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">
            {profile?.is_department_head ? "Yes" : "No"}
          </p>
          <p className="text-xs tracking-widest text-ink/50">DEPT HEAD</p>
        </div>
      </div>
      <h2 className="mt-10 font-display text-xl font-bold">Your Subjects</h2>
      <ul className="mt-4 space-y-3">
        {subjects.length === 0 ? (
          <li className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">No subjects assigned.</li>
        ) : subjects.map((s, i) => (
          <li key={i} className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">
            <span className="font-semibold">{s.subject_name || `Subject ${s.subject_id}`}</span>
            <span className="ml-2 text-xs text-ink/40">{s.subject_code}</span>
            <span className="ml-2 text-ink/60">
              · {s.course_name || `Course ${s.course_id}`} · Section {s.section} · {s.academic_year}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setEditing((v) => !v)}
        className="mt-8 rounded-full border border-ink/15 px-4 py-2 text-sm"
      >
        {editing ? "Close" : "Edit my details"}
      </button>

      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}

      {editing && (
        <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <label className="text-xs text-ink/60">
            Designation
            <input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="mt-1 block w-48 rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-ink/60">
            Department ID
            <input
              type="number"
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              className="mt-1 block w-32 rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <button className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">
            Save
          </button>
        </form>
      )}
    </>
  );
}
