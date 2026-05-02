import { prisma } from "@/lib/prisma";
import { extractIp, extractUserAgent } from "@/lib/admin";

interface AuditEventParams {
  action: string;
  targetType: string;
  targetId?: string;
  actorId: string;
  actorEmail: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  req?: Request;
}

/**
 * Write an immutable audit log entry.
 * Fails silently — audit should never block the primary operation.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
        reason: params.reason,
        ipAddress: extractIp(params.req),
        userAgent: extractUserAgent(params.req),
      },
    });
  } catch {
    // Audit logging should never throw and break the main flow.
    // In production, forward to an external error tracker.
    console.error("[audit] Failed to write audit log:", params.action);
  }
}

export const AuditActions = {
  USER_CREATED: "user.created",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_STATUS_CHANGED: "user.status_changed",
  USER_SUSPENDED: "user.suspended",
  USER_UNSUSPENDED: "user.unsuspended",
  USER_BANNED: "user.banned",
  USER_DELETED: "user.deleted",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_SESSIONS_CLEARED: "user.sessions_cleared",
  USER_EMAIL_CHANGED: "user.email_changed",
  ADMIN_LOGIN: "admin.login",
  ADMIN_ACTION: "admin.action",
} as const;
