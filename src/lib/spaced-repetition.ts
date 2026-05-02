// SM-2 Spaced Repetition Algorithm

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, but remembered upon seeing answer
// 2 - Incorrect, but easy to recall after seeing answer
// 3 - Correct with serious difficulty
// 4 - Correct with some hesitation
// 5 - Perfect recall

export function calculateSM2(
  quality: ReviewQuality,
  previousEF: number,
  previousInterval: number,
  previousReps: number
): SM2Result {
  let easeFactor = previousEF;
  let interval: number;
  let repetitions: number;

  if (quality >= 3) {
    // Successful recall
    if (previousReps === 0) {
      interval = 1;
    } else if (previousReps === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }
    repetitions = previousReps + 1;
  } else {
    // Failed recall - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // EF must be at least 1.3
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReview,
  };
}

export function getDueItemCount(
  items: { nextReview: Date }[]
): number {
  const now = new Date();
  return items.filter((item) => new Date(item.nextReview) <= now).length;
}

// ─── Mastery Tracking ────────────────────────────────────────────────────────

export interface MasteryInfo {
  mastery: number; // 0-100%
  status: "new" | "learning" | "reviewing" | "mastered";
  nextReview: Date;
  isMaintenance: boolean;
}

/**
 * Calculate mastery percentage from SM-2 state.
 * Mastery is derived from: repetitions, ease factor, and interval length.
 * Items with interval >= 30 days and EF >= 2.3 are considered "mastered".
 */
export function calculateMastery(
  repetitions: number,
  easeFactor: number,
  interval: number
): MasteryInfo {
  // Base mastery from repetitions (max contribution: 50%)
  const repScore = Math.min(50, repetitions * 10);

  // Ease factor contribution (max: 25%) — higher EF = easier recall
  const efScore = Math.min(25, Math.round(((easeFactor - 1.3) / 1.2) * 25));

  // Interval contribution (max: 25%) — longer intervals = more stable
  const intervalScore = Math.min(25, Math.round((interval / 30) * 25));

  const mastery = Math.min(100, repScore + efScore + intervalScore);

  // Determine status
  let status: MasteryInfo["status"];
  if (repetitions === 0) {
    status = "new";
  } else if (mastery < 40) {
    status = "learning";
  } else if (mastery < 80) {
    status = "reviewing";
  } else {
    status = "mastered";
  }

  // Mastered items only show up once per month for maintenance
  const isMaintenance = status === "mastered" && interval >= 30;

  const nextReview = new Date();
  if (isMaintenance) {
    // Once per month for mastered items
    nextReview.setDate(nextReview.getDate() + 30);
  } else {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return { mastery, status, nextReview, isMaintenance };
}

// ─── Weakness-Weighted Priority ──────────────────────────────────────────────

export interface WeightedItem {
  itemId: string;
  itemType: string;
  themes: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export interface WeaknessWeight {
  category: string;
  severity: number; // 0-100
}

/**
 * Sort review items by priority, weighting by weakness severity.
 * Items targeting the user's weakest areas are scheduled first.
 * If an item targets multiple weakness areas, it gets a multiplier.
 */
export function prioritizeReviewQueue(
  items: WeightedItem[],
  weaknesses: WeaknessWeight[]
): WeightedItem[] {
  const weaknessMap = new Map(weaknesses.map((w) => [w.category, w.severity]));

  const scored = items.map((item) => {
    // Base urgency from how overdue the item is
    const now = Date.now();
    const dueTime = new Date(item.nextReview).getTime();
    const overdueDays = Math.max(0, (now - dueTime) / (1000 * 60 * 60 * 24));
    const urgency = Math.min(10, overdueDays); // Cap at 10

    // Weakness match score
    let weaknessScore = 0;
    let matchCount = 0;
    for (const theme of item.themes) {
      const severity = weaknessMap.get(theme);
      if (severity !== undefined) {
        weaknessScore += severity;
        matchCount++;
      }
    }

    // Multi-weakness multiplier: items targeting 2+ weaknesses get boosted
    const multiWeaknessBonus = matchCount >= 2 ? 1.5 : matchCount >= 3 ? 2.0 : 1.0;

    // Lower mastery = higher priority
    const { mastery } = calculateMastery(
      item.repetitions,
      item.easeFactor,
      item.interval
    );
    const masteryPenalty = (100 - mastery) / 10; // 0-10

    // Final priority score (higher = review first)
    const priority =
      urgency * 3 +
      (weaknessScore / 10) * multiWeaknessBonus +
      masteryPenalty * 2;

    return { item, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.map((s) => s.item);
}
