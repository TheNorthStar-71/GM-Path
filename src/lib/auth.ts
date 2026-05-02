import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Server-side rate limiting on the email to prevent brute force
        const emailKey = `login:email:${credentials.email.toLowerCase()}`;
        const emailRateCheck = checkRateLimit(emailKey, LOGIN_RATE_LIMIT.maxAttempts, LOGIN_RATE_LIMIT.windowMs);
        if (!emailRateCheck.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        // Also rate-limit by IP if available
        const ip = (req?.headers as Record<string, string | undefined>)?.["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
        if (ip !== "unknown") {
          const ipRateCheck = checkRateLimit(`login:ip:${ip}`, LOGIN_RATE_LIMIT.maxAttempts * 3, LOGIN_RATE_LIMIT.windowMs);
          if (!ipRateCheck.allowed) {
            throw new Error("Too many login attempts. Please try again later.");
          }
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const isDevDemoLogin =
          process.env.NODE_ENV !== "production" &&
          normalizedEmail === "demo@gmpath.com" &&
          credentials.password === "DemoPass123!@#";

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });
        } catch (error) {
          if (isDevDemoLogin) {
            return {
              id: "dev-demo-user",
              email: "demo@gmpath.com",
              name: "Alex Fischer",
              role: "super_admin",
            };
          }
          throw error;
        }

        if (!user || !user.passwordHash) {
          if (isDevDemoLogin) {
            return {
              id: "dev-demo-user",
              email: "demo@gmpath.com",
              name: "Alex Fischer",
              role: "super_admin",
            };
          }
          await recordLoginFailure(user?.id, ip, "invalid_credentials");
          return null;
        }

        if (user.status === "banned") {
          await recordLoginFailure(user.id, ip, "account_banned");
          throw new Error("Account has been banned. Contact support.");
        }

        if (user.status === "suspended") {
          const isSuspensionExpired =
            user.suspendedUntil && new Date() > user.suspendedUntil;
          if (isSuspensionExpired) {
            await prisma.user.update({
              where: { id: user.id },
              data: { status: "active", suspendedAt: null, suspendedUntil: null, suspendReason: null },
            });
          } else {
            await recordLoginFailure(user.id, ip, "account_suspended");
            throw new Error("Account is suspended. Contact support.");
          }
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          if (isDevDemoLogin) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
          await recordLoginFailure(user.id, ip, "wrong_password");
          return null;
        }

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), lastLoginIp: ip },
          });
        } catch {
          // non-critical
        }

        try {
          await prisma.loginHistory.create({
            data: { userId: user.id, ip, success: true },
          });
        } catch {
          // non-critical
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id: string; role: string };
        u.id = token.id as string;
        u.role = (token.role as string) ?? "user";

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, role: true },
        });
        if (dbUser) {
          session.user.name = dbUser.name;
          u.role = dbUser.role;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const role = (user as { role?: string }).role;
      if (role === "super_admin" || role === "admin") {
        try {
          await prisma.auditLog.create({
            data: {
              action: "admin.login",
              targetType: "user",
              targetId: user.id,
              actorId: user.id!,
              actorEmail: user.email ?? "unknown",
            },
          });
        } catch {
          // non-critical
        }
      }
    },
  },
};

async function recordLoginFailure(
  userId: string | undefined,
  ip: string | null,
  reason: string
) {
  if (!userId) return;
  try {
    await prisma.loginHistory.create({
      data: {
        userId,
        ip,
        success: false,
        failureReason: reason,
      },
    });
  } catch {
    // non-critical
  }
}
