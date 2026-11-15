
export type Crop = {
  id: number;
  name: string;
  season: string;
  area: string;
};

export type ExistingLoan = {
  id: number;
  lender: string;
  outstanding: string;
  repayment: string;
  frequency: string;
  overdue: string;
};

export type LoanApplication = {
  id: string;
  createdAt: string;
  status: string;
  landType: string;
  crops: Crop[];
  cropIncome: number;
  totalAnnualIncome: number;
  hasExistingLoan: string;
  existingLoans: ExistingLoan[];
  loanAmount: number;
  loanPurpose: string;
  bank: string;
  branch: string;
};

export type FindingLevel =
  | "Attention"
  | "Review"
  | "Information"
  | "Reported OK";

export type Finding = {
  id: string;
  title: string;
  level: FindingLevel;
  value: string;
  explanation: string;
};

export type CreditAssessment = {
  version: string;
  financialResult:
    | "Priority Financial Review"
    | "Financial Review Required"
    | "Insufficient Income Information"
    | "No Financial Flags Detected";
  annualIncome: number;
  cropIncome: number;
  otherIncome: number;
  requestedAmount: number;
  totalArea: number;
  existingDebt: number;
  annualRepayments: number;
  repaymentRatio: number | null;
  loanIncomeRatio: number | null;
  cropIncomeShare: number | null;
  financialFindings: Finding[];
  verificationFindings: Finding[];
  agriculturalFindings: Finding[];
};

export type SimulationAssumptions = {
  cropCostPercent: number;
  householdExpenses: number;
  downsidePercent: number;
  upsidePercent: number;
  interestRatePercent: number;
  loanYears: number;
};

export type SimulationResult = {
  iterations: number;
  annualNewLoanPayment: number;
  existingAnnualPayments: number;
  baselineCropCosts: number;
  medianSurplus: number;
  lowerSurplus: number;
  upperSurplus: number;
  shortfallCount: number;
  shortfallFrequency: number;
  minSurplus: number;
  maxSurplus: number;
  histogram: {
    label: string;
    count: number;
    percent: number;
  }[];
};

export const RULE_VERSION = "KLP-SCREEN-2.0";
export const SIMULATION_VERSION = "KLP-MC-1.0";

export const DEFAULT_ASSUMPTIONS: SimulationAssumptions = {
  cropCostPercent: 55,
  householdExpenses: 60000,
  downsidePercent: 40,
  upsidePercent: 25,
  interestRatePercent: 10,
  loanYears: 3,
};

export function formatMoney(value: number): string {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })
  );
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

function safeNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

function annualLoanPayment(loan: ExistingLoan): number {
  const repayment = safeNumber(loan.repayment);

  return loan.frequency === "Monthly"
    ? repayment * 12
    : repayment;
}

export function assessCreditRisk(
  app: LoanApplication
): CreditAssessment {
  const annualIncome = safeNumber(app.totalAnnualIncome);
  const cropIncome = safeNumber(app.cropIncome);

  const otherIncome = Math.max(
    0,
    annualIncome - cropIncome
  );

  const requestedAmount = safeNumber(app.loanAmount);

  const existingLoans =
    app.hasExistingLoan === "Yes"
      ? app.existingLoans || []
      : [];

  const totalArea = (app.crops || []).reduce(
    (sum, crop) => sum + safeNumber(crop.area),
    0
  );

  const existingDebt = existingLoans.reduce(
    (sum, loan) => sum + safeNumber(loan.outstanding),
    0
  );

  const annualRepayments = existingLoans.reduce(
    (sum, loan) => sum + annualLoanPayment(loan),
    0
  );

  const repaymentRatio =
    annualIncome > 0
      ? annualRepayments / annualIncome
      : null;

  const loanIncomeRatio =
    annualIncome > 0
      ? requestedAmount / annualIncome
      : null;

  const cropIncomeShare =
    annualIncome > 0
      ? cropIncome / annualIncome
      : null;

  const overdue = existingLoans.some(
    (loan) => loan.overdue === "Yes"
  );

  const financialFindings: Finding[] = [];

  // F01: Overdue repayment information
  financialFindings.push({
    id: "F01",
    title: "Reported Overdue Payments",
    level: overdue ? "Attention" : "Reported OK",
    value: overdue ? "Overdue reported" : "None reported",
    explanation: overdue
      ? "An existing loan has a reported overdue payment. " +
        "The bank should verify the arrears, causes and " +
        "current repayment position."
      : "The farmer has reported no overdue payments. " +
        "This is not independently verified.",
  });

  // F02: Existing payment obligations
  if (repaymentRatio === null) {
    financialFindings.push({
      id: "F02",
      title: "Existing Repayment Burden",
      level: "Review",
      value: "Not calculable",
      explanation:
        "Annual income is zero or unavailable. " +
        "The existing repayment-to-income ratio cannot be computed.",
    });
  } else {
    let level: FindingLevel = "Reported OK";
    let explanation =
      "Reported scheduled repayments do not cross the " +
      "illustrative 40% gross-income review threshold.";

    if (repaymentRatio > 0.6) {
      level = "Attention";
      explanation =
        "Existing repayments exceed 60% of reported gross " +
        "income. Detailed cash-flow verification is important.";
    } else if (repaymentRatio > 0.4) {
      level = "Review";
      explanation =
        "Existing repayments exceed 40% of reported gross " +
        "income. The bank should review repayment capacity.";
    }

    financialFindings.push({
      id: "F02",
      title: "Existing Repayment Burden",
      level,
      value: formatPercent(repaymentRatio),
      explanation,
    });
  }

  // F03: Loan size is contextual, not automatically negative
  financialFindings.push({
    id: "F03",
    title: "Requested Principal Compared with Income",
    level: "Information",
    value:
      loanIncomeRatio === null
        ? "Not calculable"
        : formatPercent(loanIncomeRatio),
    explanation:
      "This compares requested principal with annual gross income. " +
      "It does not represent annual repayment or automatically " +
      "determine affordability.",
  });

  // F04: Existing outstanding debt, informational
  financialFindings.push({
    id: "F04",
    title: "Existing Outstanding Loan Balance",
    level: "Information",
    value: formatMoney(existingDebt),
    explanation:
      "Outstanding debt should be verified together with " +
      "the scheduled repayment amount. Having an existing " +
      "loan is not itself evidence of high risk.",
  });

  const verificationFindings: Finding[] = [];

  // V01: Land relationships are eligibility/document questions,
  // not an automatic financial risk penalty.
  verificationFindings.push({
    id: "V01",
    title: "Cultivation Relationship",
    level: "Information",
    value: app.landType || "Not reported",
    explanation:
      app.landType === "Sharecropper" ||
      app.landType === "Leased"
        ? "Collect appropriate cultivation evidence for " +
          "the reported arrangement. Land ownership should " +
          "not be assumed mandatory."
        : "Verify land and cultivation details through " +
          "the appropriate documentation process.",
  });

  verificationFindings.push({
    id: "V02",
    title: "Cultivated Area",
    level: totalArea > 0 ? "Information" : "Review",
    value:
      totalArea > 0
        ? totalArea.toFixed(2) + " acres"
        : "Not recorded",
    explanation:
      totalArea > 0
        ? "The area is farmer-reported and must be " +
          "verified against cultivation information."
        : "Cultivated area is missing or invalid.",
  });

  verificationFindings.push({
    id: "V03",
    title: "Income and Expense Verification",
    level: "Information",
    value: "Verification pending",
    explanation:
      "Reported income is not verified. Production costs, " +
      "household expenses and proposed loan repayment terms " +
      "are not collected in the current application.",
  });

  const agriculturalFindings: Finding[] = [];

  agriculturalFindings.push({
    id: "A01",
    title: "Share of Income from Crops",
    level: "Information",
    value:
      cropIncomeShare === null
        ? "Not calculable"
        : formatPercent(cropIncomeShare),
    explanation:
      "This describes exposure to crop-income variation. " +
      "Reliance on farming is not automatically a negative " +
      "credit factor. Seasonal outcomes are explored separately.",
  });

  agriculturalFindings.push({
    id: "A02",
    title: "Crops Reported",
    level: "Information",
    value: String((app.crops || []).length),
    explanation:
      "The number of crop entries is shown for context. " +
      "The model does not assume a crop is safe or unsafe " +
      "without regional yield, price and cost evidence.",
  });

  const priority = financialFindings.some(
    (finding) => finding.level === "Attention"
  );

  const review = financialFindings.some(
    (finding) => finding.level === "Review"
  );

  let financialResult:
    CreditAssessment["financialResult"] =
      "No Financial Flags Detected";

  if (annualIncome <= 0) {
    financialResult = "Insufficient Income Information";
  } else if (priority) {
    financialResult = "Priority Financial Review";
  } else if (review) {
    financialResult = "Financial Review Required";
  }

  return {
    version: RULE_VERSION,
    financialResult,
    annualIncome,
    cropIncome,
    otherIncome,
    requestedAmount,
    totalArea,
    existingDebt,
    annualRepayments,
    repaymentRatio,
    loanIncomeRatio,
    cropIncomeShare,
    financialFindings,
    verificationFindings,
    agriculturalFindings,
  };
}

// Annual payment for a hypothetical equal-payment loan.
// A real crop loan / KCC may use a different repayment structure.
export function calculateAnnualPayment(
  principal: number,
  annualRatePercent: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;

  const rate = annualRatePercent / 100;

  if (rate === 0) {
    return principal / years;
  }

  const factor = Math.pow(1 + rate, years);

  return (principal * rate * factor) / (factor - 1);
}

// A seeded random-number generator allows reproducible runs.
function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

// Triangular distribution: minimum, most likely, maximum.
// This distribution is illustrative, not estimated from crop data.
function triangularMultiplier(
  randomValue: number,
  minimum: number,
  mode: number,
  maximum: number
): number {
  if (maximum <= minimum) return minimum;

  const split = (mode - minimum) / (maximum - minimum);

  if (randomValue < split) {
    return minimum + Math.sqrt(
      randomValue * (maximum - minimum) * (mode - minimum)
    );
  }

  return maximum - Math.sqrt(
    (1 - randomValue) *
      (maximum - minimum) *
      (maximum - mode)
  );
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;

  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) return sorted[lower];

  const weight = position - lower;

  return (
    sorted[lower] * (1 - weight) +
    sorted[upper] * weight
  );
}

export function runMonteCarloSimulation(
  app: LoanApplication,
  assumptions: SimulationAssumptions,
  runNumber = 0
): SimulationResult {
  const assessment = assessCreditRisk(app);
  const iterations = 2000;

  const cropIncome = assessment.cropIncome;
  const otherIncome = assessment.otherIncome;

  const existingAnnualPayments =
    assessment.annualRepayments;

  const baselineCropCosts =
    cropIncome * (assumptions.cropCostPercent / 100);

  const annualNewLoanPayment = calculateAnnualPayment(
    assessment.requestedAmount,
    assumptions.interestRatePercent,
    assumptions.loanYears
  );

  const minimumMultiplier = Math.max(
    0,
    1 - assumptions.downsidePercent / 100
  );

  const maximumMultiplier =
    1 + assumptions.upsidePercent / 100;

  const random = seededRandom(
    hashString(app.id + "|" + runNumber)
  );

  const surpluses: number[] = [];
  let shortfallCount = 0;

  for (let i = 0; i < iterations; i++) {
    const cropMultiplier = triangularMultiplier(
      random(),
      minimumMultiplier,
      1,
      maximumMultiplier
    );

    const simulatedCropIncome = cropIncome * cropMultiplier;

    // Cost assumption: baseline crop expenses stay fixed
    // across these scenarios, while crop receipts vary.
    const totalIncome = simulatedCropIncome + otherIncome;

    const cashAvailable =
      totalIncome -
      baselineCropCosts -
      assumptions.householdExpenses;

    const totalAnnualPayments =
      existingAnnualPayments + annualNewLoanPayment;

    const surplus =
      cashAvailable - totalAnnualPayments;

    surpluses.push(surplus);

    if (surplus < 0) {
      shortfallCount++;
    }
  }

  surpluses.sort((a, b) => a - b);

  const minSurplus = surpluses[0];
  const maxSurplus = surpluses[surpluses.length - 1];

  // Build eight equally spaced histogram buckets.
  const bucketCount = 8;

  const spread =
    maxSurplus - minSurplus || 1;

  const counts = Array.from(
    { length: bucketCount },
    () => 0
  );

  for (const value of surpluses) {
    const index = Math.min(
      bucketCount - 1,
      Math.floor(
        ((value - minSurplus) / spread) * bucketCount
      )
    );
    counts[index]++;
  }

  const histogram = counts.map((count, index) => {
    const start =
      minSurplus + (spread * index) / bucketCount;

    const end =
      minSurplus + (spread * (index + 1)) / bucketCount;

    return {
      label:
        formatMoney(start) +
        " to " +
        formatMoney(end),
      count,
      percent: (count / iterations) * 100,
    };
  });

  return {
    iterations,
    annualNewLoanPayment,
    existingAnnualPayments,
    baselineCropCosts,
    medianSurplus: percentile(surpluses, 0.5),
    lowerSurplus: percentile(surpluses, 0.1),
    upperSurplus: percentile(surpluses, 0.9),
    shortfallCount,
    shortfallFrequency:
      shortfallCount / iterations,
    minSurplus,
    maxSurplus,
    histogram,
  };
}
