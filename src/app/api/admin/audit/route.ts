import { NextResponse } from "next/server";
import { requireAdmin, AuthorizationError } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const action = url.searchParams.get("action");
  const targetId = url.searchParams.get("targetId");
  const actorId = url.searchParams.get("actorId");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const where: Prisma.AuditLogWhereInput = {};

  if (action) where.action = action;
  if (targetId) where.targetId = targetId;
  if (actorId) where.actorId = actorId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        actorId: true,
        actorEmail: true,
        oldValue: true,
        newValue: true,
        reason: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        targetUser: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
