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
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));
  const search = url.searchParams.get("search")?.trim();
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const ratingMin = url.searchParams.get("ratingMin") ? parseInt(url.searchParams.get("ratingMin")!) : undefined;
  const ratingMax = url.searchParams.get("ratingMax") ? parseInt(url.searchParams.get("ratingMax")!) : undefined;
  const createdAfter = url.searchParams.get("createdAfter");
  const createdBefore = url.searchParams.get("createdBefore");

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  if (createdAfter || createdBefore) {
    where.createdAt = {};
    if (createdAfter) where.createdAt.gte = new Date(createdAfter);
    if (createdBefore) where.createdAt.lte = new Date(createdBefore);
  }

  if (ratingMin !== undefined || ratingMax !== undefined) {
    where.profile = {
      ratingPuzzle: {
        ...(ratingMin !== undefined ? { gte: ratingMin } : {}),
        ...(ratingMax !== undefined ? { lte: ratingMax } : {}),
      },
    };
  }

  const validSortFields = ["createdAt", "lastLoginAt", "name", "email", "role", "status"];
  const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [orderField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        profile: {
          select: {
            ratingPuzzle: true,
            ratingBlitz: true,
            ratingRapid: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
