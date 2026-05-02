"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Brain,
  Loader2,
  Save,
} from "lucide-react";

type ReviewPhase = "self" | "engine";

interface MoveAnnotation {
  moveIndex: number;
  isCritical: boolean;
  comment: string;
  emotion: string;
}

interface GameAnnotation {
  moveNumber: number;
  isWhiteMove: boolean;
  fen: string;
  userComment: string | null;
  engineEval: number | null;
  bestMove: string | null;
  playedMove: string | null;
  classification: string | null;
  isCriticalMoment: boolean;
  userEmotion: string | null;
}

interface GameMistake {
  moveNumber: number;
  fen: string;
  playedMove: string;
  bestMove: string;
  evalDrop: number;
  category: string;
  subcategory: string | null;
  explanation: string | null;
  phase: string;
}

interface GameData {
  id: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  opening: string | null;
  selfReviewComplete: boolean;
  engineReviewComplete: boolean;
  accuracy: number | null;
  averageCentipawnLoss: number | null;
  annotations: GameAnnotation[];
  mistakes: GameMistake[];
}

const EMOTIONS = [
  { value: "confident", label: "Confident" },
  { value: "uncertain", label: "Uncertain" },
  { value: "surprised", label: "Surprised" },
  { value: "panicked", label: "Panicked" },
  { value: "time_pressure", label: "Time Pressure" },
  { value: "bored", label: "Bored/Unfocused" },
];

const CATEGORY_LABELS: Record<string, string> = {
  tactical_blindness: "Tactical Blindness",
  calculation_failure: "Calculation Failure",
  opening_ignorance: "Opening Inaccuracy",
  positional_misunderstanding: "Positional Misjudgment",
  endgame_failure: "Endgame Failure",
  time_management: "Time Management",
  psychological_tilt: "Psychological Tilt",
  conversion_failure: "Conversion Failure",
  defensive_failure: "Defensive Failure",
};

export default function GameReviewPage() {
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ReviewPhase>("self");
  const [currentMove, setCurrentMove] = useState(0);
  const [annotations, setAnnotations] = useState<MoveAnnotation[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data);
          if (data.annotations?.length > 0) {
            setAnnotations(
              data.annotations
                .filter((a: GameAnnotation) => a.userComment)
                .map((a: GameAnnotation) => ({
                  moveIndex: a.moveNumber,
                  isCritical: a.isCriticalMoment,
                  comment: a.userComment || "",
                  emotion: a.userEmotion || "",
                }))
            );
          }
          if (data.selfReviewComplete && data.mistakes?.length > 0) {
            setPhase("engine");
          }
        } else {
          setError("Game not found");
        }
      } catch {
        setError("Failed to load game");
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [gameId]);

  const chess = useMemo(() => {
    if (!game) return null;
    const c = new Chess();
    try {
      c.loadPgn(game.pgn);
    } catch {
      return null;
    }
    return c;
  }, [game]);

  const moves = useMemo(() => chess?.history() ?? [], [chess]);

  const fenAtMove = useCallback(
    (moveIndex: number) => {
      if (!chess) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const c = new Chess();
      const history = chess.history();
      for (let i = 0; i < moveIndex && i < history.length; i++) {
        c.move(history[i]);
      }
      return c.fen();
    },
    [chess]
  );

  const currentFen = fenAtMove(currentMove);

  const lastMoveInfo = useMemo(() => {
    if (currentMove === 0 || !chess) return undefined;
    const history = chess.history({ verbose: true });
    const lastVerbose = history[currentMove - 1];
    return lastVerbose ? { from: lastVerbose.from, to: lastVerbose.to } : undefined;
  }, [currentMove, chess]);

  const mistakeAtCurrentMove = useMemo(() => {
    if (!game?.mistakes) return null;
    return game.mistakes.find((m) => m.moveNumber === currentMove) || null;
  }, [game, currentMove]);

  function addAnnotation() {
    if (!currentComment.trim()) return;
    setAnnotations((prev) => [
      ...prev.filter((a) => a.moveIndex !== currentMove),
      {
        moveIndex: currentMove,
        isCritical,
        comment: currentComment,
        emotion: currentEmotion,
      },
    ]);
    setCurrentComment("");
    setCurrentEmotion("");
    setIsCritical(false);
  }

  async function saveAnnotations() {
    if (!game || annotations.length === 0) return;
    setSaving(true);
    try {
      const payload = annotations.map((a) => ({
        moveNumber: a.moveIndex,
        isWhiteMove: a.moveIndex % 2 === 1,
        fen: fenAtMove(a.moveIndex),
        userComment: a.comment,
        isCriticalMoment: a.isCritical,
        userEmotion: a.emotion || null,
      }));

      const res = await fetch(`/api/games/${gameId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: payload }),
      });

      if (res.ok) {
        setGame((prev) =>
          prev ? { ...prev, selfReviewComplete: true } : prev
        );
      }
    } catch {
      // Fail silently
    } finally {
      setSaving(false);
    }
  }

  const annotationForCurrentMove = annotations.find(
    (a) => a.moveIndex === currentMove
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  if (error || !game || !chess) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-8 h-8 text-accent-rose mx-auto mb-4" />
        <p className="text-text-muted">{error || "Could not load game"}</p>
      </div>
    );
  }

  const blunderCount = game.mistakes.filter(
    (m) => m.evalDrop >= 200
  ).length;
  const mistakeCount = game.mistakes.filter(
    (m) => m.evalDrop >= 100 && m.evalDrop < 200
  ).length;
  const inaccuracyCount = game.mistakes.filter(
    (m) => m.evalDrop >= 50 && m.evalDrop < 100
  ).length;

  const mistakesByCategory = game.mistakes.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Game Review</h1>
          <p className="text-text-muted text-sm mt-1">
            {game.white} vs {game.black}
            {game.opening && ` — ${game.opening}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhase("self")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              phase === "self"
                ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                : "bg-bg-tertiary border-border-subtle text-text-secondary"
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5" />
            Self-Analysis
          </button>
          <button
            onClick={() => setPhase("engine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              phase === "engine"
                ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
                : "bg-bg-tertiary border-border-subtle text-text-secondary"
            }`}
          >
            <Cpu className="w-4 h-4 inline mr-1.5" />
            Engine Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card flex flex-col items-center">
            <Chessboard
              fen={currentFen}
              size={480}
              lastMove={lastMoveInfo}
            />

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setCurrentMove(0)}
                className="btn-ghost p-2"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentMove(Math.max(0, currentMove - 1))
                }
                className="btn-ghost p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-muted font-mono px-3 min-w-[80px] text-center">
                {currentMove === 0
                  ? "Start"
                  : `${Math.ceil(currentMove / 2)}.${currentMove % 2 === 1 ? "" : ".."}${moves[currentMove - 1]}`}
              </span>
              <button
                onClick={() =>
                  setCurrentMove(Math.min(moves.length, currentMove + 1))
                }
                className="btn-ghost p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMove(moves.length)}
                className="btn-ghost p-2"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full mt-4 p-3 bg-bg-tertiary rounded-lg max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-sm font-mono">
                {moves.map((move, i) => {
                  const hasAnnotation = annotations.some(
                    (a) => a.moveIndex === i + 1
                  );
                  const mistake = game.mistakes.find(
                    (m) => m.moveNumber === i + 1
                  );
                  const isBlunder = mistake && mistake.evalDrop >= 200;
                  const isMistake =
                    mistake && mistake.evalDrop >= 100 && mistake.evalDrop < 200;
                  const isInaccuracy =
                    mistake && mistake.evalDrop >= 50 && mistake.evalDrop < 100;

                  return (
                    <span key={i} className="inline-flex items-center">
                      {i % 2 === 0 && (
                        <span className="text-text-muted mr-1">
                          {Math.floor(i / 2) + 1}.
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentMove(i + 1)}
                        className={`px-1 rounded transition-colors ${
                          currentMove === i + 1
                            ? "bg-accent-gold/20 text-accent-gold"
                            : phase === "engine" && isBlunder
                              ? "text-accent-rose"
                              : phase === "engine" && isMistake
                                ? "text-orange-400"
                                : phase === "engine" && isInaccuracy
                                  ? "text-yellow-400"
                                  : hasAnnotation
                                    ? "text-accent-blue"
                                    : "text-text-primary hover:text-accent-gold"
                        }`}
                      >
                        {move}
                        {hasAnnotation && !mistake && (
                          <span className="text-accent-blue">*</span>
                        )}
                        {phase === "engine" && isBlunder && (
                          <span className="text-accent-rose">??</span>
                        )}
                        {phase === "engine" && isMistake && (
                          <span className="text-orange-400">?</span>
                        )}
                        {phase === "engine" && isInaccuracy && (
                          <span className="text-yellow-400">?!</span>
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {phase === "self" && (
            <>
              <div className="card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent-gold" />
                  Your Analysis
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  Annotate this position before seeing the engine. What do you
                  think about this move?
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="rounded border-border accent-accent-gold"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Flag className="w-3 h-3 text-accent-gold" />
                      Critical moment
                    </span>
                  </label>

                  <div>
                    <label className="label block mb-1.5">
                      How did you feel here?
                    </label>
                    <select
                      value={currentEmotion}
                      onChange={(e) => setCurrentEmotion(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="">Select...</option>
                      {EMOTIONS.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label block mb-1.5">Comment</label>
                    <textarea
                      value={currentComment}
                      onChange={(e) => setCurrentComment(e.target.value)}
                      className="input-field text-sm h-24 resize-none"
                      placeholder="What were you thinking? What would you play differently?"
                    />
                  </div>

                  <button
                    onClick={addAnnotation}
                    className="btn-primary w-full text-sm"
                    disabled={!currentComment.trim()}
                  >
                    Save Annotation
                  </button>
                </div>
              </div>

              {annotationForCurrentMove && (
                <div className="card bg-accent-blue/5 border-accent-blue/20">
                  <h4 className="text-sm font-medium text-accent-blue mb-2">
                    Your Note:
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {annotationForCurrentMove.comment}
                  </p>
                  {annotationForCurrentMove.isCritical && (
                    <span className="badge-gold mt-2 inline-block">
                      Critical Moment
                    </span>
                  )}
                </div>
              )}

              <div className="card bg-accent-gold/5 border-accent-gold/10">
                <p className="text-sm text-accent-gold">
                  <strong>Tip:</strong> Try to annotate at least 5-10 critical
                  moments before switching to engine review.
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {annotations.length} annotation
                  {annotations.length !== 1 ? "s" : ""} so far
                </p>
              </div>

              {annotations.length >= 3 && (
                <button
                  onClick={saveAnnotations}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving
                    ? "Saving..."
                    : "Save & Continue to Engine Review"}
                </button>
              )}
            </>
          )}

          {phase === "engine" && (
            <>
              {mistakeAtCurrentMove ? (
                <div
                  className={`card border-l-4 ${
                    mistakeAtCurrentMove.evalDrop >= 200
                      ? "border-l-accent-rose"
                      : mistakeAtCurrentMove.evalDrop >= 100
                        ? "border-l-orange-400"
                        : "border-l-yellow-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        mistakeAtCurrentMove.evalDrop >= 200
                          ? "text-accent-rose"
                          : mistakeAtCurrentMove.evalDrop >= 100
                            ? "text-orange-400"
                            : "text-yellow-400"
                      }`}
                    />
                    <span className="font-semibold text-sm capitalize">
                      {mistakeAtCurrentMove.evalDrop >= 200
                        ? "Blunder"
                        : mistakeAtCurrentMove.evalDrop >= 100
                          ? "Mistake"
                          : "Inaccuracy"}
                    </span>
                    <span className="text-xs text-text-muted ml-auto font-mono">
                      Eval drop: {mistakeAtCurrentMove.evalDrop.toFixed(0)} cp
                    </span>
                  </div>
                  {mistakeAtCurrentMove.explanation && (
                    <p className="text-sm text-text-secondary mb-3">
                      {mistakeAtCurrentMove.explanation}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-text-muted">Played:</span>{" "}
                      <span className="font-mono text-accent-rose">
                        {mistakeAtCurrentMove.playedMove}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Best:</span>{" "}
                      <span className="font-mono text-accent-emerald">
                        {mistakeAtCurrentMove.bestMove}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="badge-gold text-[10px]">
                      {CATEGORY_LABELS[mistakeAtCurrentMove.category] ||
                        mistakeAtCurrentMove.category}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="flex items-center gap-2 text-accent-emerald mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold text-sm">Good move</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    No significant issues detected at this position.
                  </p>
                </div>
              )}

              <div className="card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent-gold" />
                  Game Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Accuracy</span>
                    <span className="font-medium">
                      {game.accuracy !== null
                        ? `${game.accuracy}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Blunders</span>
                    <span className="font-medium text-accent-rose">
                      {blunderCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Mistakes</span>
                    <span className="font-medium text-orange-400">
                      {mistakeCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Inaccuracies</span>
                    <span className="font-medium text-yellow-400">
                      {inaccuracyCount}
                    </span>
                  </div>
                  {game.averageCentipawnLoss !== null && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Avg CPL</span>
                      <span className="font-medium">
                        {game.averageCentipawnLoss}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(mistakesByCategory).length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-sm mb-3">
                    Mistake Categories
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(mistakesByCategory).map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="badge-rose text-[10px]">{count}</span>
                        <span className="text-sm text-text-secondary">
                          {CATEGORY_LABELS[cat] || cat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
