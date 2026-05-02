"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSent(true);
      if (data._dev_token) {
        setDevToken(data._dev_token);
      }
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-semibold">Reset your password</h1>
          <p className="text-text-muted text-sm mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="card space-y-5">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-full bg-accent-emerald/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-accent-emerald" />
              </div>
              <h2 className="font-semibold text-lg text-text-primary">Check your email</h2>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                If an account exists for <span className="text-text-primary font-medium">{email}</span>,
                we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-text-muted mt-3">
                The link expires in 30 minutes.
              </p>
            </div>

            {/* DEV ONLY: Show reset link for development */}
            {devToken && (
              <div className="p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
                <p className="text-[10px] text-accent-gold uppercase tracking-wider font-semibold mb-1">
                  Dev Mode — Reset Link
                </p>
                <Link
                  href={`/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                  className="text-xs text-accent-gold hover:underline break-all"
                >
                  Click here to reset password
                </Link>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => { setSent(false); setDevToken(null); }}
                className="text-sm text-accent-gold hover:text-accent-gold-light"
              >
                Try a different email
              </button>
              <Link href="/login" className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5">
            <div>
              <label htmlFor="email" className="label block mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <Link href="/login" className="text-sm text-text-muted hover:text-text-primary flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
