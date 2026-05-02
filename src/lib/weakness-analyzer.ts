import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low";

export interface WeaknessPriority {
  category: string;
  severity: Severity;
  score: number;
  description: string;
  trainNowLink: string;
  sources: string[];
}

export interface WeaknessReport {
  priorities: WeaknessPriority[];
  overallScore: number;
  recommendations: string[];
}

// ─── Constants ──────────────────────────────────────────

const CATEGORY_LINKS: Record<string, string> = {
  tactics: "/tactics",
  calculation: "/calculation",
  endgame: "/endgames",
  opening: "/openings",
  positional_play: "/middlegame",
  time_management: "/play",
};

const CATEGORY_LABELS: Record<string, string> = {
  tactics: "Tactics",
  calculation: "Calculation",
  endgame: "Endgame",
  opening: "Opening",
  positional_play: "Positional Play",
  time_management: "Time Management",
};

const MISTAKE_CATEGORY_MAP: Record<string, string> = {
  tactical_blindness: "tactics",
  calculation_failure: "calculation",
  opening_ignorance: "opening",
  positional_misunderstanding: "positional_play",
  endgame_failure: "endgame",
  time_management: "time_management",
  conversion_failure: "positional_play",
  defensive_failure: "tactics",
  psychological_tilt: "time_management",
};

// ─── Score helpers ──────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToSeverity(score: number): Severity {
  if (score < 30) return "critical";
  if (score < 50) return "high";
  if (score < 70) return "medium";
  return "low";
}

function generateDescription(category: string, score: number, severity: Severity): string {
  const label = CATEGORY_LABELS[category] ?? category;
  const severityWord =
    severity === "critical"
      ? "critically weak"
      : severity === "high"
        ? "significantly below average"
        : severity === "medium"
          ? "somewhat inconsistent"
          : "adequate but could improve";

  const advice: Record<string, string> = {
    tactics: "Focus on pattern recognition drills and solving puzzles daily to sharpen tactical vision.",
    calculation: "Practice candidate-move identification and deep line calculation to reduce oversights.",
    endgame: "Study fundamental endgame positions (Lucena, Philidor, opposition) and drill technique exercises.",
    opening: "Review your repertoire lines with spaced repetition and analyze where you deviate from theory.",
    positional_play: "Work on positional themes like pawn structure, piece activity, and prophylaxis in annotated master games.",
    time_management: "Practice with a clock, allocate time budgets per phase, and avoid spending disproportionate time on non-critical moves.",
  };

  return `Your ${label.toLowerCase()} is ${severityWord} (score ${score}/100). ${advice[category] ?? `Dedicated practice in ${label.toLowerCase()} will help raise your level.`}`;
}

// ─── Main analysis function ─────────────────────────────

export async function analyzeWeaknesses(userId: string): Promise<WeaknessReport> {
  const [
    gameMistakesByCategory,
    puzzleAttempts,
    calculationAttempts,
    endgameAttempts,
    userProfile,
    botMoveClassifications,
    latestProgress,
  ] = await Promise.all([
    // GameMistake: group by category, count
    prisma.gameMistake.groupBy({
      by: ["category"],
      where: { game: { userId } },
      _count: { id: true },
      _avg: { evalDrop: true },
    }),

    // PuzzleAttempt: all recent attempts with themes
    prisma.puzzleAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        solved: true,
        puzzle: { select: { themes: true } },
      },
    }),

    // CalculationAttempt: accuracy and depth
    prisma.calculationAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        accuracyScore: true,
        depthReached: true,
      },
    }),

    // EndgameAttempt: solve rate
    prisma.endgameAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { solved: true },
    }),

    // UserProfile: skill self-assessment
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        skillTactics: true,
        skillCalculation: true,
        skillEndgame: true,
        skillOpening: true,
        skillStrategy: true,
        skillMiddlegame: true,
        skillTimeManagement: true,
      },
    }),

    // BotGameMove: classification distribution for player moves
    prisma.botGameMove.groupBy({
      by: ["classification"],
      where: {
        botGame: { userId },
        isPlayerMove: true,
        classification: { not: null },
      },
      _count: { id: true },
    }),

    // ProgressSnapshot: latest metrics
    prisma.progressSnapshot.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  // ─── Compute per-category scores ────────────────────

  // Bucket game mistakes by unified category
  const mistakeCountByCategory: Record<string, number> = {};
  for (const row of gameMistakesByCategory) {
    const unified = MISTAKE_CATEGORY_MAP[row.category] ?? row.category;
    mistakeCountByCategory[unified] = (mistakeCountByCategory[unified] ?? 0) + row._count.id;
  }
  const totalMistakes = Object.values(mistakeCountByCategory).reduce((a, b) => a + b, 0) || 1;

  // Bot move quality: ratio of good+ moves
  const totalBotMoves = botMoveClassifications.reduce((s, r) => s + r._count.id, 0) || 1;
  const goodMoveTypes = new Set(["brilliant", "great", "good", "interesting"]);
  const badMoveTypes = new Set(["mistake", "blunder"]);
  const goodMoves = botMoveClassifications
    .filter((r) => r.classification && goodMoveTypes.has(r.classification))
    .reduce((s, r) => s + r._count.id, 0);
  const badMoves = botMoveClassifications
    .filter((r) => r.classification && badMoveTypes.has(r.classification))
    .reduce((s, r) => s + r._count.id, 0);
  const botQualityRatio = goodMoves / totalBotMoves;
  const botBlunderRatio = badMoves / totalBotMoves;

  // Puzzle solve rate by broad tactical theme
  const totalPuzzles = puzzleAttempts.length || 1;
  const solvedPuzzles = puzzleAttempts.filter((a) => a.solved).length;
  const puzzleSolveRate = solvedPuzzles / totalPuzzles;

  // Calculation average accuracy and depth
  const calcCount = calculationAttempts.length || 1;
  const avgCalcAccuracy =
    calculationAttempts.reduce((s, a) => s + a.accuracyScore, 0) / calcCount;
  const avgCalcDepth =
    calculationAttempts.reduce((s, a) => s + a.depthReached, 0) / calcCount;

  // Endgame solve rate
  const endgameCount = endgameAttempts.length || 1;
  const endgameSolved = endgameAttempts.filter((a) => a.solved).length;
  const endgameSolveRate = endgameSolved / endgameCount;

  // Self-assessment weights (1-10 scale, normalized to 0-100)
  const selfTactics = (userProfile?.skillTactics ?? 5) * 10;
  const selfCalc = (userProfile?.skillCalculation ?? 5) * 10;
  const selfEndgame = (userProfile?.skillEndgame ?? 5) * 10;
  const selfOpening = (userProfile?.skillOpening ?? 5) * 10;
  const selfStrategy = (userProfile?.skillStrategy ?? 5) * 10;
  const selfTimeMgmt = (userProfile?.skillTimeManagement ?? 5) * 10;

  // Progress snapshot metrics (0-100 already)
  const progressTactical = latestProgress?.tacticalAccuracy ?? null;
  const progressCalcDepth = latestProgress?.calculationDepth ?? null;
  const progressEndgame = latestProgress?.endgameAccuracy ?? null;
  const progressOpening = latestProgress?.openingRetention ?? null;
  const progressConversion = latestProgress?.conversionRate ?? null;
  const progressTimeTrouble = latestProgress?.timeTroubleFreq ?? null;

  // Tactical mistake ratio (inverse: more tactical mistakes = lower score)
  const tacticalMistakeRatio = (mistakeCountByCategory["tactics"] ?? 0) / totalMistakes;
  const tacticalMistakeScore = clamp(100 - tacticalMistakeRatio * 200);

  // ─── Weighted composite scores ──────────────────────

  // Tactics: puzzle solve rate (40%) + game tactical mistakes inverse (30%) + self (10%) + progress (20%)
  const tacticsScore = clamp(
    Math.round(
      puzzleSolveRate * 100 * 0.4 +
      tacticalMistakeScore * 0.3 +
      selfTactics * 0.1 +
      (progressTactical ?? puzzleSolveRate * 100) * 0.2
    )
  );

  // Calculation: accuracy (40%) + depth normalized (20%) + self (10%) + progress (30%)
  const depthScore = clamp(Math.min(avgCalcDepth / 6, 1) * 100);
  const calculationScore = clamp(
    Math.round(
      avgCalcAccuracy * 0.4 +
      depthScore * 0.2 +
      selfCalc * 0.1 +
      (progressCalcDepth ?? avgCalcAccuracy) * 0.3
    )
  );

  // Endgame: solve rate (45%) + progress accuracy (30%) + self (10%) + bot quality (15%)
  const endgameScore = clamp(
    Math.round(
      endgameSolveRate * 100 * 0.45 +
      (progressEndgame ?? endgameSolveRate * 100) * 0.3 +
      selfEndgame * 0.1 +
      botQualityRatio * 100 * 0.15
    )
  );

  // Opening: retention from progress (40%) + opening mistake inverse (35%) + self (10%) + bot quality (15%)
  const openingMistakeRatio = (mistakeCountByCategory["opening"] ?? 0) / totalMistakes;
  const openingMistakeScore = clamp(100 - openingMistakeRatio * 200);
  const openingScore = clamp(
    Math.round(
      (progressOpening ?? 50) * 0.4 +
      openingMistakeScore * 0.35 +
      selfOpening * 0.1 +
      botQualityRatio * 100 * 0.15
    )
  );

  // Positional: positional mistakes inverse (40%) + conversion rate (30%) + self (15%) + bot quality (15%)
  const positionalMistakeRatio = (mistakeCountByCategory["positional_play"] ?? 0) / totalMistakes;
  const positionalMistakeScore = clamp(100 - positionalMistakeRatio * 200);
  const positionalScore = clamp(
    Math.round(
      positionalMistakeScore * 0.4 +
      (progressConversion ?? 50) * 0.3 +
      selfStrategy * 0.15 +
      (1 - botBlunderRatio) * 100 * 0.15
    )
  );

  // Time management: time trouble frequency inverse (50%) + self (20%) + time_management mistakes inverse (30%)
  const timeMgmtMistakeRatio = (mistakeCountByCategory["time_management"] ?? 0) / totalMistakes;
  const timeMgmtMistakeScore = clamp(100 - timeMgmtMistakeRatio * 200);
  const timeTroubleScore = progressTimeTrouble != null ? clamp(100 - progressTimeTrouble) : 50;
  const timeManagementScore = clamp(
    Math.round(
      timeTroubleScore * 0.5 +
      selfTimeMgmt * 0.2 +
      timeMgmtMistakeScore * 0.3
    )
  );

  // ─── Build priorities ───────────────────────────────

  const allScores: { category: string; score: number; sources: string[] }[] = [
    {
      category: "tactics",
      score: tacticsScore,
      sources: [
        puzzleAttempts.length > 0 ? "PuzzleAttempt" : null,
        gameMistakesByCategory.some((r) => MISTAKE_CATEGORY_MAP[r.category] === "tactics") ? "GameMistake" : null,
        progressTactical != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
      ].filter(Boolean) as string[],
    },
    {
      category: "calculation",
      score: calculationScore,
      sources: [
        calculationAttempts.length > 0 ? "CalculationAttempt" : null,
        progressCalcDepth != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
      ].filter(Boolean) as string[],
    },
    {
      category: "endgame",
      score: endgameScore,
      sources: [
        endgameAttempts.length > 0 ? "EndgameAttempt" : null,
        progressEndgame != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
        botMoveClassifications.length > 0 ? "BotGameMove" : null,
      ].filter(Boolean) as string[],
    },
    {
      category: "opening",
      score: openingScore,
      sources: [
        gameMistakesByCategory.some((r) => MISTAKE_CATEGORY_MAP[r.category] === "opening") ? "GameMistake" : null,
        progressOpening != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
        botMoveClassifications.length > 0 ? "BotGameMove" : null,
      ].filter(Boolean) as string[],
    },
    {
      category: "positional_play",
      score: positionalScore,
      sources: [
        gameMistakesByCategory.some((r) => MISTAKE_CATEGORY_MAP[r.category] === "positional_play") ? "GameMistake" : null,
        progressConversion != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
        botMoveClassifications.length > 0 ? "BotGameMove" : null,
      ].filter(Boolean) as string[],
    },
    {
      category: "time_management",
      score: timeManagementScore,
      sources: [
        gameMistakesByCategory.some((r) => MISTAKE_CATEGORY_MAP[r.category] === "time_management") ? "GameMistake" : null,
        progressTimeTrouble != null ? "ProgressSnapshot" : null,
        userProfile ? "UserProfile" : null,
      ].filter(Boolean) as string[],
    },
  ];

  // Sort ascending by score (worst first)
  allScores.sort((a, b) => a.score - b.score);

  const priorities: WeaknessPriority[] = allScores.slice(0, 3).map((item) => {
    const severity = scoreToSeverity(item.score);
    return {
      category: item.category,
      severity,
      score: item.score,
      description: generateDescription(item.category, item.score, severity),
      trainNowLink: CATEGORY_LINKS[item.category] ?? "/dashboard",
      sources: item.sources,
    };
  });

  // Overall score: weighted average of all six areas
  const overallScore = clamp(
    Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length)
  );

  // ─── Recommendations ────────────────────────────────

  const recommendations: string[] = [];

  for (const p of priorities) {
    if (p.severity === "critical") {
      recommendations.push(
        `Urgent: Dedicate at least 30 minutes daily to ${CATEGORY_LABELS[p.category]?.toLowerCase() ?? p.category} training.`
      );
    } else if (p.severity === "high") {
      recommendations.push(
        `High priority: Include ${CATEGORY_LABELS[p.category]?.toLowerCase() ?? p.category} exercises in every training session.`
      );
    } else if (p.severity === "medium") {
      recommendations.push(
        `Moderate: Schedule 2-3 focused ${CATEGORY_LABELS[p.category]?.toLowerCase() ?? p.category} sessions per week.`
      );
    }
  }

  if (puzzleSolveRate < 0.5 && !recommendations.some((r) => r.includes("tactics"))) {
    recommendations.push("Your puzzle solve rate is below 50% — try easier puzzles to build pattern recognition before increasing difficulty.");
  }

  if (avgCalcAccuracy < 40) {
    recommendations.push("Calculation accuracy is very low — practice with shorter forcing lines before attempting deep calculations.");
  }

  if (botBlunderRatio > 0.15) {
    recommendations.push("You are blundering frequently in practice games — slow down and use a blunder-check habit before each move.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Your skills are well-rounded. Focus on maintaining consistency and gradually increasing difficulty across all areas.");
  }

  return { priorities, overallScore, recommendations };
}
