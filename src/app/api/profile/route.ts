import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRating } from "@/lib/glicko2";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) return NextResponse.json(null);

  // Attach Glicko-2 display string
  const ratingDisplay = formatRating(profile.ratingPuzzle, profile.ratingPuzzleRD);
  return NextResponse.json({ ...profile, ratingPuzzleDisplay: ratingDisplay });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  // Detect primary weakness from skill self-assessment
  const skillFields = {
    opening: body.skillOpening,
    middlegame: body.skillMiddlegame,
    tactics: body.skillTactics,
    strategy: body.skillStrategy,
    endgame: body.skillEndgame,
    calculation: body.skillCalculation,
    timeManagement: body.skillTimeManagement,
  };

  const sorted = Object.entries(skillFields)
    .filter(([, v]) => v !== undefined)
    .sort(([, a], [, b]) => (a as number) - (b as number));

  const primaryWeakness = sorted[0]?.[0] || null;
  const secondaryWeakness = sorted[1]?.[0] || null;
  const strengthArea = sorted[sorted.length - 1]?.[0] || null;

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...body,
      primaryWeakness,
      secondaryWeakness,
      strengthArea,
    },
    create: {
      userId,
      ...body,
      primaryWeakness,
      secondaryWeakness,
      strengthArea,
    },
  });

  return NextResponse.json(profile);
}
