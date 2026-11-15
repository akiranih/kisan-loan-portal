
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAssessmentSnapshot,
  inputFingerprint,
  assessmentAuditText,
  type AssessmentSnapshot,
} from "@/lib/assessmentAudit";
import type { LoanApplication } from "@/lib/creditAssessment";

type Crop = {
  id: number;
  name: string;
  season: string;
  area: string;
};

type Income = {
  id: number;
  source: string;
  amount: string;
  frequency: string;
};

type ExistingLoan = {
  id: number;
  lender: string;
  outstanding: string;
  repayment: string;
  frequency: string;
  overdue: string;
};

type TimelineEvent = {
  id: string;
  status: string;
  action: string;
  actor: string;
  date: string;
  remarks: string;
};

type Application = {
  id: string;
  farmerId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  landType: string;
  crops: Crop[];
  cropIncome: number;
  hasOtherIncome: string;
  incomes: Income[];
  totalAnnualIncome: number;
  hasExistingLoan: string;
  existingLoans: ExistingLoan[];
  loanAmount: number;
  loanPurpose: string;
  bank: string;
  branch: string;
  sanctionedAmount: number | null;
  decisionReason: string | null;
  timeline: TimelineEvent[];
  farmerResponse?: string | null;
  reconsiderationReason?: string | null;
  offerRevision?: number;
  assessmentSnapshot?: AssessmentSnapshot | null;
};

const KEY = "kisanApplications";

const BANKS = [
  "Demo Rural Bank A",
  "Demo Cooperative Bank B",
  "Demo Agricultural Bank C",
];

const FINAL = [
  "Offer Declined",
  "Rejected",
  "Disbursed",
];

const money = (n: number | null | undefined) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

function dateText(s: string) {
  const d = new Date(s);

  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function badge(status: string) {
  if (
    [
      "Disbursed",
      "Offer Accepted",
      "Ready for Disbursement",
    ].includes(status)
  ) {
    return "bg-green-100 text-green-800";
  }

  if (
    ["Rejected", "Offer Declined"].includes(status)
  ) {
    return "bg-red-100 text-red-800";
  }

  if (
    ["Under Review", "Documentation Pending"].includes(
      status
    )
  ) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-amber-100 text-amber-800";
}

const input =
  "w-full rounded-xl border border-gray-300 bg-white " +
  "px-4 py-3 outline-none focus:border-green-600";

function readAll(): Application[] {
  const raw = localStorage.getItem(KEY);

  const parsed: unknown = raw
    ? JSON.parse(raw)
    : [];

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Stored application data is not a list"
    );
  }

  return parsed as Application[];
}

export default function BankDashboard() {
  const router = useRouter();

  const [bank, setBank] = useState(BANKS[1]);
  const [items, setItems] = useState<Application[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [decision, setDecision] =
    useState("Under Review");

  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [savedSnapshot, setSavedSnapshot] =
    useState<AssessmentSnapshot | null>(null);

  const reload = useCallback(() => {
    try {
      setItems(
        readAll().sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
    } catch (e) {
      console.error(e);
      setError(
        "Could not load applications from this browser."
      );
    }
  }, []);

  useEffect(() => {
    reload();

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) reload();
    };

    window.addEventListener("storage", onStorage);

    return () =>
      window.removeEventListener("storage", onStorage);
  }, [reload]);

  const bankItems = items.filter(
    (a) => a.bank === bank
  );

  const list = bankItems.filter(
    (a) =>
      (filter === "All" || a.status === filter) &&
      (!search.trim() ||
        `${a.id} ${a.branch}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()))
  );

  const selected =
    bankItems.find((a) => a.id === selectedId) || null;

  function choose(a: Application) {
    setSelectedId(a.id);
    setSavedSnapshot(
      getAssessmentSnapshot(a.id)
    );

    setRemarks("");
    setAmount("");
    setError("");
    setMessage("");

    setDecision(
      a.status === "Reconsideration Requested"
        ? "Offer Made"
        : "Under Review"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function record(
    status: string,
    note: string,
    approved?: number
  ) {
    if (!selected) return;

    setError("");
    setMessage("");

    const needsAssessment = [
      "Offer Made",
      "Rejected",
    ].includes(status);

    let snapshot: AssessmentSnapshot | null = null;

    if (needsAssessment) {
      snapshot = getAssessmentSnapshot(selected.id);

      if (
        !snapshot ||
        snapshot.inputFingerprint !==
          inputFingerprint(selected as LoanApplication)
      ) {
        setError(
          "Save a current Credit Risk Assessment before " +
            "making an offer or rejecting this application."
        );
        return;
      }

      if (!snapshot.results.reconciliationPassed) {
        setError(
          "Assessment calculation verification did not pass."
        );
        return;
      }
    }

    try {
      const currentItems = readAll();

      const current = currentItems.find(
        (a) => a.id === selected.id
      );

      if (!current || current.bank !== bank) {
        throw new Error(
          "Application not found for bank"
        );
      }

      if (current.status !== selected.status) {
        reload();

        setError(
          "Application status changed. " +
            "Please reopen it and try again."
        );
        return;
      }

      const now = new Date().toISOString();

      const action: Record<string, string> = {
        "Under Review": "Bank started review",
        "More Information Required":
          "Bank requested more information",
        "Offer Made": "Bank offered a loan amount",
        Rejected: "Application rejected",
        "Documentation Pending":
          "Documentation requested",
        "Ready for Disbursement":
          "Documentation completed",
        Disbursed: "Disbursement recorded",
      };

      const updated = currentItems.map((a) => {
        if (a.id !== selected.id) {
          return a;
        }

        const history: TimelineEvent = {
          id:
            `EVENT-${Date.now()}-` +
            Math.random().toString(36).slice(2, 7),
          status,
          action: action[status] || status,
          actor: `Bank Officer - ${bank}`,
          date: now,
          remarks: snapshot
            ? `${note}\n\n${assessmentAuditText(snapshot)}`
            : note,
        };

        return {
          ...a,
          status,
          updatedAt: now,

          sanctionedAmount:
            status === "Offer Made"
              ? approved!
              : a.sanctionedAmount,

          decisionReason: [
            "Offer Made",
            "Rejected",
            "More Information Required",
          ].includes(status)
            ? note
            : a.decisionReason,

          farmerResponse:
            status === "Offer Made"
              ? null
              : a.farmerResponse,

          reconsiderationReason:
            status === "Offer Made"
              ? null
              : a.reconsiderationReason,

          offerRevision:
            status === "Offer Made"
              ? (a.offerRevision || 0) + 1
              : a.offerRevision || 0,

          assessmentSnapshot:
            snapshot ||
            a.assessmentSnapshot ||
            null,

          timeline: [
            ...(a.timeline || []),
            history,
          ],
        };
      });

      localStorage.setItem(
        KEY,
        JSON.stringify(updated)
      );

      reload();

      setSelectedId(null);
      setRemarks("");
      setAmount("");

      setMessage(
        `Application ${selected.id} updated to ${status}.`
      );
    } catch (e) {
      console.error(e);
      setError("Could not save the bank action.");
    }
  }

  function saveDecision() {
    if (!selected) return;

    const note = remarks.trim();

    if (
      decision === "Under Review" &&
      selected.status !== "Submitted" &&
      selected.status !== "More Information Required"
    ) {
      setError(
        "Under Review is available for submitted " +
          "applications or those awaiting information."
      );
      return;
    }

    if (
      ["Rejected", "Offer Made"].includes(decision) &&
      note.length < 20
    ) {
      setError(
        "For a loan offer or rejection, write at least " +
          "20 characters explaining the bank decision."
      );
      return;
    }

    if (
      decision === "More Information Required" &&
      !note
    ) {
      setError(
        "Please explain the bank's request."
      );
      return;
    }

    if (decision === "Offer Made") {
      const offered = Number(amount);

      if (
        amount.trim() === "" ||
        !Number.isFinite(offered) ||
        offered <= 0 ||
        offered > selected.loanAmount
      ) {
        setError(
          "Offer must be greater than zero and no " +
            "more than the amount requested."
        );
        return;
      }

      record(decision, note, offered);
      return;
    }

    record(
      decision,
      note || "Application taken for review."
    );
  }

  function canDecide(status: string) {
    return [
      "Submitted",
      "Under Review",
      "More Information Required",
      "Reconsideration Requested",
    ].includes(status);
  }

  function nextBankAction() {
    if (!selected) return null;

    if (selected.status === "Offer Accepted") {
      return {
        status: "Documentation Pending",
        label: "Request Documents / Formalities",
        note:
          "Bank requested documentation and " +
          "agreement formalities.",
      };
    }

    if (selected.status === "Documentation Pending") {
      return {
        status: "Ready for Disbursement",
        label: "Mark Documentation Completed",
        note:
          "Bank recorded completion of required " +
          "documentation and agreement formalities.",
      };
    }

    if (
      selected.status === "Ready for Disbursement"
    ) {
      return {
        status: "Disbursed",
        label: "Record Disbursement",
        note:
          "Bank recorded loan disbursement " +
          "for this prototype.",
      };
    }

    return null;
  }

  const bankAction = nextBankAction();

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-900">
              🏦 Bank Officer Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Review applications, make offers, and
              track loan processing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/bank/assessment")
              }
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
            >
              Assess Credit Risk
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/bank/grievances")
              }
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
            >
              View Grievances
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-green-700 bg-white px-5 py-3 font-semibold text-green-800"
            >
              ← Home
            </button>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <label
            htmlFor="bank"
            className="mb-2 block font-semibold"
          >
            Select Bank
          </label>

          <select
            id="bank"
            className={input}
            value={bank}
            onChange={(e) => {
              setBank(e.target.value);
              setSelectedId(null);
              setError("");
              setMessage("");
            }}
          >
            {BANKS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Total", bankItems.length],
            [
              "Awaiting Review",
              bankItems.filter((a) =>
                [
                  "Submitted",
                  "Under Review",
                  "Reconsideration Requested",
                ].includes(a.status)
              ).length,
            ],
            [
              "Awaiting Farmer",
              bankItems.filter((a) =>
                [
                  "Offer Made",
                  "Approved",
                ].includes(a.status)
              ).length,
            ],
            [
              "Processed",
              bankItems.filter((a) =>
                FINAL.includes(a.status)
              ).length,
            ],
          ].map(([label, count]) => (
            <div
              key={String(label)}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-600">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {count}
              </p>
            </div>
          ))}
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-xl bg-green-100 p-4 text-green-800"
          >
            {message}
          </p>
        )}

        {selected ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setError("");
              }}
              className="font-semibold text-green-800"
            >
              ← Back to Applications
            </button>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="break-all text-xl font-bold">
                  {selected.id}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${badge(
                    selected.status
                  )}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <p>
                  <span className="text-gray-500">
                    Requested amount
                  </span>
                  <strong className="block">
                    {money(selected.loanAmount)}
                  </strong>
                </p>

                <p>
                  <span className="text-gray-500">
                    Current bank offer
                  </span>
                  <strong className="block">
                    {selected.sanctionedAmount != null
                      ? money(selected.sanctionedAmount)
                      : "Not offered"}
                  </strong>
                </p>

                <p>
                  <span className="text-gray-500">
                    Branch
                  </span>
                  <strong className="block">
                    {selected.branch}
                  </strong>
                </p>

                <p>
                  <span className="text-gray-500">
                    Submitted
                  </span>
                  <strong className="block">
                    {dateText(selected.createdAt)}
                  </strong>
                </p>

                <p>
                  <span className="text-gray-500">
                    Purpose
                  </span>
                  <strong className="block">
                    {selected.loanPurpose}
                  </strong>
                </p>

                <p>
                  <span className="text-gray-500">
                    Farmer response
                  </span>
                  <strong className="block">
                    {selected.farmerResponse ||
                      "Pending / Not recorded"}
                  </strong>
                </p>
              </div>

              {selected.reconsiderationReason && (
                <div className="mt-5 rounded-xl bg-amber-50 p-4">
                  <strong>
                    Farmer's reconsideration request
                  </strong>
                  <p className="mt-2 whitespace-pre-wrap">
                    {selected.reconsiderationReason}
                  </p>
                </div>
              )}

              {selected.decisionReason && (
                <p className="mt-4 text-sm">
                  <strong>
                    Previous bank remarks:
                  </strong>{" "}
                  {selected.decisionReason}
                </p>
              )}

              {selected.assessmentSnapshot && (
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <strong>
                    Assessment attached to prior bank decision
                  </strong>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {assessmentAuditText(
                      selected.assessmentSnapshot
                    )}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                🌾 Farming and Financial Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <p>
                  <strong>Land:</strong>{" "}
                  {selected.landType}
                </p>
                <p>
                  <strong>Crop income:</strong>{" "}
                  {money(selected.cropIncome)}
                </p>
                <p>
                  <strong>Annual total income:</strong>{" "}
                  {money(selected.totalAnnualIncome)}
                </p>
                <p>
                  <strong>Existing loans:</strong>{" "}
                  {selected.hasExistingLoan}
                </p>
              </div>

              <h4 className="mt-5 font-bold">
                Crops
              </h4>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {(selected.crops || []).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    {c.name} • {c.season} • {c.area} acres
                  </div>
                ))}
              </div>

              {(selected.incomes || []).length > 0 && (
                <>
                  <h4 className="mt-5 font-bold">
                    Other income
                  </h4>

                  {selected.incomes.map((i) => (
                    <p key={i.id} className="mt-2">
                      {i.source}:{" "}
                      {money(Number(i.amount))} /{" "}
                      {i.frequency}
                    </p>
                  ))}
                </>
              )}

              {(selected.existingLoans || []).length >
                0 && (
                <>
                  <h4 className="mt-5 font-bold">
                    Existing borrowing
                  </h4>

                  {selected.existingLoans.map((l) => (
                    <div
                      key={l.id}
                      className="mt-2 rounded-xl bg-gray-50 p-4"
                    >
                      <p>
                        {l.lender}: outstanding{" "}
                        {money(Number(l.outstanding))}
                      </p>

                      <p>
                        Repayment{" "}
                        {money(Number(l.repayment))} /{" "}
                        {l.frequency} • Overdue:{" "}
                        {l.overdue}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                🕒 Application History
              </h3>

              <div className="space-y-3 border-l-2 border-green-500 pl-4">
                {(selected.timeline || []).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <strong>{event.action}</strong>
                    <p className="text-xs text-gray-500">
                      {dateText(event.date)} •{" "}
                      {event.actor}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {event.remarks}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                Bank Action
              </h3>

              {canDecide(selected.status) ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-green-50 p-4 text-sm">
                    <strong>
                      Decision-support assessment:
                    </strong>{" "}
                    {savedSnapshot &&
                    savedSnapshot.inputFingerprint ===
                      inputFingerprint(
                        selected as LoanApplication
                      )
                      ? `Saved ${dateText(
                          savedSnapshot.savedAt
                        )} — ${
                          savedSnapshot.financialResult
                        }`
                      : "No current assessment saved"}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/bank/assessment?id=${encodeURIComponent(
                            selected.id
                          )}`
                        )
                      }
                      className="mt-3 block rounded-lg bg-green-700 px-4 py-2 font-semibold text-white"
                    >
                      Open / Save Credit Assessment
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="decision"
                      className="mb-2 block font-semibold"
                    >
                      Decision
                    </label>

                    <select
                      id="decision"
                      className={input}
                      value={decision}
                      onChange={(e) =>
                        setDecision(e.target.value)
                      }
                    >
                      {selected.status !==
                        "Reconsideration Requested" && (
                        <option value="Under Review">
                          Under Review
                        </option>
                      )}

                      <option value="Offer Made">
                        Make / Revise Loan Offer
                      </option>

                      <option value="More Information Required">
                        Request More Information
                      </option>

                      <option value="Rejected">
                        Reject Application
                      </option>
                    </select>
                  </div>

                  {decision === "Offer Made" && (
                    <div>
                      <label
                        htmlFor="amount"
                        className="mb-2 block font-semibold"
                      >
                        Offered Amount (₹)
                      </label>

                      <input
                        id="amount"
                        type="number"
                        min="1"
                        max={selected.loanAmount}
                        step="1"
                        value={amount}
                        onChange={(e) =>
                          setAmount(e.target.value)
                        }
                        placeholder={`Maximum ${money(
                          selected.loanAmount
                        )}`}
                        className={input}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="remarks"
                      className="mb-2 block font-semibold"
                    >
                      {decision === "Under Review"
                        ? "Remarks (optional)"
                        : "Reason / Explanation *"}
                    </label>

                    <textarea
                      id="remarks"
                      rows={4}
                      className={input}
                      value={remarks}
                      onChange={(e) =>
                        setRemarks(e.target.value)
                      }
                      placeholder="Explain the bank's assessment or reason"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={saveDecision}
                    className="w-full rounded-xl bg-green-700 px-6 py-4 font-bold text-white"
                  >
                    Save Bank Action
                  </button>
                </div>
              ) : bankAction ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    The farmer accepted the loan offer.
                    Record the next processing stage.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      record(
                        bankAction.status,
                        bankAction.note
                      )
                    }
                    className="w-full rounded-xl bg-green-700 px-6 py-4 font-bold text-white"
                  >
                    {bankAction.label}
                  </button>
                </div>
              ) : selected.status === "Offer Made" ||
                selected.status === "Approved" ? (
                <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
                  Waiting for the farmer to accept, request
                  reconsideration, or decline the loan offer.
                </p>
              ) : (
                <p className="rounded-xl bg-gray-50 p-4 text-gray-700">
                  No further action is available for the
                  current status.
                </p>
              )}
            </section>
          </div>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap justify-between gap-3">
              <h2 className="text-xl font-bold">
                Loan Applications
              </h2>

              <button
                type="button"
                onClick={reload}
                className="rounded-xl border border-green-700 px-4 py-2 text-green-800"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <input
                className={input}
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search application ID or branch"
              />

              <select
                className={input}
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option value="All">
                  All Statuses
                </option>

                {[
                  "Submitted",
                  "Under Review",
                  "More Information Required",
                  "Offer Made",
                  "Approved",
                  "Reconsideration Requested",
                  "Offer Accepted",
                  "Offer Declined",
                  "Documentation Pending",
                  "Ready for Disbursement",
                  "Disbursed",
                  "Rejected",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {list.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-8 text-center text-gray-600">
                No applications found for this bank and filter.
              </p>
            ) : (
              <div className="space-y-4">
                {list.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <strong className="break-all">
                        {a.id}
                      </strong>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(
                          a.status
                        )}`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <p>
                        Requested:{" "}
                        <strong>
                          {money(a.loanAmount)}
                        </strong>
                      </p>

                      <p>
                        Branch:{" "}
                        <strong>{a.branch}</strong>
                      </p>

                      <p>
                        Annual income:{" "}
                        <strong>
                          {money(a.totalAnnualIncome)}
                        </strong>
                      </p>

                      <p>
                        Submitted:{" "}
                        <strong>
                          {dateText(a.createdAt)}
                        </strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => choose(a)}
                      className="mt-5 w-full rounded-xl bg-green-700 py-3 font-semibold text-white"
                    >
                      View / Process Application →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
