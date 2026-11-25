const dotenv   = require("dotenv");
dotenv.config(); // Load before anything else!

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const { requireAuth } = require("./middleware/auth"); 

const app = express();
 
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://fin-flow-personal-finance.vercel.app" 
];

if (process.env.CLIENT_URL) {
  const cleanClient = process.env.CLIENT_URL.trim().replace(/\/+$/, "");
  if (cleanClient && !allowedOrigins.includes(cleanClient)) {
    allowedOrigins.push(cleanClient);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbState = dbStates[mongoose.connection.readyState] || "unknown";
  res.json({
    status: "ok",
    db: dbState,
    dbConnected: mongoose.connection.readyState === 1,
    ts: new Date()
  });
});

// ── Database Connection Readiness Middleware ─────────────────────────────────
app.use("/api", (req, res, next) => {
  // If not connected and not currently connecting in production/dev
  if (mongoose.connection.readyState === 0 && process.env.NODE_ENV !== "test") {
    return res.status(503).json({
      error: "Database is not connected. Please ensure MongoDB is running or configure MONGO_URI in backend/.env",
      status: "DATABASE_UNAVAILABLE"
    });
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
const { mfRouter, fdRouter, liquidRouter } = require("./routes/portfolio");

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/expenses",    requireAuth(), require("./routes/expenses"));
app.use("/api/income",      requireAuth(), require("./routes/income"));
app.use("/api/stocks",      requireAuth(), require("./routes/stocks"));
app.use("/api/mutualfunds", requireAuth(), mfRouter);
app.use("/api/fds",         requireAuth(), fdRouter);
app.use("/api/liquid",      requireAuth(), liquidRouter);
app.use("/api/summary",     requireAuth(), require("./routes/summary"));
app.use("/api/budget",      requireAuth(), require("./routes/budget"));
app.use("/api/accounts",    requireAuth(), require("./routes/accounts").accountRouter);
app.use("/api/obligations", requireAuth(), require("./routes/obligations"));
app.use("/api/splits",      requireAuth(), require("./routes/splits"));
app.use("/api/reports",     requireAuth(), require("./routes/reports"));
app.use("/api/affordability", requireAuth(), require("./routes/affordability"));
app.use("/api",             requireAuth(), require("./routes/foundation"));

// ── Production Environment Safeguards ─────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("fallback")) {
    console.error("FATAL: In production, a secure unique JWT_SECRET environment variable is strictly required.");
    process.exit(1);
  }
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("127.0.0.1") || process.env.MONGO_URI.includes("localhost")) {
    console.error("FATAL: In production, a dedicated MONGO_URI cluster connection string is strictly required. Localhost fallback prohibited.");
    process.exit(1);
  }
}

// ── DB + Server ───────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow";

const server = app.listen(PORT, () => {
  console.log(`✅  Finance Flow API running on port ${PORT}`);
  if (!process.env.MONGO_URI) {
    console.warn("⚠️   process.env.MONGO_URI is not set. Using fallback: mongodb://127.0.0.1:27017/finflow");
    console.warn("👉  To connect to MongoDB Atlas, add MONGO_URI=mongodb+srv://... to backend/.env");
  }
});

// Connect to MongoDB asynchronously without crashing the HTTP server
mongoose
  .connect(MONGO_URI, { dbName: "finflow", serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅  Connected to MongoDB successfully");
    try {
      require("./cron/schedular");
    } catch (cronErr) {
      console.warn("⚠️  Scheduler setup warning:", cronErr.message);
    }
  })
  .catch((err) => {
    console.error("⚠️   MongoDB connection error:", err.message);
    console.error("👉  Please verify that MongoDB is running or update MONGO_URI in backend/.env");
  });

module.exports = app;
