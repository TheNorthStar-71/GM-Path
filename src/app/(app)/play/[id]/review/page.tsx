"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Loader2,
  Brain,
  Sparkles,
  Target,
  BookOpen,
  Lightbulb,
  Eye,
  EyeOff,
  Crosshair,
  Dumbbell,
  Trophy,
  TrendingDown,
  Shield,
  Swords,
  Zap,
  Crown,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BarChart2,
  Play,
  Flag,
  Minus,
} from "lucide-react";

interface BotGameMove {
  id: string;
  moveNumber: number;
  isWhiteMove: boolean;
  san: string;
  fen: string;
  evalBefore: number | null;
  evalAfter: number | null;
  evalDrop: number | null;
  bestMoveSan: string | null;
  bestMoveUci: string | null;
  classification: string | null;
  verdictLabel: string | null;
  humanExplanation: string | null;
  thinkingProcess: string | null;
  phase: string | null;
  isPlayerMove: boolean;
}

interface CriticalMoment {
  id: string;
  moveNumber: number;
  type: string;
  title: string;
  description: string;
  severity: number;
}

interface DerivedTask {
  id: string;
  moveNumber: number;
  category: string;
  title: string;
  description: string;
  completed: boolean;
}

interface BotGameData {
  id: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  userColor: string;
  botStrength: string;
  timeControl: string;
  trainingFocus: string | null;
  opening: string | null;
  analysisComplete: boolean;
  accuracy: number | null;
  avgCentipawnLoss: number | null;
  summaryVerdict: string | null;
  summaryStrengths: string | null;
  summaryWeaknesses: string | null;
  summaryLesson: string | null;
  moves: BotGameMove[];
  criticalMoments: CriticalMoment[];
  derivedTasks: DerivedTask[];
}

const CLASSIFICATION_STYLES: Record<string, { color: string; glyph: string }> = {
  brilliant:   { color: "text-cyan-400",      glyph: "!!" },
  great:       { color: "text-accent-emerald", glyph: "!" },
  good:        { color: "text-text-secondary", glyph: "" },
  interesting: { color: "text-accent-blue",    glyph: "!?" },
  book:        { color: "text-text-muted",     glyph: "" },
  inaccuracy:  { color: "text-yellow-400",     glyph: "?!" },
  mistake:     { color: "text-orange-400",     glyph: "?" },
  blunder:     { color: "text-accent-rose",    glyph: "??" },
};

const CATEGORY_ICONS: Record<string, typeof Brain> = {
  tactics:      Crosshair,
  calculation:  Brain,
  opening:      BookOpen,
  openings:     BookOpen,
  endgame:      Crown,
  endgames:     Crown,
  positional:   Target,
  strategy:     GraduationCap,
  defense:      Shield,
  attack:       Swords,
  general:      GraduationCap,
};

const TRAINING_ROUTES: Record<string, string> = {
  tactics:     "/tactics",
  calculation: "/calculation",
  opening:     "/openings",
  openings:    "/openings",
  endgame:     "/endgames",
  endgames:    "/endgames",
  strategy:    "/coach",
  positional:  "/coach",
  defense:     "/calculation",
  attack:      "/tactics",
  general:     "/coach",
};

function ClassificationBadge({ cls }: { cls: string | null }) {
  if (!cls) return null;
  const style = CLASSIFICATION_STYLES[cls] || CLASSIFICATION_STYLES.good;
  const label = cls.charAt(0).toUpperCase() + cls.slice(1);
  const bgMap: Record<string, string> = {
    brilliant:   "bg-cyan-400/10",
    great:       "bg-accent-emerald/10",
    good:        "bg-bg-tertiary",
    interesting: "bg-accent-blue/10",
    book:        "bg-bg-tertiary",
    inaccuracy:  "bg-yellow-400/10",
    mistake:     "bg-orange-400/10",
    blunder:     "bg-accent-rose/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.color} ${bgMap[cls] || "bg-bg-tertiary"}`}>
      {label}{style.glyph && ` ${style.glyph}`}
    </span>
  );
}

function severityColor(severity: number): string {
  if (severity >= 8) return "bg-accent-rose/10 text-accent-rose border-accent-rose/20";
  if (severity >= 5) return "bg-orange-400/10 text-orange-400 border-orange-400/20";
  return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
}

function EvalBar({ evalCp }: { evalCp: number | null }) {
  const clampedEval = Math.max(-500, Math.min(500, evalCp ?? 0));
  const whitePercent = 50 + (clampedEval / 500) * 50;
  const displayEval = evalCp !== null
    ? (evalCp >= 0 ? `+${(evalCp / 100).toFixed(1)}` : (evalCp / 100).toFixed(1))
    : "0.0";

  return (
    <div className="w-full h-6 rounded-md overflow-hidden relative bg-bg-tertiary border border-border-subtle">
      <div className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
        style={{ width: `${whitePercent}%`, background: "linear-gradient(90deg, #e8e6e3 0%, #d4d0c8 100%)" }}
      />
      <div className="absolute inset-y-0 right-0 transition-all duration-500 ease-out"
        style={{ width: `${100 - whitePercent}%`, background: "linear-gradient(90deg, #2a2a3e 0%, #1a1a2e 100%)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[11px] font-mono font-bold z-10 px-1.5 py-0.5 rounded ${(evalCp ?? 0) >= 0 ? "text-bg-primary" : "text-text-primary"}`}>
          {displayEval}
        </span>
      </div>
    </div>
  );
}

function accuracyColor(acc: number): string {
  if (acc >= 90) return "text-accent-emerald";
  if (acc >= 70) return "text-accent-gold";
  if (acc >= 50) return "text-orange-400";
  return "text-accent-rose";
}

// ─── Eval Graph Component ─────────────────────────────────────────────────────

function EvalGraph({
  moves,
  currentMove,
  onJumpToMove,
}: {
  moves: BotGameMove[];
  currentMove: number;
  onJumpToMove: (n: number) => void;
}) {
  const evals = [0, ...moves.map((m) => Math.max(-600, Math.min(600, m.evalAfter ?? 0)))];
  const W = 500, H = 60;
  const range = 1200;

  const pts = evals.map((v, i) => {
    const x = evals.length <= 1 ? W / 2 : (i / (evals.length - 1)) * W;
    const y = H - ((v + 600) / range) * H;
    return [x, y] as [number, number];
  });

  const zeroY = H / 2;
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");

  const whitePoly = [
    `0,${zeroY}`,
    ...pts.map(([x, y]) => `${x},${Math.min(y, zeroY)}`),
    `${W},${zeroY}`,
  ].join(" ");
  const blackPoly = [
    `0,${zeroY}`,
    ...pts.map(([x, y]) => `${x},${Math.max(y, zeroY)}`),
    `${W},${zeroY}`,
  ].join(" ");

  const curPt = pts[Math.min(currentMove, pts.length - 1)];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * moves.length);
    onJumpToMove(Math.max(0, Math.min(moves.length, idx)));
  };

  return (
    <div className="card !p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5" />
          Game Evaluation
        </h3>
        <span className="text-[10px] text-text-muted">{moves.length} moves — click to jump</span>
      </div>
      <div className="relative cursor-crosshair rounded overflow-hidden" onClick={handleClick}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full block">
          <polygon points={whitePoly} fill="rgba(232,230,227,0.12)" />
          <polygon points={blackPoly} fill="rgba(0,0,0,0.25)" />
          <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#333" strokeWidth="0.5" />
          <polyline points={polyline} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" />
          {curPt && (
            <>
              <line x1={curPt[0]} y1="0" x2={curPt[0]} y2={H} stroke="#c9a84c" strokeWidth="1" opacity="0.6" />
              <circle cx={curPt[0]} cy={curPt[1]} r="3" fill="#c9a84c" />
            </>
          )}
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-text-muted">Start</span>
        <span className="text-[9px] text-text-muted">End</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CoachReviewPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<BotGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMove, setCurrentMove] = useState(0);

  const [showCoach, setShowCoach] = useState(true);

  // Try best move mode
  const [tryBestMode, setTryBestMode] = useState(false);
  const [tryBestResult, setTryBestResult] = useState<"correct" | "wrong" | null>(null);

  const commentaryRef = useRef<HTMLDivElement>(null);
  const trainingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/bot-games/${gameId}`);
        if (!res.ok) { setError("Game not found"); setLoading(false); return; }
        const data: BotGameData = await res.json();
        setGame(data);

        if (!data.analysisComplete) {
          setAnalyzing(true);
          setLoading(false);
          try {
            const analyzeRes = await fetch(`/api/bot-games/${gameId}/analyze`, { method: "POST" });
            if (analyzeRes.ok) {
              const freshRes = await fetch(`/api/bot-games/${gameId}`);
              if (freshRes.ok) setGame(await freshRes.json());
            } else {
              setError("Analysis failed. Please try again.");
            }
          } catch {
            setError("Analysis failed. Please try again.");
          } finally {
            setAnalyzing(false);
          }
        } else {
          setLoading(false);
        }
      } catch {
        setError("Failed to load game");
        setLoading(false);
      }
    }
    fetchGame();
  }, [gameId]);

  const chess = useMemo(() => {
    if (!game) return null;
    const c = new Chess();
    try { c.loadPgn(game.pgn); } catch { return null; }
    return c;
  }, [game]);

  const pgnMoves = useMemo(() => chess?.history() ?? [], [chess]);
  const totalMoves = game?.moves?.length ?? pgnMoves.length;

  // FEN at the current review position (after move `currentMove`)
  const currentFen = useMemo(() => {
    if (currentMove === 0) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const moveData = game?.moves?.[currentMove - 1];
    if (moveData?.fen) return moveData.fen;
    if (!chess) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const c = new Chess();
    const history = chess.history();
    for (let i = 0; i < currentMove && i < history.length; i++) c.move(history[i]);
    return c.fen();
  }, [currentMove, game, chess]);

  // FEN BEFORE current move (for "try best move" mode)
  const fenBeforeCurrent = useMemo(() => {
    if (currentMove <= 1) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const prevData = game?.moves?.[currentMove - 2];
    if (prevData?.fen) return prevData.fen;
    if (!chess) return currentFen;
    const c = new Chess();
    const history = chess.history();
    for (let i = 0; i < currentMove - 1 && i < history.length; i++) c.move(history[i]);
    return c.fen();
  }, [currentMove, game, chess, currentFen]);

  const lastMoveInfo = useMemo(() => {
    if (currentMove === 0 || !chess) return undefined;
    const history = chess.history({ verbose: true });
    const mv = history[currentMove - 1];
    return mv ? { from: mv.from, to: mv.to } : undefined;
  }, [currentMove, chess]);

  const currentMoveData = useMemo((): BotGameMove | null => {
    if (!game?.moves || currentMove === 0) return null;
    return game.moves[currentMove - 1] ?? null;
  }, [game, currentMove]);

  const currentEval = useMemo((): number | null => {
    if (!game?.moves || currentMove === 0) return 0;
    const mv = game.moves[currentMove - 1];
    return mv?.evalAfter ?? null;
  }, [game, currentMove]);

  const goToStart = useCallback(() => { setCurrentMove(0); setTryBestMode(false); setTryBestResult(null); }, []);
  const goToEnd = useCallback(() => { setCurrentMove(totalMoves); setTryBestMode(false); setTryBestResult(null); }, [totalMoves]);
  const goBack = useCallback(() => { setCurrentMove((m) => Math.max(0, m - 1)); setTryBestMode(false); setTryBestResult(null); }, []);
  const goForward = useCallback(() => { setCurrentMove((m) => Math.min(totalMoves, m + 1)); setTryBestMode(false); setTryBestResult(null); }, [totalMoves]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); goBack(); break;
        case "ArrowRight": e.preventDefault(); goForward(); break;
        case "Home": e.preventDefault(); goToStart(); break;
        case "End": e.preventDefault(); goToEnd(); break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goBack, goForward, goToStart, goToEnd]);

  const jumpToMove = useCallback((moveNum: number) => {
    setCurrentMove(moveNum);
    setTryBestMode(false);
    setTryBestResult(null);
  }, []);

  // Try best move handler
  const onTryBestMove = useCallback(
    (from: string, to: string): boolean => {
      if (!currentMoveData?.bestMoveUci) return false;
      const uci = currentMoveData.bestMoveUci;
      const expFrom = uci.slice(0, 2);
      const expTo = uci.slice(2, 4);
      try {
        const tempChess = new Chess(fenBeforeCurrent);
        const move = tempChess.move({ from, to });
        if (!move) return false;
        const isCorrect = from === expFrom && to === expTo;
        setTryBestResult(isCorrect ? "correct" : "wrong");
        setTryBestMode(false);
        return true;
      } catch {
        return false;
      }
    },
    [currentMoveData, fenBeforeCurrent],
  );

  const inaccuracyCount = useMemo(() =>
    game?.moves?.filter((m) => m.isPlayerMove && m.classification === "inaccuracy").length ?? 0, [game]);
  const mistakeCount = useMemo(() =>
    game?.moves?.filter((m) => m.isPlayerMove && m.classification === "mistake").length ?? 0, [game]);
  const blunderCount = useMemo(() =>
    game?.moves?.filter((m) => m.isPlayerMove && m.classification === "blunder").length ?? 0, [game]);

  const strengthsList = useMemo(() =>
    game?.summaryStrengths?.split(",").map((s) => s.trim()).filter(Boolean) ?? [], [game]);
  const weaknessesList = useMemo(() =>
    game?.summaryWeaknesses?.split(",").map((s) => s.trim()).filter(Boolean) ?? [], [game]);

  const boardOrientation = game?.userColor === "black" ? "black" : "white";

  const canTryBestMove = currentMoveData?.isPlayerMove &&
    currentMoveData?.bestMoveUci &&
    (currentMoveData.classification === "inaccuracy" ||
      currentMoveData.classification === "mistake" ||
      currentMoveData.classification === "blunder");

  // ─── Loading / Analyzing States ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-accent-gold/10 flex items-center justify-center animate-pulse-soft">
            <Brain className="w-10 h-10 text-accent-gold" />
          </div>
          <Sparkles className="w-5 h-5 text-accent-gold absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-2">Coach is analyzing your game...</h2>
          <p className="text-text-muted text-sm max-w-md">
            Reviewing every move, identifying patterns, and preparing personalized feedback.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-accent-gold animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !game || !chess) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-accent-rose mx-auto mb-4" />
        <p className="text-text-muted">{error || "Could not load game"}</p>
      </div>
    );
  }

  const moveDisplayLabel =
    currentMove === 0
      ? "Start"
      : (() => {
          const mv = game.moves[currentMove - 1];
          const san = mv?.san ?? pgnMoves[currentMove - 1] ?? "?";
          const num = Math.ceil(currentMove / 2);
          const dots = currentMove % 2 === 1 ? "." : "...";
          return `${num}${dots} ${san}`;
        })();

  function commentaryBorderColor(mv: BotGameMove | null): string {
    if (!mv || !mv.isPlayerMove) return "border-l-border-subtle";
    const cls = mv.classification;
    if (cls === "blunder") return "border-l-accent-rose";
    if (cls === "mistake") return "border-l-orange-400";
    if (cls === "inaccuracy") return "border-l-yellow-400";
    if (cls === "brilliant" || cls === "great" || cls === "good") return "border-l-accent-emerald";
    return "border-l-border-subtle";
  }

  // Result icon and color
  const resultIsWin = (game.userColor === "white" && game.result === "1-0") || (game.userColor === "black" && game.result === "0-1");
  const resultIsLoss = (game.userColor === "white" && game.result === "0-1") || (game.userColor === "black" && game.result === "1-0");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-accent-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Coach Review</h1>
            <p className="text-text-muted text-sm">
              {game.white} vs {game.black}
              {game.opening && ` — ${game.opening}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCoach(!showCoach)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              showCoach
                ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                : "bg-bg-tertiary border-border-subtle text-text-muted"
            }`}
          >
            {showCoach ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showCoach ? "Coach On" : "Coach Off"}
          </button>
          <div className="flex items-center gap-2">
            {resultIsWin && <Trophy className="w-5 h-5 text-accent-gold" />}
            {resultIsLoss && <Flag className="w-5 h-5 text-accent-rose" />}
            {!resultIsWin && !resultIsLoss && <Minus className="w-5 h-5 text-text-muted" />}
            <span className={`text-sm font-bold font-mono ${resultIsWin ? "text-accent-gold" : resultIsLoss ? "text-accent-rose" : "text-text-muted"}`}>
              {game.result}
            </span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-5 ${
        showCoach
          ? "xl:grid-cols-[200px_1fr_320px] lg:grid-cols-[180px_1fr_280px]"
          : "xl:grid-cols-[200px_1fr] lg:grid-cols-[180px_1fr]"
      }`}>

        {/* ─── LEFT COLUMN ─────────────────────────────────────────────────────── */}
        <div className="space-y-4 order-2 lg:order-1">

          {/* Critical Moments */}
          <div className="card !p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Moments
            </h3>
            {game.criticalMoments.length === 0 ? (
              <p className="text-xs text-text-muted">No critical moments identified.</p>
            ) : (
              <div className="space-y-2">
                {game.criticalMoments.map((cm) => (
                  <button
                    key={cm.id}
                    onClick={() => jumpToMove(cm.moveNumber)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${severityColor(cm.severity)} ${currentMove === cm.moveNumber ? "ring-1 ring-accent-gold/40" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-medium">Move {cm.moveNumber}</span>
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                        cm.severity >= 8 ? "bg-accent-rose/20 text-accent-rose"
                        : cm.severity >= 5 ? "bg-orange-400/20 text-orange-400"
                        : "bg-yellow-400/20 text-yellow-400"
                      }`}>
                        {cm.severity >= 8 ? "Critical" : cm.severity >= 5 ? "Important" : "Minor"}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-tight">{cm.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Train From This Game */}
          <div className="card !p-4" ref={trainingRef}>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              Train From This Game
            </h3>
            {game.derivedTasks.length === 0 ? (
              <p className="text-xs text-text-muted">No training tasks generated.</p>
            ) : (
              <div className="space-y-2.5">
                {game.derivedTasks.map((task) => {
                  const Icon = CATEGORY_ICONS[task.category] || Target;
                  const route = TRAINING_ROUTES[task.category] || "/coach";
                  return (
                    <div key={task.id} className="p-2.5 rounded-lg bg-bg-tertiary border border-border-subtle">
                      <div className="flex items-start gap-2">
                        <Icon className="w-3.5 h-3.5 text-accent-gold mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary leading-tight">{task.title}</p>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{task.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(route)}
                        className="mt-2 w-full text-[11px] font-medium text-accent-gold hover:text-accent-gold-light transition-colors flex items-center justify-center gap-1 py-1.5 rounded bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/10"
                      >
                        <Play className="w-3 h-3" />
                        Start Training
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── CENTER COLUMN ───────────────────────────────────────────────────── */}
        <div className="space-y-4 order-1 lg:order-2">

          {/* Game Summary */}
          <div className="card !p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge text-xs font-bold ${
                game.result === "1-0" ? "bg-text-primary/10 text-text-primary"
                : game.result === "0-1" ? "bg-bg-tertiary text-text-secondary"
                : "bg-accent-gold/10 text-accent-gold"
              }`}>
                {game.result === "1-0" ? "White wins" : game.result === "0-1" ? "Black wins" : "Draw"}
              </span>
              {game.opening && <span className="badge-gold text-[11px]">{game.opening}</span>}
              {game.accuracy !== null && (
                <span className={`text-sm font-bold ${accuracyColor(game.accuracy)}`}>
                  {game.accuracy.toFixed(1)}% accuracy
                </span>
              )}
              {game.avgCentipawnLoss !== null && (
                <span className="text-xs text-text-muted">
                  avg {game.avgCentipawnLoss} CPL
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs mb-3">
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                {inaccuracyCount} inaccurac{inaccuracyCount === 1 ? "y" : "ies"}
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                {mistakeCount} mistake{mistakeCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-accent-rose">
                <span className="w-2 h-2 rounded-full bg-accent-rose" />
                {blunderCount} blunder{blunderCount !== 1 ? "s" : ""}
              </span>
            </div>

            {game.summaryVerdict && (
              <p className="text-sm text-text-secondary leading-relaxed mb-3">{game.summaryVerdict}</p>
            )}

            {(strengthsList.length > 0 || weaknessesList.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {strengthsList.map((s, i) => (
                  <span key={`s-${i}`} className="badge bg-accent-emerald/10 text-accent-emerald text-[10px]">
                    <Trophy className="w-2.5 h-2.5 mr-1" />{s}
                  </span>
                ))}
                {weaknessesList.map((w, i) => (
                  <span key={`w-${i}`} className="badge bg-accent-rose/10 text-accent-rose text-[10px]">
                    <TrendingDown className="w-2.5 h-2.5 mr-1" />{w}
                  </span>
                ))}
              </div>
            )}

            {game.summaryLesson && (
              <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-lg p-3 flex gap-2.5">
                <Lightbulb className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold text-accent-gold uppercase tracking-wider">Biggest Lesson</span>
                  <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{game.summaryLesson}</p>
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Graph */}
          {game.moves.length > 0 && (
            <EvalGraph moves={game.moves} currentMove={currentMove} onJumpToMove={jumpToMove} />
          )}

          {/* Chessboard */}
          <div className="flex flex-col items-center">
            <Chessboard
              fen={tryBestMode ? fenBeforeCurrent : currentFen}
              size={480}
              orientation={boardOrientation}
              lastMove={tryBestMode ? undefined : lastMoveInfo}
              interactive={tryBestMode}
              onMove={tryBestMode ? onTryBestMove : undefined}
            />

            {/* Try best move result overlay */}
            {tryBestResult && (
              <div className={`w-full max-w-[480px] mt-2 flex items-center justify-between px-3 py-2 rounded-lg ${
                tryBestResult === "correct" ? "bg-accent-emerald/10 border border-accent-emerald/20" : "bg-accent-rose/10 border border-accent-rose/20"
              }`}>
                <div className="flex items-center gap-2">
                  {tryBestResult === "correct"
                    ? <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                    : <XCircle className="w-4 h-4 text-accent-rose" />}
                  <span className={`text-sm font-medium ${tryBestResult === "correct" ? "text-accent-emerald" : "text-accent-rose"}`}>
                    {tryBestResult === "correct" ? "Correct!" : `Best was `}
                    {tryBestResult === "wrong" && (
                      <span className="font-mono font-bold ml-1">{currentMoveData?.bestMoveSan}</span>
                    )}
                  </span>
                </div>
                <button onClick={() => setTryBestResult(null)} className="text-xs text-text-muted hover:text-text-primary">
                  Close
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-1.5 mt-3">
              <button onClick={goToStart} className="btn-ghost p-2" title="Start (Home)">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={goBack} className="btn-ghost p-2" title="Previous (←)">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-muted font-mono px-3 min-w-[110px] text-center select-none">
                {tryBestMode ? "Find best move" : moveDisplayLabel}
              </span>
              <button onClick={goForward} className="btn-ghost p-2" title="Next (→)">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={goToEnd} className="btn-ghost p-2" title="End (End)">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Try best move button */}
            {canTryBestMove && !tryBestMode && !tryBestResult && (
              <button
                onClick={() => { setTryBestMode(true); setTryBestResult(null); }}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-gold bg-accent-gold/5 border border-accent-gold/15 hover:bg-accent-gold/10 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Try the best move
              </button>
            )}
            {tryBestMode && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-accent-gold animate-pulse">
                  Find <span className="font-mono font-semibold">{currentMoveData?.bestMoveSan?.slice(0, 1)}...</span> on the board
                </span>
                <button onClick={() => { setTryBestMode(false); setTryBestResult(null); }} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}

            {/* Eval Bar */}
            <div className="w-full max-w-[480px] mt-2">
              <EvalBar evalCp={currentEval} />
            </div>
          </div>

          {/* Move List */}
          <div className="card !p-4">
            <div className="max-h-48 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-x-0.5 gap-y-1 text-sm font-mono">
                {game.moves.map((mv, i) => {
                  const idx = i + 1;
                  const style = CLASSIFICATION_STYLES[mv.classification ?? "good"] || CLASSIFICATION_STYLES.good;
                  const isActive = currentMove === idx;
                  return (
                    <span key={mv.id} className="inline-flex items-center">
                      {mv.isWhiteMove && (
                        <span className="text-text-muted mr-0.5 text-xs">{mv.moveNumber}.</span>
                      )}
                      <button
                        onClick={() => jumpToMove(idx)}
                        className={`px-1 py-0.5 rounded transition-all text-xs ${
                          isActive
                            ? "bg-accent-gold/20 text-accent-gold font-bold"
                            : `${mv.isPlayerMove ? style.color : "text-text-secondary"} hover:bg-bg-hover`
                        }`}
                      >
                        {mv.san}
                        {mv.isPlayerMove && style.glyph && (
                          <span className={style.color}>{style.glyph}</span>
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────────────────────────────── */}
        {showCoach && <div className="space-y-4 order-3" ref={commentaryRef}>

          {/* Coach Commentary */}
          <div className={`card !p-5 border-l-4 transition-all duration-300 ${commentaryBorderColor(currentMoveData)}`}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-accent-gold" />
              <h3 className="text-sm font-semibold text-text-primary">Coach Commentary</h3>
            </div>

            {currentMove === 0 ? (
              <p className="text-sm text-text-muted italic">
                Navigate to a move to see the coach&apos;s analysis.
              </p>
            ) : currentMoveData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">
                    Move {currentMoveData.moveNumber}{currentMoveData.isWhiteMove ? "." : "..."} {currentMoveData.san}
                    {currentMoveData.isPlayerMove && (
                      <span className="ml-1.5 text-accent-gold">(you)</span>
                    )}
                  </span>
                  <ClassificationBadge cls={currentMoveData.classification} />
                </div>

                {currentMoveData.verdictLabel && (
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {currentMoveData.verdictLabel}
                  </p>
                )}

                {currentMoveData.humanExplanation && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> What happened
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {currentMoveData.humanExplanation}
                    </p>
                  </div>
                )}

                {currentMoveData.thinkingProcess && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Think deeper
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {currentMoveData.thinkingProcess}
                    </p>
                  </div>
                )}

                {currentMoveData.bestMoveSan && (
                  <div data-best-move>
                    <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Best move
                    </h4>
                    <div className="flex items-center gap-3 bg-bg-tertiary rounded-lg p-2.5">
                      <span className="font-mono text-sm font-bold text-accent-emerald">
                        {currentMoveData.bestMoveSan}
                      </span>
                      {currentMoveData.bestMoveUci && (
                        <span className="text-[10px] text-text-muted font-mono">
                          ({currentMoveData.bestMoveUci})
                        </span>
                      )}
                      {currentMoveData.evalBefore !== null && (
                        <span className="ml-auto text-[11px] text-text-muted font-mono">
                          {(currentMoveData.evalBefore / 100).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentMoveData.evalDrop !== null && currentMoveData.evalDrop > 0 && currentMoveData.isPlayerMove && (
                  <div className="flex items-center gap-2 text-xs bg-accent-rose/5 border border-accent-rose/15 rounded-lg px-3 py-2">
                    <TrendingDown className="w-3.5 h-3.5 text-accent-rose" />
                    <span className="text-accent-rose font-medium">
                      Dropped {(currentMoveData.evalDrop / 100).toFixed(1)} pawns
                    </span>
                  </div>
                )}

                {/* Phase badge */}
                {currentMoveData.phase && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Phase:</span>
                    <span className="text-[10px] font-medium text-text-secondary capitalize">{currentMoveData.phase}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No data for this move.</p>
            )}
          </div>

          {/* Engine Line */}
          {currentMoveData?.bestMoveSan && (
            <div className="card !p-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Engine Analysis
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Best move</span>
                  <span className="font-mono font-semibold text-accent-emerald">{currentMoveData.bestMoveSan}</span>
                </div>
                {currentMoveData.bestMoveUci && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">UCI</span>
                    <span className="font-mono text-text-secondary">{currentMoveData.bestMoveUci}</span>
                  </div>
                )}
                {currentMoveData.evalBefore !== null && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Before</span>
                    <span className="font-mono text-text-secondary">{(currentMoveData.evalBefore / 100).toFixed(2)}</span>
                  </div>
                )}
                {currentMoveData.evalAfter !== null && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">After</span>
                    <span className="font-mono text-text-secondary">{(currentMoveData.evalAfter / 100).toFixed(2)}</span>
                  </div>
                )}
                {currentMoveData.evalDrop !== null && currentMoveData.evalDrop > 20 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Loss</span>
                    <span className={`font-mono font-semibold ${currentMoveData.evalDrop >= 200 ? "text-accent-rose" : currentMoveData.evalDrop >= 100 ? "text-orange-400" : "text-yellow-400"}`}>
                      -{(currentMoveData.evalDrop / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {canTryBestMove && (
              <button
                onClick={() => { setTryBestMode(true); setTryBestResult(null); commentaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="btn-primary w-full text-xs flex items-center justify-center gap-1.5 py-2.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Try the best move on the board
              </button>
            )}
            <button
              onClick={() => trainingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="btn-ghost w-full text-xs flex items-center justify-center gap-1.5 border border-accent-gold/20 text-accent-gold py-2.5"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Go to training tasks
            </button>
          </div>
        </div>}
      </div>
    </div>
  );
}
