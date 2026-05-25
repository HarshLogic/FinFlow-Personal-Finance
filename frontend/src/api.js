import axios from "axios";

console.log("API URL:", process.env.REACT_APP_API_URL);

// Base URL
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://finflow-personal-finance.onrender.com/api";

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("currency");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser   = (data) => api.post("/auth/register", data);
export const loginUser      = (data) => api.post("/auth/login", data);
export const getMe          = ()     => api.get("/auth/me");
export const updateSettings = (data) => api.put("/auth/settings", data);

// ── Expenses ──────────────────────────────────────────────────────────────────
export const getExpenses    = (params) => api.get("/expenses", { params });
export const createExpense  = (data)   => api.post("/expenses", data);
export const updateExpense  = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense  = (id)     => api.delete(`/expenses/${id}`);
export const getExpenseAnalytics = ()  => api.get("/expenses/analytics");

// ── Stocks ────────────────────────────────────────────────────────────────────
export const getStocks      = ()       => api.get("/stocks");
export const createStock    = (data)   => api.post("/stocks", data);
export const updateStock    = (id, data) => api.put(`/stocks/${id}`, data);
export const updateCMP      = (id, cmp)  => api.patch(`/stocks/${id}/cmp`, { cmp });
export const deleteStock    = (id)     => api.delete(`/stocks/${id}`);
export const getStockPL     = ()       => api.get("/stocks/pl");
export const syncStocks     = ()       => api.post("/stocks/sync");

// ── Mutual Funds ──────────────────────────────────────────────────────────────
export const getMF          = ()       => api.get("/mutualfunds");
export const createMF       = (data)   => api.post("/mutualfunds", data);
export const updateMF       = (id, data) => api.put(`/mutualfunds/${id}`, data);
export const deleteMF       = (id)     => api.delete(`/mutualfunds/${id}`);
export const getMFPL        = ()       => api.get("/mutualfunds/pl");

// ── Fixed Deposits ────────────────────────────────────────────────────────────
export const getFDs         = ()       => api.get("/fds");
export const createFD       = (data)   => api.post("/fds", data);
export const updateFD       = (id, data) => api.put(`/fds/${id}`, data);
export const deleteFD       = (id)     => api.delete(`/fds/${id}`);

// ── Liquid Cash ───────────────────────────────────────────────────────────────
export const getLiquid      = ()       => api.get("/liquid");
export const updateLiquid   = (balance) => api.put("/liquid", { balance });

// ── Summary ───────────────────────────────────────────────────────────────────
export const getSummary     = ()       => api.get("/summary");
export const getProjection  = (params) => api.get("/summary/projection", { params });
