import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePuzzleRating, INITIAL_PLAYER } from "@/lib/glicko2";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "standard";
  const theme = searchParams.get("theme");
  const minRating = parseInt(searchParams.get("minRating") || "800");
  const maxRating = parseInt(searchParams.get("maxRating") || "2000");

  const where: Record<string, unknown> = {
    rating: { gte: minRating, lte: maxRating },
  };

  if (theme) {
    where.themes = { has: theme };
  }

  const puzzles = await prisma.puzzle.findMany({
    where,
    take: mode === "survival" ? 50 : 10,
    orderBy: { rating: "asc" },
  });

  return NextResponse.json(puzzles);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { puzzleId, solved, timeSpent, attempts, mode } = await req.json();

  const attempt = await prisma.puzzleAttempt.create({
    data: {
      userId,
      puzzleId,
      solved,
      timeSpent,
      attempts: attempts || 1,
      mode: mode || "standard",
    },
  });

  // Glicko-2 rating update
  const [profile, puzzle] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.puzzle.findUnique({ where: { id: puzzleId }, select: { rating: true, ratingRD: true } }),
  ]);

  if (profile && puzzle) {
    const player = {
      rating: profile.ratingPuzzle,
      rd: profile.ratingPuzzleRD,
      volatility: profile.ratingPuzzleVolatility,
    };

    // Partial credit: 1 attempt = full score, multiple attempts = 0.5, failed = 0
    const numAttempts = attempts || 1;
    const score: 0 | 0.5 | 1 = !solved ? 0 : numAttempts === 1 ? 1 : 0.5;

    const result = updatePuzzleRating(player, puzzle.rating, puzzle.ratingRD ?? 150, score);

    await prisma.userProfile.update({
      where: { userId },
      data: {
        ratingPuzzle: result.rating,
        ratingPuzzleRD: result.rd,
        ratingPuzzleVolatility: result.volatility,
      },
    });
  } else if (!profile) {
    // Create profile with defaults if missing
    const defaults = INITIAL_PLAYER;
    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ratingPuzzle: defaults.rating, ratingPuzzleRD: defaults.rd, ratingPuzzleVolatility: defaults.volatility },
      update: {},
    });
  }

  return NextResponse.json(attempt);
}
