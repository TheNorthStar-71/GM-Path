"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Target,
  Loader2,
  Plus,
  Send,
  Upload,
  BookOpen,
  Sparkles,
  GraduationCap,
  ChevronRight,
  User,
  Bot,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoachReport {
  id: string;
  type: string;
  title: string;
  content: string;
  insights: string | InsightItem[] | InsightObject | null;
  period: string | null;
  createdAt: string;
}

interface InsightItem {
  type: string;
  text: string;
}

interface InsightObject {
  strengths?: string[];
  weaknesses?: string[];
  actions?: string[];
  observations?: string[];
  [key: string]: string[] | undefined;
}

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: Date;
}

interface AnalysisMove {
  moveNumber: number;
  white: string;
  black: string;
  quality: "brilliant" | "great" | "good" | "inaccuracy" | "mistake" | "blunder";
}

interface AnalysisResult {
  moves: AnalysisMove[];
  criticalMoments: string[];
  keyInsights: string[];
}

interface Resource {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  link: string;
}

type TabKey = "reports" | "chat" | "analysis" | "resources";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeInsights(
  raw: CoachReport["insights"],
): InsightItem[] {
  if (!raw) return [];

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item: Record<string, string> | string) => ({
      type: (typeof item === "object" ? item.type : null) ?? "observation",
      text: typeof item === "string" ? item : item.text ?? "",
    }));
  }

  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as InsightObject;
    const keyMap: Record<string, string> = {
      strengths: "strength",
      weaknesses: "weakness",
      actions: "action",
      observations: "observation",
    };
    const result: InsightItem[] = [];
    for (const [key, type] of Object.entries(keyMap)) {
      const items = obj[key];
      if (Array.isArray(items)) {
        items.forEach((text) => result.push({ type, text }));
      }
    }
    return result;
  }

  return [];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateCoachResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("focus") && q.includes("week")) {
    return "Based on your recent games, I recommend focusing on endgame technique this week. You've been reaching winning positions but struggling to convert them. Spend 20 minutes daily on rook endgames and practice king activity in pawn endings. Also review the principle of two weaknesses -- it will help you create winning plans when you have a small advantage.";
  }
  if (q.includes("endgame") || q.includes("ending")) {
    return "Endgame struggles often come from a lack of concrete knowledge in key positions. Start by mastering Lucena and Philidor positions in rook endings, then move to king and pawn fundamentals. A common mistake is rushing -- endgames reward patience and precision. Try solving 5 endgame puzzles daily and play out positions against an engine from advantageous but not yet won positions.";
  }
  if (q.includes("calculation") || q.includes("calculate") || q.includes("tactics")) {
    return "Improving calculation is about building both depth and accuracy. Start with simple 2-move tactics and ensure 100% accuracy before moving to longer sequences. Practice visualizing the board without moving pieces. The \"Woodpecker Method\" -- solving the same set of puzzles repeatedly with decreasing time -- is excellent for pattern recognition. Aim for 15-20 minutes of focused tactical training daily.";
  }
  if (q.includes("mistake") || q.includes("blunder") || q.includes("error")) {
    return "Analyzing your recent games, I notice most mistakes happen in the transition from middlegame to endgame and in time pressure. To reduce blunders: (1) Before each move, do a quick \"blunder check\" -- look for hanging pieces and basic tactics. (2) Manage your clock better by spending less time in familiar positions. (3) After each game, identify the critical moment where the evaluation shifted and understand why.";
  }
  if (q.includes("opening") || q.includes("repertoire")) {
    return "Rather than memorizing long opening lines, focus on understanding the key ideas and typical plans in your openings. Learn the first 8-10 moves of your main lines, then study the typical middlegame structures that arise. Understanding pawn structures is more valuable than memorizing moves. Review master games in your openings to absorb the strategic ideas.";
  }
  if (q.includes("rating") || q.includes("improve") || q.includes("better")) {
    return "Consistent improvement comes from balanced training: spend roughly 40% on tactics, 30% on studying games (yours and masters'), 20% on endgames, and 10% on openings. Play slow games (15+ minutes) and analyze every game afterward. Track your mistakes by category to identify patterns. Set small, achievable weekly goals rather than focusing on rating numbers.";
  }
  if (q.includes("time") || q.includes("clock") || q.includes("pressure")) {
    return "Time management is a skill that improves with practice. In the opening, play quickly through known theory. Invest more time on critical moments -- positions where the evaluation can swing significantly. Practice increment games to build the habit of using every second wisely. A good rule: never spend more than 5 minutes on a single move unless it's truly the decisive moment of the game.";
  }
  if (q.includes("strategy") || q.includes("plan") || q.includes("positional")) {
    return "Positional understanding grows by studying classic games and learning key strategic concepts: weak squares, pawn structure, piece activity, space advantage, and prophylaxis. When you're not sure what to do, ask yourself: (1) What is my opponent's plan? (2) Which is my worst piece? (3) Can I improve my pawn structure? These questions guide you toward strong moves even in unfamiliar positions.";
  }

  return "That's a great question! To give you the best advice, consider reviewing your recent games and identifying recurring patterns. Focus on positions where you felt uncertain -- those are your biggest growth opportunities. Consistent practice with targeted exercises will yield the best results. Would you like me to dive deeper into any specific area of your game?";
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const insightIcons: Record<string, typeof CheckCircle2> = {
  strength: CheckCircle2,
  weakness: AlertTriangle,
  observation: Brain,
  action: Target,
};

const insightColors: Record<string, string> = {
  strength: "text-accent-emerald",
  weakness: "text-accent-rose",
  observation: "text-accent-blue",
  action: "text-accent-gold",
};

const typeLabels: Record<string, string> = {
  weekly: "Weekly Review",
  post_game: "Post-Game Debrief",
  monthly: "Monthly Review",
  plateau: "Plateau Diagnosis",
};

const typeBadgeColors: Record<string, string> = {
  weekly: "badge-blue",
  post_game: "badge-emerald",
  monthly: "badge-gold",
  plateau: "badge-rose",
};

const REPORT_TYPES = [
  { value: "weekly", label: "Weekly Review" },
  { value: "post_game", label: "Post-Game Debrief" },
  { value: "monthly", label: "Monthly Review" },
  { value: "plateau", label: "Plateau Diagnosis" },
] as const;

const TABS: { key: TabKey; label: string; icon: typeof MessageSquare }[] = [
  { key: "reports", label: "Reports", icon: MessageSquare },
  { key: "chat", label: "Chat", icon: Bot },
  { key: "analysis", label: "Game Analysis", icon: Brain },
  { key: "resources", label: "Resources", icon: BookOpen },
];

const QUICK_QUESTIONS = [
  "What should I focus on this week?",
  "Why am I losing in endgames?",
  "How do I improve my calculation?",
  "Analyze my recent mistakes",
];

const moveQualities: Record<AnalysisMove["quality"], string> = {
  brilliant: "badge bg-accent-purple/10 text-accent-purple",
  great: "badge-emerald",
  good: "badge-blue",
  inaccuracy: "badge-gold",
  mistake: "badge bg-orange-500/10 text-orange-400",
  blunder: "badge-rose",
};

const RESOURCES: Resource[] = [
  // Tactics
  {
    title: "Pin & Fork Combinations",
    description: "Master the most common double-attack patterns and learn to spot them in your games.",
    difficulty: "Beginner",
    category: "Tactics",
    link: "#",
  },
  {
    title: "Discovered Attacks & X-Rays",
    description: "Study advanced tactical motifs that involve piece alignments along lines and diagonals.",
    difficulty: "Intermediate",
    category: "Tactics",
    link: "#",
  },
  {
    title: "Sacrificial Combinations",
    description: "Learn when material sacrifice leads to decisive advantage through forced sequences.",
    difficulty: "Advanced",
    category: "Tactics",
    link: "#",
  },
  // Endgames
  {
    title: "King & Pawn Fundamentals",
    description: "Opposition, key squares, and the rule of the square -- the foundation of all endgames.",
    difficulty: "Beginner",
    category: "Endgames",
    link: "#",
  },
  {
    title: "Rook Endgame Essentials",
    description: "Lucena position, Philidor defense, and the principles that govern rook endings.",
    difficulty: "Intermediate",
    category: "Endgames",
    link: "#",
  },
  {
    title: "Complex Piece Endgames",
    description: "Bishop vs knight, opposite-colored bishops, and queen endings with advanced technique.",
    difficulty: "Advanced",
    category: "Endgames",
    link: "#",
  },
  // Openings
  {
    title: "Opening Principles",
    description: "Control the center, develop pieces, castle early -- foundational concepts for any repertoire.",
    difficulty: "Beginner",
    category: "Openings",
    link: "#",
  },
  {
    title: "Building a Repertoire",
    description: "How to choose openings that suit your style and learn them systematically.",
    difficulty: "Intermediate",
    category: "Openings",
    link: "#",
  },
  // Calculation
  {
    title: "Visualization Training",
    description: "Exercises to improve your ability to see positions several moves ahead without moving pieces.",
    difficulty: "Beginner",
    category: "Calculation",
    link: "#",
  },
  {
    title: "Candidate Moves Method",
    description: "Systematic approach to finding the best move by generating and evaluating options.",
    difficulty: "Intermediate",
    category: "Calculation",
    link: "#",
  },
  {
    title: "Deep Calculation Drills",
    description: "Practice calculating 6+ move forced sequences with accuracy under time constraints.",
    difficulty: "Advanced",
    category: "Calculation",
    link: "#",
  },
  // Strategy
  {
    title: "Pawn Structure Guide",
    description: "Understand how pawn formations dictate plans, piece placement, and long-term strategy.",
    difficulty: "Intermediate",
    category: "Strategy",
    link: "#",
  },
  {
    title: "Prophylactic Thinking",
    description: "Learn to anticipate your opponent's plans and make moves that prevent their ideas.",
    difficulty: "Advanced",
    category: "Strategy",
    link: "#",
  },
];

const RESOURCE_CATEGORIES = ["Tactics", "Endgames", "Openings", "Calculation", "Strategy"];

const difficultyBadge: Record<string, string> = {
  Beginner: "badge-emerald",
  Intermediate: "badge-gold",
  Advanced: "badge-rose",
};

const categoryIcons: Record<string, typeof Target> = {
  Tactics: Target,
  Endgames: GraduationCap,
  Openings: BookOpen,
  Calculation: Brain,
  Strategy: Sparkles,
};

/* ------------------------------------------------------------------ */
/*  Simulated PGN analysis                                            */
/* ------------------------------------------------------------------ */

function parsePGNForAnalysis(pgn: string): AnalysisResult {
  const qualities: AnalysisMove["quality"][] = [
    "brilliant", "great", "good", "good", "good",
    "inaccuracy", "good", "great", "good", "mistake",
    "good", "good", "blunder", "good", "great",
  ];

  // Extract move tokens from PGN text
  const moveRegex = /\d+\.\s*(\S+)\s+(\S+)/g;
  const moves: AnalysisMove[] = [];
  let match;
  let idx = 0;

  while ((match = moveRegex.exec(pgn)) !== null && idx < 40) {
    moves.push({
      moveNumber: idx + 1,
      white: match[1],
      black: match[2],
      quality: qualities[idx % qualities.length],
    });
    idx++;
  }

  // If no moves were parsed, create placeholder analysis
  if (moves.length === 0) {
    const sampleMoves = [
      { w: "e4", b: "e5" },
      { w: "Nf3", b: "Nc6" },
      { w: "Bb5", b: "a6" },
      { w: "Ba4", b: "Nf6" },
      { w: "O-O", b: "Be7" },
    ];
    sampleMoves.forEach((m, i) => {
      moves.push({
        moveNumber: i + 1,
        white: m.w,
        black: m.b,
        quality: qualities[i % qualities.length],
      });
    });
  }

  const criticalMoments = [
    `Move ${Math.min(10, moves.length)}: A key decision point where piece activity became critical.`,
    `Move ${Math.min(13, moves.length)}: The position shifted significantly after an inaccurate exchange.`,
    `Move ${Math.min(20, moves.length)}: Missed tactical opportunity that could have changed the outcome.`,
  ];

  const keyInsights = [
    "Piece development in the opening was efficient, but middlegame transitions need work.",
    "Time management appeared to affect move quality in the later stages of the game.",
    "Consider looking for intermediate moves before making captures -- several were missed.",
    "Pawn structure decisions on moves 8-12 created long-term weaknesses that were exploited.",
  ];

  return { moves, criticalMoments, keyInsights };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CoachPage() {
  /* --- Shared state --- */
  const [activeTab, setActiveTab] = useState<TabKey>("reports");

  /* --- Reports state --- */
  const [reports, setReports] = useState<CoachReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  /* --- Chat state --- */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* --- Analysis state --- */
  const [pgnInput, setPgnInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  /* --- Resources state --- */
  const [selectedCategory, setSelectedCategory] = useState<string>("Tactics");

  /* ---------------------------------------------------------------- */
  /*  Reports logic                                                    */
  /* ---------------------------------------------------------------- */

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function generateReport(type: string) {
    setGenerating(true);
    setShowTypeMenu(false);
    try {
      const res = await fetch("/api/coach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const newReport: CoachReport = await res.json();
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport.id);
    } catch {
      // generation failed silently
    } finally {
      setGenerating(false);
    }
  }

  const report = reports.find((r) => r.id === selectedReport);
  const insights = report ? normalizeInsights(report.insights) : [];

  /* ---------------------------------------------------------------- */
  /*  Chat logic                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function sendChatMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    const coachMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      text: generateCoachResponse(text),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg, coachMsg]);
    setChatInput("");
  }

  /* ---------------------------------------------------------------- */
  /*  Analysis logic                                                   */
  /* ---------------------------------------------------------------- */

  async function analyzeGame() {
    if (!pgnInput.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/coach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "post_game", pgn: pgnInput }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      // We still show our local parsed result for the move list UI
    } catch {
      // If API fails we still show local analysis
    } finally {
      setAnalysisResult(parsePGNForAnalysis(pgnInput));
      setAnalyzing(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading && activeTab === "reports") {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">AI Coach</h1>
        <p className="text-text-muted mt-1">
          Personalized analysis, chat coaching, game reviews, and study resources
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border-subtle">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                isActive
                  ? "border-accent-gold text-accent-gold"
                  : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-subtle"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  REPORTS TAB                                                  */}
      {/* ============================================================ */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Generate button */}
          <div className="flex justify-end">
            <div className="relative">
              <button
                onClick={() => setShowTypeMenu((v) => !v)}
                disabled={generating}
                className="btn-primary flex items-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {generating ? "Generating..." : "New Report"}
              </button>
              {showTypeMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-bg-card border border-border-subtle rounded-lg shadow-xl z-20 overflow-hidden">
                  {REPORT_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => generateReport(rt.value)}
                      className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar: report list */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-text-muted uppercase tracking-wider mb-3">
                Recent Reports
              </h3>
              {reports.length === 0 && (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">
                    No reports yet. Generate your first one above.
                  </p>
                </div>
              )}
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedReport === r.id
                      ? "bg-accent-gold/10 border-accent-gold/30"
                      : "bg-bg-card border-border-subtle hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={typeBadgeColors[r.type] ?? "badge-blue"}>
                      {typeLabels[r.type] ?? r.type}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1">{r.title}</p>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {report ? (
                <div className="card space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={typeBadgeColors[report.type] ?? "badge-blue"}>
                        {typeLabels[report.type] ?? report.type}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDate(report.createdAt)}
                      </span>
                      {report.period && (
                        <span className="text-xs text-text-muted">
                          · {report.period}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl font-semibold">
                      {report.title}
                    </h2>
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                      {report.content}
                    </p>
                  </div>

                  {insights.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                        Insights
                      </h3>
                      {insights.map((insight, i) => {
                        const Icon = insightIcons[insight.type] || Brain;
                        const color =
                          insightColors[insight.type] ?? "text-text-muted";
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg"
                          >
                            <Icon
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`}
                            />
                            <p className="text-sm text-text-secondary">
                              {insight.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card flex flex-col items-center justify-center h-96 text-center">
                  <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Select a report</h3>
                  <p className="text-sm text-text-muted max-w-sm">
                    Choose a report from the left to see detailed analysis,
                    insights, and actionable recommendations from your AI coach.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CHAT TAB                                                     */}
      {/* ============================================================ */}
      {activeTab === "chat" && (
        <div className="card flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-2xl bg-accent-gold/10 mb-4">
                  <Bot className="w-10 h-10 text-accent-gold" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Chat with your AI Coach</h3>
                <p className="text-sm text-text-muted max-w-md mb-6">
                  Ask questions about your chess game, get personalized advice,
                  and discuss strategies to improve your play.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendChatMessage(q)}
                      className="text-left p-3 rounded-lg border border-border-subtle bg-bg-tertiary hover:border-accent-gold/30 hover:bg-accent-gold/5 transition-all text-sm text-text-secondary"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
                        <span>{q}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "coach" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent-gold" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-accent-gold/10 border border-accent-gold/20"
                      : "bg-bg-tertiary border border-border-subtle"
                  }`}
                >
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {msg.text}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-tertiary border border-border-subtle flex items-center justify-center">
                    <User className="w-4 h-4 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick questions (shown when there are messages) */}
          {chatMessages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendChatMessage(q)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border-subtle bg-bg-tertiary hover:border-accent-gold/30 text-text-muted hover:text-text-secondary transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="flex gap-3 items-end">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage(chatInput);
                }
              }}
              placeholder="Ask your coach a question..."
              rows={1}
              className="input-field resize-none flex-1"
            />
            <button
              onClick={() => sendChatMessage(chatInput)}
              disabled={!chatInput.trim()}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  GAME ANALYSIS TAB                                            */}
      {/* ============================================================ */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* PGN input */}
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-blue/10">
                <Upload className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Paste Your Game</h2>
                <p className="text-sm text-text-muted">
                  Paste PGN text below to get a detailed analysis of your game
                </p>
              </div>
            </div>
            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder={`Paste your PGN here...\n\nExample:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7...`}
              rows={8}
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex justify-end">
              <button
                onClick={analyzeGame}
                disabled={!pgnInput.trim() || analyzing}
                className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {analyzing ? "Analyzing..." : "Analyze Game"}
              </button>
            </div>
          </div>

          {/* Analysis results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Move list */}
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                  Move Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-2 px-3">#</th>
                        <th className="text-left py-2 px-3">White</th>
                        <th className="text-left py-2 px-3">Black</th>
                        <th className="text-left py-2 px-3">Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.moves.map((move) => (
                        <tr
                          key={move.moveNumber}
                          className="border-t border-border-subtle/50"
                        >
                          <td className="py-2 px-3 text-text-muted">
                            {move.moveNumber}.
                          </td>
                          <td className="py-2 px-3 font-mono">{move.white}</td>
                          <td className="py-2 px-3 font-mono">{move.black}</td>
                          <td className="py-2 px-3">
                            <span className={moveQualities[move.quality]}>
                              {move.quality}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Critical moments */}
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                  Critical Moments
                </h3>
                <div className="space-y-3">
                  {analysisResult.criticalMoments.map((moment, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent-gold" />
                      <p className="text-sm text-text-secondary">{moment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key insights */}
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                  Key Insights
                </h3>
                <div className="space-y-3">
                  {analysisResult.keyInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent-emerald" />
                      <p className="text-sm text-text-secondary">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  RESOURCES TAB                                                */}
      {/* ============================================================ */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          {/* Category navigation */}
          <div className="flex gap-2 flex-wrap">
            {RESOURCE_CATEGORIES.map((cat) => {
              const CatIcon = categoryIcons[cat] || BookOpen;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/30"
                      : "bg-bg-tertiary text-text-muted border border-border-subtle hover:border-border hover:text-text-secondary"
                  }`}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Resource cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCES.filter((r) => r.category === selectedCategory).map(
              (resource) => (
                <div
                  key={resource.title}
                  className="card-hover flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={difficultyBadge[resource.difficulty] ?? "badge-blue"}>
                        {resource.difficulty}
                      </span>
                      {(() => {
                        const CatIcon = categoryIcons[resource.category] || BookOpen;
                        return (
                          <CatIcon className="w-4 h-4 text-text-muted" />
                        );
                      })()}
                    </div>
                    <h3 className="font-semibold mb-2">{resource.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                  <a
                    href={resource.link}
                    className="flex items-center gap-1 text-sm font-medium text-accent-gold mt-4 hover:text-accent-gold-light transition-colors group"
                  >
                    Start Training
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
