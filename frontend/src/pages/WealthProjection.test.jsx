import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import WealthProjection from "./WealthProjection";
import { getProjection } from "../api";

jest.mock("../api");

// Mock Recharts
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

describe("WealthProjection Component", () => {
  const mockResponse = {
    data: {
      summary: {
        finalCorpus: 10000000, // 100L
        totalInvested: 4800000, // 48L
        wealthCreated: 5200000, // 52L
        multiplier: "2.1",
      },
      projection: [
        { year: 5, corpus: 1500000, invested: 1200000 },
        { year: 10, corpus: 4000000, invested: 2400000 },
        { year: 15, corpus: 7000000, invested: 3600000 },
        { year: 20, corpus: 10000000, invested: 4800000 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("loads and renders projection data on mount", async () => {
    getProjection.mockResolvedValue(mockResponse);

    render(<WealthProjection />);

    // Fast-forward debounce timeout
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(getProjection).toHaveBeenCalledWith({
        monthly: 20000,
        rate: 12,
        years: 20,
      });
    });

    // Verify summary metrics are displayed (values divided by 100k for L)
    await waitFor(() => {
      expect(screen.getAllByText("₹100.0L").length).toBeGreaterThan(0); // finalCorpus
      expect(screen.getByText("₹48.0L")).toBeInTheDocument(); // totalInvested
      expect(screen.getByText("₹52.0L")).toBeInTheDocument(); // wealthCreated
    });

    // Verify milestones
    expect(screen.getByText("At 5 years")).toBeInTheDocument();
    expect(screen.getByText("At 20 years")).toBeInTheDocument();
    expect(screen.getByText("₹15.0L")).toBeInTheDocument(); // milestone 5 corpus
  });

  test("updates projection when sliders change", async () => {
    getProjection.mockResolvedValue(mockResponse);

    render(<WealthProjection />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => expect(getProjection).toHaveBeenCalledTimes(1));

    // Change Monthly SIP slider
    const sliders = screen.getAllByRole("slider");
    const sipSlider = sliders[0]; // First slider is SIP

    fireEvent.change(sipSlider, { target: { value: "30000" } });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(getProjection).toHaveBeenCalledTimes(2);
      expect(getProjection).toHaveBeenLastCalledWith(expect.objectContaining({
        monthly: 30000,
      }));
    });
  });

  test("handles API errors gracefully", async () => {
    getProjection.mockRejectedValue({
      response: { status: 500, data: { error: "Calculation failed" } },
    });

    render(<WealthProjection />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("⚠ Error 500: Calculation failed")).toBeInTheDocument();
    });
  });

  test("handles network errors gracefully", async () => {
    getProjection.mockRejectedValue({
      request: {},
    });

    render(<WealthProjection />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("⚠ No response from server (is backend running?)")).toBeInTheDocument();
    });
  });
});
