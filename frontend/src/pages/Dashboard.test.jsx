import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { getSummary, getExpenseAnalytics } from "../api";

// Auto-mock the API module
jest.mock("../api");

// Mock Recharts ResponsiveContainer to prevent width/height measurement failures in JSDOM
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders spinner while loading", () => {
    // Return unresolved promises so it stays in loading state
    getSummary.mockReturnValue(new Promise(() => {}));
    getExpenseAnalytics.mockReturnValue(new Promise(() => {}));
    
    render(<Dashboard />);
    expect(screen.getByRole("status")).toBeInTheDocument(); // assuming Spinner has role="status"
  });

  test("renders error message on API failure", async () => {
    getSummary.mockRejectedValue(new Error("API Error"));
    getExpenseAnalytics.mockRejectedValue(new Error("API Error"));

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument();
    });
  });

  test("renders dashboard data correctly on successful API response", async () => {
    getSummary.mockResolvedValue({
      data: {
        summary: {
          totalWealth: 250000,
          totalInvested: 125000,
          totalPL: 15000,
          allocation: {
            liquid: { value: 95000 },
            stocks: { value: 50000 },
            mutualFunds: { value: 50000 },
            fixedDeposits: { value: 25000 }
          }
        },
        expenses: {
          needSpend: 15000,
          wantSpend: 10000
        }
      }
    });

    getExpenseAnalytics.mockResolvedValue({
      data: [
        {
          _id: { year: 2026, month: 6, type: "need" },
          total: 15000
        }
      ]
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Wealth")).toBeInTheDocument();
    });

    // Check formatting (assuming fmt(250000) results in ₹2,50,000)
    expect(screen.getByText(/₹2,50,000/)).toBeInTheDocument();
    expect(screen.getByText(/₹1,25,000/)).toBeInTheDocument();
    expect(screen.getByText("Needs ₹15k · Wants ₹10k")).toBeInTheDocument();
  });
});
