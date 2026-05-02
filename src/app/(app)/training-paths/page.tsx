"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Crown,
  Swords,
  Brain,
  BookOpen,
  Shield,
  Loader2,
  Star,
  Trophy,
  Zap,
  TrendingUp,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  lessons: number;
  duration: string;
  prerequisites: string[];
  link: string;
}

interface TrainingTier {
  id: string;
  name: string;
  ratingRange: string;
  minRating: number;
  maxRating: number;
  color: string;
  icon: typeof Target;
  description: string;
  modules: Module[];
}

const TIERS: TrainingTier[] = [
  {
    id: "beginner",
    name: "Foundation",
    ratingRange: "0 - 1000",
    minRating: 0,
    maxRating: 1000,
    color: "#34d399",
    icon: Target,
    description: "Build core chess fundamentals",
    modules: [
      {
        id: "b1",
        title: "Piece Movement & Rules",
        description: "Master how every piece moves, captures, and special rules like castling and en passant",
        category: "fundamentals",
        lessons: 8,
        duration: "2 hours",
        prerequisites: [],
        link: "/tactics",
      },
      {
        id: "b2",
        title: "Basic Checkmate Patterns",
        description: "Learn King + Queen vs King, King + Rook vs King, and two-bishop mate",
        category: "endgame",
        lessons: 6,
        duration: "1.5 hours",
        prerequisites: ["b1"],
        link: "/endgames",
      },
      {
        id: "b3",
        title: "Simple Tactics: Forks & Pins",
        description: "Recognize and execute the two most common tactical patterns",
        category: "tactics",
        lessons: 10,
        duration: "3 hours",
        prerequisites: ["b1"],
        link: "/tactics?theme=fork",
      },
      {
        id: "b4",
        title: "Opening Principles",
        description: "Control the center, develop pieces, castle early — the three golden rules",
        category: "opening",
        lessons: 5,
        duration: "1 hour",
        prerequisites: ["b1"],
        link: "/openings",
      },
      {
        id: "b5",
        title: "Basic Pawn Endgames",
        description: "King and pawn basics: opposition, key squares, and the rule of the square",
        category: "endgame",
        lessons: 8,
        duration: "2 hours",
        prerequisites: ["b2"],
        link: "/endgames?category=king_pawn",
      },
    ],
  },
  {
    id: "intermediate",
    name: "Club Player",
    ratingRange: "1000 - 1400",
    minRating: 1000,
    maxRating: 1400,
    color: "#60a5fa",
    icon: Swords,
    description: "Develop tactical and strategic awareness",
    modules: [
      {
        id: "i1",
        title: "Advanced Tactical Motifs",
        description: "Skewers, discovered attacks, deflection, removal of the guard, and zwischenzug",
        category: "tactics",
        lessons: 12,
        duration: "4 hours",
        prerequisites: ["b3"],
        link: "/tactics",
      },
      {
        id: "i2",
        title: "Calculation Fundamentals",
        description: "Learn to calculate 3 moves deep reliably. Candidate moves and forcing sequences",
        category: "calculation",
        lessons: 8,
        duration: "3 hours",
        prerequisites: ["b3"],
        link: "/calculation",
      },
      {
        id: "i3",
        title: "Opening Repertoire: White",
        description: "Build a complete White opening repertoire suitable for your level",
        category: "opening",
        lessons: 10,
        duration: "3 hours",
        prerequisites: ["b4"],
        link: "/openings",
      },
      {
        id: "i4",
        title: "Opening Repertoire: Black",
        description: "Build responses to 1.e4 and 1.d4 that match your playing style",
        category: "opening",
        lessons: 10,
        duration: "3 hours",
        prerequisites: ["b4"],
        link: "/openings",
      },
      {
        id: "i5",
        title: "Rook Endgame Basics",
        description: "Lucena position, Philidor defense, and rook activity principles",
        category: "endgame",
        lessons: 8,
        duration: "2.5 hours",
        prerequisites: ["b5"],
        link: "/endgames?category=rook",
      },
      {
        id: "i6",
        title: "Game Review Method",
        description: "Learn the structured approach to reviewing your own games effectively",
        category: "game_review",
        lessons: 4,
        duration: "1 hour",
        prerequisites: [],
        link: "/games",
      },
    ],
  },
  {
    id: "advanced",
    name: "Tournament Player",
    ratingRange: "1400 - 1800",
    minRating: 1400,
    maxRating: 1800,
    color: "#a78bfa",
    icon: Brain,
    description: "Deepen positional understanding and calculation",
    modules: [
      {
        id: "a1",
        title: "Positional Chess Fundamentals",
        description: "Pawn structures, outposts, good vs bad bishops, and piece coordination",
        category: "middlegame",
        lessons: 12,
        duration: "4 hours",
        prerequisites: ["i1"],
        link: "/middlegame",
      },
      {
        id: "a2",
        title: "Deep Calculation Training",
        description: "Calculate 5+ moves deep. Complex forcing sequences and evaluation of unclear positions",
        category: "calculation",
        lessons: 10,
        duration: "4 hours",
        prerequisites: ["i2"],
        link: "/calculation",
      },
      {
        id: "a3",
        title: "Complex Endgames",
        description: "Rook + pawn endings, minor piece endgames, and conversion techniques",
        category: "endgame",
        lessons: 12,
        duration: "4 hours",
        prerequisites: ["i5"],
        link: "/endgames",
      },
      {
        id: "a4",
        title: "Opening Theory Deep Dive",
        description: "Understand the strategic ideas behind your openings. Middle game plans from the opening",
        category: "opening",
        lessons: 8,
        duration: "3 hours",
        prerequisites: ["i3", "i4"],
        link: "/openings",
      },
      {
        id: "a5",
        title: "Attack and Defense",
        description: "Kingside attacks, defensive techniques, counter-attacking strategies",
        category: "middlegame",
        lessons: 10,
        duration: "3.5 hours",
        prerequisites: ["a1"],
        link: "/middlegame",
      },
      {
        id: "a6",
        title: "Time Management Mastery",
        description: "Develop a practical time allocation strategy for each game phase",
        category: "practical",
        lessons: 4,
        duration: "1 hour",
        prerequisites: [],
        link: "/play",
      },
    ],
  },
  {
    id: "expert",
    name: "Expert Path",
    ratingRange: "1800 - 2200",
    minRating: 1800,
    maxRating: 2200,
    color: "#c9a84c",
    icon: Crown,
    description: "Refine your play to near-master level",
    modules: [
      {
        id: "e1",
        title: "Strategic Complexity",
        description: "Imbalance evaluation, exchange sacrifices, and positional pawn sacrifices",
        category: "middlegame",
        lessons: 12,
        duration: "5 hours",
        prerequisites: ["a1", "a5"],
        link: "/middlegame",
      },
      {
        id: "e2",
        title: "Prophylactic Thinking",
        description: "Anticipate opponent's plans and use prophylaxis as a strategic tool",
        category: "middlegame",
        lessons: 8,
        duration: "3 hours",
        prerequisites: ["a1"],
        link: "/middlegame",
      },
      {
        id: "e3",
        title: "Master-Level Endgames",
        description: "Tablebase positions, complex rook endings, and theoretical draws/wins",
        category: "endgame",
        lessons: 14,
        duration: "5 hours",
        prerequisites: ["a3"],
        link: "/endgames",
      },
      {
        id: "e4",
        title: "Opening Novelty Preparation",
        description: "Learn to find and prepare opening surprises using databases and engines",
        category: "opening",
        lessons: 6,
        duration: "2 hours",
        prerequisites: ["a4"],
        link: "/openings",
      },
      {
        id: "e5",
        title: "Classical Game Study",
        description: "Study annotated masterpieces to develop deep chess understanding",
        category: "study",
        lessons: 10,
        duration: "4 hours",
        prerequisites: [],
        link: "/master-path",
      },
    ],
  },
  {
    id: "master",
    name: "Master Quest",
    ratingRange: "2200+",
    minRating: 2200,
    maxRating: 3000,
    color: "#fb7185",
    icon: Trophy,
    description: "The final push to Grandmaster level",
    modules: [
      {
        id: "m1",
        title: "Advanced Pawn Structures",
        description: "IQP, Carlsbad, hanging pawns, and minority attack at the highest level",
        category: "middlegame",
        lessons: 10,
        duration: "4 hours",
        prerequisites: ["e1"],
        link: "/master-path",
      },
      {
        id: "m2",
        title: "Dynamic vs Static Play",
        description: "When to play dynamically vs when to maintain the status quo",
        category: "middlegame",
        lessons: 8,
        duration: "3 hours",
        prerequisites: ["e1", "e2"],
        link: "/master-path",
      },
      {
        id: "m3",
        title: "7-Piece Tablebase Mastery",
        description: "Master critical theoretical endgame positions from tablebases",
        category: "endgame",
        lessons: 12,
        duration: "5 hours",
        prerequisites: ["e3"],
        link: "/master-path",
      },
      {
        id: "m4",
        title: "Tournament Preparation",
        description: "Complete preparation methodology for serious tournament play",
        category: "practical",
        lessons: 6,
        duration: "2 hours",
        prerequisites: [],
        link: "/opponent-prep",
      },
    ],
  },
];

const categoryIcons: Record<string, typeof Target> = {
  fundamentals: Target,
  tactics: Swords,
  calculation: Brain,
  opening: BookOpen,
  endgame: Crown,
  middlegame: Shield,
  game_review: Star,
  study: BookOpen,
  practical: Zap,
};

export default function TrainingPathsPage() {
  const [expandedTier, setExpandedTier] = useState<string>("beginner");
  const [userRating, setUserRating] = useState<number>(1000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const rating =
            data.profile?.ratingRapid ??
            data.profile?.ratingBlitz ??
            data.profile?.ratingPuzzle ??
            1000;
          setUserRating(rating);
          // Auto-expand the appropriate tier
          const tier = TIERS.find(
            (t) => rating >= t.minRating && rating < t.maxRating
          );
          if (tier) setExpandedTier(tier.id);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  const currentTierIndex = TIERS.findIndex(
    (t) => userRating >= t.minRating && userRating < t.maxRating
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">Training Paths</h1>
        <p className="text-text-muted mt-1">
          Rating-specific curriculum — unlock new modules as you improve
        </p>
      </div>

      {/* Rating Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-gold" />
            <h2 className="font-semibold">Your Journey</h2>
          </div>
          <span className="badge-gold">Rating: {userRating}</span>
        </div>
        <div className="relative">
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-emerald via-accent-blue via-accent-purple via-accent-gold to-accent-rose rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (userRating / 2400) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className="text-center"
                style={{ width: `${100 / TIERS.length}%` }}
              >
                <span
                  className="text-[10px] font-medium"
                  style={{ color: tier.color }}
                >
                  {tier.minRating}
                </span>
              </div>
            ))}
            <div className="text-center">
              <span className="text-[10px] font-medium text-accent-rose">
                2400+
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="space-y-4">
        {TIERS.map((tier, tierIndex) => {
          const isUnlocked = tierIndex <= currentTierIndex;
          const isCurrent = tierIndex === currentTierIndex;
          const isExpanded = expandedTier === tier.id;
          const TierIcon = tier.icon;

          return (
            <div
              key={tier.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isCurrent
                  ? "border-accent-gold/30 bg-bg-card"
                  : isUnlocked
                    ? "border-border-subtle bg-bg-card"
                    : "border-border-subtle bg-bg-secondary opacity-70"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedTier(isExpanded ? "" : tier.id)
                }
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${tier.color}15` }}
                  >
                    {isUnlocked ? (
                      <TierIcon
                        className="w-6 h-6"
                        style={{ color: tier.color }}
                      />
                    ) : (
                      <Lock className="w-6 h-6 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">
                        {tier.name}
                      </h3>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${tier.color}15`,
                          color: tier.color,
                        }}
                      >
                        {tier.ratingRange}
                      </span>
                      {isCurrent && (
                        <span className="badge-gold">Current Level</span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">
                      {tier.description} — {tier.modules.length} modules
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown
                    className="w-5 h-5 text-text-muted flex-shrink-0"
                  />
                ) : (
                  <ChevronRight
                    className="w-5 h-5 text-text-muted flex-shrink-0"
                  />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="h-px bg-border-subtle" />
                  {tier.modules.map((mod) => {
                    const ModIcon =
                      categoryIcons[mod.category] || Target;
                    const prereqsMet = mod.prerequisites.every((p) => {
                      // Find the tier that contains this prereq
                      const prereqTier = TIERS.find((t) =>
                        t.modules.some((m) => m.id === p)
                      );
                      if (!prereqTier) return true;
                      return (
                        TIERS.indexOf(prereqTier) < tierIndex ||
                        (TIERS.indexOf(prereqTier) === tierIndex &&
                          isUnlocked)
                      );
                    });

                    return (
                      <div
                        key={mod.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          prereqsMet && isUnlocked
                            ? "border-border-subtle bg-bg-secondary hover:border-accent-gold/20"
                            : "border-border-subtle bg-bg-tertiary/50 opacity-60"
                        }`}
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: `${tier.color}10`,
                          }}
                        >
                          <ModIcon
                            className="w-4 h-4"
                            style={{ color: tier.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {mod.title}
                            </p>
                            {!prereqsMet && (
                              <Lock className="w-3 h-3 text-text-muted" />
                            )}
                          </div>
                          <p className="text-xs text-text-muted truncate">
                            {mod.description}
                          </p>
                          {mod.prerequisites.length > 0 && !prereqsMet && (
                            <p className="text-[10px] text-accent-rose mt-1">
                              Requires:{" "}
                              {mod.prerequisites
                                .map((p) => {
                                  const prereqMod = TIERS.flatMap(
                                    (t) => t.modules
                                  ).find((m) => m.id === p);
                                  return prereqMod?.title ?? p;
                                })
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-text-muted">
                              {mod.lessons} lessons
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {mod.duration}
                            </p>
                          </div>
                          {/* Progress indicator */}
                          <div className="w-8 h-8 rounded-full border-2 border-border-subtle flex items-center justify-center">
                            <span className="text-[10px] text-text-muted font-mono">
                              0%
                            </span>
                          </div>
                          {prereqsMet && isUnlocked ? (
                            <Link
                              href={mod.link}
                              className="text-xs text-accent-gold hover:text-accent-gold-light transition-colors flex items-center gap-1"
                            >
                              Start{" "}
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-text-muted w-12">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
