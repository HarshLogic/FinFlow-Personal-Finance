import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
  test("renders FinFlow sidebar title", () => {
    render(<App />);

    expect(screen.getByText("FinFlow")).toBeInTheDocument();
    expect(screen.getByText("Personal Finance")).toBeInTheDocument();
  });

  test("renders dashboard as default page", () => {
    render(<App />);

    expect(
      screen.getByText("Financial Overview")
    ).toBeInTheDocument();
  });

  test("changes page when navigation button is clicked", () => {
    render(<App />);

    const expenseButton = screen.getByText("Expense Track");

    fireEvent.click(expenseButton);

    expect(
      screen.getByText("Expense Tracker")
    ).toBeInTheDocument();
  });

  test("renders all navigation buttons", () => {
    render(<App />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Expense Track")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Projections")).toBeInTheDocument();
  });
});