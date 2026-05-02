import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  COACH: "coach",
  PREMIUM: "premium",
  USER: "user",
  BANNED: "banned",
} as const;

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN] as const;

export const STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  BANNED: "banned",
  PENDING_VERIFICATION: "pending_verification",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Status = (typeof STATUSES)[keyof typeof STATUSES];

export interface AuthorizedUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  status: string;
}

export class AuthorizationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

/**
 * Validate that the current session user has one of the allowed roles.
 * Always fetches fresh role/status from DB (never trusts JWT alone).
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<AuthorizedUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AuthorizationError("Authentication required", 401);
  }

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  if (!user) {
    throw new AuthorizationError("User not found", 401);
  }

  if (user.status === STATUSES.BANNED) {
    throw new AuthorizationError("Account has been banned");
  }
  if (user.status === STATUSES.SUSPENDED) {
    throw new AuthorizationError("Account is suspended");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError("Insufficient permissions");
  }

  return user;
}

/**
 * Convenience wrapper: require super_admin or admin role.
 */
export async function requireAdmin(): Promise<AuthorizedUser> {
  return requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
}

/**
 * Convenience wrapper: require super_admin role only.
 */
export async function requireSuperAdmin(): Promise<AuthorizedUser> {
  return requireRole([ROLES.SUPER_ADMIN]);
}

/**
 * Check if the given role string is an admin-level role.
 */
export function isAdminRole(role: string): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/**
 * Validate role transition rules.
 * Only super_admin can promote to admin or super_admin.
 */
export function canChangeRole(
  actorRole: string,
  _currentRole: string,
  newRole: string
): { allowed: boolean; reason?: string } {
  if (newRole === ROLES.SUPER_ADMIN) {
    if (actorRole !== ROLES.SUPER_ADMIN) {
      return { allowed: false, reason: "Only super admins can create super admin accounts" };
    }
  }
  if (newRole === ROLES.ADMIN) {
    if (actorRole !== ROLES.SUPER_ADMIN) {
      return { allowed: false, reason: "Only super admins can promote users to admin" };
    }
  }
  return { allowed: true };
}

export function extractIp(req?: Request): string | undefined {
  if (!req) return undefined;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

export function extractUserAgent(req?: Request): string | undefined {
  if (!req) return undefined;
  return req.headers.get("user-agent") || undefined;
}
