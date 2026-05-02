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

  const [modules, attempts] = await Promise.all([
    prisma.endgameModule.findMany({
      include: {
        positions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.endgameAttempt.findMany({
      where: { userId },
    }),
  ]);

  const attemptsByPosition = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    const existing = attemptsByPosition.get(attempt.positionId) ?? [];
    existing.push(attempt);
    attemptsByPosition.set(attempt.positionId, existing);
  }

  const result = modules.map((mod) => ({
    ...mod,
    positions: mod.positions.map((pos) => {
      const posAttempts = attemptsByPosition.get(pos.id) ?? [];
      return {
        ...pos,
        attempted: posAttempts.length > 0,
        solved: posAttempts.some((a) => a.solved),
        attemptCount: posAttempts.length,
        bestAccuracy: posAttempts.length
          ? Math.max(...posAttempts.map((a) => a.accuracy ?? 0))
          : null,
      };
    }),
  }));

  return NextResponse.json(result);
}
