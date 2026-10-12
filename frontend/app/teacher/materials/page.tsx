"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TeacherMaterials() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [subject_id, setSubjectId] = useState("");
  const [file_url, setFileUrl] = useState("");
  const [file_type, setFileType] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await api.teacherMaterials();
    if (res.success) setRows(res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.teacherSubjects().then((res) => res.success && setSubjects(res.data || []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.teacherAddMaterial({
      title,
       subject_id,
      file_url: file_url || undefined,
      file_type: file_type || undefined,
    });
    if (res.success) {
      setMessage(res.message);
      setTitle("");
      setSubjectId("");
      setFileUrl("");
      setFileType("");
      load();
    } else {
      setMessage(res.message || "Failed to add material");
    }
  }

  const columns = ["title", "subject_name", "file_type", "file_url"];

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Materials</h1>
      <p className="mt-1 text-ink/80">Upload and manage study materials for your subjects.</p>
      <form onSubmit={submit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <select required value={subject_id} onChange={(e) => setSubjectId(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.subject_name || `Subject ${s.subject_id}`}
            </option>
          ))}
        </select>
        <input placeholder="File URL" value={file_url} onChange={(e) => setFileUrl(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <input placeholder="Type (PDF)" value={file_type} onChange={(e) => setFileType(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <button className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">Add Material</button>
        {message && <p className="text-sm text-ink/70">{message}</p>}
      </form>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left font-semibold">{c.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No materials uploaded.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.subject_name || `Subject ${r.subject_id}`}</td>
                <td className="px-4 py-3">{r.file_type || "-"}</td>
                <td className="px-4 py-3">{r.file_url || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}