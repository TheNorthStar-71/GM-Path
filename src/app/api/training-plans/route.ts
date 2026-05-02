import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyPlan } from "@/lib/training-plan";
import type { WeaknessProfile } from "@/lib/training-plan";

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

async function createPlanForUser(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  const rating = profile.ratingRapid ?? profile.ratingBlitz ?? profile.ratingPuzzle;

  const weaknesses: WeaknessProfile = {
    tactical: profile.skillTactics * 10,
    calculation: profile.skillCalculation * 10,
    endgame: profile.skillEndgame * 10,
    opening: profile.skillOpening * 10,
    positional: profile.skillStrategy * 10,
    timeManagement: profile.skillTimeManagement * 10,
  };

  const tasks = generateWeeklyPlan(rating, profile.hoursPerWeek, weaknesses);
  const monday = getMonday(new Date());

  const plan = await prisma.trainingPlan.create({
    data: {
      userId,
      weekOf: monday,
      tasks: {
        create: tasks.map((t) => ({
          day: t.day,
          category: t.category,
          title: t.title,
          description: t.description,
          duration: t.duration,
          order: t.order,
        })),
      },
    },
    include: {
      tasks: { orderBy: [{ day: "asc" }, { order: "asc" }] },
    },
  });

  return plan;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const monday = getMonday(new Date());

  let plan = await prisma.trainingPlan.findFirst({
    where: {
      userId,
      weekOf: { lte: monday },
    },
    orderBy: { weekOf: "desc" },
    include: {
      tasks: { orderBy: [{ day: "asc" }, { order: "asc" }] },
    },
  });

  if (!plan) {
    plan = await createPlanForUser(userId);

    if (!plan) {
      return NextResponse.json(
        { error: "Profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(plan);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const monday = getMonday(new Date());

  const existing = await prisma.trainingPlan.findFirst({
    where: { userId, weekOf: monday },
  });

  if (existing) {
    await prisma.trainingTask.deleteMany({ where: { planId: existing.id } });
    await prisma.trainingPlan.delete({ where: { id: existing.id } });
  }

  const plan = await createPlanForUser(userId);

  if (!plan) {
    return NextResponse.json(
      { error: "Profile not found. Complete onboarding first." },
      { status: 404 }
    );
  }

  return NextResponse.json(plan, { status: 201 });
}
