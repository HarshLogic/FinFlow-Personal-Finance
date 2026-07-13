import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseTracker from "./ExpenseTracker";
import { getExpenses, createExpense, deleteExpense, exportExpenses } from "../api";

// Auto-mock the API module
jest.mock("../api");

// Mock Recharts to avoid DOM measuring issues in Jest
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

describe("ExpenseTracker Component", () => {
  const mockExpenses = [
    {
      _id: "1",
      date: "2026-07-01",
      category: "Food",
      label: "Groceries",
      amount: 2500,
      type: "need"
    },
    {
      _id: "2",
      date: "2026-07-02",
      category: "Shopping",
      label: "Sneakers",
      amount: 5000,
      type: "want"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to resolving the global fetch (we mock it per test if needed)
    window.URL.createObjectURL = jest.fn();
    window.URL.revokeObjectURL = jest.fn();
  });

  // --- POSITIVE TEST CASES ---
  describe("Positive Scenarios", () => {
    test("loads and renders expenses successfully", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });

      render(<ExpenseTracker />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("Groceries")).toBeInTheDocument();
        expect(screen.getByText("Sneakers")).toBeInTheDocument();
      });

      // Verify metrics
      expect(screen.getAllByText("₹2,500").length).toBeGreaterThan(0); // total needs and transaction amount
      expect(screen.getAllByText("₹5,000").length).toBeGreaterThan(0); // total wants and transaction amount
      expect(screen.getByText("2")).toBeInTheDocument(); // total entries
    });

    test("adds a new expense successfully", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      createExpense.mockResolvedValue({
        data: {
          _id: "3",
          date: "2026-07-05",
          category: "Travel",
          label: "Cab Ride",
          amount: 500,
          type: "need"
        }
      });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      // Fill out the form
      fireEvent.change(screen.getByPlaceholderText("Date"), { target: { value: "2026-07-05" } });
      fireEvent.change(screen.getByPlaceholderText("Description"), { target: { value: "Cab Ride" } });
      fireEvent.change(screen.getByPlaceholderText("Amount ₹"), { target: { value: "500" } });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Travel" } });

      // Submit the form
      fireEvent.click(screen.getByText("+ Add"));

      await waitFor(() => {
        expect(createExpense).toHaveBeenCalledWith({
          date: "2026-07-05",
          category: "Travel",
          label: "Cab Ride",
          amount: 500,
          type: "need",
          notes: ""
        });
        expect(screen.getByText("Cab Ride")).toBeInTheDocument();
      });
    });

    test("deletes an expense successfully", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      deleteExpense.mockResolvedValue({ data: { message: "Deleted" } });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      // Click delete button for the first item
      const deleteButtons = screen.getAllByText("✕");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deleteExpense).toHaveBeenCalledWith("1");
        expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
      });
    });

    test("exports expenses successfully", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      exportExpenses.mockResolvedValue({ data: "date,amount\n2026-07-01,2500" });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Export CSV"));

      await waitFor(() => {
        expect(exportExpenses).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  // --- NEGATIVE TEST CASES ---
  describe("Negative Scenarios", () => {
    test("shows error message when loading expenses fails", async () => {
      getExpenses.mockRejectedValue({ response: { data: { error: "Failed to fetch expenses" } } });

      render(<ExpenseTracker />);

      await waitFor(() => {
        expect(screen.getByText("⚠ Failed to fetch expenses")).toBeInTheDocument();
      });
    });

    test("shows error message when adding an expense fails", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      createExpense.mockRejectedValue({ response: { data: { error: "Failed to create" } } });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      // Fill out the form
      fireEvent.change(screen.getByPlaceholderText("Date"), { target: { value: "2026-07-05" } });
      fireEvent.change(screen.getByPlaceholderText("Description"), { target: { value: "Cab Ride" } });
      fireEvent.change(screen.getByPlaceholderText("Amount ₹"), { target: { value: "500" } });

      // Submit the form
      fireEvent.click(screen.getByText("+ Add"));

      await waitFor(() => {
        expect(screen.getByText("⚠ Failed to create")).toBeInTheDocument();
      });
    });

    test("does not attempt to add expense if form is incomplete", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      // Submit the form without filling required fields
      fireEvent.click(screen.getByText("+ Add"));

      // createExpense should not be called
      expect(createExpense).not.toHaveBeenCalled();
    });

    test("shows error message when deleting an expense fails", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      deleteExpense.mockRejectedValue({ response: { data: { error: "Cannot delete item" } } });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      // Click delete button for the first item
      const deleteButtons = screen.getAllByText("✕");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("⚠ Cannot delete item")).toBeInTheDocument();
      });
    });

    test("shows error when exporting expenses fails", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      exportExpenses.mockRejectedValue(new Error("Network Error"));

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Export CSV"));

      await waitFor(() => {
        expect(screen.getByText("⚠ Failed to export transactions.")).toBeInTheDocument();
      });
    });

    test("prevents exporting if there are no expenses available", async () => {
      getExpenses.mockResolvedValue({ data: { expenses: [] } });

      render(<ExpenseTracker />);
      await waitFor(() => expect(screen.getByText("No transactions yet. Add one above ↑")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Export CSV"));

      await waitFor(() => {
        expect(screen.getByText("⚠ No transactions available to export.")).toBeInTheDocument();
        expect(exportExpenses).not.toHaveBeenCalled();
      });
    });
  });
});
