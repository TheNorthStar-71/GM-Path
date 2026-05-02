"use client";

import { useState } from "react";
import {
  Crown,
  BookOpen,
  Brain,
  Shield,
  Sword,
  Lock,
  ChevronDown,
  ChevronRight,
  Trophy,
  Star,
  Sparkles,
  GraduationCap,
  Target,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleTopic {
  title: string;
}

interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  icon: typeof Crown;
  difficulty: "Advanced" | "Expert" | "Master";
  lessonCount: number;
  lessonLabel?: string;
  topics: ModuleTopic[];
  progress: number;
}

interface GMGame {
  white: string;
  black: string;
  year: number;
  opening: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CURRENT_RATING = 1847;
const REQUIRED_RATING = 2200;
const IS_UNLOCKED = CURRENT_RATING >= REQUIRED_RATING;

const MODULES: CurriculumModule[] = [
  {
    id: "advanced-pawn-structures",
    title: "Advanced Pawn Structures",
    description:
      "Deep mastery of critical pawn formations that define grandmaster-level play. Understand the strategic commitments behind every pawn move.",
    icon: Target,
    difficulty: "Advanced",
    lessonCount: 8,
    topics: [
      { title: "IQP (Isolated Queen Pawn) mastery" },
      { title: "Carlsbad structure plans" },
      { title: "Hanging pawns dynamics" },
      { title: "Pawn breaks and timing" },
    ],
    progress: 0,
  },
  {
    id: "prophylactic-thinking",
    title: "Prophylactic Thinking",
    description:
      "The art of preventing your opponent's plans before they materialize. Learn the thinking method that separated Petrosian from his contemporaries.",
    icon: Shield,
    difficulty: "Expert",
    lessonCount: 6,
    topics: [
      { title: "Petrosian's defensive method" },
      { title: "Preventing opponent's plans" },
      { title: "Overprotection concept" },
      { title: "Restraint strategy" },
    ],
    progress: 0,
  },
  {
    id: "subtle-imbalance-evaluation",
    title: "Subtle Imbalance Evaluation",
    description:
      "Evaluate positions where material is equal but hidden imbalances determine the outcome. Master the exchange sacrifice and compensation assessment.",
    icon: Brain,
    difficulty: "Expert",
    lessonCount: 7,
    topics: [
      { title: "Bishop pair vs knight pair" },
      { title: "Good bishop vs bad bishop" },
      { title: "Exchange sacrifice concepts" },
      { title: "Compensation evaluation" },
    ],
    progress: 0,
  },
  {
    id: "advanced-endgame-theory",
    title: "Advanced Endgame Theory",
    description:
      "Complete theoretical coverage of the most complex endgame positions. From tablebase knowledge to fortress construction at the highest level.",
    icon: Crown,
    difficulty: "Master",
    lessonCount: 10,
    topics: [
      { title: "7-piece tablebase positions" },
      { title: "Rook + pawn vs rook: complete theory" },
      { title: "Opposite color bishop endings with rooks" },
      { title: "Fortress concepts" },
    ],
    progress: 0,
  },
  {
    id: "classical-gm-games",
    title: "Classical GM Games",
    description:
      "Study annotated masterpieces from the greatest players in history. Each game is a complete lesson in strategic and tactical excellence.",
    icon: GraduationCap,
    difficulty: "Advanced",
    lessonCount: 12,
    lessonLabel: "annotated games",
    topics: [
      { title: "Fischer's attacking masterclass" },
      { title: "Karpov's positional domination" },
      { title: "Kasparov's dynamic play" },
      { title: "Carlsen's endgame precision" },
    ],
    progress: 0,
  },
];

const GM_GAMES: GMGame[] = [
  { white: "Fischer", black: "Byrne", year: 1956, opening: "Grunfeld Defense" },
  { white: "Kasparov", black: "Topalov", year: 1999, opening: "Pirc Defense" },
  { white: "Morphy", black: "Allies", year: 1858, opening: "Italian Game" },
  { white: "Karpov", black: "Kasparov", year: 1985, opening: "Sicilian Najdorf" },
  { white: "Carlsen", black: "Anand", year: 2013, opening: "Berlin Defense" },
  { white: "Tal", black: "Larsen", year: 1965, opening: "Sicilian Defense" },
  { white: "Petrosian", black: "Spassky", year: 1966, opening: "Queen's Gambit" },
  { white: "Alekhine", black: "Capablanca", year: 1927, opening: "Queen's Gambit" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDifficultyBadgeClass(difficulty: CurriculumModule["difficulty"]) {
  switch (difficulty) {
    case "Advanced":
      return "badge bg-accent-gold/10 text-accent-gold";
    case "Expert":
      return "badge bg-accent-purple/10 text-accent-purple";
    case "Master":
      return "badge bg-accent-rose/10 text-accent-rose";
  }
}

function getDifficultyAccentColor(difficulty: CurriculumModule["difficulty"]) {
  switch (difficulty) {
    case "Advanced":
      return "text-accent-gold";
    case "Expert":
      return "text-accent-purple";
    case "Master":
      return "text-accent-rose";
  }
}

function getDifficultyBorderColor(difficulty: CurriculumModule["difficulty"]) {
  switch (difficulty) {
    case "Advanced":
      return "border-accent-gold/30";
    case "Expert":
      return "border-accent-purple/30";
    case "Master":
      return "border-accent-rose/30";
  }
}

function getDifficultyBgColor(difficulty: CurriculumModule["difficulty"]) {
  switch (difficulty) {
    case "Advanced":
      return "bg-accent-gold/5";
    case "Expert":
      return "bg-accent-purple/5";
    case "Master":
      return "bg-accent-rose/5";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MasterPathPage() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const progressPercent = Math.min(
    Math.round((CURRENT_RATING / REQUIRED_RATING) * 100),
    100
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
            <Crown className="w-6 h-6 text-accent-gold" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Master Path</h1>
            <p className="text-text-muted mt-0.5">
              Advanced curriculum for 2200+ rated players
            </p>
          </div>
        </div>
      </div>

      {/* ─── Rating Gate Banner ──────────────────────────────────────────── */}
      {!IS_UNLOCKED && (
        <div className="relative overflow-hidden rounded-xl border border-accent-gold/20 bg-gradient-to-r from-bg-card via-accent-gold/[0.03] to-bg-card p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="p-2 rounded-lg bg-accent-gold/10 mt-0.5">
              <Lock className="w-5 h-5 text-accent-gold" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary">
                  Curriculum Locked
                </h3>
                <span className="badge bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Preview
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                This curriculum unlocks at 2200+ rating. Current progress:{" "}
                <span className="font-semibold text-accent-gold">
                  {CURRENT_RATING}
                </span>
                <span className="text-text-muted"> / {REQUIRED_RATING}</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-gold-dim via-accent-gold to-accent-gold-light rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Area ───────────────────────────────────────────── */}
      <div className="relative">
        {/* Opacity overlay when locked */}
        {!IS_UNLOCKED && (
          <div className="absolute inset-0 bg-bg-primary/30 backdrop-blur-[0.5px] z-10 rounded-xl pointer-events-none" />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ─── Module Cards (Main Column) ────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-accent-gold" />
              <h2 className="font-display text-lg font-semibold">
                Curriculum Modules
              </h2>
              <span className="text-xs text-text-muted ml-auto">
                {MODULES.length} modules &middot;{" "}
                {MODULES.reduce(
                  (sum, m) => sum + m.lessonCount,
                  0
                )}{" "}
                total lessons
              </span>
            </div>

            {MODULES.map((mod, index) => {
              const Icon = mod.icon;
              const isExpanded = expandedModules.has(mod.id);

              return (
                <div
                  key={mod.id}
                  className={`card-hover overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? `ring-1 ${getDifficultyBorderColor(mod.difficulty).replace("border-", "ring-")}`
                      : ""
                  }`}
                >
                  {/* Progress bar at top of card */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-bg-tertiary">
                    <div
                      className="h-full bg-accent-gold rounded-full transition-all duration-500"
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>

                  {/* Card Header (clickable) */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-4">
                      {/* Module icon */}
                      <div
                        className={`p-2.5 rounded-xl ${getDifficultyBgColor(mod.difficulty)} border ${getDifficultyBorderColor(mod.difficulty)} flex-shrink-0`}
                      >
                        <Icon
                          className={`w-5 h-5 ${getDifficultyAccentColor(mod.difficulty)}`}
                        />
                      </div>

                      {/* Module info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-text-primary">
                            {mod.title}
                          </h3>
                          <span className={getDifficultyBadgeClass(mod.difficulty)}>
                            {mod.difficulty}
                          </span>
                          {!IS_UNLOCKED && (
                            <span className="badge bg-bg-tertiary text-text-muted border border-border-subtle">
                              Preview
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {mod.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {mod.lessonCount}{" "}
                              {mod.lessonLabel || "lessons"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-1.5 w-20 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-gold rounded-full transition-all duration-500"
                                style={{ width: `${mod.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted">
                              {mod.progress}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand/collapse */}
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-text-muted transition-transform" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-text-muted transition-transform" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-border-subtle animate-fade-in">
                      {/* Topics */}
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                          Topics Covered
                        </h4>
                        <ul className="space-y-2">
                          {mod.topics.map((topic) => (
                            <li
                              key={topic.title}
                              className="flex items-center gap-2.5 text-sm text-text-secondary"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  mod.difficulty === "Advanced"
                                    ? "bg-accent-gold"
                                    : mod.difficulty === "Expert"
                                    ? "bg-accent-purple"
                                    : "bg-accent-rose"
                                }`}
                              />
                              {topic.title}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Module Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                          <p className="text-lg font-bold text-text-primary">
                            {mod.lessonCount}
                          </p>
                          <p className="text-xs text-text-muted">
                            {mod.lessonLabel || "Lessons"}
                          </p>
                        </div>
                        <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                          <p className="text-lg font-bold text-text-primary">
                            {mod.topics.length}
                          </p>
                          <p className="text-xs text-text-muted">Topics</p>
                        </div>
                        <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                          <p className={`text-lg font-bold ${getDifficultyAccentColor(mod.difficulty)}`}>
                            {mod.difficulty}
                          </p>
                          <p className="text-xs text-text-muted">Level</p>
                        </div>
                      </div>

                      {/* Begin Module Button */}
                      <button
                        className={`btn-primary w-full flex items-center justify-center gap-2 ${
                          !IS_UNLOCKED
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!IS_UNLOCKED}
                      >
                        {IS_UNLOCKED ? (
                          <>
                            Begin Module
                            <ChevronRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Reach 2200 to Unlock
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ─── GM Game Collection Sidebar (Desktop) ──────────────────── */}
          <div className="hidden xl:block space-y-4">
            {/* Sidebar Header */}
            <div className="card border-accent-gold/10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-lg bg-accent-gold/10">
                  <Trophy className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">
                    GM Game Collection
                  </h3>
                  <p className="text-xs text-text-muted">
                    Famous games to study &amp; analyze
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GM_GAMES.map((game, i) => (
                  <div
                    key={`${game.white}-${game.black}-${game.year}`}
                    className="group p-3 rounded-lg bg-bg-tertiary/50 border border-border-subtle hover:border-accent-gold/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {game.white}{" "}
                          <span className="text-text-muted font-normal">
                            vs
                          </span>{" "}
                          {game.black}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted font-mono">
                            {game.year}
                          </span>
                          <span className="text-xs text-text-muted">
                            &middot;
                          </span>
                          <span className="text-xs text-text-secondary">
                            {game.opening}
                          </span>
                        </div>
                      </div>
                      <a
                        href="/games"
                        className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium
                          bg-accent-gold/10 text-accent-gold border border-accent-gold/20
                          hover:bg-accent-gold/20 transition-all opacity-70 group-hover:opacity-100"
                      >
                        Analyze
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="card bg-gradient-to-br from-bg-card to-accent-gold/[0.03] border-accent-gold/10">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent-gold" />
                <h3 className="text-sm font-semibold text-accent-gold">
                  Master-Level Training
                </h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                The Master Path curriculum is designed by titled players and
                covers the strategic depth required to compete at 2200+ level.
                Each module builds upon fundamental concepts with grandmaster-level
                nuance.
              </p>
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 rounded-full bg-accent-gold/20 border-2 border-bg-card flex items-center justify-center">
                      <Crown className="w-3 h-3 text-accent-gold" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border-2 border-bg-card flex items-center justify-center">
                      <Brain className="w-3 h-3 text-accent-purple" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-accent-rose/20 border-2 border-bg-card flex items-center justify-center">
                      <Sword className="w-3 h-3 text-accent-rose" />
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    43 lessons across 5 modules
                  </p>
                </div>
              </div>
            </div>

            {/* Difficulty Legend */}
            <div className="card">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Difficulty Levels
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-accent-gold" />
                  <span className="text-sm text-text-secondary">Advanced</span>
                  <span className="text-xs text-text-muted ml-auto">
                    2200+
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-accent-purple" />
                  <span className="text-sm text-text-secondary">Expert</span>
                  <span className="text-xs text-text-muted ml-auto">
                    2350+
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-accent-rose" />
                  <span className="text-sm text-text-secondary">Master</span>
                  <span className="text-xs text-text-muted ml-auto">
                    2500+
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
