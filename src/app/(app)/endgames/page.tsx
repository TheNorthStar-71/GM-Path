"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Crown,
  BookOpen,
  Play,
  CheckCircle2,
  ChevronRight,
  Target,
  RotateCcw,
  Zap,
  Brain,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SkillBar } from "@/components/ui/skill-bar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EndgamePosition {
  id: string;
  fen: string;
  objective: "win" | "draw" | "loss";
  solution: string;
  explanation: string;
  order: number;
  attempted: boolean;
  solved: boolean;
  attemptCount: number;
  bestAccuracy: number;
}

interface EndgameModule {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  difficulty: number;
  description: string;
  order: number;
  positions: EndgamePosition[];
}

type FlashVerdict = "win" | "draw" | "loss";
type PracticeMode = "study" | "engine" | "flash";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Crown> = {
  king_pawn: Crown,
  opposition: Target,
  rook: BookOpen,
  minor_pieces: Zap,
  queen: Crown,
};

function getDifficultyLabel(d: number) {
  if (d <= 2) return "Beginner";
  if (d <= 3) return "Intermediate";
  return "Advanced";
}

function getDifficultyColor(d: number) {
  if (d <= 2) return "#34d399";
  if (d <= 3) return "#c9a84c";
  return "#fb7185";
}

function getModuleIcon(category: string) {
  return CATEGORY_ICONS[category] || Brain;
}

function getModuleProgress(mod: EndgameModule) {
  const total = mod.positions.length;
  if (total === 0) return { total, completed: 0, progress: 0 };
  const completed = mod.positions.filter((p) => p.solved).length;
  return { total, completed, progress: Math.round((completed / total) * 100) };
}

function getModuleMastery(mod: EndgameModule): number {
  const attempted = mod.positions.filter((p) => p.attempted);
  if (attempted.length === 0) return 0;
  return Math.round(
    attempted.reduce((s, p) => s + p.bestAccuracy, 0) / attempted.length
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EndgamesPage() {
  const [modules, setModules] = useState<EndgameModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(
    null
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("study");
  const [showSolution, setShowSolution] = useState(false);

  const [flashIndex, setFlashIndex] = useState(0);
  const [flashVerdict, setFlashVerdict] = useState<FlashVerdict | null>(null);
  const [flashResults, setFlashResults] = useState<
    { correct: boolean; label: string }[]
  >([]);
  const [flashRevealed, setFlashRevealed] = useState(false);
  const flashStartTime = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function fetchModules() {
      try {
        const res = await fetch("/api/endgames");
        if (!res.ok) throw new Error("Failed to load endgame modules");
        const data: EndgameModule[] = await res.json();
        if (cancelled) return;
        data.sort((a, b) => a.order - b.order);
        data.forEach((m) => m.positions.sort((a, b) => a.order - b.order));
        setModules(data);
        if (data.length > 0) {
          setSelectedModuleId(data[0].id);
          if (data[0].positions.length > 0) {
            setSelectedPositionId(data[0].positions[0].id);
          }
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchModules();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;
  const selectedPosition =
    selectedModule?.positions.find((p) => p.id === selectedPositionId) ?? null;

  const flashPositions = modules.flatMap((m) =>
    m.positions.map((p) => ({
      ...p,
      moduleTitle: m.title,
      moduleDifficulty: m.difficulty,
    }))
  );
  const flashPosition = flashPositions[flashIndex] ?? null;

  const overallProgress =
    modules.length > 0
      ? Math.round(
          modules.reduce((s, m) => s + getModuleProgress(m).progress, 0) /
            modules.length
        )
      : 0;

  const recordAttempt = useCallback(
    async (data: {
      positionId: string;
      solved: boolean;
      moves: string[];
      timeSpent: number;
      accuracy: number;
    }) => {
      try {
        await fetch("/api/endgames/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        /* network failures shouldn't block UI */
      }
    },
    []
  );

  function handleSelectModule(mod: EndgameModule) {
    setSelectedModuleId(mod.id);
    if (mod.positions.length > 0) {
      setSelectedPositionId(mod.positions[0].id);
    }
    setShowSolution(false);
    setPracticeMode("study");
  }

  function handleSelectPosition(pos: EndgamePosition) {
    setSelectedPositionId(pos.id);
    setShowSolution(false);
  }

  function handleMarkStudied() {
    if (!selectedPosition) return;
    recordAttempt({
      positionId: selectedPosition.id,
      solved: true,
      moves: [],
      timeSpent: 0,
      accuracy: 100,
    });
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        positions: m.positions.map((p) =>
          p.id === selectedPosition.id
            ? { ...p, attempted: true, solved: true, attemptCount: p.attemptCount + 1 }
            : p
        ),
      }))
    );
  }

  function handleFlashAnswer(answer: FlashVerdict) {
    if (!flashPosition) return;
    setFlashVerdict(answer);
    setFlashRevealed(true);
    const correct = answer === flashPosition.objective;
    setFlashResults((prev) => [
      ...prev,
      { correct, label: flashPosition.moduleTitle },
    ]);

    const elapsed = Math.round((Date.now() - flashStartTime.current) / 1000);
    recordAttempt({
      positionId: flashPosition.id,
      solved: correct,
      moves: [],
      timeSpent: elapsed,
      accuracy: correct ? 100 : 0,
    });

    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        positions: m.positions.map((p) =>
          p.id === flashPosition.id
            ? {
                ...p,
                attempted: true,
                solved: p.solved || correct,
                attemptCount: p.attemptCount + 1,
              }
            : p
        ),
      }))
    );
  }

  function handleFlashNext() {
    setFlashVerdict(null);
    setFlashRevealed(false);
    flashStartTime.current = Date.now();
    setFlashIndex((i) => (i + 1) % Math.max(flashPositions.length, 1));
  }

  const difficultyDots = (level: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < level ? "bg-accent-gold" : "bg-bg-tertiary"
          }`}
        />
      ))}
    </div>
  );

  // ─── Loading / Error States ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
        <p className="text-text-muted text-sm">Loading endgame modules…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <AlertCircle className="w-8 h-8 text-accent-rose" />
        <p className="text-text-muted text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <Crown className="w-8 h-8 text-text-muted" />
        <p className="text-text-muted text-sm">
          No endgame modules available yet.
        </p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const moduleProgress = selectedModule
    ? getModuleProgress(selectedModule)
    : null;
  const moduleMastery = selectedModule ? getModuleMastery(selectedModule) : 0;
  const dColor = selectedModule
    ? getDifficultyColor(selectedModule.difficulty)
    : "#c9a84c";
  const dLabel = selectedModule
    ? getDifficultyLabel(selectedModule.difficulty)
    : "";
  const ModIcon = selectedModule
    ? getModuleIcon(selectedModule.category)
    : Brain;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Endgame Lab</h1>
          <p className="text-text-muted mt-1">
            Structured endgame training with smart review
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-text-muted">
            {modules.length} module{modules.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </div>

      {/* Coach's Note */}
      <div className="p-4 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm text-text-secondary leading-relaxed">
          Endgames are where most beginner games are decided. Mastering a handful of
          fundamental positions will immediately convert wins you are already earning
          at the board.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="segmented-control">
        {([
          { value: "study" as const, label: "Study Mode", icon: BookOpen, description: "Guided walkthrough of each position with instructional commentary" },
          { value: "engine" as const, label: "Play vs Engine", icon: Play, description: "Practice the technique against computer resistance" },
          { value: "flash" as const, label: "Flash Assessment", icon: Zap, description: "Rapid evaluation — determine the outcome of each position" },
        ] as const).map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => setPracticeMode(m.value)}
              data-active={practiceMode === m.value}
              className="flex items-center gap-2"
              title={m.description}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* ─── Flash Assessment Mode ──────────────────────────────────────── */}
      {practiceMode === "flash" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card flex flex-col items-center">
              {flashPosition ? (
                <>
                  <div className="w-full flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="badge-gold">
                        {flashPosition.moduleTitle}
                      </span>
                      {difficultyDots(flashPosition.moduleDifficulty)}
                    </div>
                    <span className="text-sm text-text-muted font-mono">
                      #{flashIndex + 1}/{flashPositions.length}
                    </span>
                  </div>

                  <Chessboard fen={flashPosition.fen} size={480} />

                  <div className="w-full mt-4">
                    <p className="text-sm text-text-secondary text-center mb-4">
                      Win, draw, or loss for White?
                    </p>

                    {!flashRevealed ? (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleFlashAnswer("win")}
                          className="px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all
                            bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald
                            hover:bg-accent-emerald/20"
                        >
                          Win
                        </button>
                        <button
                          onClick={() => handleFlashAnswer("draw")}
                          className="px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all
                            bg-accent-blue/10 border-accent-blue/30 text-accent-blue
                            hover:bg-accent-blue/20"
                        >
                          Draw
                        </button>
                        <button
                          onClick={() => handleFlashAnswer("loss")}
                          className="px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all
                            bg-accent-rose/10 border-accent-rose/30 text-accent-rose
                            hover:bg-accent-rose/20"
                        >
                          Loss
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            flashVerdict === flashPosition.objective
                              ? "bg-accent-emerald/10 border-accent-emerald/20"
                              : "bg-accent-rose/10 border-accent-rose/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {flashVerdict === flashPosition.objective ? (
                              <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
                            ) : (
                              <Target className="w-5 h-5 text-accent-rose" />
                            )}
                            <div>
                              <span
                                className={`font-semibold text-sm ${
                                  flashVerdict === flashPosition.objective
                                    ? "text-accent-emerald"
                                    : "text-accent-rose"
                                }`}
                              >
                                {flashVerdict === flashPosition.objective
                                  ? "Correct!"
                                  : "Incorrect"}
                              </span>
                              <span className="text-xs text-text-muted ml-2">
                                This position is a{" "}
                                <span className="font-semibold text-text-secondary capitalize">
                                  {flashPosition.objective}
                                </span>{" "}
                                for White
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleFlashNext}
                            className="btn-primary text-sm flex items-center gap-1"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {flashPosition.explanation && (
                          <div className="p-3 bg-bg-tertiary rounded-lg">
                            <p className="text-sm text-text-secondary leading-relaxed">
                              {flashPosition.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-text-muted text-sm py-12">
                  No positions available for flash training.
                </p>
              )}
            </div>
          </div>

          {/* Flash Side Panel */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Flash Session</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                  <p className="text-xl font-bold text-accent-emerald">
                    {flashResults.filter((r) => r.correct).length}
                  </p>
                  <p className="text-xs text-text-muted">Correct</p>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                  <p className="text-xl font-bold text-accent-rose">
                    {flashResults.filter((r) => !r.correct).length}
                  </p>
                  <p className="text-xs text-text-muted">Incorrect</p>
                </div>
              </div>
              {flashResults.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <p className="text-xs text-text-muted mb-2">Recent</p>
                  <div className="space-y-1">
                    {flashResults
                      .slice(-5)
                      .reverse()
                      .map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          {r.correct ? (
                            <CheckCircle2 className="w-3 h-3 text-accent-emerald" />
                          ) : (
                            <Target className="w-3 h-3 text-accent-rose" />
                          )}
                          <span className="text-text-secondary">{r.label}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card bg-accent-gold/5 border-accent-gold/10">
              <h3 className="text-sm font-semibold text-accent-gold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Flash Training
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Quick assessment builds your intuition for recognizing winning,
                drawing, and losing patterns at a glance. Speed matters in time
                pressure.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Study & Engine Modes ───────────────────────────────────────── */}
      {practiceMode !== "flash" && selectedModule && selectedPosition && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board Area */}
          <div className="lg:col-span-2">
            <div className="card flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="badge-gold">{selectedModule.title}</span>
                  {difficultyDots(selectedModule.difficulty)}
                </div>
                <span className="text-sm text-text-muted font-mono">
                  Position {selectedPosition.order}
                </span>
              </div>

              <Chessboard
                fen={selectedPosition.fen}
                size={480}
                interactive={practiceMode === "engine"}
              />

              <div className="w-full mt-4 space-y-3">
                {practiceMode === "study" && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                      <p className="text-sm text-text-secondary">
                        <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                        Evaluate this position
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedPosition.solved && (
                          <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            selectedPosition.objective === "win"
                              ? "bg-accent-emerald/10 text-accent-emerald"
                              : selectedPosition.objective === "draw"
                              ? "bg-accent-blue/10 text-accent-blue"
                              : "bg-accent-rose/10 text-accent-rose"
                          }`}
                        >
                          {selectedPosition.objective.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Solution toggle */}
                    <button
                      onClick={() => setShowSolution((v) => !v)}
                      className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showSolution ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {showSolution ? "Hide Solution" : "Show Solution"}
                    </button>

                    {showSolution && (
                      <div className="space-y-2 animate-fade-in">
                        {selectedPosition.solution && (
                          <div className="p-3 rounded-lg bg-accent-gold/5 border border-accent-gold/10">
                            <p className="text-xs font-semibold text-accent-gold mb-1">
                              Solution
                            </p>
                            <p className="text-sm text-text-secondary leading-relaxed">
                              {selectedPosition.solution}
                            </p>
                          </div>
                        )}
                        {selectedPosition.explanation && (
                          <div className="p-3 rounded-lg bg-bg-tertiary">
                            <p className="text-xs font-semibold text-text-muted mb-1">
                              Explanation
                            </p>
                            <p className="text-sm text-text-secondary leading-relaxed">
                              {selectedPosition.explanation}
                            </p>
                          </div>
                        )}
                        {!selectedPosition.solved && (
                          <button
                            onClick={handleMarkStudied}
                            className="btn-primary text-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Studied
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {practiceMode === "engine" && (
                  <div className="flex items-center justify-between p-3 bg-accent-gold/5 border border-accent-gold/10 rounded-lg">
                    <p className="text-sm text-text-secondary">
                      <Play className="w-4 h-4 inline mr-1.5 -mt-0.5 text-accent-gold" />
                      Play against the engine to convert this position
                    </p>
                    <button className="btn-primary text-sm flex items-center gap-1">
                      Start <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Position Navigator */}
              <div className="w-full mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                {selectedModule.positions.map((pos, idx) => (
                  <button
                    key={pos.id}
                    onClick={() => handleSelectPosition(pos)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      selectedPosition.id === pos.id
                        ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                        : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border"
                    }`}
                  >
                    {pos.solved && (
                      <CheckCircle2 className="w-3 h-3 text-accent-emerald" />
                    )}
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Module Info */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${dColor}15` }}
                >
                  <ModIcon
                    className="w-5 h-5"
                    style={{ color: dColor }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">
                    {selectedModule.title}
                  </h3>
                  <span
                    className="text-xs font-medium"
                    style={{ color: dColor }}
                  >
                    {dLabel}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {selectedModule.description}
              </p>
              {moduleProgress && (
                <>
                  <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                    <span>
                      {moduleProgress.completed}/{moduleProgress.total}{" "}
                      positions
                    </span>
                    <span>{moduleProgress.progress}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-gold rounded-full transition-all duration-500"
                      style={{ width: `${moduleProgress.progress}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Position Stats */}
            {selectedPosition.attempted && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Position Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-bg-tertiary rounded-lg text-center">
                    <p className="text-lg font-bold text-text-primary">
                      {selectedPosition.attemptCount}
                    </p>
                    <p className="text-xs text-text-muted">Attempts</p>
                  </div>
                  <div className="p-2.5 bg-bg-tertiary rounded-lg text-center">
                    <p className="text-lg font-bold text-accent-gold">
                      {Math.round(selectedPosition.bestAccuracy)}%
                    </p>
                    <p className="text-xs text-text-muted">Best Accuracy</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mastery */}
            <div className="card flex flex-col items-center">
              <ProgressRing
                progress={moduleMastery}
                size={110}
                label="Mastery"
                sublabel={selectedModule.title}
              />
            </div>

            {/* Skills Breakdown */}
            {modules.length > 1 && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Endgame Skills</h3>
                <div className="space-y-3">
                  {modules.map((m) => (
                    <SkillBar
                      key={m.id}
                      label={m.title}
                      value={getModuleMastery(m)}
                      color={getDifficultyColor(m.difficulty)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Curriculum Overview ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-accent-gold" />
            <h2 className="font-display text-lg font-semibold">
              Endgame Curriculum
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Overall Progress</span>
            <span className="font-semibold text-text-primary">
              {overallProgress}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = getModuleIcon(mod.category);
            const prog = getModuleProgress(mod);
            const color = getDifficultyColor(mod.difficulty);
            const label = getDifficultyLabel(mod.difficulty);

            return (
              <button
                key={mod.id}
                onClick={() => handleSelectModule(mod)}
                className={`card-hover text-left relative overflow-hidden transition-all ${
                  selectedModuleId === mod.id ? "ring-1 ring-accent-gold/40" : ""
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-bg-tertiary">
                  <div
                    className="h-full bg-accent-gold transition-all duration-500"
                    style={{ width: `${prog.progress}%` }}
                  />
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">
                        {mod.title}
                      </h3>
                      {prog.progress === 100 && (
                        <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium" style={{ color }}>
                        {label}
                      </span>
                      <span className="text-xs text-text-muted">
                        {prog.total} positions
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {mod.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-text-muted">Approx. {mod.positions.length * 3} min</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          mod.difficulty <= 2 ? "bg-accent-emerald" : mod.difficulty <= 3 ? "bg-accent-gold" : "bg-accent-rose"
                        }`} />
                        {mod.difficulty <= 2 ? "Beginner" : mod.difficulty <= 3 ? "Intermediate" : "Advanced"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-bg-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-gold rounded-full"
                            style={{ width: `${prog.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted">
                          {prog.progress}%
                        </span>
                      </div>

                      {prog.completed > 0 && prog.progress < 100 && (
                        <span className="badge-blue text-[10px]">
                          {prog.completed}/{prog.total} done
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
