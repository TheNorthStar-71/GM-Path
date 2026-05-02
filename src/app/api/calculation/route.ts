import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty");
  const type = searchParams.get("type");
  const theme = searchParams.get("theme");

  const where: Record<string, unknown> = {};

  if (difficulty) {
    const d = parseInt(difficulty);
    if (d >= 1 && d <= 10) {
      where.difficulty = d;
    }
  }

  if (type && ["forcing", "non_forcing", "mixed"].includes(type)) {
    where.type = type;
  }

  if (theme) {
    where.theme = theme;
  }

  const exercises = await prisma.calculationExercise.findMany({
    where,
    take: 10,
    orderBy: { difficulty: "asc" },
  });

  return NextResponse.json(exercises);
}
