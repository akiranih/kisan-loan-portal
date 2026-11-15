
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

const statuses = [
  "Submitted",
  "Under Review",
  "Awaiting Bank Response",
  "Bank Responded",
  "Information Required",
  "Resolved",
  "Reopened",
  "Closed",
];

function readData<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid saved data");
  }
  return parsed as T[];
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

function badgeStyle(status: string) {
  if (status === "Closed" || status === "Resolved") {
    return "bg-green-100 text-green-800";
  }
  if (
    status === "Awaiting Bank Response" ||
    status === "Information Required"
  ) {
    return "bg-orange-100 text-orange-800";
  }
  if (status === "Bank Responded") {
    return "bg-purple-100 text-purple-800";
  }
  if (status === "Under Review") {
    return "bg-blue-100 text-blue-800";
  }
  return "bg-yellow-100 text-yellow-800";
}

export default function GovernmentGrievancesPage() {
  const router = useRouter();

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");

  const [action, setAction] = useState("Under Review");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white " +
    "px-4 py-3 text-gray-900 outline-none focus:border-green-600";

  const loadData = useCallback(() => {
    try {
      const g = readData<Grievance>(G_KEY);
      const a = readData<Application>(A_KEY);

      setGrievances(
        [...g].sort(
          (x, y) =>
            new Date(y.createdAt).getTime() -
            new Date(x.createdAt).getTime()
        )
      );
      setApplications(a);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load grievance records.");
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

  const applicationMap = useMemo(
    () => new Map(applications.map((app) => [app.id, app])),
    [applications]
  );

  const banks = useMemo(
    () =>
      Array.from(
        new Set(applications.map((app) => app.bank).filter(Boolean))
      ).sort(),
    [applications]
  );

  const filtered = grievances.filter((g) => {
    const app = g.applicationId
      ? applicationMap.get(g.applicationId)
      : undefined;
    const bankName = app?.bank || "";

    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      [
        g.id,
        g.subject,
        g.category,
        g.applicationId || "",
        bankName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return (
      matchesSearch &&
      (statusFilter === "All" || g.status === statusFilter) &&
      (bankFilter === "All" || bankName === bankFilter)
    );
  });

  const selected =
    grievances.find((g) => g.id === selectedId) || null;

  const linkedApplication =
    selected?.applicationId
      ? applicationMap.get(selected.applicationId)
      : undefined;

  const summary = {
    total: grievances.length,
    new: grievances.filter((g) =>
      ["Submitted", "Reopened"].includes(g.status)
    ).length,
    awaitingBank: grievances.filter(
      (g) => g.status === "Awaiting Bank Response"
    ).length,
    bankResponded: grievances.filter(
      (g) => g.status === "Bank Responded"
    ).length,
    resolved: grievances.filter((g) =>
      ["Resolved", "Closed"].includes(g.status)
    ).length,
  };

  function openComplaint(g: Grievance) {
    setSelectedId(g.id);
    setRemarks("");
    setMessage("");
    setError("");
    setAction("Under Review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveAction() {
    if (!selected) return;

    setError("");
    setMessage("");

    if (remarks.trim().length < 10) {
      setError("Enter at least 10 characters explaining the action.");
      return;
    }

    const allowedActions = [
      "Under Review",
      "Awaiting Bank Response",
      "Information Required",
      "Resolved",
    ];

    if (!allowedActions.includes(action)) {
      setError("Please select a valid action.");
      return;
    }

    if (action === "Awaiting Bank Response" && !linkedApplication) {
      setError(
        "A complaint must be linked to an existing loan application " +
          "before you can request information from a bank."
      );
      return;
    }

    try {
      const all = readData<Grievance>(G_KEY);
      const current = all.find((g) => g.id === selected.id);

      if (!current) {
        setError("Complaint no longer exists.");
        return;
      }

      if (
        ["Closed", "Resolved"].includes(current.status)
      ) {
        setError(
          "This complaint is awaiting farmer response or already closed."
        );
        loadData();
        return;
      }

      if (
        current.status === "Awaiting Bank Response" &&
        action === "Awaiting Bank Response"
      ) {
        setError("A bank explanation is already pending.");
        return;
      }

      if (action === "Awaiting Bank Response") {
        const freshApplications = readData<Application>(A_KEY);
        const stillLinked = freshApplications.some(
          (a) => a.id === current.applicationId
        );

        if (!stillLinked) {
          setError("The related loan application is unavailable.");
          return;
        }
      }

      const now = new Date().toISOString();

      const actionNames: Record<string, string> = {
        "Under Review": "Complaint Under Government Review",
        "Awaiting Bank Response": "Bank Explanation Requested",
        "Information Required": "Farmer Clarification Requested",
        Resolved: "Government Resolution Recorded",
      };

      const updated = all.map((g) => {
        if (g.id !== current.id) return g;

        const history: HistoryEvent = {
          id: eventId(),
          actor: "Government Officer",
          action: actionNames[action],
          remarks: remarks.trim(),
          date: now,
        };

        return {
          ...g,
          status: action,
          updatedAt: now,
          bankQuery:
            action === "Awaiting Bank Response"
              ? remarks.trim()
              : g.bankQuery || null,
          bankResponse:
            action === "Awaiting Bank Response"
              ? null
              : g.bankResponse || null,
          resolution:
            action === "Resolved"
              ? remarks.trim()
              : g.resolution,
          timeline: [...(g.timeline || []), history],
        };
      });

      localStorage.setItem(G_KEY, JSON.stringify(updated));

      setSelectedId(null);
      setRemarks("");
      setMessage("Grievance updated successfully.");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to save grievance action.");
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-900 sm:text-3xl">
              🏛️ Government Grievance Monitoring
            </h1>
            <p className="mt-2 text-gray-600">
              Review complaints, request bank explanations and record findings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/government/dashboard")}
            className="rounded-xl border bg-white px-5 py-3 font-semibold text-green-800"
          >
            ← Government Dashboard
          </button>
        </header>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="rounded-xl bg-green-100 p-4 text-green-800">
            {message}
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Total Complaints", summary.total],
            ["New / Reopened", summary.new],
            ["Awaiting Bank", summary.awaitingBank],
            ["Bank Responded", summary.bankResponded],
            ["Resolved / Closed", summary.resolved],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">{label}</p>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
          <div>
            <label htmlFor="gSearch" className="mb-2 block font-semibold">
              Search
            </label>
            <input
              id="gSearch"
              className={inputClass}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedId(null);
              }}
              placeholder="Complaint ID or application ID"
            />
          </div>

          <div>
            <label htmlFor="gStatus" className="mb-2 block font-semibold">
              Status
            </label>
            <select
              id="gStatus"
              className={inputClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="All">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gBank" className="mb-2 block font-semibold">
              Bank
            </label>
            <select
              id="gBank"
              className={inputClass}
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="All">All Banks</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
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
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <p><strong>Subject:</strong> {selected.subject}</p>
                <p><strong>Category:</strong> {selected.category}</p>
                <p>
                  <strong>Related Application:</strong>{" "}
                  {selected.applicationId || "General complaint"}
                </p>
                <p><strong>Submitted:</strong> {formatDate(selected.createdAt)}</p>
                <p className="whitespace-pre-wrap">
                  <strong>Farmer's Complaint:</strong> {selected.description}
                </p>
              </div>

              {linkedApplication && (
                <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm">
                  <h3 className="mb-3 font-bold">Related Loan</h3>
                  <p><strong>Bank:</strong> {linkedApplication.bank}</p>
                  <p><strong>Branch:</strong> {linkedApplication.branch}</p>
                  <p><strong>Loan Status:</strong> {linkedApplication.status}</p>
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
                      <strong>Bank Decision Reason:</strong>{" "}
                      {linkedApplication.decisionReason}
                    </p>
                  )}
                </div>
              )}
            </section>

            {(selected.bankQuery || selected.bankResponse) && (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">
                  Bank Communication
                </h3>

                {selected.bankQuery && (
                  <div className="mb-4 rounded-xl bg-orange-50 p-4">
                    <p className="font-semibold">Government Query</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {selected.bankQuery}
                    </p>
                  </div>
                )}

                {selected.bankResponse && (
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="font-semibold">Bank Explanation</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {selected.bankResponse}
                    </p>
                  </div>
                )}
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                Complaint Activity History
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

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">
                Government Action
              </h3>

              {selected.status === "Closed" ? (
                <div className="rounded-xl bg-green-50 p-4 text-green-800">
                  Farmer accepted the resolution. Complaint closed.
                </div>
              ) : selected.status === "Resolved" ? (
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="font-semibold">
                    Resolution recorded. Awaiting farmer response.
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {selected.resolution}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {selected.status === "Awaiting Bank Response" && (
                    <p className="rounded-xl bg-orange-50 p-4 text-orange-800">
                      Waiting for the bank to reply to the current query.
                    </p>
                  )}

                  {selected.status === "Bank Responded" && (
                    <p className="rounded-xl bg-purple-50 p-4 text-purple-800">
                      The bank has replied. Review its explanation and
                      record the next action.
                    </p>
                  )}

                  <div>
                    <label className="mb-2 block font-semibold">
                      Select Action
                    </label>
                    <select
                      className={inputClass}
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="Under Review">
                        Mark Under Review
                      </option>
                      <option value="Awaiting Bank Response">
                        Request Bank Explanation
                      </option>
                      <option value="Information Required">
                        Request Farmer Clarification
                      </option>
                      <option value="Resolved">
                        Record Resolution
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-semibold">
                      {action === "Awaiting Bank Response"
                        ? "Questions for the Bank *"
                        : action === "Information Required"
                        ? "Questions for the Farmer *"
                        : action === "Resolved"
                        ? "Government Findings and Resolution *"
                        : "Government Remarks *"}
                    </label>
                    <textarea
                      className={inputClass}
                      rows={5}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Record the facts, questions or findings clearly."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={saveAction}
                    className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white hover:bg-green-800"
                  >
                    Save Government Action
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-bold">All Farmer Complaints</h2>
              <button
                type="button"
                onClick={loadData}
                className="font-semibold text-green-800"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading complaints...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-600">
                No complaints found.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((g) => {
                  const app = g.applicationId
                    ? applicationMap.get(g.applicationId)
                    : undefined;

                  return (
                    <article
                      key={g.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="break-all font-bold">{g.id}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle(g.status)}`}
                        >
                          {g.status}
                        </span>
                      </div>

                      <p className="mt-3 font-semibold">{g.subject}</p>
                      <p className="mt-1 text-sm text-gray-600">{g.category}</p>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <p>
                          <strong>Application:</strong>{" "}
                          {g.applicationId || "General complaint"}
                        </p>
                        <p>
                          <strong>Bank:</strong> {app?.bank || "Not linked"}
                        </p>
                        <p>
                          <strong>Submitted:</strong>{" "}
                          {formatDate(g.createdAt)}
                        </p>
                        <p>
                          <strong>Updated:</strong>{" "}
                          {formatDate(g.updatedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openComplaint(g)}
                        className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                      >
                        Review Complaint →
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
