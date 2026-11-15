
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  assessCreditRisk,
  runMonteCarloSimulation,
  formatMoney,
  formatPercent,
  DEFAULT_ASSUMPTIONS,
  type LoanApplication,
  type SimulationAssumptions,
  type Finding,
} from "@/lib/creditAssessment";

import {
  makeSnapshot,
  saveAssessmentSnapshot,
} from "@/lib/assessmentAudit";

const KEY = "kisanApplications";

const fieldClass =
  "w-full rounded-xl border border-gray-300 bg-white " +
  "px-4 py-3 outline-none focus:border-green-600";

const panelClass =
  "rounded-2xl bg-white p-5 shadow-sm sm:p-6";

function Findings({
  title,
  items,
}: {
  title: string;
  items: Finding[];
}) {
  const tones: Record<string, string> = {
    Attention: "bg-red-100 text-red-800",
    Review: "bg-amber-100 text-amber-800",
    Information: "bg-blue-100 text-blue-800",
    "Reported OK": "bg-green-100 text-green-800",
  };

  return (
    <section className={panelClass}>
      <h2 className="mb-4 text-xl font-bold">
        {title}
      </h2>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <strong>
                {item.id} — {item.title}
              </strong>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[item.level]}`}
              >
                {item.level}
              </span>
            </div>

            <p className="mt-2 font-semibold text-green-800">
              {item.value}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AssessmentContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [selectedId, setSelectedId] = useState(
    params.get("id") || ""
  );

  const [bank, setBank] = useState("All");

  const [assumptions, setAssumptions] =
    useState<SimulationAssumptions>({
      ...DEFAULT_ASSUMPTIONS,
    });

  const [run, setRun] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);

    try {
      const parsed: unknown = raw
        ? JSON.parse(raw)
        : [];

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid saved application data");
      }

      setApps(parsed as LoanApplication[]);
    } catch (e) {
      console.error(e);
      setError("Could not read saved loan applications.");
    }
  }, []);

  const banks = Array.from(
    new Set(apps.map((a) => a.bank))
  ).sort();

  const visible = apps.filter(
    (a) => bank === "All" || a.bank === bank
  );

  const app =
    visible.find((a) => a.id === selectedId) || null;

  const assessment = useMemo(
    () => (app ? assessCreditRisk(app) : null),
    [app]
  );

  const simulation = useMemo(
    () =>
      app
        ? runMonteCarloSimulation(
            app,
            assumptions,
            run
          )
        : null,
    [app, assumptions, run]
  );

  // Check that simulation results fit the
  // same baseline cash-flow calculation.
  const reconciliation = useMemo(() => {
    if (!assessment || !simulation) return null;

    const baseline =
      assessment.annualIncome -
      simulation.baselineCropCosts -
      assumptions.householdExpenses -
      simulation.existingAnnualPayments -
      simulation.annualNewLoanPayment;

    const lowerBound =
      baseline -
      assessment.cropIncome *
        (assumptions.downsidePercent / 100);

    const upperBound =
      baseline +
      assessment.cropIncome *
        (assumptions.upsidePercent / 100);

    const tolerance = Math.max(
      0.01,
      Math.abs(baseline) * 1e-9
    );

    const passed =
      simulation.minSurplus >= lowerBound - tolerance &&
      simulation.maxSurplus <= upperBound + tolerance &&
      simulation.lowerSurplus <= simulation.medianSurplus &&
      simulation.medianSurplus <= simulation.upperSurplus &&
      simulation.shortfallCount >= 0 &&
      simulation.shortfallCount <= simulation.iterations &&
      Math.abs(
        simulation.shortfallFrequency -
          simulation.shortfallCount / simulation.iterations
      ) < 1e-9;

    return {
      baseline,
      lowerBound,
      upperBound,
      passed,
      medianChange:
        simulation.medianSurplus - baseline,
    };
  }, [assessment, simulation, assumptions]);

  function changeAssumption(
    name: keyof SimulationAssumptions,
    value: number
  ) {
    if (!Number.isFinite(value)) return;

    const limits: Record<
      keyof SimulationAssumptions,
      [number, number]
    > = {
      cropCostPercent: [0, 100],
      householdExpenses: [0, 100000000],
      downsidePercent: [0, 100],
      upsidePercent: [0, 200],
      interestRatePercent: [0, 40],
      loanYears: [1, 20],
    };

    const [min, max] = limits[name];

    setAssumptions((old) => ({
      ...old,
      [name]: Math.min(
        max,
        Math.max(
          min,
          name === "loanYears"
            ? Math.round(value)
            : value
        )
      ),
    }));

    setRun(0);
    setMessage("");
  }

  function saveSnapshot() {
    if (
      !app ||
      !assessment ||
      !simulation ||
      !reconciliation
    ) {
      return;
    }

    if (!reconciliation.passed) {
      setError(
        "The simulation has not passed its consistency check. " +
          "Do not save it for a decision."
      );
      return;
    }

    try {
      const snapshot = makeSnapshot(
        app,
        assessment,
        simulation,
        assumptions,
        run,
        reconciliation.passed
      );

      saveAssessmentSnapshot(snapshot);

      setError("");
      setMessage(
        "Assessment snapshot saved. Return to the Bank " +
          "Dashboard to record your decision and written reason."
      );
    } catch (e) {
      console.error(e);
      setError("Could not save the assessment snapshot.");
    }
  }

  const controls: {
    key: keyof SimulationAssumptions;
    label: string;
    step: number;
  }[] = [
    {
      key: "cropCostPercent",
      label: "Baseline crop production costs (%)",
      step: 1,
    },
    {
      key: "householdExpenses",
      label: "Annual household expenses (₹)",
      step: 1000,
    },
    {
      key: "downsidePercent",
      label: "Maximum crop-income decline (%)",
      step: 1,
    },
    {
      key: "upsidePercent",
      label: "Maximum crop-income increase (%)",
      step: 1,
    },
    {
      key: "interestRatePercent",
      label: "Assumed annual loan interest (%)",
      step: 0.5,
    },
    {
      key: "loanYears",
      label: "Assumed loan duration (years)",
      step: 1,
    },
  ];

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-900">
              📊 Credit Risk Assessment
            </h1>

            <p className="mt-2 text-gray-600">
              Financial screening, agricultural scenarios
              and auditable results.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/bank/dashboard")
            }
            className="rounded-xl border border-green-700 bg-white px-5 py-3 font-semibold text-green-800"
          >
            ← Bank Dashboard
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-red-800"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-xl bg-green-100 p-4 text-green-900"
          >
            {message}
          </p>
        )}

        <section className={panelClass}>
          <h2 className="mb-4 text-lg font-bold">
            Select Loan Application
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-semibold">
              Bank
              <select
                className={`mt-2 ${fieldClass}`}
                value={bank}
                onChange={(e) => {
                  setBank(e.target.value);
                  setSelectedId("");
                }}
              >
                <option value="All">All Banks</option>
                {banks.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="font-semibold">
              Application
              <select
                className={`mt-2 ${fieldClass}`}
                value={app?.id || ""}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setMessage("");
                }}
              >
                <option value="">
                  Select application
                </option>

                {visible.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {formatMoney(a.loanAmount)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {app && assessment && simulation &&
          reconciliation && (
          <>
            <section className={panelClass}>
              <p className="text-sm text-gray-600">
                Financial screening • {assessment.version}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-green-900">
                {assessment.financialResult}
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                This screening is based on reported
                information. It does not approve or reject a loan.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  [
                    "Loan requested",
                    formatMoney(assessment.requestedAmount),
                  ],
                  [
                    "Annual total income",
                    formatMoney(assessment.annualIncome),
                  ],
                  [
                    "Existing debt",
                    formatMoney(assessment.existingDebt),
                  ],
                  [
                    "Existing repayment burden",
                    assessment.repaymentRatio === null
                      ? "N/A"
                      : formatPercent(
                          assessment.repaymentRatio
                        ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-green-50 p-3"
                  >
                    <p className="text-xs text-gray-600">
                      {label}
                    </p>
                    <p className="mt-1 font-bold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Findings
              title="1. Financial Findings"
              items={assessment.financialFindings}
            />

            <Findings
              title="2. Documentation & Verification"
              items={assessment.verificationFindings}
            />

            <Findings
              title="3. Agricultural Exposure"
              items={assessment.agriculturalFindings}
            />

            <section className={panelClass}>
              <h2 className="text-xl font-bold text-green-900">
                🎲 Monte Carlo Simulation
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                2,000 illustrative crop-income outcomes.
                They are not calibrated default probabilities.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {controls.map((c) => (
                  <label
                    key={c.key}
                    className="text-sm font-semibold"
                  >
                    {c.label}

                    <input
                      type="number"
                      className={`mt-2 ${fieldClass}`}
                      value={assumptions[c.key]}
                      step={c.step}
                      onChange={(e) =>
                        changeAssumption(
                          c.key,
                          Number(e.target.value)
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssumptions({
                      ...DEFAULT_ASSUMPTIONS,
                    });
                    setRun(0);
                  }}
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Reset Assumptions
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRun((r) => r + 1)
                  }
                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
                >
                  Run New Simulation
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  [
                    "Scenarios",
                    simulation.iterations.toLocaleString(
                      "en-IN"
                    ),
                  ],
                  [
                    "Median surplus",
                    formatMoney(
                      simulation.medianSurplus
                    ),
                  ],
                  [
                    "10th percentile",
                    formatMoney(
                      simulation.lowerSurplus
                    ),
                  ],
                  [
                    "Shortfall frequency",
                    formatPercent(
                      simulation.shortfallFrequency
                    ),
                  ],
                  [
                    "New loan annual payment",
                    formatMoney(
                      simulation.annualNewLoanPayment
                    ),
                  ],
                  [
                    "Existing annual payments",
                    formatMoney(
                      simulation.existingAnnualPayments
                    ),
                  ],
                  [
                    "Assumed crop costs",
                    formatMoney(
                      simulation.baselineCropCosts
                    ),
                  ],
                  [
                    "90th percentile",
                    formatMoney(
                      simulation.upperSurplus
                    ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-green-50 p-3"
                  >
                    <p className="text-xs text-gray-600">
                      {label}
                    </p>

                    <p className="mt-2 font-bold text-green-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="mt-7 mb-4 font-bold">
                Simulated Annual Surplus Distribution
              </h3>

              <div className="space-y-3">
                {simulation.histogram.map(
                  (bucket, i) => (
                    <div key={i}>
                      <div className="flex flex-wrap justify-between gap-2 text-xs">
                        <span>
                          {bucket.label}
                        </span>
                        <span>
                          {bucket.count} runs (
                          {bucket.percent.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-700"
                          style={{
                            width: `${
                              Math.max(
                                0,
                                bucket.percent
                              )
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm leading-6">
                <h3 className="font-bold">
                  How to Interpret These Results
                </h3>

                <p className="mt-2">
                  Of{" "}
                  {simulation.iterations.toLocaleString(
                    "en-IN"
                  )}{" "}
                  scenarios, {simulation.shortfallCount} produced
                  a negative annual cash surplus. This is a
                  scenario frequency under selected assumptions,
                  not a prediction of default.
                </p>

                <p className="mt-2">
                  The 10th percentile annual surplus is{" "}
                  {formatMoney(
                    simulation.lowerSurplus
                  )}; the median is{" "}
                  {formatMoney(
                    simulation.medianSurplus
                  )}.
                </p>
              </div>
            </section>

            <section className={panelClass}>
              <h2 className="text-xl font-bold">
                Calculation Reconciliation
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                This checks that simulation values fit
                the same income and expense formula.
                It does not validate whether farmer-reported
                amounts are accurate.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  [
                    "Annual crop income",
                    assessment.cropIncome,
                  ],
                  [
                    "Other annual income",
                    assessment.otherIncome,
                  ],
                  [
                    "Total annual income",
                    assessment.annualIncome,
                  ],
                  [
                    "Crop costs",
                    -simulation.baselineCropCosts,
                  ],
                  [
                    "Household expenses",
                    -assumptions.householdExpenses,
                  ],
                  [
                    "Existing repayments",
                    -simulation.existingAnnualPayments,
                  ],
                  [
                    "New loan payment",
                    -simulation.annualNewLoanPayment,
                  ],
                  [
                    "Baseline surplus",
                    reconciliation.baseline,
                  ],
                  [
                    "Median vs. baseline",
                    reconciliation.medianChange,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-gray-50 p-3"
                  >
                    <p className="text-xs text-gray-600">
                      {label}
                    </p>

                    <p className="mt-1 font-bold">
                      {formatMoney(
                        Number(value)
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm">
                The simulated median differs from baseline
                because simulated crop receipts differ from
                reported annual crop receipts; other income
                and modeled costs stay constant.
              </p>

              <p
                className={`mt-4 rounded-xl p-4 font-semibold ${
                  reconciliation.passed
                    ? "bg-green-50 text-green-900"
                    : "bg-red-50 text-red-900"
                }`}
              >
                {reconciliation.passed
                  ? "✓ Arithmetic consistency check passed"
                  : "⚠ Arithmetic consistency check failed"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                The simulated surplus must stay between{" "}
                {formatMoney(
                  reconciliation.lowerBound
                )}{" "}
                and{" "}
                {formatMoney(
                  reconciliation.upperBound
                )}{" "}
                under the selected crop-income bounds.
              </p>
            </section>

            <section className={panelClass}>
              <h2 className="text-xl font-bold">
                Save Assessment for Bank Decision
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Save the current rules, assumptions,
                simulation outputs and calculation check.
                Your Bank Dashboard will attach this
                snapshot when you make a loan offer
                or reject an application.
              </p>

              <button
                type="button"
                onClick={saveSnapshot}
                disabled={!reconciliation.passed}
                className="mt-4 w-full rounded-xl bg-green-700 px-6 py-4 font-semibold text-white disabled:opacity-50"
              >
                Save Assessment Snapshot
              </button>

              <p className="mt-3 text-xs text-gray-500">
                If you change the simulation assumptions,
                save again so the bank decision uses
                the latest version.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function CreditAssessmentPage() {
  return (
    <Suspense fallback={<p>Loading assessment...</p>}>
      <AssessmentContent />
    </Suspense>
  );
}
