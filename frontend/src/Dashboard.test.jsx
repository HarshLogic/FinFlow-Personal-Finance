import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./pages/Dashboard";
import {
  getSummary,
  getExpenseAnalytics,
} from "./api";

jest.mock("./api", () => ({

  getSummary: jest.fn(),
  getExpenseAnalytics: jest.fn(),
}));

// Recharts mock
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

const summaryResponse = {
  data: {
    summary: {
      totalWealth: 100000,
      totalPL: 5000,
      totalInvested: 95000,
      allocation: {
        liquid: { value: 20000 },
        stocks: { value: 30000 },
        mutualFunds: { value: 30000 },
        fixedDeposits: { value: 20000 },
      },
    },
    expenses: {
      needSpend: 10000,
      wantSpend: 5000,
    },
  },
};

const analyticsResponse = {
  data: [
    {
      _id: {
        year: 2026,
        month: 6,
        type: "need",
      },
      total: 10000,
    },
  ],
};

describe("Dashboard Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  test("shows dashboard data after successful API calls", async () => {

    getSummary.mockResolvedValue(summaryResponse);
    getExpenseAnalytics.mockResolvedValue(analyticsResponse);

    render(<Dashboard />);

    expect(await screen.findByText("Total Wealth"))
      .toBeInTheDocument();

    expect(screen.getByText("Monthly Expense Flow"))
      .toBeInTheDocument();

    expect(screen.getByText("Asset Allocation"))
      .toBeInTheDocument();
  });


  test("shows error when API fails", async () => {

    getSummary.mockRejectedValue({
      response: {
        data: {
          error: "Failed API",
        },
      },
    });

    render(<Dashboard />);
    expect(
    await screen.findByText(/Failed API/i)
     ).toBeInTheDocument();
 
    });

 test("retry button calls API again", async () => {
    getSummary
      .mockRejectedValueOnce({
        response: {
          data: {
            error: "Failed API",
          },
        },
      })
      .mockResolvedValue(summaryResponse);

    getExpenseAnalytics
      .mockResolvedValue(analyticsResponse);

    render(<Dashboard />);

    const retryButton =
      await screen.findByText("Retry");

   await userEvent.click(retryButton);

    await waitFor(() => {
      expect(getSummary)
        .toHaveBeenCalledTimes(2);
    });

  });


  test("shows empty expense message", async () => {

    getSummary.mockResolvedValue(summaryResponse);

    getExpenseAnalytics.mockResolvedValue({
      data: [],
    });

    render(<Dashboard />);

    expect(
  await screen.findByText(/No expense data/i)
).toBeInTheDocument();

  });

});