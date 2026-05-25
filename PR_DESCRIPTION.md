# FinFlow Roadmap Implementation & Code Quality Overhaul 🚀

## Description
This PR fully implements all the outstanding items on the `CONTRIBUTING.md` Roadmap, alongside a comprehensive suite of code quality, performance, and stability improvements.

### 🌟 Roadmap Features Implemented:
* **JWT Authentication**: Replaced the hardcoded `demo_user`. Implemented full JWT-based authentication using `bcryptjs`. Users now have secure, isolated workspaces for their financial data. Added a beautiful, dark-themed Login and Registration UI.
* **Automated Price Sync**: Integrated the AlphaVantage API. Fixed a critical typo (`isNan`) in the daily cron job that prevented the automated stock sync from running. Added a new "Sync Prices" button in the Portfolio view for manual, on-demand syncing.
* **Mobile Responsiveness**: The app is now fully responsive. The static sidebar dynamically transforms into a collapsible hamburger menu on screens smaller than 768px, making the dashboard fully usable on mobile devices.
* **Internationalization**: Users can now select their preferred currency (e.g., USD, EUR). The frontend formatting utilities dynamically adapt to display the correct currency symbol and localized formatting across all metric cards and charts.

### 🛠️ Code Quality & Performance Improvements:
* **N+1 Query Fix**: Refactored the `/api/summary` endpoint. It now exclusively queries expenses for the *current month* when calculating "Needs vs Wants," rather than eagerly loading the user's entire transaction history into memory.
* **API Rate Limiting**: Implemented a 15-second delay between AlphaVantage API requests in the stock syncing scripts. This ensures compliance with the free-tier rate limit (5 requests per minute) and eliminates silent failures.
* **Centralized Error Handling**: Integrated `express-async-handler` across the backend. Replaced dozens of repetitive `try/catch` blocks in the route controllers with a clean, centralized global error handling middleware in `server.js`.
* **Auth Resiliency**: Added a global Axios response interceptor in the frontend. If a JWT token expires, the app will cleanly redirect the user to the login screen instead of silently failing and displaying a broken dashboard.
* **Documentation**: Updated `README.md` to clarify the Create React App (`react-scripts`) frontend setup.

## 🧪 Testing Checklist
- [x] Tested User Registration and Login flows.
- [x] Verified that data (expenses, stocks, FDs) is strictly isolated between different user accounts.
- [x] Verified that the automated cron job and manual sync button respect API rate limits.
- [x] Tested the UI on mobile viewports to ensure the hamburger menu functions properly.
- [x] Ensured SIP and FD calculations remain accurate.
