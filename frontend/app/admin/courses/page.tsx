"use client";

import { useEffect, useState } from "react";
import { api, hasPermission } from "@/lib/api";
import RequirePermission, { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminCourses() {
  const [rows, setRows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", code: "", department_id: "", duration_years: "", total_seats: "", annual_fee: "" });
const [dept, setDept] = useState({ name: "", code: "", description: "" });
  usePermissionRefresh();
  const canManage = hasPermission("COURSE_MANAGE");

  function load() {
    setLoading(true);
    api.adminCourses().then((res) => {
      if (res.success) setRows(res.data || []);
      setLoading(false);
    });
  }

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name || `Department #${id}`;

  useEffect(() => {
    load();
    api.adminDepartments().then((res) => {
      if (res.success) setDepartments(res.data || []);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.adminCreateCourse({
      name: form.name,
      code: form.code,
      department_id: form.department_id,
      duration_years: form.duration_years ? Number(form.duration_years) : undefined,
      total_seats: form.total_seats ? Number(form.total_seats) : undefined,
      annual_fee: form.annual_fee ? Number(form.annual_fee) : undefined,
    });
    if (res.success) {
      setMessage("Course created.");
      setForm({ name: "", code: "", department_id: "", duration_years: "", total_seats: "", annual_fee: "" });
      load();
    } else {
      setMessage(res.message || "Failed to create course");
    }
  }

  async function handleDeptSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.adminCreateDepartment({
      name: dept.name,
      code: dept.code,
      description: dept.description || undefined,
    });
    if (res.success) {
      setMessage("Department created.");
      setDept({ name: "", code: "", description: "" });
      const dres = await api.adminDepartments();
      if (dres.success) setDepartments(dres.data || []);
    } else {
      setMessage(res.message || "Failed to create department");
    }
  }

  return (
    <RequirePermission permission="COURSE_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Courses</h1>
      <p className="mt-1 text-ink/80">Program catalog and seat intake.</p>

      {canManage && (
      <form onSubmit={handleDeptSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <p className="w-full text-xs font-semibold tracking-widest text-ink/50">NEW DEPARTMENT</p>
        <input required placeholder="Department name" value={dept.name} onChange={(e) => setDept({ ...dept, name: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <input required placeholder="Code" value={dept.code} onChange={(e) => setDept({ ...dept, code: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <input placeholder="Description" value={dept.description} onChange={(e) => setDept({ ...dept, description: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        <button className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">Add Department</button>
      </form>
      )}

      {canManage && (
      <p className="mt-6 text-xs font-semibold tracking-widest text-ink/50">NEW COURSE</p>
      )}
      {canManage && (
      <form onSubmit={handleSubmit} className="mt-2 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-3">
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <input required placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2.5">
          <option value="">Choose department...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input placeholder="Duration (years)" type="number" value={form.duration_years} onChange={(e) => setForm({ ...form, duration_years: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <input placeholder="Total seats" type="number" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <input placeholder="Annual fee" type="number" value={form.annual_fee} onChange={(e) => setForm({ ...form, annual_fee: e.target.value })} className="rounded-lg border border-ink/15 px-4 py-2.5" />
        <button className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream md:col-span-3 w-fit">Create Course</button>
      </form>
      )}
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Duration</th>
              <th className="px-4 py-3 text-left font-semibold">Seats</th>
              <th className="px-4 py-3 text-left font-semibold">Annual Fee</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-3">No courses.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.code}</td>
                <td className="px-4 py-3">{deptName(r.department_id)}</td>
                <td className="px-4 py-3">{r.duration_years}</td>
                <td className="px-4 py-3">{r.total_seats}</td>
                <td className="px-4 py-3">{r.annual_fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
