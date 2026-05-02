"use client";

import { useState, useMemo, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  BookOpen,
  Layers,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Brain,
  Target,
  Star,
  Lightbulb,
  Play,
  RotateCcw,
  Trophy,
  Zap,
} from "lucide-react";
import { SkillBar } from "@/components/ui/skill-bar";
import { Tooltip, DifficultyDot } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Side = "white" | "black";

interface OpeningLine {
  id: string;
  name: string;
  moves: string;
  fen: string;
  srStatus: "new" | "learning" | "review" | "mature";
  nextReview: string;
  accuracy: number;
}

interface ModelGame {
  id: string;
  white: string;
  black: string;
  year: number;
  event: string;
  result: string;
  theme: string;
}

interface Opening {
  id: string;
  name: string;
  eco: string;
  side: Side;
  fen: string;
  description: string;
  difficulty?: string;
  mastery: number;
  linesTotal: number;
  linesMastered: number;
  strategicGoals: string[];
  pawnStructures: string[];
  tacticalMotifs: string[];
  commonMistakes: string[];
  keyPlans: string[];
  lines: OpeningLine[];
  modelGames: ModelGame[];
  sidelines: { move: string; response: string; note: string }[];
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const OPENINGS: Opening[] = [
  {
    id: "sicilian-najdorf",
    name: "Sicilian Najdorf",
    eco: "B90",
    side: "black",
    fen: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    description:
      "The sharpest reply to 1.e4 — rich in theory, dynamism, and counterattacking chances for Black.",
    mastery: 68,
    linesTotal: 24,
    linesMastered: 14,
    strategicGoals: [
      "Counterattack on the queenside with ...b5 and ...b4",
      "Use the semi-open c-file for pressure",
      "Generate piece activity to compensate for White's central space",
      "Strike in the center with ...d5 or ...e5 at the right moment",
    ],
    pawnStructures: [
      "Scheveningen pawn center (pawns on d6/e6)",
      "Hedgehog setup after ...b6 and ...Bb7",
      "Boleslavsky hole (pawn on e5, weak d5 square)",
    ],
    tacticalMotifs: [
      "Exchange sacrifice on c3",
      "Piece sacrifice on e4 to open lines",
      "Knight outpost on d5 or e5",
      "Back-rank tactics after opposite-side castling",
    ],
    commonMistakes: [
      "Playing ...e5 too early allowing Nd5",
      "Forgetting prophylaxis against Nd5",
      "Neglecting king safety in sharp English Attack lines",
      "Misjudging pawn breaks in the Bg5 Poisoned Pawn",
    ],
    keyPlans: [
      "English Attack: ...b5, ...Bb7, ...Rc8, with queenside play",
      "6.Bg5: Prepare ...Nbd7 and ...Be7 before committing",
      "Classical: Use the Gelfand ...Qb6 system for active piece play",
      "Anti-positional Be2 systems: Aim for ...e5 and piece activity",
    ],
    lines: [
      { id: "sn-1", name: "6.Be3 e5 (English Attack)", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Be3 e5", fen: "rnbqkb1r/1p3ppp/p2p1n2/4p3/3NP3/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 7", srStatus: "mature", nextReview: "Mar 18", accuracy: 94 },
      { id: "sn-2", name: "6.Bg5 e6 (Classical)", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6", fen: "rnbqkb1r/1p3ppp/p2ppn2/6B1/3NP3/2N5/PPP2PPP/R2QKB1R w KQkq - 0 7", srStatus: "review", nextReview: "Mar 12", accuracy: 82 },
      { id: "sn-3", name: "6.Be2 e5 (Opocensky)", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Be2 e5", fen: "rnbqkb1r/1p3ppp/p2p1n2/4p3/3NP3/2N5/PPP1BPPP/R1BQK2R w KQkq - 0 7", srStatus: "learning", nextReview: "Mar 11", accuracy: 71 },
      { id: "sn-4", name: "6.f3 e5 (English Attack Main)", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.f3 e5", fen: "rnbqkb1r/1p3ppp/p2p1n2/4p3/3NP3/2N2P2/PPP3PP/R1BQKB1R w KQkq - 0 7", srStatus: "new", nextReview: "New", accuracy: 0 },
      { id: "sn-5", name: "Poisoned Pawn (6.Bg5 e6 7.f4 Qb6)", moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4 Qb6", fen: "rnb1kb1r/1p3ppp/pq1ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R w KQkq - 0 8", srStatus: "learning", nextReview: "Mar 13", accuracy: 65 },
    ],
    modelGames: [
      { id: "mg-1", white: "Kasparov", black: "Topalov", year: 1999, event: "Wijk aan Zee", result: "1-0", theme: "King hunt after sacrifice" },
      { id: "mg-2", white: "Fischer", black: "Spassky", year: 1992, event: "Sveti Stefan", result: "1-0", theme: "Central pawn break" },
      { id: "mg-3", white: "Carlsen", black: "Aronian", year: 2019, event: "Sinquefield Cup", result: "1-0", theme: "Queenside pressure" },
    ],
    sidelines: [
      { move: "6.Bc4", response: "6...e6 7...b5", note: "Fischer-Sozin Attack — play for a quick ...b5 and ...Bb7" },
      { move: "6.a4", response: "6...e5 7...Be7", note: "Prevents ...b5 but gives Black time for ...e5 setup" },
      { move: "6.g3", response: "6...e5 7...Be7 8...O-O", note: "Fianchetto variation — solid, aim for central play" },
    ],
  },
  {
    id: "italian-game",
    name: "Italian Game",
    eco: "C54",
    side: "white",
    difficulty: "beginner",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    description:
      "A classical opening aiming for rapid development and central control. The Giuoco Piano leads to rich strategic middlegames.",
    mastery: 75,
    linesTotal: 18,
    linesMastered: 12,
    strategicGoals: [
      "Maintain a strong pawn center with d3 or d4",
      "Develop pieces harmoniously and castle quickly",
      "Exploit the a2-g8 diagonal with the bishop on c4",
      "Create kingside attacking chances in the middlegame",
    ],
    pawnStructures: [
      "Italian center (e4/d3 vs e5/d6) — slow maneuvering",
      "Open center after d4 exd4 — piece activity paramount",
      "IQP positions after specific d4 captures",
    ],
    tacticalMotifs: [
      "d4 central break timing",
      "f4-f5 kingside pawn storm in closed positions",
      "Bc4-b3-a2 battery on the diagonal",
      "Nd5 outpost exploitation",
    ],
    commonMistakes: [
      "Playing d4 too early before completing development",
      "Allowing Black's ...Na5 to trade the Italian bishop",
      "Neglecting the queenside when attacking on the kingside",
      "Missing the ...d5 central counter-break",
    ],
    keyPlans: [
      "Giuoco Pianissimo: Slow buildup with c3, d3, Re1, then d4",
      "Evans Gambit: Sharp 4.b4 for rapid piece activity",
      "Two Knights: Meet 3...Nf6 with 4.d3 or 4.Ng5 (Fried Liver)",
      "Modern Approach: a4 + Ba2 to retain the bishop pair",
    ],
    lines: [
      { id: "ig-1", name: "Giuoco Piano 4.c3 Nf6 5.d3", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R b KQkq - 0 5", srStatus: "mature", nextReview: "Mar 20", accuracy: 91 },
      { id: "ig-2", name: "Evans Gambit 4.b4", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4", fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq - 0 4", srStatus: "review", nextReview: "Mar 14", accuracy: 86 },
      { id: "ig-3", name: "Two Knights 4.d3 Nf6", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.d3", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4", srStatus: "mature", nextReview: "Mar 22", accuracy: 93 },
      { id: "ig-4", name: "Fried Liver Attack 4.Ng5", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 4", srStatus: "learning", nextReview: "Mar 12", accuracy: 74 },
    ],
    modelGames: [
      { id: "mg-4", white: "Caruana", black: "Carlsen", year: 2018, event: "WCC London", result: "1/2-1/2", theme: "Deep preparation in Giuoco Piano" },
      { id: "mg-5", white: "Kasparov", black: "Anand", year: 1995, event: "PCA WCC", result: "1-0", theme: "Evans Gambit revival" },
    ],
    sidelines: [
      { move: "3...d6 (Hungarian)", response: "4.d4 exd4 5.Nxd4", note: "Passive for Black; seize the center" },
      { move: "3...Be7 (Hungarian Def)", response: "4.d4 d6 5.Nc3", note: "Black chooses solidity; build space advantage" },
    ],
  },
  {
    id: "qgd",
    name: "Queen's Gambit Declined",
    eco: "D37",
    side: "black",
    fen: "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq - 2 3",
    description:
      "A cornerstone of classical chess — solid, reliable, and rich in long-term strategic ideas for both sides.",
    mastery: 52,
    linesTotal: 20,
    linesMastered: 8,
    strategicGoals: [
      "Achieve the freeing ...c5 or ...e5 break",
      "Develop the light-squared bishop actively",
      "Maintain a solid pawn structure and avoid weaknesses",
      "Prepare counterplay on the queenside or in the center",
    ],
    pawnStructures: [
      "Carlsbad structure (c/d pawns exchanged) — minority attack",
      "Semi-Tarrasch (IQP for Black) — dynamic piece play",
      "Orthodox (e6/d5 chain) — solid but cramped",
    ],
    tacticalMotifs: [
      "The ...dxc4 capture timing to disrupt White's center",
      "...Nb4-d3 knight infiltration",
      "The minority attack (a4-b5) for White",
      "Central break with ...e5 or ...c5 at the right moment",
    ],
    commonMistakes: [
      "Playing ...dxc4 too early without a concrete plan",
      "Keeping the bishop locked behind the e6 pawn too long",
      "Overlooking the minority attack ideas",
      "Being too passive and allowing White to build a bind",
    ],
    keyPlans: [
      "Tartakower: ...b6 and ...Bb7 to develop the problem bishop",
      "Lasker's Defence: ...Ne4 to simplify and equalize",
      "Cambridge Springs: ...Qa5 with active counterplay",
      "Vienna System: ...dxc4 followed by ...b5 and ...Bb7",
    ],
    lines: [
      { id: "qgd-1", name: "Tartakower System", moves: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 h6 7.Bh4 b6", fen: "rnbq1rk1/p1p1bpp1/1p2pn1p/3p4/2PP3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8", srStatus: "review", nextReview: "Mar 13", accuracy: 78 },
      { id: "qgd-2", name: "Lasker Defence", moves: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 h6 7.Bh4 Ne4", fen: "rnbq1rk1/ppp1bpp1/4p2p/3p4/2PPn2B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8", srStatus: "learning", nextReview: "Mar 11", accuracy: 63 },
      { id: "qgd-3", name: "Cambridge Springs", moves: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.e3 c6 6.Nf3 Qa5", fen: "r1b1kb1r/pp1n1ppp/2p1pn2/q2p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQkq - 0 7", srStatus: "new", nextReview: "New", accuracy: 0 },
      { id: "qgd-4", name: "Orthodox Main Line", moves: "1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 Nbd7 7.Rc1 c6", fen: "r1bq1rk1/pp1nbppp/2p1pn2/3p2B1/2PP4/2N1PN2/PP3PPP/2RQKB1R w K - 0 8", srStatus: "learning", nextReview: "Mar 14", accuracy: 70 },
    ],
    modelGames: [
      { id: "mg-6", white: "Kramnik", black: "Kasparov", year: 2000, event: "WCC London", result: "1-0", theme: "Positional squeeze" },
      { id: "mg-7", white: "Carlsen", black: "Caruana", year: 2018, event: "WCC London", result: "1/2-1/2", theme: "Deep endgame technique" },
    ],
    sidelines: [
      { move: "4.cxd5 (Exchange)", response: "4...exd5 5...c6 6...Bf5", note: "Aim for active bishop development before ...e6" },
      { move: "4.Nf3 (Anti-Moscow)", response: "4...Bb4 or 4...dxc4", note: "Flexible; choose between Moscow and Vienna" },
    ],
  },
  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C88",
    side: "white",
    difficulty: "intermediate",
    fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    description:
      "The king of openings — offering White a lasting structural advantage and rich middlegame plans across dozens of systems.",
    mastery: 60,
    linesTotal: 30,
    linesMastered: 15,
    strategicGoals: [
      "Build a strong pawn center with d4",
      "Exploit the pressure on Black's e5 pawn",
      "Maneuver the bishop to maintain the pin or relocate to c2",
      "Achieve long-term positional pressure",
    ],
    pawnStructures: [
      "Closed Spanish (e4 vs e5 with d3/d6) — slow maneuvering",
      "Open Spanish (exd4 lines) — piece activity and tactics",
      "Breyer pawn structure — deep positional play",
    ],
    tacticalMotifs: [
      "The d4 pawn break timing",
      "f4-f5 kingside pawn storm",
      "Ba4-b3-c2 maneuver for diagonal battery",
      "Knight maneuver Nb1-d2-f1-g3/e3",
    ],
    commonMistakes: [
      "Rushing d4 before adequate piece support",
      "Losing the bishop pair without compensation",
      "Failing to react to Black's ...d5 central counter",
      "Neglecting the queenside when focused on kingside play",
    ],
    keyPlans: [
      "Closed: Nb1-d2-f1-g3, then play for f4 or d4",
      "Anti-Marshall: 8.a4 to avoid the Marshall Attack",
      "Breyer: Allow ...Nb8 and play for a slow buildup",
      "Open variation: Active piece play after exd4",
    ],
    lines: [
      { id: "rl-1", name: "Closed Breyer 9...Nb8", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O 9.h3 Nb8", fen: "rnbq1rk1/2p1bppp/p2p1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 w - - 0 10", srStatus: "review", nextReview: "Mar 15", accuracy: 80 },
      { id: "rl-2", name: "Anti-Marshall 8.a4", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.a4", fen: "r1bq1rk1/2ppbppp/p1n2n2/1p2p3/P3P3/1B3N2/1PPP1PPP/RNBQR1K1 b - - 0 8", srStatus: "mature", nextReview: "Mar 19", accuracy: 88 },
      { id: "rl-3", name: "Marshall Attack 8...d5", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5", fen: "r1bq1rk1/2p1bppp/p1n2n2/1p1pp3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - - 0 9", srStatus: "learning", nextReview: "Mar 12", accuracy: 72 },
    ],
    modelGames: [
      { id: "mg-8", white: "Caruana", black: "Carlsen", year: 2018, event: "WCC London", result: "1/2-1/2", theme: "Anti-Marshall preparation" },
      { id: "mg-9", white: "Kasparov", black: "Karpov", year: 1990, event: "WCC Lyon", result: "1-0", theme: "Closed Spanish squeeze" },
    ],
    sidelines: [
      { move: "3...Nf6 (Berlin)", response: "4.O-O Nxe4 5.d4", note: "Berlin endgame — prepare to grind" },
      { move: "3...f5 (Schliemann)", response: "4.Nc3 fxe4 5.Nxe4", note: "Sharp gambit; keep calm and develop" },
    ],
  },
];

const TABS = [
  { id: "repertoire", label: "My Repertoire", icon: BookOpen },
  { id: "explorer", label: "Line Explorer", icon: Layers },
  { id: "drill", label: "Guess-the-Move", icon: Play },
  { id: "study", label: "Study Mode", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SR_BADGE: Record<OpeningLine["srStatus"], { label: string; cls: string }> = {
  new: { label: "New", cls: "badge-rose" },
  learning: { label: "In Progress", cls: "badge-gold" },
  review: { label: "Ready to Review", cls: "badge-blue" },
  mature: { label: "Mastered", cls: "badge-emerald" },
};

// ---------------------------------------------------------------------------
// Mastery mini-ring (32px circular progress)
// ---------------------------------------------------------------------------

function MasteryRing({ value }: { value: number }) {
  const size = 36;
  const sw = 3;
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (value / 100) * circ;
  const color = value >= 70 ? "#22C55E" : value >= 40 ? "#F0B429" : "#475569";

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold text-text-primary">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ─── Guess-the-Move Drill types ─────────────────────────────────────────────

type DrillPhase = "idle" | "guessing" | "feedback" | "complete";

interface DrillState {
  opening: Opening;
  line: OpeningLine;
  moveList: string[];      // parsed SAN moves from the line
  moveIndex: number;       // which move we're currently quizzing
  currentFen: string;      // board state before this move
  chess: Chess;            // live chess instance
  mistakes: number;        // mistakes this line
  phase: DrillPhase;
  lastGuess: string | null;
  correct: boolean | null;
}

function parseSanMoves(pgn: string): string[] {
  // Strip move numbers and annotations: "1.e4 e5 2.Nf3" → ["e4","e5","Nf3"]
  return pgn
    .replace(/\d+\.\.\./g, "")
    .replace(/\d+\./g, "")
    .trim()
    .split(/\s+/)
    .filter((t) => t && !/^\d/.test(t));
}

function buildChoices(correctSan: string, chess: Chess, count = 4): string[] {
  const legal = chess.moves();
  if (legal.length <= count) return legal.sort(() => Math.random() - 0.5);
  const others = legal.filter((m) => m !== correctSan).sort(() => Math.random() - 0.5).slice(0, count - 1);
  const choices = [...others, correctSan].sort(() => Math.random() - 0.5);
  return choices;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OpeningsPage() {
  const [tab, setTab] = useState<TabId>("repertoire");
  const [selectedOpening, setSelectedOpening] = useState<Opening>(OPENINGS[0]);
  const [selectedLine, setSelectedLine] = useState<OpeningLine | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Drill state
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [drillChoices, setDrillChoices] = useState<string[]>([]);
  const [drillScore, setDrillScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [drillHistory, setDrillHistory] = useState<{ line: string; mistakes: number }[]>([]);

  // Derived
  const whiteOpenings = OPENINGS.filter((o) => o.side === "white");
  const blackOpenings = OPENINGS.filter((o) => o.side === "black");

  // ─── Drill helpers ────────────────────────────────────────────────────────

  const startDrill = useCallback((opening: Opening, line: OpeningLine) => {
    const moveList = parseSanMoves(line.moves);
    if (moveList.length === 0) return;
    const chess = new Chess();
    const choices = buildChoices(moveList[0], chess, 4);
    setDrill({
      opening, line, moveList, moveIndex: 0,
      currentFen: chess.fen(),
      chess, mistakes: 0,
      phase: "guessing",
      lastGuess: null, correct: null,
    });
    setDrillChoices(choices);
    setDrillScore({ correct: 0, total: 0 });
  }, []);

  const handleDrillGuess = useCallback((guess: string) => {
    if (!drill || drill.phase !== "guessing") return;
    const expected = drill.moveList[drill.moveIndex];
    const norm = (s: string) => s?.replace(/[+#!?]/g, "");
    const isCorrect = norm(guess) === norm(expected);

    setDrill((prev) => prev ? ({
      ...prev,
      phase: "feedback",
      lastGuess: guess,
      correct: isCorrect,
      mistakes: isCorrect ? prev.mistakes : prev.mistakes + 1,
    }) : null);
    setDrillScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [drill]);

  const advanceDrill = useCallback(() => {
    if (!drill) return;
    const expected = drill.moveList[drill.moveIndex];

    // Play the correct move on the chess instance
    const chess = new Chess(drill.currentFen);
    try { chess.move(expected); } catch { /* invalid */ }

    const nextIndex = drill.moveIndex + 1;

    if (nextIndex >= drill.moveList.length) {
      // Line complete
      setDrillHistory((h) => [...h, { line: drill.line.name, mistakes: drill.mistakes }]);
      setDrill((prev) => prev ? ({ ...prev, phase: "complete", chess }) : null);
      return;
    }

    // Advance to next move
    const nextFen = chess.fen();
    const nextMove = drill.moveList[nextIndex];
    const choices = buildChoices(nextMove, chess, 4);
    setDrillChoices(choices);
    setDrill((prev) => prev ? ({
      ...prev,
      moveIndex: nextIndex,
      currentFen: nextFen,
      chess,
      phase: "guessing",
      lastGuess: null,
      correct: null,
    }) : null);
  }, [drill]);

  const drillFen = useMemo(
    () => drill?.currentFen ?? selectedOpening.fen,
    [drill, selectedOpening.fen]
  );

  // Helpers
  function srSummary(opening: Opening) {
    const counts = { new: 0, learning: 0, review: 0, mature: 0 };
    opening.lines.forEach((l) => counts[l.srStatus]++);
    return counts;
  }

  // ----- Repertoire tab -----
  function renderRepertoireSection(title: string, openings: Opening[], side: Side) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{side === "white" ? "\u2654" : "\u265A"}</span>
          <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
          <span className="text-sm text-text-muted">({openings.length})</span>
        </div>

        <div className="space-y-3">
          {openings.map((op) => {
            const sr = srSummary(op);
            const isExpanded = expandedId === op.id;

            return (
              <div key={op.id} className="card border border-border-subtle">
                {/* Opening Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : op.id)}
                  className="w-full flex items-start gap-4 text-left"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Chessboard fen={op.fen} size={64} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{op.name}</h3>
                      <Tooltip content={`ECO Code: ${op.eco} — A standardized classification for this opening`}>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.06] text-text-muted">{op.eco}</span>
                      </Tooltip>
                      {op.difficulty && <DifficultyDot level={op.difficulty as "beginner" | "intermediate" | "advanced"} />}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
                      {op.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-text-muted">
                        {op.linesMastered}/{op.linesTotal} lines mastered
                      </span>
                      <div className="flex items-center gap-1.5">
                        {sr.new > 0 && <span className="badge-rose text-[10px]">{sr.new} new</span>}
                        {sr.learning > 0 && (
                          <span className="badge-gold text-[10px]">{sr.learning} in progress</span>
                        )}
                        {sr.review > 0 && (
                          <span className="badge-blue text-[10px]">{sr.review} ready</span>
                        )}
                        {sr.mature > 0 && (
                          <span className="badge-emerald text-[10px]">{sr.mature} mastered</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <MasteryRing value={op.mastery} />
                    <ChevronRight
                      className={`w-5 h-5 text-text-muted transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-6 pt-6 space-y-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Mastery bar */}
                    <SkillBar
                      label="Overall Mastery"
                      value={op.mastery}
                      color={op.mastery > 70 ? "#22C55E" : op.mastery > 50 ? "#F0B429" : "#475569"}
                    />

                    {/* Strategic info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Strategic Goals */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-accent-emerald" />
                          <h4 className="text-sm font-semibold">Strategic Goals</h4>
                        </div>
                        <ul className="space-y-2">
                          {op.strategicGoals.map((g, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 text-accent-emerald flex-shrink-0 mt-0.5" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pawn Structures */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4 text-accent-blue" />
                          <h4 className="text-sm font-semibold">Pawn Structures</h4>
                        </div>
                        <ul className="space-y-2">
                          {op.pawnStructures.map((p, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0 mt-1.5" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tactical Motifs */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-4 h-4 text-accent-gold" />
                          <h4 className="text-sm font-semibold">Tactical Motifs</h4>
                        </div>
                        <ul className="space-y-2">
                          {op.tacticalMotifs.map((m, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <Star className="w-3 h-3 text-accent-gold flex-shrink-0 mt-0.5" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Common Mistakes */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-accent-rose" />
                          <h4 className="text-sm font-semibold">Common Mistakes</h4>
                        </div>
                        <ul className="space-y-2">
                          {op.commonMistakes.map((m, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 text-accent-rose flex-shrink-0 mt-0.5" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key Plans */}
                      <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-accent-gold" />
                          <h4 className="text-sm font-semibold">Key Plans</h4>
                        </div>
                        <ul className="space-y-2">
                          {op.keyPlans.map((p, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 text-accent-gold flex-shrink-0 mt-0.5" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Anti-Surprise Prep */}
                    <div className="p-4 rounded-lg bg-accent-gold/5 border border-accent-gold/10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-accent-gold" />
                        <h4 className="text-sm font-semibold text-accent-gold">
                          Anti-Surprise Prep — Sidelines
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {op.sidelines.map((s, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-bg-secondary border border-border-subtle"
                          >
                            <p className="text-xs font-mono font-semibold text-accent-rose">
                              {s.move}
                            </p>
                            <p className="text-xs font-mono text-accent-emerald mt-1">
                              {s.response}
                            </p>
                            <p className="text-[11px] text-text-muted mt-1.5">{s.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Model Games */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-accent-blue" />
                        <h4 className="text-sm font-semibold">Model Games</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {op.modelGames.map((g) => (
                          <div
                            key={g.id}
                            className="p-3 rounded-lg bg-bg-secondary border border-border-subtle hover:border-accent-gold/20 transition-all cursor-pointer"
                          >
                            <p className="text-sm font-semibold">
                              {g.white} vs {g.black}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {g.event}, {g.year}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  g.result === "1-0"
                                    ? "text-accent-emerald"
                                    : g.result === "0-1"
                                    ? "text-accent-rose"
                                    : "text-text-muted"
                                }`}
                              >
                                {g.result}
                              </span>
                              <span className="text-[11px] text-text-secondary">{g.theme}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedOpening(op);
                          setSelectedLine(op.lines[0]);
                          setTab("explorer");
                        }}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Layers className="w-4 h-4" />
                        Explore Lines
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOpening(op);
                          setTab("study");
                        }}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <Brain className="w-4 h-4" />
                        Study Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----- Drill tab -----
  function renderDrill() {
    if (!drill) {
      // Line picker
      return (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-5 h-5 text-accent-gold" />
              <h2 className="font-display text-xl font-semibold">Guess-the-Move Drill</h2>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Choose a line to drill. The board shows each position and you pick the master move from 4 options.
              Wrong guesses show why that move is a mistake.
            </p>

            {drillHistory.length > 0 && (
              <div className="mb-5 p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Last Session</p>
                {drillHistory.slice(-3).map((h, i) => (
                  <div key={i} className="flex justify-between text-xs py-1">
                    <span className="text-text-secondary">{h.line}</span>
                    <span className={h.mistakes === 0 ? "text-accent-emerald" : "text-accent-gold"}>
                      {h.mistakes === 0 ? "Perfect" : `${h.mistakes} mistake${h.mistakes !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {OPENINGS.map((op) =>
                op.lines.map((line) => (
                  <button
                    key={line.id}
                    onClick={() => { startDrill(op, line); }}
                    className="w-full text-left p-3 rounded-lg border border-border-subtle bg-bg-secondary hover:border-accent-gold/30 hover:bg-accent-gold/5 transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <Chessboard fen={op.fen} size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{line.name}</p>
                      <p className="text-xs text-text-muted">{op.name} · {parseSanMoves(line.moves).length} moves</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={SR_BADGE[line.srStatus].cls + " text-[10px]"}>
                        {SR_BADGE[line.srStatus].label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    const { opening, line, moveList, moveIndex, phase, lastGuess, correct, mistakes } = drill;
    const progressPct = Math.round((moveIndex / moveList.length) * 100);
    const expectedMove = moveList[moveIndex] ?? "";

    // Check if it's user's side to move (user plays their color in the opening)
    const isUserMove = moveIndex % 2 === (opening.side === "white" ? 0 : 1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board */}
        <div className="lg:col-span-2 card flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{line.name}</h3>
              <p className="text-xs text-text-muted">{opening.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted font-mono">
                Move {moveIndex + 1}/{moveList.length}
              </span>
              <button onClick={() => setDrill(null)} className="btn-ghost text-xs flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Change line
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-bg-tertiary rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-accent-gold rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          <Chessboard fen={drillFen} size={460} orientation={opening.side} />

          {/* Feedback banner */}
          {phase === "feedback" && (
            <div className={`w-full mt-4 p-3 rounded-lg flex items-start gap-3 ${
              correct ? "bg-accent-emerald/10 border border-accent-emerald/20" : "bg-accent-rose/10 border border-accent-rose/20"
            }`}>
              {correct
                ? <CheckCircle2 className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                {correct ? (
                  <p className="text-sm font-semibold text-accent-emerald">
                    Correct! <span className="font-mono">{expectedMove}</span>
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-accent-rose">
                      Not quite — you played <span className="font-mono">{lastGuess}</span>
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      The correct move is <span className="font-mono font-bold text-accent-emerald">{expectedMove}</span>.
                      {opening.commonMistakes.length > 0 && (
                        <span className="ml-1 text-text-muted">{opening.commonMistakes[0]}</span>
                      )}
                    </p>
                  </>
                )}
                <button
                  onClick={advanceDrill}
                  className="btn-primary text-xs mt-3 flex items-center gap-1"
                >
                  {moveIndex + 1 >= moveList.length ? "Finish" : "Next move →"}
                </button>
              </div>
            </div>
          )}

          {phase === "complete" && (
            <div className="w-full mt-4 p-4 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg text-center">
              <Trophy className="w-8 h-8 text-accent-gold mx-auto mb-2" />
              <p className="font-semibold text-accent-emerald">Line complete!</p>
              <p className="text-sm text-text-muted mt-1">
                {mistakes === 0
                  ? "Perfect score — no mistakes!"
                  : `${mistakes} mistake${mistakes !== 1 ? "s" : ""} — keep practicing!`}
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => startDrill(opening, line)} className="btn-primary text-sm flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Drill again
                </button>
                <button onClick={() => setDrill(null)} className="btn-ghost text-sm">
                  Choose another line
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Move choices */}
          {(phase === "guessing" || phase === "idle") && isUserMove && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-gold" />
                Your move — {opening.side === "white" ? "White" : "Black"} to play
              </h3>
              <p className="text-xs text-text-muted mb-3">
                Which move continues the {line.name}?
              </p>
              <div className="space-y-2">
                {drillChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleDrillGuess(choice)}
                    className="w-full text-left p-3 rounded-lg border border-border-subtle bg-bg-secondary hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all font-mono text-sm font-semibold text-text-primary"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opponent's move (auto-played) */}
          {(phase === "guessing" || phase === "idle") && !isUserMove && (
            <div className="card">
              <p className="text-sm text-text-secondary">
                Opponent plays <span className="font-mono font-bold">{expectedMove}</span>
              </p>
              <button onClick={advanceDrill} className="btn-primary text-sm mt-3 w-full">
                Continue →
              </button>
            </div>
          )}

          {/* Session stats */}
          <div className="card">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Session</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-accent-emerald">{drillScore.correct}</p>
                <p className="text-[10px] text-text-muted">Correct</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-accent-rose">{drillScore.total - drillScore.correct}</p>
                <p className="text-[10px] text-text-muted">Mistakes</p>
              </div>
            </div>
            {drillScore.total > 0 && (
              <div className="mt-3">
                <SkillBar
                  label={`${Math.round((drillScore.correct / drillScore.total) * 100)}% accuracy`}
                  value={Math.round((drillScore.correct / drillScore.total) * 100)}
                  color="#22c55e"
                />
              </div>
            )}
          </div>

          {/* Key plans reminder */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-accent-gold" />
              <h3 className="text-sm font-semibold">Key Plans</h3>
            </div>
            <ul className="space-y-1.5">
              {opening.keyPlans.slice(0, 2).map((plan, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 text-accent-gold flex-shrink-0 mt-0.5" />
                  {plan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ----- Explorer tab -----
  function renderExplorer() {
    const line = selectedLine ?? selectedOpening.lines[0];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board */}
        <div className="lg:col-span-2 card flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{selectedOpening.name}</h3>
              <span className="text-xs font-mono text-text-muted">{selectedOpening.eco}</span>
            </div>
            {line && (
              <div className="flex items-center gap-2">
                <span className={SR_BADGE[line.srStatus].cls}>{SR_BADGE[line.srStatus].label}</span>
                {line.accuracy > 0 && (
                  <span className="text-xs text-text-muted">{line.accuracy}% accuracy</span>
                )}
              </div>
            )}
          </div>

          <Chessboard
            fen={line?.fen ?? selectedOpening.fen}
            size={480}
            orientation={selectedOpening.side}
          />

          {line && (
            <div className="w-full mt-4 p-3 bg-bg-tertiary rounded-lg">
              <p className="text-sm font-semibold text-text-primary mb-1">{line.name}</p>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">{line.moves}</p>
            </div>
          )}
        </div>

        {/* Line List */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Lines in {selectedOpening.name}</h3>
            <div className="space-y-1.5">
              {selectedOpening.lines.map((l) => {
                const badge = SR_BADGE[l.srStatus];
                const isActive = line?.id === l.id;

                return (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLine(l)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? "bg-accent-gold/10 border-accent-gold/30"
                        : "bg-bg-secondary border-border-subtle hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary line-clamp-1">
                        {l.name}
                      </span>
                      <span className={`${badge.cls} text-[10px] flex-shrink-0 ml-2`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {l.accuracy > 0 && (
                        <span className="text-[11px] text-text-muted">
                          {l.accuracy}% accuracy
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {l.nextReview}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opening selector */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Switch Opening</h3>
            <div className="space-y-1.5">
              {OPENINGS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOpening(op);
                    setSelectedLine(op.lines[0]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                    selectedOpening.id === op.id
                      ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                      : "bg-bg-secondary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                      op.side === "white"
                        ? "bg-white border-border-subtle"
                        : "bg-bg-primary border-border-subtle"
                    }`}
                  />
                  {op.name}
                  <span className="text-[10px] font-mono text-text-muted ml-auto">{op.eco}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Study Mode tab -----
  function renderStudyMode() {
    const dueLines = selectedOpening.lines.filter(
      (l) => l.srStatus === "review" || l.srStatus === "learning" || l.srStatus === "new"
    );
    const matureLines = selectedOpening.lines.filter((l) => l.srStatus === "mature");

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Study Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Board */}
          <div className="card flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent-gold" />
                <h3 className="font-semibold">Spaced Repetition — {selectedOpening.name}</h3>
              </div>
              <span className="text-sm text-text-muted">
                {dueLines.length} lines due for review
              </span>
            </div>

            <Chessboard
              fen={dueLines.length > 0 ? dueLines[0].fen : selectedOpening.fen}
              size={420}
              orientation={selectedOpening.side}
              interactive
            />

            {dueLines.length > 0 ? (
              <div className="w-full mt-4 p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{dueLines[0].name}</p>
                  <span className={SR_BADGE[dueLines[0].srStatus].cls}>
                    {SR_BADGE[dueLines[0].srStatus].label}
                  </span>
                </div>
                <p className="text-xs font-mono text-text-secondary">{dueLines[0].moves}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="btn-primary text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Got it
                  </button>
                  <button className="btn-secondary text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Again
                  </button>
                  <button className="btn-ghost text-sm flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Show Line
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full mt-4 p-4 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg text-center">
                <CheckCircle2 className="w-6 h-6 text-accent-emerald mx-auto mb-2" />
                <p className="text-sm font-semibold text-accent-emerald">
                  All caught up!
                </p>
                <p className="text-xs text-text-muted mt-1">
                  No lines due for review in this opening.
                </p>
              </div>
            )}
          </div>

          {/* Key Plans Reference */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-accent-gold" />
              <h3 className="text-sm font-semibold">Strategic Plans</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedOpening.keyPlans.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-bg-tertiary border border-border-subtle"
                >
                  <p className="text-xs text-text-secondary leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* SR Status Overview */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Review Status</h3>
            <div className="space-y-3">
              {selectedOpening.lines.map((l) => {
                const badge = SR_BADGE[l.srStatus];
                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-bg-secondary border border-border-subtle"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-xs font-medium text-text-primary truncate">{l.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {l.nextReview}
                        </span>
                        {l.accuracy > 0 && (
                          <span className="text-[10px] text-text-muted">{l.accuracy}%</span>
                        )}
                      </div>
                    </div>
                    <span className={`${badge.cls} text-[10px] flex-shrink-0`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mastery Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Mastery Breakdown</h3>
            <div className="space-y-3">
              <SkillBar label="Lines Mastered" value={selectedOpening.linesMastered} maxValue={selectedOpening.linesTotal} color="#34d399" />
              <SkillBar label="Overall Mastery" value={selectedOpening.mastery} color="#c9a84c" />
              <SkillBar
                label="Average Accuracy"
                value={
                  Math.round(
                    selectedOpening.lines.filter((l) => l.accuracy > 0).reduce((s, l) => s + l.accuracy, 0) /
                      (selectedOpening.lines.filter((l) => l.accuracy > 0).length || 1)
                  )
                }
                color="#60a5fa"
              />
            </div>
          </div>

          {/* Summary stats */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Session Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-accent-emerald">{matureLines.length}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Mastered</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-accent-gold">{dueLines.length}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Ready to Review</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-accent-blue">
                  {selectedOpening.linesTotal}
                </p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Lines</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-xl font-bold text-text-primary">
                  {selectedOpening.modelGames.length}
                </p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Model Games</p>
              </div>
            </div>
          </div>

          {/* Opening Selector */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Switch Opening</h3>
            <div className="space-y-1.5">
              {OPENINGS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOpening(op);
                    setSelectedLine(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                    selectedOpening.id === op.id
                      ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                      : "bg-bg-secondary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                      op.side === "white"
                        ? "bg-white border-border-subtle"
                        : "bg-bg-primary border-border-subtle"
                    }`}
                  />
                  {op.name}
                  <span className="text-[10px] font-mono text-text-muted ml-auto">{op.eco}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Opening Playbook</h1>
          <p className="text-text-muted text-sm mt-1">
            Learn not just the moves, but the plans that make them work.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-accent-gold">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">{OPENINGS.length} openings</span>
          </div>
          <div className="text-text-muted">
            {OPENINGS.reduce((s, o) => s + o.linesMastered, 0)}/
            {OPENINGS.reduce((s, o) => s + o.linesTotal, 0)} lines mastered
          </div>
        </div>
      </div>

      {/* Coach's Note */}
      <div className="p-4 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm text-text-secondary leading-relaxed">
          A strong opening repertoire is built on understanding, not memorization. 
          Study the Key Plans below each position — they tell you the strategic purpose 
          behind every move.
        </p>
      </div>

      {/* Tab Navigation — segmented control */}
      <div className="segmented-control">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-active={tab === t.id}
              className="flex items-center gap-2"
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "repertoire" && (
        <div className="space-y-8">
          {renderRepertoireSection("White Repertoire", whiteOpenings, "white")}
          {renderRepertoireSection("Black Repertoire", blackOpenings, "black")}
        </div>
      )}

      {tab === "explorer" && renderExplorer()}

      {tab === "drill" && renderDrill()}

      {tab === "study" && renderStudyMode()}
    </div>
  );
}
