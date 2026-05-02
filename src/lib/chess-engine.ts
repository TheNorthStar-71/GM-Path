import { Chess } from "chess.js";

// Classification thresholds (centipawn loss)
const BLUNDER_THRESHOLD = 200;
const MISTAKE_THRESHOLD = 100;
const INACCURACY_THRESHOLD = 50;

export type MoveClassification =
  | "brilliant"
  | "great"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export type MistakeCategory =
  | "tactical_blindness"
  | "calculation_failure"
  | "opening_ignorance"
  | "positional_misunderstanding"
  | "endgame_failure"
  | "time_management"
  | "psychological_tilt"
  | "conversion_failure"
  | "defensive_failure";

export type GamePhase = "opening" | "middlegame" | "endgame";

export interface PositionAnalysis {
  fen: string;
  moveNumber: number;
  isWhiteMove: boolean;
  playedMove: string;
  bestMove: string;
  eval: number;
  bestEval: number;
  classification: MoveClassification;
  evalDrop: number;
  phase: GamePhase;
}

export function classifyMove(evalDrop: number): MoveClassification {
  const drop = Math.abs(evalDrop);
  if (drop >= BLUNDER_THRESHOLD) return "blunder";
  if (drop >= MISTAKE_THRESHOLD) return "mistake";
  if (drop >= INACCURACY_THRESHOLD) return "inaccuracy";
  if (drop < 10) return "great";
  return "good";
}

export function detectGamePhase(fen: string): GamePhase {
  const chess = new Chess(fen);
  const board = chess.board();
  let pieceCount = 0;
  let queenCount = 0;

  for (const row of board) {
    for (const square of row) {
      if (square) {
        pieceCount++;
        if (square.type === "q") queenCount++;
      }
    }
  }

  // Opening: before move 15 with most pieces on board
  const moveNum = parseInt(fen.split(" ")[5] || "1");
  if (moveNum <= 12 && pieceCount >= 28) return "opening";

  // Endgame: few pieces or no queens
  if (pieceCount <= 12 || (queenCount === 0 && pieceCount <= 16))
    return "endgame";

  return "middlegame";
}

export function categorizeMistake(
  analysis: PositionAnalysis,
  context: { phase: GamePhase; timeRemaining?: number }
): MistakeCategory {
  const { phase } = context;

  if (phase === "opening") return "opening_ignorance";
  if (phase === "endgame") return "endgame_failure";

  // If there's a tactical shot missed
  if (analysis.evalDrop >= BLUNDER_THRESHOLD) return "tactical_blindness";

  // Moderate mistakes in middlegame are often positional
  if (phase === "middlegame" && analysis.evalDrop < BLUNDER_THRESHOLD)
    return "positional_misunderstanding";

  // Default
  return "calculation_failure";
}

export function parsePGN(pgn: string): {
  moves: string[];
  headers: Record<string, string>;
} {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    return { moves: [], headers: {} };
  }

  const history = chess.history();
  const headers: Record<string, string> = {};

  // Parse headers from PGN
  const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }

  return { moves: history, headers };
}

export function getFenAfterMoves(moves: string[], upToIndex: number): string {
  const chess = new Chess();
  for (let i = 0; i <= upToIndex && i < moves.length; i++) {
    chess.move(moves[i]);
  }
  return chess.fen();
}

export function getPositionFeatures(fen: string) {
  const chess = new Chess(fen);
  const board = chess.board();

  let whiteMaterial = 0;
  let blackMaterial = 0;
  const pieceValues: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  for (const row of board) {
    for (const sq of row) {
      if (sq) {
        const val = pieceValues[sq.type] || 0;
        if (sq.color === "w") whiteMaterial += val;
        else blackMaterial += val;
      }
    }
  }

  return {
    whiteMaterial,
    blackMaterial,
    materialDiff: whiteMaterial - blackMaterial,
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    legalMoves: chess.moves().length,
    phase: detectGamePhase(fen),
  };
}
