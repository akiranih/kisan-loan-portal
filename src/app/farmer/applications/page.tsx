"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Crop = { id: number; name: string; season: string; area: string };
type Income = { id: number; source: string; amount: string; frequency: string };
type ExistingLoan = { id: number; lender: string; outstanding: string; repayment: string; frequency: string; overdue: string };
type TimelineEvent = { id: string; status: string; action: string; actor: string; date: string; remarks: string };
type Application = {
  id: string; farmerId: string; createdAt: string; updatedAt: string;
  status: string; landType: string; crops: Crop[]; cropIncome: number;
  hasOtherIncome: string; incomes: Income[]; totalAnnualIncome: number;
  hasExistingLoan: string; existingLoans: ExistingLoan[];
  loanAmount: number; loanPurpose: string; bank: string; branch: string;
  sanctionedAmount: number | null; decisionReason: string | null;
  timeline: TimelineEvent[];
  farmerResponse?: string | null; reconsiderationReason?: string | null;
  offerRevision?: number;
};

const KEY = "kisanApplications";
const money = (n: number | undefined | null) => "₹" + Number(n || 0).toLocaleString("en-IN");
const dateText = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};
const badge = (status: string) => {
  if (["Disbursed", "Offer Accepted", "Ready for Disbursement"].includes(status)) return "bg-green-100 text-green-800";
  if (["Rejected", "Offer Declined"].includes(status)) return "bg-red-100 text-red-800";
  if (["Under Review", "Documentation Pending"].includes(status)) return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
};
function readAll(): Application[] {
  const raw = localStorage.getItem(KEY);
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) throw new Error("Invalid application list");
  return parsed as Application[];
}
function ApplicationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = params.get("lang") || "en";
  const [items, setItems] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reconsideration, setReconsideration] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = useCallback(() => {
    try {
      setItems(readAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setError("");
    } catch (e) { console.error(e); setError("Unable to read saved applications."); }
  }, []);
  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) reload(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

  const selected = items.find((a) => a.id === selectedId) || null;
  const offered = selected && ["Offer Made", "Approved"].includes(selected.status) &&
    typeof selected.sanctionedAmount === "number" && selected.sanctionedAmount > 0;

  function respond(response: "Accept" | "Reconsider" | "Decline") {
    if (!selected) return;
    const explanation = reconsideration.trim();
    if (response === "Reconsider" && explanation.length < 10) {
      setError("Please explain your reconsideration request (at least 10 characters)."); return;
    }
    setError(""); setMessage("");
    try {
      const all = readAll();
      const current = all.find((a) => a.id === selected.id);
      if (!current || !["Offer Made", "Approved"].includes(current.status) || !current.sanctionedAmount || current.sanctionedAmount <= 0) {
        reload(); setError("This offer is no longer available. Refresh and check the latest status."); return;
      }
      const status = response === "Accept" ? "Offer Accepted" : response === "Reconsider" ? "Reconsideration Requested" : "Offer Declined";
      const notes = response === "Accept"
        ? `Farmer accepted the bank offer of ${money(current.sanctionedAmount)}.`
        : response === "Reconsider" ? explanation : `Farmer declined the offer of ${money(current.sanctionedAmount)}.`;
      const now = new Date().toISOString();
      const event: TimelineEvent = {
        id: `EVENT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status,
        action: response === "Accept" ? "Farmer accepted loan offer" : response === "Reconsider" ? "Farmer requested offer reconsideration" : "Farmer declined loan offer",
        actor: "Farmer", date: now, remarks: notes,
      };
      const updated = all.map((a) => a.id !== current.id ? a : ({
        ...a, status, updatedAt: now,
        farmerResponse: response,
        reconsiderationReason: response === "Reconsider" ? explanation : null,
        timeline: [...(a.timeline || []), event],
      }));
      localStorage.setItem(KEY, JSON.stringify(updated));
      reload(); setReconsideration(""); setMessage(`Your response was recorded: ${status}.`);
    } catch (e) { console.error(e); setError("Could not save your response."); }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold text-green-900">🌾 My Applications</h1><p className="mt-1 text-gray-600">Track your loan request, respond to offers, and view decisions.</p></div>
          <button onClick={() => router.push(`/farmer/dashboard?lang=${lang}`)} className="rounded-xl border border-green-700 bg-white px-5 py-3 font-semibold text-green-800">← Dashboard</button>
        </header>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-gray-600">Total Applications</p><p className="text-3xl font-bold text-green-800">{items.length}</p></div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-100 p-4 text-green-800">{message}</p>}
        {items.length === 0 && <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-bold">No Applications Yet</h2><p className="mt-2 text-gray-600">Your submitted applications will appear here.</p><button onClick={() => router.push(`/farmer/apply?lang=${lang}`)} className="mt-5 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white">Apply for Loan →</button></div>}
        {items.map((a) => <section key={a.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-all text-lg font-bold">{a.id}</h2><span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge(a.status)}`}>{a.status}</span></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><p><span className="text-sm text-gray-500">Requested Amount</span><br /><strong>{money(a.loanAmount)}</strong></p><p><span className="text-sm text-gray-500">Current Bank Offer</span><br /><strong>{a.sanctionedAmount != null ? money(a.sanctionedAmount) : "Not yet offered"}</strong></p><p><span className="text-sm text-gray-500">Bank & Branch</span><br /><strong>{a.bank} — {a.branch}</strong></p><p><span className="text-sm text-gray-500">Submitted On</span><br /><strong>{dateText(a.createdAt)}</strong></p></div>
            <button onClick={() => { setSelectedId(selectedId === a.id ? null : a.id); setError(""); setMessage(""); setReconsideration(""); }} className="mt-6 w-full rounded-xl bg-green-700 py-3 font-semibold text-white">{selectedId === a.id ? "Hide Details ↑" : "View Details →"}</button>
          </div>
          {selected?.id === a.id && <div className="space-y-5 border-t bg-gray-50 p-6">
            {offered && <section className="rounded-xl border border-green-200 bg-white p-5">
              <h3 className="text-lg font-bold text-green-900">🏦 Your Bank Loan Offer</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><p>Requested amount: <strong>{money(a.loanAmount)}</strong></p><p>Bank offered: <strong className="text-green-800">{money(a.sanctionedAmount)}</strong></p></div>
              {a.decisionReason && <div className="mt-4 rounded-xl bg-gray-50 p-4"><strong>Bank's explanation</strong><p className="mt-1 whitespace-pre-wrap text-sm">{a.decisionReason}</p></div>}
              <p className="mt-4 text-sm text-gray-600">Choose how you would like to proceed. Accepting the offer starts the remaining bank formalities; it does not immediately disburse money.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={() => respond("Accept")} className="rounded-xl bg-green-700 px-4 py-3 font-semibold text-white">Accept Offer</button><button onClick={() => respond("Decline")} className="rounded-xl border border-red-400 px-4 py-3 font-semibold text-red-700">Decline Offer</button></div>
              <div className="mt-5 border-t pt-5"><label htmlFor={`reconsider-${a.id}`} className="mb-2 block font-semibold">Request Reconsideration</label><p className="mb-3 text-sm text-gray-600">Tell the bank why you need a different amount. This sends your explanation back to the bank for another decision.</p><textarea id={`reconsider-${a.id}`} rows={4} value={reconsideration} onChange={(e) => setReconsideration(e.target.value)} placeholder="Explain the amount you need and why..." className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-green-600" /><button onClick={() => respond("Reconsider")} className="mt-3 w-full rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-800">Send Reconsideration Request</button></div>
            </section>}
            {a.status === "Reconsideration Requested" && <section className="rounded-xl bg-amber-50 p-5"><strong>Reconsideration requested</strong><p className="mt-2 text-sm">The bank can review your reason and issue a revised offer or record another decision.</p>{a.reconsiderationReason && <p className="mt-2 whitespace-pre-wrap text-sm">Your message: {a.reconsiderationReason}</p>}</section>}
            {a.status === "Offer Accepted" && <section className="rounded-xl bg-green-50 p-5"><strong>Offer accepted</strong><p className="mt-2 text-sm">The bank must now verify documents and complete agreement formalities. Track the stages below.</p></section>}
            {a.status === "Documentation Pending" && <section className="rounded-xl bg-blue-50 p-5"><strong>Documentation / formalities pending</strong><p className="mt-2 text-sm">Contact the selected bank for the required documents and agreement process.</p></section>}
            {a.status === "Ready for Disbursement" && <section className="rounded-xl bg-green-50 p-5"><strong>Ready for disbursement</strong><p className="mt-2 text-sm">The bank has recorded completion of its formalities and will record the next step.</p></section>}
            {a.status === "Disbursed" && <section className="rounded-xl bg-green-50 p-5"><strong>Disbursement recorded</strong><p className="mt-2 text-sm">The loan has reached the final stage in the portal workflow.</p></section>}
            {a.status === "Rejected" && <section className="rounded-xl bg-red-50 p-5"><strong>Application rejected</strong><p className="mt-2 text-sm">{a.decisionReason || "No bank reason recorded."}</p></section>}
            {a.status === "Offer Declined" && <section className="rounded-xl bg-gray-100 p-5"><strong>Offer declined</strong><p className="mt-2 text-sm">You chose not to proceed with this offer.</p></section>}
            <section className="rounded-xl bg-white p-5"><h3 className="mb-3 text-lg font-bold">🌾 Farming Details</h3><p><strong>Land:</strong> {a.landType}</p>{(a.crops || []).map((c) => <p key={c.id} className="mt-2">{c.name} — {c.season} — {c.area} acres</p>)}</section>
            <section className="rounded-xl bg-white p-5"><h3 className="mb-3 text-lg font-bold">💰 Financial Details</h3><p><strong>Crop income:</strong> {money(a.cropIncome)}</p><p><strong>Total annual income:</strong> {money(a.totalAnnualIncome)}</p><p className="mt-3"><strong>Additional income:</strong> {a.hasOtherIncome}</p>{(a.incomes || []).map((i) => <p key={i.id} className="mt-1 text-sm">{i.source}: {money(Number(i.amount))} / {i.frequency}</p>)}<p className="mt-3"><strong>Existing loans:</strong> {a.hasExistingLoan}</p>{(a.existingLoans || []).map((l) => <div key={l.id} className="mt-2 rounded-xl bg-gray-50 p-3 text-sm"><p>{l.lender} — Outstanding {money(Number(l.outstanding))}</p><p>Repayment {money(Number(l.repayment))} / {l.frequency} • Overdue: {l.overdue}</p></div>)}</section>
            <section className="rounded-xl bg-white p-5"><h3 className="mb-3 text-lg font-bold">🕒 Application Timeline</h3><div className="space-y-3 border-l-2 border-green-500 pl-4">{(a.timeline || []).map((event) => <div key={event.id} className="rounded-xl bg-gray-50 p-4"><strong>{event.action}</strong><p className="mt-1 text-xs text-gray-500">{dateText(event.date)} • {event.actor}</p>{event.remarks && <p className="mt-2 whitespace-pre-wrap text-sm">{event.remarks}</p>}</div>)}</div></section>
          </div>}
        </section>)}
      </div>
    </main>
  );
}

export default function FarmerApplicationsPage() {
  return <Suspense fallback={<p>Loading applications...</p>}><ApplicationsContent /></Suspense>;
}
