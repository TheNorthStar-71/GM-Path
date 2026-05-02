import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeGame } from "@/lib/coach-analysis";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const game = await prisma.botGame.findUnique({
    where: { id: params.id },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const analysis = await analyzeGame(game.pgn, game.userColor);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.botGameMove.deleteMany({ where: { botGameId: game.id } });
    await tx.botGameCriticalMoment.deleteMany({ where: { botGameId: game.id } });
    await tx.derivedTrainingTask.deleteMany({ where: { botGameId: game.id } });

    await tx.botGameMove.createMany({
      data: analysis.moves.map((m) => ({
        botGameId: game.id,
        moveNumber: m.moveNumber,
        isWhiteMove: m.isWhiteMove,
        san: m.san,
        fen: m.fen,
        evalBefore: m.evalBefore,
        evalAfter: m.evalAfter,
        evalDrop: m.evalDrop,
        bestMoveSan: m.bestMoveSan,
        bestMoveUci: m.bestMoveUci,
        classification: m.classification,
        verdictLabel: m.verdictLabel,
        humanExplanation: m.humanExplanation,
        thinkingProcess: m.thinkingProcess,
        phase: m.phase,
        isPlayerMove: m.isPlayerMove,
      })),
    });

    await tx.botGameCriticalMoment.createMany({
      data: analysis.criticalMoments.map((cm) => ({
        botGameId: game.id,
        moveNumber: cm.moveNumber,
        type: cm.type,
        title: cm.title,
        description: cm.description,
        severity: cm.severity,
      })),
    });

    await tx.derivedTrainingTask.createMany({
      data: analysis.trainingTasks.map((t) => ({
        botGameId: game.id,
        moveNumber: t.moveNumber,
        category: t.category,
        title: t.title,
        description: t.description,
      })),
    });

    return tx.botGame.update({
      where: { id: game.id },
      data: {
        analysisComplete: true,
        accuracy: analysis.summary.accuracy,
        avgCentipawnLoss: analysis.summary.avgCentipawnLoss,
        summaryVerdict: analysis.summary.coachSummary,
        summaryStrengths: analysis.summary.strengths,
        summaryWeaknesses: analysis.summary.weaknesses,
        summaryLesson: analysis.summary.biggestLesson,
        opening: analysis.summary.opening,
      },
      include: {
        moves: { orderBy: { moveNumber: "asc" } },
        criticalMoments: { orderBy: { moveNumber: "asc" } },
        derivedTasks: true,
      },
    });
  });

  return NextResponse.json(updated);
}
