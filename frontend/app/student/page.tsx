"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { qk, useApiQuery } from "@/lib/queries";

export default function StudentOverview() {
  const session = useSession();
  const queryClient = useQueryClient();

  const { data: profile = null } = useApiQuery<any>(qk.studentProfile, () => api.studentProfile());
  const { data: notices = [] } = useApiQuery<any[]>(qk.studentNotices, () => api.studentNotices());
  const { data: attendance = [] } = useApiQuery<any[]>(qk.studentAttendance, () => api.studentAttendance());
  const { data: marks = [] } = useApiQuery<any[]>(qk.studentMarks, () => api.studentMarks());
  const { data: materials = [] } = useApiQuery<any[]>(qk.studentMaterials, () => api.studentMaterials());

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ guardian_phone: "", section: "" });
  const [message, setMessage] = useState("");

  const counts = {
    notices: notices.length,
    attendance: attendance.length,
    marks: marks.length,
    materials: materials.length,
  };

  useEffect(() => {
    if (profile) {
      setForm({
        guardian_phone: profile.guardian_phone || "",
        section: profile.section || "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: (payload: { guardian_phone?: string; section?: string }) =>
      api.studentUpdateProfile(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage(res.message || "Profile updated");
        setEditing(false);
      } else {
        setMessage(res.message || "Failed to update profile");
      }
      queryClient.invalidateQueries({ queryKey: qk.studentProfile });
    },
  });

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    save.mutate({
      guardian_phone: form.guardian_phone || undefined,
      section: form.section || undefined,
    });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Hi, {session?.username || "Student"}</h1>
      <p className="mt-1 text-ink/60">
        {profile
          ? `${profile.course_name || "Not enrolled"} · Semester ${profile.semester} · Section ${profile.section || "-"} · Roll ${profile.roll_no}`
          : "Loading your profile..."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-black text-maroon">{profile?.department_name || "-"}</p>
          <p className="mt-2 text-xs tracking-widest text-ink/50">DEPARTMENT</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-black text-maroon">{profile?.course_name || "-"}</p>
          <p className="mt-2 text-xs tracking-widest text-ink/50">PROGRAM</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{counts.attendance}</p>
          <p className="text-xs tracking-widest text-ink/50">ATTENDANCE</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{counts.marks}</p>
          <p className="text-xs tracking-widest text-ink/50">RESULTS</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-black text-maroon">{profile?.guardian_phone || "-"}</p>
          <p className="mt-2 text-xs tracking-widest text-ink/50">GUARDIAN PHONE</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{counts.materials}</p>
          <p className="text-xs tracking-widest text-ink/50">MATERIALS</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{counts.notices}</p>
          <p className="text-xs tracking-widest text-ink/50">NOTICES</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-black text-maroon">{profile?.roll_no || "-"}</p>
          <p className="text-xs tracking-widest text-ink/50">ROLL NO</p>
        </div>
      </div>

      <button
        onClick={() => setEditing((v) => !v)}
        className="mt-6 rounded-full border border-ink/15 px-4 py-2 text-sm"
      >
        {editing ? "Close" : "Edit my details"}
      </button>

      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}

      {editing && (
        <form onSubmit={onSave} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <label className="text-xs text-ink/60">
            Guardian phone
            <input
              value={form.guardian_phone}
              onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
              className="mt-1 block w-44 rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-ink/60">
            Section
            <input
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
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
