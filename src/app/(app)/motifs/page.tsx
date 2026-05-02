"use client";

import { useState } from "react";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Target,
  Zap,
  Shield,
  Eye,
  Crown,
  Crosshair,
  ArrowRight,
  BookOpen,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MotifExample {
  fen: string;
  side: "white" | "black";
  highlight: string[];
  caption: string;
}

interface Motif {
  id: string;
  name: string;
  category: "forcing" | "positional" | "mating";
  icon: React.ReactNode;
  difficulty: "beginner" | "intermediate" | "advanced";
  tagline: string;
  definition: string;
  howToSpot: string[];
  keyIdea: string;
  example: MotifExample;
  practiceTheme: string;
}

// ---------------------------------------------------------------------------
// Motif data
// ---------------------------------------------------------------------------

const MOTIFS: Motif[] = [
  {
    id: "fork",
    name: "Fork",
    category: "forcing",
    icon: <Zap className="w-4 h-4" />,
    difficulty: "beginner",
    tagline: "One piece attacks two targets simultaneously.",
    definition:
      "A fork is a move where a single piece attacks two or more enemy pieces at the same time, forcing the opponent to lose material since they can only save one.",
    howToSpot: [
      "Look for knight moves that land on a square attacking two pieces",
      "Check if your queen, bishop, or rook can line up on two undefended targets",
      "After a piece captures, see if a fork square opens up",
      "Ask: 'What if I could move here — how many pieces does it hit?'",
    ],
    keyIdea:
      "The attacker creates a double threat. The defender can only respond to one. Always calculate whether the forking piece itself is safe on its landing square.",
    example: {
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      side: "white",
      highlight: ["f7", "d8", "e8", "g8"],
      caption:
        "White's bishop on c4 eyes f7, which is attacked by Ng5 as well. A Ng5 fork hits f7 and threatens the queen on d8.",
    },
    practiceTheme: "fork",
  },
  {
    id: "pin",
    name: "Pin",
    category: "forcing",
    icon: <Target className="w-4 h-4" />,
    difficulty: "beginner",
    tagline: "A piece is frozen because moving it exposes something more valuable.",
    definition:
      "A pin immobilizes an enemy piece because moving it would expose a more valuable piece behind it to capture. An absolute pin (against the king) means the pinned piece literally cannot move legally.",
    howToSpot: [
      "Line up your bishop or rook on a diagonal/file where two enemy pieces are aligned",
      "Check if the piece behind is the king (absolute pin) or a valuable piece (relative pin)",
      "Look for ways to increase pressure on the pinned piece — attack it with more pieces",
      "Absolute pins on knights near the king are especially powerful",
    ],
    keyIdea:
      "Absolute pins are free — the opponent cannot break them by moving the pinned piece. Attack the pinned piece multiple times to win it. Relative pins are only good if the piece behind is worth more than the attacker.",
    example: {
      fen: "rnb1kbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 2 3",
      side: "white",
      highlight: ["c4", "f7", "e8"],
      caption:
        "White's bishop on c4 pins the f7 pawn against the black king on e8. The f7 pawn cannot move — it would expose the king to check.",
    },
    practiceTheme: "pin",
  },
  {
    id: "skewer",
    name: "Skewer",
    category: "forcing",
    icon: <ArrowRight className="w-4 h-4" />,
    difficulty: "beginner",
    tagline: "Attack the valuable piece to win what's hiding behind it.",
    definition:
      "A skewer is the reverse of a pin. A valuable piece is attacked, it must move, and the attacker then captures the less valuable piece that was behind it.",
    howToSpot: [
      "Look for enemy pieces aligned on a rank, file, or diagonal with a gap between them",
      "Check if you can attack the front (more valuable) piece with a long-range piece",
      "The attacked piece must move — exposing whatever is behind it",
      "Rooks on open files and bishops on long diagonals are the best skewers",
    ],
    keyIdea:
      "Unlike a pin, the front piece is the more valuable one. When it runs, you collect the undefended piece behind it. King + queen on the same file/diagonal are the dream skewer target.",
    example: {
      fen: "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1",
      side: "white",
      highlight: ["e2", "e8"],
      caption:
        "White's queen on e2 attacks the black king on e8. When the king moves, the queen captures whatever was behind it. Here the king is skewered — it must flee the e-file.",
    },
    practiceTheme: "skewer",
  },
  {
    id: "discovered-attack",
    name: "Discovered Attack",
    category: "forcing",
    icon: <Eye className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "Move one piece to unleash the hidden attack of another.",
    definition:
      "A discovered attack occurs when a piece moves, revealing an attack by another piece behind it. The moving piece often makes its own threat simultaneously, creating a double attack that is very hard to meet.",
    howToSpot: [
      "Look for pieces that are 'lined up' behind one of your own pieces on a rank, file, or diagonal",
      "Ask: 'What happens if the front piece moves away?'",
      "The moving piece should ideally make its own threat — attack a piece, give check, or fork",
      "Discovered checks are especially powerful because the opponent must address the check",
    ],
    keyIdea:
      "You get two threats for the price of one move. The opponent can typically only stop one of them. The piece you move away doesn't even need to go to a safe square — the discovered attack on the back piece wins material.",
    example: {
      fen: "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 7",
      side: "black",
      highlight: ["f6", "c3", "c4"],
      caption:
        "If Black moves the Nf6 (e.g., Ng4 attacking f2), it discovers an attack by the Bc5 on the Bc4. White cannot defend both targets.",
    },
    practiceTheme: "discoveredAttack",
  },
  {
    id: "double-check",
    name: "Double Check",
    category: "forcing",
    icon: <Zap className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "Two pieces give check simultaneously — the king must run.",
    definition:
      "A double check happens when a discovered attack reveals check AND the moving piece also gives check. Since two pieces give check at once, the only legal response is to move the king — blocking or capturing doesn't work.",
    howToSpot: [
      "Look for a discovered check where the moving piece also lands on a square giving check",
      "The attacking piece must move along a line where both it and the uncovered piece check the king",
      "Double checks often force the king to an exposed square, enabling a quick checkmate",
      "They are rare but devastating — almost always lead to material gain or mate",
    ],
    keyIdea:
      "A double check cannot be blocked or captured — the king is legally forced to move. This is why double checks are so powerful: they bypass most defenses and can drive the king into the open.",
    example: {
      fen: "r4rk1/ppp1bppp/2n1bn2/3qp3/3PP3/2NB1N2/PPP1BPPP/R2Q1RK1 b - - 0 1",
      side: "white",
      highlight: ["d3", "f5", "g8"],
      caption:
        "In many sharp positions, a discovered check with Nf5+ also attacks the king's escape squares. The king cannot stay, block, or capture both pieces — it must run.",
    },
    practiceTheme: "doubleCheck",
  },
  {
    id: "decoy",
    name: "Decoy",
    category: "forcing",
    icon: <Crown className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "Lure the enemy king or piece onto a bad square.",
    definition:
      "A decoy (or lure) is a sacrifice that forces an enemy piece — usually the king or queen — onto a specific square where it becomes vulnerable to a follow-up tactic.",
    howToSpot: [
      "Imagine the enemy king or queen on a specific square — would you have a winning tactic?",
      "Look for a sacrifice that forces that piece to go exactly there",
      "Queen sacrifices decoy the king into a mating net — very common in practice",
      "The decoy creates a new weakness that is immediately exploited",
    ],
    keyIdea:
      "The decoyed piece is forced to an 'ideal target square' where the attacker's follow-up works. The sacrifice is usually sound because the positional/material compensation (checkmate or winning material) is decisive.",
    example: {
      fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
      side: "white",
      highlight: ["d1", "d8", "g8"],
      caption:
        "White plays Rd8+ — a decoy sacrifice. If the king takes (Kxd8), White follows with a mating attack. If declined, White may play a different winning line.",
    },
    practiceTheme: "deflection",
  },
  {
    id: "deflection",
    name: "Deflection",
    category: "forcing",
    icon: <Crosshair className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "Drive away the defender protecting a key square or piece.",
    definition:
      "Deflection forces an enemy piece away from a critical defensive duty. Once the defender is deflected — either because it captured something, was captured, or had to flee — the defended target becomes vulnerable.",
    howToSpot: [
      "Identify what one enemy piece is doing: guarding a mate square, defending another piece, preventing promotion",
      "Find a move that forces that piece to abandon its post",
      "A sacrifice to deflect is often sound if what you gain after is worth more",
      "Look at pieces that are 'overworked' — defending two things at once (this overlaps with overloading)",
    ],
    keyIdea:
      "The deflected piece is forced off its critical task. The moment it leaves, the target it was protecting falls. Sacrificial deflections are one of the most common themes in combination play.",
    example: {
      fen: "6k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1",
      side: "white",
      highlight: ["f3", "f7", "g8"],
      caption:
        "White's queen on f3 eyes f7. If Black's king is the only defender of f7, White wins the pawn. A threat to deflect the king (e.g., Qh5 threatening Qh7+) forces it to move, then Qxf7 wins.",
    },
    practiceTheme: "deflection",
  },
  {
    id: "overloading",
    name: "Overloading",
    category: "forcing",
    icon: <Shield className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "Force one piece to defend two things — it can't do both.",
    definition:
      "An overloaded piece has two defensive duties at once. By attacking both things it defends, you force it to choose. It can only protect one, so you win the other.",
    howToSpot: [
      "Identify pieces that are defending multiple pieces or squares simultaneously",
      "Ask: 'If I attack both things this piece defends, what happens?'",
      "Queens and rooks are commonly overloaded; knights and pawns less so",
      "Attack one defended target, forcing a response, then take the other",
    ],
    keyIdea:
      "The overloaded piece is stretched too thin. Once you identify it, the tactic usually follows naturally: attack both things it defends, and one must fall. This is also called 'exploiting an overworked piece.'",
    example: {
      fen: "r2q1rk1/ppp2ppp/2n1bn2/2bpp3/4P3/2NP1N2/PPP1BPPP/R1BQ1RK1 w - - 0 1",
      side: "white",
      highlight: ["e5", "c5", "e4"],
      caption:
        "If Black's queen on d8 must defend both the Nc6 and the Be5, an attack on both pieces simultaneously overloads the queen — it cannot protect both.",
    },
    practiceTheme: "overloading",
  },
  {
    id: "interference",
    name: "Interference",
    category: "forcing",
    icon: <Target className="w-4 h-4" />,
    difficulty: "advanced",
    tagline: "Cut the line of communication between two defending pieces.",
    definition:
      "An interference sacrifice places a piece on a square that blocks the line connecting two cooperating enemy pieces. Once their coordination is broken, a winning threat becomes unstoppable.",
    howToSpot: [
      "Look for two enemy pieces that guard each other or protect the same square along a line",
      "Find a square between them — placing a piece there cuts their connection",
      "The interfering piece is usually sacrificed because its job is done once the line is broken",
      "Common in endgames (blocking a rook defending a square) and middlegame combinations",
    ],
    keyIdea:
      "Geometry is everything in chess. Two pieces cooperating along a line are far stronger than two isolated pieces. An interference cuts that line, halving their defensive power for the price of one piece.",
    example: {
      fen: "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
      side: "white",
      highlight: ["d4", "d1", "d8"],
      caption:
        "Both rooks control the d-file. An interference piece played to d4 would cut the communication between them, preventing the back rook from retreating to safety if White attacks.",
    },
    practiceTheme: "interference",
  },
  {
    id: "clearance",
    name: "Clearance",
    category: "forcing",
    icon: <ArrowRight className="w-4 h-4" />,
    difficulty: "advanced",
    tagline: "Vacate a square or line so another piece can use it.",
    definition:
      "A clearance sacrifice moves or sacrifices a piece to free a critical square, rank, file, or diagonal for a more powerful piece. The sacrificed piece clears the way for a decisive combination.",
    howToSpot: [
      "Ask: 'Which piece would be devastating if it could get to square X?'",
      "Identify what is blocking that piece from reaching X",
      "Sacrifice or move the blocker — even at material cost — to unleash the powerful piece",
      "Common before back-rank mates (clearing a rank for a rook) or diagonal attacks (clearing for a queen)",
    ],
    keyIdea:
      "The clearing piece's value is irrelevant — what matters is what becomes possible after. A pawn sacrifice that opens a diagonal for a bishop can be worth far more than its material value.",
    example: {
      fen: "r4rk1/1pp2ppp/p1n5/3p4/3P4/2P2N2/PP3PPP/R4RK1 w - - 0 1",
      side: "white",
      highlight: ["f1", "f7", "f6"],
      caption:
        "White's rook on f1 wants to penetrate to f7. If a piece blocks the f-file, a clearance sacrifice on f6 opens the file, allowing Rf7 with a decisive penetration.",
    },
    practiceTheme: "clearance",
  },
  {
    id: "back-rank-mate",
    name: "Back-Rank Mate",
    category: "mating",
    icon: <Crown className="w-4 h-4" />,
    difficulty: "beginner",
    tagline: "The castled king is trapped on its back rank by its own pawns.",
    definition:
      "A back-rank checkmate (or Corridor Mate) occurs when a rook or queen delivers checkmate on the 1st or 8th rank because the king cannot escape — its own pawns block all flight squares.",
    howToSpot: [
      "Look at the opponent's castled king — are the pawns in front unmoved (g7/h7/f7 for Black)?",
      "If yes, the king is trapped on the back rank — the pawns are a prison, not protection",
      "See if you can get a rook or queen to the 8th rank without it being captured",
      "Clearance sacrifices on g7 or h7 often set up back-rank mates",
    ],
    keyIdea:
      "This is the most common mating theme in amateur chess. The antidote is to create a 'luft' (air) by pushing one pawn — g3 or h3 for White, g6 or h6 for Black. Always check if your castled king needs breathing room.",
    example: {
      fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
      side: "white",
      highlight: ["a1", "a8", "g8", "f7", "g7", "h7"],
      caption:
        "White plays Ra8#. Black's king on g8 is trapped — f7, g7, h7 are all blocked by its own pawns. The rook delivers checkmate on the back rank.",
    },
    practiceTheme: "backRankMate",
  },
  {
    id: "smothered-mate",
    name: "Smothered Mate",
    category: "mating",
    icon: <Crown className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "A knight checkmates the king trapped by its own pieces.",
    definition:
      "Smothered mate is checkmate delivered by a knight against a king that is completely surrounded by its own pieces. The king has no escape because its own army blocks all flight squares.",
    howToSpot: [
      "Look for a king that is hemmed in by its own pieces (especially in the corner)",
      "A knight check that the king cannot escape — and cannot be captured — delivers smothered mate",
      "The classic pattern: sacrifice the queen to force Rxq, then Nf7# (or equivalent) with the king cornered",
      "Castled kings in the corner (h1/g1 configuration) are the classic target",
    ],
    keyIdea:
      "The beauty of smothered mate is that it uses the opponent's own pieces as weapons against their king. The queen sacrifice that forces the rook to recapture (blocking the king's escape) is one of the most elegant combinations in chess.",
    example: {
      fen: "6rk/6pp/8/8/8/8/6PP/5RNK w - - 0 1",
      side: "white",
      highlight: ["f1", "h1", "g1", "h8", "g8"],
      caption:
        "With White's knight on g1 and the black king trapped on h8 by its own rook on g8, a Nf7+ check cannot be escaped — g8 is blocked by the rook itself. That is smothered mate.",
    },
    practiceTheme: "smotheredMate",
  },
  {
    id: "windmill",
    name: "Windmill",
    category: "mating",
    icon: <Zap className="w-4 h-4" />,
    difficulty: "advanced",
    tagline: "Alternating checks strip the enemy position piece by piece.",
    definition:
      "A windmill (or see-saw) is a series of alternating discovered checks and direct checks that allows one player to 'vacuum' the opponent's pieces while giving check after check. The king cannot escape the merry-go-round.",
    howToSpot: [
      "Look for a rook + bishop (or rook + knight) combination where the rook gives check, the king must move, then a discovered check, repeat",
      "The king bounces between two squares — each time it moves, the rook captures a piece",
      "It requires the king to be on a file/rank where the rook can give perpetual check",
      "Famous example: Torre vs Lasker, Moscow 1925",
    ],
    keyIdea:
      "The windmill is one of chess's most spectacular tactical sequences. The attacker executes a loop: check, king moves, discovered check, king moves back — each cycle captures a new piece. Stop it as soon as the king can escape the merry-go-round.",
    example: {
      fen: "2r3k1/pp4pp/8/3R4/8/8/PP4PP/6BK w - - 0 1",
      side: "white",
      highlight: ["d5", "g1", "g8", "c8"],
      caption:
        "White's Rd8+ (check) forces Kg7 or Kh8. Then Bxc8 (or whichever piece is there) discovers check again. The king bounces, the rook collects pieces. This is the windmill engine.",
    },
    practiceTheme: "fork",
  },
  {
    id: "trapped-piece",
    name: "Trapped Piece",
    category: "positional",
    icon: <Shield className="w-4 h-4" />,
    difficulty: "intermediate",
    tagline: "An advanced piece has no safe square to retreat to.",
    definition:
      "A trapped piece is one that has ventured too far or into the wrong square and now has no safe retreat. The opponent closes the escape routes and wins the piece for free — or very little compensation.",
    howToSpot: [
      "When an enemy piece advances aggressively, ask: 'Can I close all its escape routes?'",
      "Bishops on the rim (a2, h2, a7, h7) behind pawn advances are classic trapped pieces",
      "Look for pieces that can only move to squares that are controlled by your pawns",
      "Use pawns to restrict the piece's mobility — they are cheap to use as blockers",
    ],
    keyIdea:
      "Piece mobility is as important as material value. A bishop or knight cut off from safe squares is worth less than a well-placed pawn. This pattern teaches that advancing pieces aggressively must always include an escape route.",
    example: {
      fen: "rnbqk2r/ppp2ppp/3p4/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 6",
      side: "white",
      highlight: ["e4", "d2", "f2"],
      caption:
        "If Black's knight on e4 has no safe retreat — d2 is defended, f2 is protected — it is trapped. White plays d3, then Bd2, closing all exits, and wins the knight for a pawn.",
    },
    practiceTheme: "trappedPiece",
  },
  {
    id: "zugzwang",
    name: "Zugzwang",
    category: "positional",
    icon: <BookOpen className="w-4 h-4" />,
    difficulty: "advanced",
    tagline: "Any move makes your position worse — but you must move.",
    definition:
      "Zugzwang (German: 'compulsion to move') is a situation where the player whose turn it is to move is at a disadvantage because they must move. Every legal move worsens their position, but they cannot pass.",
    howToSpot: [
      "Most common in endgames with kings and pawns — the side that must move loses the opposition",
      "In king + pawn endgames: the side that must move is in zugzwang if the king must give ground",
      "Key squares in the endgame — if the defender must move from a key square, they lose",
      "Also occurs in closed middlegames where any pawn move creates a fatal weakness",
    ],
    keyIdea:
      "In endgames, zugzwang is the most powerful weapon. The concept of 'opposition' between kings is entirely based on zugzwang. Placing the opponent in zugzwang is often the only way to convert K+P endgames — the king maneuvers to force the opponent to move and give ground.",
    example: {
      fen: "8/8/8/3k4/3P4/3K4/8/8 w - - 0 1",
      side: "white",
      highlight: ["d3", "d5", "d4"],
      caption:
        "White's king on d3 and Black's king on d5 face each other across the pawn on d4. It is Black's turn — Black is in zugzwang. Any king move allows White's king to advance and escort the pawn to promotion.",
    },
    practiceTheme: "zugzwang",
  },
];

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: "all", label: "All Motifs" },
  { id: "forcing", label: "Forcing Tactics" },
  { id: "mating", label: "Mating Patterns" },
  { id: "positional", label: "Positional" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-400/10",
  intermediate: "text-accent-gold bg-accent-gold/10",
  advanced: "text-accent-rose bg-accent-rose/10",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MotifsPage() {
  const [selectedId, setSelectedId] = useState<string>(MOTIFS[0].id);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered =
    categoryFilter === "all"
      ? MOTIFS
      : MOTIFS.filter((m) => m.category === categoryFilter);

  const selected = MOTIFS.find((m) => m.id === selectedId) ?? MOTIFS[0];

  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* ── Left sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <h1 className="text-lg font-semibold text-text-primary">Motif Library</h1>
          <p className="text-xs text-text-muted mt-0.5">15 tactical patterns</p>
        </div>

        {/* Category filter */}
        <div className="p-3 border-b border-border-subtle space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                categoryFilter === cat.id
                  ? "bg-accent-gold/10 text-accent-gold font-medium"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Motif list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((motif) => (
            <button
              key={motif.id}
              onClick={() => setSelectedId(motif.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                selectedId === motif.id
                  ? "bg-accent-gold/10 border border-accent-gold/30 text-text-primary"
                  : "hover:bg-bg-secondary text-text-muted hover:text-text-primary border border-transparent"
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                  selectedId === motif.id
                    ? "bg-accent-gold/20 text-accent-gold"
                    : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {motif.icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{motif.name}</div>
                <div
                  className={`text-[10px] capitalize px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                    DIFFICULTY_COLORS[motif.difficulty]
                  }`}
                >
                  {motif.difficulty}
                </div>
              </div>
              {selectedId === motif.id && (
                <ChevronRight className="w-4 h-4 ml-auto text-accent-gold flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main className="flex-1 overflow-y-auto p-6">
        <MotifDetail motif={selected} />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MotifDetail
// ---------------------------------------------------------------------------

function MotifDetail({ motif }: { motif: Motif }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-accent-gold/10 text-accent-gold`}
          >
            {motif.icon}
          </span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{motif.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xs capitalize px-2 py-0.5 rounded font-medium ${
                  DIFFICULTY_COLORS[motif.difficulty]
                }`}
              >
                {motif.difficulty}
              </span>
              <span className="text-xs text-text-muted capitalize">{motif.category}</span>
            </div>
          </div>
        </div>
        <p className="text-lg text-text-secondary italic">{motif.tagline}</p>
      </div>

      {/* Definition */}
      <section className="bg-bg-secondary rounded-xl p-5 border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          What It Is
        </h3>
        <p className="text-text-primary leading-relaxed">{motif.definition}</p>
      </section>

      {/* Board + How to Spot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Example position */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Example Position
          </h3>
          <div className="rounded-xl overflow-hidden border border-border-subtle">
            <Chessboard
              fen={motif.example.fen}
              orientation={motif.example.side}
              interactive={false}
            />
          </div>
          <p className="text-sm text-text-secondary bg-bg-secondary rounded-lg p-3 border border-border-subtle">
            {motif.example.caption}
          </p>
        </div>

        {/* How to spot */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            How to Spot It
          </h3>
          <ul className="space-y-3">
            {motif.howToSpot.map((tip, i) => (
              <li
                key={i}
                className="flex gap-3 bg-bg-secondary rounded-lg p-3 border border-border-subtle"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-text-primary leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Idea */}
      <section className="bg-accent-gold/5 border border-accent-gold/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider mb-3">
          The Key Idea
        </h3>
        <p className="text-text-primary leading-relaxed">{motif.keyIdea}</p>
      </section>

      {/* Practice CTA */}
      <section className="flex items-center justify-between bg-bg-secondary rounded-xl p-5 border border-border-subtle">
        <div>
          <p className="font-semibold text-text-primary">Ready to practice?</p>
          <p className="text-sm text-text-muted mt-0.5">
            Drill {motif.name.toLowerCase()} puzzles with increasing difficulty.
          </p>
        </div>
        <a
          href={`/tactics?theme=${motif.practiceTheme}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-gold text-bg-primary font-semibold text-sm hover:bg-accent-gold/90 transition-colors"
        >
          Practice {motif.name}
          <ChevronRight className="w-4 h-4" />
        </a>
      </section>
    </div>
  );
}
