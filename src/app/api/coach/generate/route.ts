import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReportType = "post_game" | "weekly" | "monthly" | "plateau";

function getWeekPeriod(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function startOfWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function generateWeeklyReport(data: {
  snapshots: Awaited<ReturnType<typeof prisma.progressSnapshot.findMany>>;
  weeklyReview: Awaited<ReturnType<typeof prisma.weeklyReview.findFirst>>;
  puzzleAttempts: Awaited<ReturnType<typeof prisma.puzzleAttempt.findMany>>;
  mistakes: Awaited<ReturnType<typeof prisma.gameMistake.findMany>>;
  profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>>;
}): { title: string; content: string; insights: object } {
  const { snapshots, weeklyReview, puzzleAttempts, mistakes, profile } = data;

  const totalPuzzles = puzzleAttempts.length;
  const solvedPuzzles = puzzleAttempts.filter((a) => a.solved).length;
  const puzzleAccuracy = totalPuzzles > 0 ? Math.round((solvedPuzzles / totalPuzzles) * 100) : 0;

  const mistakeCounts: Record<string, number> = {};
  for (const m of mistakes) {
    mistakeCounts[m.category] = (mistakeCounts[m.category] || 0) + 1;
  }
  const topMistake = Object.entries(mistakeCounts).sort(([, a], [, b]) => b - a)[0];

  const latestRating = snapshots[snapshots.length - 1];
  const earliestRating = snapshots[0];
  const ratingChange =
    latestRating && earliestRating
      ? (latestRating.ratingRapid ?? 0) - (earliestRating.ratingRapid ?? 0)
      : 0;

  const lines: string[] = [];
  lines.push("## Weekly Training Report\n");

  if (weeklyReview) {
    const reviewRate =
      weeklyReview.gamesPlayed > 0
        ? Math.round((weeklyReview.gamesReviewed / weeklyReview.gamesPlayed) * 100)
        : 0;
    lines.push(
      `You played ${weeklyReview.gamesPlayed} games this week and reviewed ${weeklyReview.gamesReviewed}. ` +
        (reviewRate < 50
          ? `That's only a ${reviewRate}% review rate. Self-analysis is the #1 improvement habit — review every serious game.`
          : `${reviewRate}% review rate — solid discipline. Keep it up.`)
    );
    lines.push(
      `Training time: ${weeklyReview.trainingMinutes} minutes. Tasks completed: ${weeklyReview.tasksCompleted}/${weeklyReview.totalTasks}.`
    );
    if (weeklyReview.tasksCompleted < weeklyReview.totalTasks * 0.5) {
      lines.push(
        "You completed less than half your planned tasks. Either reduce the plan or block dedicated study time."
      );
    }
  }

  lines.push(
    `\nPuzzle performance: ${solvedPuzzles}/${totalPuzzles} solved (${puzzleAccuracy}% accuracy).`
  );
  if (puzzleAccuracy < 60) {
    lines.push(
      "Your puzzle accuracy is below 60% — you're likely rushing. Slow down and calculate fully before moving."
    );
  } else if (puzzleAccuracy > 85) {
    lines.push("Strong puzzle accuracy. Consider increasing the difficulty to keep growing.");
  }

  if (topMistake) {
    const [category, count] = topMistake;
    const readable = category.replace(/_/g, " ");
    lines.push(
      `\nYour most common mistake pattern: ${readable} (${count} occurrences). ` +
        `Focus your next training sessions on eliminating this pattern.`
    );
  }

  if (ratingChange !== 0) {
    lines.push(
      `\nRating change this week: ${ratingChange > 0 ? "+" : ""}${ratingChange} rapid.` +
        (ratingChange < -30
          ? " Significant drop — review those losses carefully for emotional patterns."
          : ratingChange > 30
            ? " Great progress — make sure it's backed by real skill growth, not just lucky games."
            : "")
    );
  }

  if (profile?.primaryWeakness) {
    lines.push(
      `\nReminder: your primary weakness area is ${profile.primaryWeakness.replace(/_/g, " ")}. ` +
        `Make sure at least 30% of your training targets this directly.`
    );
  }

  return {
    title: `Weekly Report — ${getWeekPeriod()}`,
    content: lines.join("\n"),
    insights: {
      puzzleAccuracy,
      ratingChange,
      topMistakeCategory: topMistake?.[0] ?? null,
      gamesPlayed: weeklyReview?.gamesPlayed ?? 0,
      gamesReviewed: weeklyReview?.gamesReviewed ?? 0,
      trainingMinutes: weeklyReview?.trainingMinutes ?? 0,
    },
  };
}

function generatePostGameReport(data: {
  game: Awaited<ReturnType<typeof prisma.game.findFirst>>;
  mistakes: Awaited<ReturnType<typeof prisma.gameMistake.findMany>>;
}): { title: string; content: string; insights: object } {
  const { game, mistakes } = data;

  if (!game) {
    return {
      title: "Post-Game Report",
      content: "No recent game found to analyze.",
      insights: {},
    };
  }

  const lines: string[] = [];
  const opponent = game.white === game.black ? "Unknown" : game.white;
  lines.push(`## Post-Game Analysis: ${game.white} vs ${game.black}\n`);
  lines.push(`Result: ${game.result} | ${game.timeControl ?? "Unknown"} | ${game.opening ?? "Unknown opening"}`);

  if (game.accuracy !== null) {
    lines.push(
      `\nOverall accuracy: ${game.accuracy.toFixed(1)}%.` +
        (game.accuracy < 60
          ? " This is below acceptable for serious improvement. Did you feel rushed or distracted?"
          : game.accuracy > 85
            ? " Excellent accuracy — this was a well-played game."
            : "")
    );
  }

  if (game.averageCentipawnLoss !== null) {
    lines.push(`Average centipawn loss: ${game.averageCentipawnLoss.toFixed(1)}.`);
  }

  if (mistakes.length === 0) {
    lines.push("\nNo significant mistakes detected. Clean game.");
  } else {
    const byPhase: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const m of mistakes) {
      byPhase[m.phase] = (byPhase[m.phase] || 0) + 1;
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }

    lines.push(`\n${mistakes.length} mistakes found:`);

    const phaseEntries = Object.entries(byPhase).sort(([, a], [, b]) => b - a);
    for (const [phase, count] of phaseEntries) {
      lines.push(`- ${phase}: ${count} mistake${count > 1 ? "s" : ""}`);
    }

    const worstPhase = phaseEntries[0];
    if (worstPhase && worstPhase[1] >= 2) {
      lines.push(
        `\nMost mistakes in the ${worstPhase[0]}. ` +
          (worstPhase[0] === "endgame"
            ? "Start your next session with 10 minutes of endgame drills."
            : worstPhase[0] === "opening"
              ? "Revisit your opening repertoire — you're leaving theory too early."
              : "Focus your puzzle training on middlegame positions.")
      );
    }

    const topCategory = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
    if (topCategory) {
      lines.push(
        `\nDominant error type: ${topCategory[0].replace(/_/g, " ")} (${topCategory[1]}x). ` +
          `This should be your training priority for the next 48 hours.`
      );
    }

    const biggestBlunder = mistakes.reduce((max, m) =>
      m.evalDrop > max.evalDrop ? m : max
    );
    if (biggestBlunder.evalDrop > 2) {
      lines.push(
        `\nWorst moment: move ${biggestBlunder.moveNumber} — eval drop of ${biggestBlunder.evalDrop.toFixed(1)} pawns. ` +
          (biggestBlunder.explanation ?? `Category: ${biggestBlunder.category.replace(/_/g, " ")}.`)
      );
    }
  }

  return {
    title: `Post-Game: ${game.white} vs ${game.black} (${game.result})`,
    content: lines.join("\n"),
    insights: {
      result: game.result,
      accuracy: game.accuracy,
      mistakeCount: mistakes.length,
      mistakesByPhase: mistakes.reduce(
        (acc, m) => {
          acc[m.phase] = (acc[m.phase] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}

function generatePlateauReport(data: {
  snapshots: Awaited<ReturnType<typeof prisma.progressSnapshot.findMany>>;
  profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>>;
}): { title: string; content: string; insights: object } {
  const { snapshots, profile } = data;

  const lines: string[] = [];
  lines.push("## Plateau Analysis\n");

  if (snapshots.length < 5) {
    lines.push(
      "Not enough data to detect a plateau yet. Keep training and logging your progress for at least 2 weeks."
    );
    return { title: "Plateau Analysis", content: lines.join("\n"), insights: { dataPoints: snapshots.length } };
  }

  const ratings = snapshots
    .map((s) => s.ratingRapid ?? s.ratingBlitz ?? s.ratingClassical)
    .filter((r): r is number => r !== null);

  const puzzleRatings = snapshots.map((s) => s.ratingPuzzle).filter((r): r is number => r !== null);

  if (ratings.length >= 2) {
    const first = ratings.slice(0, Math.floor(ratings.length / 3));
    const last = ratings.slice(-Math.floor(ratings.length / 3));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
    const diff = Math.round(avgLast - avgFirst);

    if (Math.abs(diff) < 20) {
      lines.push(
        `Your rating has been flat (±${Math.abs(diff)} points) over the last 30 days. You are on a plateau.`
      );
      lines.push("\nPlateaus are normal, but they require deliberate action to break through:\n");
      lines.push("1. **Change your training mix.** If you've been doing mostly puzzles, switch to game review. If mostly playing, add structured study.");
      lines.push("2. **Play longer time controls.** Blitz won't fix deep issues. Play at least 5 rapid games this week.");
      lines.push("3. **Study your losses in depth.** Not just engine moves — understand *why* you chose the wrong plan.");
    } else if (diff > 0) {
      lines.push(`You're still progressing (+${diff} points over 30 days). Not a plateau — keep going.`);
    } else {
      lines.push(
        `Your rating has dropped ${Math.abs(diff)} points over 30 days. This is more than a plateau — something is off.`
      );
      lines.push("\nCheck for: tilt/emotional play, time trouble habits, opening preparation gaps, or fatigue from overplaying.");
    }
  }

  if (puzzleRatings.length >= 2) {
    const puzzleDiff = puzzleRatings[puzzleRatings.length - 1] - puzzleRatings[0];
    if (Math.abs(puzzleDiff) < 15) {
      lines.push(
        "\nYour puzzle rating is also stagnant. Try harder puzzles or switch to calculation exercises."
      );
    }
  }

  const tacticalAccuracies = snapshots
    .map((s) => s.tacticalAccuracy)
    .filter((t): t is number => t !== null);
  if (tacticalAccuracies.length >= 2) {
    const firstHalf = tacticalAccuracies.slice(0, Math.floor(tacticalAccuracies.length / 2));
    const secondHalf = tacticalAccuracies.slice(Math.floor(tacticalAccuracies.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avgSecond < avgFirst - 3) {
      lines.push(
        `\nYour tactical accuracy dropped from ${avgFirst.toFixed(0)}% to ${avgSecond.toFixed(0)}% — you're solving puzzles too fast or playing too much blitz.`
      );
    }
  }

  if (profile?.primaryWeakness) {
    lines.push(
      `\nYour identified weakness is ${profile.primaryWeakness.replace(/_/g, " ")}. ` +
        `A plateau is the perfect time to attack this head-on with focused drills.`
    );
  }

  return {
    title: "Plateau Analysis — 30 Day Review",
    content: lines.join("\n"),
    insights: {
      dataPoints: snapshots.length,
      ratingTrend: ratings.length >= 2 ? ratings[ratings.length - 1] - ratings[0] : null,
      primaryWeakness: profile?.primaryWeakness ?? null,
    },
  };
}

function generateMonthlyReport(data: {
  snapshots: Awaited<ReturnType<typeof prisma.progressSnapshot.findMany>>;
  puzzleAttempts: Awaited<ReturnType<typeof prisma.puzzleAttempt.findMany>>;
  mistakes: Awaited<ReturnType<typeof prisma.gameMistake.findMany>>;
  games: Awaited<ReturnType<typeof prisma.game.findMany>>;
  profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>>;
}): { title: string; content: string; insights: object } {
  const { snapshots, puzzleAttempts, mistakes, games, profile } = data;

  const lines: string[] = [];
  lines.push(`## Monthly Report — ${getMonthPeriod()}\n`);

  const ratings = snapshots
    .map((s) => s.ratingRapid ?? s.ratingBlitz)
    .filter((r): r is number => r !== null);
  if (ratings.length >= 2) {
    const change = ratings[ratings.length - 1] - ratings[0];
    lines.push(
      `Rating change: ${change > 0 ? "+" : ""}${change} points.` +
        (change > 50
          ? " Outstanding month — you're breaking through."
          : change > 0
            ? " Steady progress."
            : change > -30
              ? " Slight dip — normal variance. Focus on process, not results."
              : " Significant decline. Time to diagnose what's going wrong.")
    );
  }

  lines.push(`\nGames played: ${games.length}.`);
  const reviewed = games.filter((g) => g.selfReviewComplete).length;
  if (games.length > 0) {
    lines.push(
      `Games reviewed: ${reviewed}/${games.length} (${Math.round((reviewed / games.length) * 100)}%).`
    );
  }

  const totalPuzzles = puzzleAttempts.length;
  const solvedPuzzles = puzzleAttempts.filter((a) => a.solved).length;
  const puzzleAccuracy = totalPuzzles > 0 ? Math.round((solvedPuzzles / totalPuzzles) * 100) : 0;
  lines.push(`\nPuzzles attempted: ${totalPuzzles}. Solved: ${solvedPuzzles} (${puzzleAccuracy}% accuracy).`);

  if (mistakes.length > 0) {
    const byCategory: Record<string, number> = {};
    for (const m of mistakes) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }
    const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    lines.push("\nTop mistake categories this month:");
    for (const [cat, count] of sorted.slice(0, 3)) {
      lines.push(`- ${cat.replace(/_/g, " ")}: ${count}`);
    }

    const endgameMistakes = byCategory["endgame_failure"] ?? 0;
    const totalMistakes = mistakes.length;
    if (endgameMistakes / totalMistakes > 0.25) {
      lines.push(
        `\n${Math.round((endgameMistakes / totalMistakes) * 100)}% of your mistakes are endgame collapses. Start every session with 10 minutes of endgame drills.`
      );
    }
  }

  const trainingMinutes = snapshots.reduce((sum, s) => sum + (s.trainingMinutes ?? 0), 0);
  if (trainingMinutes > 0) {
    lines.push(`\nTotal training time: ${trainingMinutes} minutes (~${Math.round(trainingMinutes / 60)} hours).`);
    const targetMinutes = (profile?.hoursPerWeek ?? 5) * 4 * 60;
    if (trainingMinutes < targetMinutes * 0.7) {
      lines.push(
        `You're at ${Math.round((trainingMinutes / targetMinutes) * 100)}% of your monthly target. Consistency beats intensity.`
      );
    }
  }

  if (profile?.goal) {
    const goalMap: Record<string, string> = {
      beat_friends: "beating your friends",
      reach_1200: "reaching 1200",
      reach_1800: "reaching 1800",
      reach_2200: "reaching 2200",
      nm: "National Master",
      fm: "FIDE Master",
      im: "International Master",
      gm: "Grandmaster",
      improve: "general improvement",
    };
    lines.push(`\nGoal: ${goalMap[profile.goal] ?? profile.goal}. Stay focused on deliberate practice, not just playing.`);
  }

  return {
    title: `Monthly Report — ${getMonthPeriod()}`,
    content: lines.join("\n"),
    insights: {
      ratingChange: ratings.length >= 2 ? ratings[ratings.length - 1] - ratings[0] : null,
      gamesPlayed: games.length,
      gamesReviewed: reviewed,
      puzzleAccuracy,
      trainingMinutes,
    },
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const type = body.type as ReportType;

  if (!type || !["post_game", "weekly", "monthly", "plateau"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be one of: post_game, weekly, monthly, plateau" },
      { status: 400 }
    );
  }

  let title: string;
  let content: string;
  let insights: object;
  let period: string | null = null;

  if (type === "weekly") {
    const weekStart = startOfWeek();
    const [snapshots, weeklyReview, puzzleAttempts, mistakes, profile] = await Promise.all([
      prisma.progressSnapshot.findMany({
        where: { userId, date: { gte: weekStart } },
        orderBy: { date: "asc" },
      }),
      prisma.weeklyReview.findFirst({
        where: { userId, weekOf: { gte: weekStart } },
        orderBy: { weekOf: "desc" },
      }),
      prisma.puzzleAttempt.findMany({
        where: { userId, createdAt: { gte: weekStart } },
      }),
      prisma.gameMistake.findMany({
        where: { game: { userId }, createdAt: { gte: weekStart } },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);
    const report = generateWeeklyReport({ snapshots, weeklyReview, puzzleAttempts, mistakes, profile });
    title = report.title;
    content = report.content;
    insights = report.insights;
    period = getWeekPeriod();
  } else if (type === "post_game") {
    const [game, profile] = await Promise.all([
      prisma.game.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { mistakes: true },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);
    const report = generatePostGameReport({
      game,
      mistakes: game?.mistakes ?? [],
    });
    title = report.title;
    content = report.content;
    insights = report.insights;
  } else if (type === "plateau") {
    const [snapshots, profile] = await Promise.all([
      prisma.progressSnapshot.findMany({
        where: { userId, date: { gte: daysAgo(30) } },
        orderBy: { date: "asc" },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);
    const report = generatePlateauReport({ snapshots, profile });
    title = report.title;
    content = report.content;
    insights = report.insights;
  } else {
    const thirtyDaysAgo = daysAgo(30);
    const [snapshots, puzzleAttempts, mistakes, games, profile] = await Promise.all([
      prisma.progressSnapshot.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
      prisma.puzzleAttempt.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.gameMistake.findMany({
        where: { game: { userId }, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.game.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);
    const report = generateMonthlyReport({ snapshots, puzzleAttempts, mistakes, games, profile });
    title = report.title;
    content = report.content;
    insights = report.insights;
    period = getMonthPeriod();
  }

  const report = await prisma.coachReport.create({
    data: {
      userId,
      type,
      title,
      content,
      insights,
      period,
    },
  });

  return NextResponse.json(report);
}
