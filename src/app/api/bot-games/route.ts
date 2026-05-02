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
  const games = await prisma.botGame.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { moves: true } },
    },
  });

  return NextResponse.json(games);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const {
    id,
    pgn,
    result,
    userColor,
    timeControl,
    trainingFocus,
    opening,
    eco,
    // Accept both field name conventions
    white: whiteArg,
    black: blackArg,
    botStrength: botStrengthArg,
    botLabel,
    botRating,
    totalMoves,
    moves: movesCount,
  } = body;

  if (!pgn) {
    return NextResponse.json({ error: "PGN required" }, { status: 400 });
  }

  // Derive white/black names
  const playerName = session.user?.name || "You";
  const botLabel_ = botLabel || botStrengthArg || "Bot";
  const botDisplay = botRating ? `${botLabel_} (${botRating})` : botLabel_;
  const white = whiteArg || (userColor === "white" ? playerName : botDisplay);
  const black = blackArg || (userColor === "black" ? playerName : botDisplay);
  const botStrength = botLabel_ as string;
  const numMoves = totalMoves ?? movesCount ?? 0;

  const data = {
    userId,
    pgn,
    white,
    black,
    result: result || "*",
    userColor: userColor || "white",
    botStrength,
    timeControl: timeControl || "untimed",
    trainingFocus: trainingFocus || null,
    opening: opening || null,
    eco: eco || null,
    totalMoves: numMoves,
    analysisComplete: false,
  };

  // If the play page supplies a custom ID, use it (upsert to avoid duplicates)
  const game = id
    ? await prisma.botGame.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      })
    : await prisma.botGame.create({ data });

  return NextResponse.json(game);
}
