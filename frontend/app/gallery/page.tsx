"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PageBanner from "@/components/PageBanner";

export default function Gallery() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.gallery, () =>
    api.publicGallery()
  );

  return (
    <>
      <PageBanner kicker="CAMPUS LIFE" title="Gallery" text="A glimpse of our labs, fests, and the everyday life at AstraVidya." />
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-14 md:grid-cols-3">
        {isPending ? (
          <p className="text-sm text-ink/50">Loading gallery...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/50">No photos yet.</p>
        ) : rows.map((g) => (
          <div key={g.id} className="h-44 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            {g.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-maroon to-maroon-dark text-cream/80 font-display">
                {g.title}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}