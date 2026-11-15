
import type {
  CreditAssessment,
  LoanApplication,
  SimulationAssumptions,
  SimulationResult,
} from "@/lib/creditAssessment";

export const ASSESSMENT_STORAGE_KEY =
  "kisanAssessmentSnapshots";

export type AssessmentSnapshot = {
  applicationId: string;
  savedAt: string;
  inputFingerprint: string;
  ruleVersion: string;
  simulationVersion: string;
  financialResult: CreditAssessment["financialResult"];
  financialFindings: CreditAssessment["financialFindings"];
  verificationFindings: CreditAssessment["verificationFindings"];
  agriculturalFindings: CreditAssessment["agriculturalFindings"];
  assumptions: SimulationAssumptions;
  simulationRun: number;
  results: {
    iterations: number;
    medianSurplus: number;
    lowerSurplus: number;
    upperSurplus: number;
    shortfallCount: number;
    shortfallFrequency: number;
    newLoanAnnualPayment: number;
    existingAnnualPayments: number;
    baselineCropCosts: number;
    baselineSurplus: number;
    otherIncome: number;
    reconciliationPassed: boolean;
  };
};

export function inputFingerprint(
  app: LoanApplication
): string {
  return JSON.stringify({
    id: app.id,
    loanAmount: app.loanAmount,
    cropIncome: app.cropIncome,
    totalAnnualIncome: app.totalAnnualIncome,
    landType: app.landType,
    crops: app.crops || [],
    hasExistingLoan: app.hasExistingLoan,
    existingLoans: app.existingLoans || [],
  });
}

export function makeSnapshot(
  app: LoanApplication,
  assessment: CreditAssessment,
  simulation: SimulationResult,
  assumptions: SimulationAssumptions,
  runNumber: number,
  reconciliationPassed: boolean
): AssessmentSnapshot {
  const baselineSurplus =
    assessment.annualIncome -
    simulation.baselineCropCosts -
    assumptions.householdExpenses -
    simulation.annualNewLoanPayment -
    simulation.existingAnnualPayments;

  return {
    applicationId: app.id,
    savedAt: new Date().toISOString(),
    inputFingerprint: inputFingerprint(app),
    ruleVersion: assessment.version,
    simulationVersion: "KLP-MC-1.0",
    financialResult: assessment.financialResult,
    financialFindings: assessment.financialFindings,
    verificationFindings: assessment.verificationFindings,
    agriculturalFindings: assessment.agriculturalFindings,
    assumptions: { ...assumptions },
    simulationRun: runNumber,
    results: {
      iterations: simulation.iterations,
      medianSurplus: simulation.medianSurplus,
      lowerSurplus: simulation.lowerSurplus,
      upperSurplus: simulation.upperSurplus,
      shortfallCount: simulation.shortfallCount,
      shortfallFrequency: simulation.shortfallFrequency,
      newLoanAnnualPayment:
        simulation.annualNewLoanPayment,
      existingAnnualPayments:
        simulation.existingAnnualPayments,
      baselineCropCosts: simulation.baselineCropCosts,
      baselineSurplus,
      otherIncome: assessment.otherIncome,
      reconciliationPassed,
    },
  };
}

export function saveAssessmentSnapshot(
  snapshot: AssessmentSnapshot
): void {
  const raw = localStorage.getItem(
    ASSESSMENT_STORAGE_KEY
  );

  const records: unknown = raw
    ? JSON.parse(raw)
    : {};

  if (
    !records ||
    typeof records !== "object" ||
    Array.isArray(records)
  ) {
    throw new Error("Invalid assessment snapshot store");
  }

  localStorage.setItem(
    ASSESSMENT_STORAGE_KEY,
    JSON.stringify({
      ...records,
      [snapshot.applicationId]: snapshot,
    })
  );
}

export function getAssessmentSnapshot(
  id: string
): AssessmentSnapshot | null {
  const raw = localStorage.getItem(
    ASSESSMENT_STORAGE_KEY
  );

  if (!raw) return null;

  const records: unknown = JSON.parse(raw);

  if (
    !records ||
    typeof records !== "object" ||
    Array.isArray(records)
  ) {
    return null;
  }

  const candidate = (
    records as Record<string, unknown>
  )[id];

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  return candidate as AssessmentSnapshot;
}

export function assessmentAuditText(
  snapshot: AssessmentSnapshot
): string {
  const money = (value: number) =>
    "₹" + Math.round(value).toLocaleString("en-IN");

  return [
    `Assessment captured: ${snapshot.savedAt}`,
    `Rule version: ${snapshot.ruleVersion}`,
    `Simulation version: ${snapshot.simulationVersion}`,
    `Financial screening: ${snapshot.financialResult}`,
    `Model assumptions: crop costs ${snapshot.assumptions.cropCostPercent}%, household expenses ${money(snapshot.assumptions.householdExpenses)}, crop downside ${snapshot.assumptions.downsidePercent}%, upside ${snapshot.assumptions.upsidePercent}%, interest ${snapshot.assumptions.interestRatePercent}%, loan duration ${snapshot.assumptions.loanYears} years`,
    `Simulation (${snapshot.results.iterations} runs): median surplus ${money(snapshot.results.medianSurplus)}, 10th percentile ${money(snapshot.results.lowerSurplus)}, shortfall frequency ${(snapshot.results.shortfallFrequency * 100).toFixed(1)}%`,
    `Baseline annual surplus ${money(snapshot.results.baselineSurplus)}`,
    `Other annual income ${money(snapshot.results.otherIncome)}`,
    `Calculation consistency: ${snapshot.results.reconciliationPassed ? "passed" : "requires checking"}`,
    `Financial findings: ${snapshot.financialFindings.map(
      (finding) =>
        `${finding.id} ${finding.title} (${finding.level}: ${finding.value})`
    ).join("; ")}`,
    "Note: Assumptions are illustrative, and the shortfall frequency is not a probability of default.",
  ].join("\n");
}
