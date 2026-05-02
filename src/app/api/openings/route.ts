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

  const [openings, repertoire] = await Promise.all([
    prisma.opening.findMany({
      include: { lines: true },
      orderBy: { name: "asc" },
    }),
    prisma.openingRepertoire.findMany({
      where: { userId },
    }),
  ]);

  const repertoireMap = new Map(
    repertoire.map((r) => [r.openingId, r])
  );

  const result = openings.map((opening) => {
    const rep = repertoireMap.get(opening.id);
    return {
      ...opening,
      inRepertoire: !!rep,
      confidence: rep?.confidence ?? null,
      lastStudied: rep?.lastStudied ?? null,
    };
  });

  return NextResponse.json(result);
}
