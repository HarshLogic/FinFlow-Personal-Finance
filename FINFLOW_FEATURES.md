# FINFLOW — COMPLETE FEATURE DOCUMENTATION

FinFlow is an end-to-end Personal Finance Management Application and Financial Operating System designed to help individuals track their wealth, automate transaction entry, protect upcoming bill payments, split expenses, and make informed financial decisions.

This document details every feature currently implemented in the FinFlow repository.

---

## 1. Safe-to-Spend Engine

- **What it does:** Calculates the exact amount of money you can safely spend today without risking overdue bills, missed loan EMIs, or dipping into your savings goal and emergency safety buffer.
- **Why users need it:** Looking at a high bank account balance creates a false illusion of wealth, causing users to overspend early in the month and struggle when rent or utility bills arrive.
- **How it works:**
  1. Aggregates all liquid cash across your active checking accounts, digital wallets, and physical cash.
  2. Subtracts all unpaid fixed recurring obligations due in the active budget cycle.
  3. Subtracts your monthly savings target (minus savings already deposited this month).
  4. Subtracts your minimum safety cash buffer.
  5. Divides the remaining amount by the days left in your budget cycle.
  $$\text{Daily Allowance} = \frac{\max(0, \text{Liquid Cash} - \text{Unpaid Bills} - \text{Remaining Savings} - \text{Safety Buffer})}{\text{Remaining Cycle Days}}$$
- **Real-life example:** You have ₹50,000 in your bank. You have ₹12,000 in upcoming rent, ₹1,000 for broadband, a ₹10,000 monthly savings goal, and a ₹5,000 emergency buffer. Total committed money is ₹28,000. Your available money is ₹22,000. If there are 15 days left in the cycle, FinFlow tells you that you can safely spend **₹1,466 per day**.
- **Where to find it:** **Dashboard** → Top Hero Card (**Safe to Spend Today**). Click the **Breakdown** button for the calculation drawer.
- **Status:** **WORKING** (Verified via unit and integration tests).

---

## 2. Smart Transactions & Instant SMS / UPI Parser

- **What it does:** Extracts transaction details (amount, merchant/payee, payment method, date, reference number) automatically from bank SMS notifications or UPI confirmation messages.
- **Why users need it:** Manually entering transactions is tedious and easily forgotten, leading to inaccurate records. Pasting the bank notification records the expense in seconds.
- **How it works:** Multi-pattern regex algorithms analyze Indian bank SMS formats (HDFC, SBI, ICICI, Axis, Kotak, Paytm, PhonePe, Google Pay). The parser detects currency indicators (`₹`, `Rs.`, `INR`), distinguishes debits from credits, cleans merchant handles (`@okhdfcbank`, `UPI/`), and automatically assigns a category.
- **Real-life example:**
  - *Input SMS:* `"Rs.450.00 debited from your account via UPI to Swiggy on 15-11-2026. Ref: 432109876543"`
  - *Extracted Data:* Amount: ₹450, Merchant: Swiggy, Category: Food, Payment Method: UPI, Date: 2026-11-15, Ref: 432109876543.
- **Where to find it:** **Dashboard** → Click **Quick Add via SMS** (top right gold button).
- **Status:** **WORKING** (Verified with unit test suite).

---

## 3. Duplicate Transaction Detection

- **What it does:** Prevents you from recording the same transaction multiple times.
- **Why users need it:** Users often copy an SMS twice or click save multiple times, skewing balance and spending reports.
- **How it works:** When a transaction is parsed or submitted, FinFlow inspects the database for existing records with the same external reference number (UTR / bank ref), or matching date, amount, and merchant. If found, a duplicate warning banner is displayed with options to review or force save.
- **Real-life example:** If you paste the same Swiggy debit SMS twice, FinFlow alerts you: `"A transaction with reference 432109876543 already exists (Swiggy - ₹450)."`
- **Where to find it:** Integrated into the **Quick Add Modal**.
- **Status:** **WORKING** (Verified via automated API test).

---

## 4. Merchant Auto-Categorization & Machine Learning

- **What it does:** Automatically assigns categories to transactions based on merchant names and remembers your category choices for future transactions.
- **Why users need it:** Manually selecting categories on every transaction is slow.
- **How it works:** FinFlow ships with a built-in dictionary for popular merchants (Swiggy/Zomato → Food, Uber/Ola → Travel, Blinkit/Zepto → Shopping, Netflix/Spotify → OTT, etc.). When you change or confirm a category, FinFlow records your preference in MongoDB (`MerchantMapping`) and prioritizes it for all future transactions.
- **Real-life example:** If you change a local store called "Ramesh General Store" to "Groceries", FinFlow saves this mapping. The next time you paste a transaction from "Ramesh General Store", it is automatically categorized as "Groceries".
- **Where to find it:** Automatically active in **Quick Add** and **Expense Tracker**.
- **Status:** **WORKING** (Verified via unit test).

---

## 5. Monthly Fixed Bills & Recurring Obligations Tracker

- **What it does:** Tracks all regular recurring expenses (house rent, electricity, internet, gym, Netflix, insurance, EMIs) and manages due dates.
- **Why users need it:** Missing bill due dates leads to late penalties and disrupted services.
- **How it works:** Users define the bill title, amount, due day of the month (1–31), and frequency. FinFlow monitors paid vs pending bills, displays a progress bar, alerts you to upcoming due dates, and feeds unpaid amounts directly into the Safe-to-Spend engine. Clicking **Pay** creates a linked expense transaction, debits your chosen account, and marks the bill paid for the cycle.
- **Real-life example:** You add "House Rent" for ₹12,000 due on the 5th. On the 4th, you click "Pay" and choose your HDFC account. FinFlow creates the ₹12,000 expense, deducts ₹12,000 from HDFC, and updates the bill progress to 100% Paid.
- **Where to find it:** **Dashboard** → **Monthly Fixed Bills** widget.
- **Status:** **WORKING** (Verified via UI and backend tests).

---

## 6. Peer Debt & Bill Splitting ("Who Owes Me")

- **What it does:** Tracks money you paid on behalf of friends, roommates, or colleagues, and lets you record repayments without inflating your personal income or distorting spending records.
- **Why users need it:** If you pay a ₹2,000 dinner bill and a friend owes you ₹1,000, recording ₹2,000 as your personal expense makes your budget look overspent. When they repay ₹1,000, recording it as income makes your earnings look falsely higher.
- **How it works:**
  1. Splitting an expense decreases cash by ₹2,000, logs ₹1,000 as your personal expense, and creates a ₹1,000 receivable under `SplitExpense`.
  2. When the friend repays, clicking **Settle** deposits the repayment into your chosen bank account and marks the debt settled without double-counting income or expenses.
  3. Supports both partial repayments (e.g. paying ₹400 first, then ₹600 later) and full repayments.
- **Real-life example:** You split a ₹2,000 bill with Rahul. Rahul owes ₹1,000. He pays ₹400 via UPI. You click "Settle" and enter ₹400. His balance updates to "Owes ₹600 of ₹1,000" with status `PARTIAL`. Later he pays ₹600, and the status changes to `SETTLED`.
- **Where to find it:** **Dashboard** → **Who Owes Me** widget.
- **Status:** **WORKING** (Verified via unit and integration tests).

---

## 7. Multi-Account & Liquid Cash Management

- **What it does:** Manages multiple bank checking accounts, savings accounts, digital wallets, and physical cash with accurate `Decimal128` financial arithmetic.
- **Why users need it:** Most people have money across multiple accounts (e.g., salary account, Paytm wallet, cash). Tracking them in one place provides a consolidated view of liquid reserves.
- **How it works:** Each account records its name, type (`CHECKING`, `SAVINGS`, `WALLET`, `CASH`), current balance, and an `isLiquid` toggle. When you record expenses, bills, or debt repayments, account balances update automatically and synchronize with total liquid cash.
- **Real-life example:** You add "HDFC Salary" (₹45,000) and "Paytm Wallet" (₹3,000). Total liquid cash is ₹48,000. Paying a ₹500 grocery bill from Paytm automatically updates Paytm balance to ₹2,500 and total liquid cash to ₹47,500.
- **Where to find it:** **Dashboard** → **Connected Accounts & Liquid Cash** widget.
- **Status:** **WORKING** (Verified via component test and backend CRUD tests).

---

## 8. Budget Cycle Configuration

- **What it does:** Configures custom budget cycle start days (e.g., 25th for payday instead of the 1st), monthly savings goals, and emergency cash reserves.
- **Why users need it:** Not everyone operates on a 1st-to-30th calendar month. Many salaried professionals receive their pay on the 25th or 28th and budget from payday to payday.
- **How it works:** Saved in MongoDB under `BudgetCycle`. The Safe-to-Spend engine calculates cycle start, cycle end, and remaining days based on your chosen start day.
- **Real-life example:** If your salary arrives on the 25th, setting `cycleStartDay = 25` means on November 16th, your current cycle is October 25 to November 24 (9 days left), rather than November 1 to 30.
- **Where to find it:** **Dashboard** → Safe-to-Spend card → **Configure** button.
- **Status:** **WORKING** (Verified via calculation tests).

---

## 9. Comprehensive Expense & Income Tracking

- **What it does:** Complete recording, categorization, and filtering of all daily income and expense transactions.
- **Why users need it:** Provides a granular log of where money comes from and where it goes.
- **How it works:** Records date, category, description label, amount, and classifies expenses into **Needs** (essential) vs **Wants** (discretionary) according to the 50-30-20 rule. Filter tabs allow viewing "All", "Need", "Want", or "Income" with deletion support.
- **Real-life example:** You record a salary credit of ₹60,000 as Income. Then you record ₹350 for movie tickets as a "Want" under "OTT/Entertainment".
- **Where to find it:** Sidebar navigation → **Expense Track**.
- **Status:** **WORKING** (Verified via UI and backend routes).

---

## 10. Needs vs Wants Analysis (50-30-20 Rule)

- **What it does:** Breaks down your monthly spending into Needs (essentials) and Wants (lifestyle/discretionary) and benchmarks your financial health against the famous 50-30-20 financial guideline (50% Needs, 30% Wants, 20% Savings).
- **Why users need it:** Knowing total spending is not enough; users need to know if they are overspending on lifestyle desires versus living essentials.
- **How it works:** Automatically calculates the percentage of monthly spending allocated to Needs vs Wants, displaying progress bars and real-time percentage indicators.
- **Real-life example:** If your monthly spend is ₹40,000 with ₹24,000 on rent/groceries and ₹16,000 on shopping/dining, FinFlow shows 60% Needs and 40% Wants, signaling that discretionary spending is above the 30% target.
- **Where to find it:** **Dashboard** → **This Month — Needs vs Wants** card.
- **Status:** **WORKING** (Verified via dashboard calculations).

---

## 11. Monthly Expense Flow Visualization

- **What it does:** Renders a 6-month stacked interactive area chart showing your historical spending trajectory separated into Needs and Wants.
- **Why users need it:** Visual trends help you spot seasonal spending spikes (e.g. festivals, holidays).
- **How it works:** Powered by Recharts. Backend aggregates expenses by month and type (`need`/`want`), which the frontend renders with gold and green gradient area curves.
- **Real-life example:** Hovering over "Oct" reveals ₹22,000 Needs and ₹8,000 Wants, letting you easily see that your festive spending increased that month.
- **Where to find it:** **Dashboard** → **Monthly Expense Flow** chart.
- **Status:** **WORKING** (Verified via frontend compilation and data mapper).

---

## 12. Asset Allocation & Net Worth Breakdown

- **What it does:** Displays an interactive donut chart breaking down your total wealth across Liquid Cash, Stock Holdings, Mutual Funds, and Fixed Deposits.
- **Why users need it:** Helps maintain an appropriate balance between safe cash and growth investments.
- **How it works:** Calculates current market value of all investments and liquid cash, computing the exact percentage of your net worth in each asset class.
- **Real-life example:** If you have ₹50k Liquid, ₹100k Stocks, ₹100k Mutual Funds, and ₹50k in FDs, FinFlow displays a total wealth of ₹3.0L with 33% Stocks, 33% Mutual Funds, 17% Liquid, and 17% FDs.
- **Where to find it:** **Dashboard** → **Asset Allocation** card.
- **Status:** **WORKING** (Verified via summary calculations).

---

## 13. CSV Data Export

- **What it does:** Downloads your complete transaction history as a standard `.csv` file.
- **Why users need it:** For tax filing, personal spreadsheet backups, or sharing with an accountant.
- **How it works:** Server formats transaction records with escaped quotes into CSV format, and the client triggers a browser download as `finflow-transactions.csv`.
- **Where to find it:** **Expense Tracker** → Click **Export CSV**.
- **Status:** **WORKING** (Verified via export route).

---

## 14. Stock Portfolio & Live Price Tracker

- **What it does:** Tracks stock market holdings on NSE and BSE, calculating invested capital, current market value, profit & loss, and percentage return.
- **Why users need it:** Keeps all financial assets in one system without having to check separate brokerage apps.
- **How it works:** Tracks ticker symbol, quantity, average purchase price, sector, and current market price (CMP). Allows manual CMP updates or automatic updates via market API. Computes P&L as:
  $$\text{P\&L} = \text{Quantity} \times (\text{CMP} - \text{Average Price})$$
- **Where to find it:** Sidebar navigation → **Portfolio** → **Stocks** tab.
- **Status:** **WORKING** (Verified via route and models).

---

## 15. Mutual Funds & SIP Manager

- **What it does:** Tracks mutual fund holdings across Equity, Debt, Hybrid, Index, and ELSS funds, including monthly SIP and lump sum investments.
- **Why users need it:** Monitoring long-term investments alongside day-to-day cash flow ensures savings goals stay on track.
- **How it works:** Records fund name, AMC, fund type, units, purchase NAV, current NAV, and monthly SIP amount. Calculates current portfolio value and returns.
- **Where to find it:** Sidebar navigation → **Portfolio** → **Mutual Funds** tab.
- **Status:** **WORKING** (Verified via portfolio routes).

---

## 16. Fixed Deposit (FD) Manager with Compound Interest

- **What it does:** Tracks bank fixed deposits, interest rates, tenure, maturity dates, and quarterly compounding interest.
- **Why users need it:** FDs are a core savings asset in India; tracking maturity amounts helps plan future cash availability.
- **How it works:** Uses standard banking quarterly compound interest formula:
  $$A = P \times \left(1 + \frac{r}{400}\right)^{4 \times \frac{t}{12}}$$
  Automatically calculates maturity date, maturity amount, and total interest earned.
- **Where to find it:** Sidebar navigation → **Portfolio** → **Fixed Deposits** tab.
- **Status:** **WORKING** (Verified via virtual Mongoose getters).

---

## 17. Wealth Projections (Interactive SIP Calculator)

- **What it does:** Simulates your future wealth and compound growth over 1 to 40 years based on monthly SIP contributions and expected annual return rates.
- **Why users need it:** Helps users see the long-term impact of increasing their monthly savings rate.
- **How it works:** Uses interactive sliders for Monthly SIP (₹1,000 to ₹1,00,000), Expected Return (4% to 24%), and Time Horizon (1 to 40 years). Draws an area chart showing projected corpus vs invested capital.
- **Where to find it:** Sidebar navigation → **Projections**.
- **Status:** **WORKING** (Verified via wealth projection page).

---

## 18. Investment Planner (Asset Allocation Matrix)

- **What it does:** Helps you plan how to distribute your monthly salary across 8 asset classes (Stocks, Mutual Funds, Bonds, Gold, FDs, Real Estate/REITs, Crypto, and Emergency Reserve).
- **Why users need it:** Beginners often don't know how to divide their savings across different investment types.
- **How it works:** Input monthly salary and savings rate percentage. FinFlow calculates the exact investable fund and distributes it according to your target allocation percentages. Supports multiple world currencies (INR, USD, EUR, GBP, AED, SGD, JPY, CAD, AUD, CHF).
- **Where to find it:** Sidebar navigation → **Invest Planner**.
- **Status:** **WORKING** (Verified via investment planner page).

---

## 19. FinFlow AI Financial Assistant (Chatbot)

- **What it does:** An in-app assistant that answers financial questions, explains the 50-30-20 rule, guides you through app features, and provides immediate answers about your portfolio.
- **Why users need it:** Instant assistance without leaving the dashboard.
- **How it works:** Floating widget accessible on all logged-in pages. Equipped with a curated financial knowledge base and real-time access to your portfolio summary.
- **Where to find it:** Bottom right floating icon on all dashboard pages.
- **Status:** **WORKING** (Verified via chatbot component).

---

## 20. User Profile & Password Security

- **What it does:** Displays user account credentials, registration date, authentication method (Email/Password or Google OAuth), and provides a secure password update tool.
- **Why users need it:** Allows users to audit their account details and change passwords securely.
- **How it works:** Protected route requiring existing password confirmation, bcrypt hashing, and token validation.
- **Where to find it:** Header button → **User Profile** (or direct profile route).
- **Status:** **WORKING** (Verified via user profile page and auth routes).

---

## 21. Multi-Currency & Theme Switcher

- **What it does:** Instant switching between Dark Theme and Light Theme, and currency formatting for INR (₹), USD ($), and GBP (£).
- **Why users need it:** Tailors the visual presentation to user preference and lighting conditions.
- **How it works:** Theme tokens and conversion rates are persisted in browser `localStorage`.
- **Where to find it:** Top navigation bar toggle buttons.
- **Status:** **WORKING** (Verified via header controls and shared theme system).

---

## 22. Monthly Personal CA Report & Financial Health Review

- **What it does:** Acts as an automated Chartered Accountant review of your monthly financial health. Generates an explainable 0–100 Financial Health Score, audits spending across Needs vs. Wants, delivers prioritized recommendations, tracks savings progress, and generates professional downloadable PDF and CSV reports.
- **Why users need it:** Looking at raw bank transactions does not answer critical questions like "Did I save enough?", "Is my spending increasing?", "Are upcoming bills protected?", or "What should I do differently next month?". This feature provides strategic financial clarity.
- **How it works:**
  1. Aggregates ledger data across income, personal consumption expenses, active bank/wallet accounts, recurring bills, investment assets (stocks, mutual funds, FDs), and peer receivables.
  2. Evaluates an explainable 6-factor Financial Health Score:
     - Savings Performance (max 25 pts)
     - Budget Discipline & 50-30-20 ratio (max 20 pts)
     - Emergency Fund Buffer Runway (max 20 pts)
     - Debt & Fixed Obligations burden (max 15 pts)
     - Investment Consistency & SIPs (max 10 pts)
     - Cash Flow Stability (max 10 pts)
  3. Analyzes top 5 spending categories, largest expenses, and compares metrics directly with the previous month (absolute and % changes).
  4. Runs a rule-based recommendation engine prioritizing High, Medium, and Low action items with estimated financial impacts.
  5. Exports a professional, 2-page PDF document (`finflow-ca-report-YYYY-MM.pdf`) and formula-injection-safe CSV file.
  6. Automatically finalizes the previous month on the 1st day of every month at 02:00 AM via background cron scheduler.
- **Real-life example:** On November 25, you generate your CA report. Your income is ₹1,00,000 and total spending is ₹42,000 (₹26,000 Needs, ₹16,000 Wants). You saved ₹58,000 (58% savings rate). FinFlow awards you a Financial Health Score of **88/100 (Healthy)**, highlights that your Food & Dining spend surged by 28% compared to October, and recommends capping weekend restaurant orders to save an extra ₹3,500 next month.
- **Where to find it:** Sidebar navigation → **Monthly CA Report**, or **Dashboard** → **Monthly Personal CA Report** widget.
- **Status:** **WORKING** (Verified via unit, integration, PDF/CSV generation, and frontend component tests).

---

## 23. Can I Afford It? — Smart Purchase Simulator

- **What it does:** A fast, 100% deterministic purchase affordability simulator that answers whether you can safely afford a product today without damaging your financial stability, breaching your emergency fund, or risking unpaid bills.
- **Why users need it:** Bank account balances create a dangerous illusion of wealth. Users frequently make impulse purchases, only to realize later that they don't have enough money for upcoming rent, school fees, or loan EMIs.
- **Two Payment Modes:**
  1. **Full Payment:** Simulates buying the product upfront in cash or debit.
  2. **EMI Payment:** Simulates financing the product with down payment, reducing-balance interest, loan tenure, and upfront charges.
- **How it works (Deterministic Mathematical Formulas):**
  1. **Monthly Disposable Income:**
     $$I_{\text{disposable}} = I - E - D - S$$
     *(Unclamped: negative values transparently reflect ongoing monthly cash flow deficits).*
  2. **Required Emergency Fund:**
     $$F_{\text{emergency}} = (E + D) \times M \quad (M \in \{3, 6\})$$
  3. **Available Spending Balance:**
     $$\text{rawSpendingBalance} = B - F_{\text{emergency}} - C, \quad \text{availableSpendingBalance} = \max(0, \text{rawSpendingBalance})$$
  4. **Canonical Affordability Status Classifications:**
     - **COMFORTABLY AFFORDABLE (Emerald):**
       - Full Payment: Purchase consumes $\le 25\%$ of available spending balance, emergency fund remains 100% intact, and cash flow is not in deficit.
       - EMI: Monthly installment consumes $\le 30\%$ of disposable income, debt-to-income $\le 30\%$, and upfront costs are covered.
     - **AFFORDABLE (Blue):**
       - Full Payment: Purchase consumes $25\% < \text{ratio} \le 50\%$ of available spending balance with intact emergency fund.
       - EMI: Monthly installment consumes $30\% < \text{ratio} \le 50\%$ of disposable income with debt-to-income $\le 30\%$.
     - **RISKY (Amber):**
       - Full Payment: Purchase consumes $50\% < \text{ratio} \le 100\%$ of available spending balance, or user has an active monthly cash flow deficit.
       - EMI: Installment consumes $50\% < \text{ratio} \le 100\%$ of disposable income, or pushes total debt-to-income $> 30\%$.
     - **NOT AFFORDABLE RIGHT NOW (Red):**
       - Upfront costs exceed available spending balance, purchase exceeds unreserved cash, or monthly installment exceeds disposable income.
     - **INSUFFICIENT DATA (Gray):**
       - Non-positive purchase price or missing inputs.
  5. **Savings Timeline ("How Long Until I Can Afford It?"):**
     $$\text{totalFundingGap} = \max(0, P - \text{rawSpendingBalance})$$
     $$\text{monthsRequired} = \lceil \text{totalFundingGap} / I_{\text{disposable}} \rceil \quad (\text{when } I_{\text{disposable}} > 0)$$
  6. **One-Click Data Sync & Conversion:**
     - **"Use My FinFlow Data":** One-click prefill of live salary, essential needs, existing EMIs, active savings goals, liquid bank balance, and unpaid commitments with full data provenance.
     - **"Create Savings Goal":** Converts funding gaps into automated savings goals with a target date and monthly installment confirmation modal.
- **Where to find it:** Sidebar navigation → **Can I Afford It?**, or **Dashboard** → **Can I Afford It? Simulator** widget.
- **Status:** **WORKING & DETERMINISTIC** (Verified via 61 backend unit tests and 18 frontend test suites with zero external AI dependencies).

---

## 24. Financial Milestones & Financial Foundation Score

- **What it does:** Tracks foundational risk shields and evaluates an explainable **Financial Foundation Score** strictly between 0 and 100.
  - Emergency Fund Milestone (+50 Points)
  - Health Insurance Milestone (+50 Points)
  - Classifications:
    - 0 points: "Starting Your Financial Journey"
    - 50 points: "Building Your Financial Foundation"
    - 100 points: "Financial Foundation Complete"
- **Why users need it:** Before embarking on high-risk equity investing or speculative assets, users must establish foundational defense mechanisms. A single medical emergency or job disruption without an emergency buffer or health policy can force premature liquidation of long-term investments.
- **How it works:**
  - Evaluated and persisted on the backend (`FinancialFoundation` schema).
  - Strictly independent from the transactional Financial Health Score (never conflated or modified by transaction volumes).
  - Unchecking a completed milestone immediately removes 50 points; points cannot be accumulated repeatedly.
  - Generates personalized contextual next steps based on current completion status.
- **Real-life example:** A user marks "I have an emergency fund" (+50 pts) but does not have health insurance. Their Foundation Score is **50/100 (Building Your Financial Foundation)**. FinFlow advises: *"Great job on your emergency cushion! Next step: Protect those savings by securing an individual health insurance policy so a single hospital bill does not wipe out your emergency reserves."*
- **Where to find it:** Sidebar navigation → **Milestones** (`/financial-milestones`), Dashboard Foundation card, and Monthly CA Report Foundation section.
- **Status:** **WORKING** (Verified via backend mathematical purity tests and frontend React tests).

---

## 25. First-Login Financial Foundation Onboarding Popup

- **What it does:** Displays an interactive, non-blocking onboarding modal on the user's initial login after registration (supporting both email/password and Google OAuth).
- **Why users need it:** Guides new users immediately on the two essential personal finance prerequisites before they navigate through complex budgeting or investment screens.
- **How it works:**
  - Automatically queries the user's onboarding status (`GET /api/financial-foundation`).
  - If `status === "NOT_STARTED"`, triggers a responsive modal with title: *"Build Your Financial Foundation"*.
  - Features two interactive checkboxes:
    1. *I have an emergency fund* (+50 pts)
    2. *I have health insurance* (+50 pts)
  - Live recalculates the Foundation Score in real time as the user selects or deselects items.
  - Non-blocking actions:
    - **Save & Continue:** Persists selected milestones to MongoDB and marks onboarding `COMPLETED`.
    - **Skip for Now / Close:** Dismisses modal without blocking dashboard access, saving status `DISMISSED`.
  - Persisted across devices and login sessions so it never repeatedly annoys the user.
- **Where to find it:** Automatically triggered on first authenticated session, or revisitable via **Milestones** page.
- **Status:** **WORKING** (Verified via modal UI unit tests and backend onboarding endpoints).

---

## 26. Financial Rulebook & 12 Interactive Rule Calculators

- **What it does:** A comprehensive digital repository of **28 Golden Rules of Personal Finance** organized across 5 core pillars of wealth, attributed to Morgan Housel (*The Psychology of Money*), featuring search filtering, category filtering, accordion explanations, real-world INR examples, and 12 embedded interactive calculators.
- **Pillars of Wealth (5 Categories):**
  1. **Financial Protection (Rules 01–05):** Emergency Fund (Rule 01), Personal Health Insurance (Rule 02), Family Health Insurance (Rule 03), Term Life Insurance (Rule 04), High-Interest Debt Elimination (Rule 05).
  2. **Budgeting and Spending (Rules 06–11):** 50/30/20 Rule (Rule 06), 5% Fun Money (Rule 07), 48-Hour Purchase Delay (Rule 08), 1% Spending Pause (Rule 09), Pay Yourself First (Rule 10), Frugality vs Cheapness (Rule 11).
  3. **Investments and Wealth Building (Rules 12–18):** Power of Compounding (Rule 12), Time in the Market (Rule 13), Rule of 72 (Rule 14), 100 Minus Age Equity Allocation (Rule 15), Index Fund Core (Rule 16), Diversification (Rule 17), Real Return vs Inflation (Rule 18).
  4. **Loans and Major Purchases (Rules 19–22):** 20/4/10 Car Rule (Rule 19), 30–40% EMI Ratio Limit (Rule 20), Home Purchase 3x Rule (Rule 21), Prepayment over Lifestyle (Rule 22).
  5. **Long-Term Financial Planning (Rules 23–28):** 25x Retirement Corpus / FIRE (Rule 23), 4% Safe Withdrawal Rate (Rule 24), Net Worth Tracking (Rule 25), Estate & Will Planning (Rule 26), Multiple Income Streams (Rule 27), Financial Independence Mindset (Rule 28).
- **12 Interactive Calculators:**
  1. *Emergency Fund Target Calculator* (Target = Expenses $\times$ Months buffer)
  2. *Term Life Coverage Calculator* (Cover = Income $\times$ Multiplier + Debts)
  3. *50/30/20 Budgeting Calculator* (Needs 50%, Wants 30%, Savings 20%)
  4. *Guilt-Free Fun Money Calculator* (Take-home $\times$ Fun % $\rightarrow$ Monthly & Weekly allowances)
  5. *SIP & Compound Interest Calculator* (Principal, Monthly SIP, Rate %, Tenure $\rightarrow$ Future Corpus)
  6. *Rule of 72 Doubling Time Calculator* (Years to double = $72 / r$)
  7. *Purchasing Power & Real Return Calculator* (Fisher equation: $((1+r)/(1+i) - 1) \times 100$)
  8. *20/4/10 Car Rule Calculator* (20% down, 4-yr loan EMI, 10% monthly income limit verdict)
  9. *30–40% EMI Ratio Checker* (Total EMIs / Income with Safe, Caution, and High-Risk statuses)
  10. *FIRE 25x Retirement Corpus Calculator* (Annual Expenses $\times$ 25 Target)
  11. *4% Safe Withdrawal Rate Simulator* (Corpus $\times$ 4% Annual & Monthly cash flows)
  12. *Net Worth Calculator* (Total Assets $-$ Total Liabilities)
- **Safety & Arithmetic:** All calculators feature division-by-zero protection, non-negative bounds checking, NaN prevention, and are strictly simulation-only (no side effects on actual ledger records).
- **Where to find it:** Sidebar navigation → **Rulebook** (`/financial-rulebook`), Dashboard Rulebook banner, and Milestones Rulebook link.
- **Status:** **WORKING** (Verified via backend rules integrity tests, calculator unit tests, and production React build).

