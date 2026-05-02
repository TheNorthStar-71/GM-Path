import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const {
    exerciseId,
    candidateMoves,
    userVariation,
    depthReached,
    candidateQuality,
    accuracyScore,
    timeSpent,
  } = await req.json();

  if (
    !exerciseId ||
    !candidateMoves ||
    depthReached === undefined ||
    candidateQuality === undefined ||
    accuracyScore === undefined ||
    timeSpent === undefined
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const exercise = await prisma.calculationExercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    return NextResponse.json(
      { error: "Exercise not found" },
      { status: 404 }
    );
  }

  const attempt = await prisma.calculationAttempt.create({
    data: {
      userId,
      exerciseId,
      candidateMoves,
      userVariation: userVariation ?? null,
      depthReached,
      candidateQuality,
      accuracyScore,
      timeSpent,
    },
  });

  return NextResponse.json(attempt);
}
