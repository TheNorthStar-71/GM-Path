"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Swords,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Zap,
  Timer,
  Brain,
  Target,
  Lightbulb,
  Loader2,
  Trophy,
  Keyboard,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

function useGlickoRating() {
  const [display, setDisplay] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { if (d?.ratingPuzzleDisplay) setDisplay(d.ratingPuzzleDisplay); })
      .catch(() => {});
  }, []);
  return display;
}

const MOTIFS = [
  "All",
  "fork",
  "pin",
  "skewer",
  "discovered_attack",
  "back_rank",
  "deflection",
  "attraction",
  "removal_of_defender",
  "zwischenzug",
  "overloaded_piece",
  "mate_pattern",
];

const MOTIF_LABELS: Record<string, string> = {
  All: "All",
  fork: "Fork",
  pin: "Pin",
  skewer: "Skewer",
  discovered_attack: "Discovered Attack",
  back_rank: "Back Rank",
  deflection: "Deflection",
  attraction: "Attraction",
  removal_of_defender: "Removal of Defender",
  zwischenzug: "In-Between Move",
  overloaded_piece: "Overloaded Piece",
  mate_pattern: "Mate Pattern",
  attack: "Attack",
  center_control: "Center Control",
  pawn_fork: "Pawn Fork",
  passed_pawn: "Passed Pawn",
  endgame_technique: "Endgame Technique",
  tactical_sequence: "Tactical Sequence",
  exchange: "Exchange",
  positional: "Positional",
  development: "Development",
  space: "Space",
  clearance: "Clearance",
  interference: "Interference",
};

const MOTIF_TOOLTIPS: Record<string, string> = {
  All: "Show puzzles from all tactical categories",
  fork: "A single piece simultaneously attacks two of the opponent's pieces.",
  pin: "A piece cannot move without exposing a more valuable piece behind it.",
  skewer: "An attack on a valuable piece that forces it to move, exposing a lesser piece.",
  discovered_attack: "Moving one piece reveals an attack from another piece behind it.",
  back_rank: "Checkmate delivered on the opponent's back rank when the king is trapped.",
  deflection: "Forcing a defending piece away from the square or piece it protects.",
  attraction: "Luring the opponent's king or piece onto an unfavorable square.",
  removal_of_defender: "Eliminating the piece responsible for protecting a key target.",
  zwischenzug: "An unexpected intermediate move played before the anticipated recapture.",
  overloaded_piece: "A piece assigned to defend more targets than it can adequately cover.",
  mate_pattern: "A recurring checkmating configuration that appears across many games.",
};

const MODES = [
  {
    value: "standard",
    label: "Standard",
    icon: Target,
    description: "One puzzle at a time, rated by difficulty",
  },
  {
    value: "woodpecker",
    label: "Repeat Drill",
    icon: RotateCcw,
    description: "The same set of puzzles, repeated until every pattern is automatic",
  },
  {
    value: "survival",
    label: "Survival",
    icon: Zap,
    description: "Consecutive correct answers — one mistake ends the session",
  },
  {
    value: "timed",
    label: "Timed",
    icon: Timer,
    description: "Solve as many puzzles as possible within the time limit",
  },
];

interface Puzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
  phase: string;
  explanation: string | null;
  wrongMoveExplanations: Record<string, string> | null;
}

export default function TacticsPage() {
  const glickoRating = useGlickoRating();
  const [mode, setMode] = useState("standard");
  const [motif, setMotif] = useState("All");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<"solving" | "correct" | "wrong">(
    "solving"
  );
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [difficultyBias, setDifficultyBias] = useState(0);
  const [difficultyNotification, setDifficultyNotification] = useState<string | null>(null);
  const consecutiveSolves = useRef(0);
  const recentResults = useRef<boolean[]>([]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "arrowright":
        case "n":
          if (status === "correct" || status === "wrong") nextPuzzle();
          break;
        case "h":
          if (status === "solving") setShowHint(true);
          break;
        case "a":
          if (status === "solving") {
            setStatus("wrong");
            setStreak(0);
            setTotalAttempted((s) => s + 1);
          }
          break;
        case "r":
          if (status === "wrong") retryPuzzle();
          break;
        case "?":
          setShowShortcuts((s) => !s);
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Achievement tracking
  useEffect(() => {
    const newAchievements: string[] = [];
    if (streak >= 5 && !achievements.includes("streak_5")) {
      newAchievements.push("streak_5");
      setNewAchievement("Hot Streak: 5 puzzles in a row!");
    }
    if (streak >= 10 && !achievements.includes("streak_10")) {
      newAchievements.push("streak_10");
      setNewAchievement("On Fire: 10 puzzles in a row!");
    }
    if (totalSolved >= 10 && !achievements.includes("solved_10")) {
      newAchievements.push("solved_10");
      setNewAchievement("Puzzle Warrior: 10 puzzles solved!");
    }
    if (totalSolved >= 50 && !achievements.includes("solved_50")) {
      newAchievements.push("solved_50");
      setNewAchievement("Puzzle Master: 50 puzzles solved!");
    }
    if (totalAttempted > 0 && totalSolved / totalAttempted >= 0.9 && totalAttempted >= 10 && !achievements.includes("accuracy_90")) {
      newAchievements.push("accuracy_90");
      setNewAchievement("Precision Play: 90%+ accuracy over 10 puzzles!");
    }
    if (newAchievements.length > 0) {
      setAchievements((prev) => [...prev, ...newAchievements]);
      setTimeout(() => setNewAchievement(null), 4000);
    }
  }, [streak, totalSolved, totalAttempted]);

  // Difficulty auto-adjustment based on last 10 results
  useEffect(() => {
    if (status === "correct") {
      consecutiveSolves.current++;
      recentResults.current = [...recentResults.current, true].slice(-10);
    } else if (status === "wrong") {
      consecutiveSolves.current = 0;
      recentResults.current = [...recentResults.current, false].slice(-10);
    } else {
      return;
    }

    const results = recentResults.current;
    if (results.length >= 10) {
      const solveRate = results.filter(Boolean).length / results.length;
      if (solveRate > 0.9) {
        setDifficultyBias((prev) => Math.min(prev + 150, 600));
        setDifficultyNotification("You're crushing it! Increasing difficulty...");
        setTimeout(() => setDifficultyNotification(null), 4000);
      } else if (solveRate < 0.3) {
        setDifficultyBias((prev) => Math.max(prev - 150, -400));
        setDifficultyNotification("Let's slow down. Adjusting difficulty...");
        setTimeout(() => setDifficultyNotification(null), 4000);
      }
    }
  }, [status]);

  useEffect(() => {
    fetchPuzzles();
  }, [motif, mode]);

  async function fetchPuzzles() {
    setLoading(true);
    try {
      const baseMin = 800;
      const baseMax = 2000;
      const params = new URLSearchParams({
        mode,
        minRating: String(Math.max(400, baseMin + difficultyBias)),
        maxRating: String(Math.min(3000, baseMax + difficultyBias)),
      });
      if (motif !== "All") params.set("theme", motif);
      const res = await fetch(`/api/puzzles?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setPuzzles(data);
          setCurrentPuzzleIndex(0);
          setMoveIndex(0);
          setStatus("solving");
          setShowHint(false);
          setStartTime(Date.now());
        }
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  const puzzle = puzzles[currentPuzzleIndex];
  const solutionMoves = puzzle?.moves?.split(" ") ?? [];

  const currentFen = useMemo(() => {
    if (!puzzle) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const chess = new Chess(puzzle.fen);
    for (let i = 0; i < moveIndex; i++) {
      try {
        chess.move(solutionMoves[i]);
      } catch {
        break;
      }
    }
    return chess.fen();
  }, [puzzle, moveIndex, solutionMoves]);

  async function recordAttempt(solved: boolean) {
    if (!puzzle) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      await fetch("/api/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          solved,
          timeSpent,
          attempts: 1,
          mode,
        }),
      });
    } catch {
      // Non-blocking
    }
  }

  const handleMove = useCallback(
    (from: string, to: string) => {
      if (status !== "solving" || !puzzle) return false;

      const chess = new Chess(currentFen);
      const move = chess.move({ from, to });

      if (!move) return false;

      const expectedMove = solutionMoves[moveIndex];

      const normalizedPlayed = move.san.replace(/[+#]/g, "");
      const normalizedExpected = expectedMove?.replace(/[+#]/g, "");

      if (normalizedPlayed === normalizedExpected) {
        if (moveIndex + 1 >= solutionMoves.length) {
          setStatus("correct");
          setStreak((s) => s + 1);
          setTotalSolved((s) => s + 1);
          setTotalAttempted((s) => s + 1);
          recordAttempt(true);
        } else {
          setMoveIndex((i) => i + 1);
        }
        return true;
      } else {
        setStatus("wrong");
        setStreak(0);
        setTotalAttempted((s) => s + 1);
        recordAttempt(false);
        return false;
      }
    },
    [status, currentFen, puzzle, moveIndex, solutionMoves]
  );

  function nextPuzzle() {
    if (currentPuzzleIndex + 1 < puzzles.length) {
      setCurrentPuzzleIndex((i) => i + 1);
    } else {
      fetchPuzzles();
      return;
    }
    setMoveIndex(0);
    setStatus("solving");
    setShowHint(false);
    setStartTime(Date.now());
  }

  function retryPuzzle() {
    setMoveIndex(0);
    setStatus("solving");
    setShowHint(false);
    setStartTime(Date.now());
  }

  if (loading && puzzles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="card text-center py-12">
        <Swords className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No puzzles available</h3>
        <p className="text-text-muted text-sm">
          Try a different motif filter or check back later.
        </p>
      </div>
    );
  }

  const accuracy = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;
  const progressPct = puzzles.length > 0 ? Math.round(((currentPuzzleIndex + 1) / puzzles.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Tactics Trainer</h1>
          <p className="text-text-muted text-sm mt-1">Build your pattern recognition through focused repetition</p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          {glickoRating && (
            <div className="flex flex-col items-end">
              <span className="font-mono font-semibold text-accent-gold text-base">{glickoRating}</span>
              <span className="text-text-muted text-[10px]">puzzle rating</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-accent-gold">
            <Zap className="w-4 h-4" />
            <span className="font-mono font-semibold">{streak}</span>
            <span className="text-text-muted">streak</span>
          </div>
          <span className="text-text-muted">{totalSolved}/{totalAttempted} solved</span>
        </div>
      </div>

      {/* About Tactics */}
      <div className="card">
        <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between text-left">
          <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.18em]">About Tactics</h3>
          <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${showInfo ? "rotate-180" : ""}`} />
        </button>
        {showInfo && (
          <p className="text-sm text-text-secondary leading-relaxed mt-3">
            A tactic is a precise sequence of moves that wins material or forces checkmate.
            Tactics decide the majority of games at every level. This trainer uses pattern
            repetition so your eye learns to spot them instantly.
          </p>
        )}
      </div>

      {/* Mini progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-text-muted font-mono">{currentPuzzleIndex + 1}/{puzzles.length}</span>
      </div>

      {difficultyNotification && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-gold/10 text-sm text-accent-gold animate-fade-in" style={{ border: "1px solid rgba(240,180,41,0.15)" }}>
          <Trophy className="w-4 h-4 shrink-0" />
          <span>{difficultyNotification}</span>
          <span className="ml-auto text-xs text-accent-gold/60">
            {Math.max(400, 800 + difficultyBias)}–{Math.min(3000, 2000 + difficultyBias)}
          </span>
        </div>
      )}

      {/* Mode selector — segmented control */}
      <div className="segmented-control">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              data-active={mode === m.value}
              className="flex items-center gap-2"
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Motif filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {MOTIFS.map((m) => (
          <Tooltip key={m} content={MOTIF_TOOLTIPS[m] || ""} position="bottom">
            <button
              onClick={() => setMotif(m)}
              data-active={motif === m}
              className="pill-button"
            >
              {MOTIF_LABELS[m] || m}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card flex flex-col items-center !p-6">
            {/* Puzzle metadata */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-accent-gold/10 text-accent-gold">
                  {puzzle.rating}
                </span>
                {puzzle.themes.map((t) => (
                  <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-accent-teal/10 text-accent-teal">
                    {MOTIF_LABELS[t] || t}
                  </span>
                ))}
              </div>
              <span className="text-xs text-text-muted">{puzzle.phase}</span>
            </div>

            {/* Board with border treatment */}
            <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Chessboard
                fen={currentFen}
                size={480}
                interactive={status === "solving"}
                onMove={handleMove}
              />
            </div>

            {/* Status bar */}
            <div className="w-full mt-4">
              {status === "solving" && (
                <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <Brain className="w-4 h-4 text-text-muted" />
                    Find the best move for{" "}
                    {currentFen.includes(" w ") ? "White" : "Black"}
                  </p>
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-accent-gold hover:text-accent-gold-light transition-colors flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    Hint
                  </button>
                </div>
              )}

              {status === "correct" && (
                <div className="flex flex-col p-3 bg-accent-emerald/10 rounded-lg" style={{ border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-accent-emerald">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold text-sm">Correct!</span>
                    </div>
                    <button
                      onClick={nextPuzzle}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {puzzle.themes.length > 0 && (
                    <p className="text-xs text-accent-emerald mt-2">
                      {MOTIF_LABELS[puzzle.themes[0]] || puzzle.themes[0]}
                      {MOTIF_TOOLTIPS[puzzle.themes[0]] ? ` — ${MOTIF_TOOLTIPS[puzzle.themes[0]].toLowerCase().replace(/\.$/, "")}` : ""}
                    </p>
                  )}
                </div>
              )}

              {status === "wrong" && (
                <div className="flex items-center justify-between p-3 bg-accent-rose/10 rounded-lg" style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="flex items-center gap-2 text-accent-rose">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm">Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={retryPuzzle} className="btn-ghost text-sm">Retry</button>
                    <button onClick={nextPuzzle} className="btn-secondary text-sm">Next</button>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts */}
            <div className="w-full mt-3">
              <button
                onClick={() => setShowShortcuts((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                <Keyboard className="w-3.5 h-3.5" />
                Shortcuts
              </button>
              {showShortcuts && (
                <div className="mt-2 p-3 bg-white/[0.03] rounded-lg grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[10px]">H</kbd>
                    <span>Hint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[10px]">A</kbd>
                    <span>Answer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[10px]">&rarr;</kbd>
                    <span>Next</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[10px]">R</kbd>
                    <span>Retry</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {showHint && status === "solving" && (
            <div className="card" style={{ borderLeft: "3px solid #F0B429", background: "rgba(240,180,41,0.04)" }}>
              <h3 className="text-sm font-semibold text-accent-gold mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Hint
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Look for a forcing move that creates a double attack or exploits
                an undefended piece. The first move is{" "}
                <span className="font-mono font-semibold">
                  {solutionMoves[0]?.[0]}...
                </span>
              </p>
            </div>
          )}

          {(status === "correct" || status === "wrong") &&
            puzzle.explanation && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-2">Explanation</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {puzzle.explanation}
                </p>
                {solutionMoves.length > 0 && (
                  <div className="mt-3 p-2.5 bg-white/[0.03] rounded-lg font-mono text-xs text-text-secondary">
                    {solutionMoves.join(" ")}
                  </div>
                )}
              </div>
            )}

          {status === "wrong" &&
            puzzle.wrongMoveExplanations &&
            typeof puzzle.wrongMoveExplanations === "object" && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-2">Why wrong moves fail</h3>
                {Object.entries(puzzle.wrongMoveExplanations).map(
                  ([move, explanation]) => (
                    <div key={move} className="mb-2.5 last:mb-0">
                      <span className="font-mono text-accent-rose text-sm">{move}</span>
                      <p className="text-xs text-text-muted mt-0.5">{explanation as string}</p>
                    </div>
                  )
                )}
              </div>
            )}

          {/* Session Stats — clean 2-col with divider */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Session Stats</h3>
            <div className="flex items-stretch divide-x divide-white/[0.06]">
              <div className="flex-1 text-center pr-4">
                <p className="font-display text-2xl font-semibold text-accent-gold">{streak}</p>
                <p className="text-xs text-text-muted mt-1">Current Streak</p>
              </div>
              <div className="flex-1 text-center pl-4">
                <p className="font-display text-2xl font-semibold text-text-primary">{accuracy}%</p>
                <p className="text-xs text-text-muted mt-1">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Puzzle Info — key-value with subtle dividers */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Puzzle Info</h3>
            <div className="divide-y divide-white/[0.04]">
              <div className="flex justify-between py-2.5 first:pt-0">
                <span className="text-text-muted text-sm">Rating</span>
                <span className="font-mono text-sm font-medium">{puzzle.rating}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-muted text-sm">Phase</span>
                <span className="text-sm font-medium capitalize">{puzzle.phase}</span>
              </div>
              <div className="flex justify-between py-2.5 last:pb-0">
                <span className="text-text-muted text-sm">Moves</span>
                <span className="font-mono text-sm font-medium">{solutionMoves.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
