import axios from "axios";

console.log("API URL:", process.env.REACT_APP_API_URL);

// Base URL
const BASE_URL =
  process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== "http://localhost:3000"
    ? process.env.REACT_APP_API_URL
    : "http://localhost:5000/api";

// Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser   = (data) => api.post("/auth/register", data);
export const loginUser      = (data) => api.post("/auth/login", data);
export const googleLogin    = (credential) => api.post("/auth/google", { credential });
export const getMe          = () => api.get("/auth/me");
export const changePassword = (data) => api.post("/auth/change-password", data);

// ── Expenses ──────────────────────────────────────────────────────────────────
export const getExpenses    = (params) => api.get("/expenses", { params });
export const createExpense  = (data)   => api.post("/expenses", data);
export const updateExpense  = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense  = (id)     => api.delete(`/expenses/${id}`);
export const getExpenseAnalytics = ()  => api.get("/expenses/analytics");
export const exportExpenses = () => api.get("/expenses/export", { responseType: "blob" });

// ── Stocks ────────────────────────────────────────────────────────────────────
export const getStocks      = ()       => api.get("/stocks");
export const createStock    = (data)   => api.post("/stocks", data);
export const updateStock    = (id, data) => api.put(`/stocks/${id}`, data);
export const updateCMP      = (id, cmp)  => api.patch(`/stocks/${id}/cmp`, { cmp });
export const deleteStock    = (id)     => api.delete(`/stocks/${id}`);
export const getStockPL     = ()       => api.get("/stocks/pl");

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
// ── Export Expenses CSV ─────────────────────────────────────
// ── Income ─────────────────────────────────────────────────────────────────
export const getIncome      = (params) => api.get("/income", { params });
export const createIncome   = (data)   => api.post("/income", data);
export const updateIncome   = (id, data) => api.put(`/income/${id}`, data);
export const deleteIncome   = (id)     => api.delete(`/income/${id}`);

// ── Budget & Safe-to-Spend ──────────────────────────────────────────────────
export const getSafeToSpend   = ()       => api.get("/budget/safe-to-spend");
export const getBudgetCycle   = ()       => api.get("/budget/cycle");
export const updateBudgetCycle = (data)  => api.put("/budget/cycle", data);

// ── Accounts ─────────────────────────────────────────────────────────────────
export const getAccounts      = ()       => api.get("/accounts");
export const createAccount    = (data)   => api.post("/accounts", data);
export const updateAccount    = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount    = (id)     => api.delete(`/accounts/${id}`);

// ── Recurring Obligations ───────────────────────────────────────────────────
export const getObligations   = ()       => api.get("/obligations");
export const createObligation = (data)   => api.post("/obligations", data);
export const updateObligation = (id, data) => api.put(`/obligations/${id}`, data);
export const deleteObligation = (id)     => api.delete(`/obligations/${id}`);
export const payObligation    = (id, data) => api.post(`/obligations/${id}/pay`, data);

// ── Smart Transactions & SMS Parser ─────────────────────────────────────────
export const parseSMS         = (text)   => api.post("/expenses/parse-sms", { text });
export const quickAddExpense  = (data)   => api.post("/expenses/quick-add", data);

// ── Peer Debt & Bill Splitting ──────────────────────────────────────────────
export const getSplits        = (params) => api.get("/splits", { params });
export const getSplitsSummary = ()       => api.get("/splits/summary");
export const createSplit      = (data)   => api.post("/splits", data);
export const updateSplit      = (id, data) => api.patch(`/splits/${id}`, data);
export const settleSplit      = (id, data) => api.post(`/splits/${id}/settle`, data);
export const deleteSplit      = (id)     => api.delete(`/splits/${id}`);

// ── Monthly Personal CA Report ───────────────────────────────────────────────
export const getMonthlyReportsHistory = () => api.get("/reports/monthly");
export const getMonthlyReport         = (year, month) => api.get(`/reports/monthly/${year}/${month}`);
export const generateMonthlyReport    = (data) => api.post("/reports/monthly/generate", data);
export const exportReportPDF          = (year, month) => api.get(`/reports/monthly/${year}/${month}/pdf`, { responseType: "blob" });
export const exportReportCSV          = (year, month) => api.get(`/reports/monthly/${year}/${month}/csv`, { responseType: "blob" });

// ── Can I Afford It? Purchase Simulator ───────────────────────────────────────
export const getAffordabilityProfile  = () => api.get("/affordability/profile");
export const analyzeAffordability     = (data) => api.post("/affordability/analyze", data);
export const savePurchaseSimulation   = (data) => api.post("/affordability/save", data);
export const getSimulationHistory     = () => api.get("/affordability/history");
export const getSimulationById        = (id) => api.get(`/affordability/${id}`);
export const deleteSimulation         = (id) => api.delete(`/affordability/${id}`);
export const convertSimulationToGoal  = (id, data) => api.post(`/affordability/${id}/create-goal`, data);
export const recalculateSimulation    = (id) => api.post(`/affordability/${id}/recalculate`);
export const getSavingsGoals          = () => api.get("/affordability/goals");
export const createSavingsGoal        = (data) => api.post("/affordability/goals", data);

// ── Financial Foundation & Rulebook ──────────────────────────────────────────
export const getFinancialFoundation     = () => api.get("/financial-foundation");
export const updateFinancialMilestones  = (data) => api.patch("/financial-foundation/milestones", data);
export const completeOnboarding         = (data) => api.post("/financial-foundation/onboarding/complete", data);
export const dismissOnboarding          = () => api.post("/financial-foundation/onboarding/dismiss");
export const getFinancialRules          = () => api.get("/financial-rules");

