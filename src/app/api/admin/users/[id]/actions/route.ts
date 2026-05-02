import { NextResponse } from "next/server";
import { requireAdmin, AuthorizationError } from "@/lib/admin";
import { logAuditEvent, AuditActions } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
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
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent actions on super_admins by non-super-admins
  if (user.role === "super_admin" && admin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Cannot perform actions on super admin accounts" },
      { status: 403 }
    );
  }

  switch (action) {
    case "suspend": {
      const { reason, duration } = body;
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for suspension" }, { status: 400 });
      }

      const durationMap: Record<string, number> = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      };

      const durationMs = durationMap[duration] || durationMap["7d"];
      const suspendedUntil = new Date(Date.now() + durationMs);

      await prisma.user.update({
        where: { id },
        data: {
          status: "suspended",
          suspendedAt: new Date(),
          suspendedUntil,
          suspendReason: reason,
        },
      });

      await logAuditEvent({
        action: AuditActions.USER_SUSPENDED,
        targetType: "user",
        targetId: id,
        actorId: admin.id,
        actorEmail: admin.email ?? "unknown",
        oldValue: { status: user.status },
        newValue: { status: "suspended", duration, suspendedUntil },
        reason,
        req,
      });

      return NextResponse.json({ message: "User suspended", suspendedUntil });
    }

    case "ban": {
      const { reason } = body;
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for banning" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id },
        data: {
          status: "banned",
          role: "banned",
          bannedAt: new Date(),
          banReason: reason,
        },
      });

      await logAuditEvent({
        action: AuditActions.USER_BANNED,
        targetType: "user",
        targetId: id,
        actorId: admin.id,
        actorEmail: admin.email ?? "unknown",
        oldValue: { status: user.status, role: user.role },
        newValue: { status: "banned", role: "banned" },
        reason,
        req,
      });

      return NextResponse.json({ message: "User banned" });
    }

    case "unsuspend": {
      await prisma.user.update({
        where: { id },
        data: {
          status: "active",
          suspendedAt: null,
          suspendedUntil: null,
          suspendReason: null,
        },
      });

      await logAuditEvent({
        action: AuditActions.USER_UNSUSPENDED,
        targetType: "user",
        targetId: id,
        actorId: admin.id,
        actorEmail: admin.email ?? "unknown",
        oldValue: { status: user.status },
        newValue: { status: "active" },
        req,
      });

      return NextResponse.json({ message: "User unsuspended" });
    }

    case "reset-password": {
      const tempPassword = crypto.randomBytes(12).toString("base64url");
      const hashed = await bcrypt.hash(tempPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { passwordHash: hashed },
      });

      await logAuditEvent({
        action: AuditActions.USER_PASSWORD_RESET,
        targetType: "user",
        targetId: id,
        actorId: admin.id,
        actorEmail: admin.email ?? "unknown",
        reason: "Admin-initiated password reset",
        req,
      });

      return NextResponse.json({
        message: "Password reset",
        tempPassword,
      });
    }

    case "force-logout": {
      await prisma.session.deleteMany({ where: { userId: id } });

      await logAuditEvent({
        action: AuditActions.USER_SESSIONS_CLEARED,
        targetType: "user",
        targetId: id,
        actorId: admin.id,
        actorEmail: admin.email ?? "unknown",
        reason: "Admin forced logout",
        req,
      });

      return NextResponse.json({ message: "All sessions cleared" });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
