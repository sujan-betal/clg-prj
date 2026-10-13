"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, hasPermission } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import RequirePermission, { usePermissionRefresh } from "@/components/RequirePermission";

export default function AdminFees() {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ course_id: "", head: "", amount: "", due_date: "" });
  usePermissionRefresh();
  const canManage = hasPermission("FEE_MANAGE");
  const queryClient = useQueryClient();

  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.adminFees, () => api.adminFees());
  const { data: courses = [] } = useApiQuery<any[]>(qk.adminCourses, () =>
    api.adminCourses()
  );

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name || `Course #${id}`;

  const save = useMutation({
    mutationFn: (payload: { course_id: string; head: string; amount: number; due_date?: string }) =>
      api.adminCreateFee(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage("Fee created.");
        setForm({ course_id: "", head: "", amount: "", due_date: "" });
        queryClient.invalidateQueries({ queryKey: qk.adminFees });
      } else {
        setMessage(res.message || "Failed to create fee");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    save.mutate({
      course_id: form.course_id,
      head: form.head,
      amount: Number(form.amount),
      due_date: form.due_date || undefined,
    });
  }

  return (
    <RequirePermission permission="FEE_VIEW">
      <h1 className="font-display text-3xl font-black text-maroon">Fees</h1>
      <p className="mt-1 text-ink/80">Fee structure, collections, and dues tracking.</p>
      {canManage && (
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-ink/70">
          Course
          <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-normal">
            <option value="">Choose a course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {courses.length === 0 && <span className="mt-1 block text-xs text-ink/50">No courses yet — create one on the Courses page first.</span>}
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Fee name
          <input required placeholder="e.g. Tuition Fee" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Amount
          <input required placeholder="0" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-ink/70">
          Due date <span className="font-normal text-ink/40">(optional)</span>
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1 block w-full rounded-lg border border-ink/15 px-4 py-2.5" />
        </label>
        <button className="rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream md:col-span-2 w-fit">Add Fee</button>
      </form>
      )}
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Head</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Due</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No fee records.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{courseName(r.course_id)}</td>
                <td className="px-4 py-3">{r.head}</td>
                <td className="px-4 py-3">{r.amount}</td>
                <td className="px-4 py-3">{r.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
