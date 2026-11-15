
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  loanAmount: number;
  status: string;
};

const G_KEY = "kisanGrievances";
const A_KEY = "kisanApplications";

const categories = [
  "Delay in loan processing",
  "Loan rejection",
  "Lower amount sanctioned",
  "Lack of explanation",
  "Documentation issue",
  "Disbursement delay",
  "Staff behaviour",
  "Other issue",
];

function makeId(prefix: string) {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase()
  );
}

function readData<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  const parsed: unknown = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid stored data");
  }

  return parsed as T[];
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

function money(value: number) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function badgeStyle(status: string) {
  if (status === "Resolved" || status === "Closed") {
    return "bg-green-100 text-green-800";
  }
  if (
    status === "Information Required" ||
    status === "Awaiting Bank Response"
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

function FarmerComplaintsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = params.get("lang") || "en";

  const [applications, setApplications] = useState<Application[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);

  const [applicationId, setApplicationId] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white " +
    "px-4 py-3 text-gray-900 outline-none focus:border-green-600";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  const loadData = useCallback(() => {
    try {
      const a = readData<Application>(A_KEY);
      const g = readData<Grievance>(G_KEY);

      setApplications(a);
      setGrievances(
        [...g].sort(
          (x, y) =>
            new Date(y.createdAt).getTime() -
            new Date(x.createdAt).getTime()
        )
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load complaint records.");
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

  function submitComplaint(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !category ||
      subject.trim().length < 5 ||
      description.trim().length < 15
    ) {
      setError(
        "Choose a category and enter a clear subject and description."
      );
      return;
    }

    if (
      applicationId &&
      !applications.some((a) => a.id === applicationId)
    ) {
      setError("Please select a valid loan application.");
      return;
    }

    try {
      const now = new Date().toISOString();
      const id = makeId("GRV");

      const grievance: Grievance = {
        id,
        applicationId: applicationId || null,
        category,
        subject: subject.trim(),
        description: description.trim(),
        status: "Submitted",
        createdAt: now,
        updatedAt: now,
        resolution: null,
        bankQuery: null,
        bankResponse: null,
        timeline: [
          {
            id: makeId("EV"),
            actor: "Farmer",
            action: "Complaint Submitted",
            remarks: description.trim(),
            date: now,
          },
        ],
      };

      const existing = readData<Grievance>(G_KEY);

      localStorage.setItem(
        G_KEY,
        JSON.stringify([...existing, grievance])
      );

      setApplicationId("");
      setCategory("");
      setSubject("");
      setDescription("");
      setExpandedId(id);

      setMessage("Complaint submitted. Reference: " + id);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to save your complaint.");
    }
  }

  function farmerAction(
    grievance: Grievance,
    action:
      | "Clarification Submitted"
      | "Resolution Accepted"
      | "Complaint Reopened"
  ) {
    setError("");
    setMessage("");

    if (
      action !== "Resolution Accepted" &&
      replyText.trim().length < 10
    ) {
      setError("Please enter at least 10 characters.");
      return;
    }

    try {
      const all = readData<Grievance>(G_KEY);
      const current = all.find((g) => g.id === grievance.id);

      if (!current) {
        setError("Complaint no longer exists.");
        return;
      }

      if (
        action === "Clarification Submitted" &&
        current.status !== "Information Required"
      ) {
        setError("This complaint no longer needs clarification.");
        loadData();
        return;
      }

      if (
        ["Resolution Accepted", "Complaint Reopened"].includes(action) &&
        current.status !== "Resolved"
      ) {
        setError(
          "The complaint is no longer awaiting a farmer response."
        );
        loadData();
        return;
      }

      const status =
        action === "Resolution Accepted"
          ? "Closed"
          : action === "Complaint Reopened"
          ? "Reopened"
          : "Submitted";

      const now = new Date().toISOString();

      const updated = all.map((g) => {
        if (g.id !== grievance.id) return g;

        const history: HistoryEvent = {
          id: makeId("EV"),
          actor: "Farmer",
          action,
          remarks:
            action === "Resolution Accepted"
              ? "Farmer accepted the resolution."
              : replyText.trim(),
          date: now,
        };

        return {
          ...g,
          status,
          updatedAt: now,
          timeline: [...(g.timeline || []), history],
        };
      });

      localStorage.setItem(G_KEY, JSON.stringify(updated));

      setReplyText("");
      setMessage("Complaint updated successfully.");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to update your complaint.");
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-7">

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-900 sm:text-3xl">
              🌾 Farmer Complaints
            </h1>
            <p className="mt-2 text-gray-600">
              Raise complaints and track responses from government and banks.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/farmer/dashboard?lang=${lang}`)
            }
            className="rounded-xl border bg-white px-5 py-3 font-semibold text-green-800"
          >
            ← Dashboard
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

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            Raise a New Complaint
          </h2>

          <form onSubmit={submitComplaint} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="application">
                Related Loan Application
              </label>

              <select
                id="application"
                className={inputClass}
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
              >
                <option value="">General complaint / No application</option>

                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.id} — {app.bank} — {money(app.loanAmount)}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Link your loan application if the complaint concerns a bank.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="category">
                Complaint Category *
              </label>
              <select
                id="category"
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="subject">
                Subject *
              </label>
              <input
                id="subject"
                className={inputClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                placeholder="Example: Need explanation of reduced loan offer"
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="description">
                Explain Your Complaint *
              </label>
              <textarea
                id="description"
                className={inputClass}
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened and what help you need."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white hover:bg-green-800"
            >
              Submit Complaint
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">My Complaints</h2>
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
          ) : grievances.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-600">
              You haven't submitted any complaints yet.
            </div>
          ) : (
            <div className="space-y-4">
              {grievances.map((g) => (
                <article
                  key={g.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="break-all font-bold text-green-900">
                        {g.id}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle(g.status)}`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <p className="mt-3 font-semibold">{g.subject}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {g.category}
                    </p>
                    <p className="mt-2 text-sm">
                      Application: {g.applicationId || "General complaint"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted: {formatDate(g.createdAt)}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(
                          expandedId === g.id ? null : g.id
                        );
                        setReplyText("");
                        setError("");
                      }}
                      className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                    >
                      {expandedId === g.id
                        ? "Hide Details"
                        : "View Complaint & Timeline"}
                    </button>
                  </div>

                  {expandedId === g.id && (
                    <div className="space-y-5 border-t bg-gray-50 p-5">

                      <div className="rounded-xl bg-white p-4">
                        <h4 className="font-bold">Original Complaint</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          {g.description}
                        </p>
                      </div>

                      {g.status === "Awaiting Bank Response" && (
                        <div className="rounded-xl bg-orange-50 p-4">
                          <p className="font-semibold text-orange-900">
                            Government Has Requested a Bank Explanation
                          </p>
                          <p className="mt-2 text-sm">
                            The bank has been asked to respond before
                            the government records its findings.
                          </p>
                        </div>
                      )}

                      {g.status === "Bank Responded" && (
                        <div className="rounded-xl bg-purple-50 p-4">
                          <p className="font-semibold text-purple-900">
                            Bank Response Received
                          </p>
                          <p className="mt-2 text-sm">
                            The government officer can now review the
                            explanation and decide the next step.
                          </p>
                        </div>
                      )}

                      {g.bankQuery && (
                        <div className="rounded-xl bg-white p-4">
                          <h4 className="font-bold">
                            Government's Question to the Bank
                          </h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {g.bankQuery}
                          </p>
                        </div>
                      )}

                      {g.bankResponse && (
                        <div className="rounded-xl bg-white p-4">
                          <h4 className="font-bold">
                            Bank's Explanation
                          </h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {g.bankResponse}
                          </p>
                        </div>
                      )}

                      {g.resolution && (
                        <div className="rounded-xl bg-green-50 p-4">
                          <h4 className="font-bold text-green-900">
                            Government Resolution
                          </h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {g.resolution}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="mb-3 font-bold">
                          Complaint Activity Timeline
                        </h4>

                        <div className="space-y-3 border-l-2 border-green-500 pl-4">
                          {(g.timeline || []).map((event) => (
                            <div
                              key={event.id}
                              className="rounded-xl bg-white p-4"
                            >
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
                      </div>

                      {g.status === "Information Required" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">
                            Provide Requested Clarification
                          </h4>
                          <textarea
                            className={inputClass}
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Provide the information requested."
                          />
                          <button
                            type="button"
                            onClick={() =>
                              farmerAction(g, "Clarification Submitted")
                            }
                            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                          >
                            Submit Clarification
                          </button>
                        </div>
                      )}

                      {g.status === "Resolved" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">
                            Are you satisfied with the resolution?
                          </h4>

                          <button
                            type="button"
                            onClick={() =>
                              farmerAction(g, "Resolution Accepted")
                            }
                            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                          >
                            Accept Resolution & Close
                          </button>

                          <label className={labelClass}>
                            If not satisfied, explain why:
                          </label>

                          <textarea
                            className={inputClass}
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Explain why further review is needed."
                          />

                          <button
                            type="button"
                            onClick={() =>
                              farmerAction(g, "Complaint Reopened")
                            }
                            className="rounded-xl border border-orange-500 px-5 py-3 font-semibold text-orange-700"
                          >
                            Reopen Complaint
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function FarmerComplaintsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <FarmerComplaintsContent />
    </Suspense>
  );
}
