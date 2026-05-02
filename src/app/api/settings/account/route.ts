import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent, AuditActions } from "@/lib/audit";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: { password?: string; confirmation?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body required" }, { status: 400 });
  }

  const { password, confirmation } = body;

  if (confirmation !== "DELETE MY ACCOUNT") {
    return NextResponse.json(
      { error: "You must type 'DELETE MY ACCOUNT' to confirm" },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { error: "Password is required to delete your account" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, email: true, role: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Cannot verify identity" }, { status: 400 });
  }

  if (user.role === "super_admin") {
    return NextResponse.json(
      { error: "Super admin accounts cannot be self-deleted. Contact another super admin." },
      { status: 403 }
    );
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
  }

  await logAuditEvent({
    action: AuditActions.USER_DELETED,
    targetType: "user",
    targetId: userId,
    actorId: userId,
    actorEmail: user.email ?? "unknown",
    reason: "Self-deletion via settings",
    req,
  });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({
    message: "Account deleted successfully",
    dataRetention: "Your account and all associated training data have been permanently removed. Audit logs referencing your actions are retained for security purposes.",
  });
}
