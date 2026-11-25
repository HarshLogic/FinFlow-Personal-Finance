# FinFlow Design System & Aesthetic Specification

## 1. Overview & Design Philosophy

**FinFlow** is an institutional-grade Personal Financial Operating System. The user interface prioritizes clarity, financial precision, calm confidence, and understated elegance.

### Core Principles
1. **Financial Precision:** Currency figures always render in tabular numerals (`tabular-nums`) to prevent optical jitter and ensure instant vertical scanning.
2. **Subtle Elevation & Contrast:** Tactile depth is created through crisp 1px borders and refined multi-layer ambient drop shadows—never harsh neon glows, saturated card borders, or high-contrast drop-shadows.
3. **Intentional Accents:** Brand accents (Electric Blue in Dark Mode, Burnt Orange in Light Mode) are reserved for primary calls-to-action, active indicators, and directional chart series.
4. **Accessible Hierarchy:** Text contrast strictly complies with WCAG AA standards (4.5:1 minimum for body text, 3:1 for large display metrics).
5. **Calm Surfaces:** Deep charcoal and warm cream surfaces minimize cognitive fatigue during long financial planning sessions.

---

## 2. Color Palettes

### 2.1 Dark Mode (Default)
Optimized for low-light environments, OLED displays, and professional trading/wealth monitoring.

| Token Name | Hex Code | Role / Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| **Charcoal** | `#1E1E1C` | Page Background (`--bg-page`) | Canvas base |
| **Card Surface** | `#282826` | Card Background (`--bg-card`) | Contrast with page: 1.15:1 |
| **Elevated Surface** | `#30302D` | Modals, Dropdowns, Tooltips (`--bg-surface`) | Contrast with card: 1.18:1 |
| **Sand** | `#D8CBB3` | Primary Typography & Headlines (`--text-primary`) | 9.4:1 on Charcoal |
| **Secondary Sand** | `#A8A294` | Labels, Subtitles, Meta Data (`--text-secondary`) | 5.6:1 on Charcoal |
| **Muted Border** | `#3D3D37` | Dividers & Component Outlines (`--border-color`) | Subtle delimiter |
| **Electric Blue** | `#2F6BFF` | Primary Accent, Active Nav, Focus Ring (`--accent`) | 4.8:1 on Charcoal |
| **Accent Text** | `#FFFFFF` | Text on Primary Button & Pills | 4.6:1 on Electric Blue |
| **Success Green** | `#4ADE80` | Income, Positive Net Worth, Affordable | 10.2:1 on Charcoal |
| **Error Red** | `#F87171` | Expenses, Over-budget, Unaffordable | 6.8:1 on Charcoal |
| **Warning Amber** | `#FBBF24` | Caution, Risky Simulations, Approaching Limit | 11.5:1 on Charcoal |

### 2.2 Light Mode
A warm, editorial editorial palette evocative of fine financial print and premium stationery.

| Token Name | Hex Code | Role / Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- |
| **Cream** | `#F3EEE3` | Page Background (`--bg-page`) | Warm canvas base |
| **Card Surface** | `#FAF7F0` | Card Background (`--bg-card`) | Subtle elevation |
| **Elevated Surface** | `#FFFFFF` | Modals, Inputs, Elevated Panels (`--bg-surface`) | Pure white focus surface |
| **Ink Black** | `#111111` | Primary Typography & Headlines (`--text-primary`) | 14.8:1 on Cream |
| **Secondary Ink** | `#746D63` | Labels, Subtitles, Meta Data (`--text-secondary`) | 4.9:1 on Cream |
| **Muted Border** | `#DDD5C6` | Dividers & Component Outlines (`--border-color`) | Soft structural border |
| **Burnt Orange** | `#D9541E` | Primary Accent, Active Nav, Focus Ring (`--accent`) | 4.5:1 on Cream |
| **Accent Text** | `#FFFFFF` | Text on Primary Button & Pills | 4.6:1 on Burnt Orange |
| **Success Forest** | `#15803D` | Income, Positive Net Worth, Affordable | 5.2:1 on Cream |
| **Error Crimson** | `#B91C1C` | Expenses, Over-budget, Unaffordable | 5.4:1 on Cream |
| **Warning Ochre** | `#92400E` | Caution, Risky Simulations, Approaching Limit | 5.6:1 on Cream |

---

## 3. Typography Scale & Font Stack

### Font Family
- **Primary Interface Font:** `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monetary & Numerical Figures:** `'DM Sans', system-ui` with `font-variant-numeric: tabular-nums; letter-spacing: -0.01em;`
- **Formulas & Code Tokens:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Type Scale
| Level | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `28px` (`1.75rem`) | `1.2` | 800 (Extrabold) | Hero figures, Net worth headline |
| **Heading 1** | `22px` (`1.375rem`) | `1.3` | 700 (Bold) | Page titles, Modal headers |
| **Heading 2** | `18px` (`1.125rem`) | `1.35` | 700 (Bold) | Section headers, Widget titles |
| **Heading 3** | `15px` (`0.9375rem`) | `1.4` | 600 (Semibold) | Card titles, Subsection headers |
| **Body (Regular)** | `14px` (`0.875rem`) | `1.5` | 400 (Regular) | Paragraphs, transaction descriptions |
| **Body (Medium)** | `13px` (`0.8125rem`) | `1.45` | 500 (Medium) | Table cells, form input text |
| **Caption / Meta** | `12px` (`0.75rem`) | `1.4` | 500 (Medium) | Timestamps, secondary badge text |
| **Micro** | `11px` (`0.6875rem`) | `1.3` | 600 (Semibold) | Status pill tags, uppercase labels |

---

## 4. Spacing, Elevation & Geometry Scale

### Spacing Scale
- `2xs`: `4px`
- `xs`: `8px`
- `sm`: `12px`
- `md`: `16px`
- `lg`: `20px`
- `xl`: `24px`
- `2xl`: `32px`
- `3xl`: `48px`

### Border Radii
- **Tag / Chip / Small Button:** `6px`
- **Input Fields & Action Buttons:** `8px` - `10px`
- **Cards & Widgets:** `14px` - `16px`
- **Modals & Floating Dialogs:** `16px` - `20px`
- **Pills & Avatars:** `9999px` (Full circle / pill)

### Shadow System
- **Subtle (Cards):** `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)`
- **Elevated (Dropdowns, Hover States):** `0 4px 16px -2px rgba(0, 0, 0, 0.2)`
- **Modal Backdrop:** `rgba(0, 0, 0, 0.72)` with `backdrop-filter: blur(6px)`
- **Modal Dialog:** `0 24px 48px -12px rgba(0, 0, 0, 0.5)`

---

## 5. Component Anatomy & Patterns

### 5.1 Metric Cards (`MetricCard`)
- **Structure:** Compact flex container with icon container, uppercase label, large primary tabular value, and contextual subtitle.
- **Background:** `C.card` (`#282826` / `#FAF7F0`) with 1px `C.border`.
- **Numerals:** Explicit `font-variant-numeric: tabular-nums` to guarantee steady tabular alignment.

### 5.2 Buttons
- **Primary Action Button:**
  - Background: `C.accent` (`#2F6BFF` in dark, `#D9541E` in light).
  - Text: `#FFFFFF` (Bold, 13–14px).
  - Border: None.
  - Hover: Subtle brightness shift (`C.accentHover`).
- **Secondary / Ghost Button:**
  - Background: `transparent`.
  - Border: `1px solid C.border`.
  - Text: `C.text`.
  - Hover: `background: C.surface`.

### 5.3 Form Inputs
- Background: `C.surface` (`#30302D` in dark, `#FFFFFF` in light).
- Border: `1px solid C.border`.
- Focus Ring: `outline: 2px solid C.accent; outline-offset: 1px;`.
- Text: `C.text` with `font-size: 13px–14px`.

### 5.4 Data Tables
- Header: Sticky or distinct row with uppercase `C.muted` text (11px, weight 600, letter-spacing +0.05em).
- Row Separator: `1px solid C.border`.
- Row Hover: `background: C.surface`.
- Monetary Columns: Right-aligned with tabular numerals.

### 5.5 Charts (Recharts)
- Background: Transparent container within `C.card`.
- Cartesian Grid: Stroke color synced with `C.chart.grid` (`#3D3D37` / `#DDD5C6`), `strokeDasharray: "3 3"`, opacity `0.4`.
- Tooltip: Floating card with `background: C.surface`, `border: 1px solid C.border`, `boxShadow: 0 4px 12px rgba(0,0,0,0.2)`.

---

## 6. Accessibility & Motion Guidelines

### Accessibility (WCAG AA Compliance)
- All interactive controls have visible `:focus-visible` outlines.
- All button labels on brand accents use `#FFFFFF` for guaranteed > 4.5:1 contrast.
- Input elements include proper `aria-label` or `<label>` associations.
- Modals include `role="dialog"`, `aria-modal="true"`, and accessible close buttons.

### Motion Principles
- Transition Duration: `150ms` (hover states) to `250ms` (modals, drawers).
- Timing Curve: `cubic-bezier(0.16, 1, 0.3, 1)` or standard `ease`.
- Accessibility: Honor `prefers-reduced-motion: reduce` by disabling non-essential transitions.

---

## 7. Developer Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** import `themes` and atom components from `src/shared.jsx`. | **Don't** hardcode raw hex codes like `#10B981` or `#0D0F14` in page components. |
| **Do** use `font-variant-numeric: tabular-nums` for all financial figures. | **Don't** use proportional numerals that jump and jitter on re-render. |
| **Do** use `#FFFFFF` text color on top of `C.accent` / `C.primary`. | **Don't** place `#000000` text on Electric Blue or Burnt Orange accents. |
| **Do** use `C.border` and subtle shadows for component separation. | **Don't** use heavy multi-colored neon glows or harsh drop-shadows. |
| **Do** test every visual change in both Dark Mode and Light Mode. | **Don't** assume dark-mode styling works correctly in light mode. |
