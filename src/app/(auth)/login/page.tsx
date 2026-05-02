"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (locked) return;

    setLoading(true);

    // Check rate limit before attempting login
    try {
      const checkRes = await fetch("/api/auth/login-check", { method: "POST" });
      if (checkRes.status === 429) {
        const data = await checkRes.json();
        setLocked(true);
        setLockoutMinutes(Math.ceil(data.retryAfterMs / 60000));
        setError(data.message);
        setLoading(false);
        return;
      }
    } catch {
      // If rate limit check fails, proceed with login attempt
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error.includes("banned")) {
        setError("This account has been banned. Contact support for assistance.");
      } else if (result.error.includes("suspended")) {
        setError("This account is suspended. Contact support for assistance.");
      } else {
        setError("Invalid email or password");
      }
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-gold rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-bg-primary" />
            </div>
            <span className="font-display text-2xl font-bold">GM Path</span>
          </Link>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-text-muted text-sm mt-1">Continue your training</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
              locked
                ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                : "bg-accent-rose/10 border border-accent-rose/20 text-accent-rose"
            }`}>
              {locked ? (
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p>{error}</p>
                {locked && lockoutMinutes > 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Try again in ~{lockoutMinutes} minute{lockoutMinutes > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="label block mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="label">Password</label>
              <Link href="/forgot-password" className="text-xs text-accent-gold hover:text-accent-gold-light">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || locked}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : locked ? "Account locked" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          New here?{" "}
          <Link href="/register" className="text-accent-gold hover:text-accent-gold-light">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
