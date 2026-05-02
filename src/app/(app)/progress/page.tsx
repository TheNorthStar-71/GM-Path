"use client";

import { useState, useEffect, useCallback, Component, type ReactNode } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Swords,
  Crown,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { SkillBar } from "@/components/ui/skill-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tooltip as UITooltip } from "@/components/ui/tooltip";

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ProgressErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-accent-rose mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-text-muted mb-4 max-w-md text-center">
            The progress page encountered an error loading your data. This
            usually resolves by refreshing.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          {this.state.error && (
            <p className="text-xs text-text-muted mt-4 font-mono">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface ProgressSnapshot {
  date: string;
  ratingBlitz: number;
  ratingRapid: number;
  ratingPuzzle: number;
  tacticalAccuracy: number;
  calculationDepth: number;
  endgameAccuracy: number;
  openingRetention: number;
  conversionRate: number;
  defensiveSaveRate: number;
  avgCentipawnLoss: number;
  timeTroubleFreq: number;
  blunderRate: number;
  motifScores: string | Record<string, number> | null;
  trainingMinutes: number;
  tasksCompleted: number;
  streakDays: number;
}

interface MistakePattern {
  category: string;
  count: number;
}

interface PuzzleStat {
  themes: string;
  solved: number;
  total: number;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const MISTAKE_COLORS = [
  "#fb7185",
  "#f59e0b",
  "#c9a84c",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

const TIME_RANGES = ["1W", "1M", "3M", "6M", "1Y", "All"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export default function ProgressPageWrapper() {
  return (
    <ProgressErrorBoundary>
      <ProgressPageInner />
    </ProgressErrorBoundary>
  );
}

function ProgressPageInner() {
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [mistakePatterns, setMistakePatterns] = useState<MistakePattern[]>([]);
  const [puzzleStats, setPuzzleStats] = useState<PuzzleStat[]>([]);

  const fetchProgress = useCallback(async (range: TimeRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSnapshots(data.snapshots ?? []);
      setProfile(data.profile ?? null);

      // Normalize mistakePatterns: API returns Record<string, number> but we need MistakePattern[]
      const rawMistakes = data.mistakePatterns;
      if (rawMistakes && typeof rawMistakes === "object" && !Array.isArray(rawMistakes)) {
        setMistakePatterns(
          Object.entries(rawMistakes).map(([category, count]) => ({
            category,
            count: typeof count === "number" ? count : 0,
          }))
        );
      } else if (Array.isArray(rawMistakes)) {
        setMistakePatterns(
          rawMistakes.map((m: Record<string, unknown>) => ({
            category: String(m.category ?? ""),
            count: typeof m.count === "number" ? m.count : (m._count as Record<string, number>)?.category ?? 0,
          }))
        );
      } else {
        setMistakePatterns([]);
      }

      // Normalize puzzleStats: API returns { total, solved, accuracy, byTheme } but we need PuzzleStat[]
      const rawStats = data.puzzleStats;
      if (rawStats?.byTheme && typeof rawStats.byTheme === "object") {
        setPuzzleStats(
          Object.entries(rawStats.byTheme).map(([themes, stats]) => ({
            themes,
            solved: (stats as { solved: number }).solved ?? 0,
            total: (stats as { total: number }).total ?? 0,
          }))
        );
      } else if (Array.isArray(rawStats)) {
        setPuzzleStats(rawStats);
      } else {
        setPuzzleStats([]);
      }
    } catch {
      setSnapshots([]);
      setProfile(null);
      setMistakePatterns([]);
      setPuzzleStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress(timeRange);
  }, [timeRange, fetchProgress]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const latest = snapshots.at(-1);
  const first = snapshots[0];

  const ratingHistory = snapshots.map((s) => ({
    date: fmtDate(s.date),
    rating: s.ratingBlitz ?? 0,
    puzzleRating: s.ratingPuzzle ?? 0,
  }));

  const skillRadarData = latest
    ? [
        { skill: "Tactics", value: latest.tacticalAccuracy ?? 0, fullMark: 100 },
        { skill: "Calculation", value: latest.calculationDepth ?? 0, fullMark: 100 },
        { skill: "Endgame", value: latest.endgameAccuracy ?? 0, fullMark: 100 },
        { skill: "Opening", value: latest.openingRetention ?? 0, fullMark: 100 },
        { skill: "Positional", value: latest.conversionRate ?? 0, fullMark: 100 },
        {
          skill: "Time Mgmt",
          value: Math.max(0, 100 - (latest.timeTroubleFreq ?? 0)),
          fullMark: 100,
        },
      ]
    : [];

  const skillEntries = latest
    ? [
        { label: "Tactics", value: latest.tacticalAccuracy ?? 0 },
        { label: "Calculation", value: latest.calculationDepth ?? 0 },
        { label: "Endgame", value: latest.endgameAccuracy ?? 0 },
        { label: "Opening", value: latest.openingRetention ?? 0 },
        { label: "Positional", value: latest.conversionRate ?? 0 },
        { label: "Time Management", value: Math.max(0, 100 - (latest.timeTroubleFreq ?? 0)) },
      ].map((s) => ({
        ...s,
        color: s.value >= 70 ? "#F0B429" : s.value >= 40 ? "#38BDF8" : "#475569",
      }))
    : [];

  const compositeScore = skillEntries.length
    ? (skillEntries.reduce((s, e) => s + e.value, 0) / skillEntries.length).toFixed(1)
    : "0.0";
  const weakestSkill = skillEntries.length
    ? skillEntries.reduce((min, e) => (e.value < min.value ? e : min), skillEntries[0])
    : null;

  const safeMistakePatterns = Array.isArray(mistakePatterns) ? mistakePatterns : [];
  const totalMistakes = safeMistakePatterns.reduce(
    (sum, m) => sum + (m?.count ?? 0),
    0,
  );
  const mistakeData = safeMistakePatterns.map((m, i) => ({
    type: m.category ?? "unknown",
    count: m.count ?? 0,
    percentage:
      totalMistakes > 0
        ? Math.round(((m.count ?? 0) / totalMistakes) * 100)
        : 0,
    color: MISTAKE_COLORS[i % MISTAKE_COLORS.length],
  }));
  const topMistake = mistakeData[0];

  const last7 = snapshots.slice(-7);
  const trainingConsistency = last7.map((s) => ({
    day: DAY_NAMES[new Date(s.date).getDay()],
    minutes: s.trainingMinutes ?? 0,
    target: 40,
  }));
  const totalTrainingMin = trainingConsistency.reduce(
    (sum, d) => sum + d.minutes,
    0,
  );
  const daysHitTarget = trainingConsistency.filter(
    (d) => d.minutes >= d.target,
  ).length;

  const motifRetention: { motif: string; retention: number }[] = (() => {
    if (puzzleStats.length > 0) {
      return puzzleStats.map((ps) => ({
        motif: ps.themes,
        retention:
          ps.total > 0 ? Math.round((ps.solved / ps.total) * 100) : 0,
      }));
    }
    if (latest?.motifScores) {
      const scores =
        typeof latest.motifScores === "string"
          ? JSON.parse(latest.motifScores)
          : latest.motifScores;
      return Object.entries(scores as Record<string, number>).map(
        ([k, v]) => ({
          motif: k,
          retention: Math.round(v),
        }),
      );
    }
    return [];
  })();
  const motifsNeedingReview = motifRetention.filter(
    (m) => m.retention < 60,
  ).length;

  const cplTrend = snapshots.map((s, i) => ({
    game: `G${i + 1}`,
    cpl: s.avgCentipawnLoss ?? 0,
    blunders: s.blunderRate ?? 0,
  }));
  const bestCpl = cplTrend.length
    ? Math.min(...cplTrend.map((g) => g.cpl))
    : 0;
  const avgCpl = cplTrend.length
    ? (cplTrend.reduce((s, g) => s + g.cpl, 0) / cplTrend.length).toFixed(1)
    : "0.0";
  const cleanGames = cplTrend.filter((g) => g.blunders === 0).length;
  const avgBlunders = cplTrend.length
    ? (
        cplTrend.reduce((s, g) => s + g.blunders, 0) / cplTrend.length
      ).toFixed(2)
    : "0.00";
  const peakBlunders = cplTrend.length
    ? Math.max(...cplTrend.map((g) => g.blunders))
    : 0;
  const latestBlunders = cplTrend.at(-1)?.blunders ?? 0;
  const blunderReduction =
    peakBlunders > 0
      ? Math.round(((peakBlunders - latestBlunders) / peakBlunders) * 100)
      : 0;

  const timeTroubleData = snapshots.map((s, i) => ({
    week: `W${i + 1}`,
    frequency: s.timeTroubleFreq ?? 0,
  }));
  const firstTT = timeTroubleData[0]?.frequency ?? 0;
  const lastTT = timeTroubleData.at(-1)?.frequency ?? 0;
  const ttImprovement =
    firstTT > 0 ? Math.round(((lastTT - firstTT) / firstTT) * 100) : 0;

  const currentRating = latest?.ratingBlitz ?? 0;
  const currentPuzzleRating = latest?.ratingPuzzle ?? 0;
  const ratingChange =
    latest && first ? (latest.ratingBlitz ?? 0) - (first.ratingBlitz ?? 0) : 0;
  const puzzleChange =
    latest && first
      ? (latest.ratingPuzzle ?? 0) - (first.ratingPuzzle ?? 0)
      : 0;
  const currentCpl = latest?.avgCentipawnLoss ?? 0;
  const cplChange =
    latest && first
      ? (latest.avgCentipawnLoss ?? 0) - (first.avgCentipawnLoss ?? 0)
      : 0;
  const streakDays = latest?.streakDays ?? 0;
  const conversionRate = latest?.conversionRate ?? 0;
  const defensiveSaveRate = latest?.defensiveSaveRate ?? 0;
  const endgameAcc = latest?.endgameAccuracy ?? 0;
  const ratingGap = currentPuzzleRating - currentRating;

  // Performance analytics
  const totalGames = snapshots.length;
  const winCount = Math.round(totalGames * ((conversionRate || 50) / 100));
  const lossCount = Math.round(totalGames * ((100 - (defensiveSaveRate || 50)) / 100));
  const drawCount = Math.max(0, totalGames - winCount - lossCount);

  // Rating prediction (linear regression on rating data)
  const ratingVelocity = snapshots.length >= 7
    ? ((latest?.ratingBlitz ?? 0) - (snapshots[Math.max(0, snapshots.length - 8)]?.ratingBlitz ?? 0)) / 7
    : ratingChange / Math.max(snapshots.length, 1);
  const predictedRating30 = Math.round(currentRating + ratingVelocity * 30);
  const predictedRating90 = Math.round(currentRating + ratingVelocity * 90);
  const predictedRating180 = Math.round(currentRating + ratingVelocity * 180 * 0.7); // decay factor

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  const formattedCpl = Number(currentCpl).toFixed(1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your Development</h1>
          <p className="text-text-muted text-sm mt-1">
            A clear picture of where you stand and where your effort is taking you.
          </p>
        </div>
        <div className="pill-toggle">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              data-active={timeRange === range}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Stat Cards — gradient backgrounds ────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Game Rating"
          value={String(currentRating)}
          change={ratingChange}
          changeLabel="this period"
          icon={<Crown className="w-5 h-5" />}
          gradient="from-accent-gold/[0.08] to-transparent"
          iconBg="bg-accent-gold/10 text-accent-gold"
        />
        <StatCard
          label="Puzzle Rating"
          value={String(currentPuzzleRating)}
          change={puzzleChange}
          changeLabel="this period"
          icon={<Swords className="w-5 h-5" />}
          gradient="from-accent-teal/[0.06] to-transparent"
          iconBg="bg-accent-teal/10 text-accent-teal"
        />
        <StatCard
          label={<UITooltip content="Measures how closely your moves match the engine's best play. A score of 90%+ indicates very accurate chess.">Move Accuracy</UITooltip>}
          value={`${Math.max(0, Math.round(100 - currentCpl))}%`}
          change={Number((-cplChange).toFixed(1))}
          changeLabel="from start"
          icon={<Target className="w-5 h-5" />}
          gradient="from-accent-emerald/[0.06] to-transparent"
          iconBg="bg-accent-emerald/10 text-accent-emerald"
        />
        <StatCard
          label="Training Streak"
          value={`${streakDays}`}
          suffix=" days"
          icon={<Flame className="w-5 h-5" />}
          gradient="from-accent-rose/[0.06] to-transparent"
          iconBg="bg-accent-rose/10 text-accent-rose"
          staticNote="Keep it going"
        />
      </div>

      {/* ── Next Milestone ──────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.18em] mb-3">Next Milestone</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-primary font-medium">
            Puzzle Rating {Math.ceil((currentPuzzleRating + 1) / 100) * 100}
          </span>
          <span className="text-xs text-text-muted font-mono">
            {Math.ceil((currentPuzzleRating + 1) / 100) * 100 - currentPuzzleRating} points remaining
          </span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold rounded-full transition-all duration-500"
            style={{ width: `${(currentPuzzleRating % 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-muted">
          <span>{Math.floor(currentPuzzleRating / 100) * 100}</span>
          <span>{Math.ceil((currentPuzzleRating + 1) / 100) * 100}</span>
        </div>
      </div>

      {/* ── Rating Chart ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Rating Over Time
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: "#F0B429" }} />
              <span className="text-text-muted">Game Rating</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: "#38BDF8" }} />
              <span className="text-text-muted">Puzzle Rating</span>
            </span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={ratingHistory}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradientGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F0B429" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F0B429" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
                domain={["dataMin - 50", "dataMax + 50"]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="rating"
                name="Game Rating"
                stroke="#F0B429"
                strokeWidth={2}
                fill="url(#gradientGold)"
                dot={{ fill: "#F0B429", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#F0B429", strokeWidth: 2, fill: "#0F1117" }}
              />
              <Area
                type="monotone"
                dataKey="puzzleRating"
                name="Puzzle Rating"
                stroke="#38BDF8"
                strokeWidth={2}
                fill="url(#gradientBlue)"
                dot={{ fill: "#38BDF8", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#38BDF8", strokeWidth: 2, fill: "#0F1117" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Skill Radar + Skill Bars ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-lg font-semibold tracking-tight mb-6">Skill Profile</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={skillRadarData}
                cx="50%"
                cy="50%"
                outerRadius="75%"
              >
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="Skill Level"
                  dataKey="value"
                  stroke="#F0B429"
                  fill="#F0B429"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ fill: "#F0B429", r: 4, strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-text-muted">Tactics:</span> <span className="text-text-secondary">Your ability to find winning moves in positions</span></div>
            <div><span className="text-text-muted">Calculation:</span> <span className="text-text-secondary">Your capacity to think several moves ahead</span></div>
            <div><span className="text-text-muted">Openings:</span> <span className="text-text-secondary">Your familiarity with proven first-move principles</span></div>
            <div><span className="text-text-muted">Endgames:</span> <span className="text-text-secondary">Your technique in converting or defending with few pieces</span></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold tracking-tight mb-6">
            Skill Breakdown
          </h2>
          <div className="space-y-4">
            {skillEntries.map((s) => (
              <SkillBar
                key={s.label}
                label={s.label}
                value={s.value}
                color={s.color}
              />
            ))}
          </div>
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Overall Composite</span>
              <span className="font-bold text-accent-gold">
                {compositeScore} / 100
              </span>
            </div>
            {weakestSkill && (
              <p className="text-xs text-text-muted mt-2">
                Biggest gap: {weakestSkill.label} at{" "}
                {Math.round(weakestSkill.value)}%. Focus here for fastest rating
                gains.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mistake Patterns + Training Consistency ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-accent-rose" />
            <h2 className="font-display text-lg font-semibold">
              Mistake Patterns
            </h2>
            {totalMistakes > 0 && (
              <span className="badge-rose">{totalMistakes} total</span>
            )}
          </div>
          <div className="space-y-3">
            {mistakeData.map((mistake) => (
              <div key={mistake.type} className="flex items-center gap-3">
                <div className="w-32 text-sm text-text-secondary truncate flex-shrink-0">
                  {mistake.type}
                </div>
                <div className="flex-1 h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${mistake.percentage}%`,
                      backgroundColor: mistake.color,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs font-mono font-medium"
                    style={{ color: mistake.color }}
                  >
                    {mistake.count}x
                  </span>
                  <span className="text-xs text-text-muted w-8 text-right">
                    {mistake.percentage}%
                  </span>
                </div>
              </div>
            ))}
            {mistakeData.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">
                No mistake data yet
              </p>
            )}
          </div>
          {topMistake && (
            <div className="mt-5 p-3 rounded-lg bg-accent-rose/5 border border-accent-rose/10">
              <p className="text-xs text-text-secondary leading-relaxed">
                <AlertTriangle className="w-3 h-3 inline mr-1 text-accent-rose" />
                <span className="font-medium text-accent-rose">
                  Top priority:
                </span>{" "}
                {topMistake.type} accounts for {topMistake.percentage}% of your
                mistakes. Focus on reducing this pattern.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-accent-blue" />
            <h2 className="font-display text-lg font-semibold">
              Training This Week
            </h2>
            <span className="badge-blue">{totalTrainingMin} min total</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trainingConsistency}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                  unit="m"
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="minutes"
                  name="Minutes"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#c9a84c"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Daily target: 40 min</span>
            <span className="text-accent-emerald font-medium">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              {daysHitTarget} of {trainingConsistency.length} days hit target
            </span>
          </div>
        </div>
      </div>

      {/* ── Motif Retention + Conversion / Defense Rates ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-accent-gold" />
            <h2 className="font-display text-lg font-semibold">
              Motif Retention
            </h2>
          </div>
          <div className="space-y-3">
            {motifRetention.map((item) => {
              const barColor =
                item.retention >= 75
                  ? "#34d399"
                  : item.retention >= 50
                    ? "#c9a84c"
                    : "#fb7185";
              return (
                <div key={item.motif}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">
                      {item.motif}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.retention}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-mono w-8 text-right font-medium"
                      style={{ color: barColor }}
                    >
                      {item.retention}
                    </span>
                  </div>
                </div>
              );
            })}
            {motifRetention.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">
                No motif data yet
              </p>
            )}
          </div>
          {motifsNeedingReview > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-accent-gold/5 border border-accent-gold/10">
              <p className="text-xs text-text-muted">
                <Flame className="w-3 h-3 inline mr-1 text-accent-gold" />
                {motifsNeedingReview} motif
                {motifsNeedingReview !== 1 ? "s" : ""} need review to prevent
                decay
              </p>
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-accent-emerald" />
            <h2 className="font-display text-lg font-semibold">
              Conversion &amp; Defense
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <ProgressRing
                progress={conversionRate}
                size={100}
                strokeWidth={7}
                color="#34d399"
                label="Conversion"
                sublabel="From winning"
              />
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing
                progress={defensiveSaveRate}
                size={100}
                strokeWidth={7}
                color="#60a5fa"
                label="Defensive Save"
                sublabel="From losing"
              />
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing
                progress={endgameAcc}
                size={100}
                strokeWidth={7}
                color="#c9a84c"
                label="Endgame Acc."
                sublabel="Technique"
              />
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing
                progress={latest?.tacticalAccuracy ?? 0}
                size={100}
                strokeWidth={7}
                color="#a78bfa"
                label="Tactical Acc."
                sublabel="Patterns"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-bg-tertiary">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                <h3 className="text-sm font-semibold">
                  Winning Position Conversion
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Conversion rate</span>
                  <span className="text-accent-emerald font-medium">
                    {conversionRate}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Endgame accuracy</span>
                  <span className="text-text-primary font-medium">
                    {endgameAcc}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Opening retention</span>
                  <span className="text-accent-gold font-medium">
                    {latest?.openingRetention ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-bg-tertiary">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="w-4 h-4 text-accent-blue" />
                <h3 className="text-sm font-semibold">Defensive Resilience</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Defensive save rate</span>
                  <span className="text-accent-blue font-medium">
                    {defensiveSaveRate}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Avg centipawn loss</span>
                  <span className="text-text-primary font-medium">
                    {currentCpl}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Blunder rate</span>
                  <span className="text-accent-rose font-medium">
                    {latestBlunders}/game
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Performance Analytics ──────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-accent-purple" />
          <h2 className="font-display text-lg font-semibold">Performance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win/Loss/Draw Distribution */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary">Game Results Distribution</h3>
            <div className="flex rounded-full overflow-hidden h-6">
              <div className="bg-accent-emerald flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${totalGames > 0 ? (winCount / totalGames) * 100 : 33}%` }}>
                {winCount}W
              </div>
              <div className="bg-text-muted flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${totalGames > 0 ? (drawCount / totalGames) * 100 : 34}%` }}>
                {drawCount}D
              </div>
              <div className="bg-accent-rose flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${totalGames > 0 ? (lossCount / totalGames) * 100 : 33}%` }}>
                {lossCount}L
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-accent-emerald/10">
                <p className="text-lg font-bold text-accent-emerald">{totalGames > 0 ? Math.round((winCount / totalGames) * 100) : 0}%</p>
                <p className="text-[10px] text-text-muted">Win Rate</p>
              </div>
              <div className="p-2 rounded-lg bg-bg-tertiary">
                <p className="text-lg font-bold text-text-secondary">{totalGames > 0 ? Math.round((drawCount / totalGames) * 100) : 0}%</p>
                <p className="text-[10px] text-text-muted">Draw Rate</p>
              </div>
              <div className="p-2 rounded-lg bg-accent-rose/10">
                <p className="text-lg font-bold text-accent-rose">{totalGames > 0 ? Math.round((lossCount / totalGames) * 100) : 0}%</p>
                <p className="text-[10px] text-text-muted">Loss Rate</p>
              </div>
            </div>
          </div>

          {/* Rating Prediction */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary">Rating Prediction</h3>
            <p className="text-xs text-text-muted">Based on your current improvement velocity of {ratingVelocity >= 0 ? "+" : ""}{ratingVelocity.toFixed(1)} points/day</p>
            <div className="space-y-3">
              {[
                { label: "30 days", value: predictedRating30, color: "text-accent-emerald" },
                { label: "90 days", value: predictedRating90, color: "text-accent-blue" },
                { label: "6 months", value: predictedRating180, color: "text-accent-gold" },
              ].map((pred) => (
                <div key={pred.label} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                  <span className="text-sm text-text-muted">{pred.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${pred.color}`}>{pred.value}</span>
                    <span className="text-xs text-text-muted">
                      ({pred.value - currentRating >= 0 ? "+" : ""}{pred.value - currentRating})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CPL Trend + Blunder Rate ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-accent-emerald" />
              <h2 className="font-display text-lg font-semibold">
                Accuracy Trend
              </h2>
            </div>
            <span className={cplChange <= 0 ? "badge-emerald" : "badge-rose"}>
              {cplChange <= 0 ? "Improving" : "Worsening"}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cplTrend}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradientCPL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="game"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                  domain={[0, "dataMax + 10"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cpl"
                  name="Accuracy"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#gradientCPL)"
                  dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    stroke: "#34d399",
                    strokeWidth: 2,
                    fill: "#0a0a0f",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="text-text-secondary font-medium">
                Best game accuracy:
              </span>{" "}
              {Math.max(0, Math.round(100 - bestCpl))}%
            </div>
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="text-text-secondary font-medium">
                {cplTrend.length}-game avg:
              </span>{" "}
              {Math.max(0, Math.round(100 - Number(avgCpl)))}%
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-gold" />
              <h2 className="font-display text-lg font-semibold">
                Blunder Rate Trend
              </h2>
            </div>
            {blunderReduction > 0 && (
              <span className="badge-gold">-{blunderReduction}% from peak</span>
            )}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cplTrend}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="game"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2937" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="blunders"
                  name="Blunders"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                >
                  {cplTrend.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.blunders === 0
                          ? "#34d399"
                          : entry.blunders <= 1
                            ? "#c9a84c"
                            : entry.blunders <= 2
                              ? "#f59e0b"
                              : "#fb7185"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="text-text-secondary font-medium">
                Clean games:
              </span>{" "}
              {cleanGames} of {cplTrend.length}
            </div>
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="text-text-secondary font-medium">
                Avg blunders:
              </span>{" "}
              {avgBlunders}/game
            </div>
          </div>
        </div>
      </div>

      {/* ── Time Trouble Frequency ───────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent-rose" />
            <h2 className="font-display text-lg font-semibold">
              Time Trouble Frequency
            </h2>
            {ttImprovement < 0 && (
              <span className="badge-emerald">
                <TrendingDown className="w-3 h-3 mr-1" />
                Decreasing
              </span>
            )}
            {ttImprovement > 0 && (
              <span className="badge-rose">
                <TrendingUp className="w-3 h-3 mr-1" />
                Increasing
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            % of games with &lt;2 min remaining before move 30
          </p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeTroubleData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="week"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
                domain={[0, 60]}
                unit="%"
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="frequency"
                name="Time Trouble %"
                stroke="#fb7185"
                strokeWidth={2.5}
                dot={{ fill: "#fb7185", r: 4, strokeWidth: 0 }}
                activeDot={{
                  r: 6,
                  stroke: "#fb7185",
                  strokeWidth: 2,
                  fill: "#0a0a0f",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-bg-tertiary text-center">
            <p className="text-lg font-bold text-accent-rose">{firstTT}%</p>
            <p className="text-xs text-text-muted mt-0.5">Period start</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary text-center">
            <p className="text-lg font-bold text-accent-gold">{lastTT}%</p>
            <p className="text-xs text-text-muted mt-0.5">Current</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary text-center">
            <p className="text-lg font-bold text-accent-emerald">
              {ttImprovement}%
            </p>
            <p className="text-xs text-text-muted mt-0.5">Change</p>
          </div>
        </div>
      </div>

      {/* ── Weekly Summary Footer ────────────────────────────────────── */}
      <div className="card" style={{ background: "rgba(240,180,41,0.04)", borderColor: "rgba(240,180,41,0.1)" }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-accent-gold/10 flex-shrink-0">
            <Brain className="w-6 h-6 text-accent-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-accent-gold mb-2">
              Weekly Insight
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {snapshots.length === 0
                ? "Start training to see your personalized weekly insight here."
                : `Your rating ${ratingChange >= 0 ? "climbed" : "dropped"} ${Math.abs(ratingChange)} points this period${
                    cplChange < 0
                      ? ", driven by improved accuracy and fewer mistakes"
                      : ""
                  }.${
                    weakestSkill
                      ? ` ${weakestSkill.label} at ${Math.round(weakestSkill.value)}% remains your biggest growth area — targeted practice here will yield the fastest gains.`
                      : ""
                  }${
                    ratingGap > 100
                      ? ` Your puzzle rating outpaces your game rating by ${ratingGap} points, suggesting you know the patterns but struggle to apply them under pressure.`
                      : ""
                  }`}
            </p>
            <div className="flex items-center gap-3 mt-4">
              {ratingChange !== 0 && (
                <span
                  className={
                    ratingChange >= 0 ? "badge-gold" : "badge-rose"
                  }
                >
                  {ratingChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {ratingChange >= 0 ? "+" : ""}
                  {ratingChange} rating
                </span>
              )}
              {streakDays > 0 && (
                <span className="badge-emerald">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {streakDays}-day streak
                </span>
              )}
              {weakestSkill && (
                <span className="badge-rose">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {weakestSkill.label} needs work
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── StatCard component ────────────────────────────────────── */

function StatCard({
  label,
  value,
  suffix,
  change,
  changeLabel,
  invertChange,
  icon,
  gradient,
  iconBg,
  staticNote,
}: {
  label: React.ReactNode;
  value: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  invertChange?: boolean;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  staticNote?: string;
}) {
  const isPositive = invertChange ? (change ?? 0) <= 0 : (change ?? 0) >= 0;
  return (
    <div className={`card !p-5 bg-gradient-to-br ${gradient} group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <p className="font-display text-2xl font-semibold mt-1.5 text-text-primary tracking-tight">
            {value}{suffix && <span className="text-sm text-text-secondary font-normal">{suffix}</span>}
          </p>
          {change !== undefined && (
            <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${isPositive ? "text-accent-emerald" : "text-accent-rose"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change >= 0 ? "+" : ""}{change} {changeLabel}
            </p>
          )}
          {staticNote && (
            <p className="text-xs mt-1.5 font-medium text-accent-gold">{staticNote}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
