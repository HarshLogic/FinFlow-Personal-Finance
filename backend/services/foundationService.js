const { FinancialFoundation } = require("../models");

/**
 * Calculates the Financial Foundation Score (0, 50, 100) strictly from milestone flags.
 * Rule: Emergency Fund = 50 pts, Health Insurance = 50 pts. Max = 100 pts.
 */
function calculateFoundationScore(milestones = {}) {
  let score = 0;
  let completedCount = 0;
  let answeredCount = 0;

  const efCompleted = typeof milestones.emergencyFund === "boolean"
    ? milestones.emergencyFund
    : Boolean(milestones.emergencyFund?.completed);

  const efAnswered = typeof milestones.emergencyFund === "boolean"
    ? true
    : Boolean(milestones.emergencyFund?.answered);

  if (efCompleted) {
    score += 50;
    completedCount += 1;
  }
  if (efAnswered) {
    answeredCount += 1;
  }

  const hiCompleted = typeof milestones.healthInsurance === "boolean"
    ? milestones.healthInsurance
    : Boolean(milestones.healthInsurance?.completed);

  const hiAnswered = typeof milestones.healthInsurance === "boolean"
    ? true
    : Boolean(milestones.healthInsurance?.answered);

  if (hiCompleted) {
    score += 50;
    completedCount += 1;
  }
  if (hiAnswered) {
    answeredCount += 1;
  }

  let classification = "Starting Your Financial Journey";
  let status = "STARTING";

  if (score === 100) {
    classification = "Financial Foundation Complete";
    status = "FOUNDATION_COMPLETE";
  } else if (score === 50) {
    classification = "Building Your Financial Foundation";
    status = "FOUNDATION_IN_PROGRESS";
  }

  return {
    score: Math.min(100, score),
    maximumScore: 100,
    completedMilestones: completedCount,
    totalMilestones: 2,
    answeredMilestones: answeredCount,
    status,
    classification,
    breakdown: {
      emergencyFund: {
        completed: efCompleted,
        answered: efAnswered,
        points: efCompleted ? 50 : 0,
      },
      healthInsurance: {
        completed: hiCompleted,
        answered: hiAnswered,
        points: hiCompleted ? 50 : 0,
      },
    },
  };
}

/**
 * Gets or initializes an idempotent FinancialFoundation document for the user.
 */
async function getOrCreateFoundation(userId) {
  if (!userId) throw new Error("userId is required");

  let doc = await FinancialFoundation.findOne({ userId });
  if (!doc) {
    doc = await FinancialFoundation.create({
      userId,
      milestones: {
        emergencyFund: { completed: false, answered: false, completedAt: null, updatedAt: null },
        healthInsurance: { completed: false, answered: false, completedAt: null, updatedAt: null },
      },
      onboarding: {
        status: "NOT_STARTED",
        completedAt: null,
        dismissedAt: null,
        version: 1,
      },
    });
  }

  const scoreMeta = calculateFoundationScore(doc.milestones);

  return {
    ...scoreMeta,
    onboarding: doc.onboarding,
    milestones: {
      emergencyFund: {
        completed: Boolean(doc.milestones?.emergencyFund?.completed),
        answered: Boolean(doc.milestones?.emergencyFund?.answered),
        points: doc.milestones?.emergencyFund?.completed ? 50 : 0,
        completedAt: doc.milestones?.emergencyFund?.completedAt,
        updatedAt: doc.milestones?.emergencyFund?.updatedAt,
      },
      healthInsurance: {
        completed: Boolean(doc.milestones?.healthInsurance?.completed),
        answered: Boolean(doc.milestones?.healthInsurance?.answered),
        points: doc.milestones?.healthInsurance?.completed ? 50 : 0,
        completedAt: doc.milestones?.healthInsurance?.completedAt,
        updatedAt: doc.milestones?.healthInsurance?.updatedAt,
      },
    },
    updatedAt: doc.updatedAt,
  };
}

/**
 * Updates self-reported milestone status.
 * Rejects unsupported milestone identifiers.
 */
async function updateMilestones(userId, updates = {}) {
  if (!userId) throw new Error("userId is required");

  let doc = await FinancialFoundation.findOne({ userId });
  if (!doc) {
    doc = await FinancialFoundation.create({
      userId,
      milestones: {
        emergencyFund: { completed: false, answered: false, completedAt: null, updatedAt: null },
        healthInsurance: { completed: false, answered: false, completedAt: null, updatedAt: null },
      },
      onboarding: { status: "NOT_STARTED" },
    });
  }

  // Handle single key { milestone: "emergencyFund", completed: true } or batch { emergencyFund: true }
  let changes = {};
  if (updates.milestone) {
    changes[updates.milestone] = Boolean(updates.completed);
  } else if (typeof updates === "object") {
    if (updates.emergencyFund !== undefined) changes.emergencyFund = Boolean(updates.emergencyFund);
    if (updates.healthInsurance !== undefined) changes.healthInsurance = Boolean(updates.healthInsurance);
  }

  const allowedMilestones = ["emergencyFund", "healthInsurance"];
  const now = new Date();

  for (const [key, val] of Object.entries(changes)) {
    if (!allowedMilestones.includes(key)) {
      throw new Error(`Unsupported milestone identifier: ${key}`);
    }

    doc.milestones[key].completed = val;
    doc.milestones[key].answered = true;
    doc.milestones[key].updatedAt = now;
    if (val) {
      if (!doc.milestones[key].completedAt) doc.milestones[key].completedAt = now;
    } else {
      doc.milestones[key].completedAt = null;
    }
  }

  doc.markModified("milestones");
  await doc.save();

  return getOrCreateFoundation(userId);
}

/**
 * Marks onboarding completed with user's initial self-reported answers.
 */
async function completeOnboarding(userId, milestoneData = {}) {
  if (!userId) throw new Error("userId is required");

  let doc = await FinancialFoundation.findOne({ userId });
  if (!doc) {
    doc = await FinancialFoundation.create({ userId });
  }

  const now = new Date();
  doc.onboarding.status = "COMPLETED";
  doc.onboarding.completedAt = now;

  if (milestoneData.emergencyFund !== undefined) {
    const val = Boolean(milestoneData.emergencyFund);
    doc.milestones.emergencyFund.completed = val;
    doc.milestones.emergencyFund.answered = true;
    doc.milestones.emergencyFund.updatedAt = now;
    doc.milestones.emergencyFund.completedAt = val ? now : null;
  }

  if (milestoneData.healthInsurance !== undefined) {
    const val = Boolean(milestoneData.healthInsurance);
    doc.milestones.healthInsurance.completed = val;
    doc.milestones.healthInsurance.answered = true;
    doc.milestones.healthInsurance.updatedAt = now;
    doc.milestones.healthInsurance.completedAt = val ? now : null;
  }

  doc.markModified("milestones");
  doc.markModified("onboarding");
  await doc.save();

  return getOrCreateFoundation(userId);
}

/**
 * Dismisses onboarding modal without blocking user access.
 */
async function dismissOnboarding(userId) {
  if (!userId) throw new Error("userId is required");

  let doc = await FinancialFoundation.findOne({ userId });
  if (!doc) {
    doc = await FinancialFoundation.create({ userId });
  }

  doc.onboarding.status = "DISMISSED";
  doc.onboarding.dismissedAt = new Date();
  doc.markModified("onboarding");
  await doc.save();

  return getOrCreateFoundation(userId);
}

module.exports = {
  calculateFoundationScore,
  getOrCreateFoundation,
  updateMilestones,
  completeOnboarding,
  dismissOnboarding,
};
