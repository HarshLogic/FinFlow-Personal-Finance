import { render, screen } from "@testing-library/react";
import ExpenseTracker from "./pages/ExpenseTracker";

jest.mock("./api", () => ({
  getExpenses: jest.fn(() =>
    Promise.resolve({
      data: [],
    })
  ),
}));

test("renders Expense Tracker heading", async () => {
  render(<ExpenseTracker />);

 expect(
  await screen.findByText("Add Expense")
).toBeInTheDocument();
});