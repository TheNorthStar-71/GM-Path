import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ITEM_TYPES = [
  "puzzle",
  "opening_line",
  "endgame_position",
  "calculation",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { itemType, itemId } = await req.json();

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType and itemId are required" },
      { status: 400 }
    );
  }

  if (!VALID_ITEM_TYPES.includes(itemType)) {
    return NextResponse.json(
      { error: `itemType must be one of: ${VALID_ITEM_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const item = await prisma.spacedRepetitionItem.upsert({
    where: {
      userId_itemType_itemId: { userId, itemType, itemId },
    },
    create: {
      userId,
      itemType,
      itemId,
    },
    update: {},
  });

  return NextResponse.json(item);
}
