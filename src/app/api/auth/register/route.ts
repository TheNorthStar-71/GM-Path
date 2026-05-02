import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, REGISTER_RATE_LIMIT } from "@/lib/rate-limit";
import { logAuditEvent, AuditActions } from "@/lib/audit";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/;

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(
      passwordRegex,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rateCheck = checkRateLimit(
      `register:${ip}`,
      REGISTER_RATE_LIMIT.maxAttempts,
      REGISTER_RATE_LIMIT.windowMs
    );

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "user",
        status: "active",
        profile: {
          create: {},
        },
      },
    });

    await logAuditEvent({
      action: AuditActions.USER_CREATED,
      targetType: "user",
      targetId: user.id,
      actorId: user.id,
      actorEmail: email,
      newValue: { name, email, role: "user" },
      req,
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
