import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import MonthlyCAReport from "../pages/MonthlyCAReport";
import PurchaseSimulator from "../pages/PurchaseSimulator";
import { common, themes } from "../shared";

const C = { ...themes.dark, ...common };

const mockReportData = {
  year: 2026,
  month: 11,
  reportingPeriod: { label: "November 2026" },
  currency: "INR",
  isProvisional: true,
  financialSummary: {
    totalIncome: 100000,
    totalExpenses: 40000,
    totalSavings: 60000,
    savingsRate: 60,
    liquidBalance: 80000,
    fixedCommitments: 20000,
    pendingBills: 2000,
    netWorth: 300000,
  },
  healthScore: {
    score: 88,
    rating: "Healthy",
    color: "#3B82F6",
    breakdown: {
      savingsPerformance: { score: 25 },
      budgetDiscipline: { score: 18 },
      emergencyFundCoverage: { score: 18 },
      debtAndObligations: { score: 14 },
      investmentConsistency: { score: 8 },
      cashFlowStability: { score: 5 },
    },
  },
  spendingAnalysis: {
    needSpend: 25000,
    wantSpend: 15000,
    needPct: 62.5,
    wantPct: 37.5,
    topCategories: [{ category: "Rent", amount: 15000, percentage: 37.5 }],
  },
  investmentAnalysis: {
    savingsTarget: 20000,
    actualSavings: 60000,
    targetCompletionPct: 100,
    portfolioAllocation: { stocks: 50000, mutualFunds: 50000, fixedDeposits: 50000 },
  },
  recommendations: [
    {
      priority: "MEDIUM",
      title: "Trim Weekend Splurges",
      reason: "Dining is high",
      suggestedAction: "Limit eating out",
    },
  ],
  nextMonthActionPlan: ["Pay broadband on time"],
};

// Mock API
jest.mock("../api", () => ({
  getMonthlyReport: jest.fn(() => Promise.resolve({ data: { report: mockReportData } })),
  getMonthlyReportsHistory: jest.fn(() => Promise.resolve({ data: { history: [] } })),
  generateMonthlyReport: jest.fn(() => Promise.resolve({ data: { report: mockReportData } })),
  exportReportPDF: jest.fn(() => Promise.resolve({ data: new Blob() })),
  exportReportCSV: jest.fn(() => Promise.resolve({ data: "csv" })),
  getSafeToSpend: jest.fn(() => Promise.resolve({
    data: {
      data: {
        monthSafeToSpend: 25000,
        dailySafeToSpend: 1666,
      },
    },
  })),
  getAffordabilityProfile: jest.fn(() => Promise.resolve({
    data: {
      profile: {
        monthlyIncome: 80000,
        essentialExpenses: 30000,
        existingEMIs: 10000,
        plannedSavings: 15000,
        liquidBalance: 200000,
        otherUnpaidCommitments: 5000,
        emergencyFundMonths: 6,
      },
    },
  })),
  getSimulationHistory: jest.fn(() => Promise.resolve({ data: { history: [] } })),
  analyzeAffordability: jest.fn(() => Promise.resolve({ data: {} })),
  savePurchaseSimulation: jest.fn(() => Promise.resolve({ data: {} })),
  deleteSimulation: jest.fn(() => Promise.resolve({ data: {} })),
  convertSimulationToGoal: jest.fn(() => Promise.resolve({ data: {} })),
  recalculateSimulation: jest.fn(() => Promise.resolve({ data: {} })),
}));

describe("New Features Frontend Verification", () => {
  test("MonthlyCAReport renders score, period, and action plan", async () => {
    render(<MonthlyCAReport C={C} currency="INR" />);

    expect(await screen.findByText(/Monthly Personal CA Report/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Financial Health Score/i))[0]).toBeInTheDocument();
    expect(await screen.findByText(/Download PDF/i)).toBeInTheDocument();
  });

  test("PurchaseSimulator renders input form and capacity indicator", async () => {
    render(<PurchaseSimulator C={C} currency="INR" />);

    expect(await screen.findByText(/Can I Afford It\? — Smart Purchase Simulator/i)).toBeInTheDocument();
    expect(await screen.findByText(/Simulate a Planned Purchase/i)).toBeInTheDocument();
    expect(await screen.findByText(/Check If I Can Afford It/i)).toBeInTheDocument();
    expect(await screen.findByText(/Full Payment/i)).toBeInTheDocument();
    expect(await screen.findByText(/EMI Payment/i)).toBeInTheDocument();
  });

  test("PurchaseSimulator switches to EMI tab and syncs FinFlow data", async () => {
    render(<PurchaseSimulator C={C} currency="INR" />);

    // Click EMI Payment tab
    const emiTab = await screen.findByText(/EMI Payment/i);
    fireEvent.click(emiTab);
    expect(await screen.findByText(/Loan Financing & EMI Terms/i)).toBeInTheDocument();
    expect(await screen.findByText(/Loan Tenure \(Months\)/i)).toBeInTheDocument();

    // Click Use My FinFlow Data button
    const syncBtn = await screen.findByText(/Use My FinFlow Data/i);
    fireEvent.click(syncBtn);
    expect(await screen.findByText(/FinFlow live financial data synced successfully/i)).toBeInTheDocument();
  });
});
