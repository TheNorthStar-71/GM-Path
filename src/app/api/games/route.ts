import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePGN, detectGamePhase, getFenAfterMoves } from "@/lib/chess-engine";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const games = await prisma.game.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(games);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { pgn } = await req.json();

  if (!pgn) {
    return NextResponse.json({ error: "PGN required" }, { status: 400 });
  }

  const { moves, headers } = parsePGN(pgn);

  if (moves.length === 0) {
    return NextResponse.json({ error: "Invalid PGN" }, { status: 400 });
  }

  // Detect time control from headers
  let timeControl = "rapid";
  const tc = headers["TimeControl"];
  if (tc) {
    const baseTime = parseInt(tc.split("+")[0]) || 600;
    if (baseTime < 180) timeControl = "bullet";
    else if (baseTime < 600) timeControl = "blitz";
    else if (baseTime < 1800) timeControl = "rapid";
    else timeControl = "classical";
  }

  // Detect opening phase
  const midFen = moves.length >= 10 ? getFenAfterMoves(moves, 9) : getFenAfterMoves(moves, moves.length - 1);
  const _phase = detectGamePhase(midFen);

  const game = await prisma.game.create({
    data: {
      userId,
      pgn,
      white: headers["White"] || "Unknown",
      black: headers["Black"] || "Unknown",
      result: headers["Result"] || "*",
      date: headers["Date"] ? new Date(headers["Date"].replace(/\./g, "-")) : null,
      event: headers["Event"] || null,
      timeControl,
      eco: headers["ECO"] || null,
      opening: headers["Opening"] || null,
      source: "manual",
    },
  });

  return NextResponse.json(game);
}
