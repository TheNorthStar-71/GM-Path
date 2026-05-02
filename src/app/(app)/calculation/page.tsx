"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Brain,
  Target,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lightbulb,
  BarChart3,
  Loader2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Zap,
} from "lucide-react";
import { SkillBar } from "@/components/ui/skill-bar";
import { Tooltip } from "@/components/ui/tooltip";

interface BestMove {
  move: string;
  eval: number;
}

interface Exercise {
  id: string;
  fen: string;
  type: string;
  difficulty: number;
  bestMoves: BestMove[];
  mainLine: string;
  theme: string;
  explanation: string;
}

type Phase = "candidates" | "variation" | "result";

// ─── Move Tree Node ───────────────────────────────────────────────────────────

interface MoveNode {
  san: string;
  fen: string;
  matchesEngine: boolean | null; // null = unknown yet
  depth: number;
}

// ─── Depth progression targets ───────────────────────────────────────────────

const DEPTH_TARGETS = [2, 3, 5, 7];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CalculationPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [phase, setPhase] = useState<Phase>("candidates");

  // Candidate moves
  const [userCandidates, setUserCandidates] = useState<string[]>([]);
  const [candidateInput, setCandidateInput] = useState("");

  // Interactive variation on the board
  const [variationMoves, setVariationMoves] = useState<MoveNode[]>([]);
  const [variationFen, setVariationFen] = useState<string>("");
  const [variationChess, setVariationChess] = useState<Chess | null>(null);

  // UI state
  const [showBoard, setShowBoard] = useState(true);
  const [showMethod, setShowMethod] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetDepthIdx, setTargetDepthIdx] = useState(0);

  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch exercises ────────────────────────────────────────────────────────

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calculation");
      if (!res.ok) throw new Error("Failed to load exercises");
      const data: Exercise[] = await res.json();
      if (data.length === 0) throw new Error("No exercises available");
      setExercises(data);
      setCurrentExercise(0);
      resetState(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ─── Reset ──────────────────────────────────────────────────────────────────

  function resetState(ex?: Exercise) {
    const exercise = ex ?? exercises[currentExercise];
    setPhase("candidates");
    setUserCandidates([]);
    setCandidateInput("");
    setVariationMoves([]);
    setShowBoard(true);
    setShowSolution(false);
    setElapsedSeconds(0);
    startTime.current = Date.now();
    if (exercise) {
      const chess = new Chess(exercise.fen);
      setVariationFen(exercise.fen);
      setVariationChess(chess);
    }
  }

  const exercise = exercises[currentExercise] ?? null;

  const bestMoves: BestMove[] = useMemo(() => {
    if (!exercise) return [];
    if (typeof exercise.bestMoves === "string") {
      try { return JSON.parse(exercise.bestMoves); } catch { return []; }
    }
    return exercise.bestMoves ?? [];
  }, [exercise]);

  const engineMainLine: string[] = useMemo(() => {
    if (!exercise?.mainLine) return [];
    return exercise.mainLine.trim().split(/\s+/).filter(Boolean);
  }, [exercise]);

  const targetDepth = DEPTH_TARGETS[targetDepthIdx] ?? 7;

  // ─── Candidate input ────────────────────────────────────────────────────────

  function addCandidate() {
    if (!candidateInput.trim() || !exercise) return;
    const chess = new Chess(exercise.fen);
    try {
      const move = chess.move(candidateInput.trim());
      if (move && !userCandidates.includes(move.san)) {
        setUserCandidates([...userCandidates, move.san]);
      }
    } catch { /* invalid */ }
    setCandidateInput("");
  }

  function submitCandidates() {
    if (!exercise) return;
    const chess = new Chess(exercise.fen);
    setVariationFen(exercise.fen);
    setVariationChess(chess);
    setVariationMoves([]);
    setPhase("variation");
  }

  // ─── Interactive variation entry on board ────────────────────────────────────

  const onVariationMove = useCallback((from: string, to: string): boolean => {
    if (!exercise || !variationChess) return false;
    if (variationMoves.length >= targetDepth * 2) return false; // cap at target depth (both sides)

    try {
      const piece = variationChess.get(from as Parameters<typeof variationChess.get>[0]);
      const isPromotion =
        piece?.type === "p" &&
        ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));

      const result = variationChess.move({ from, to, promotion: isPromotion ? "q" : undefined });
      if (!result) return false;

      const depth = variationMoves.length;
      const engineSan = engineMainLine[depth] ?? null;

      // Normalise SAN for comparison (strip check/mate symbols)
      const norm = (s: string) => s?.replace(/[+#!?]/g, "");
      const matchesEngine = engineSan ? norm(result.san) === norm(engineSan) : null;

      const newNode: MoveNode = {
        san: result.san,
        fen: variationChess.fen(),
        matchesEngine,
        depth,
      };

      setVariationMoves((prev) => [...prev, newNode]);
      setVariationFen(variationChess.fen());

      // Create fresh chess instance for next move
      setVariationChess(new Chess(variationChess.fen()));
      return true;
    } catch {
      return false;
    }
  }, [exercise, variationChess, variationMoves, engineMainLine, targetDepth]);

  function undoVariationMove() {
    if (variationMoves.length === 0 || !exercise) return;
    const newMoves = variationMoves.slice(0, -1);
    setVariationMoves(newMoves);
    // Rebuild chess from initial FEN + remaining moves
    const chess = new Chess(exercise.fen);
    for (const node of newMoves) {
      try { chess.move(node.san); } catch { break; }
    }
    setVariationFen(chess.fen());
    setVariationChess(chess);
  }

  // ─── Submit variation ────────────────────────────────────────────────────────

  const candidateScore = useMemo(() => {
    if (bestMoves.length === 0) return 0;
    const engineMoves = bestMoves.map((m) => m.move);
    const found = userCandidates.filter((c) => engineMoves.includes(c)).length;
    return Math.round((found / engineMoves.length) * 100);
  }, [bestMoves, userCandidates]);

  const variationScore = useMemo(() => {
    if (variationMoves.length === 0) return 0;
    const matched = variationMoves.filter((m) => m.matchesEngine === true).length;
    return Math.round((matched / Math.max(variationMoves.length, 1)) * 100);
  }, [variationMoves]);

  const depthReached = Math.ceil(variationMoves.length / 2); // convert plies to moves

  const accuracyScore = useMemo(() => {
    const topMove = bestMoves[0]?.move;
    const hasTopMove = userCandidates.includes(topMove);
    return Math.min(
      Math.round(
        (hasTopMove ? 30 : 0) +
        candidateScore * 0.3 +
        variationScore * 0.3 +
        Math.min(depthReached, targetDepth) / targetDepth * 10
      ),
      100
    );
  }, [bestMoves, userCandidates, candidateScore, variationScore, depthReached, targetDepth]);

  async function submitVariation() {
    if (!exercise || submitting) return;
    setSubmitting(true);
    setPhase("result");

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    try {
      await fetch("/api/calculation/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          candidateMoves: userCandidates,
          userVariation: variationMoves.map((m) => m.san).join(" "),
          depthReached,
          candidateQuality: candidateScore,
          accuracyScore,
          timeSpent,
        }),
      });
    } catch { /* non-blocking */ }
    finally { setSubmitting(false); }
  }

  function nextExercise() {
    if (currentExercise < exercises.length - 1) {
      const next = currentExercise + 1;
      setCurrentExercise(next);
      resetState(exercises[next]);
    } else {
      fetchExercises();
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-accent-gold animate-spin mb-4" />
        <p className="text-text-muted text-sm">Loading exercises...</p>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-10 h-10 text-accent-rose mb-4" />
        <p className="text-text-secondary mb-4">{error ?? "No exercises found"}</p>
        <button onClick={fetchExercises} className="btn-primary text-sm">Retry</button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Think Ahead Trainer</h1>
          <p className="text-text-muted mt-1">
            Calculate variations on the board — then compare your line to the engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          <span className="text-xs text-text-muted">{currentExercise + 1}/{exercises.length}</span>
          <span className={`badge-${exercise.type === "forcing" ? "rose" : "blue"}`}>
            {exercise.type === "forcing" ? "Forcing" : "Non-forcing"}
          </span>
          <span className="badge-gold">Diff {exercise.difficulty}/10</span>
        </div>
      </div>

      {/* Depth progression selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted">Target depth:</span>
        <div className="flex gap-1.5">
          {DEPTH_TARGETS.map((d, i) => (
            <button
              key={d}
              onClick={() => setTargetDepthIdx(i)}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                targetDepthIdx === i
                  ? "bg-accent-gold text-bg-primary"
                  : "bg-bg-tertiary text-text-muted hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              {d} moves
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted ml-1">
          ({DEPTH_TARGETS[0]}=beginner · {DEPTH_TARGETS[3]}=master)
        </span>
      </div>

      {/* Method card */}
      <div className="card">
        <button onClick={() => setShowMethod(!showMethod)} className="w-full flex items-center justify-between text-left">
          <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.18em]">How to Use This Trainer</h3>
          <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${showMethod ? "rotate-180" : ""}`} />
        </button>
        {showMethod && (
          <div className="mt-3 space-y-3">
            {[
              "List every move worth considering before calculating any of them.",
              "Click moves on the board to build your calculated variation.",
              "Submit your line — see where it matches or diverges from the engine.",
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono text-accent-gold w-4 shrink-0">{i + 1}</span>
                <p className="text-sm text-text-secondary">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board column */}
        <div className="lg:col-span-2">
          <div className="card flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">
                <Target className="w-4 h-4 inline mr-1 text-accent-gold" />
                {exercise.theme} · {exercise.fen.split(" ")[1] === "w" ? "White" : "Black"} to move
              </p>
              <Tooltip content="Blindfold mode: visualize the position without the board.">
                <button
                  onClick={() => setShowBoard(!showBoard)}
                  className="btn-ghost text-xs flex items-center gap-1"
                >
                  {showBoard ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showBoard ? "Hide board" : "Show board"}
                </button>
              </Tooltip>
            </div>

            {showBoard ? (
              <Chessboard
                fen={phase === "variation" ? variationFen : exercise.fen}
                size={480}
                interactive={phase === "variation"}
                onMove={phase === "variation" ? onVariationMove : undefined}
              />
            ) : (
              <div className="w-[480px] h-[480px] bg-bg-tertiary rounded-lg flex items-center justify-center border border-border-subtle">
                <div className="text-center">
                  <EyeOff className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted text-sm">Blindfold mode</p>
                </div>
              </div>
            )}

            {/* Variation move list */}
            {phase === "variation" && variationMoves.length > 0 && (
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted uppercase tracking-wider">Your variation</span>
                  <button onClick={undoVariationMove} className="btn-ghost text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Undo
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variationMoves.map((node, i) => {
                    const isWhiteMove = i % 2 === (exercise.fen.split(" ")[1] === "w" ? 0 : 1);
                    const moveNum = Math.floor(i / 2) + 1;
                    return (
                      <span key={i} className="flex items-center gap-1">
                        {i % 2 === 0 && (
                          <span className="text-[10px] text-text-muted font-mono">{moveNum}{isWhiteMove ? "." : "..."}</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                            node.matchesEngine === true
                              ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20"
                              : node.matchesEngine === false
                              ? "bg-accent-rose/10 text-accent-rose border-accent-rose/20"
                              : "bg-bg-tertiary text-text-primary border-border-subtle"
                          }`}
                        >
                          {node.san}
                          {node.matchesEngine === true && " ✓"}
                          {node.matchesEngine === false && " ✗"}
                        </span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Depth: {depthReached}/{targetDepth} moves · Click on the board to continue calculating
                </p>
              </div>
            )}

            {/* Show solution overlay in result phase */}
            {phase === "result" && showSolution && (
              <div className="w-full mt-4 p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                <p className="text-xs text-text-muted mb-1 uppercase tracking-wider">Engine main line</p>
                <p className="font-mono text-sm text-accent-emerald">{exercise.mainLine}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Step 1: Candidates */}
          {phase === "candidates" && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-gold" />
                Step 1 — List Your Candidates
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Before calculating, list every move worth considering. Which pieces can move with purpose?
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCandidate()}
                  className="input-field text-sm flex-1 font-mono"
                  placeholder="e.g. Nf3, Rxe6..."
                />
                <button onClick={addCandidate} className="btn-secondary text-sm px-3">Add</button>
              </div>
              {userCandidates.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {userCandidates.map((move) => (
                    <span key={move} className="badge-gold font-mono">
                      {move}
                      <button onClick={() => setUserCandidates(userCandidates.filter((m) => m !== move))} className="ml-1 hover:text-accent-rose">×</button>
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={submitCandidates}
                disabled={userCandidates.length === 0}
                className="btn-primary w-full text-sm disabled:opacity-50"
              >
                Proceed to Calculate →
              </button>
            </div>
          )}

          {/* Step 2: Variation on board */}
          {phase === "variation" && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Play className="w-4 h-4 text-accent-gold" />
                Step 2 — Calculate on Board
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Play your best candidate on the board, then respond for your opponent. Go {targetDepth} moves deep.
              </p>

              <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Depth reached</span>
                  <span className="font-mono">{depthReached} / {targetDepth}</span>
                </div>
                <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-gold rounded-full transition-all"
                    style={{ width: `${Math.min((depthReached / targetDepth) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mb-4 space-y-1.5">
                {userCandidates.map((c) => (
                  <div key={c} className="flex items-center gap-2 text-xs p-2 bg-bg-secondary rounded border border-border-subtle">
                    <Zap className="w-3 h-3 text-accent-gold" />
                    <span className="font-mono font-semibold">{c}</span>
                    <span className="text-text-muted">candidate</span>
                  </div>
                ))}
              </div>

              <button
                onClick={submitVariation}
                disabled={submitting || variationMoves.length === 0}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Analysis
              </button>

              <button
                onClick={() => { resetState(); setPhase("candidates"); }}
                className="btn-ghost w-full text-xs mt-2"
              >
                ← Back to candidates
              </button>
            </div>
          )}

          {/* Results */}
          {phase === "result" && (
            <>
              <div className="card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-gold" />
                  Results
                </h3>
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Candidate Selection</span>
                      <span className="font-medium">{candidateScore}%</span>
                    </div>
                    <SkillBar label="" value={candidateScore} color="#c9a84c" showValue={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Variation Accuracy</span>
                      <span className="font-medium">{variationScore}%</span>
                    </div>
                    <SkillBar label="" value={variationScore} color="#60a5fa" showValue={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Overall Score</span>
                      <span className="font-medium">{accuracyScore}%</span>
                    </div>
                    <SkillBar label="" value={accuracyScore} color="#50c878" showValue={false} />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Your variation vs engine</p>
                  <div className="space-y-1">
                    {variationMoves.map((node, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                        node.matchesEngine === true ? "bg-accent-emerald/10" :
                        node.matchesEngine === false ? "bg-accent-rose/10" : "bg-bg-tertiary"
                      }`}>
                        {node.matchesEngine === true && <CheckCircle2 className="w-3 h-3 text-accent-emerald" />}
                        {node.matchesEngine === false && <XCircle className="w-3 h-3 text-accent-rose" />}
                        {node.matchesEngine === null && <span className="w-3 h-3 rounded-full bg-text-muted/20" />}
                        <span className="font-mono font-semibold">{node.san}</span>
                        {node.matchesEngine === false && engineMainLine[i] && (
                          <span className="text-text-muted">
                            (engine: <span className="text-accent-emerald font-mono">{engineMainLine[i]}</span>)
                          </span>
                        )}
                      </div>
                    ))}
                    {variationMoves.length === 0 && (
                      <p className="text-xs text-text-muted italic">No variation entered</p>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-2">Engine best moves:</h4>
                <div className="space-y-1.5 mb-4">
                  {bestMoves.map((bm, idx) => (
                    <div key={bm.move} className="flex items-center gap-2 text-sm">
                      {userCandidates.includes(bm.move)
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                        : <XCircle className="w-3.5 h-3.5 text-accent-rose" />}
                      <span className="font-mono">{bm.move}</span>
                      <span className="text-xs text-text-muted">
                        ({bm.eval > 0 ? "+" : ""}{bm.eval}){idx === 0 && " — best"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-accent-gold" />
                    Explanation
                  </h4>
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-xs text-accent-gold hover:underline"
                  >
                    {showSolution ? "Hide" : "Show"} solution
                  </button>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{exercise.explanation}</p>
                {showSolution && (
                  <div className="mt-3 p-2 bg-bg-tertiary rounded font-mono text-xs text-accent-emerald">
                    {exercise.mainLine}
                  </div>
                )}
              </div>

              <button onClick={nextExercise} className="btn-primary w-full flex items-center justify-center gap-2">
                {currentExercise < exercises.length - 1 ? "Next Exercise" : "Load More"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
