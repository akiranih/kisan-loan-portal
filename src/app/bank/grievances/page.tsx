
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HistoryEvent = {
  id: string;
  actor: string;
  action: string;
  remarks: string;
  date: string;
};

type Grievance = {
  id: string;
  applicationId: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolution: string | null;
  timeline: HistoryEvent[];
  bankQuery?: string | null;
  bankResponse?: string | null;
};

type Application = {
  id: string;
  bank: string;
  branch: string;
  status: string;
  loanAmount: number;
  sanctionedAmount: number | null;
  decisionReason?: string | null;
};

const G_KEY = "kisanGrievances";
const A_KEY = "kisanApplications";

const defaultBanks = [
  "Demo Rural Bank A",
  "Demo Cooperative Bank B",
  "Demo Agricultural Bank C",
];

function readData<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  const value: unknown = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(value)) {
    throw new Error("Invalid saved data");
  }

  return value as T[];
}

function eventId() {
  return (
    "EV-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function money(value: number | null | undefined) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function statusStyle(status: string) {
  if (status === "Awaiting Bank Response") {
    return "bg-orange-100 text-orange-800";
  }
  if (status === "Bank Responded") {
    return "bg-purple-100 text-purple-800";
  }
  if (status === "Resolved" || status === "Closed") {
    return "bg-green-100 text-green-800";
  }
  return "bg-blue-100 text-blue-800";
}

export default function BankGrievancesPage() {
  const router = useRouter();

  const [selectedBank, setSelectedBank] = useState(
    "Demo Cooperative Bank B"
  );

  const [applications, setApplications] = useState<Application[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white " +
    "px-4 py-3 text-gray-900 outline-none focus:border-green-600";

  const loadData = useCallback(() => {
    try {
      setApplications(readData<Application>(A_KEY));
      setGrievances(readData<Grievance>(G_KEY));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load bank grievance records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const onStorage = (event: StorageEvent) => {
      if (event.key === G_KEY || event.key === A_KEY) {
        loadData();
      }
    };

    const onFocus = () => loadData();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData]);

  const banks = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultBanks,
          ...applications.map((a) => a.bank).filter(Boolean),
        ])
      ).sort(),
    [applications]
  );

  const applicationMap = useMemo(
    () => new Map(applications.map((a) => [a.id, a])),
    [applications]
  );

  // Show only complaints linked to this bank's applications.
  const bankGrievances = grievances
    .filter((g) => {
      if (!g.applicationId) return false;
      const app = applicationMap.get(g.applicationId);
      return app?.bank === selectedBank;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );

  const visible = bankGrievances.filter((g) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [g.id, g.subject, g.category, g.applicationId || ""]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return (
      matchesSearch &&
      (statusFilter === "All" || g.status === statusFilter)
    );
  });

  const selected =
    bankGrievances.find((g) => g.id === selectedId) || null;

  const linkedApplication =
    selected?.applicationId
      ? applicationMap.get(selected.applicationId)
      : undefined;

  const awaitingCount = bankGrievances.filter(
    (g) => g.status === "Awaiting Bank Response"
  ).length;

  const respondedCount = bankGrievances.filter(
    (g) => g.status === "Bank Responded"
  ).length;

  const closedCount = bankGrievances.filter((g) =>
    ["Resolved", "Closed"].includes(g.status)
  ).length;

  function openComplaint(g: Grievance) {
    setSelectedId(g.id);
    setResponse("");
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitBankResponse() {
    if (!selected || !linkedApplication) return;

    setError("");
    setMessage("");

    if (response.trim().length < 20) {
      setError(
        "Please provide an explanation of at least 20 characters."
      );
      return;
    }

    try {
      const allGrievances = readData<Grievance>(G_KEY);
      const freshApplications = readData<Application>(A_KEY);

      const current = allGrievances.find(
        (g) => g.id === selected.id
      );

      const currentApplication = freshApplications.find(
        (a) => a.id === current?.applicationId
      );

      if (!current || current.status !== "Awaiting Bank Response") {
        setError(
          "This complaint is no longer awaiting a bank response."
        );
        loadData();
        return;
      }

      if (
        !currentApplication ||
        currentApplication.bank !== selectedBank
      ) {
        setError("This complaint is not linked to the selected bank.");
        return;
      }

      const now = new Date().toISOString();
      const writtenResponse = response.trim();

      const event: HistoryEvent = {
        id: eventId(),
        actor: "Bank Officer - " + selectedBank,
        action: "Bank Explanation Submitted",
        remarks: writtenResponse,
        date: now,
      };

      const updated = allGrievances.map((g) =>
        g.id === current.id
          ? {
              ...g,
              status: "Bank Responded",
              updatedAt: now,
              bankResponse: writtenResponse,
              timeline: [...(g.timeline || []), event],
            }
          : g
      );

      localStorage.setItem(G_KEY, JSON.stringify(updated));

      setResponse("");
      setSelectedId(null);
      setMessage(
        "Bank explanation submitted. The complaint is now awaiting government review."
      );
      loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to submit the bank explanation.");
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-900 sm:text-3xl">
              🏦 Bank Grievances
            </h1>
            <p className="mt-2 text-gray-600">
              Respond to government queries concerning loan complaints.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/bank/dashboard")}
            className="rounded-xl border bg-white px-5 py-3 font-semibold text-green-800"
          >
            ← Bank Dashboard
          </button>
        </header>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-xl bg-green-100 p-4 text-green-800">
            {message}
          </p>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <label
            htmlFor="bankSelection"
            className="mb-2 block font-semibold"
          >
            Select Bank
          </label>

          <select
            id="bankSelection"
            className={inputClass}
            value={selectedBank}
            onChange={(e) => {
              setSelectedBank(e.target.value);
              setSelectedId(null);
              setError("");
              setMessage("");
            }}
          >
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Total Linked Complaints", bankGrievances.length],
            ["Awaiting Your Response", awaitingCount],
            ["Responses Submitted", respondedCount],
            ["Resolved / Closed", closedCount],
          ].map(([title, count]) => (
            <div key={title} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">{title}</p>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {count}
              </p>
            </div>
          ))}
        </section>

        {selected ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="font-semibold text-green-800"
            >
              ← Back to Complaints
            </button>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="break-all text-xl font-bold">
                  {selected.id}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <p><strong>Subject:</strong> {selected.subject}</p>
                <p><strong>Category:</strong> {selected.category}</p>
                <p>
                  <strong>Application:</strong>{" "}
                  {selected.applicationId}
                </p>
                <p><strong>Submitted:</strong> {formatDate(selected.createdAt)}</p>
                <p className="whitespace-pre-wrap">
                  <strong>Farmer Complaint:</strong> {selected.description}
                </p>
              </div>

              {linkedApplication && (
                <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm">
                  <h3 className="mb-3 font-bold">
                    Related Loan Application
                  </h3>
                  <p><strong>Bank:</strong> {linkedApplication.bank}</p>
                  <p><strong>Branch:</strong> {linkedApplication.branch}</p>
                  <p>
                    <strong>Application Status:</strong>{" "}
                    {linkedApplication.status}
                  </p>
                  <p>
                    <strong>Requested:</strong>{" "}
                    {money(linkedApplication.loanAmount)}
                  </p>
                  <p>
                    <strong>Offered:</strong>{" "}
                    {linkedApplication.sanctionedAmount == null
                      ? "Not yet offered"
                      : money(linkedApplication.sanctionedAmount)}
                  </p>
                  {linkedApplication.decisionReason && (
                    <p className="mt-2">
                      <strong>Original Bank Reason:</strong>{" "}
                      {linkedApplication.decisionReason}
                    </p>
                  )}
                </div>
              )}
            </section>

            {selected.bankQuery && (
              <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-3 text-lg font-bold text-orange-900">
                  Government Query to Bank
                </h3>
                <p className="whitespace-pre-wrap text-sm">
                  {selected.bankQuery}
                </p>
              </section>
            )}

            {selected.bankResponse && (
              <section className="rounded-2xl bg-green-50 p-6">
                <h3 className="mb-3 font-bold">
                  Latest Bank Response
                </h3>
                <p className="whitespace-pre-wrap text-sm">
                  {selected.bankResponse}
                </p>
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                Grievance Timeline
              </h3>

              <div className="space-y-3 border-l-2 border-green-500 pl-4">
                {(selected.timeline || []).map((event) => (
                  <div key={event.id} className="rounded-xl bg-gray-50 p-4">
                    <p className="font-semibold text-green-800">
                      {event.action}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {event.actor} • {formatDate(event.date)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {event.remarks}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {selected.status === "Awaiting Bank Response" ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">
                  Submit Bank Explanation
                </h3>

                <label
                  htmlFor="bankResponse"
                  className="mb-2 block font-semibold"
                >
                  Explanation / Supporting Reasons *
                </label>

                <textarea
                  id="bankResponse"
                  className={inputClass}
                  rows={6}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Explain the bank's decision and respond to the government's questions."
                />

                <button
                  type="button"
                  onClick={submitBankResponse}
                  className="mt-5 w-full rounded-xl bg-green-700 py-4 font-semibold text-white hover:bg-green-800"
                >
                  Submit Explanation to Government
                </button>
              </section>
            ) : (
              <section className="rounded-2xl bg-white p-5 text-gray-600 shadow-sm">
                {selected.status === "Bank Responded"
                  ? "Your explanation has been submitted. Awaiting government review."
                  : selected.status === "Resolved" ||
                    selected.status === "Closed"
                  ? "The government has recorded its findings for this complaint."
                  : "No bank response has been requested at this stage."}
              </section>
            )}
          </div>
        ) : (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-xl font-bold">
              Complaints Linked to This Bank
            </h2>

            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search complaint or application ID"
              />

              <select
                className={inputClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Awaiting Bank Response">
                  Awaiting Bank Response
                </option>
                <option value="Bank Responded">Bank Responded</option>
                <option value="Information Required">
                  Information Required
                </option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            {loading ? (
              <p>Loading complaints...</p>
            ) : visible.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-600">
                No complaints found for this bank and filter.
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((g) => (
                  <article
                    key={g.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="break-all font-bold">
                        {g.id}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(g.status)}`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <p className="mt-3 font-semibold">{g.subject}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {g.category}
                    </p>
                    <p className="mt-2 text-sm">
                      Application: {g.applicationId}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Updated: {formatDate(g.updatedAt)}
                    </p>

                    <button
                      type="button"
                      onClick={() => openComplaint(g)}
                      className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                    >
                      {g.status === "Awaiting Bank Response"
                        ? "Respond to Government →"
                        : "View Complaint →"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
