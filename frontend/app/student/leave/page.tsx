"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

type LeaveRequest = {
  id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  status: string;
};

export default function StudentLeave() {
  const queryClient = useQueryClient();
  const { data: rows = [], isPending } = useApiQuery<LeaveRequest[]>(qk.studentLeave, () =>
    api.studentLeave()
  );
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ from_date: "", to_date: "", reason: "" });

  const apply = useMutation({
    mutationFn: (payload: { from_date: string; to_date: string; reason?: string }) =>
      api.studentApplyLeave(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage("Leave applied.");
        setForm({ from_date: "", to_date: "", reason: "" });
      } else {
        setMessage(res.message || "Failed to apply leave");
      }
      queryClient.invalidateQueries({ queryKey: qk.studentLeave });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    apply.mutate({
      from_date: form.from_date,
      to_date: form.to_date,
      reason: form.reason || undefined,
    });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Leave</h1>
      <p className="mt-1 text-ink/80">Apply for leave and track requests.</p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm md:grid-cols-3"
      >
        <input
          required
          placeholder="From"
          type="date"
          value={form.from_date}
          onChange={(e) => setForm({ ...form, from_date: e.target.value })}
          className="rounded-lg border border-ink/15 px-4 py-2.5"
        />
        <input
          required
          placeholder="To"
          type="date"
          value={form.to_date}
          onChange={(e) => setForm({ ...form, to_date: e.target.value })}
          className="rounded-lg border border-ink/15 px-4 py-2.5"
        />
        <input
          placeholder="Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="rounded-lg border border-ink/15 px-4 py-2.5"
        />
        <button
          disabled={apply.isPending}
          className="w-fit rounded-full bg-maroon px-6 py-2.5 font-semibold text-cream md:col-span-3 disabled:opacity-60"
        >
          {apply.isPending ? "Applying..." : "Apply Leave"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">From</th>
              <th className="px-4 py-3 text-left font-semibold">To</th>
              <th className="px-4 py-3 text-left font-semibold">Reason</th>
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
                <td colSpan={4} className="px-4 py-3">No leave requests.</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                  <td className="px-4 py-3">{r.from_date}</td>
                  <td className="px-4 py-3">{r.to_date}</td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}