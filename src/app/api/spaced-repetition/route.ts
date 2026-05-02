import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateSM2,
  type ReviewQuality,
} from "@/lib/spaced-repetition";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {
    userId,
    nextReview: { lte: new Date() },
  };

  if (type) {
    where.itemType = type;
  }

  const items = await prisma.spacedRepetitionItem.findMany({
    where,
    take: 50,
    orderBy: { nextReview: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { itemId, quality } = await req.json();

  if (!itemId || quality === undefined) {
    return NextResponse.json(
      { error: "itemId and quality are required" },
      { status: 400 }
    );
  }

  if (typeof quality !== "number" || quality < 0 || quality > 5) {
    return NextResponse.json(
      { error: "quality must be between 0 and 5" },
      { status: 400 }
    );
  }

  const item = await prisma.spacedRepetitionItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const result = calculateSM2(
    quality as ReviewQuality,
    item.easeFactor,
    item.interval,
    item.repetitions
  );

  const updated = await prisma.spacedRepetitionItem.update({
    where: { id: itemId },
    data: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReview: new Date(),
    },
  });

  return NextResponse.json(updated);
}
