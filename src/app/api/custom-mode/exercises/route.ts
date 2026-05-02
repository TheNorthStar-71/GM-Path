import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "plan";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 20);

  const userId = (session.user as { id: string }).id;

  // Get IDs of exercises the user has already attempted
  const attempted = await prisma.customModeAttempt.findMany({
    where: { userId, mode },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
  });
  const attemptedIds = attempted.map((a) => a.exerciseId);

  // Prioritize unattempted exercises, fall back to all
  let exercises = await prisma.customModeExercise.findMany({
    where: {
      mode,
      id: { notIn: attemptedIds.length > 0 ? attemptedIds : undefined },
    },
    take: limit,
    orderBy: { difficulty: "asc" },
  });

  if (exercises.length === 0) {
    exercises = await prisma.customModeExercise.findMany({
      where: { mode },
      take: limit,
      orderBy: { difficulty: "asc" },
    });
  }

  // Strip answer data — don't leak correct answers
  const sanitized = exercises.map((ex) => ({
    id: ex.id,
    mode: ex.mode,
    fen: ex.fen,
    sideToMove: ex.sideToMove,
    goal: ex.goal,
    difficulty: ex.difficulty,
    ratingMin: ex.ratingMin,
    ratingMax: ex.ratingMax,
    // For trade mode, include the choices but not the answer
    isTradeMode: ex.mode === "trade",
    tradeThemes: ex.tradeThemes,
  }));

  return NextResponse.json({ exercises: sanitized });
}
