"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

export default function StudentCertificates() {
  const { data: rows = [], isPending } = useApiQuery<any[]>(qk.studentCertificates, () =>
    api.studentCertificates()
  );

  const columns = [
    { key: "title", label: "Title" },
    { key: "certificate_no", label: "Certificate No" },
    { key: "issued_on", label: "Issued On", format: (v: any) => (v ? new Date(v).toLocaleDateString() : "-") },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Certificates</h1>
      <p className="mt-1 text-ink/80">Issued certificates and documents.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
<thead>
            <tr className="bg-maroon text-cream">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={3} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-3">No certificates.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.format ? c.format(r[c.key]) : String(r[c.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
