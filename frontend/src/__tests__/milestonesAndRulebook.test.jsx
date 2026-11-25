import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as api from "../api";
import OnboardingModal from "../components/OnboardingModal";
import FinancialMilestones from "../pages/FinancialMilestones";
import FinancialRulebook from "../pages/FinancialRulebook";
import {
  EmergencyFundCalculator,
  RuleOf72Calculator,
  Budget503020Calculator,
  NetWorthCalculator,
} from "../components/RuleCalculators";
import { common, themes } from "../shared";

const C = { ...themes.dark, ...common };

jest.mock("../api");

describe("Financial Foundation & Rulebook Frontend Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    api.getFinancialFoundation.mockResolvedValue({
      data: {
        success: true,
        data: {
          score: 50,
          classification: "Building Your Financial Foundation",
          status: "FOUNDATION_IN_PROGRESS",
          milestones: {
            emergencyFund: { completed: true, answered: true, points: 50 },
            healthInsurance: { completed: false, answered: true, points: 0 },
          },
          onboarding: { status: "COMPLETED" },
        },
      },
    });

    api.updateFinancialMilestones.mockResolvedValue({
      data: {
        success: true,
        data: {
          score: 100,
          classification: "Financial Foundation Complete",
          status: "FOUNDATION_COMPLETE",
          milestones: {
            emergencyFund: { completed: true, answered: true, points: 50 },
            healthInsurance: { completed: true, answered: true, points: 50 },
          },
        },
      },
    });

    api.completeOnboarding.mockResolvedValue({
      data: {
        success: true,
        data: {
          score: 100,
          classification: "Financial Foundation Complete",
        },
      },
    });

    api.dismissOnboarding.mockResolvedValue({ data: { success: true } });

    api.getFinancialRules.mockResolvedValue({
      data: {
        success: true,
        rules: [
          {
            id: "RULE_01",
            number: "01",
            category: "Financial Protection",
            title: "Emergency Fund Rule",
            tagline: "Minimum 3 months of income; recommended 6 months of essential living expenses.",
            explanation: "An emergency fund is liquid cash set aside in a high-interest savings account.",
            whyItMatters: "Without an emergency buffer, unexpected financial shocks turn into debt.",
            formula: "Target = Monthly Expenses × 3 to 6",
            practicalExample: "₹50,000 monthly expenses = ₹1.5L to ₹3L buffer.",
            calculatorType: "EMERGENCY_FUND",
            assumptions: "Accessible within 24 hours.",
          },
          {
            id: "RULE_06",
            number: "06",
            category: "Budgeting and Spending",
            title: "50/30/20 Budgeting Rule",
            tagline: "50% Needs, 30% Wants, 20% Savings.",
            explanation: "Balanced budgeting framework.",
            whyItMatters: "Ensures living within means.",
            formula: "50% Needs, 30% Wants, 20% Savings",
            practicalExample: "₹80,000 salary: ₹40k Needs, ₹24k Wants, ₹16k Savings.",
            calculatorType: "BUDGET_50_30_20",
            assumptions: "Net take-home income.",
          },
        ],
        categories: ["Financial Protection", "Budgeting and Spending"],
        attribution: "Inspired by Morgan Housel, The Psychology of Money",
      },
    });
  });

  describe("OnboardingModal", () => {
    test("renders modal with initial state and live score recalculation", () => {
      render(<OnboardingModal isOpen={true} onClose={jest.fn()} C={C} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Build Your Financial Foundation/i)).toBeInTheDocument();
      expect(screen.getByText("Starting Your Financial Journey")).toBeInTheDocument();

      const emergencyCheckbox = screen.getByLabelText(/I have an emergency fund/i);
      const insuranceCheckbox = screen.getByLabelText(/I have health insurance/i);

      // Check emergency fund -> score jumps to 50
      fireEvent.click(emergencyCheckbox);
      expect(screen.getByText("Building Your Financial Foundation")).toBeInTheDocument();

      // Check insurance -> score jumps to 100
      fireEvent.click(insuranceCheckbox);
      expect(screen.getByText("Financial Foundation Complete")).toBeInTheDocument();

      // Uncheck insurance -> score falls back
      fireEvent.click(insuranceCheckbox);
      expect(screen.getByText("Building Your Financial Foundation")).toBeInTheDocument();

      expect(screen.getByText(/Save & Continue/i)).toBeInTheDocument();
      expect(screen.getByText(/Skip for Now/i)).toBeInTheDocument();
    });

    test("does not render when isOpen is false", () => {
      const { container } = render(<OnboardingModal isOpen={false} onClose={jest.fn()} C={C} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("FinancialMilestones Page", () => {
    test("renders score, milestones checklist, and personalized next steps", async () => {
      render(<FinancialMilestones C={C} onNavigate={jest.fn()} />);

      expect(await screen.findByText(/Financial Milestones & Foundation/i)).toBeInTheDocument();
      expect(await screen.findByText("Building Your Financial Foundation")).toBeInTheDocument();
      expect(screen.getAllByText(/Emergency Fund/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Health Insurance/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Personalized Next Steps/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore the 28 Rules of Financial Wisdom/i)).toBeInTheDocument();
    });

    test("handles toggling milestone checkbox", async () => {
      render(<FinancialMilestones C={C} onNavigate={jest.fn()} />);

      const toggleCheckbox = await screen.findByLabelText(/Toggle health insurance completion/i);
      fireEvent.click(toggleCheckbox);

      await waitFor(() => {
        expect(screen.getByText("Financial Foundation Complete")).toBeInTheDocument();
      });
    });
  });

  describe("FinancialRulebook Page", () => {
    test("renders header, Morgan Housel attribution, and rules list", async () => {
      render(<FinancialRulebook C={C} onNavigate={jest.fn()} />);

      expect(await screen.findByText(/Financial Rulebook/i)).toBeInTheDocument();
      expect(await screen.findByText(/Inspired by Morgan Housel, The Psychology of Money/i)).toBeInTheDocument();
      expect(await screen.findByText(/Emergency Fund Rule/i)).toBeInTheDocument();
      expect(await screen.findByText(/50\/30\/20 Budgeting Rule/i)).toBeInTheDocument();
    });

    test("filters rules based on search input", async () => {
      render(<FinancialRulebook C={C} onNavigate={jest.fn()} />);

      // Wait until rules are loaded
      expect(await screen.findByText(/Emergency Fund Rule/i)).toBeInTheDocument();
      expect(screen.getByText(/50\/30\/20 Budgeting Rule/i)).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/Search all 28 rules/i);
      fireEvent.change(searchInput, { target: { value: "Emergency" } });

      expect(screen.getByText(/Emergency Fund Rule/i)).toBeInTheDocument();
      expect(screen.queryByText(/50\/30\/20 Budgeting Rule/i)).not.toBeInTheDocument();
    });
  });

  describe("Interactive Rule Calculators", () => {
    test("EmergencyFundCalculator calculates cushion based on expenses and months", () => {
      render(<EmergencyFundCalculator C={C} />);
      expect(screen.getByText(/Emergency Fund Target Calculator/i)).toBeInTheDocument();
      // Default: 40000 * 6 = 240,000
      expect(screen.getByText(/₹2,40,000/i)).toBeInTheDocument();

      // Click 3m button
      const threeMonthsBtn = screen.getByRole("button", { name: "3m" });
      fireEvent.click(threeMonthsBtn);
      // 40000 * 3 = 120,000
      expect(screen.getByText(/₹1,20,000/i)).toBeInTheDocument();
    });

    test("RuleOf72Calculator calculates doubling years", () => {
      render(<RuleOf72Calculator C={C} />);
      expect(screen.getByText(/Rule of 72: Doubling Time/i)).toBeInTheDocument();
      // Default 12%: 72 / 12 = 6.0 Years
      expect(screen.getByText(/6.0 Years/i)).toBeInTheDocument();

      // Click FD benchmark button (7%)
      const fdBtn = screen.getByRole("button", { name: /FD \(7%\)/i });
      fireEvent.click(fdBtn);
      // 72 / 7 = 10.3 Years
      expect(screen.getByText(/10.3 Years/i)).toBeInTheDocument();
    });

    test("Budget503020Calculator calculates 50%, 30%, 20% distribution", () => {
      render(<Budget503020Calculator C={C} />);
      // Default income 75000:
      // Needs: 37,500
      // Wants: 22,500
      // Savings: 15,000
      expect(screen.getByText(/₹37,500/i)).toBeInTheDocument();
      expect(screen.getByText(/₹22,500/i)).toBeInTheDocument();
      expect(screen.getByText(/₹15,000/i)).toBeInTheDocument();
    });

    test("NetWorthCalculator calculates Assets minus Liabilities", () => {
      render(<NetWorthCalculator C={C} />);
      // Default: Liquid 2.5L + Invest 15L + RealEstate 40L = 57.5L assets
      // Debts: 28L
      // Net Worth: 29.5L
      expect(screen.getByText(/₹57,50,000/i)).toBeInTheDocument();
      expect(screen.getByText(/₹28,00,000/i)).toBeInTheDocument();
      expect(screen.getByText(/₹29,50,000/i)).toBeInTheDocument();
    });
  });
});
