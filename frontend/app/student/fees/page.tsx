"use client";

import { api } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";

type FeesData = {
  fee_structure?: any[];
  payments?: any[];
  total_due?: number;
  total_paid?: number;
  balance?: number;
};

export default function StudentFees() {
  const { data, isPending } = useApiQuery<FeesData>(qk.studentFees, () => api.studentFees());

  const feeStructure = data?.fee_structure || [];
  const payments = data?.payments || [];
  const totals = {
    due: data?.total_due ?? 0,
    paid: data?.total_paid ?? 0,
    balance: data?.balance ?? 0,
  };

  function renderTable(rows: any[], label: string, amountLabel: string, dateLabel: string) {
    return (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left font-semibold">Head</th>
              <th className="px-4 py-3 text-left font-semibold">{amountLabel}</th>
              <th className="px-4 py-3 text-left font-semibold">{dateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={3} className="px-4 py-3">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-3">No {label}.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">
                  {r.head || r.title}
                  {r.receipt_no && <span className="ml-2 text-xs text-ink/40">{r.receipt_no}</span>}
                  {r.payment_mode && <span className="ml-2 text-xs text-ink/40">{r.payment_mode}</span>}
                </td>
                <td className="px-4 py-3">{r.amount}</td>
                <td className="px-4 py-3">
                  {r.due_date || r.paid_on || r.paid_at || r.date
                    ? new Date(r.due_date || r.paid_on).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Fees</h1>
      <p className="mt-1 text-ink/80">Your fee structure and payment history.</p>
      {!isPending && feeStructure.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="font-display text-2xl font-black text-maroon">{totals.due}</p>
            <p className="text-xs tracking-widest text-ink/50">TOTAL</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="font-display text-2xl font-black text-maroon">{totals.paid}</p>
            <p className="text-xs tracking-widest text-ink/50">PAID</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="font-display text-2xl font-black text-maroon">{totals.balance}</p>
            <p className="text-xs tracking-widest text-ink/50">BALANCE</p>
          </div>
        </div>
      )}
      <h2 className="mt-8 font-display text-xl font-bold text-maroon">Fee Structure</h2>
      {renderTable(feeStructure, "fee entries", "Amount", "Due")}
      <h2 className="mt-8 font-display text-xl font-bold text-maroon">Payments</h2>
      {renderTable(payments, "payments", "Amount", "Paid On")}
    </>
  );
}
