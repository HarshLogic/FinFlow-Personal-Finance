# Financial Calculation Standards

## 1. Deterministic Math Invariant
- Calculations for Runway, Safe-to-Spend, EMI, Tax, Net Worth, Affordability, and Health Score must be 100% deterministic, reproducible, and verifiable.
- Never delegate financial calculations to probabilistic LLM models or generative AI services.
- Pure math engines must be decoupled from database IO to enable instantaneous unit testing.

---

## 2. Core Mathematical Formulas

### 2.1 Loan EMI Calculation (Standard Reducing Balance)
$$E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Principal loan amount
- $r$ = Monthly interest rate ($\frac{\text{Annual Rate}}{12 \times 100}$)
- $n$ = Tenure in months

*Special Case:* If $r = 0$ (No-Cost EMI), $E = \frac{P}{n}$.

### 2.2 Safe-to-Spend Math
$$\text{Available Pool} = \text{Liquid Cash} - \text{Pending Obligations} - \text{Monthly Savings Target} - \text{Safety Buffer}$$
$$\text{Daily Safe-to-Spend} = \frac{\max(0, \text{Available Pool})}{\text{Remaining Cycle Days}}$$

### 2.3 Purchase Affordability Decision Matrix
$$\text{Available Spending Balance} = \text{Liquid Cash} - (\text{Monthly Needs} \times \text{Buffer Months}) - \text{Unpaid Obligations}$$
- **COMFORTABLY AFFORDABLE:** Purchase Amount $\le 25\%$ of Available Spending Balance AND Positive Monthly Cash Flow.
- **AFFORDABLE:** Purchase Amount $\le 50\%$ of Available Spending Balance AND Positive Monthly Cash Flow.
- **RISKY:** Purchase Amount $\le 100\%$ of Available Spending Balance OR Negative Monthly Cash Flow OR EMI > 20% of Disposable Income.
- **NOT AFFORDABLE:** Purchase Amount $>$ Available Spending Balance OR Debt-to-Income $> 40\%$.

---

## 3. Simulation Isolation Rule
- The *Can I Afford It?* simulator must NEVER write actual transaction records into the ledger during analysis.
- Simulations must only produce predictive impacts and can only convert to a real financial record if the user explicitly triggers "Convert to Savings Goal".

---

## 4. Boundary & Error Conditions
- **Division by Zero:** Always check that denominators ($n > 0$, $\text{Balance} > 0$, $\text{Cycle Days} > 0$) are non-zero before division.
- **Missing Data Handling:** If a user has no transactions or accounts, default gracefully to 0 without throwing `NaN` or `Infinity`.
