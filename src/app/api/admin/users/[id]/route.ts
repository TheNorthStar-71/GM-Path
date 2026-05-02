import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, canChangeRole, AuthorizationError } from "@/lib/admin";
import { logAuditEvent, AuditActions } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      lastLoginIp: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspendReason: true,
      bannedAt: true,
      banReason: true,
      profile: {
        select: {
          ratingPuzzle: true,
          ratingBlitz: true,
          ratingRapid: true,
          ratingClassical: true,
          ratingFide: true,
          goal: true,
          hoursPerWeek: true,
          improvementTrack: true,
          primaryWeakness: true,
          secondaryWeakness: true,
          strengthArea: true,
          onboardingComplete: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [
    gameCount,
    puzzleAttemptCount,
    botGameCount,
    loginHistory,
    auditEvents,
    latestProgress,
  ] = await Promise.all([
    prisma.game.count({ where: { userId: id } }),
    prisma.puzzleAttempt.count({ where: { userId: id } }),
    prisma.botGame.count({ where: { userId: id } }),
    prisma.loginHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        ip: true,
        userAgent: true,
        success: true,
        failureReason: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { targetId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        action: true,
        actorId: true,
        actorEmail: true,
        oldValue: true,
        newValue: true,
        reason: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.progressSnapshot.findFirst({
      where: { userId: id },
      orderBy: { date: "desc" },
      select: {
        streakDays: true,
        ratingPuzzle: true,
        tacticalAccuracy: true,
        calculationDepth: true,
        endgameAccuracy: true,
        openingRetention: true,
      },
    }),
  ]);

  // Don't log viewing your own profile as an audit event
  if (admin.id !== id) {
    // no audit for reads
  }

  return NextResponse.json({
    ...user,
    stats: {
      gameCount,
      puzzleAttemptCount,
      botGameCount,
    },
    progress: latestProgress,
    loginHistory,
    auditEvents,
  });
}

export async function PUT(req: Request, { params }: RouteParams) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, status: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  const auditEntries: { action: string; oldValue: unknown; newValue: unknown }[] = [];

  // Role change
  if (body.role && body.role !== user.role) {
    const roleCheck = canChangeRole(admin.role, user.role, body.role);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: roleCheck.reason }, { status: 403 });
    }

    // Extra safety: require super_admin for promoting to admin
    if (body.role === "admin" || body.role === "super_admin") {
      try {
        await requireSuperAdmin();
      } catch {
        return NextResponse.json(
          { error: "Only super admins can promote to admin role" },
          { status: 403 }
        );
      }
    }

    updates.role = body.role;
    auditEntries.push({
      action: AuditActions.USER_ROLE_CHANGED,
      oldValue: { role: user.role },
      newValue: { role: body.role },
    });
  }

  // Status change
  if (body.status && body.status !== user.status) {
    updates.status = body.status;
    auditEntries.push({
      action: AuditActions.USER_STATUS_CHANGED,
      oldValue: { status: user.status },
      newValue: { status: body.status },
    });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No changes" });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updates,
    select: { id: true, role: true, status: true, email: true },
  });

  for (const entry of auditEntries) {
    await logAuditEvent({
      action: entry.action,
      targetType: "user",
      targetId: id,
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      reason: body.reason,
      req,
    });
  }

  return NextResponse.json(updated);
}
