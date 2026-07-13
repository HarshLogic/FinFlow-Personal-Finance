const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
 
dotenv.config();
 
const app = express();
 
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://fin-flow-personal-finance.vercel.app" // Your main production URL
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // 2. Allow if it's in our explicit list OR if it's a Vercel preview URL
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
  console.log(req.method, req.url);
  next();
});

app.use("/api/expenses",    require("./routes/expenses"));
app.use("/api/stocks",      require("./routes/stocks"));
app.use("/api/mutualfunds", mfRouter);
app.use("/api/fds",         fdRouter);
app.use("/api/liquid",      liquidRouter);
app.use("/api/summary",     require("./routes/summary"));
 
// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));
 
// ── DB + Server ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
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
}
 
module.exports = app;