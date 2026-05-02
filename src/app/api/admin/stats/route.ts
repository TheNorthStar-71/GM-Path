import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { AuthorizationError } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersByRole,
    usersByStatus,
    newToday,
    newThisWeek,
    newThisMonth,
    active24h,
    active7d,
    active30d,
    recentAudit,
    signupTrend,
    dbLatencyStart,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),

    prisma.user.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.user.count({ where: { createdAt: { gte: day24h } } }),
    prisma.user.count({ where: { createdAt: { gte: day7d } } }),
    prisma.user.count({ where: { createdAt: { gte: day30d } } }),

    prisma.user.count({ where: { lastLoginAt: { gte: day24h } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: day7d } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: day30d } } }),

    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        actorId: true,
        actorEmail: true,
        reason: true,
        ipAddress: true,
        createdAt: true,
      },
    }),

    // Signups per day for last 30 days
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(\"createdAt\") as date, COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${day30d}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,

    Date.now(),
  ]);

  const dbLatencyMs = Date.now() - (dbLatencyStart as number);

  const roleMap: Record<string, number> = {};
  for (const r of usersByRole) {
    roleMap[r.role] = r._count.id;
  }

  const statusMap: Record<string, number> = {};
  for (const s of usersByStatus) {
    statusMap[s.status] = s._count.id;
  }

  const signupData = (signupTrend as unknown as { date: Date; count: bigint }[]).map(
    (row) => ({
      date: new Date(row.date).toISOString().split("T")[0],
      count: Number(row.count),
    })
  );

  return NextResponse.json({
    totalUsers,
    usersByRole: roleMap,
    usersByStatus: statusMap,
    newSignups: { today: newToday, week: newThisWeek, month: newThisMonth },
    activeUsers: { day: active24h, week: active7d, month: active30d },
    signupTrend: signupData,
    recentAudit,
    systemHealth: { dbLatencyMs },
  });
}
