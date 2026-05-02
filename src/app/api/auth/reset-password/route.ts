import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAuditEvent, AuditActions } from "@/lib/audit";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/;

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(32),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(passwordRegex, "Password must include uppercase, lowercase, number, and special character"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token, password } = resetSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    // Find valid, unused, non-expired token for this user
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    let validToken = null;
    for (const rt of resetTokens) {
      const matches = await bcrypt.compare(token, rt.tokenHash);
      if (matches) {
        validToken = rt;
        break;
      }
    }

    if (!validToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { used: true },
      }),
      // Clear all sessions to force re-login
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await logAuditEvent({
      action: AuditActions.USER_PASSWORD_CHANGED,
      targetType: "user",
      targetId: user.id,
      actorId: user.id,
      actorEmail: user.email ?? "unknown",
      reason: "Password reset via email link",
      req,
    });

    return NextResponse.json({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Password reset failed." }, { status: 500 });
  }
}
