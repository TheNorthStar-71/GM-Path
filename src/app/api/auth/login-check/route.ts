import { NextResponse } from "next/server";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const result = checkRateLimit(
    `login:${ip}`,
    LOGIN_RATE_LIMIT.maxAttempts,
    LOGIN_RATE_LIMIT.windowMs
  );

  if (!result.allowed) {
    return NextResponse.json(
      {
        locked: true,
        retryAfterMs: result.retryAfterMs,
        message: "Too many login attempts. Please try again later.",
      },
      { status: 429 }
    );
  }

  return NextResponse.json({ locked: false, remaining: result.remaining });
}
