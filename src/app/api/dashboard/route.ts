import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBottleneckExplanation } from "@/lib/training-plan";
import type { WeaknessProfile } from "@/lib/training-plan";

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found. Complete onboarding first." },
      { status: 404 }
    );
  }

  const now = new Date();
  const monday = getMonday(now);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const startOfToday = getStartOfDay(now);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    trainingPlan,
    dueReviews,
    recentMistakes,
    latestProgress,
    puzzlesToday,
  ] = await Promise.all([
    prisma.trainingPlan.findFirst({
      where: {
        userId,
        weekOf: { gte: monday, lt: nextMonday },
      },
      include: {
        tasks: { orderBy: [{ day: "asc" }, { order: "asc" }] },
      },
    }),

    prisma.spacedRepetitionItem.count({
      where: { userId, nextReview: { lte: now } },
    }),

    prisma.gameMistake.findMany({
      where: { game: { userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    prisma.progressSnapshot.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),

    prisma.puzzleAttempt.count({
      where: {
        userId,
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
  ]);

  const streakDays = latestProgress?.streakDays ?? 0;

  const weaknesses: WeaknessProfile = {
    tactical: profile.skillTactics * 10,
    calculation: profile.skillCalculation * 10,
    endgame: profile.skillEndgame * 10,
    opening: profile.skillOpening * 10,
    positional: profile.skillStrategy * 10,
    timeManagement: profile.skillTimeManagement * 10,
  };

  const rating = profile.ratingRapid ?? profile.ratingBlitz ?? profile.ratingPuzzle;
  const bottleneckExplanation = getBottleneckExplanation(rating, weaknesses);

  const skills = {
    opening: profile.skillOpening,
    middlegame: profile.skillMiddlegame,
    tactics: profile.skillTactics,
    strategy: profile.skillStrategy,
    endgame: profile.skillEndgame,
    calculation: profile.skillCalculation,
    timeManagement: profile.skillTimeManagement,
  };

  return NextResponse.json({
    profile,
    tasks: trainingPlan?.tasks ?? [],
    dueReviews,
    recentMistakes,
    latestProgress,
    puzzlesToday,
    streakDays,
    bottleneckExplanation,
    skills,
  });
}
