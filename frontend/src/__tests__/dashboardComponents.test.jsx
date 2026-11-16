import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SafeToSpendCard from "../components/SafeToSpendCard";
import ObligationsWidget from "../components/ObligationsWidget";
import WhoOwesMeWidget from "../components/WhoOwesMeWidget";
import AccountsWidget from "../components/AccountsWidget";
import QuickPasteModal from "../components/QuickPasteModal";
import { common, themes } from "../shared";

const C = { ...themes.dark, ...common };

describe("Frontend Dashboard Components", () => {
  test("SafeToSpendCard renders daily allowance and status", () => {
    const mockSafeData = {
      liquidBalance: 45000,
      remainingObligations: 12000,
      remainingSavingsGoal: 10000,
      safetyBuffer: 5000,
      monthSafeToSpend: 18000,
      remainingDays: 15,
      dailySafeToSpend: 1200,
      shortfall: 0,
      status: "ON_TRACK",
    };

    render(
      <SafeToSpendCard
        C={C}
        currency="INR"
        safeData={mockSafeData}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText(/Safe to Spend Today/i)).toBeInTheDocument();
    expect(screen.getByText(/On Track/i)).toBeInTheDocument();
    expect(screen.getByText(/15/i)).toBeInTheDocument();
  });

  test("ObligationsWidget renders bills and progress", () => {
    const mockObligations = {
      total: 15000,
      paid: 6000,
      remaining: 9000,
      items: [
        {
          id: "1",
          title: "House Rent",
          amount: 12000,
          dueDay: 5,
          category: "Rent",
          isFullyPaid: false,
        },
      ],
    };

    render(
      <ObligationsWidget
        C={C}
        currency="INR"
        obligationsData={mockObligations}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText(/Monthly Fixed Bills/i)).toBeInTheDocument();
    expect(screen.getByText(/House Rent/i)).toBeInTheDocument();
    expect(screen.getByText(/40% Done/i)).toBeInTheDocument();
  });

  test("WhoOwesMeWidget renders pending debt and debtor name", () => {
    const mockSplits = [
      {
        _id: "split_1",
        borrowerName: "Rahul Sharma",
        amount: 1500,
        settledAmount: 500,
        status: "PARTIAL",
      },
    ];
    const mockSummary = {
      totalPending: 1000,
      totalSettled: 500,
      pendingCount: 1,
    };

    render(
      <WhoOwesMeWidget
        C={C}
        currency="INR"
        splits={mockSplits}
        splitsSummary={mockSummary}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText(/Who Owes Me/i)).toBeInTheDocument();
    expect(screen.getByText(/Rahul Sharma/i)).toBeInTheDocument();
  });

  test("AccountsWidget renders accounts list and balance", () => {
    const mockAccounts = [
      {
        _id: "acc_1",
        name: "HDFC Salary Checking",
        type: "CHECKING",
        currentBalance: 45000,
        isLiquid: true,
      },
    ];

    render(
      <AccountsWidget
        C={C}
        currency="INR"
        accounts={mockAccounts}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText(/Connected Accounts & Liquid Cash/i)).toBeInTheDocument();
    expect(screen.getByText(/HDFC Salary Checking/i)).toBeInTheDocument();
  });

  test("QuickPasteModal renders when open", () => {
    render(
      <QuickPasteModal
        C={C}
        currency="INR"
        isOpen={true}
        onClose={() => {}}
        onSaved={() => {}}
        accounts={[]}
      />
    );

    expect(screen.getByText(/Quick Add with SMS Parser/i)).toBeInTheDocument();
    expect(screen.getByText(/Parse Transaction/i)).toBeInTheDocument();
  });
});
