"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageBanner from "@/components/PageBanner";

export default function About() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.publicSiteContent().then((res) => {
      if (res.success) setContent(res.data || {});
      setLoading(false);
    });
  }, []);

  // The site-content table also holds contact details, which belong on the
  // contact page. Only render the narrative keys here.
  const NARRATIVE_KEYS = ["about_vision", "about_mission", "about_achievements", "about_legacy"];

  const cards = NARRATIVE_KEYS
    .filter((key) => content[key])
    .map((key) => [key, content[key]] as [string, string]);

  return (
    <>
      <PageBanner
        kicker="OUR STORY"
        title={content.about_title || "About AstraVidya"}
        text={content.about || ""}
      />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap gap-4 text-sm">
          {content.established && (
            <span className="rounded-full bg-cream px-4 py-2">
              Established {content.established}
            </span>
          )}
          {content.college_name && (
            <span className="rounded-full bg-cream px-4 py-2">{content.college_name}</span>
          )}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 md:grid-cols-3">
        {loading ? (
          <p className="text-sm text-ink/50">Loading...</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-ink/50">No content available yet.</p>
        ) : (
          cards.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-maroon capitalize">
                {key.replace(/^about_/, "").replace(/_/g, " ")}
              </h2>
              <p className="mt-2 text-ink/70">{value}</p>
            </div>
          ))
        )}
      </section>
    </>
  );
}