import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ format: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { format } = await params;

  if (format === "pgn") {
    const games = await prisma.game.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { pgn: true },
    });

    const pgnContent = games.map((g) => g.pgn).join("\n\n");

    return new Response(pgnContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="games.pgn"',
      },
    });
  }

  if (format === "json") {
    const [profile, games, puzzleAttempts, progressSnapshots] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.game.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          white: true,
          black: true,
          result: true,
          date: true,
          event: true,
          timeControl: true,
          eco: true,
          opening: true,
          accuracy: true,
          averageCentipawnLoss: true,
          source: true,
          createdAt: true,
        },
      }),
      prisma.puzzleAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          puzzleId: true,
          solved: true,
          timeSpent: true,
          attempts: true,
          mode: true,
          createdAt: true,
        },
      }),
      prisma.progressSnapshot.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      games,
      puzzleAttempts,
      progressSnapshots,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    return new Response(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="chess-data.json"',
      },
    });
  }

  if (format === "pdf") {
    return NextResponse.json(
      { error: "PDF export is not yet implemented" },
      { status: 501 }
    );
  }

  return NextResponse.json(
    { error: `Unsupported format: ${format}. Use "pgn", "json", or "pdf".` },
    { status: 400 }
  );
}
