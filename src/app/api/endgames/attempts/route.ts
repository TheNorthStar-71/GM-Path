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
  const { positionId, solved, moves, timeSpent, accuracy } = await req.json();

  if (!positionId || solved === undefined || timeSpent === undefined) {
    return NextResponse.json(
      { error: "positionId, solved, and timeSpent are required" },
      { status: 400 }
    );
  }

  const position = await prisma.endgamePosition.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    return NextResponse.json(
      { error: "Position not found" },
      { status: 404 }
    );
  }

  const attempt = await prisma.endgameAttempt.create({
    data: {
      userId,
      positionId,
      solved,
      moves: moves ?? null,
      timeSpent,
      accuracy: accuracy ?? null,
    },
  });

  return NextResponse.json(attempt);
}
