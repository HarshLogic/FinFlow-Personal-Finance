const router = require("express").Router();
const {
  generateMonthlyReport,
  getMonthlyReportsHistory,
  getReportPDF,
  getReportCSV,
} = require("../services/monthlyReportService");

// GET /api/reports/monthly - history of reports
router.get("/monthly", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const history = await getMonthlyReportsHistory(userId);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/monthly/generate - generate/regenerate report
router.post("/monthly/generate", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const now = new Date();
    const year = Number(req.body.year) || now.getFullYear();
    const month = Number(req.body.month) || (now.getMonth() + 1);
    const force = Boolean(req.body.forceRegenerate);

    const report = await generateMonthlyReport(userId, year, month, force);
    res.status(200).json({ success: true, report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reports/monthly/:year/:month - get specific report
router.get("/monthly/:year/:month", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid year or month parameters." });
    }

    const report = await generateMonthlyReport(userId, year, month, false);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/monthly/:year/:month/pdf - download PDF
router.get("/monthly/:year/:month/pdf", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    const pdfBuffer = await getReportPDF(userId, year, month);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=finflow-ca-report-${year}-${String(month).padStart(2, "0")}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/monthly/:year/:month/csv - download CSV
router.get("/monthly/:year/:month/csv", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    const csvData = await getReportCSV(userId, year, month);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=finflow-ca-report-${year}-${String(month).padStart(2, "0")}.csv`);
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
