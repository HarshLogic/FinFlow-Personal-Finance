import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { getSummary, getExpenseAnalytics } from "./api";

// Auto-mock the API module. Each export is replaced with a Jest mock function.
jest.mock("./api");

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

describe("Frontend App Setup", () => {
  beforeEach(() => {
    // Reset all mock implementations before each test
    jest.clearAllMocks();

    getSummary.mockImplementation(() =>
      Promise.resolve({
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
      })
    );

    getExpenseAnalytics.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            _id: { year: 2026, month: 6, type: "need" },
            total: 15000
          },
          {
            _id: { year: 2026, month: 6, type: "want" },
            total: 10000
          }
        ]
      })
    );
  });

  test("renders FinFlow sidebar and default dashboard page with mock data", async () => {
    render(<App />);

    // Verify sidebar logo text is present
    const logoElement = screen.getByText("FinFlow");
    expect(logoElement).toBeInTheDocument();

    // Verify navigation tabs exist
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Expense Track")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Projections")).toBeInTheDocument();

    // Wait for the mock API responses to load and update the dashboard state
    await waitFor(() => {
      expect(screen.getByText("Total Wealth")).toBeInTheDocument();
    });

    // Check that mock values are rendered on the dashboard
    expect(screen.getByText(/₹2,50,000/)).toBeInTheDocument();
    expect(screen.getByText(/₹1,25,000/)).toBeInTheDocument();
    expect(screen.getByText(/₹95,000/)).toBeInTheDocument();
  });
});
