const mongoose = require("mongoose");
const { Schema } = mongoose;

// ── Financial Math Helpers ──────────────────────────────────────────────────
const toDecimal128 = (val) => {
  if (val === null || val === undefined) return mongoose.Types.Decimal128.fromString("0.00");
  if (val && val._bsontype === "Decimal128") return val;
  const num = Number(val);
  if (isNaN(num)) return mongoose.Types.Decimal128.fromString("0.00");
  return mongoose.Types.Decimal128.fromString(num.toFixed(2));
};

const decimalToNumber = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val._bsontype === "Decimal128" || typeof val.toString === "function") {
    return parseFloat(val.toString()) || 0;
  }
  return 0;
};

const transformDecimal128 = (doc, ret) => {
  for (const key of Object.keys(ret)) {
    if (ret[key] && ret[key]._bsontype === "Decimal128") {
      ret[key] = parseFloat(ret[key].toString());
    } else if (Array.isArray(ret[key])) {
      ret[key] = ret[key].map(item => {
        if (item && typeof item === "object") {
          for (const subKey of Object.keys(item)) {
            if (item[subKey] && item[subKey]._bsontype === "Decimal128") {
              item[subKey] = parseFloat(item[subKey].toString());
            }
          }
        }
        return item;
      });
    }
  }
  return ret;
};

// ── Expense / Transaction ─────────────────────────────────────────────────────
const expenseSchema = new Schema({
  userId:            { type: String, required: true, index: true },
  date:              { type: Date,   required: true },
  category: {
    type: String,
    enum: ["Food","Travel","Utilities","Shopping","Health","Dining","Rent","Education","OTT","Savings","Other"],
    required: true,
  },
  label:             { type: String, required: true, trim: true },
  amount:            { type: Number, required: true, min: 0 },
  type:              { type: String, enum: ["need","want"], required: true },
  notes:             { type: String, default: "" },
  obligationId:      { type: Schema.Types.ObjectId, ref: "RecurringObligation" },
  accountId:         { type: Schema.Types.ObjectId, ref: "Account" },
  splitExpenseId:    { type: Schema.Types.ObjectId, ref: "SplitExpense" },
  source:            { type: String, enum: ["MANUAL", "SMS_PASTE", "IMPORT"], default: "MANUAL" },
  externalReference: { type: String, trim: true },
  merchant:          { type: String, trim: true },
  paymentMethod:     { type: String, trim: true },
}, { timestamps: true });

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, accountId: 1 });
expenseSchema.index({ userId: 1, obligationId: 1 });
expenseSchema.index({ userId: 1, externalReference: 1 });
expenseSchema.index({ userId: 1, splitExpenseId: 1 });

// ── Account ───────────────────────────────────────────────────────────────────
const accountSchema = new Schema({
  userId:         { type: String, required: true, index: true },
  name:           { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["CHECKING", "SAVINGS", "WALLET", "CASH"],
    required: true,
  },
  currentBalance: {
    type: Schema.Types.Decimal128,
    required: true,
    default: () => mongoose.Types.Decimal128.fromString("0.00"),
  },
  currency:       { type: String, default: "INR" },
  isLiquid:       { type: Boolean, default: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

accountSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ userId: 1, name: 1 }, { unique: true });
accountSchema.set("toJSON", { virtuals: true, transform: transformDecimal128 });

// ── RecurringObligation ───────────────────────────────────────────────────────
const recurringObligationSchema = new Schema({
  userId:                { type: String, required: true, index: true },
  accountId:             { type: Schema.Types.ObjectId, ref: "Account" },
  title:                 { type: String, required: true, trim: true },
  amount:                { type: Schema.Types.Decimal128, required: true },
  dueDay:                { type: Number, required: true, min: 1, max: 31 },
  category:              { type: String, required: true, default: "Utilities" },
  frequency: {
    type: String,
    enum: ["MONTHLY", "WEEKLY", "YEARLY"],
    default: "MONTHLY",
  },
  isActive:              { type: Boolean, default: true },
  nextDueDate:           { type: Date },
  lastPaidDate:          { type: Date },
  lastPaidTransactionId: { type: Schema.Types.ObjectId, ref: "Expense" },
}, { timestamps: true });

recurringObligationSchema.index({ userId: 1, isActive: 1 });
recurringObligationSchema.index({ userId: 1, nextDueDate: 1 });
recurringObligationSchema.set("toJSON", { virtuals: true, transform: transformDecimal128 });

// ── BudgetCycle ───────────────────────────────────────────────────────────────
const budgetCycleSchema = new Schema({
  userId:             { type: String, required: true, unique: true, index: true },
  cycleStartDay:      { type: Number, default: 1, min: 1, max: 31 },
  monthlySavingsGoal: {
    type: Schema.Types.Decimal128,
    default: () => mongoose.Types.Decimal128.fromString("0.00"),
  },
  minSafetyBuffer:    {
    type: Schema.Types.Decimal128,
    default: () => mongoose.Types.Decimal128.fromString("0.00"),
  },
  currency:           { type: String, default: "INR" },
}, { timestamps: true });

budgetCycleSchema.set("toJSON", { virtuals: true, transform: transformDecimal128 });

// ── SplitExpense (Peer Debt) ─────────────────────────────────────────────────
const splitExpenseSchema = new Schema({
  userId:                { type: String, required: true, index: true },
  originalTransactionId: { type: Schema.Types.ObjectId, ref: "Expense" },
  borrowerName:          { type: String, required: true, trim: true },
  amount:                { type: Schema.Types.Decimal128, required: true },
  settledAmount: {
    type: Schema.Types.Decimal128,
    default: () => mongoose.Types.Decimal128.fromString("0.00"),
  },
  status: {
    type: String,
    enum: ["PENDING", "PARTIAL", "SETTLED"],
    default: "PENDING",
  },
  dueDate:               { type: Date },
  notes:                 { type: String, default: "" },
  settlements: [
    {
      amount:    { type: Schema.Types.Decimal128, required: true },
      settledAt: { type: Date, default: Date.now },
      accountId: { type: Schema.Types.ObjectId, ref: "Account" },
      notes:     { type: String, default: "" },
    }
  ],
}, { timestamps: true });

splitExpenseSchema.index({ userId: 1, status: 1 });
splitExpenseSchema.index({ userId: 1, borrowerName: 1 });
splitExpenseSchema.set("toJSON", { virtuals: true, transform: transformDecimal128 });

// ── MerchantMapping (Auto Categorization Learning) ───────────────────────────
const merchantMappingSchema = new Schema({
  userId:   { type: String, required: true, index: true },
  merchant: { type: String, required: true, trim: true, lowercase: true },
  category: { type: String, required: true },
}, { timestamps: true });

merchantMappingSchema.index({ userId: 1, merchant: 1 }, { unique: true });

// ── Stock Holding ─────────────────────────────────────────────────────────────
const stockSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  ticker:    { type: String, required: true, uppercase: true, trim: true },
  companyName: { type: String, default: "" },
  qty:       { type: Number, required: true, min: 0 },
  avgPrice:  { type: Number, required: true, min: 0 },
  cmp:       { type: Number, default: 0, min: 0 },
  sector:    { type: String, default: "Others" },
  exchange:  { type: String, enum: ["NSE","BSE"], default: "NSE" },
  buyDate:   { type: Date },
}, { timestamps: true });

stockSchema.virtual("currentValue").get(function () { return this.qty * this.cmp; });
stockSchema.virtual("investedValue").get(function () { return this.qty * this.avgPrice; });
stockSchema.virtual("pl").get(function () { return this.qty * (this.cmp - this.avgPrice); });
stockSchema.virtual("plPct").get(function () {
  const inv = this.qty * this.avgPrice;
  return inv ? ((this.pl / inv) * 100).toFixed(2) : 0;
});
stockSchema.set("toJSON", { virtuals: true });

// ── Mutual Fund ───────────────────────────────────────────────────────────────
const mutualFundSchema = new Schema({
  userId:     { type: String, required: true, index: true },
  name:       { type: String, required: true, trim: true },
  amcName:    { type: String, default: "" },
  type:       { type: String, enum: ["Equity","Debt","Hybrid","Index","ELSS"], required: true },
  invested:   { type: Number, required: true, min: 0 },
  units:      { type: Number, default: 0 },
  navAtBuy:   { type: Number, default: 0 },
  currentNav: { type: Number, default: 0 },
  startDate:  { type: Date },
  sipAmount:  { type: Number, default: 0 },
}, { timestamps: true });

mutualFundSchema.virtual("currentValue").get(function () { return this.units * this.currentNav; });
mutualFundSchema.virtual("pl").get(function () { return this.units * this.currentNav - this.invested; });
mutualFundSchema.virtual("plPct").get(function () {
  return this.invested ? (((this.units * this.currentNav - this.invested) / this.invested) * 100).toFixed(2) : 0;
});
mutualFundSchema.set("toJSON", { virtuals: true });

// ── Fixed Deposit ─────────────────────────────────────────────────────────────
const fixedDepositSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  bank:      { type: String, required: true, trim: true },
  principal: { type: Number, required: true, min: 0 },
  rate:      { type: Number, required: true },
  tenure:    { type: Number, required: true },
  startDate: { type: Date,   required: true },
  isRenewable: { type: Boolean, default: false },
  notes:     { type: String, default: "" },
}, { timestamps: true });

fixedDepositSchema.virtual("maturityDate").get(function () {
  const d = new Date(this.startDate);
  d.setMonth(d.getMonth() + this.tenure);
  return d;
});
fixedDepositSchema.virtual("maturityAmount").get(function () {
  const n = this.tenure / 12;
  const compoundsPerYear = 4;
  return Math.round(
    this.principal *
      Math.pow(1 + this.rate / (100 * compoundsPerYear), compoundsPerYear * n),
  );
});
fixedDepositSchema.virtual("interestEarned").get(function () {
  return this.maturityAmount - this.principal;
});
fixedDepositSchema.set("toJSON", { virtuals: true });

// ── User ───────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  userId:   { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String }
}, { timestamps: true });

// ── Income ────────────────────────────────────────────────────────────────────
const incomeSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  date:      { type: Date,   required: true },
  source:    { type: String, required: true, trim: true },
  amount:    { type: Number, required: true, min: 0 },
  accountId: { type: Schema.Types.ObjectId, ref: "Account" },
  notes:     { type: String, default: "" },
}, { timestamps: true });

incomeSchema.index({ userId: 1, date: -1 });

// ── Liquid Cash ───────────────────────────────────────────────────────────────
const liquidSchema = new Schema({
  userId:    { type: String, required: true, unique: true },
  balance:   { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// ── Model Registration ────────────────────────────────────────────────────────
const getOrCreateModel = (name, schema) => {
  return mongoose.models[name] || mongoose.model(name, schema);
};

const Expense = getOrCreateModel("Expense", expenseSchema);

module.exports = {
  User:                getOrCreateModel("User", userSchema),
  Income:              getOrCreateModel("Income", incomeSchema),
  Expense:             Expense,
  Transaction:         Expense,
  Stock:               getOrCreateModel("Stock", stockSchema),
  MutualFund:          getOrCreateModel("MutualFund", mutualFundSchema),
  FixedDeposit:        getOrCreateModel("FixedDeposit", fixedDepositSchema),
  Liquid:              getOrCreateModel("Liquid", liquidSchema),
  Account:             getOrCreateModel("Account", accountSchema),
  RecurringObligation: getOrCreateModel("RecurringObligation", recurringObligationSchema),
  BudgetCycle:         getOrCreateModel("BudgetCycle", budgetCycleSchema),
  SplitExpense:        getOrCreateModel("SplitExpense", splitExpenseSchema),
  MerchantMapping:     getOrCreateModel("MerchantMapping", merchantMappingSchema),
  toDecimal128,
  decimalToNumber,
};
