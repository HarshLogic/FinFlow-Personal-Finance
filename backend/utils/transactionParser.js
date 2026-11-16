/**
 * Indian Bank SMS & UPI Notification Parser
 * Accurately extracts Amount, Merchant, Date, Payment Method, Reference, and Transaction Type.
 */

// Default Merchant -> FinFlow Category Mappings
const DEFAULT_MERCHANT_CATEGORIES = {
  swiggy: "Food",
  zomato: "Food",
  blinkit: "Shopping",
  zepto: "Shopping",
  instamart: "Shopping",
  bigbasket: "Shopping",
  dmart: "Shopping",
  amazon: "Shopping",
  flipkart: "Shopping",
  myntra: "Shopping",
  nykaa: "Shopping",
  uber: "Travel",
  ola: "Travel",
  rapido: "Travel",
  irctc: "Travel",
  makemytrip: "Travel",
  redbus: "Travel",
  indigo: "Travel",
  netflix: "OTT",
  spotify: "OTT",
  prime: "OTT",
  hotstar: "OTT",
  youtube: "OTT",
  apple: "OTT",
  airtel: "Utilities",
  jio: "Utilities",
  bescom: "Utilities",
  tneb: "Utilities",
  mseb: "Utilities",
  electricity: "Utilities",
  water: "Utilities",
  gas: "Utilities",
  broadband: "Utilities",
  wifi: "Utilities",
  apollo: "Health",
  pharmeasy: "Health",
  "1mg": "Health",
  cultfit: "Health",
  starbucks: "Dining",
  mcdonalds: "Dining",
  kfc: "Dining",
  dominos: "Dining",
  pizza: "Dining",
  restaurant: "Dining",
  cafe: "Dining",
  rent: "Rent",
  landlord: "Rent",
  udemy: "Education",
  coursera: "Education",
};

/**
 * Normalizes extracted merchant name.
 */
function cleanMerchant(merchant) {
  if (!merchant) return "";
  let clean = merchant.trim();

  // Strip common leading words
  clean = clean.replace(/^(to|at|towards|in favor of|vpa|paid to|info:|upi\/|transfer to)\s+/i, "");

  // Strip VPA handle suffixes like @okhdfcbank, @icici, @paytm, @ybl, etc.
  clean = clean.replace(/@[a-zA-Z0-9.\-_]+$/i, "");

  // Strip trailing punctuation and common trailing words like "on", "dated", "ref", "avl bal"
  clean = clean.replace(/[\s,.-]+(on|dated|ref|avl|bal|balance|thru|via|using).*$/i, "");
  clean = clean.replace(/[.,;:]+$/, "");

  // Normalize multi-spaces
  clean = clean.replace(/\s+/g, " ").trim();

  // Capitalize words
  if (clean.length > 0) {
    clean = clean
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return clean;
}

/**
 * Guesses Category from Merchant name.
 */
function guessCategory(merchantName, userMappings = {}) {
  if (!merchantName) return "Other";
  const lower = merchantName.toLowerCase().trim();

  // 1. Check user-defined overrides first
  if (userMappings[lower]) {
    return userMappings[lower];
  }

  // 2. Exact match in defaults
  if (DEFAULT_MERCHANT_CATEGORIES[lower]) {
    return DEFAULT_MERCHANT_CATEGORIES[lower];
  }

  // 3. Substring match
  for (const [key, category] of Object.entries(DEFAULT_MERCHANT_CATEGORIES)) {
    if (lower.includes(key)) {
      return category;
    }
  }

  return "Other";
}

/**
 * Parses raw SMS text.
 */
function parseTransactionSMS(rawText, userMappings = {}) {
  if (!rawText || typeof rawText !== "string") {
    return {
      success: false,
      error: "No SMS text provided",
      data: null,
    };
  }

  const text = rawText.replace(/\r?\n/g, " ").trim();
  const warnings = [];

  // ── 1. Amount Extraction ───────────────────────────────────────────────────
  // Matches: INR 450, Rs. 450.00, Rs 1,450.50, ₹450, INR. 500
  const amountRegexes = [
    /(?:rs\.?|inr\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited|credited|spent|withdrawn|transferred|paid)\s+(?:(?:for|by|amounting to|an amount of)\s+)?(?:rs\.?|inr\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr\.?|₹)/i,
  ];

  let amount = null;
  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, "");
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  if (amount === null) {
    warnings.push("Could not reliably detect amount.");
  }

  // ── 2. Transaction Type (Debit / Credit) ────────────────────────────────────
  let type = "EXPENSE"; // default
  const debitTerms = /\b(debited|paid|spent|deducted|withdrawn|purchase|charged|sent)\b/i;
  const creditTerms = /\b(credited|received|deposited|refunded|cashback|added)\b/i;

  if (creditTerms.test(text) && !debitTerms.test(text)) {
    type = "INCOME";
  } else if (debitTerms.test(text)) {
    type = "EXPENSE";
  }

  // ── 3. Payment Method ──────────────────────────────────────────────────────
  let paymentMethod = "OTHER";
  if (/\bupi\b|vpa|@\w+/i.test(text)) {
    paymentMethod = "UPI";
  } else if (/\bcredit card\b|\bcc\b/i.test(text)) {
    paymentMethod = "CREDIT_CARD";
  } else if (/\bdebit card\b|\bdc\b|card ending/i.test(text)) {
    paymentMethod = "DEBIT_CARD";
  } else if (/\bneft\b/i.test(text)) {
    paymentMethod = "NEFT";
  } else if (/\bimps\b/i.test(text)) {
    paymentMethod = "IMPS";
  } else if (/\bnet\s?banking\b/i.test(text)) {
    paymentMethod = "NETBANKING";
  } else if (/\bwallet\b|paytm|phonepe/i.test(text)) {
    paymentMethod = "WALLET";
  }

  // ── 4. Merchant Extraction ─────────────────────────────────────────────────
  let merchant = "";
  const merchantRegexes = [
    // to Swiggy on 15-11-2026 / to Rahul via UPI
    /(?:to|at|in favor of|towards|info:)\s+([A-Za-z0-9\s&._'-]+?)(?:\s+(?:on|via|ref|dated|using|thru|avl|bal|\d{1,2}[-/.]\d{1,2})|$)/i,
    // VPA swiggy@icici / VPA rahul@okhdfcbank
    /(?:vpa|upi)\s+([A-Za-z0-9._-]+)(?:@[a-zA-Z0-9]+)?/i,
    // Info: SWIGGY BANGALORE
    /(?:info[:\s]+)([A-Za-z0-9\s._'-]+?)(?:\s+(?:on|ref|dated)|$)/i,
    // Paid Rs 500 for Swiggy
    /(?:for|spent at)\s+([A-Za-z0-9\s&._'-]+?)(?:\s+(?:on|via|ref)|$)/i,
  ];

  for (const regex of merchantRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = cleanMerchant(match[1]);
      if (candidate && candidate.length > 1 && !/^(account|your|the|rs|inr)$/i.test(candidate)) {
        merchant = candidate;
        break;
      }
    }
  }

  if (!merchant) {
    // If not extracted, look for well-known merchants in text
    for (const key of Object.keys(DEFAULT_MERCHANT_CATEGORIES)) {
      const r = new RegExp(`\\b${key}\\b`, "i");
      if (r.test(text)) {
        merchant = key.charAt(0).toUpperCase() + key.slice(1);
        break;
      }
    }
  }

  if (!merchant) {
    merchant = type === "EXPENSE" ? "Expense" : "Income";
    warnings.push("Merchant name could not be automatically identified.");
  }

  // ── 5. Date Extraction ─────────────────────────────────────────────────────
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  let date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const dateRegexes = [
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/, // 15-11-2026 or 15/11/26
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i,
  ];

  for (const regex of dateRegexes) {
    const match = text.match(regex);
    if (match) {
      if (match[3] && !isNaN(parseInt(match[1]))) {
        let d = parseInt(match[1]);
        let m = match[2];
        let y = parseInt(match[3]);
        if (y < 100) y += 2000;

        let monthNum = NaN;
        if (!isNaN(parseInt(m))) {
          monthNum = parseInt(m) - 1;
        } else {
          const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
          monthNum = months.indexOf(m.toLowerCase().slice(0, 3));
        }

        if (monthNum >= 0 && monthNum <= 11 && d >= 1 && d <= 31) {
          date = `${y}-${pad(monthNum + 1)}-${pad(d)}`;
          break;
        }
      }
    }
  }

  // ── 6. Reference Number Extraction ─────────────────────────────────────────
  let externalReference = "";
  const refRegexes = [
    /(?:ref(?:erence)?(?:\s*no\.?)?|txn(?:id)?|utr(?:\s*no\.?)?|rrn)[:\s]*([A-Za-z0-9]+)/i,
    /(?:upi\s*ref(?:erence)?(?:\s*no)?[:\s]*)([A-Za-z0-9]+)/i,
  ];

  for (const regex of refRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      externalReference = match[1].trim();
      break;
    }
  }

  // ── 7. Category ────────────────────────────────────────────────────────────
  const category = guessCategory(merchant, userMappings);

  // ── 8. Confidence ──────────────────────────────────────────────────────────
  let confidence = "HIGH";
  if (!amount || merchant === "Expense" || merchant === "Income") {
    confidence = "LOW";
  } else if (warnings.length > 0 || !externalReference) {
    confidence = "MEDIUM";
  }

  return {
    success: true,
    data: {
      amount: amount !== null ? amount : 0,
      merchant,
      type,
      paymentMethod,
      category,
      date,
      externalReference,
      confidence,
      warnings,
      rawText,
    },
  };
}

module.exports = {
  parseTransactionSMS,
  cleanMerchant,
  guessCategory,
  DEFAULT_MERCHANT_CATEGORIES,
};
