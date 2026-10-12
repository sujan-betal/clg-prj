"use client";

import { useEffect, useState } from "react";
import { api, getUsername } from "@/lib/api";

export default function StudentOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ notices: 0, attendance: 0, marks: 0, materials: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ guardian_phone: "", section: "" });
  const [message, setMessage] = useState("");

  function applyProfile(res: any) {
    if (res?.success && res.data) {
      setProfile(res.data);
      setForm({
        guardian_phone: res.data.guardian_phone || "",
        section: res.data.section || "",
      });
    }
  }

  useEffect(() => {
    api.studentProfile().then(applyProfile);
    Promise.all([
      api.studentNotices(),
      api.studentAttendance(),
      api.studentMarks(),
      api.studentMaterials(),
    ]).then(([notices, attendance, marks, materials]) => {
      setCounts({
        notices: (notices.data || []).length,
        attendance: (attendance.data || []).length,
        marks: (marks.data || []).length,
        materials: (materials.data || []).length,
      });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.studentUpdateProfile({
      guardian_phone: form.guardian_phone || undefined,
      section: form.section || undefined,
    });
    if (res.success) {
      setMessage(res.message || "Profile updated");
      setEditing(false);
      api.studentProfile().then(applyProfile);
    } else {
      setMessage(res.message || "Failed to update profile");
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Hi, {getUsername() || "Student"}</h1>
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
        <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
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
