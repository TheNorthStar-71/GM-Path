"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Target,
  Clock,
  Trophy,
  TrendingUp,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────── */

interface Exercise {
  id: string;
  mode: string;
  fen: string;
  sideToMove: string;
  goal: string;
  difficulty: number;
  isTradeMode: boolean;
  tradeThemes: string | null;
}

interface AttemptResult {
  score: number;
  maxScore: number;
  feedback: string;
  correctAnswer?: string;
  goodPlans: { moves: string[]; summary: string; eval: number }[];
  explanation: string;
}

interface ModeStats {
  mode: string;
  totalAttempts: number;
  averageScore: number;
  perfectCount: number;
  recentAverage: number;
  trend: string;
}

type Mode = "plan" | "opponent_plan" | "trade";

/* ── Mode metadata ────────────────────────────────────── */

const modeInfo: Record<Mode, { label: string; emoji: string; description: string; skill: string; color: string }> = {
  plan: {
    label: "Plan Trainer",
    emoji: "🧠",
    description: "Create 2–3 move plans from a position",
    skill: "Strategic planning",
    color: "accent-cyan",
  },
  opponent_plan: {
    label: "Opponent Plan Trainer",
    emoji: "🔍",
    description: "Identify opponent's ideas before your own",
    skill: "Defensive awareness, prophylaxis",
    color: "accent-purple",
  },
  trade: {
    label: "To Trade or Not to Trade",
    emoji: "⚖️",
    description: "Decide whether to exchange pieces or avoid it",
    skill: "Exchanges, imbalances, endgames",
    color: "accent-gold",
  },
};

/* ── Difficulty badge ─────────────────────────────────── */

function DifficultyBadge({ level }: { level: number }) {
  const labels = ["", "Easy", "Medium", "Hard", "Advanced", "Expert"];
  const colors = ["", "text-accent-emerald", "text-yellow-400", "text-orange-400", "text-accent-rose", "text-accent-rose"];
  return (
    <span className={`text-xs font-medium ${colors[level] || "text-text-muted"}`}>
      {labels[level] || "?"} {"●".repeat(level)}{"○".repeat(5 - level)}
    </span>
  );
}

/* ── Score display ────────────────────────────────────── */

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const icon = score === max
    ? <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
    : score >= 2
      ? <CheckCircle2 className="w-5 h-5 text-accent-gold" />
      : score >= 1
        ? <AlertTriangle className="w-5 h-5 text-yellow-400" />
        : <XCircle className="w-5 h-5 text-accent-rose" />;

  const label = score === max ? "Perfect!" : score >= 2 ? "Good idea!" : score >= 1 ? "Partial credit" : "Missed the plan";
  const bg = score === max
    ? "bg-accent-emerald/10 border-accent-emerald/20"
    : score >= 2
      ? "bg-accent-gold/10 border-accent-gold/20"
      : score >= 1
        ? "bg-yellow-400/10 border-yellow-400/20"
        : "bg-accent-rose/10 border-accent-rose/20";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg}`}>
      {icon}
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{score}/{max} points</p>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */

export default function CustomModePage() {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ModeStats[]>([]);

  // Exercise state
  const [userMoves, setUserMoves] = useState<string[]>([]);
  const [tradeAnswer, setTradeAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gameFen, setGameFen] = useState<string>("");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>();
  const startTime = useRef(Date.now());

  // Load stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/custom-mode/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        // silent
      }
    }
    fetchStats();
  }, []);

  // Load exercises when mode changes
  const loadExercises = useCallback(async (mode: Mode) => {
    setLoading(true);
    setExercises([]);
    setCurrentIndex(0);
    resetExercise();
    try {
      const res = await fetch(`/api/custom-mode/exercises?mode=${mode}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises);
        if (data.exercises.length > 0) {
          setGameFen(data.exercises[0].fen);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  function resetExercise() {
    setUserMoves([]);
    setTradeAnswer(null);
    setResult(null);
    setLastMove(undefined);
    startTime.current = Date.now();
  }

  function selectMode(mode: Mode) {
    setActiveMode(mode);
    loadExercises(mode);
  }

  function goToExercise(index: number) {
    if (index < 0 || index >= exercises.length) return;
    setCurrentIndex(index);
    setGameFen(exercises[index].fen);
    resetExercise();
  }

  // Handle board move (for plan/opponent_plan modes)
  function handleMove(from: string, to: string): boolean {
    if (result) return false; // Already submitted
    if (userMoves.length >= 3) return false; // Max 3 moves

    const exercise = exercises[currentIndex];
    if (!exercise) return false;

    const chess = new Chess(gameFen);
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;

    setUserMoves((prev) => [...prev, `${from}${to}`]);
    setLastMove({ from, to });

    // After user move, auto-play opponent's reply if we have more moves to collect
    if (userMoves.length < 2) {
      // Simple opponent reply: play a random legal move
      const opponentMoves = chess.moves({ verbose: true });
      if (opponentMoves.length > 0 && !chess.isGameOver()) {
        const reply = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
        chess.move(reply);
        setGameFen(chess.fen());
        setLastMove({ from: reply.from, to: reply.to });
        return true;
      }
    }

    setGameFen(chess.fen());
    return true;
  }

  // Submit attempt
  async function submitAttempt() {
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-mode/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          userMoves: exercise.isTradeMode ? undefined : userMoves,
          userAnswer: exercise.isTradeMode ? tradeAnswer : undefined,
          timeSpentMs: Date.now() - startTime.current,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  const exercise = exercises[currentIndex];
  const canSubmit = exercise
    ? exercise.isTradeMode
      ? tradeAnswer !== null
      : userMoves.length >= 2
    : false;

  // ── Mode selector screen ──────────────────────────────

  if (!activeMode) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Custom Mode
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Advanced concept trainers. Think deeper, plan better.
          </p>
        </div>

        <div className="grid gap-4">
          {(Object.entries(modeInfo) as [Mode, typeof modeInfo.plan][]).map(([mode, info]) => {
            const modeStat = stats.find((s) => s.mode === mode);
            return (
              <button
                key={mode}
                onClick={() => selectMode(mode)}
                className="text-left bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-accent-gold/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.emoji}</span>
                      <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent-gold transition-colors">
                        {info.label}
                      </h2>
                    </div>
                    <p className="text-sm text-text-secondary">{info.description}</p>
                    <p className="text-xs text-text-muted">Primary skill: {info.skill}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent-gold transition-colors mt-1" />
                </div>

                {modeStat && modeStat.totalAttempts > 0 && (
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-subtle text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {modeStat.totalAttempts} attempts
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Avg: {modeStat.averageScore}/3
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {modeStat.trend === "improving" ? "📈 Improving" : modeStat.trend === "declining" ? "📉 Needs work" : "→ Steady"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Coming Soon</h3>
          <div className="space-y-2">
            {[
              { label: "Prophylaxis Trainer", desc: "Anticipate and prevent opponent's plans" },
              { label: "Weakness Hunting", desc: "Identify and target structural weaknesses" },
              { label: "Piece Coordination", desc: "Optimize piece placement and harmony" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                <span className="text-text-muted text-xs">— {item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Exercise runner ────────────────────────────────────

  const info = modeInfo[activeMode];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveMode(null); resetExercise(); }}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
              {info.emoji} {info.label}
            </h1>
            <p className="text-xs text-text-muted">{info.skill}</p>
          </div>
        </div>
        <div className="text-xs text-text-muted font-mono">
          {currentIndex + 1} / {exercises.length}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No exercises available for this mode yet.</p>
          <button
            onClick={() => setActiveMode(null)}
            className="text-accent-gold text-sm mt-2 hover:underline"
          >
            Go back
          </button>
        </div>
      ) : exercise ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Board */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border-subtle rounded-xl p-4 flex justify-center">
              <Chessboard
                fen={gameFen}
                orientation={exercise.sideToMove === "black" ? "black" : "white"}
                interactive={!result && !exercise.isTradeMode}
                onMove={handleMove}
                size={360}
                lastMove={lastMove}
              />
            </div>

            {/* Move history (plan modes) */}
            {!exercise.isTradeMode && userMoves.length > 0 && (
              <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                <p className="text-xs text-text-muted mb-2">Your plan ({userMoves.length}/3 moves):</p>
                <div className="flex gap-2">
                  {userMoves.map((move, i) => (
                    <span key={i} className="px-3 py-1 bg-accent-gold/10 text-accent-gold text-sm font-mono rounded-lg">
                      {i + 1}. {move}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Goal + Controls + Feedback */}
          <div className="space-y-4">

            {/* Goal card */}
            <div className="bg-bg-card border-2 border-accent-gold/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-accent-gold uppercase tracking-[0.15em]">
                  {exercise.sideToMove === "white" ? "White" : "Black"} to move
                </p>
                <DifficultyBadge level={exercise.difficulty} />
              </div>
              <p className="text-sm text-text-primary leading-relaxed font-medium">
                {exercise.goal}
              </p>
              {!exercise.isTradeMode && !result && (
                <p className="text-xs text-text-muted">
                  Play 2–3 moves on the board to show your plan.
                </p>
              )}
            </div>

            {/* Trade mode choices */}
            {exercise.isTradeMode && !result && (
              <div className="space-y-2">
                {[
                  { value: "trade", label: "Trade now", desc: "Make the exchange" },
                  { value: "avoid", label: "Avoid the trade", desc: "Keep pieces on" },
                  { value: "trade_after_improving", label: "Trade, but improve first", desc: "Exchange after preparation" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTradeAnswer(option.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      tradeAnswer === option.value
                        ? "border-accent-gold bg-accent-gold/10"
                        : "border-border-subtle bg-bg-card hover:border-accent-gold/20"
                    }`}
                  >
                    <p className={`text-sm font-medium ${tradeAnswer === option.value ? "text-accent-gold" : "text-text-primary"}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-text-muted">{option.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Submit button */}
            {!result && (
              <button
                onClick={submitAttempt}
                disabled={!canSubmit || submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {submitting ? "Analyzing..." : "Submit My Plan"}
              </button>
            )}

            {/* Feedback */}
            {result && (
              <div className="space-y-4 animate-fade-in">
                <ScoreBadge score={result.score} max={result.maxScore} />

                {/* Correct answer for trade mode */}
                {exercise.isTradeMode && result.correctAnswer && (
                  <div className="bg-bg-secondary rounded-xl p-4">
                    <p className="text-xs text-text-muted mb-1">Correct answer:</p>
                    <p className="text-sm font-medium text-accent-emerald capitalize">
                      {result.correctAnswer.replace(/_/g, " ")}
                    </p>
                  </div>
                )}

                {/* Good plans */}
                {result.goodPlans?.length > 0 && (
                  <div className="bg-bg-secondary rounded-xl p-4 space-y-2">
                    <p className="text-xs text-text-muted">Recommended plan{result.goodPlans.length > 1 ? "s" : ""}:</p>
                    {result.goodPlans.map((plan, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex gap-1.5">
                          {plan.moves.map((m, j) => (
                            <span key={j} className="px-2 py-0.5 bg-accent-emerald/10 text-accent-emerald text-xs font-mono rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-text-secondary">{plan.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coaching explanation */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-accent-gold uppercase tracking-[0.15em] mb-2">
                    Coach&apos;s Explanation
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.explanation}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {currentIndex < exercises.length - 1 ? (
                    <button
                      onClick={() => goToExercise(currentIndex + 1)}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      Next Position <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      href="/custom-mode"
                      onClick={() => { setActiveMode(null); resetExercise(); }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      Finish Session <CheckCircle2 className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => { setGameFen(exercise.fen); resetExercise(); }}
                    className="p-3 rounded-xl border border-border-subtle hover:border-accent-gold/20 transition-all text-text-muted hover:text-text-primary"
                    title="Retry"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Reset for plan mode */}
            {!result && !exercise.isTradeMode && userMoves.length > 0 && (
              <button
                onClick={() => {
                  setUserMoves([]);
                  setGameFen(exercise.fen);
                  setLastMove(undefined);
                }}
                className="w-full text-xs text-text-muted hover:text-text-primary flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset moves
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Exercise navigator dots */}
      {exercises.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => goToExercise(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-accent-gold w-4" : "bg-bg-tertiary hover:bg-text-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
