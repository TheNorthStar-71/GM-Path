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
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════
          HERO: Greeting
         ═══════════════════════════════════════════════════════════ */}
      <div className="pt-1 space-y-1">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-text-primary tracking-tight">
          {greeting}, <span className="text-accent-gold">{userName}</span>
        </h1>
        <p className="text-text-secondary text-sm">
          {dateStr} &mdash; {streakMsg}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          WELCOME STATE
         ═══════════════════════════════════════════════════════════ */}
      {!welcomeDismissed && streak === 0 && puzzlesToday === 0 && (
        <div className="p-5 rounded-xl" style={{ border: "1px solid rgba(240,180,41,0.3)" }}>
          <p className="text-sm text-text-secondary leading-relaxed">
            Welcome to GM Path. The best place to start is your Daily Recommended Training
            below — it is automatically calibrated to your current level.
          </p>
          <button onClick={() => setWelcomeDismissed(true)} className="text-xs text-text-muted mt-3 hover:text-text-secondary transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STAT STRIP — single row with vertical dividers
         ═══════════════════════════════════════════════════════════ */}
      <div className="card flex items-stretch divide-x divide-white/[0.06] !p-0 overflow-hidden">
        <StatStripItem
          href="/progress"
          icon={<FlameIcon className="w-5 h-5 text-orange-400 animate-flame-pulse" />}
          value={String(streak)}
          label="Training Streak"
          sub="consecutive days of practice"
          subColor="text-accent-emerald"
        />
        <StatStripItem
          href="/tactics"
          icon={<TrophyIcon className="w-5 h-5 text-accent-gold" />}
          value={String(rating)}
          label="Puzzle Strength"
          sub="your current tactical level"
          subColor="text-accent-teal"
        />
        <StatStripItem
          href="/progress"
          icon={<TrendingUp className="w-5 h-5 text-accent-emerald" />}
          value={`+${puzzlesToday}`}
          label="Completed Today"
          sub="puzzles solved this session"
          subColor="text-accent-emerald"
        />
        <StatStripItem
          href="/tactics"
          icon={<Clock className="w-5 h-5 text-accent-teal" />}
          value={String(dueReviews)}
          label="Opening Reviews"
          sub="lines ready to be tested"
          subColor={dueReviews > 0 ? "text-accent-gold" : "text-accent-emerald"}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DAILY CHALLENGE CARD
         ═══════════════════════════════════════════════════════════ */}
      <div className="relative card !p-0 overflow-hidden" style={{ borderLeft: "4px solid #F0B429" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/[0.04] to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8 space-y-4">
          <p className="text-[10px] font-semibold text-accent-gold uppercase tracking-[0.18em]">
            Today&apos;s Recommended Training
          </p>

          <h2 className="font-display text-xl md:text-2xl font-semibold text-text-primary leading-snug italic">
            &ldquo;{heroMessage}&rdquo;
          </h2>
          <p className="text-xs text-text-muted mt-2">
            Recommended because this is your weakest area. Consistent work here will improve your overall game faster than anything else.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-text-secondary">
              <Target className="w-3.5 h-3.5 text-accent-gold" />
              {focusArea}
              {topWeakness && <span className="text-text-muted">(weakest)</span>}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-text-secondary">
              Medium
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-text-secondary">
              <Clock className="w-3.5 h-3.5" />
              ~{totalMinutes > 0 ? totalMinutes : 20} min
            </span>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href={focusLink}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Start Training <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="btn-ghost text-sm"
            >
              Choose Different
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          WEEK AT A GLANCE — 7-day pill row
         ═══════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Your Week</h3>
          <Link href="/progress" className="text-xs text-text-muted hover:text-accent-gold transition-colors">
            View calendar
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {dayNames.map((d, i) => {
            const isPast = i < todayDayIndex;
            const isToday = i === todayDayIndex;
            const dayTasks = (data?.tasks ?? []).filter((t) => t.day === i);
            const completed = dayTasks.filter((t) => t.completed).length > 0;

            let pillStyle = "bg-white/[0.04] text-text-muted";
            if (isPast && completed) pillStyle = "bg-accent-gold/20 text-accent-gold";
            else if (isPast && !completed) pillStyle = "bg-white/[0.04] text-text-muted";
            if (isToday) pillStyle = "ring-1 ring-accent-gold/40 text-text-primary bg-white/[0.06]";

            return (
              <div key={d} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] text-text-muted font-medium">{d}</span>
                <div
                  className={`w-full h-2.5 rounded-full transition-all ${pillStyle}`}
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-text-muted mt-3">
          {tasks.filter((t) => t.completed).reduce((s, t) => s + t.duration, 0)} min this week
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          YOUR LEARNING PATH
         ═══════════════════════════════════════════════════════════ */}
      <div className="card">
        <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.18em] mb-4">YOUR LEARNING PATH</h3>
        <div className="flex items-center gap-0">
          {[
            { label: "Foundations", stage: 1 },
            { label: "Pattern Recognition", stage: 2 },
            { label: "Opening Principles", stage: 3 },
            { label: "Endgame Technique", stage: 4 },
            { label: "Complete Player", stage: 5 },
          ].map((s, i) => {
            const currentStage = rating < 800 ? 1 : rating < 1200 ? 2 : rating < 1500 ? 3 : rating < 1800 ? 4 : 5;
            const isActive = s.stage === currentStage;
            const isCompleted = s.stage < currentStage;
            const remaining = Math.max(0, s.stage * 50 - (puzzlesToday + (streak * 5)));
            return (
              <div key={s.stage} className="flex items-center flex-1 group">
                <div className="flex flex-col items-center relative">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      isCompleted ? "bg-accent-gold" : isActive ? "bg-accent-gold ring-4 ring-accent-gold/20" : "bg-white/10"
                    }`}
                    title={isCompleted ? "Completed" : `Complete ${remaining} more exercises to reach this stage.`}
                  />
                  <span className={`text-[10px] mt-2 text-center leading-tight ${isActive ? "text-accent-gold font-medium" : "text-text-muted"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 4 && <div className={`flex-1 h-px mx-1 ${isCompleted ? "bg-accent-gold" : "bg-white/10"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2-COLUMN SUMMARY GRID — always visible, compact
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Growth Areas */}
        <SummaryCard
          icon={<ArrowUpRight className="w-4 h-4 text-accent-emerald" />}
          title="Biggest Growth Areas"
          link="/progress"
        >
          {strongSkills.length > 0 ? (
            <div className="space-y-3">
              {strongSkills.map((skill) => (
                <div key={skill.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{skill.label}</span>
                    <span className="font-mono text-xs text-text-muted">{Math.round(skill.value)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-accent-emerald/70 rounded-full transition-all duration-500"
                      style={{ width: `${skill.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Complete more training to track growth.</p>
          )}
        </SummaryCard>

        {/* Focus Areas */}
        <SummaryCard
          icon={<Crosshair className="w-4 h-4 text-accent-rose" />}
          title="Areas to Focus On"
          link="/progress"
        >
          {(weaknessReport?.priorities ?? []).length > 0 ? (
            <div className="space-y-3">
              {(weaknessReport?.priorities ?? []).slice(0, 2).map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <SeverityDot severity={p.severity} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary font-medium capitalize">{categoryLabel(p.category)}</span>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{p.description}</p>
                  </div>
                  <Link href={p.trainNowLink} className="text-xs text-accent-gold hover:text-accent-gold-light font-medium shrink-0">
                    Train
                  </Link>
                </div>
              ))}
            </div>
          ) : weakSkills.length > 0 ? (
            <div className="space-y-3">
              {weakSkills.map((skill) => (
                <div key={skill.key} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{skill.label}</span>
                  <Link href={categoryLink(skill.key)} className="text-xs text-accent-gold font-medium">
                    Train
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Looking good so far.</p>
          )}
        </SummaryCard>

        {/* Mistake Patterns */}
        <SummaryCard
          icon={<AlertTriangle className="w-4 h-4 text-accent-gold" />}
          title="Recent Mistakes"
          link="/progress"
        >
          {topMistakes.length > 0 ? (
            <div className="space-y-2.5">
              {topMistakes.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md bg-accent-rose/10 flex items-center justify-center text-xs font-mono font-semibold text-accent-rose">
                    {count}
                  </span>
                  <span className="text-sm text-text-secondary">{mistakeCategoryLabel(cat)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No mistakes recorded yet.</p>
          )}
        </SummaryCard>

        {/* Today's Training Plan */}
        <SummaryCard
          icon={<BookOpen className="w-4 h-4 text-accent-teal" />}
          title="Today's Training"
          link="/tactics"
        >
          {incompleteTasks.length > 0 ? (
            <div className="space-y-2.5">
              {incompleteTasks.slice(0, 3).map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{
                    borderLeft: `3px solid ${taskAccentColor(task.category)}`,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="text-xs font-mono text-text-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{task.title}</p>
                    <p className="text-xs text-text-muted">{task.duration} min</p>
                  </div>
                  <Link href={categoryLink(task.category)} className="text-xs text-accent-gold font-medium shrink-0">
                    Start
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">All done for today.</p>
          )}
        </SummaryCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          QUICK START GRID
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Start</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickStartCard href="/tactics" icon={<Zap className="w-5 h-5" />} label="Solve Puzzles" sub={`${dueReviews} due`} desc="Find the winning move. The most efficient way to improve." />
          <QuickStartCard href="/games" icon={<BookOpen className="w-5 h-5" />} label="Review Game" sub="Upload PGN" desc="Upload a game and discover the moments that decided it." />
          <QuickStartCard href="/endgames" icon={<Target className="w-5 h-5" />} label="Endgame Lab" sub="Rook endings" desc="Master the art of converting advantages with few pieces left." />
          <QuickStartCard href="/openings" icon={<BookOpen className="w-5 h-5" />} label="Opening Playbook" sub="Study lines" desc="Learn the first moves and the strategic plans behind them." />
          <QuickStartCard href="/calculation" icon={<Crosshair className="w-5 h-5" />} label="Think Ahead" sub="Deep training" desc="Train your mind to think several moves ahead before acting." />
          <QuickStartCard href="/progress" icon={<TrendingUp className="w-5 h-5" />} label="My Development" sub="View progress" desc="Track your improvement across every area of the game." />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

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
