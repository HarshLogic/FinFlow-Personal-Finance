import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Portfolio from "./Portfolio";
import {
  getStocks, createStock, deleteStock, updateCMP,
  getMF, createMF, deleteMF,
  getFDs, createFD, deleteFD,
  getLiquid, updateLiquid
} from "../api";

// Auto-mock the API module
jest.mock("../api");

describe("Portfolio Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Tabs Navigation", () => {
    test("renders all tabs and switches between them", async () => {
      getStocks.mockResolvedValue({ data: [] });
      getMF.mockResolvedValue({ data: [] });
      getFDs.mockResolvedValue({ data: [] });
      getLiquid.mockResolvedValue({ data: { balance: 0 } });

      render(<Portfolio />);

      // Defaults to Stocks
      await waitFor(() => expect(screen.getByText("Add Stock")).toBeInTheDocument());

      // Switch to MF
      fireEvent.click(screen.getByText("Mutual Funds"));
      await waitFor(() => expect(screen.getByText("Add Mutual Fund")).toBeInTheDocument());

      // Switch to FD
      fireEvent.click(screen.getByText("Fixed Deposits"));
      await waitFor(() => expect(screen.getByText("Add Fixed Deposit")).toBeInTheDocument());

      // Switch to Liquid
      fireEvent.click(screen.getByText("Liquid Cash"));
      await waitFor(() => expect(screen.getByText("Liquid Cash Balance")).toBeInTheDocument());
    });
  });

  describe("Stocks Tab", () => {
    const mockStocks = [{ _id: "s1", ticker: "AAPL", qty: 10, avgPrice: 150, cmp: 160, sector: "Tech" }];

    test("loads and renders stocks", async () => {
      getStocks.mockResolvedValue({ data: mockStocks });
      render(<Portfolio />);
      await waitFor(() => expect(screen.getByText("AAPL")).toBeInTheDocument());
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    test("handles load error", async () => {
      getStocks.mockRejectedValue(new Error("API Error"));
      render(<Portfolio />);
      await waitFor(() => expect(screen.getByText("⚠ Failed to load stocks")).toBeInTheDocument());
    });

    test("adds a new stock", async () => {
      getStocks.mockResolvedValue({ data: mockStocks });
      createStock.mockResolvedValue({ data: { _id: "s2", ticker: "GOOG", qty: 5, avgPrice: 100, cmp: 100, sector: "Tech" } });
      render(<Portfolio />);
      await waitFor(() => expect(screen.getByText("AAPL")).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText("TICKER"), { target: { value: "GOOG" } });
      fireEvent.change(screen.getByPlaceholderText("Qty"), { target: { value: "5" } });
      fireEvent.change(screen.getByPlaceholderText("Avg ₹"), { target: { value: "100" } });
      fireEvent.change(screen.getByPlaceholderText("Sector"), { target: { value: "Tech" } });
      
      fireEvent.click(screen.getByText("+ Add"));
      await waitFor(() => expect(createStock).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("GOOG")).toBeInTheDocument());
    });

    test("deletes a stock", async () => {
      getStocks.mockResolvedValue({ data: mockStocks });
      deleteStock.mockResolvedValue({});
      render(<Portfolio />);
      await waitFor(() => expect(screen.getByText("AAPL")).toBeInTheDocument());

      fireEvent.click(screen.getByText("✕"));
      await waitFor(() => expect(deleteStock).toHaveBeenCalledWith("s1"));
      await waitFor(() => expect(screen.queryByText("AAPL")).not.toBeInTheDocument());
    });

    test("updates CMP", async () => {
      getStocks.mockResolvedValue({ data: mockStocks });
      updateCMP.mockResolvedValue({ data: { ...mockStocks[0], cmp: 170 } });
      render(<Portfolio />);
      await waitFor(() => expect(screen.getByText("AAPL")).toBeInTheDocument());

      // Click the edit pencil icon (or the CMP span)
      fireEvent.click(screen.getByText(/₹160/));
      
      const input = await screen.findByDisplayValue("160");
      fireEvent.change(input, { target: { value: "170" } });
      fireEvent.click(screen.getByText("✓"));

      await waitFor(() => expect(updateCMP).toHaveBeenCalledWith("s1", 170));
      // Should show updated value
      await waitFor(() => expect(screen.getAllByText(/₹170/).length).toBeGreaterThan(0));
    });
  });

  describe("Mutual Funds Tab", () => {
    const mockMFs = [{ _id: "m1", name: "Index Fund", type: "Equity", invested: 5000, units: 50, currentNav: 120 }];

    beforeEach(() => {
      getStocks.mockResolvedValue({ data: [] });
    });

    test("loads and renders mutual funds", async () => {
      getMF.mockResolvedValue({ data: mockMFs });
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Mutual Funds"));
      await waitFor(() => expect(screen.getByText("Index Fund")).toBeInTheDocument());
    });

    test("adds a new mutual fund", async () => {
      getMF.mockResolvedValue({ data: [] });
      createMF.mockResolvedValue({ data: mockMFs[0] });
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Mutual Funds"));
      await waitFor(() => expect(screen.getByText("Add Mutual Fund")).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText("Fund Name"), { target: { value: "Index Fund" } });
      fireEvent.change(screen.getByPlaceholderText("Invested ₹"), { target: { value: "5000" } });
      fireEvent.change(screen.getByPlaceholderText("Units"), { target: { value: "50" } });
      
      fireEvent.click(screen.getByText("+ Add"));
      await waitFor(() => expect(createMF).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("Index Fund")).toBeInTheDocument());
    });

    test("deletes a mutual fund", async () => {
      getMF.mockResolvedValue({ data: mockMFs });
      deleteMF.mockResolvedValue({});
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Mutual Funds"));
      await waitFor(() => expect(screen.getByText("Index Fund")).toBeInTheDocument());

      fireEvent.click(screen.getByText("✕"));
      await waitFor(() => expect(deleteMF).toHaveBeenCalledWith("m1"));
      await waitFor(() => expect(screen.queryByText("Index Fund")).not.toBeInTheDocument());
    });
  });

  describe("Fixed Deposits Tab", () => {
    const mockFDs = [{ _id: "f1", bank: "SBI", principal: 10000, rate: 7, tenure: 12, startDate: "2026-01-01" }];

    beforeEach(() => {
      getStocks.mockResolvedValue({ data: [] });
    });

    test("loads and renders fixed deposits", async () => {
      getFDs.mockResolvedValue({ data: mockFDs });
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Fixed Deposits"));
      await waitFor(() => expect(screen.getByText("SBI FD")).toBeInTheDocument());
    });

    test("adds a new FD", async () => {
      getFDs.mockResolvedValue({ data: [] });
      createFD.mockResolvedValue({ data: mockFDs[0] });
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Fixed Deposits"));
      await waitFor(() => expect(screen.getByText("Add Fixed Deposit")).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText("Bank Name"), { target: { value: "SBI" } });
      fireEvent.change(screen.getByPlaceholderText("Principal ₹"), { target: { value: "10000" } });
      fireEvent.change(screen.getByPlaceholderText("Rate % p.a."), { target: { value: "7" } });
      fireEvent.change(screen.getByPlaceholderText("Months"), { target: { value: "12" } });
      fireEvent.change(screen.getByPlaceholderText("Start Date"), { target: { value: "2026-01-01" } });
      
      fireEvent.click(screen.getByText("+ Add"));
      await waitFor(() => expect(createFD).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("SBI FD")).toBeInTheDocument());
    });

    test("deletes a FD", async () => {
      getFDs.mockResolvedValue({ data: mockFDs });
      deleteFD.mockResolvedValue({});
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Fixed Deposits"));
      await waitFor(() => expect(screen.getByText("SBI FD")).toBeInTheDocument());

      fireEvent.click(screen.getByText("✕"));
      await waitFor(() => expect(deleteFD).toHaveBeenCalledWith("f1"));
      await waitFor(() => expect(screen.queryByText("SBI FD")).not.toBeInTheDocument());
    });
  });

  describe("Liquid Cash Tab", () => {
    beforeEach(() => {
      getStocks.mockResolvedValue({ data: [] });
    });

    test("loads and renders liquid cash", async () => {
      getLiquid.mockResolvedValue({ data: { balance: 45000 } });
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Liquid Cash"));
      
      await waitFor(() => {
        expect(screen.getAllByText(/₹45,000/).length).toBeGreaterThan(0);
      });
    });

    test("updates liquid cash balance", async () => {
      getLiquid.mockResolvedValue({ data: { balance: 45000 } });
      updateLiquid.mockResolvedValue({ data: { balance: 60000 } });
      
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Liquid Cash"));
      await waitFor(() => expect(screen.getAllByText(/₹45,000/).length).toBeGreaterThan(0));

      fireEvent.change(screen.getByPlaceholderText("Enter new balance ₹"), { target: { value: "60000" } });
      fireEvent.click(screen.getByText("Update"));

      await waitFor(() => expect(updateLiquid).toHaveBeenCalledWith(60000));
      await waitFor(() => expect(screen.getAllByText(/₹60,000/).length).toBeGreaterThan(0));
    });
    
    test("handles invalid liquid cash input", async () => {
      getLiquid.mockResolvedValue({ data: { balance: 45000 } });
      
      render(<Portfolio />);
      fireEvent.click(screen.getByText("Liquid Cash"));
      await waitFor(() => expect(screen.getAllByText(/₹45,000/).length).toBeGreaterThan(0));

      fireEvent.change(screen.getByPlaceholderText("Enter new balance ₹"), { target: { value: "abc" } });
      fireEvent.click(screen.getByText("Update"));

      // API should not be called with invalid input
      expect(updateLiquid).not.toHaveBeenCalled();
    });
  });
});
