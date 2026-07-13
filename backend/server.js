const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
const { clerkMiddleware, requireAuth } = require("@clerk/express"); 

dotenv.config();
 
const app = express();
 
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://fin-flow-personal-finance.vercel.app" 
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

app.use(clerkMiddleware());
 
// ── Routes ────────────────────────────────────────────────────────────────────
const { mfRouter, fdRouter, liquidRouter } = require("./routes/portfolio");

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api/expenses",    requireAuth(), require("./routes/expenses"));
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
      console.log(`✅  FinFlow API running on port ${PORT}`);
      require("./cron/schedular");
    });
  })
  .catch(err => { console.error("❌  MongoDB connection failed:", err); process.exit(1); });
 
module.exports = app;