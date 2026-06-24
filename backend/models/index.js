const mongoose = require("mongoose");
const { Schema } = mongoose;
 
// ── Expense ───────────────────────────────────────────────────────────────────
const expenseSchema = new Schema({
  userId:   { type: String, required: true, index: true },
  date:     { type: Date,   required: true },
  category: {
    type: String,
    enum: ["Food","Travel","Utilities","Shopping","Health","Dining","Rent","Education","OTT","Savings","Other"],
    required: true,
  },
  label:    { type: String, required: true, trim: true },
  amount:   { type: Number, required: true, min: 0 },
  type:     { type: String, enum: ["need","want"], required: true },
  notes:    { type: String, default: "" },
}, { timestamps: true });
 
expenseSchema.index({ userId: 1, date: -1 });
 
// ── Stock Holding ─────────────────────────────────────────────────────────────
const stockSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  ticker:    { type: String, required: true, uppercase: true, trim: true },
  companyName: { type: String, default: "" },
  qty:       { type: Number, required: true, min: 0 },
  avgPrice:  { type: Number, required: true, min: 0 },
  cmp:       { type: Number, default: 0, min: 0 },  // Current Market Price — updated by cron
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
  sipAmount:  { type: Number, default: 0 },   // 0 = lump sum
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
  rate:      { type: Number, required: true },      // annual % e.g. 7.5
  tenure:    { type: Number, required: true },      // months
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
 
// ── Liquid Cash ───────────────────────────────────────────────────────────────
const liquidSchema = new Schema({
  userId:    { type: String, required: true, unique: true },
  balance:   { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });
 
// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  Expense:       mongoose.model("Expense",       expenseSchema),
  Stock:         mongoose.model("Stock",         stockSchema),
  MutualFund:    mongoose.model("MutualFund",    mutualFundSchema),
  FixedDeposit:  mongoose.model("FixedDeposit",  fixedDepositSchema),
  Liquid:        mongoose.model("Liquid",        liquidSchema),
};
