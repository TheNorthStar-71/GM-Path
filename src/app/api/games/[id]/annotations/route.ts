import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AnnotationInput {
  moveNumber: number;
  isWhiteMove: boolean;
  fen: string;
  userComment?: string;
  isCriticalMoment: boolean;
  userEmotion?: string;
  clockTime?: number;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { annotations } = (await req.json()) as {
    annotations: AnnotationInput[];
  };

  if (!annotations || !Array.isArray(annotations)) {
    return NextResponse.json(
      { error: "annotations array is required" },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: params.id },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.gameAnnotation.deleteMany({
      where: { gameId: params.id },
    });

    const created = await tx.gameAnnotation.createMany({
      data: annotations.map((a) => ({
        gameId: params.id,
        moveNumber: a.moveNumber,
        isWhiteMove: a.isWhiteMove,
        fen: a.fen,
        userComment: a.userComment ?? null,
        isCriticalMoment: a.isCriticalMoment,
        userEmotion: a.userEmotion ?? null,
        clockTime: a.clockTime ?? null,
      })),
    });

    await tx.game.update({
      where: { id: params.id },
      data: { selfReviewComplete: true },
    });

    return created;
  });

  const createdAnnotations = await prisma.gameAnnotation.findMany({
    where: { gameId: params.id },
    orderBy: { moveNumber: "asc" },
  });

  return NextResponse.json(createdAnnotations);
}
