"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

export default function Events() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.events, () =>
    api.publicEvents()
  );

  return (
    <>
      <PageBanner kicker="WHAT'S ON" title="Events" text="From fests to fairs — there is always something happening on campus." />
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-14">
        {isPending ? (
          <p className="text-sm text-ink/50">Loading events...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">No events scheduled yet.</p>
        ) : rows.map((e) => (
          <div key={e.id} className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center sm:gap-5">
            <span className="w-fit rounded-xl bg-maroon px-4 py-2 font-display font-bold text-saffron">
              {e.event_date ? new Date(e.event_date).toLocaleDateString() : "TBA"}
            </span>
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-ink/60">{e.description || ""}</p>
              {e.venue && <p className="text-xs text-ink/40">{e.venue}</p>}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}