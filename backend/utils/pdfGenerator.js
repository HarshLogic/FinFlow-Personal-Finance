/**
 * Pure Node.js Zero-Dependency PDF-1.4 Generator
 * 
 * Generates an executive, highly formatted, multi-page PDF document
 * for FinFlow — Monthly Personal Financial Review.
 */

class SimplePDFBuilder {
  constructor(pageWidth = 595.28, pageHeight = 841.89) { // Standard A4 points
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
    this.pages = []; // Array of content stream strings
    this.currentPageIndex = -1;
    this.addPage();
  }

  addPage() {
    this.pages.push([]);
    this.currentPageIndex = this.pages.length - 1;
    this.currentY = this.pageHeight - 50; // 50pt top margin
  }

  get currentStream() {
    return this.pages[this.currentPageIndex];
  }

  escapeText(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[^\x20-\x7E]/g, "?"); // Keep ASCII printable, replace high unicode gracefully
  }

  // Raw PDF command
  raw(cmd) {
    this.currentStream.push(cmd);
  }

  // Draw rectangle
  rect(x, y, w, h, fillColor = null, strokeColor = null, lineWidth = 1) {
    let cmd = "";
    if (fillColor) {
      cmd += `${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg\n`;
    }
    if (strokeColor) {
      cmd += `${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG\n${lineWidth} w\n`;
    }
    cmd += `${x} ${y} ${w} ${h} re\n`;
    if (fillColor && strokeColor) cmd += "B\n";
    else if (fillColor) cmd += "f\n";
    else if (strokeColor) cmd += "S\n";
    this.raw(cmd);
  }

  // Draw line
  line(x1, y1, x2, y2, strokeColor = [0.8, 0.8, 0.8], lineWidth = 1) {
    this.raw(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG\n${lineWidth} w\n${x1} ${y1} m\n${x2} ${y2} l\nS\n`);
  }

  // Add text
  text(str, x, y, { font = "F1", size = 10, color = [0.1, 0.1, 0.1] } = {}) {
    const escaped = this.escapeText(str);
    const cmd = `BT\n/${font} ${size} Tf\n${color[0]} ${color[1]} ${color[2]} rg\n1 0 0 1 ${x} ${y} Tm\n(${escaped}) Tj\nET\n`;
    this.raw(cmd);
  }

  build() {
    const objects = [];
    let objectCount = 0;

    const newObj = () => {
      objectCount++;
      return objectCount;
    };

    // Obj 1: Catalog
    const catalogObj = newObj(); // 1
    // Obj 2: Pages collection
    const pagesObj = newObj();   // 2
    // Font objects
    const fontRegularObj = newObj(); // 3
    const fontBoldObj = newObj();    // 4

    const pageObjIds = [];
    const streamObjIds = [];

    for (let i = 0; i < this.pages.length; i++) {
      pageObjIds.push(newObj());
      streamObjIds.push(newObj());
    }

    const objOffsets = {};
    let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

    const addObj = (id, content) => {
      objOffsets[id] = Buffer.byteLength(output, "utf8");
      output += `${id} 0 obj\n${content}\nendobj\n`;
    };

    // 1. Catalog
    addObj(catalogObj, `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

    // 2. Pages
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(" ");
    addObj(pagesObj, `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>`);

    // 3. Regular Font
    addObj(fontRegularObj, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

    // 4. Bold Font
    addObj(fontBoldObj, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

    // Page & Stream pairs
    for (let i = 0; i < this.pages.length; i++) {
      const pId = pageObjIds[i];
      const sId = streamObjIds[i];
      const streamContent = this.pages[i].join("");
      const streamLength = Buffer.byteLength(streamContent, "utf8");

      addObj(pId, `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${sId} 0 R /Resources << /Font << /F1 ${fontRegularObj} 0 R /F2 ${fontBoldObj} 0 R >> >> >>`);
      addObj(sId, `<< /Length ${streamLength} >>\nstream\n${streamContent}endstream`);
    }

    // XREF Table
    const xrefOffset = Buffer.byteLength(output, "utf8");
    output += `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objectCount; i++) {
      const offset = objOffsets[i] || 0;
      output += String(offset).padStart(10, "0") + " 00000 n \n";
    }

    output += `trailer\n<< /Size ${objectCount + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(output, "utf8");
  }
}

/**
 * Generates the complete FinFlow Monthly Personal CA Report PDF Buffer
 */
function generateMonthlyReportPDF(report, user = {}) {
  const pdf = new SimplePDFBuilder();
  const currencySymbol = report.currency === "USD" ? "$" : report.currency === "GBP" ? "£" : "Rs.";
  const fmt = (n) => `${currencySymbol} ${Math.round(Number(n) || 0).toLocaleString()}`;

  // ==========================================
  // PAGE 1: EXECUTIVE SUMMARY & HEALTH SCORE
  // ==========================================

  // Header Banner Background
  pdf.rect(0, 740, 595.28, 102, [0.08, 0.11, 0.17]); // Dark navy/slate
  // Accent Bar
  pdf.rect(0, 736, 595.28, 4, [0.93, 0.73, 0.28]); // FinFlow gold

  // Title & Subtitle
  pdf.text("FINFLOW — PERSONAL CA FINANCIAL REVIEW", 40, 805, { font: "F2", size: 16, color: [1, 1, 1] });
  pdf.text("Automated Monthly Wealth, Cash Flow & Financial Health Audit", 40, 788, { font: "F1", size: 10, color: [0.75, 0.8, 0.9] });

  // Metadata Right-Aligned
  const reportLabel = report.reportingPeriod?.label || `${report.month}/${report.year}`;
  const userName = user.displayName || user.email || user.userId || "Valued User";
  const genDate = new Date(report.generatedAt || Date.now()).toLocaleDateString();

  pdf.text(`User: ${userName}`, 380, 805, { font: "F2", size: 9, color: [1, 1, 1] });
  pdf.text(`Period: ${reportLabel}`, 380, 790, { font: "F1", size: 9, color: [0.9, 0.9, 0.9] });
  pdf.text(`Generated: ${genDate}`, 380, 775, { font: "F1", size: 9, color: [0.7, 0.75, 0.85] });
  if (report.isProvisional) {
    pdf.rect(380, 755, 90, 14, [0.95, 0.5, 0.1]);
    pdf.text("PROVISIONAL", 390, 760, { font: "F2", size: 8, color: [1, 1, 1] });
  }

  // Section 1: Financial Health Score Card
  pdf.rect(40, 630, 515.28, 90, [0.97, 0.98, 1.0], [0.85, 0.88, 0.95]);
  const score = report.healthScore?.score || 0;
  const rating = report.healthScore?.rating || "Evaluated";

  pdf.text("FINANCIAL HEALTH SCORE", 60, 698, { font: "F2", size: 11, color: [0.1, 0.2, 0.35] });
  pdf.text(`${score} / 100`, 60, 655, { font: "F2", size: 32, color: score >= 75 ? [0.06, 0.65, 0.4] : score >= 50 ? [0.9, 0.55, 0.05] : [0.85, 0.2, 0.2] });
  pdf.text(`Rating: ${rating}`, 210, 680, { font: "F2", size: 13, color: [0.1, 0.15, 0.25] });
  pdf.text("Based on savings performance, budget discipline, emergency buffer, debt burden, and investments.", 210, 663, { font: "F1", size: 8, color: [0.4, 0.45, 0.55] });
  pdf.text("Note: This is an automated FinFlow budgeting indicator, not an official credit score.", 210, 647, { font: "F1", size: 8, color: [0.55, 0.55, 0.6] });

  // Section 2: Key Financial Snapshot Grid (6 KPI cards)
  const summary = report.financialSummary || {};
  const kpis = [
    { label: "Total Monthly Income", value: fmt(summary.totalIncome), sub: "Cash in" },
    { label: "Personal Expenses", value: fmt(summary.totalExpenses), sub: "Consumption" },
    { label: "Total Net Savings", value: fmt(summary.totalSavings), sub: `Rate: ${(summary.savingsRate || 0).toFixed(1)}%` },
    { label: "Liquid Cash Reserves", value: fmt(summary.liquidBalance), sub: "Available cash" },
    { label: "Fixed Obligations", value: fmt(summary.fixedCommitments), sub: `Unpaid: ${fmt(summary.pendingBills)}` },
    { label: "Estimated Net Worth", value: fmt(summary.netWorth), sub: summary.netWorthChange >= 0 ? `+${fmt(summary.netWorthChange)} MoM` : `${fmt(summary.netWorthChange)} MoM` },
  ];

  let kpiY = 590;
  pdf.text("MONTHLY FINANCIAL LEDGER SNAPSHOT", 40, kpiY + 15, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });

  for (let i = 0; i < kpis.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cardX = 40 + (col * 178);
    const cardY = kpiY - 50 - (row * 58);

    pdf.rect(cardX, cardY, 165, 48, [0.98, 0.98, 0.99], [0.9, 0.92, 0.95]);
    pdf.text(kpis[i].label, cardX + 10, cardY + 34, { font: "F1", size: 8, color: [0.45, 0.5, 0.55] });
    pdf.text(kpis[i].value, cardX + 10, cardY + 18, { font: "F2", size: 12, color: [0.1, 0.15, 0.2] });
    pdf.text(kpis[i].sub, cardX + 10, cardY + 6, { font: "F1", size: 7.5, color: [0.3, 0.5, 0.7] });
  }

  // Section 3: Health Score Factor Breakdown Table
  const breakdownY = 430;
  pdf.text("FINANCIAL HEALTH FACTORS BREAKDOWN", 40, breakdownY + 15, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });

  const b = report.healthScore?.breakdown || {};
  const factors = [
    { name: "Savings Performance", max: 25, item: b.savingsPerformance },
    { name: "Budget Discipline (Needs vs Wants)", max: 20, item: b.budgetDiscipline },
    { name: "Emergency Fund Buffer", max: 20, item: b.emergencyFundCoverage },
    { name: "Debt & Fixed Obligations Ratio", max: 15, item: b.debtAndObligations },
    { name: "Investment Consistency", max: 10, item: b.investmentConsistency },
    { name: "Cash Flow Stability", max: 10, item: b.cashFlowStability },
  ];

  let fY = breakdownY - 10;
  pdf.rect(40, fY - 140, 515.28, 140, [1, 1, 1], [0.88, 0.9, 0.94]);
  pdf.line(40, fY, 555.28, fY, [0.8, 0.85, 0.9]);

  // Table Header
  pdf.text("Factor", 50, fY + 4, { font: "F2", size: 8.5, color: [0.2, 0.25, 0.35] });
  pdf.text("Score", 240, fY + 4, { font: "F2", size: 8.5, color: [0.2, 0.25, 0.35] });
  pdf.text("Audit Observation / Reason", 290, fY + 4, { font: "F2", size: 8.5, color: [0.2, 0.25, 0.35] });

  let rowY = fY - 18;
  factors.forEach((f, idx) => {
    const sc = f.item?.score || 0;
    const reason = f.item?.reason || "Standard evaluation.";
    const truncatedReason = reason.length > 55 ? reason.substring(0, 52) + "..." : reason;

    if (idx % 2 === 1) {
      pdf.rect(41, rowY - 4, 513.28, 18, [0.97, 0.98, 0.99]);
    }
    pdf.text(f.name, 50, rowY, { font: "F1", size: 8, color: [0.15, 0.2, 0.25] });
    pdf.text(`${sc} / ${f.max}`, 240, rowY, { font: "F2", size: 8, color: sc >= (f.max * 0.7) ? [0.08, 0.6, 0.35] : [0.8, 0.4, 0.1] });
    pdf.text(truncatedReason, 290, rowY, { font: "F1", size: 7.5, color: [0.35, 0.4, 0.45] });
    rowY -= 20;
  });

  // Section 4: Spending Analysis (Top Categories & 50-30-20 Breakdown)
  const spendY = 240;
  pdf.text("MONTHLY EXPENDITURE & 50/30/20 ANALYSIS", 40, spendY + 15, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });

  const sp = report.spendingAnalysis || {};
  pdf.rect(40, spendY - 95, 250, 95, [0.98, 0.99, 1.0], [0.88, 0.92, 0.96]);
  pdf.text("Essential (Needs) vs Lifestyle (Wants)", 50, spendY - 15, { font: "F2", size: 9, color: [0.1, 0.15, 0.25] });
  pdf.text(`Needs (Target: 50%): ${fmt(sp.needSpend)} (${(sp.needPct || 0).toFixed(1)}%)`, 50, spendY - 35, { font: "F1", size: 8.5, color: [0.1, 0.4, 0.6] });
  pdf.text(`Wants (Target: 30%): ${fmt(sp.wantSpend)} (${(sp.wantPct || 0).toFixed(1)}%)`, 50, spendY - 55, { font: "F1", size: 8.5, color: [0.8, 0.4, 0.1] });
  pdf.text(`Savings (Target: 20%): ${fmt(summary.totalSavings)} (${(summary.savingsRate || 0).toFixed(1)}%)`, 50, spendY - 75, { font: "F1", size: 8.5, color: [0.1, 0.6, 0.35] });

  // Top 5 Categories Box
  pdf.rect(305, spendY - 95, 250, 95, [0.98, 0.99, 1.0], [0.88, 0.92, 0.96]);
  pdf.text("Top Spending Categories", 315, spendY - 15, { font: "F2", size: 9, color: [0.1, 0.15, 0.25] });
  const topCats = (sp.topCategories || []).slice(0, 4);
  let catY = spendY - 35;
  if (topCats.length === 0) {
    pdf.text("No category spending recorded.", 315, catY, { font: "F1", size: 8, color: [0.5, 0.5, 0.5] });
  } else {
    topCats.forEach(c => {
      pdf.text(`${c.category}: ${fmt(c.amount)} (${(c.percentage || 0).toFixed(1)}%)`, 315, catY, { font: "F1", size: 8, color: [0.2, 0.25, 0.3] });
      catY -= 16;
    });
  }

  // Footer Page 1
  pdf.line(40, 40, 555.28, 40, [0.85, 0.85, 0.85]);
  pdf.text("FinFlow Personal Financial Operating System | Page 1 of 2", 40, 28, { font: "F1", size: 8, color: [0.5, 0.55, 0.6] });
  pdf.text("Confidential Personal Financial Report", 420, 28, { font: "F1", size: 8, color: [0.5, 0.55, 0.6] });

  // ==========================================
  // PAGE 2: RECOMMENDATIONS & ACTION PLAN
  // ==========================================
  pdf.addPage();

  // Page 2 Header Banner
  pdf.rect(0, 785, 595.28, 56.89, [0.08, 0.11, 0.17]);
  pdf.rect(0, 781, 595.28, 4, [0.93, 0.73, 0.28]);
  pdf.text("FINFLOW — ACTION PLAN & RECOMMENDATIONS", 40, 810, { font: "F2", size: 14, color: [1, 1, 1] });
  pdf.text(`Reporting Period: ${reportLabel} | Subject: Strategic Action Plan`, 40, 794, { font: "F1", size: 9, color: [0.75, 0.8, 0.9] });

  // Section 5: Personalized Recommendations
  let recY = 750;
  pdf.text("EXPLAINABLE PERSONALIZED RECOMMENDATIONS", 40, recY, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });
  recY -= 20;

  const recs = report.recommendations || [];
  if (recs.length === 0) {
    pdf.rect(40, recY - 40, 515.28, 40, [0.98, 0.98, 0.98], [0.88, 0.9, 0.94]);
    pdf.text("No critical warnings. Maintain existing financial discipline.", 55, recY - 24, { font: "F1", size: 9, color: [0.3, 0.35, 0.4] });
    recY -= 55;
  } else {
    recs.slice(0, 4).forEach(rec => {
      const pColor = rec.priority === "HIGH" ? [0.85, 0.2, 0.2] : rec.priority === "MEDIUM" ? [0.9, 0.55, 0.05] : [0.1, 0.6, 0.35];
      pdf.rect(40, recY - 65, 515.28, 65, [0.99, 0.99, 1.0], [0.88, 0.9, 0.94]);
      // Priority badge
      pdf.rect(50, recY - 18, 55, 14, pColor);
      pdf.text(rec.priority || "MEDIUM", 56, recY - 8, { font: "F2", size: 7.5, color: [1, 1, 1] });
      // Title
      pdf.text(rec.title || "Recommendation", 115, recY - 7, { font: "F2", size: 9.5, color: [0.1, 0.15, 0.25] });
      // Reason & Data
      const reasonTxt = rec.reason ? (rec.reason.length > 95 ? rec.reason.substring(0, 92) + "..." : rec.reason) : "";
      pdf.text(reasonTxt, 50, recY - 28, { font: "F1", size: 8, color: [0.3, 0.35, 0.4] });
      // Action & Impact
      const actTxt = rec.suggestedAction ? (rec.suggestedAction.length > 95 ? rec.suggestedAction.substring(0, 92) + "..." : rec.suggestedAction) : "";
      pdf.text(`Action: ${actTxt}`, 50, recY - 42, { font: "F2", size: 8, color: [0.15, 0.3, 0.45] });
      if (rec.estimatedImpact) {
        const impactTxt = rec.estimatedImpact.length > 90 ? rec.estimatedImpact.substring(0, 87) + "..." : rec.estimatedImpact;
        pdf.text(`Estimated Financial Impact: ${impactTxt}`, 50, recY - 54, { font: "F1", size: 7.5, color: [0.08, 0.55, 0.3] });
      }
      recY -= 75;
    });
  }

  // Section 6: Next Month Financial Roadmap / Action Plan
  pdf.text("NEXT MONTH'S STEP-BY-STEP ROADMAP", 40, recY - 5, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });
  recY -= 25;

  const planItems = report.nextMonthActionPlan || [
    "Verify and auto-debit all upcoming fixed bills within the first 5 days of cycle.",
    "Allocate minimum 20% of net monthly income into liquid buffer or designated savings goal.",
    "Keep daily discretionary spend strictly within the Safe-to-Spend limit.",
    "Review peer debts and split expense settlements to recover liquid capital.",
  ];

  pdf.rect(40, recY - 85, 515.28, 85, [0.97, 0.98, 0.99], [0.88, 0.9, 0.94]);
  let planY = recY - 18;
  planItems.slice(0, 4).forEach((item, idx) => {
    pdf.text(`${idx + 1}.`, 52, planY, { font: "F2", size: 8.5, color: [0.93, 0.73, 0.28] });
    pdf.text(item, 68, planY, { font: "F1", size: 8, color: [0.2, 0.25, 0.3] });
    planY -= 18;
  });
  recY -= 105;

  // Section 7: Investment & Savings Health
  const inv = report.investmentAnalysis || {};
  const ff = report.financialFoundation || {};
  pdf.text("SAVINGS TARGET & FINANCIAL FOUNDATION STATUS", 40, recY, { font: "F2", size: 11, color: [0.1, 0.15, 0.25] });
  recY -= 18;

  pdf.rect(40, recY - 50, 515.28, 50, [1, 1, 1], [0.88, 0.9, 0.94]);
  pdf.text(`Monthly Savings Target: ${fmt(inv.savingsTarget || 0)}`, 55, recY - 18, { font: "F1", size: 8.5, color: [0.3, 0.35, 0.4] });
  pdf.text(`Actual Saved: ${fmt(inv.actualSavings || 0)} (${(inv.targetCompletionPct || 0).toFixed(0)}% Achieved)`, 55, recY - 34, { font: "F2", size: 8.5, color: [0.1, 0.5, 0.3] });
  pdf.text(`Foundation Score: ${ff.score ?? 0}/100 (Self-Reported)`, 270, recY - 18, { font: "F2", size: 8.5, color: [0.1, 0.4, 0.6] });
  pdf.text(`Emergency Fund: ${ff.emergencyFund || "Unanswered"} | Health Insurance: ${ff.healthInsurance || "Unanswered"}`, 270, recY - 34, { font: "F1", size: 7.5, color: [0.4, 0.45, 0.5] });

  // Section 8: Legal Disclaimers
  const disclaimerY = 85;
  pdf.rect(40, disclaimerY - 30, 515.28, 38, [0.98, 0.98, 0.98], [0.9, 0.9, 0.9]);
  pdf.text("DISCLAIMER & REGULATORY DISCLOSURE:", 50, disclaimerY, { font: "F2", size: 7.5, color: [0.4, 0.4, 0.45] });
  pdf.text("This report is an automated financial analysis generated by FinFlow based on user-entered ledger records.", 50, disclaimerY - 10, { font: "F1", size: 7, color: [0.45, 0.45, 0.5] });
  pdf.text("It is intended solely for personal budgeting and wealth planning purposes and is NOT a replacement for a certified", 50, disclaimerY - 18, { font: "F1", size: 7, color: [0.45, 0.45, 0.5] });
  pdf.text("Chartered Accountant (CA), registered financial advisor, or legal tax advice. FinFlow holds no liability for decisions made.", 50, disclaimerY - 26, { font: "F1", size: 7, color: [0.45, 0.45, 0.5] });

  // Footer Page 2
  pdf.line(40, 40, 555.28, 40, [0.85, 0.85, 0.85]);
  pdf.text("FinFlow Personal Financial Operating System | Page 2 of 2", 40, 28, { font: "F1", size: 8, color: [0.5, 0.55, 0.6] });
  pdf.text("End of Financial Review", 450, 28, { font: "F1", size: 8, color: [0.5, 0.55, 0.6] });

  return pdf.build();
}

module.exports = {
  SimplePDFBuilder,
  generateMonthlyReportPDF,
};
