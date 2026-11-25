# FinFlow — Deployment & Operations Guide

## 1. Overview & Hosting Architecture
FinFlow operates as a decoupled client-server architecture:
- **Frontend SPA:** Hosted on static edge infrastructure (e.g., Vercel, Netlify, or AWS S3/CloudFront).
- **Backend API:** Hosted on an isolated Node.js container or virtual server (e.g., Render, Railway, AWS ECS, or DigitalOcean Droplet).
- **Database:** Hosted on MongoDB Atlas or a dedicated replica set cluster with TLS encryption and SCRAM-SHA-256 authentication.

---

## 2. Environment Variables Catalog

> **CRITICAL SECURITY DIRECTIVE:** Never commit actual secrets or credentials to source control. This section documents only variable names, expected formats, and purpose.

### 2.1 Backend Environment Variables (`backend/.env`)
| Variable Name | Required | Verification Status | Purpose | Example Shape |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Yes | VERIFIED | Port on which Express API listens. | `5000` |
| `MONGO_URI` | Yes | VERIFIED | MongoDB connection string. In production, must be an Atlas/Cluster URI. | `mongodb+srv://<user>:<pwd>@cluster...` |
| `JWT_SECRET` | Yes | VERIFIED | Cryptographic secret key for signing user auth tokens. | High-entropy 64+ char string |
| `CLIENT_URL` | Optional | VERIFIED | Allowed frontend origin for CORS resolution. | `https://fin-flow-personal-finance.vercel.app` |
| `GOOGLE_CLIENT_ID`| Optional | VERIFIED | Google OAuth 2.0 Web Client ID for ID token validation. | `<id>.apps.googleusercontent.com` |
| `ALPHA_VANTAGE_API_KEY`| Optional| VERIFIED | API key for daily stock quote cron job. | Standard API key string |
| `NODE_ENV` | Optional | VERIFIED | Environment mode (`development`, `test`, `production`). | `production` |

### 2.2 Frontend Environment Variables (`frontend/.env`)
| Variable Name | Required | Verification Status | Purpose | Example Shape |
| :--- | :--- | :--- | :--- | :--- |
| `REACT_APP_API_URL` | Yes | VERIFIED | Target base URL for backend API requests. | `http://localhost:5000/api` or `https://api.finflow.com/api` |
| `REACT_APP_GOOGLE_CLIENT_ID`| Optional | VERIFIED | Google OAuth client ID matching backend. | `<id>.apps.googleusercontent.com` |

---

## 3. Build & Runtime Commands

### Backend
- **Install Dependencies:** `npm install --omit=dev`
- **Run Production Server:** `npm start` (Runs `node server.js`)
- **Run Development Server:** `npm run dev` (Runs `nodemon server.js`)
- **Run Unit/Integration Tests:** `npm test` (Runs `node --test tests/*.test.js`)

### Frontend
- **Install Dependencies:** `npm install`
- **Build Production Bundle:** `npm run build` (Outputs optimized HTML/JS/CSS to `frontend/build/`)
- **Run Automated Test Suite:** `CI=true npm test -- --watchAll=false`
- **Run Local Development Server:** `npm start` (Runs on `http://localhost:3000`)

---

## 4. Health Checks & Production Safeguards

### 4.1 Health Check Endpoint (`GET /health`)
- **URL:** `http://<host>:5000/health`
- **Response Format:**
  ```json
  {
    "status": "ok",
    "db": "connected",
    "dbConnected": true,
    "ts": "2026-11-25T12:00:00.000Z"
  }
  ```
- **Readiness Check:** If `dbConnected` is `false`, the database connection has dropped. Load balancers must route traffic away until reconnect.

### 4.2 Production Startup Invariants
`backend/server.js` contains fail-fast assertions in `production`:
1. If `NODE_ENV === "production"` and `JWT_SECRET` contains `"fallback"` or is missing, the server logs a fatal error and terminates (`process.exit(1)`).
2. If `NODE_ENV === "production"` and `MONGO_URI` points to `localhost` or `127.0.0.1`, the server terminates immediately.

---

## 5. Backup, Rollback & Incident Recovery

### 5.1 Database Backups
- Utilize MongoDB Atlas Automated Continuous Backups (Point-in-Time recovery) or daily `mongodump` cron tasks:
  ```bash
  mongodump --uri="$MONGO_URI" --gzip --archive=/backups/finflow_$(date +%Y%m%d).gz
  ```
- Retain daily archives for 30 days and monthly snapshots for 12 months.

### 5.2 Rollback Procedure
If a production deployment introduces critical defects:
1. **Frontend:** Revert Vercel deployment to the previous immutable deployment commit via the Vercel dashboard or CLI.
2. **Backend:** Re-deploy the previous Git commit hash or container image tag.
3. **Database:** Because FinFlow schemas maintain backwards compatibility, code rollbacks do not require database rollbacks unless destructive operations occurred.
