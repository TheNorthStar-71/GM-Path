import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function sanitize(input: string): string {
  return input.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" };
    return map[c] || c;
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    goal,
    hoursPerWeek,
    improvementTrack,
    age,
    tournamentExperience,
    skillOpening,
    skillMiddlegame,
    skillTactics,
    skillStrategy,
    skillEndgame,
    skillCalculation,
    skillTimeManagement,
    preferredOpeningsWhite,
    preferredOpeningsBlack,
    ratingBlitz,
    ratingRapid,
    ratingClassical,
    ratingFide,
    ratingUscf,
  } = body;

  // Sanitize and validate name/email
  const name = typeof body.name === "string" ? sanitize(body.name.trim()).slice(0, 100) : undefined;
  let email = typeof body.email === "string" ? body.email.toLowerCase().trim() : undefined;
  if (email) {
    const emailCheck = z.string().email().safeParse(email);
    if (!emailCheck.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
  }

  const profileData: Record<string, unknown> = {};
  if (goal !== undefined) profileData.goal = goal;
  if (hoursPerWeek !== undefined) profileData.hoursPerWeek = hoursPerWeek;
  if (improvementTrack !== undefined) profileData.improvementTrack = improvementTrack;
  if (age !== undefined) profileData.age = age;
  if (tournamentExperience !== undefined) profileData.tournamentExperience = tournamentExperience;
  if (skillOpening !== undefined) profileData.skillOpening = skillOpening;
  if (skillMiddlegame !== undefined) profileData.skillMiddlegame = skillMiddlegame;
  if (skillTactics !== undefined) profileData.skillTactics = skillTactics;
  if (skillStrategy !== undefined) profileData.skillStrategy = skillStrategy;
  if (skillEndgame !== undefined) profileData.skillEndgame = skillEndgame;
  if (skillCalculation !== undefined) profileData.skillCalculation = skillCalculation;
  if (skillTimeManagement !== undefined) profileData.skillTimeManagement = skillTimeManagement;
  if (preferredOpeningsWhite !== undefined) profileData.preferredOpeningsWhite = preferredOpeningsWhite;
  if (preferredOpeningsBlack !== undefined) profileData.preferredOpeningsBlack = preferredOpeningsBlack;
  if (ratingBlitz !== undefined) profileData.ratingBlitz = ratingBlitz;
  if (ratingRapid !== undefined) profileData.ratingRapid = ratingRapid;
  if (ratingClassical !== undefined) profileData.ratingClassical = ratingClassical;
  if (ratingFide !== undefined) profileData.ratingFide = ratingFide;
  if (ratingUscf !== undefined) profileData.ratingUscf = ratingUscf;

  const skillFields = {
    opening: profileData.skillOpening as number | undefined,
    middlegame: profileData.skillMiddlegame as number | undefined,
    tactics: profileData.skillTactics as number | undefined,
    strategy: profileData.skillStrategy as number | undefined,
    endgame: profileData.skillEndgame as number | undefined,
    calculation: profileData.skillCalculation as number | undefined,
    timeManagement: profileData.skillTimeManagement as number | undefined,
  };

  const sorted = Object.entries(skillFields)
    .filter(([, v]) => v !== undefined)
    .sort(([, a], [, b]) => (a as number) - (b as number));

  if (sorted.length > 0) {
    profileData.primaryWeakness = sorted[0][0];
    profileData.secondaryWeakness = sorted[1]?.[0] ?? null;
    profileData.strengthArea = sorted[sorted.length - 1][0];
  }

  const result = await prisma.$transaction(async (tx) => {
    const userData: Record<string, unknown> = {};
    if (name !== undefined) userData.name = name;
    if (email !== undefined) userData.email = email;

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: userData,
      select: { id: true, name: true, email: true, image: true },
    });

    let updatedProfile = null;
    if (Object.keys(profileData).length > 0) {
      updatedProfile = await tx.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
    } else {
      updatedProfile = await tx.userProfile.findUnique({
        where: { userId },
      });
    }

    return { ...updatedUser, profile: updatedProfile };
  });

  return NextResponse.json(result);
}
