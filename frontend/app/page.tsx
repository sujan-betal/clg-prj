"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Home() {
  const [home, setHome] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.publicHome(),
      api.publicNotices(),
      api.publicEvents(),
    ]).then(([homeRes, noticeRes, eventRes]) => {
      if (homeRes.success) setHome(homeRes.data);
      if (noticeRes.success) setNotices((noticeRes.data || []).slice(0, 4));
      if (eventRes.success) setEvents((eventRes.data || []).slice(0, 4));
      setLoading(false);
    });
  }, []);

  const ticker = notices.length > 0
    ? notices.map((n) => n.title)
    : ["Welcome to AstraVidya Institute of Technology"];

  const stats = [
    { n: String(home?.stats?.students ?? "-"), l: "Students" },
    { n: String(home?.stats?.programs ?? "-"), l: "Programs" },
    { n: String(home?.stats?.faculty ?? "-"), l: "Faculty" },
    { n: String(home?.established ?? "-"), l: "Est." },
  ];

  return (
    <>
      {/* Notice ticker */}
      <div className="overflow-hidden bg-ink text-saffron-soft">
        <div className="flex w-max animate-marquee gap-12 px-6 py-2 text-sm">
          {[...ticker, ...ticker].map((n, i) => (
            <span key={i}>→ {n}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-[#93355c] text-white">
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-32">
          <p className="inline-block rounded-full bg-saffron px-4 py-1 text-xs font-bold tracking-[0.3em] text-maroon-dark md:text-sm">
            NAAC A++ · ADMISSIONS OPEN
          </p>
          <h1 className="mt-6 font-display text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
            {home?.slogan?.split(",").map((part: string, i: number) => (
              <span key={i}>
                {part.trim()}
                <br />
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/90">
            {home?.college_name || "AstraVidya Institute of Technology"} — rigorous
            academics with hands-on labs, research culture, and industry projects.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/admissions"
              className="rounded-full bg-saffron px-8 py-3 text-center font-semibold text-maroon-dark shadow-[0_8px_30px_rgba(240,168,50,0.45)] hover:-translate-y-0.5 hover:brightness-110 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/courses"
              className="rounded-full border border-cream/40 px-8 py-3 text-center hover:-translate-y-0.5 hover:border-saffron hover:text-saffron transition"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="dot-grid">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-14 md:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-b-4 border-saffron/30 bg-white p-5 text-center shadow-sm">
                <p className="font-display text-4xl font-black text-ink/20">-</p>
                <p className="mt-1 text-sm tracking-widest text-ink/40">Loading</p>
              </div>
            ))
          ) : (
            stats.map((s) => (
              <div key={s.l} className="rounded-2xl border-b-4 border-saffron bg-white p-5 text-center shadow-sm">
                <p className="font-display text-4xl font-black text-maroon">{s.n}</p>
                <p className="mt-1 text-sm tracking-widest text-ink/60">{s.l}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-3xl font-bold">Latest Notices & Events</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[...notices.map((n) => ({ title: n.title, tag: "Notice" })),
            ...events.map((e) => ({ title: e.title, tag: "Event" }))].length === 0 ? (
            <p className="text-sm text-ink/50">Nothing published yet.</p>
          ) : (
            [...notices.map((n) => ({ title: n.title, tag: "Notice" })),
             ...events.map((e) => ({ title: e.title, tag: "Event" }))].map((h, i) => (
              <div
                key={i}
                className="rounded-2xl border-l-4 border-maroon bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition"
              >
                <span className="rounded-full bg-saffron-soft px-3 py-0.5 text-xs font-semibold text-maroon">
                  {h.tag}
                </span>
                <p className="mt-3 font-semibold">{h.title}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal to-[#0b5252] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-black md:text-5xl">
            Your future starts here.
          </h2>
          <Link
            href="/admissions"
            className="rounded-full bg-saffron px-10 py-3.5 font-semibold text-maroon-dark shadow-[0_8px_30px_rgba(240,168,50,0.4)] hover:-translate-y-0.5 hover:brightness-110 transition"
          >
            Begin Your Application
          </Link>
        </div>
      </section>
    </>
  );
}