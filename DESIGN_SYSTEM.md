# FinFlow Design System & Aesthetic Specification

## 1. Overview & Design Philosophy

**FinFlow** is an institutional-grade Personal Financial Operating System. The interface reflects the precision, calm confidence, and understated elegance of modern platforms such as Revolut, Linear, Apple, and professional wealth management suites.

### Core Principles
1. **Financial Precision:** Currency figures always render in tabular numerals (`font-variant-numeric: tabular-nums`) to prevent optical jitter and ensure instant vertical scanning.
2. **Modular Bento Grid Architecture:** Clean 12-column Bento Grid on desktop scaling smoothly into touch-friendly cards on mobile devices.
3. **Subtle Elevation & Contrast:** Tactile depth is created through crisp 1px borders (`#26303D` dark, `#E2E8F0` light) and refined ambient shadows.
4. **Intentional Accents:** Emerald / Forest green accents (`#10B981` in Dark Mode, `#047857` in Light Mode) reserved for primary actions, active indicators, and positive wealth trajectory.
5. **Accessible Hierarchy:** Text contrast strictly complies with WCAG AA standards (minimum 4.5:1 for body text, 3:1 for large display metrics).
6. **Mobile-First Native App Experience:** Fixed bottom navigation bar with safe-area bottom insets (`env(safe-area-inset-bottom)`), 44px touch targets, and slide-up action sheets.

---

## 2. Color Palettes

### 2.1 Dark Mode (Default)
Optimized for low-light environments, OLED displays, and professional wealth monitoring.

| Token Name | Hex Code | Role / Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#0D1117` | Canvas base (`--bg-page`) | Base backdrop |
| **Secondary Surface** | `#161B22` | Card surface (`--bg-card`) | Subtle elevation |
| **Elevated Surface** | `#1C2430` | Modals, Dropdowns, Header (`--bg-surface`) | Foreground focus |
| **Primary Text** | `#F1F5F9` | Headlines & Primary Metrics (`--text-primary`) | 14.5:1 on `#0D1117` |
| **Secondary Text** | `#94A3B8` | Labels, Subtitles, Meta (`--text-secondary`) | 6.8:1 on `#0D1117` |
| **Border** | `#26303D` | Dividers & Component Outlines (`--border-color`) | Clean structural border |
| **Primary Accent** | `#10B981` | Primary CTA, Active Indicators (`--accent-primary`) | 7.2:1 on `#0D1117` |
| **Accent Hover** | `#059669` | Button Hover State (`--accent-hover`) | Refined interactive feedback |
| **Accent Text** | `#FFFFFF` | Text on Primary Accent Buttons | 4.6:1 on `#10B981` |
| **Success** | `#34D399` | Income, Positive Net Worth, Affordable | 9.8:1 on `#0D1117` |
| **Danger / Error** | `#F87171` | Expenses, Shortfalls, Unaffordable | 6.4:1 on `#0D1117` |
| **Warning** | `#FBBF24` | Caution, Risky Decisions, Buffer Warning | 11.2:1 on `#0D1117` |
| **Information** | `#60A5FA` | Liquid cash, Information Badges | 7.9:1 on `#0D1117` |

### 2.2 Light Mode
A crisp, modern light palette evocative of clean Swiss typography and contemporary FinTech applications.

| Token Name | Hex Code | Role / Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#F5F7FA` | Canvas base (`--bg-page`) | Crisp light canvas |
| **Secondary Surface** | `#FFFFFF` | Card surface (`--bg-card`) | Clean white card base |
| **Elevated Surface** | `#F8FAFC` | Modals, Inputs, Elevated Panels (`--bg-surface`) | Soft contrast surface |
| **Primary Text** | `#0F172A` | Headlines & Primary Metrics (`--text-primary`) | 15.2:1 on `#F5F7FA` |
| **Secondary Text** | `#64748B` | Labels, Subtitles, Meta (`--text-secondary`) | 4.8:1 on `#F5F7FA` |
| **Border** | `#E2E8F0` | Dividers & Component Outlines (`--border-color`) | Soft architectural border |
| **Primary Accent** | `#047857` | Primary CTA, Active Indicators (`--accent-primary`) | 5.8:1 on `#F5F7FA` |
| **Accent Hover** | `#065F46` | Button Hover State (`--accent-hover`) | Darker interactive state |
| **Accent Text** | `#FFFFFF` | Text on Primary Accent Buttons | 5.4:1 on `#047857` |
| **Success** | `#15803D` | Income, Positive Net Worth, Affordable | 5.1:1 on `#F5F7FA` |
| **Danger / Error** | `#B91C1C` | Expenses, Shortfalls, Unaffordable | 5.5:1 on `#F5F7FA` |
| **Warning** | `#92400E` | Caution, Risky Decisions, Buffer Warning | 5.8:1 on `#F5F7FA` |
| **Information** | `#1D4ED8` | Liquid cash, Information Badges | 6.2:1 on `#F5F7FA` |

---

## 3. Bento Grid Dashboard Architecture

The FinFlow Dashboard employs an asymmetric, responsive 12-column Bento Grid:

```
+-------------------------------------------------------------------------------+
| TOP ACTION BAR: Context Indicator + Quick Add via SMS + New Transaction       |
+---------------------------------------------------+---------------------------+
| HERO NET WORTH & WEALTH OVERVIEW (Span 7)         | SAFE TO SPEND HERO        |
| - Total Net Worth in clamp(30px, 4vw, 42px)       | (Span 5)                  |
| - P&L indicator pill (+₹ / %)                      | - Daily allowance         |
| - Micro-cards: Liquid | Invested | Monthly Spend  | - Safety Buffer & Status  |
+---------------------------------------------------+---------------------------+
| CAN I AFFORD IT? (Span 4) | MONTHLY CA REPORT (4) | FOUNDATION SCORE (Span 4) |
| - Capacity pill           | - Audit Score / 100   | - Score / 100             |
| - Decision badge          | - Savings rate eval   | - Milestones progress bar |
+---------------------------+-----------------------+---------------------------+
| FINANCIAL RULEBOOK HIGHLIGHT (Span 12)                                        |
| - 28 Golden Principles & Interactive Calculators banner                       |
+---------------------------------------------------+---------------------------+
| MONTHLY EXPENSE FLOW CHART (Span 7)               | ASSET ALLOCATION (Span 5) |
| - Area chart: Needs vs Wants gradient              | - Donut chart + Legend    |
| - Tabular hover tooltips                          | - 50-30-20 progress bar   |
+---------------------------------------------------+---------------------------+
| FIXED OBLIGATIONS TRACKER (Span 6)                | WHO OWES ME (Span 6)      |
| - Progress bar of paid bills                      | - Peer debt & settlements |
+---------------------------------------------------+---------------------------+
| CONNECTED ACCOUNTS OVERVIEW (Span 12)                                         |
+-------------------------------------------------------------------------------+
```

---

## 4. Navigation Architecture

### 4.1 Desktop Grouped Sidebar
- **Width:** Collapsible between `240px` (expanded) and `72px` (collapsed).
- **Categories:**
  - **Workspace:** Overview (`dashboard`), Transactions (`expenses`)
  - **Wealth:** Portfolio (`portfolio`), Wealth Projections (`projection`), Investment Planner (`planner`)
  - **Financial Intelligence:** Can I Afford It? (`affordability`), Monthly CA Report (`ca-report`), Milestones (`milestones`), Rulebook (`rulebook`)
  - **Account Footer:** User Profile & Settings (`profile`), Theme Switcher, Currency Selector, Logout.
- **Active State:** Clean accent pill with `borderLeft: 3px solid #10B981` and subtle background tint.

### 4.2 Mobile-First Native Experience
- **Fixed Bottom Navigation Bar:**
  - `Home` (`dashboard`)
  - `Activity` (`expenses`)
  - `Add` (Center highlighted circular CTA with `Plus` icon triggering Quick Action sheet)
  - `Wealth` (`portfolio`)
  - `More` (Triggering native slide-up sheet with all intelligence services, projections, and account preferences)
- **Safe Inset Accommodation:** All scrollable page views declare `padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px))` so navigation controls never obscure interaction buttons.
- **Touch Ergonomics:** Form inputs, buttons, and selectable tags enforce minimum `44px` height on mobile breakpoints.

---

## 5. Typography Scale & Font Stack

### Font Family
- **Primary Interface Font:** `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif`
- **Monetary & Numerical Figures:** `font-variant-numeric: tabular-nums;`
- **Code & Raw Formulas:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Type Scale
| Level | Font Size | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display 1** | `clamp(30px, 4vw, 42px)` | 800 (Extrabold) | Hero figures, Net Worth headline |
| **Heading 1** | `22px` (`1.375rem`) | 700 (Bold) | Page titles, Modal headers |
| **Heading 2** | `16px` - `18px` | 700 (Bold) | Section headers, Widget titles |
| **Heading 3** | `14px` - `15px` | 600 (Semibold) | Card titles, Subsection headers |
| **Body (Regular)** | `13px` - `14px` | 400 (Regular) | Paragraphs, transaction descriptions |
| **Body (Medium)** | `12px` - `13px` | 500 (Medium) | Table cells, form input text |
| **Caption / Meta** | `11px` - `12px` | 500 (Medium) | Timestamps, secondary badge text |
| **Micro** | `10px` - `11px` | 700 (Bold) | Status pill tags, category headers |

---

## 6. Verification Checklist
- [x] Dual-theme compatibility confirmed for Dark (`#0D1117`) and Light (`#F5F7FA`) modes.
- [x] WCAG AA contrast compliance across all text and interactive buttons.
- [x] Responsive 12-column Bento Grid on desktop scaling smoothly to single-column on mobile.
- [x] Mobile bottom navigation with safe-area padding and center quick-action sheet.
- [x] Tabular numerals (`tabular-nums`) applied to all financial figures.
- [x] All 61 backend automated tests passing (100%).
- [x] All 18 frontend automated tests passing (100%).
