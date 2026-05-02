import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent, AuditActions } from "@/lib/audit";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/;

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Both currentPassword and newPassword are required" },
      { status: 400 }
    );
  }

  if (!passwordRegex.test(newPassword)) {
    return NextResponse.json(
      { error: "Password must be 12+ characters with uppercase, lowercase, number, and special character" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, email: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Account does not use password authentication" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await logAuditEvent({
    action: AuditActions.USER_PASSWORD_CHANGED,
    targetType: "user",
    targetId: userId,
    actorId: userId,
    actorEmail: user.email ?? "unknown",
    req,
  });

  return NextResponse.json({ message: "Password updated successfully" });
}
