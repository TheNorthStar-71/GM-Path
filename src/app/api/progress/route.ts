import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RANGE_MAP: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "3M";

  const days = RANGE_MAP[range];
  const dateFilter = days
    ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    : undefined;

  const [snapshots, profile, recentMistakes, puzzleAttempts] =
    await Promise.all([
      prisma.progressSnapshot.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: "asc" },
      }),

      prisma.userProfile.findUnique({
        where: { userId },
      }),

      prisma.gameMistake.findMany({
        where: {
          game: { userId },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          category: true,
          subcategory: true,
          phase: true,
        },
      }),

      prisma.puzzleAttempt.findMany({
        where: {
          userId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          puzzle: { select: { themes: true } },
        },
      }),
    ]);

  const mistakePatterns = recentMistakes.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalPuzzles = puzzleAttempts.length;
  const solvedPuzzles = puzzleAttempts.filter((a) => a.solved).length;

  const themeStats = puzzleAttempts.reduce(
    (acc, attempt) => {
      for (const theme of attempt.puzzle.themes) {
        if (!acc[theme]) acc[theme] = { total: 0, solved: 0 };
        acc[theme].total++;
        if (attempt.solved) acc[theme].solved++;
      }
      return acc;
    },
    {} as Record<string, { total: number; solved: number }>
  );

  const puzzleStats = {
    total: totalPuzzles,
    solved: solvedPuzzles,
    accuracy: totalPuzzles > 0 ? Math.round((solvedPuzzles / totalPuzzles) * 100) : 0,
    byTheme: themeStats,
  };

  return NextResponse.json({ snapshots, profile, mistakePatterns, puzzleStats });
}
