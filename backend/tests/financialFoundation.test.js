const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { calculateFoundationScore } = require("../services/foundationService");
const { FINANCIAL_RULES, RULE_CATEGORIES } = require("../utils/financialRulesData");

describe("Financial Foundation & Rulebook Unit Tests", () => {
  describe("Mathematical Purity of Foundation Score", () => {
    it("should return 0 when no milestones are completed", () => {
      const res = calculateFoundationScore({
        emergencyFund: false,
        healthInsurance: false,
      });
      assert.equal(res.score, 0);
      assert.equal(res.classification, "Starting Your Financial Journey");
      assert.equal(res.breakdown.emergencyFund.points, 0);
      assert.equal(res.breakdown.healthInsurance.points, 0);
    });

    it("should return 50 when only emergency fund is completed", () => {
      const res = calculateFoundationScore({
        emergencyFund: true,
        healthInsurance: false,
      });
      assert.equal(res.score, 50);
      assert.equal(res.classification, "Building Your Financial Foundation");
      assert.equal(res.breakdown.emergencyFund.points, 50);
      assert.equal(res.breakdown.healthInsurance.points, 0);
    });

    it("should return 50 when only health insurance is completed", () => {
      const res = calculateFoundationScore({
        emergencyFund: false,
        healthInsurance: true,
      });
      assert.equal(res.score, 50);
      assert.equal(res.classification, "Building Your Financial Foundation");
      assert.equal(res.breakdown.emergencyFund.points, 0);
      assert.equal(res.breakdown.healthInsurance.points, 50);
    });

    it("should return 100 when both milestones are completed", () => {
      const res = calculateFoundationScore({
        emergencyFund: true,
        healthInsurance: true,
      });
      assert.equal(res.score, 100);
      assert.equal(res.classification, "Financial Foundation Complete");
      assert.equal(res.breakdown.emergencyFund.points, 50);
      assert.equal(res.breakdown.healthInsurance.points, 50);
    });

    it("should strictly cap at 100 points maximum and never exceed it", () => {
      // Simulating extraneous inputs or multiple calls
      const res = calculateFoundationScore({
        emergencyFund: true,
        healthInsurance: true,
        someOtherRule: true,
        arbitraryPoints: 1000,
      });
      assert.equal(res.score, 100);
      assert.equal(res.score <= 100, true);
    });

    it("should remove 50 points when unchecking a previously checked milestone", () => {
      const checked = calculateFoundationScore({
        emergencyFund: true,
        healthInsurance: true,
      });
      assert.equal(checked.score, 100);

      const unchecked = calculateFoundationScore({
        emergencyFund: false, // user unchecked
        healthInsurance: true,
      });
      assert.equal(unchecked.score, 50);
      assert.equal(unchecked.breakdown.emergencyFund.points, 0);
    });

    it("should handle nested object milestone inputs safely", () => {
      const res = calculateFoundationScore({
        emergencyFund: { completed: true },
        healthInsurance: { completed: false },
      });
      assert.equal(res.score, 50);
      assert.equal(res.breakdown.emergencyFund.completed, true);
      assert.equal(res.breakdown.healthInsurance.completed, false);
    });
  });

  describe("28 Financial Rules Integrity", () => {
    it("should contain exactly 28 rules", () => {
      assert.equal(FINANCIAL_RULES.length, 28);
    });

    it("should have exactly 5 distinct rule categories", () => {
      assert.equal(RULE_CATEGORIES.length, 5);
      const uniqueCatsInRules = [...new Set(FINANCIAL_RULES.map((r) => r.category))];
      assert.equal(uniqueCatsInRules.length, 5);
      uniqueCatsInRules.forEach((cat) => {
        assert.ok(RULE_CATEGORIES.includes(cat), `Category '${cat}' should be in RULE_CATEGORIES`);
      });
    });

    it("should have sequential rule numbers from 01 to 28", () => {
      FINANCIAL_RULES.forEach((rule, idx) => {
        const expectedNum = String(idx + 1).padStart(2, "0");
        assert.equal(rule.number, expectedNum, `Rule at index ${idx} should have number ${expectedNum}`);
      });
    });

    it("should contain mandatory fields for all 28 rules", () => {
      FINANCIAL_RULES.forEach((rule) => {
        assert.ok(rule.id, `Rule ${rule.number} missing id`);
        assert.ok(rule.title, `Rule ${rule.number} missing title`);
        assert.ok(rule.tagline, `Rule ${rule.number} missing tagline`);
        assert.ok(rule.explanation, `Rule ${rule.number} missing explanation`);
        assert.ok(rule.whyItMatters, `Rule ${rule.number} missing whyItMatters`);
        assert.ok(rule.formula, `Rule ${rule.number} missing formula`);
        assert.ok(rule.practicalExample, `Rule ${rule.number} missing practicalExample`);
        assert.ok(rule.assumptions, `Rule ${rule.number} missing assumptions`);
      });
    });

    it("should define 12 interactive calculator types across rules", () => {
      const calculatorTypes = FINANCIAL_RULES
        .map((r) => r.calculatorType)
        .filter(Boolean);
      
      const expectedCalculators = [
        "EMERGENCY_FUND",
        "TERM_LIFE",
        "BUDGET_50_30_20",
        "FUN_MONEY",
        "COMPOUND_INTEREST",
        "RULE_OF_72",
        "INFLATION_REAL_RETURN",
        "CAR_PURCHASE_20_4_10",
        "EMI_RATIO",
        "RETIREMENT_25X",
        "WITHDRAWAL_4_PCT",
        "NET_WORTH",
      ];

      expectedCalculators.forEach((calcType) => {
        assert.ok(
          calculatorTypes.includes(calcType),
          `Expected calculatorType '${calcType}' to be present in rules`
        );
      });
    });
  });
});
