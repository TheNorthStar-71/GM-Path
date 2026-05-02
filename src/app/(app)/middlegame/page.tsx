"use client";

import { useState } from "react";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Castle,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Target,
  Lightbulb,
  Star,
} from "lucide-react";

const STRUCTURES = [
  {
    name: "Isolated Queen Pawn (IQP)",
    description: "The d4 pawn is isolated — no pawns on c or e files. White has dynamic piece activity but a long-term weakness.",
    fen: "r1bq1rk1/pp2ppbp/2n3p1/3p4/3P4/2N1BN2/PP2BPPP/R2Q1RK1 w - - 0 10",
    plans: ["d4-d5 pawn break", "Kingside attack using piece activity", "Nd5 outpost occupation"],
    forBoth: "Black should trade pieces and target the IQP in the endgame.",
    themes: ["Piece Activity", "Pawn Weakness", "Central Break"],
  },
  {
    name: "Carlsbad Structure",
    description: "Symmetric pawn chains on c-d vs c-d. White typically plays a minority attack on the queenside.",
    fen: "r1bq1rk1/pp1n1ppp/4pn2/2bp4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 8",
    plans: ["Minority attack: b4-b5 to create weaknesses", "Central play with e3-e4", "Kingside activity"],
    forBoth: "Black should play actively in the center or on the kingside before White's minority attack arrives.",
    themes: ["Minority Attack", "Pawn Structure", "Long-term Play"],
  },
  {
    name: "Good vs Bad Bishop",
    description: "When pawns are fixed on one color, the bishop on that color becomes 'bad' — restricted by its own pawns.",
    fen: "r4rk1/pp2bppp/2n1p3/3pP3/3P4/5N2/PP2BPPP/R4RK1 w - - 0 12",
    plans: ["Exploit the bad bishop by playing on its color squares", "Trade off the good bishop to leave opponent with the bad one"],
    forBoth: "The side with the bad bishop should try to exchange it or free its pawns.",
    themes: ["Bishop vs Knight", "Pawn Chain", "Piece Activity"],
  },
  {
    name: "Outpost Control",
    description: "A square in enemy territory that cannot be attacked by pawns is an outpost. Knights are especially strong on outposts.",
    fen: "r1bq1rk1/ppp2ppp/2n2n2/3pp3/4P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6",
    plans: ["Occupy the outpost with a piece (ideally a knight)", "Support the outpost with pawns", "Use the outpost as a springboard for attack"],
    forBoth: "Prevent outpost creation by keeping pawn control over key squares.",
    themes: ["Outpost", "Knight Placement", "Pawn Control"],
  },
  {
    name: "Open File Control",
    description: "An open file (no pawns) is valuable for rooks. Double rooks on an open file to penetrate into enemy territory.",
    fen: "r3r1k1/pp3ppp/2p2n2/3p4/3P4/2P2N2/PP3PPP/R3R1K1 w - - 0 14",
    plans: ["Place rooks on the open file", "Double rooks for maximum pressure", "Use the 7th rank for infiltration"],
    forBoth: "Contest the open file immediately — don't let your opponent dominate it unchallenged.",
    themes: ["Rook Activity", "File Control", "Penetration"],
  },
  {
    name: "Space Advantage",
    description: "Having more space (advanced pawns) gives your pieces more room. The side with less space should seek exchanges or pawn breaks.",
    fen: "r1bqk2r/pp1nbppp/4pn2/2ppP3/3P4/2N2N2/PPP1BPPP/R1BQK2R w KQkq - 0 7",
    plans: ["Use the space to maneuver pieces to better squares", "Restrict opponent's piece activity", "Prepare a pawn break to open the position"],
    forBoth: "The cramped side should seek exchanges and f6 or c5 breaks to relieve pressure.",
    themes: ["Space", "Piece Maneuvers", "Pawn Breaks"],
  },
];

const MODEL_GAMES = [
  { white: "Karpov", black: "Unzicker", year: 1974, structure: "IQP", result: "1-0", lesson: "Masterful IQP play: piece activity before endgame" },
  { white: "Botvinnik", black: "Vidmar", year: 1936, structure: "Carlsbad", result: "1-0", lesson: "Classical minority attack execution" },
  { white: "Fischer", black: "Petrosian", year: 1971, structure: "Good vs Bad Bishop", result: "1-0", lesson: "Exploiting a bad bishop in the middlegame" },
];

export default function MiddlegamePage() {
  const [selectedStructure, setSelectedStructure] = useState(0);
  const [activeTab, setActiveTab] = useState<"structures" | "model_games">("structures");

  const structure = STRUCTURES[selectedStructure];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">Middlegame Strategy</h1>
        <p className="text-text-muted mt-1">
          Pawn structures, strategic plans, and positional understanding
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("structures")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            activeTab === "structures"
              ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
              : "bg-bg-tertiary border-border-subtle text-text-secondary"
          }`}
        >
          <Castle className="w-4 h-4 inline mr-1.5" />
          Pawn Structures
        </button>
        <button
          onClick={() => setActiveTab("model_games")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            activeTab === "model_games"
              ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
              : "bg-bg-tertiary border-border-subtle text-text-secondary"
          }`}
        >
          <Star className="w-4 h-4 inline mr-1.5" />
          Model Games
        </button>
      </div>

      {activeTab === "structures" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Structure list */}
          <div className="space-y-2">
            {STRUCTURES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSelectedStructure(i)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedStructure === i
                    ? "bg-accent-gold/10 border-accent-gold/30"
                    : "bg-bg-card border-border-subtle hover:border-border"
                }`}
              >
                <p className="text-sm font-medium">{s.name}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {s.themes.map((t) => (
                    <span key={t} className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Board + content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h2 className="font-display text-xl font-semibold mb-2">{structure.name}</h2>
              <p className="text-sm text-text-secondary mb-6">{structure.description}</p>

              <div className="flex flex-col md:flex-row gap-6">
                <Chessboard fen={structure.fen} size={360} />

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-accent-gold" />
                      Key Plans
                    </h3>
                    <ul className="space-y-1.5">
                      {structure.plans.map((plan) => (
                        <li key={plan} className="flex items-start gap-2 text-sm text-text-secondary">
                          <ChevronRight className="w-3 h-3 text-accent-gold mt-1 flex-shrink-0" />
                          {plan}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-accent-blue" />
                      For the Other Side
                    </h3>
                    <p className="text-sm text-text-secondary">{structure.forBoth}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {structure.themes.map((t) => (
                      <span key={t} className="badge-gold">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "model_games" && (
        <div className="space-y-3">
          {MODEL_GAMES.map((game) => (
            <div key={`${game.white}-${game.black}-${game.year}`} className="card-hover">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-accent-gold/10">
                  <Star className="w-5 h-5 text-accent-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {game.white} vs {game.black} ({game.year})
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{game.lesson}</p>
                </div>
                <span className="badge-blue">{game.structure}</span>
                <span className="text-sm font-mono text-text-muted">{game.result}</span>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
