"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

export default function Admissions() {
  const { data: courses = [] } = useApiQuery<any[]>(qk.courses, () => api.publicCourses());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [course_id, setCourseId] = useState("");
  const [message, setMessage] = useState("");

  const apply = useMutation({
    mutationFn: () =>
      api.publicApply({
        applicant_name: name,
        email,
        phone,
        course_id: course_id || undefined,
      }),
    onSuccess: (res) => {
      if (res.success) {
        setMessage("Application submitted successfully.");
        setName("");
        setEmail("");
        setPhone("");
        setCourseId("");
      } else {
        setMessage(res.message || "Failed to submit application");
      }
    },
    onError: () => setMessage("Failed to submit application"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    apply.mutate();
  }

  return (
    <>
      <PageBanner
        kicker="JOIN US"
        title="Admissions"
        text="Applications for under-graduate and post-graduate programs are open. Admissions are need-blind for merit seats and supported by scholarships."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="font-display text-3xl font-bold text-maroon">Apply Online</h2>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-ink/15 px-4 py-2.5" />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-ink/15 px-4 py-2.5" />
            <input required placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-ink/15 px-4 py-2.5" />
            <select value={course_id} onChange={(e) => setCourseId(e.target.value)} className="rounded-lg border border-ink/15 px-4 py-2.5">
              <option value="">Select program</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button disabled={apply.isPending} className="rounded-full bg-maroon px-8 py-3 font-semibold text-cream hover:bg-maroon-dark transition disabled:opacity-60">
            {apply.isPending ? "Submitting..." : "Submit Application"}
          </button>
          {message && <p className="text-sm text-ink/70">{message}</p>}
        </form>
      </section>
    </>
  );
}