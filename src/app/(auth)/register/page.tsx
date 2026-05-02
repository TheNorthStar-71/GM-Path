"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, Eye, EyeOff, Check, X } from "lucide-react";

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = useMemo(() => {
    const hasLength = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const noSequential = !/(.)\1{2,}/.test(password) && !/(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def)/.test(password.toLowerCase());
    const passed = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial, noSequential].filter(Boolean).length;
    const strength = passed <= 2 ? "Weak" : passed <= 3 ? "Fair" : passed <= 4 ? "Good" : passed === 5 ? "Strong" : "Excellent";
    const color = passed <= 2 ? "bg-accent-rose" : passed <= 3 ? "text-yellow-400" : passed <= 4 ? "bg-accent-gold" : "bg-accent-emerald";
    const barColor = passed <= 2 ? "bg-accent-rose" : passed <= 3 ? "bg-yellow-400" : passed <= 4 ? "bg-accent-gold" : "bg-accent-emerald";
    return { hasLength, hasUpper, hasLower, hasNumber, hasSpecial, noSequential, passed, strength, color, barColor };
  }, [password]);

  if (!password) return null;

  const requirements = [
    { met: checks.hasLength, label: "12+ characters" },
    { met: checks.hasUpper, label: "Uppercase letter (A-Z)" },
    { met: checks.hasLower, label: "Lowercase letter (a-z)" },
    { met: checks.hasNumber, label: "Number (0-9)" },
    { met: checks.hasSpecial, label: "Special character (!@#$...)" },
    { met: checks.noSequential, label: "No repeated/sequential characters" },
  ];

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                i <= Math.ceil(checks.passed * (5 / 6)) ? checks.barColor : "bg-bg-tertiary"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          checks.passed <= 2 ? "text-accent-rose" : checks.passed <= 3 ? "text-yellow-400" : checks.passed <= 4 ? "text-accent-gold" : "text-accent-emerald"
        }`}>
          {checks.strength}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5">
            {req.met ? (
              <Check className="w-3 h-3 text-accent-emerald flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-text-muted flex-shrink-0" />
            )}
            <span className={`text-[11px] ${req.met ? "text-accent-emerald" : "text-text-muted"}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPasswordValid = useMemo(() => {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    );
  }, [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet the security requirements.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please log in manually.");
        setLoading(false);
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Something went wrong");
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
          <h1 className="text-xl font-semibold">Begin your path</h1>
          <p className="text-text-muted text-sm mt-1">Set up your training profile</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-lg px-4 py-3 text-sm text-accent-rose">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="label block mb-1.5">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>

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
            <label htmlFor="password" className="label block mb-1.5">Password</label>
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
            <PasswordStrengthMeter password={password} />
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-[11px] text-text-muted text-center leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-gold hover:text-accent-gold-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
