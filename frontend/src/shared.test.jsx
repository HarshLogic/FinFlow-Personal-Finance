import { render, screen, fireEvent } from "@testing-library/react";

import {
  fmt,
  pct,
  fmtLakh,
  Pill,
  MetricCard,
  SectionTitle,
  Spinner,
  ErrorBox,
  CATEGORIES,
} from "./shared";

describe("Formatter functions", () => {

  test("formats currency correctly", () => {
    expect(fmt(1000)).toContain("1,000");
  });

  test("calculates percentage correctly", () => {
    expect(pct(25, 100)).toBe("25.0");
  });

  test("handles zero total in percentage", () => {
    expect(pct(50, 0)).toBe("0.0");
  });

  test("formats lakhs and crores", () => {
    expect(fmtLakh(100000)).toContain("L");
    expect(fmtLakh(10000000)).toContain("Cr");
  });

});


describe("UI Components", () => {

  test("renders Pill component", () => {
    render(<Pill>Active</Pill>);

    expect(screen.getByText("Active"))
      .toBeInTheDocument();
  });


  test("renders MetricCard data", () => {
    render(
      <MetricCard
        label="Balance"
        value="₹1000"
        sub="Available"
      />
    );

    expect(screen.getByText("Balance"))
      .toBeInTheDocument();

    expect(screen.getByText("₹1000"))
      .toBeInTheDocument();

    expect(screen.getByText("Available"))
      .toBeInTheDocument();
  });


  test("renders SectionTitle", () => {
    render(
      <SectionTitle>
        Dashboard
      </SectionTitle>
    );

    expect(screen.getByText("Dashboard"))
      .toBeInTheDocument();
  });


  test("renders Spinner component", () => {
    const { container } = render(<Spinner />);

    expect(container.firstChild)
      .toBeInTheDocument();
  });


  test("renders ErrorBox message", () => {
    render(
      <ErrorBox message="Failed to load data" />
    );

    expect(
      screen.getByText(/Failed to load data/i)
    ).toBeInTheDocument();
  });


  test("calls retry function when button clicked", () => {

    const retryMock = jest.fn();

    render(
      <ErrorBox
        message="Error"
        onRetry={retryMock}
      />
    );

    fireEvent.click(
      screen.getByText("Retry")
    );

    expect(retryMock)
      .toHaveBeenCalled();
  });


  test("contains common categories", () => {

    expect(CATEGORIES)
      .toContain("Food");

    expect(CATEGORIES)
      .toContain("Travel");

    expect(CATEGORIES.length)
      .toBeGreaterThan(0);

  });

});