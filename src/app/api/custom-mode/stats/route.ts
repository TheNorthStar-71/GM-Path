import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const attempts = await prisma.customModeAttempt.findMany({
    where: { userId },
    select: { mode: true, score: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const modes = ["plan", "opponent_plan", "trade"];
  const stats = modes.map((mode) => {
    const modeAttempts = attempts.filter((a) => a.mode === mode);
    const total = modeAttempts.length;
    const totalScore = modeAttempts.reduce((s, a) => s + a.score, 0);
    const avgScore = total > 0 ? totalScore / total : 0;
    const perfectCount = modeAttempts.filter((a) => a.score === 3).length;
    const recentAttempts = modeAttempts.slice(0, 5);
    const recentAvg = recentAttempts.length > 0
      ? recentAttempts.reduce((s, a) => s + a.score, 0) / recentAttempts.length
      : 0;

    return {
      mode,
      totalAttempts: total,
      averageScore: Math.round(avgScore * 100) / 100,
      perfectCount,
      recentAverage: Math.round(recentAvg * 100) / 100,
      trend: recentAvg > avgScore ? "improving" : recentAvg < avgScore ? "declining" : "steady",
    };
  });

  const totalExercises = await prisma.customModeExercise.count();

  return NextResponse.json({ stats, totalExercises, totalAttempts: attempts.length });
}
