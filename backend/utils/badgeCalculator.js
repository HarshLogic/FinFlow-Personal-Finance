/**
 * Badge Calculator - Defines achievement badges and calculates earned badges
 */

// ── Badge Definitions ──────────────────────────────────────────────────────
const BADGE_DEFINITIONS = {
  // Savings Milestones
  first_savings: {
    badgeId: "first_savings",
    title: "First Step",
    description: "Started tracking savings",
    icon: "🌱",
    category: "savings",
    trigger: (data) => data.totalWealth > 0,
  },
  savings_10k: {
    badgeId: "savings_10k",
    title: "Growing Fund",
    description: "Saved ₹10,000",
    icon: "📈",
    category: "savings",
    trigger: (data) => data.totalWealth >= 10000,
  },
  savings_50k: {
    badgeId: "savings_50k",
    title: "Major Milestone",
    description: "Saved ₹50,000",
    icon: "🎯",
    category: "savings",
    trigger: (data) => data.totalWealth >= 50000,
  },
  savings_100k: {
    badgeId: "savings_100k",
    title: "Century Club",
    description: "Saved ₹1,00,000",
    icon: "🏆",
    category: "savings",
    trigger: (data) => data.totalWealth >= 100000,
  },
  savings_500k: {
    badgeId: "savings_500k",
    title: "Half Million",
    description: "Saved ₹5,00,000",
    icon: "💎",
    category: "savings",
    trigger: (data) => data.totalWealth >= 500000,
  },
  savings_1m: {
    badgeId: "savings_1m",
    title: "Millionaire",
    description: "Accumulated ₹1,000,000",
    icon: "👑",
    category: "savings",
    trigger: (data) => data.totalWealth >= 1000000,
  },

  // Spending Control
  monthly_budget_master: {
    badgeId: "monthly_budget_master",
    title: "Budget Master",
    description: "Kept spending under ₹30,000 this month",
    icon: "💰",
    category: "spending",
    trigger: (data) => data.monthlyExpenses <= 30000,
  },
  need_want_balanced: {
    badgeId: "need_want_balanced",
    title: "Balanced Spender",
    description: "Followed 50-30-20 rule this month",
    icon: "⚖️",
    category: "spending",
    trigger: (data) => {
      const { needSpend, wantSpend, totalExpenses } = data;
      if (totalExpenses === 0) return false;
      const needPct = (needSpend / totalExpenses) * 100;
      const wantPct = (wantSpend / totalExpenses) * 100;
      return needPct >= 45 && needPct <= 55 && wantPct >= 25 && wantPct <= 35;
    },
  },
  low_spender: {
    badgeId: "low_spender",
    title: "Frugal Living",
    description: "Spent less than ₹10,000 this month",
    icon: "💸",
    category: "spending",
    trigger: (data) => data.monthlyExpenses <= 10000,
  },

  // Investment Achievements
  first_investment: {
    badgeId: "first_investment",
    title: "Investor Rookie",
    description: "Made your first investment",
    icon: "📊",
    category: "investing",
    trigger: (data) => data.investmentCount > 0,
  },
  diversified_portfolio: {
    badgeId: "diversified_portfolio",
    title: "Diversified Investor",
    description: "Invested in 3+ asset classes",
    icon: "🎲",
    category: "investing",
    trigger: (data) => data.assetClassCount >= 3,
  },
  profit_positive: {
    badgeId: "profit_positive",
    title: "Gain Master",
    description: "Portfolio in positive P&L",
    icon: "📈",
    category: "investing",
    trigger: (data) => data.totalPL > 0,
  },
  high_profit: {
    badgeId: "high_profit",
    title: "Profit King",
    description: "Portfolio gained ₹50,000+",
    icon: "💹",
    category: "investing",
    trigger: (data) => data.totalPL >= 50000,
  },

  // Consistency
  consistent_saver: {
    badgeId: "consistent_saver",
    title: "Consistent Saver",
    description: "Maintained positive savings for 3+ months",
    icon: "⏰",
    category: "consistency",
    trigger: (data) => data.consistentMonths >= 3,
  },
  daily_tracker: {
    badgeId: "daily_tracker",
    title: "Daily Tracker",
    description: "Logged expenses for 7+ days straight",
    icon: "📅",
    category: "consistency",
    trigger: (data) => data.consecutiveDays >= 7,
  },
};

/**
 * Calculate which badges a user should have earned
 * @param {Object} summary - Summary data from /api/summary endpoint
 * @param {Array} expenses - User's expense records
 * @param {Object} userStats - Optional pre-calculated stats
 * @returns {Array} Array of badge objects that should be earned
 */
async function calculateEarnedBadges(summary, expenses = [], userStats = {}) {
  try {
    const { stocks = [], mf = [], fds = {}, expenses: expenseData = {} } = summary;

    // ── Prepare data for badge triggers ────────────────────────────────────
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);

    const needSpend = monthlyExpenses
      .filter(e => e.type === "need")
      .reduce((sum, e) => sum + e.amount, 0);

    const wantSpend = monthlyExpenses
      .filter(e => e.type === "want")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = needSpend + wantSpend;

    // Calculate consecutive tracking days
    const uniqueDates = new Set(monthlyExpenses.map(e => 
      new Date(e.date).toDateString()
    ));
    const sortedDates = Array.from(uniqueDates)
      .map(d => new Date(d))
      .sort((a, b) => a - b);

    let consecutiveDays = 0;
    if (sortedDates.length > 0) {
      let currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
          consecutiveDays = Math.max(consecutiveDays, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    // Count active asset classes
    const assetClassCount = (stocks > 0 ? 1 : 0) + 
                           (mf > 0 ? 1 : 0) + 
                           ((fds?.maturity || 0) > 0 ? 1 : 0);

    // Build trigger data
    const triggerData = {
      totalWealth: summary.summary?.totalWealth || 0,
      totalInvested: summary.summary?.totalInvested || 0,
      totalPL: summary.summary?.totalPL || 0,
      monthlyExpenses: totalExpenses,
      needSpend,
      wantSpend,
      totalExpenses,
      investmentCount: (stocks?.length || 0) + (mf?.length || 0),
      assetClassCount,
      consistentMonths: userStats.consistentMonths || 0,
      consecutiveDays,
      ...userStats,
    };

    // ── Evaluate each badge ────────────────────────────────────────────────
    const earnedBadges = [];
    for (const [key, badgeDef] of Object.entries(BADGE_DEFINITIONS)) {
      try {
        if (badgeDef.trigger(triggerData)) {
          earnedBadges.push({
            badgeId: badgeDef.badgeId,
            title: badgeDef.title,
            description: badgeDef.description,
            icon: badgeDef.icon,
            category: badgeDef.category,
          });
        }
      } catch (e) {
        console.error(`Error evaluating badge ${key}:`, e.message);
      }
    }

    return earnedBadges;
  } catch (e) {
    console.error("Error calculating badges:", e.message);
    return [];
  }
}

/**
 * Calculate progress toward next milestone badges
 * @param {Object} summary - Summary data
 * @returns {Array} Array of upcoming badge progress
 */
function calculateBadgeProgress(summary) {
  const totalWealth = summary.summary?.totalWealth || 0;

  const milestones = [
    { threshold: 10000, title: "Growing Fund", current: totalWealth, icon: "📈" },
    { threshold: 50000, title: "Major Milestone", current: totalWealth, icon: "🎯" },
    { threshold: 100000, title: "Century Club", current: totalWealth, icon: "🏆" },
    { threshold: 500000, title: "Half Million", current: totalWealth, icon: "💎" },
    { threshold: 1000000, title: "Millionaire", current: totalWealth, icon: "👑" },
  ];

  return milestones
    .filter(m => m.current < m.threshold)
    .map(m => ({
      ...m,
      remaining: m.threshold - m.current,
      progress: (m.current / m.threshold) * 100,
    }));
}

module.exports = {
  BADGE_DEFINITIONS,
  calculateEarnedBadges,
  calculateBadgeProgress,
};
