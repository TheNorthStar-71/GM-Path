import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GoodPlan {
  moves: string[];
  summary: string;
  eval: number;
}

interface WrongPlan {
  moves: string[];
  reason: string;
}

function scorePlanAttempt(
  userMoves: string[],
  goodPlans: GoodPlan[],
  wrongPlans: WrongPlan[]
): { score: number; feedback: string; matchedPlan: GoodPlan | null } {
  // Check against wrong plans first
  for (const wp of wrongPlans) {
    const overlap = userMoves.filter((m) => wp.moves.includes(m)).length;
    if (overlap >= 2 || (userMoves.length <= 2 && overlap >= 1 && userMoves[0] === wp.moves[0])) {
      return {
        score: 1,
        feedback: `Your plan has issues: ${wp.reason}`,
        matchedPlan: null,
      };
    }
  }

  // Score against good plans
  let bestScore = 0;
  let bestPlan: GoodPlan | null = null;

  for (const gp of goodPlans) {
    const overlap = userMoves.filter((m) => gp.moves.includes(m)).length;
    const orderMatch = userMoves[0] === gp.moves[0];
    let planScore = 0;

    if (overlap === gp.moves.length && orderMatch) {
      planScore = 3;
    } else if (overlap >= 2 || (overlap >= 1 && orderMatch)) {
      planScore = 2;
    } else if (overlap >= 1) {
      planScore = 1;
    }

    if (planScore > bestScore) {
      bestScore = planScore;
      bestPlan = gp;
    }
  }

  if (bestScore === 3) {
    return {
      score: 3,
      feedback: `Excellent! Your plan matches a strong approach: "${bestPlan!.summary}"`,
      matchedPlan: bestPlan,
    };
  }

  if (bestScore === 2) {
    return {
      score: 2,
      feedback: `Good idea! You're on the right track. The ideal plan: "${bestPlan!.summary}" Your move order could be refined.`,
      matchedPlan: bestPlan,
    };
  }

  if (bestScore === 1) {
    return {
      score: 1,
      feedback: `Partial credit — you found one good idea, but the overall plan needs work. Consider: "${goodPlans[0].summary}"`,
      matchedPlan: bestPlan,
    };
  }

  return {
    score: 0,
    feedback: `This plan doesn't address the position's needs. The recommended approach: "${goodPlans[0].summary}"`,
    matchedPlan: null,
  };
}

function scoreTradeAttempt(
  userAnswer: string,
  correctAnswer: string
): { score: number; feedback: string } {
  if (userAnswer === correctAnswer) {
    return { score: 3, feedback: "Correct! You identified the right approach." };
  }

  // Partial credit for "trade_after_improving" when answer is "trade" or vice versa
  if (
    (userAnswer === "trade" && correctAnswer === "trade_after_improving") ||
    (userAnswer === "trade_after_improving" && correctAnswer === "trade")
  ) {
    return { score: 2, feedback: "Close! You had the right instinct about trading, but the timing matters." };
  }

  return { score: 0, feedback: "Not quite — let's look at the positional factors." };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { exerciseId, userMoves, userAnswer, userText, timeSpentMs } = body;

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  }

  const exercise = await prisma.customModeExercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  let score: number;
  let feedback: string;

  if (exercise.mode === "trade") {
    if (!userAnswer) {
      return NextResponse.json({ error: "userAnswer required for trade mode" }, { status: 400 });
    }
    const result = scoreTradeAttempt(userAnswer, exercise.tradeAnswer || "trade");
    score = result.score;
    feedback = result.feedback + "\n\n" + exercise.explanation;
  } else {
    // plan or opponent_plan mode
    const moves = Array.isArray(userMoves) ? userMoves : [];
    if (moves.length === 0) {
      return NextResponse.json({ error: "userMoves required" }, { status: 400 });
    }

    const goodPlans: GoodPlan[] = JSON.parse(exercise.goodPlans || "[]");
    const wrongPlans: WrongPlan[] = JSON.parse(exercise.wrongPlans || "[]");
    const result = scorePlanAttempt(moves, goodPlans, wrongPlans);
    score = result.score;
    feedback = result.feedback + "\n\n" + exercise.explanation;
  }

  // Persist the attempt
  const attempt = await prisma.customModeAttempt.create({
    data: {
      userId,
      exerciseId,
      mode: exercise.mode,
      userMoves: userMoves ? JSON.stringify(userMoves) : null,
      userAnswer: userAnswer || null,
      userText: userText || null,
      score,
      feedback,
      timeSpentMs: timeSpentMs || null,
    },
  });

  // Return full feedback with correct answers revealed
  const goodPlans = JSON.parse(exercise.goodPlans || "[]");

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    maxScore: 3,
    feedback,
    correctAnswer: exercise.tradeAnswer || undefined,
    goodPlans,
    explanation: exercise.explanation,
  });
}
