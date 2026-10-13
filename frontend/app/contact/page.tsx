"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

export default function Contact() {
  const { data: content = {}, isPending: contentLoading } = useApiQuery<
    Record<string, string>
  >(qk.siteContent, () => api.publicSiteContent());
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation({
    mutationFn: () => api.publicContact({ name, email, message: body }),
    onSuccess: (res) => {
      setMessage(res.message || "Failed to send message");
      if (res.success) {
        setName("");
        setEmail("");
        setBody("");
      }
    },
    onError: () => setMessage("Failed to send message"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    send.mutate();
  }

  return (
    <>
      <PageBanner kicker="REACH US" title="Contact" text={content.contact_intro || "Questions about admissions, fees, or campus visits? We usually reply within one working day."} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-maroon">Send a message</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-ink/15 px-4 py-2.5" />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-ink/15 px-4 py-2.5" />
            <textarea rows={5} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-ink/15 px-4 py-2.5" />
            <button disabled={send.isPending} className="rounded-full bg-maroon px-8 py-3 font-semibold text-cream hover:bg-maroon-dark transition disabled:opacity-60">{send.isPending ? "Sending..." : "Send"}</button>
            {message && <p className="text-sm text-ink/70">{message}</p>}
          </form>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="font-semibold">Address</h3>
            <p className="mt-1 text-ink/70">{contentLoading ? "Loading..." : content.address || content.contact_address || "-"}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="font-semibold">Phone & Email</h3>
            <p className="mt-1 text-ink/70">
              {contentLoading
                ? "Loading..."
                : `${content.contact_phone || content.phone || "-"} · ${content.contact_email || content.email || "-"}`}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}