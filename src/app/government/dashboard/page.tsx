
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getAssessmentSnapshot,
  type AssessmentSnapshot,
} from "@/lib/assessmentAudit";

type Crop = {
  id: number;
  name: string;
  season: string;
  area: string;
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

type LoanApplication = {
  id: string;
  farmerId?: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  landType: string;
  crops: Crop[];
  cropIncome: number;
  totalAnnualIncome: number;
  hasOtherIncome: string;
  hasExistingLoan: string;
  existingLoans: ExistingLoan[];
  loanAmount: number;
  loanPurpose: string;
  bank: string;
  branch: string;
  sanctionedAmount: number | null;
  decisionReason: string | null;
  farmerResponse?: string | null;
  reconsiderationReason?: string | null;
  offerRevision?: number;
  assessmentSnapshot?: AssessmentSnapshot | null;
  timeline: TimelineEvent[];
};

const STORAGE_KEY = "kisanApplications";

const ASSESSMENT_KEY = "kisanAssessmentSnapshots";

const banks = [
  "Demo Rural Bank A",
  "Demo Cooperative Bank B",
  "Demo Agricultural Bank C",
];

const statuses = [
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
];

function money(value: number | null | undefined) {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusColor(status: string) {
  if (
    [
      "Offer Accepted",
      "Ready for Disbursement",
      "Disbursed",
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
    [
      "Reconsideration Requested",
      "More Information Required",
    ].includes(status)
  ) {
    return "bg-orange-100 text-orange-800";
  }

  if (
    [
      "Under Review",
      "Documentation Pending",
    ].includes(status)
  ) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-yellow-100 text-yellow-800";
}

function findingColor(level: string) {
  if (level === "Attention") {
    return "bg-red-100 text-red-800";
  }

  if (level === "Review") {
    return "bg-orange-100 text-orange-800";
  }

  if (level === "Reported OK") {
    return "bg-green-100 text-green-800";
  }

  return "bg-blue-100 text-blue-800";
}

function readApplications(): LoanApplication[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  const parsed: unknown = raw
    ? JSON.parse(raw)
    : [];

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid saved application data");
  }

  return (parsed as LoanApplication[]).filter(
    (app) =>
      app &&
      typeof app.id === "string" &&
      typeof app.status === "string"
  );
}

// ---------------------------------------------------
// CREDIT ASSESSMENT PANEL
// ---------------------------------------------------

function GovernmentAssessmentPanel({
  applicationId,
  attachedSnapshot,
}: {
  applicationId: string;
  attachedSnapshot?: AssessmentSnapshot | null;
}) {
  const [snapshot, setSnapshot] =
    useState<AssessmentSnapshot | null>(null);

  const [loadError, setLoadError] = useState("");

  const loadAssessment = useCallback(() => {
    try {
      const saved = getAssessmentSnapshot(applicationId);

      setSnapshot(saved);
      setLoadError("");
    } catch (error) {
      console.error(
        "Could not load credit assessment:",
        error
      );

      setSnapshot(null);
      setLoadError(
        "Unable to load the saved credit assessment."
      );
    }
  }, [applicationId]);

  useEffect(() => {
    loadAssessment();

    function onStorage(event: StorageEvent) {
      if (event.key === ASSESSMENT_KEY) {
        loadAssessment();
      }
    }

    window.addEventListener("storage", onStorage);

    window.addEventListener("focus", loadAssessment);

    return () => {
      window.removeEventListener(
        "storage",
        onStorage
      );

      window.removeEventListener(
        "focus",
        loadAssessment
      );
    };
  }, [loadAssessment]);

  // The separate browser snapshot is the latest one.
  // An attached snapshot is the one saved with a bank
  // decision. Keep these two concepts distinct.
  const currentSnapshot = snapshot || attachedSnapshot || null;

  const source =
    snapshot !== null
      ? "Latest Saved Assessment"
      : attachedSnapshot
      ? "Assessment Attached to Bank Decision"
      : "";

  return (
    <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-green-900">
            📊 Credit Assessment & Monte Carlo Results
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Review recorded financial findings, assumptions
            and scenario results.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAssessment}
          className="rounded-xl border border-green-700 px-4 py-2 text-sm font-semibold text-green-800"
        >
          ↻ Refresh Assessment
        </button>
      </div>

      {loadError && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {loadError}
        </p>
      )}

      {!currentSnapshot ? (
        <div className="mt-5 rounded-xl bg-gray-50 p-5">
          <p className="font-medium text-gray-700">
            No credit assessment saved yet.
          </p>

          <p className="mt-2 text-sm text-gray-600">
            The Bank Officer must open Credit Risk Assessment,
            select this application and save the assessment
            snapshot.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">

          {/* Assessment Overview */}
          <div className="rounded-xl bg-green-50 p-5">

            <p className="text-sm text-gray-600">
              {source}
            </p>

            <h4 className="mt-2 text-xl font-bold text-green-900">
              {currentSnapshot.financialResult}
            </h4>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <strong>Saved:</strong>{" "}
                {formatDate(currentSnapshot.savedAt)}
              </p>

              <p>
                <strong>Rule Version:</strong>{" "}
                {currentSnapshot.ruleVersion}
              </p>

              <p>
                <strong>Simulation Version:</strong>{" "}
                {currentSnapshot.simulationVersion}
              </p>

              <p>
                <strong>Calculation Check:</strong>{" "}
                {currentSnapshot.results.reconciliationPassed
                  ? "Passed"
                  : "Requires Review"}
              </p>
            </div>
          </div>

          {snapshot && attachedSnapshot && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">
                Assessment history distinction
              </p>

              <p className="mt-2">
                This page shows the latest saved assessment.
                The bank decision may have used a different
                assessment snapshot.
              </p>

              <p className="mt-2">
                <strong>
                  Assessment attached to the bank decision:
                </strong>{" "}
                {formatDate(attachedSnapshot.savedAt)}
              </p>

              <p className="mt-1">
                <strong>
                  Latest separately saved assessment:
                </strong>{" "}
                {formatDate(snapshot.savedAt)}
              </p>
            </div>
          )}

          {/* Simulation Summary */}
          <div>
            <h4 className="mb-4 text-lg font-bold">
              Monte Carlo Simulation Summary
            </h4>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Simulation Runs",
                  value:
                    currentSnapshot.results.iterations.toLocaleString(
                      "en-IN"
                    ),
                },
                {
                  label: "Median Annual Surplus",
                  value: money(
                    currentSnapshot.results.medianSurplus
                  ),
                },
                {
                  label: "10th Percentile Surplus",
                  value: money(
                    currentSnapshot.results.lowerSurplus
                  ),
                },
                {
                  label: "Shortfall Frequency",
                  value:
                    (
                      currentSnapshot.results.shortfallFrequency *
                      100
                    ).toFixed(1) + "%",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-gray-50 p-4"
                >
                  <p className="text-xs text-gray-600">
                    {item.label}
                  </p>

                  <p className="mt-2 break-words text-xl font-bold text-green-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Values */}
          <div>
            <h4 className="mb-4 text-lg font-bold">
              Annual Cash Flow Results
            </h4>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Baseline Annual Surplus",
                  value: money(
                    currentSnapshot.results.baselineSurplus
                  ),
                },
                {
                  label: "90th Percentile Surplus",
                  value: money(
                    currentSnapshot.results.upperSurplus
                  ),
                },
                {
                  label: "New Loan Annual Payment",
                  value: money(
                    currentSnapshot.results.newLoanAnnualPayment
                  ),
                },
                {
                  label: "Existing Annual Repayments",
                  value: money(
                    currentSnapshot.results.existingAnnualPayments
                  ),
                },
                {
                  label: "Baseline Crop Production Costs",
                  value: money(
                    currentSnapshot.results.baselineCropCosts
                  ),
                },
                {
                  label: "Other Annual Income",
                  value: money(
                    currentSnapshot.results.otherIncome
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <p className="text-sm text-gray-500">
                    {item.label}
                  </p>

                  <p className="mt-2 font-bold text-green-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Assumptions */}
          <div className="rounded-xl border border-gray-200 p-5">

            <h4 className="mb-4 text-lg font-bold">
              Simulation Assumptions
            </h4>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <strong>Crop production costs:</strong>{" "}
                {currentSnapshot.assumptions.cropCostPercent}%
              </p>

              <p>
                <strong>Household expenses:</strong>{" "}
                {money(
                  currentSnapshot.assumptions.householdExpenses
                )}
              </p>

              <p>
                <strong>Maximum crop-income decline:</strong>{" "}
                {currentSnapshot.assumptions.downsidePercent}%
              </p>

              <p>
                <strong>Maximum crop-income increase:</strong>{" "}
                {currentSnapshot.assumptions.upsidePercent}%
              </p>

              <p>
                <strong>Assumed annual interest:</strong>{" "}
                {currentSnapshot.assumptions.interestRatePercent}%
              </p>

              <p>
                <strong>Assumed duration:</strong>{" "}
                {currentSnapshot.assumptions.loanYears} years
              </p>
            </div>
          </div>

          {/* Financial Findings */}
          <div>
            <h4 className="mb-4 text-lg font-bold">
              Financial Screening Findings
            </h4>

            <div className="space-y-3">
              {(currentSnapshot.financialFindings || []).map(
                (finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h5 className="font-bold">
                        {finding.id} — {finding.title}
                      </h5>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${findingColor(
                          finding.level
                        )}`}
                      >
                        {finding.level}
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-green-800">
                      {finding.value}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {finding.explanation}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Verification */}
          <div>
            <h4 className="mb-4 text-lg font-bold">
              Documentation & Verification Findings
            </h4>

            <div className="space-y-3">
              {(currentSnapshot.verificationFindings || []).map(
                (finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <p className="font-semibold">
                      {finding.title}
                    </p>

                    <p className="mt-1 text-sm font-medium text-green-800">
                      {finding.value}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {finding.explanation}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Agricultural Findings */}
          <div>
            <h4 className="mb-4 text-lg font-bold">
              Agricultural Exposure Findings
            </h4>

            <div className="space-y-3">
              {(currentSnapshot.agriculturalFindings || []).map(
                (finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <p className="font-semibold">
                      {finding.title}
                    </p>

                    <p className="mt-1 text-sm font-medium text-green-800">
                      {finding.value}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {finding.explanation}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              Credit assessments use farmer-reported
              information and illustrative project assumptions.
              Simulation shortfall frequencies do not represent
              calibrated probabilities of loan default.
              Government monitoring does not itself change
              the bank's decision.
            </p>
          </div>

        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------
// MAIN GOVERNMENT DASHBOARD
// ---------------------------------------------------

export default function GovernmentDashboard() {
  const router = useRouter();

  const [applications, setApplications] =
    useState<LoanApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bankFilter, setBankFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-gray-300 " +
    "bg-white px-4 py-3 text-gray-900 outline-none " +
    "focus:border-green-600";

  const refreshApplications = useCallback(() => {
    try {
      const saved = readApplications();

      saved.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setApplications(saved);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load saved applications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshApplications();

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        refreshApplications();
      }
    }

    function handleFocus() {
      refreshApplications();
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [refreshApplications]);

  const allBanks = useMemo(() => {
    return Array.from(
      new Set([
        ...banks,
        ...applications
          .map((app) => app.bank)
          .filter(Boolean),
      ])
    ).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesBank =
        bankFilter === "All" ||
        app.bank === bankFilter;

      const matchesStatus =
        statusFilter === "All" ||
        app.status === statusFilter;

      const searchableText = [
        app.id,
        app.bank,
        app.branch,
        app.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesBank &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    applications,
    bankFilter,
    statusFilter,
    search,
  ]);

  const selectedApplication =
    applications.find(
      (app) => app.id === selectedId
    ) || null;

  const stats = useMemo(() => {
    const data = filteredApplications;

    return {
      total: data.length,

      requestedAmount: data.reduce(
        (sum, app) =>
          sum + Number(app.loanAmount || 0),
        0
      ),

      offers: data.filter(
        (app) =>
          Number(app.sanctionedAmount || 0) > 0
      ).length,

      accepted: data.filter((app) =>
        [
          "Offer Accepted",
          "Documentation Pending",
          "Ready for Disbursement",
          "Disbursed",
        ].includes(app.status)
      ).length,

      reconsideration: data.filter(
        (app) =>
          app.status ===
          "Reconsideration Requested"
      ).length,

      disbursed: data.filter(
        (app) =>
          app.status === "Disbursed"
      ).length,

      rejected: data.filter(
        (app) =>
          app.status === "Rejected"
      ).length,
    };
  }, [filteredApplications]);

  const bankSummary = allBanks
    .map((bank) => {
      const records =
        filteredApplications.filter(
          (app) => app.bank === bank
        );

      return {
        bank,
        total: records.length,

        offers: records.filter(
          (app) =>
            Number(app.sanctionedAmount || 0) > 0
        ).length,

        reconsideration: records.filter(
          (app) =>
            app.status ===
            "Reconsideration Requested"
        ).length,

        disbursed: records.filter(
          (app) =>
            app.status === "Disbursed"
        ).length,

        rejected: records.filter(
          (app) =>
            app.status === "Rejected"
        ).length,
      };
    })
    .filter((bank) => bank.total > 0);

  const casesForAttention =
    filteredApplications.filter((app) => {
      const reconsideration =
        app.status ===
        "Reconsideration Requested";

      const lowerOffer =
        app.sanctionedAmount !== null &&
        app.sanctionedAmount !== undefined &&
        Number(app.sanctionedAmount) > 0 &&
        Number(app.sanctionedAmount) <
          Number(app.loanAmount);

      const overdueLoan =
        (app.existingLoans || []).some(
          (loan) => loan.overdue === "Yes"
        );

      return (
        reconsideration ||
        lowerOffer ||
        overdueLoan
      );
    });

  function openApplication(id: string) {
    setSelectedId(
      selectedId === id ? null : id
    );
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-green-900 sm:text-3xl">
              🏛️ Government Officer Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Monitor agricultural credit applications,
              bank decisions and loan activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshApplications}
              className="rounded-xl border border-green-700 bg-white px-4 py-3 font-semibold text-green-800"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/government/grievances"
                )
              }
              className="rounded-xl bg-green-700 px-4 py-3 font-semibold text-white"
            >
              View Grievances
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-green-700 bg-white px-4 py-3 font-semibold text-green-800"
            >
              ← Home
            </button>
          </div>
        </header>

        {/* FILTERS */}
        <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">

          <div>
            <label
              htmlFor="bankFilter"
              className="mb-2 block text-sm font-semibold"
            >
              Filter by Bank
            </label>

            <select
              id="bankFilter"
              className={inputClass}
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="All">
                All Banks
              </option>

              {allBanks.map((bank) => (
                <option
                  key={bank}
                  value={bank}
                >
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="statusFilter"
              className="mb-2 block text-sm font-semibold"
            >
              Filter by Status
            </label>

            <select
              id="statusFilter"
              className={inputClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="All">
                All Statuses
              </option>

              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-semibold"
            >
              Search Applications
            </label>

            <input
              id="search"
              className={inputClass}
              placeholder="Application ID, bank or branch"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedId(null);
              }}
            />
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {/* STATISTICS */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">

          {[
            {
              title: "Total Applications",
              value: stats.total,
            },
            {
              title: "Requested Value",
              value: money(
                stats.requestedAmount
              ),
            },
            {
              title: "Applications with Offers",
              value: stats.offers,
            },
            {
              title: "Accepted Offers",
              value: stats.accepted,
            },
            {
              title: "Reconsideration Pending",
              value: stats.reconsideration,
            },
            {
              title: "Disbursed",
              value: stats.disbursed,
            },
            {
              title: "Rejected",
              value: stats.rejected,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-gray-600">
                {card.title}
              </p>

              <p className="mt-3 break-words text-2xl font-bold text-green-800">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        {/* BANK-WISE SUMMARY */}
        <section className="grid gap-5 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="mb-4 text-lg font-bold">
              Bank-wise Monitoring
            </h2>

            {bankSummary.length === 0 ? (
              <p className="text-gray-500">
                No records match the filters.
              </p>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="pb-3 pr-3">
                        Bank
                      </th>
                      <th className="pb-3">
                        Total
                      </th>
                      <th className="pb-3">
                        Offers
                      </th>
                      <th className="pb-3">
                        Reconsideration
                      </th>
                      <th className="pb-3">
                        Disbursed
                      </th>
                      <th className="pb-3">
                        Rejected
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {bankSummary.map((bank) => (
                      <tr
                        key={bank.bank}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-3 font-medium">
                          {bank.bank}
                        </td>
                        <td>{bank.total}</td>
                        <td>{bank.offers}</td>
                        <td>{bank.reconsideration}</td>
                        <td>{bank.disbursed}</td>
                        <td>{bank.rejected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CASES FOR ATTENTION */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="mb-2 text-lg font-bold">
              Cases for Attention
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              Reconsideration requests, lower loan offers,
              and reported overdue borrowing.
            </p>

            {casesForAttention.length === 0 ? (
              <p className="text-gray-500">
                No cases requiring attention.
              </p>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {casesForAttention.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(app.id)
                    }
                    className="w-full rounded-xl border border-gray-200 p-4 text-left hover:border-green-500"
                  >
                    <p className="break-all font-semibold text-green-800">
                      {app.id}
                    </p>

                    <p className="mt-1 text-sm">
                      {app.bank}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Status: {app.status}
                    </p>

                    <p className="mt-1 text-sm">
                      Requested:{" "}
                      {money(app.loanAmount)}
                    </p>

                    {app.sanctionedAmount != null && (
                      <p className="mt-1 text-sm">
                        Offered:{" "}
                        {money(
                          app.sanctionedAmount
                        )}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ALL APPLICATIONS */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-xl font-bold">
              All Loan Applications
            </h2>

            <p className="text-sm text-gray-500">
              {filteredApplications.length} records
            </p>
          </div>

          {loading ? (
            <p>Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-600">
              No applications found.
            </div>
          ) : (
            <div className="space-y-4">

              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-gray-200 p-5"
                >

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="break-all font-bold">
                      {app.id}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div>
                      <p className="text-sm text-gray-500">
                        Bank
                      </p>
                      <p className="font-semibold">
                        {app.bank}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Loan Requested
                      </p>
                      <p className="font-semibold">
                        {money(app.loanAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Bank Offer
                      </p>
                      <p className="font-semibold">
                        {app.sanctionedAmount == null
                          ? "Not offered"
                          : money(
                              app.sanctionedAmount
                            )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Submitted
                      </p>
                      <p className="font-semibold">
                        {formatDate(app.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openApplication(app.id)
                    }
                    className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                  >
                    {selectedId === app.id
                      ? "Hide Details ↑"
                      : "View Details & History →"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SELECTED APPLICATION DETAILS */}
        {selectedApplication && (
          <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-xl font-bold">
                  Application Details
                </h2>

                <p className="mt-1 break-all text-sm text-gray-600">
                  {selectedApplication.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-xl border px-4 py-2"
              >
                Close
              </button>
            </div>

            {/* NEW ASSESSMENT SECTION */}
            <div className="mb-6">
              <GovernmentAssessmentPanel
                key={selectedApplication.id}
                applicationId={selectedApplication.id}
                attachedSnapshot={
                  selectedApplication.assessmentSnapshot
                }
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">

              {/* LOAN INFORMATION */}
              <div className="space-y-5">

                <div className="rounded-xl bg-gray-50 p-5">

                  <h3 className="mb-4 font-bold">
                    🏦 Loan & Bank Information
                  </h3>

                  <div className="space-y-2 text-sm">

                    <p>
                      <strong>Bank:</strong>{" "}
                      {selectedApplication.bank}
                    </p>

                    <p>
                      <strong>Branch:</strong>{" "}
                      {selectedApplication.branch}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedApplication.status}
                    </p>

                    <p>
                      <strong>Purpose:</strong>{" "}
                      {selectedApplication.loanPurpose}
                    </p>

                    <p>
                      <strong>Requested Amount:</strong>{" "}
                      {money(
                        selectedApplication.loanAmount
                      )}
                    </p>

                    <p>
                      <strong>Bank Offer:</strong>{" "}
                      {selectedApplication.sanctionedAmount == null
                        ? "Not offered"
                        : money(
                            selectedApplication.sanctionedAmount
                          )}
                    </p>

                    <p>
                      <strong>Offer Revisions:</strong>{" "}
                      {selectedApplication.offerRevision || 0}
                    </p>

                    {selectedApplication.decisionReason && (
                      <p className="whitespace-pre-wrap">
                        <strong>
                          Bank Explanation:
                        </strong>{" "}
                        {selectedApplication.decisionReason}
                      </p>
                    )}

                    {selectedApplication.reconsiderationReason && (
                      <p className="whitespace-pre-wrap">
                        <strong>
                          Farmer Reconsideration Request:
                        </strong>{" "}
                        {selectedApplication.reconsiderationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* FARMING INFORMATION */}
                <div className="rounded-xl bg-gray-50 p-5">

                  <h3 className="mb-4 font-bold">
                    🌾 Farming & Income
                  </h3>

                  <p className="text-sm">
                    <strong>
                      Land Relationship:
                    </strong>{" "}
                    {selectedApplication.landType}
                  </p>

                  {(selectedApplication.crops || []).map(
                    (crop) => (
                      <div
                        key={crop.id}
                        className="mt-3 rounded-xl bg-white p-3 text-sm"
                      >
                        <p>
                          Crop: {crop.name}
                        </p>

                        <p>
                          Season: {crop.season}
                        </p>

                        <p>
                          Area: {crop.area} acres
                        </p>
                      </div>
                    )
                  )}

                  <p className="mt-4 text-sm">
                    <strong>
                      Annual Crop Income:
                    </strong>{" "}
                    {money(
                      selectedApplication.cropIncome
                    )}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>
                      Total Annual Income:
                    </strong>{" "}
                    {money(
                      selectedApplication.totalAnnualIncome
                    )}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>
                      Existing Loans:
                    </strong>{" "}
                    {selectedApplication.hasExistingLoan}
                  </p>

                  {(selectedApplication.existingLoans || []).map(
                    (loan) => (
                      <div
                        key={loan.id}
                        className="mt-3 rounded-xl bg-white p-3 text-sm"
                      >
                        <p>
                          Lender: {loan.lender}
                        </p>

                        <p>
                          Outstanding:{" "}
                          {money(
                            Number(loan.outstanding)
                          )}
                        </p>

                        <p>
                          Payment Overdue:{" "}
                          {loan.overdue}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* DECISION HISTORY */}
              <div className="rounded-xl bg-gray-50 p-5">

                <h3 className="mb-5 font-bold">
                  🕒 Decision & Activity Timeline
                </h3>

                {(selectedApplication.timeline || [])
                  .length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No actions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4 border-l-2 border-green-500 pl-4">

                    {[
                      ...(selectedApplication.timeline || []),
                    ]
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl bg-white p-4 shadow-sm"
                        >
                          <p className="font-semibold text-green-800">
                            {event.action}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(event.date)}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Actor: {event.actor}
                          </p>

                          {event.remarks && (
                            <p className="mt-3 whitespace-pre-wrap text-sm">
                              {event.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
