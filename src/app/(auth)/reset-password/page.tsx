"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Target, Eye, EyeOff, CheckCircle2, AlertTriangle, Check, X, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isPasswordValid = useMemo(() => {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  }, [password]);

  const requirements = useMemo(() => [
    { met: password.length >= 12, label: "12+ characters" },
    { met: /[A-Z]/.test(password), label: "Uppercase (A-Z)" },
    { met: /[a-z]/.test(password), label: "Lowercase (a-z)" },
    { met: /\d/.test(password), label: "Number (0-9)" },
    { met: /[^a-zA-Z0-9]/.test(password), label: "Special char" },
  ], [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isPasswordValid || password !== confirmPassword) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="card text-center py-8">
        <AlertTriangle className="w-8 h-8 text-accent-rose mx-auto mb-3" />
        <h2 className="font-semibold text-lg mb-2">Invalid Reset Link</h2>
        <p className="text-sm text-text-secondary mb-4">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-accent-gold hover:text-accent-gold-light text-sm">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card text-center py-8">
        <div className="w-12 h-12 rounded-full bg-accent-emerald/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-accent-emerald" />
        </div>
        <h2 className="font-semibold text-lg mb-2">Password Reset</h2>
        <p className="text-sm text-text-secondary mb-4">
          Your password has been updated. All existing sessions have been cleared.
        </p>
        <Link href="/login" className="btn-primary inline-flex">
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {error && (
        <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-lg px-4 py-3 text-sm text-accent-rose flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p>{error}</p>
            {error.includes("expired") && (
              <Link href="/forgot-password" className="underline text-xs mt-1 block">
                Request a new link
              </Link>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-text-secondary">
        Create a new password for <span className="text-text-primary font-medium">{email}</span>
      </p>

      <div>
        <label htmlFor="password" className="label block mb-1.5">New Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pr-10"
            placeholder="Create a strong password"
            autoComplete="new-password"
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
        {password && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {requirements.map((req) => (
              <div key={req.label} className="flex items-center gap-1">
                {req.met ? <Check className="w-3 h-3 text-accent-emerald" /> : <X className="w-3 h-3 text-text-muted" />}
                <span className={`text-[10px] ${req.met ? "text-accent-emerald" : "text-text-muted"}`}>{req.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm" className="label block mb-1.5">Confirm Password</label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-accent-rose mt-1">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !isPasswordValid || password !== confirmPassword}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      <Link href="/login" className="text-sm text-text-muted hover:text-text-primary flex items-center justify-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-xl font-semibold">Set new password</h1>
          <p className="text-text-muted text-sm mt-1">
            Choose a strong password for your account
          </p>
        </div>

        <Suspense fallback={
          <div className="card py-8 text-center">
            <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
