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
  "https://finflowpr.vercel.app/" 
];

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

// ── Routes ────────────────────────────────────────────────────────────────────
const { mfRouter, fdRouter, liquidRouter } = require("./routes/portfolio");

app.use((req, res, next) => {
  next();
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses",    requireAuth(), require("./routes/expenses"));
app.use("/api/income",      requireAuth(), require("./routes/income"));
app.use("/api/stocks",      requireAuth(), require("./routes/stocks"));
app.use("/api/mutualfunds", requireAuth(), mfRouter);
app.use("/api/fds",         requireAuth(), fdRouter);
app.use("/api/liquid",      requireAuth(), liquidRouter);
app.use("/api/summary",     requireAuth(), require("./routes/summary"));
 
// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));
 
// ── DB + Server ───────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { dbName: "finflow" })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅  Finance Flow API running on port ${PORT}`);
      require("./cron/schedular");
    });
  })
  .catch(err => { console.error("MongoDB connection failed:", err); process.exit(1); });
 
module.exports = app;