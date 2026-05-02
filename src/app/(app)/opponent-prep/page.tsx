"use client";

import { useState } from "react";
import {
  Target,
  Shield,
  Swords,
  Brain,
  BookOpen,
  Crown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  Zap,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";

type OpponentStyle = "aggressive" | "positional" | "universal" | "unknown";

interface OpponentProfile {
  name: string;
  rating: number;
  style: OpponentStyle;
}

interface PrepRecommendation {
  type: "avoid" | "recommend" | "novelty";
  title: string;
  description: string;
  reason: string;
  confidence: number;
  link?: string;
}

const STYLE_DESCRIPTIONS: Record<OpponentStyle, string> = {
  aggressive: "Prefers sharp, tactical positions with piece sacrifices",
  positional: "Favors quiet positions with long-term strategic plans",
  universal: "Comfortable in all types of positions",
  unknown: "No style data available — play your comfort zone",
};

function generateRecommendations(
  opponent: OpponentProfile,
  userRating: number
): PrepRecommendation[] {
  const recs: PrepRecommendation[] = [];
  const ratingDiff = opponent.rating - userRating;

  // Openings to avoid based on opponent style
  if (opponent.style === "aggressive") {
    recs.push({
      type: "avoid",
      title: "Avoid the King's Gambit & Open Sicilian",
      description:
        "Against aggressive players, sharp theoretical lines favor the better-prepared player. Avoid positions where one wrong move loses.",
      reason: "Opponent thrives in tactical chaos",
      confidence: 85,
    });
    recs.push({
      type: "recommend",
      title: "Play the London System or Catalan",
      description:
        "Solid, strategic openings that limit your opponent's tactical opportunities while maintaining a slight edge.",
      reason: "Steers into quiet positions where aggression is neutralized",
      confidence: 80,
      link: "/openings",
    });
    recs.push({
      type: "recommend",
      title: "Aim for endgames early",
      description:
        "Trade pieces when possible to reduce tactical complexity. Aggressive players often struggle in technical endgames.",
      reason: "Your endgame technique becomes the deciding factor",
      confidence: 75,
      link: "/endgames",
    });
  } else if (opponent.style === "positional") {
    recs.push({
      type: "avoid",
      title: "Avoid slow, symmetrical structures",
      description:
        "Positional players excel in quiet positions. Don't let them build a slow squeeze.",
      reason: "Opponent excels at long-term pressure",
      confidence: 80,
    });
    recs.push({
      type: "recommend",
      title: "Play the Sicilian Najdorf or King's Indian",
      description:
        "Dynamic openings that create imbalanced positions where concrete calculation matters more than positional feel.",
      reason: "Forces concrete decisions where intuition alone isn't enough",
      confidence: 78,
      link: "/openings",
    });
    recs.push({
      type: "novelty",
      title: "Prepare a sideline surprise",
      description:
        "Positional players rely on pattern recognition. A well-prepared sideline on move 8-10 can take them out of their comfort zone.",
      reason: "Breaks their preparation and forces independent thinking",
      confidence: 70,
      link: "/openings",
    });
  } else {
    recs.push({
      type: "recommend",
      title: "Play your strongest repertoire",
      description:
        "Against universal players, the best strategy is to play positions you know best. Don't try to outsmart them with unfamiliar lines.",
      reason: "Maximize your preparation advantage",
      confidence: 85,
      link: "/openings",
    });
  }

  // Rating-based recommendations
  if (ratingDiff > 200) {
    recs.push({
      type: "recommend",
      title: "Play for complications",
      description:
        "Against a significantly higher-rated opponent, you need to create chaos. A clean positional game favors the stronger player.",
      reason: `Opponent is ${ratingDiff} points higher — you need winning chances`,
      confidence: 70,
      link: "/tactics",
    });
    recs.push({
      type: "avoid",
      title: "Don't trade pieces unnecessarily",
      description:
        "Keep pieces on the board. Simpler positions favor the higher-rated player. Complexity is your ally.",
      reason: "More pieces = more chances for mistakes from both sides",
      confidence: 75,
    });
  } else if (ratingDiff < -200) {
    recs.push({
      type: "recommend",
      title: "Simplify and convert",
      description:
        "You're the favorite. Don't take unnecessary risks. Trade into favorable endgames and convert your technical superiority.",
      reason: `You're ${Math.abs(ratingDiff)} points higher — play solid chess`,
      confidence: 80,
      link: "/endgames",
    });
  }

  // Always recommend tactical preparation
  recs.push({
    type: "recommend",
    title: "Warm up with 10 tactical puzzles",
    description:
      "Sharpen your tactical vision before the game. Focus on patterns you've been missing recently.",
    reason: "Pre-game tactical warm-up improves in-game alertness",
    confidence: 90,
    link: "/tactics",
  });

  return recs;
}

export default function OpponentPrepPage() {
  const [opponentName, setOpponentName] = useState("");
  const [opponentRating, setOpponentRating] = useState("");
  const [opponentStyle, setOpponentStyle] = useState<OpponentStyle>("unknown");
  const [analyzed, setAnalyzed] = useState(false);
  const [recommendations, setRecommendations] = useState<PrepRecommendation[]>(
    []
  );

  function handleAnalyze() {
    if (!opponentRating) return;
    const profile: OpponentProfile = {
      name: opponentName || "Opponent",
      rating: parseInt(opponentRating) || 1500,
      style: opponentStyle,
    };
    // Assume user is ~1500 for now; in production this would come from profile
    const recs = generateRecommendations(profile, 1500);
    setRecommendations(recs);
    setAnalyzed(true);
  }

  const typeIcons: Record<string, typeof Target> = {
    avoid: AlertTriangle,
    recommend: CheckCircle2,
    novelty: Zap,
  };

  const typeColors: Record<string, string> = {
    avoid: "text-accent-rose",
    recommend: "text-accent-emerald",
    novelty: "text-accent-purple",
  };

  const typeBadges: Record<string, string> = {
    avoid: "badge-rose",
    recommend: "badge-emerald",
    novelty: "badge bg-accent-purple/10 text-accent-purple",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Prepare for Opponent
        </h1>
        <p className="text-text-muted mt-1">
          Get personalized opening and strategy recommendations before your game
        </p>
      </div>

      {/* Input Section */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-accent-gold" />
          Opponent Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label block mb-1.5">Opponent Name</label>
            <input
              type="text"
              placeholder="e.g., Fischer_Fan_2024"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Opponent Rating</label>
            <input
              type="number"
              placeholder="e.g., 1650"
              value={opponentRating}
              onChange={(e) => setOpponentRating(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Playing Style</label>
            <select
              value={opponentStyle}
              onChange={(e) =>
                setOpponentStyle(e.target.value as OpponentStyle)
              }
              className="input-field"
            >
              <option value="unknown">Unknown</option>
              <option value="aggressive">Aggressive / Tactical</option>
              <option value="positional">Positional / Strategic</option>
              <option value="universal">Universal / All-rounder</option>
            </select>
          </div>
        </div>

        {opponentStyle !== "unknown" && (
          <div className="p-3 bg-bg-tertiary rounded-lg">
            <p className="text-sm text-text-secondary">
              <Brain className="w-4 h-4 inline mr-1 text-accent-gold" />
              {STYLE_DESCRIPTIONS[opponentStyle]}
            </p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!opponentRating}
          className="btn-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Generate Preparation Plan
        </button>
      </div>

      {/* Recommendations */}
      {analyzed && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold">
              Preparation Plan vs {opponentName || "Opponent"}{" "}
              <span className="text-text-muted">
                ({opponentRating})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => {
              const Icon = typeIcons[rec.type] || Target;
              const color = typeColors[rec.type] || "text-accent-gold";
              const badge = typeBadges[rec.type] || "badge-gold";
              return (
                <div key={i} className="card-hover space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className={badge}>
                        {rec.type === "avoid"
                          ? "Avoid"
                          : rec.type === "novelty"
                            ? "Surprise"
                            : "Recommended"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent-gold"
                          style={{ width: `${rec.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {rec.confidence}%
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm">{rec.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {rec.description}
                  </p>
                  <p className="text-xs text-text-muted italic">
                    {rec.reason}
                  </p>

                  {rec.link && (
                    <Link
                      href={rec.link}
                      className="inline-flex items-center gap-1 text-xs text-accent-gold hover:text-accent-gold-light transition-colors"
                    >
                      Train this <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-gold" />
              Pre-Game Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                href="/tactics"
                className="p-4 rounded-lg border border-border-subtle hover:border-accent-gold/20
                  bg-bg-secondary hover:bg-bg-hover transition-all group"
              >
                <Swords className="w-5 h-5 mb-2 text-accent-rose" />
                <p className="text-sm font-medium group-hover:text-accent-gold transition-colors">
                  Tactical Warm-up
                </p>
                <p className="text-xs text-text-muted">10 puzzles</p>
              </Link>
              <Link
                href="/openings"
                className="p-4 rounded-lg border border-border-subtle hover:border-accent-gold/20
                  bg-bg-secondary hover:bg-bg-hover transition-all group"
              >
                <BookOpen className="w-5 h-5 mb-2 text-accent-emerald" />
                <p className="text-sm font-medium group-hover:text-accent-gold transition-colors">
                  Review Repertoire
                </p>
                <p className="text-xs text-text-muted">Key lines</p>
              </Link>
              <Link
                href="/endgames"
                className="p-4 rounded-lg border border-border-subtle hover:border-accent-gold/20
                  bg-bg-secondary hover:bg-bg-hover transition-all group"
              >
                <Crown className="w-5 h-5 mb-2 text-accent-gold" />
                <p className="text-sm font-medium group-hover:text-accent-gold transition-colors">
                  Endgame Review
                </p>
                <p className="text-xs text-text-muted">Key positions</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
