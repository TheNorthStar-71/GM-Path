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
  const { openingId, color, confidence } = await req.json();

  if (!openingId || !color) {
    return NextResponse.json(
      { error: "openingId and color are required" },
      { status: 400 }
    );
  }

  const opening = await prisma.opening.findUnique({
    where: { id: openingId },
  });

  if (!opening) {
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  const repertoireItem = await prisma.openingRepertoire.upsert({
    where: {
      userId_openingId: { userId, openingId },
    },
    create: {
      userId,
      openingId,
      color,
      confidence: confidence ?? 0.5,
      lastStudied: new Date(),
    },
    update: {
      color,
      ...(confidence !== undefined && { confidence }),
      lastStudied: new Date(),
    },
  });

  return NextResponse.json(repertoireItem);
}
