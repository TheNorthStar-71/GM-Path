"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
  AlertTriangle,
  Zap,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Gauge,
  LineChart,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

/* ── Flame SVG (replaces emoji) ───────────────────────── */

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-4.97 0-8-3.03-8-7 0-2.45 1.3-4.68 2.26-5.99a1 1 0 011.67.13c.47.8.9 1.24 1.28 1.45C9.5 8.56 11 5 11 2a1 1 0 011.72-.69C16.08 4.6 20 9.2 20 16c0 3.97-3.03 7-8 7z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  );
}

/* ── Types ────────────────────────────────────────────────── */

interface DashboardTask {
  id: string;
  category: string;
  title: string;
  description: string | null;
  duration: number;
  completed: boolean;
  order: number;
  day: number;
}

interface DashboardMistake {
  id: string;
  category: string;
  subcategory: string | null;
  explanation: string | null;
  moveNumber: number;
}

interface WeaknessPriority {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  score: number;
  description: string;
  trainNowLink: string;
  sources: string[];
}

interface WeaknessReport {
  priorities: WeaknessPriority[];
  overallScore: number;
  recommendations: string[];
}

interface DashboardData {
  profile: {
    ratingPuzzle: number;
    ratingRapid: number | null;
    ratingBlitz: number | null;
    primaryWeakness: string | null;
    secondaryWeakness: string | null;
  };
  tasks: DashboardTask[];
  dueReviews: number;
  recentMistakes: DashboardMistake[];
  latestProgress: { streakDays: number | null } | null;
  puzzlesToday: number;
  streakDays: number;
  bottleneckExplanation: string;
  skills: Record<string, number>;
}

/* ── Helpers ──────────────────────────────────────────────── */

const challengeCopy = [
  "Master a key weakness in 20 minutes",
  "Ready to get sharper?",
  "Time to build a skill that matters",
  "Small steps, big gains",
  "Every move counts toward mastery",
];

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getStreakMessage(streak: number, missedYesterday: boolean): string {
  if (missedYesterday) return "Missed yesterday? No worries, let's get back on track.";
  if (streak >= 14) return `${streak}-day streak — you're on fire.`;
  if (streak >= 7) return `${streak}-day streak. Don't break it today.`;
  if (streak > 0) return `${streak}-day streak. Keep it up.`;
  return "Let's start building a streak.";
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    tactics: "Tactics",
    calculation: "Calculation",
    endgame: "Endgames",
    opening: "Openings",
    middlegame: "Strategy",
    strategy: "Positional Play",
    timeManagement: "Time Management",
    game_review: "Game Review",
    model_games: "Model Games",
  };
  return labels[cat] || cat.replace(/_/g, " ");
}

function mistakeCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    tactical_blindness: "Tactical Blindness",
    calculation_failure: "Calculation Failure",
    opening_ignorance: "Opening Ignorance",
    positional_misunderstanding: "Positional Misjudgment",
    endgame_failure: "Endgame Failure",
    time_management: "Time Management",
    psychological_tilt: "Psychological Tilt",
    conversion_failure: "Conversion Failure",
    defensive_failure: "Defensive Failure",
  };
  return labels[cat] || cat.replace(/_/g, " ");
}

function categoryLink(cat: string): string {
  const links: Record<string, string> = {
    tactics: "/tactics",
    calculation: "/calculation",
    endgame: "/endgames",
    opening: "/openings",
    middlegame: "/middlegame",
    strategy: "/middlegame",
    timeManagement: "/settings",
  };
  return links[cat] || "/tactics";
}

function taskAccentColor(category: string): string {
  const colors: Record<string, string> = {
    tactics: "#38BDF8",
    calculation: "#8B5CF6",
    opening: "#3B82F6",
    endgame: "#22C55E",
    middlegame: "#F0B429",
    strategy: "#F0B429",
  };
  return colors[category] || "rgba(255,255,255,0.1)";
}

/* ── Dashboard ───────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [weaknessReport, setWeaknessReport] = useState<WeaknessReport | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          const today = new Date().getDay();
          const dayIndex = today === 0 ? 6 : today - 1;
          const todayTasks = (json.tasks as DashboardTask[]).filter(
            (t) => t.day === dayIndex
          );
          setTasks(todayTasks.length > 0 ? todayTasks : json.tasks.slice(0, 4));
        }
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();

    async function fetchWeaknesses() {
      try {
        const res = await fetch("/api/weakness-analysis");
        if (res.ok) setWeaknessReport(await res.json());
      } catch {
        // silent
      }
    }
    fetchWeaknesses();
  }, []);

  const heroMessage = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return challengeCopy[dayOfYear % challengeCopy.length];
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  const userName = session?.user?.name?.split(" ")[0] || "Player";
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const streak = data?.streakDays ?? 0;
  const streakMsg = getStreakMessage(streak, false);
  const rating = data?.profile?.ratingPuzzle ?? 0;
  const dueReviews = data?.dueReviews ?? 0;
  const puzzlesToday = data?.puzzlesToday ?? 0;

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const totalMinutes = incompleteTasks.reduce((sum, t) => sum + t.duration, 0);

  const topWeakness = weaknessReport?.priorities?.[0];
  const focusArea = topWeakness?.category
    ? categoryLabel(topWeakness.category)
    : data?.profile?.primaryWeakness
      ? categoryLabel(data.profile.primaryWeakness)
      : "General Training";

  const focusLink = topWeakness?.trainNowLink
    || (data?.profile?.primaryWeakness ? categoryLink(data.profile.primaryWeakness) : "/tactics");

  // Mistake aggregation
  const mistakeCounts = (data?.recentMistakes ?? []).reduce(
    (acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const topMistakes = Object.entries(mistakeCounts).sort(([, a], [, b]) => b - a).slice(0, 3);

  // Skills for growth section
  const skills = data?.skills ?? {};
  const sortedSkills = Object.entries(skills)
    .map(([key, value]) => ({ key, label: categoryLabel(key), value: (value as number) * 10 }))
    .sort((a, b) => b.value - a.value);

  const strongSkills = sortedSkills.filter((s) => s.value >= 60).slice(0, 3);
  const weakSkills = sortedSkills.filter((s) => s.value < 50).slice(0, 3);

  // Week preview — 7-day pill row
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-[1440px] animate-fade-in pb-12">
      <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-accent-gold">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateStr}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            {greeting}, {userName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">{streakMsg}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
          <HeaderMetric label="Streak" value={String(streak)} icon={<FlameIcon className="h-4 w-4 text-orange-400 animate-flame-pulse" />} />
          <HeaderMetric label="Puzzle" value={String(rating)} icon={<Gauge className="h-4 w-4 text-accent-gold" />} />
          <HeaderMetric label="Due" value={String(dueReviews)} icon={<Clock className="h-4 w-4 text-accent-teal" />} />
        </div>
      </div>

      {!welcomeDismissed && streak === 0 && puzzlesToday === 0 && (
        <div className="mb-6 rounded-md border border-accent-gold/30 bg-accent-gold/[0.05] p-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Welcome to GM Path. The best place to start is your Daily Recommended Training
            below. It is automatically calibrated to your current level.
          </p>
          <button onClick={() => setWelcomeDismissed(true)} className="text-xs text-text-muted mt-3 hover:text-text-secondary transition-colors">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
        <section className="card relative overflow-hidden !p-0">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-20 md:block">
            <div className="grid h-full grid-cols-8 grid-rows-8">
              {Array.from({ length: 64 }).map((_, i) => (
                <span key={i} className={(Math.floor(i / 8) + i) % 2 === 0 ? "bg-white/[0.045]" : "bg-transparent"} />
              ))}
            </div>
          </div>
          <div className="relative grid gap-7 p-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge icon={<Target className="h-3.5 w-3.5" />}>{focusArea}</Badge>
                <Badge icon={<Clock className="h-3.5 w-3.5" />}>~{totalMinutes > 0 ? totalMinutes : 20} min</Badge>
                <Badge icon={<ShieldCheck className="h-3.5 w-3.5" />}>{topWeakness ? "Weakness-based" : "Adaptive"}</Badge>
              </div>
              <p className="text-xs font-semibold uppercase text-accent-gold">Daily focus</p>
              <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-text-primary md:text-5xl">
                {heroMessage}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Your next block prioritizes the skill with the biggest rating upside, then feeds it into review and progress tracking.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={focusLink} className="btn-primary inline-flex items-center gap-2 text-sm">
                  <PlayCircle className="h-4 w-4" />
                  Start Focus Block
                </Link>
                <Link href="/games" className="btn-secondary inline-flex items-center gap-2 text-sm">
                  Review A Game <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <ActionMetric label="Solved today" value={`+${puzzlesToday}`} icon={<CheckCircle2 className="h-4 w-4 text-accent-emerald" />} />
              <ActionMetric label="Training load" value={`${totalMinutes || 20}m`} icon={<Dumbbell className="h-4 w-4 text-accent-purple" />} />
              <ActionMetric label="Priority" value={focusArea} icon={<Crosshair className="h-4 w-4 text-accent-rose" />} />
            </div>
          </div>
        </section>

        <section className="card">
          <SectionHeader title="Week Readiness" href="/progress" />
          <div className="mt-4 grid grid-cols-7 gap-2">
            {dayNames.map((d, i) => {
              const isPast = i < todayDayIndex;
              const isToday = i === todayDayIndex;
              const dayTasks = (data?.tasks ?? []).filter((t) => t.day === i);
              const completed = dayTasks.filter((t) => t.completed).length > 0;
              const statusClass = completed
                ? "border-accent-emerald/35 bg-accent-emerald/10 text-accent-emerald"
                : isToday
                  ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold"
                  : isPast
                    ? "border-white/[0.08] bg-white/[0.03] text-text-muted"
                    : "border-white/[0.08] bg-white/[0.02] text-text-secondary";
              return (
                <div key={d} className={`flex h-20 flex-col justify-between rounded-md border p-2 ${statusClass}`}>
                  <span className="text-[10px] font-semibold">{d}</span>
                  <span className="h-1.5 rounded-full bg-current opacity-60" />
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-text-muted">
            {tasks.filter((t) => t.completed).reduce((s, t) => s + t.duration, 0)} min logged from the current plan.
          </p>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="card">
          <SectionHeader title="Today's Training Queue" href="/tactics" />
          <div className="mt-4 space-y-3">
            {incompleteTasks.length > 0 ? incompleteTasks.slice(0, 4).map((task, i) => (
              <TrainingTask key={task.id} task={task} index={i} />
            )) : (
              <EmptyState text="All done for today." />
            )}
          </div>
        </section>

        <section className="card">
          <SectionHeader title="Skill Map" href="/progress" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-text-muted">Reliable strengths</p>
              {strongSkills.length > 0 ? (
                <div className="space-y-3">
                  {strongSkills.map((skill) => <SkillMeter key={skill.key} label={skill.label} value={skill.value} tone="emerald" />)}
                </div>
              ) : <EmptyState text="Complete more sessions to map strengths." />}
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-text-muted">Rating leaks</p>
              {(weaknessReport?.priorities ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(weaknessReport?.priorities ?? []).slice(0, 3).map((p, i) => (
                    <Link key={i} href={p.trainNowLink} className="group flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-accent-gold/25 hover:bg-white/[0.045]">
                      <SeverityDot severity={p.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">{categoryLabel(p.category)}</p>
                        <p className="truncate text-xs text-text-muted">{p.description}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-accent-gold" />
                    </Link>
                  ))}
                </div>
              ) : weakSkills.length > 0 ? (
                <div className="space-y-3">
                  {weakSkills.map((skill) => <SkillMeter key={skill.key} label={skill.label} value={skill.value} tone="rose" />)}
                </div>
              ) : <EmptyState text="No major leaks detected yet." />}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="card">
          <SectionHeader title="Recent Mistake Pattern" href="/progress" />
          <div className="mt-4 space-y-3">
            {topMistakes.length > 0 ? topMistakes.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-rose/10 font-mono text-sm font-semibold text-accent-rose">{count}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{mistakeCategoryLabel(cat)}</p>
                  <p className="text-xs text-text-muted">Review this before your next rated session.</p>
                </div>
              </div>
            )) : <EmptyState text="No mistakes recorded yet." />}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Launch Pad</h3>
            <Link href="/training-paths" className="text-xs font-medium text-text-muted transition hover:text-accent-gold">All paths</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <QuickStartCard href="/tactics" icon={<Zap className="w-5 h-5" />} label="Solve Puzzles" sub={`${dueReviews} due`} desc="Tactical pattern work." />
            <QuickStartCard href="/games" icon={<BookOpen className="w-5 h-5" />} label="Review Game" sub="Upload PGN" desc="Find deciding moments." />
            <QuickStartCard href="/endgames" icon={<Target className="w-5 h-5" />} label="Endgame Lab" sub="Technique" desc="Convert and defend." />
            <QuickStartCard href="/openings" icon={<BookOpen className="w-5 h-5" />} label="Openings" sub="Playbook" desc="Plans and structures." />
            <QuickStartCard href="/calculation" icon={<Crosshair className="w-5 h-5" />} label="Calculation" sub="Deep work" desc="Candidate move discipline." />
            <QuickStartCard href="/progress" icon={<LineChart className="w-5 h-5" />} label="Development" sub="Progress" desc="Inspect the trend." />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function HeaderMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase text-text-muted">{label}</span>
        {icon}
      </div>
      <p className="mt-1 truncate font-mono text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function ActionMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-bg-primary/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {icon}
      </div>
      <p className="mt-3 truncate text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-text-secondary">
      {icon}
      {children}
    </span>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-text-muted transition hover:text-accent-gold">
        View
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] p-4 text-sm text-text-muted">
      {text}
    </div>
  );
}

function SkillMeter({ label, value, tone }: { label: string; value: number; tone: "emerald" | "rose" }) {
  const bar = tone === "emerald" ? "bg-accent-emerald" : "bg-accent-rose";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-xs text-text-muted">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function TrainingTask({ task, index }: { task: DashboardTask; index: number }) {
  return (
    <Link
      href={categoryLink(task.category)}
      className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-accent-gold/25 hover:bg-white/[0.045]"
      style={{ borderLeftColor: taskAccentColor(task.category), borderLeftWidth: 3 }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.05] font-mono text-xs text-text-muted">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{task.title}</p>
        <p className="truncate text-xs text-text-muted">{categoryLabel(task.category)} / {task.duration} min</p>
      </div>
      <ArrowRight className="h-4 w-4 text-text-muted transition group-hover:text-accent-gold" />
    </Link>
  );
}

function StatStripItem({
  href,
  icon,
  value,
  label,
  sub,
  subColor,
}: {
  href: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
  subColor: string;
}) {
  return (
    <Link href={href} className="flex-1 p-5 hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted group-hover:text-text-secondary transition-colors text-xs font-medium">{label}</span>
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-text-primary tracking-tight">{value}</p>
      <p className={`text-[11px] mt-1 ${subColor}`}>{sub}</p>
    </Link>
  );
}

function SummaryCard({
  icon,
  title,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <Link href={link} className="text-xs text-text-muted hover:text-accent-gold transition-colors">
          View all
        </Link>
      </div>
      {children}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === "critical" ? "bg-accent-rose" : severity === "high" ? "bg-orange-400" : "bg-accent-gold";
  return <span className={`w-2 h-2 rounded-full ${color} mt-1.5 shrink-0`} />;
}

function QuickStartCard({
  href,
  icon,
  label,
  sub,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  desc?: string;
}) {
  return (
    <Link href={href} className="card-hover flex flex-col gap-2 !p-4 group">
      <span className="text-text-muted group-hover:text-accent-gold transition-colors">{icon}</span>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {desc && <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>}
      <p className="text-xs text-text-muted">{sub}</p>
    </Link>
  );
}
