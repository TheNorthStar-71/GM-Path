import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rateCheck = checkRateLimit(`reset:${ip}`, 3, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent." },
      { status: 200 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return the same message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Invalidate existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    // In production, send email via SendGrid/Resend/SES.
    // For now, log the token for development purposes.
    console.log(`[password-reset] Token for ${email}: ${token}`);
    console.log(`[password-reset] Reset URL: /reset-password?token=${token}&email=${encodeURIComponent(email)}`);

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
      // DEV ONLY: remove in production
      _dev_token: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch {
    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    });
  }
}
