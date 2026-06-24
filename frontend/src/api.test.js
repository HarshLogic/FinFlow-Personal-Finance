import axios from "axios";

jest.mock("axios", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  return {
    create: jest.fn(() => mockApi),
    __mockApi: mockApi,
  };
});

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getStocks,
  createStock,
  updateCMP,
  getSummary,
} from "./api";

const mockApi = axios.__mockApi;

describe("API functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("gets expenses with params", () => {
    const params = { month: "June" };

    getExpenses(params);

    expect(mockApi.get).toHaveBeenCalledWith(
      "/expenses",
      { params }
    );
  });

  test("creates expense", () => {
    const data = {
      title: "Food",
      amount: 500,
    };

    createExpense(data);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/expenses",
      data
    );
  });

  test("updates expense", () => {
    const data = { amount: 1000 };

    updateExpense(1, data);

    expect(mockApi.put).toHaveBeenCalledWith(
      "/expenses/1",
      data
    );
  });

  test("deletes expense", () => {
    deleteExpense(5);

    expect(mockApi.delete).toHaveBeenCalledWith(
      "/expenses/5"
    );
  });

  test("gets stocks", () => {
    getStocks();

    expect(mockApi.get).toHaveBeenCalledWith(
      "/stocks"
    );
  });

  test("creates stock", () => {
    const stock = {
      name: "ABC",
      quantity: 10,
    };

    createStock(stock);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/stocks",
      stock
    );
  });

  test("updates stock CMP", () => {
    updateCMP(10, 250);

    expect(mockApi.patch).toHaveBeenCalledWith(
      "/stocks/10/cmp",
      { cmp: 250 }
    );
  });

  test("gets summary", () => {
    getSummary();

    expect(mockApi.get).toHaveBeenCalledWith(
      "/summary"
    );
  });
});