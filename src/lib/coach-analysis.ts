import { Chess } from "chess.js";
import { detectGamePhase, parsePGN, type GamePhase } from "@/lib/chess-engine";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MoveVerdict =
  | "brilliant"
  | "great"
  | "good"
  | "interesting"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface AnalyzedMove {
  moveNumber: number;
  isWhiteMove: boolean;
  san: string;
  fen: string;
  evalBefore: number;
  evalAfter: number;
  evalDrop: number;
  bestMoveSan: string;
  bestMoveUci: string;
  classification: MoveVerdict;
  verdictLabel: string;
  humanExplanation: string;
  thinkingProcess: string;
  phase: GamePhase;
  isPlayerMove: boolean;
}

export interface GameSummary {
  result: string;
  opening: string;
  accuracy: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  avgCentipawnLoss: number;
  biggestLesson: string;
  strengths: string;
  weaknesses: string;
  coachSummary: string;
}

export type CriticalMomentType =
  | "first_mistake"
  | "biggest_blunder"
  | "missed_tactic"
  | "turning_point"
  | "best_move"
  | "opening_departure"
  | "endgame_conversion"
  | "defensive_resource";

export interface CriticalMoment {
  type: CriticalMomentType;
  moveIndex: number;
  moveNumber: number;
  san: string;
  fen: string;
  title: string;
  description: string;
  severity: number;
  evalSwing: number;
}

export interface TrainingTask {
  category: string;
  title: string;
  description: string;
  priority: number;
  moveNumber: number;
}

export interface AnalyzedGame {
  moves: AnalyzedMove[];
  summary: GameSummary;
  criticalMoments: CriticalMoment[];
  trainingTasks: TrainingTask[];
}

// ─── Piece & Square Constants ──────────────────────────────────────────────────

const PIECE_VAL: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
};

const CENTER = ["d4", "e4", "d5", "e5"];
const EXTENDED_CENTER = [
  "c3", "d3", "e3", "f3", "c4", "f4",
  "c5", "f5", "c6", "d6", "e6", "f6",
];
const W_BACK = ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"];
const B_BACK = ["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"];

const PIECE_NAME: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

const VERDICT_LABEL: Record<MoveVerdict, string> = {
  brilliant: "Brilliant!",
  great: "Great move",
  good: "Good move",
  interesting: "Interesting",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder!",
};

// ─── Heuristic Evaluation (centipawns, positive = white advantage) ─────────────

function evaluatePosition(fen: string): number {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return chess.turn() === "w" ? -9999 : 9999;
  if (chess.isDraw()) return 0;

  const board = chess.board();
  let score = 0;
  let wBishops = 0;
  let bBishops = 0;
  const wPawnFiles: number[] = [];
  const bPawnFiles: number[] = [];
  let wKingFile = 4;
  let wKingRow = 7;
  let bKingFile = 4;
  let bKingRow = 0;
  let wDevMinors = 0;
  let bDevMinors = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const pc = board[row][col];
      if (!pc) continue;
      const sign = pc.color === "w" ? 1 : -1;
      score += sign * (PIECE_VAL[pc.type] ?? 0);

      if (pc.type === "b") {
        if (pc.color === "w") wBishops++;
        else bBishops++;
      }
      if (pc.type === "p") {
        (pc.color === "w" ? wPawnFiles : bPawnFiles).push(col);
      }
      if (pc.type === "k") {
        if (pc.color === "w") { wKingFile = col; wKingRow = row; }
        else { bKingFile = col; bKingRow = row; }
      }

      const sq = pc.square;
      if (CENTER.includes(sq)) {
        score += sign * (pc.type === "p" ? 30 : 20);
      } else if (EXTENDED_CENTER.includes(sq)) {
        score += sign * 10;
      }

      if (pc.type === "n" || pc.type === "b") {
        const onBack = pc.color === "w" ? W_BACK.includes(sq) : B_BACK.includes(sq);
        if (!onBack) {
          if (pc.color === "w") wDevMinors++;
          else bDevMinors++;
        }
      }
    }
  }

  if (wBishops >= 2) score += 50;
  if (bBishops >= 2) score -= 50;

  const phase = detectGamePhase(fen);
  if (phase === "opening") {
    score += (wDevMinors - bDevMinors) * 18;
  }

  score += pawnStructureScore(wPawnFiles, bPawnFiles);
  score += kingSafetyScore(board, wKingFile, wKingRow, "w");
  score -= kingSafetyScore(board, bKingFile, bKingRow, "b");

  const mobility = chess.moves().length;
  score += (chess.turn() === "w" ? 1 : -1) * mobility * 2;
  if (chess.isCheck()) score += chess.turn() === "w" ? -15 : 15;

  return score;
}

function pawnStructureScore(wFiles: number[], bFiles: number[]): number {
  let s = 0;
  const wCounts = countByFile(wFiles);
  const bCounts = countByFile(bFiles);

  for (const c of Array.from(wCounts.values())) {
    if (c > 1) s -= 20 * (c - 1);
  }
  for (const c of Array.from(bCounts.values())) {
    if (c > 1) s += 20 * (c - 1);
  }

  for (const f of Array.from(wCounts.keys())) {
    if (!wFiles.some(p => p === f - 1 || p === f + 1)) s -= 15;
  }
  for (const f of Array.from(bCounts.keys())) {
    if (!bFiles.some(p => p === f - 1 || p === f + 1)) s += 15;
  }

  for (const f of wFiles) {
    if (!bFiles.some(bf => Math.abs(bf - f) <= 1)) s += 30;
  }
  for (const f of bFiles) {
    if (!wFiles.some(wf => Math.abs(wf - f) <= 1)) s -= 30;
  }

  return s;
}

function countByFile(files: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const f of files) m.set(f, (m.get(f) || 0) + 1);
  return m;
}

function kingSafetyScore(
  board: ReturnType<Chess["board"]>,
  kFile: number,
  kRow: number,
  color: "w" | "b",
): number {
  let s = 0;
  const shieldRow = color === "w" ? kRow - 1 : kRow + 1;
  if (shieldRow >= 0 && shieldRow < 8) {
    for (let f = Math.max(0, kFile - 1); f <= Math.min(7, kFile + 1); f++) {
      const p = board[shieldRow][f];
      if (p && p.type === "p" && p.color === color) s += 15;
    }
  }
  const isCastledRank = color === "w" ? kRow === 7 : kRow === 0;
  if (isCastledRank && (kFile >= 6 || kFile <= 1)) s += 25;
  return s;
}

// ─── 1-Ply Best Move Search ────────────────────────────────────────────────────

interface BestMoveResult {
  san: string;
  uci: string;
  eval: number;
}

function findBestMove(fen: string): BestMoveResult {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) {
    return { san: "", uci: "", eval: evaluatePosition(fen) };
  }

  const maximize = chess.turn() === "w";
  let bestSan = legal[0].san;
  let bestUci = legal[0].from + legal[0].to + (legal[0].promotion ?? "");
  let bestEval = maximize ? -Infinity : Infinity;

  for (const m of legal) {
    chess.move(m.san);
    const e = evaluatePosition(chess.fen());
    chess.undo();
    if (maximize ? e > bestEval : e < bestEval) {
      bestEval = e;
      bestSan = m.san;
      bestUci = m.from + m.to + (m.promotion ?? "");
    }
  }

  return { san: bestSan, uci: bestUci, eval: bestEval };
}

// ─── Extended Move Classification ──────────────────────────────────────────────

function classifyExtended(
  cpLoss: number,
  evalGain: number,
  playedSan: string,
  bestSan: string,
  isCapture: boolean,
): MoveVerdict {
  if (evalGain > 150 && playedSan === bestSan) return "brilliant";
  if (isCapture && cpLoss > 10 && cpLoss < 50) return "interesting";
  if (cpLoss >= 200) return "blunder";
  if (cpLoss >= 100) return "mistake";
  if (cpLoss >= 50) return "inaccuracy";
  if (cpLoss < 10 || playedSan === bestSan) return "great";
  return "good";
}

// ─── Move Description Helper ───────────────────────────────────────────────────

function describeMoveAction(
  san: string,
  piece: string,
  captured: boolean,
  flags: string,
): string {
  if (flags.includes("k")) return "castling kingside";
  if (flags.includes("q")) return "castling queenside";
  const name = PIECE_NAME[piece] ?? "piece";
  const target = san.replace(/[+#x=NBRQK]/g, "").slice(-2);
  if (captured) return `capturing on ${target} with the ${name}`;
  if (piece === "p") return `pushing the pawn to ${target}`;
  return `moving the ${name} to ${target}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Coaching Commentary Generation ────────────────────────────────────────────

function generateExplanation(
  cls: MoveVerdict,
  desc: string,
  phase: GamePhase,
  bestSan: string,
  playedSan: string,
  cpLoss: number,
  isCapture: boolean,
  isCastle: boolean,
  isDev: boolean,
  isCheck: boolean,
  idx: number,
): string {
  const D = cap(desc);

  switch (cls) {
    case "brilliant": {
      const o = [
        `Outstanding find! ${D} is an exceptional move that most players would miss.`,
        `Brilliant! ${D} dramatically shifts the balance in your favor.`,
        `Impressive — ${desc} demonstrates deep understanding of the position.`,
      ];
      const s = o[idx % o.length];
      if (isCapture) return s + " This wins material while seizing the initiative.";
      if (isCheck) return s + " The check creates decisive threats that are hard to meet.";
      return s + " This is a top-level resource that changes the character of the game.";
    }
    case "great": {
      const o = [
        `Well played. ${D} is the strongest continuation here.`,
        `Excellent choice — ${desc} matches the position's demands precisely.`,
        `Strong play. ${D} keeps you firmly in control of the game.`,
        `Good eye — ${desc} is exactly what this position calls for.`,
      ];
      const s = o[idx % o.length];
      if (isCastle) return s + " Getting the king to safety early is a crucial priority.";
      if (isDev && phase === "opening") return s + " Rapid piece development gives you a lasting initiative.";
      if (isCapture) return s + " This exchange is favorable for your position.";
      return s;
    }
    case "good": {
      const o = [
        `${D} is a solid practical choice that keeps the game on track.`,
        `Reasonable continuation. ${D} maintains the balance without creating weaknesses.`,
        `A decent move — ${desc} doesn't create any problems for your position.`,
        `${D} is fine here, though ${bestSan} was slightly more precise.`,
      ];
      const s = o[idx % o.length];
      if (bestSan !== playedSan) {
        return s + ` ${bestSan} was marginally better, but this is a sound practical decision.`;
      }
      return s;
    }
    case "interesting": {
      const o = [
        `Provocative! ${D} complicates the position in an unusual way.`,
        `A creative choice — ${desc} isn't strictly best, but it sets real problems for your opponent.`,
        `${D} sacrifices a small edge for dynamic play and practical chances.`,
      ];
      return o[idx % o.length] + " The position becomes harder for both sides to navigate.";
    }
    case "inaccuracy": {
      const o = [
        `${D} is slightly off the mark here.`,
        `Not quite — ${desc} gives your opponent a small but real edge.`,
        `A minor slip. ${D} misses a subtlety in the position.`,
        `${D} is tempting, but there was something more precise available.`,
      ];
      return o[idx % o.length] + ` ${bestSan} was more accurate, addressing the position's needs more directly.`;
    }
    case "mistake": {
      const o = [
        `${D} is a clear error that shifts the balance significantly.`,
        `This is where things go wrong — ${desc} overlooks a key detail in the position.`,
        `A costly move. ${D} hands your opponent the initiative.`,
        `${D} loses significant ground — the position was holdable before this.`,
      ];
      return o[idx % o.length] + ` ${bestSan} was necessary to keep the balance.`;
    }
    case "blunder": {
      const o = [
        `A serious mistake! ${D} throws away your position.`,
        `Critical error — ${desc} misses a decisive threat.`,
        `This changes everything. ${D} is a game-altering blunder.`,
        `${D} is a painful oversight that fundamentally shifts the evaluation.`,
      ];
      return o[idx % o.length] + ` ${bestSan} was essential — the position demanded careful attention to tactics.`;
    }
  }
}

function generateThinking(
  cls: MoveVerdict,
  phase: GamePhase,
  bestSan: string,
  playedSan: string,
  isCapture: boolean,
  isDev: boolean,
  isCastle: boolean,
  idx: number,
): string {
  const isGood =
    cls === "brilliant" || cls === "great" || cls === "good" || cls === "interesting";

  if (isGood) {
    const phaseGoal =
      phase === "opening"
        ? "development and center control"
        : phase === "endgame"
          ? "king activity and pawn promotion"
          : "piece coordination and tactical opportunities";
    const g = [
      `You correctly prioritized ${phaseGoal}. Keep applying this pattern in similar positions.`,
      `Good decision-making — you identified the key feature of this position and acted on it.`,
      `Your move shows solid understanding of ${phase} principles. This kind of play wins games.`,
      `The position required ${isDev ? "active development" : isCastle ? "king safety" : isCapture ? "the right exchange" : "improving your setup"}, and you delivered.`,
    ];
    return g[idx % g.length];
  }

  const intro = [
    `The key candidates here were ${bestSan} and ${playedSan}.`,
    `Before committing, compare ${playedSan} with ${bestSan} carefully.`,
    `A stronger player would weigh ${bestSan} against ${playedSan} in this position.`,
  ];

  if (cls === "blunder") {
    const tip = [
      `Before every move, ask yourself: "What is my opponent threatening?" This one habit catches most blunders.`,
      `Check all captures and checks for both sides before committing to any move. This simple discipline prevents most game-losing errors.`,
      `Train tactical pattern recognition — most blunders come from missing basic motifs like forks, pins, and discovered attacks.`,
    ];
    return intro[idx % intro.length] + " " + tip[idx % tip.length];
  }

  if (cls === "mistake") {
    const need =
      phase === "opening"
        ? "rapid development and center presence"
        : phase === "endgame"
          ? "king activation and pawn advancement"
          : "piece harmony and prophylactic thinking";
    const tip = [
      `${bestSan} was stronger because it addresses the position's main need: ${need}.`,
      `The position called for patience here. Improve your worst-placed piece before making committal decisions.`,
      `Think about your opponent's best response after each candidate move — this discipline catches most mistakes.`,
    ];
    return intro[idx % intro.length] + " " + tip[idx % tip.length];
  }

  const tip = [
    `${bestSan} was a small improvement — the difference is subtle but accumulates over the course of the game.`,
    `Look for moves that accomplish multiple goals at once. ${bestSan} does this better than ${playedSan}.`,
    `In these positions, precision matters. Compare how each candidate restricts your opponent's options.`,
  ];
  return intro[idx % intro.length] + " " + tip[idx % tip.length];
}

// ─── Critical Moment Detection ─────────────────────────────────────────────────

function momentSeverity(type: CriticalMomentType, swing: number): number {
  if (type === "best_move") return 1;
  if (type === "biggest_blunder") return 10;
  if (swing >= 300) return 9;
  if (swing >= 200) return 8;
  if (swing >= 100) return 6;
  if (type === "first_mistake" || type === "missed_tactic") return 7;
  if (type === "turning_point") return 5;
  if (swing >= 50) return 4;
  return 3;
}

const MOMENT_TITLES: Record<CriticalMomentType, string> = {
  first_mistake: "First Mistake",
  biggest_blunder: "Biggest Blunder",
  missed_tactic: "Missed Tactic",
  turning_point: "Turning Point",
  best_move: "Best Move",
  opening_departure: "Opening Departure",
  endgame_conversion: "Endgame Error",
  defensive_resource: "Defensive Resource",
};

function detectCriticalMoments(
  moves: AnalyzedMove[],
  userColor: "white" | "black",
): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  const playerMoves = moves.filter(m => m.isPlayerMove);

  const firstError = playerMoves.find(
    m => m.classification === "mistake" || m.classification === "blunder",
  );
  if (firstError) {
    const swing = firstError.evalDrop;
    moments.push({
      type: "first_mistake",
      moveIndex: moves.indexOf(firstError),
      moveNumber: firstError.moveNumber,
      san: firstError.san,
      fen: firstError.fen,
      title: MOMENT_TITLES.first_mistake,
      description: `Your first significant error came on move ${firstError.moveNumber}. This is where the game started to slip away.`,
      severity: momentSeverity("first_mistake", swing),
      evalSwing: swing,
    });
  }

  const blunders = playerMoves.filter(m => m.classification === "blunder");
  if (blunders.length > 0) {
    const worst = blunders.reduce((a, b) => (a.evalDrop > b.evalDrop ? a : b));
    if (!firstError || worst !== firstError) {
      moments.push({
        type: "biggest_blunder",
        moveIndex: moves.indexOf(worst),
        moveNumber: worst.moveNumber,
        san: worst.san,
        fen: worst.fen,
        title: MOMENT_TITLES.biggest_blunder,
        description: `The biggest blunder of the game — ${worst.san} lost approximately ${Math.round(worst.evalDrop)} centipawns.`,
        severity: 10,
        evalSwing: worst.evalDrop,
      });
    }
  }

  for (let i = 1; i < moves.length; i++) {
    const prev = moves[i - 1];
    const curr = moves[i];
    const crossed =
      (prev.evalAfter > 50 && curr.evalAfter < -50) ||
      (prev.evalAfter < -50 && curr.evalAfter > 50);
    if (crossed) {
      const from = prev.evalAfter > 0 ? "White" : "Black";
      const to = curr.evalAfter > 0 ? "White" : "Black";
      const swing = Math.abs(curr.evalAfter - prev.evalAfter);
      moments.push({
        type: "turning_point",
        moveIndex: i,
        moveNumber: curr.moveNumber,
        san: curr.san,
        fen: curr.fen,
        title: MOMENT_TITLES.turning_point,
        description: `The game's direction changed here. The advantage swung from ${from} to ${to}.`,
        severity: momentSeverity("turning_point", swing),
        evalSwing: swing,
      });
      break;
    }
  }

  const greatMoves = playerMoves.filter(
    m => m.classification === "brilliant" || m.classification === "great",
  );
  if (greatMoves.length > 0) {
    const bestPlayer = greatMoves.reduce((a, b) => {
      const aGain = a.isWhiteMove ? a.evalAfter - a.evalBefore : a.evalBefore - a.evalAfter;
      const bGain = b.isWhiteMove ? b.evalAfter - b.evalBefore : b.evalBefore - b.evalAfter;
      return aGain > bGain ? a : b;
    });
    moments.push({
      type: "best_move",
      moveIndex: moves.indexOf(bestPlayer),
      moveNumber: bestPlayer.moveNumber,
      san: bestPlayer.san,
      fen: bestPlayer.fen,
      title: MOMENT_TITLES.best_move,
      description: `Your best moment — ${bestPlayer.san} was a strong find that demonstrates real skill.`,
      severity: 1,
      evalSwing: 0,
    });
  }

  const openingDeparture = playerMoves.find(
    m =>
      m.phase === "opening" &&
      (m.classification === "inaccuracy" ||
        m.classification === "mistake" ||
        m.classification === "blunder"),
  );
  if (openingDeparture) {
    moments.push({
      type: "opening_departure",
      moveIndex: moves.indexOf(openingDeparture),
      moveNumber: openingDeparture.moveNumber,
      san: openingDeparture.san,
      fen: openingDeparture.fen,
      title: MOMENT_TITLES.opening_departure,
      description: `You left the good path in the opening with ${openingDeparture.san}. Study this line to avoid similar pitfalls.`,
      severity: momentSeverity("opening_departure", openingDeparture.evalDrop),
      evalSwing: openingDeparture.evalDrop,
    });
  }

  const missedTactic = playerMoves.find(
    m =>
      (m.classification === "blunder" || m.classification === "mistake") &&
      (m.bestMoveSan.includes("x") ||
        m.bestMoveSan.includes("+") ||
        m.bestMoveSan.includes("#")),
  );
  if (missedTactic) {
    moments.push({
      type: "missed_tactic",
      moveIndex: moves.indexOf(missedTactic),
      moveNumber: missedTactic.moveNumber,
      san: missedTactic.san,
      fen: missedTactic.fen,
      title: MOMENT_TITLES.missed_tactic,
      description: `A tactical opportunity was missed here: ${missedTactic.bestMoveSan}. Pattern recognition training would help spot these.`,
      severity: momentSeverity("missed_tactic", missedTactic.evalDrop),
      evalSwing: missedTactic.evalDrop,
    });
  }

  const endgameConversion = playerMoves.find(
    m => m.phase === "endgame" && (m.classification === "mistake" || m.classification === "blunder"),
  );
  if (endgameConversion) {
    moments.push({
      type: "endgame_conversion",
      moveIndex: moves.indexOf(endgameConversion),
      moveNumber: endgameConversion.moveNumber,
      san: endgameConversion.san,
      fen: endgameConversion.fen,
      title: MOMENT_TITLES.endgame_conversion,
      description: `An endgame error on move ${endgameConversion.moveNumber}. Precise technique is critical in simplified positions.`,
      severity: momentSeverity("endgame_conversion", endgameConversion.evalDrop),
      evalSwing: endgameConversion.evalDrop,
    });
  }

  return moments.sort((a, b) => a.moveIndex - b.moveIndex);
}

// ─── Training Task Generation ──────────────────────────────────────────────────

function generateTrainingTasks(
  moves: AnalyzedMove[],
  headers: Record<string, string>,
  userColor: "white" | "black",
): TrainingTask[] {
  const tasks: TrainingTask[] = [];
  const playerMoves = moves.filter(m => m.isPlayerMove);
  const errors = playerMoves.filter(m =>
    m.classification === "inaccuracy" ||
    m.classification === "mistake" ||
    m.classification === "blunder",
  );

  const openingErrs = errors.filter(m => m.phase === "opening");
  const middlegameErrs = errors.filter(m => m.phase === "middlegame");
  const endgameErrs = errors.filter(m => m.phase === "endgame");
  const tacticalMissed = errors.filter(
    m =>
      m.bestMoveSan.includes("x") ||
      m.bestMoveSan.includes("+") ||
      m.bestMoveSan.includes("#"),
  );
  const blunderList = playerMoves.filter(m => m.classification === "blunder");

  if (blunderList.length >= 2) {
    const first = blunderList[0];
    tasks.push({
      category: "calculation",
      title: "Blunder-Check Habit",
      description: `You had ${blunderList.length} blunders this game. Before every move, practice the "blunder check": ask what your opponent's strongest response is. This simple habit eliminates most game-losing errors.`,
      priority: 1,
      moveNumber: first.moveNumber,
    });
  }

  if (tacticalMissed.length > 0) {
    const first = tacticalMissed[0];
    tasks.push({
      category: "tactics",
      title: "Tactical Pattern Training",
      description: `You missed ${tacticalMissed.length} tactical opportunit${tacticalMissed.length > 1 ? "ies" : "y"} in this game. Practice puzzle sets focusing on forks, pins, discovered attacks, and back-rank motifs to sharpen your vision.`,
      priority: 2,
      moveNumber: first.moveNumber,
    });
  }

  if (openingErrs.length >= 2) {
    const opening = headers["Opening"] || headers["ECO"] || "your opening";
    tasks.push({
      category: "openings",
      title: `Opening Study: ${opening}`,
      description: `You made ${openingErrs.length} errors in the opening phase. Review the main lines and key ideas of this opening to build a stronger foundation from the start.`,
      priority: 3,
      moveNumber: openingErrs[0].moveNumber,
    });
  }

  if (endgameErrs.length >= 1) {
    tasks.push({
      category: "endgames",
      title: "Endgame Technique Drill",
      description: `You had ${endgameErrs.length} error${endgameErrs.length > 1 ? "s" : ""} in the endgame. Practice fundamental endgame positions — king and pawn endings, rook endings, and basic checkmate patterns.`,
      priority: 4,
      moveNumber: endgameErrs[0].moveNumber,
    });
  }

  if (middlegameErrs.length >= 2) {
    tasks.push({
      category: "strategy",
      title: "Positional Understanding",
      description: `With ${middlegameErrs.length} middlegame errors, focus on strategic concepts: piece activity, pawn structure awareness, and forming a plan. Annotated master games in similar structures will help.`,
      priority: 5,
      moveNumber: middlegameErrs[0].moveNumber,
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      category: "general",
      title: "Maintain Your Level",
      description:
        "Clean game with no major errors. Keep playing and focus on finding the absolute best moves in complex positions to push your rating higher.",
      priority: 10,
      moveNumber: 0,
    });
  }

  return tasks.sort((a, b) => a.priority - b.priority);
}

// ─── Game Summary ──────────────────────────────────────────────────────────────

function buildGameSummary(
  moves: AnalyzedMove[],
  headers: Record<string, string>,
  userColor: "white" | "black",
): GameSummary {
  const playerMoves = moves.filter(m => m.isPlayerMove);
  const inaccuracies = playerMoves.filter(m => m.classification === "inaccuracy").length;
  const mistakes = playerMoves.filter(m => m.classification === "mistake").length;
  const blunders = playerMoves.filter(m => m.classification === "blunder").length;

  const totalCpLoss = playerMoves.reduce((sum, m) => sum + m.evalDrop, 0);
  const avgCpLoss = playerMoves.length > 0 ? totalCpLoss / playerMoves.length : 0;
  const accuracy = Math.round(
    Math.max(0, Math.min(100, 100 * (1 - avgCpLoss / 250))),
  );

  const result = headers["Result"] || "*";
  const opening = headers["Opening"] || headers["ECO"] || "Unknown Opening";

  const greatCount = playerMoves.filter(
    m => m.classification === "great" || m.classification === "brilliant",
  ).length;
  const greatRatio = playerMoves.length > 0 ? greatCount / playerMoves.length : 0;

  let strengths: string;
  if (greatRatio > 0.6) {
    strengths =
      "Excellent accuracy — the majority of your moves matched the engine's top choice.";
  } else if (greatRatio > 0.4) {
    strengths =
      "Solid decision-making on most moves, showing good positional awareness.";
  } else {
    strengths = "Consistent effort throughout the game.";
  }

  const openingMoves = playerMoves.filter(m => m.phase === "opening");
  const openingClean =
    openingMoves.length > 3 &&
    openingMoves.every(
      m =>
        m.classification === "great" ||
        m.classification === "good" ||
        m.classification === "brilliant",
    );
  if (openingClean) {
    strengths =
      "Strong opening preparation — you navigated the opening phase accurately.";
  }

  let weaknesses: string;
  if (blunders >= 2) {
    weaknesses =
      "Tactical oversight is the biggest issue. Multiple blunders indicate a need for systematic blunder-checking.";
  } else if (mistakes >= 3) {
    weaknesses =
      "Accumulation of errors across the game. Focus on candidate-move discipline before committing.";
  } else if (inaccuracies >= 4) {
    weaknesses =
      "Several small inaccuracies added up. Work on precision when evaluating subtle differences between candidates.";
  } else {
    weaknesses = "No glaring weaknesses — keep sharpening your play.";
  }

  let biggestLesson: string;
  const firstBigError = playerMoves.find(
    m => m.classification === "blunder" || m.classification === "mistake",
  );
  if (firstBigError) {
    if (firstBigError.phase === "opening") {
      biggestLesson =
        "Review your opening preparation — knowing the key ideas would have prevented the early trouble.";
    } else if (firstBigError.phase === "endgame") {
      biggestLesson =
        "The endgame was the critical phase. Study similar endgame positions to improve conversion technique.";
    } else {
      biggestLesson =
        "Middlegame decision-making was the turning point. Focus on evaluating positions thoroughly before committing to a plan.";
    }
  } else {
    biggestLesson =
      "No major errors to highlight. Challenge yourself with harder opponents or longer time controls to find new growth areas.";
  }

  let coachSummary: string;
  if (accuracy >= 90) {
    coachSummary = `An excellent game at ${accuracy}% accuracy — strong control throughout. Focus on the few moments you can tighten up.`;
  } else if (accuracy >= 70) {
    coachSummary = `A solid performance at ${accuracy}% accuracy, but a few key moments cost you. Review the critical positions to level up.`;
  } else if (accuracy >= 50) {
    coachSummary = `At ${accuracy}% accuracy, there's meaningful room for improvement. The good news: your mistakes follow trainable patterns.`;
  } else {
    coachSummary = `A tough game at ${accuracy}% accuracy. Don't be discouraged — focus on the training tasks below, and these patterns will improve quickly.`;
  }

  return {
    result,
    opening,
    accuracy,
    inaccuracies,
    mistakes,
    blunders,
    avgCentipawnLoss: Math.round(avgCpLoss),
    biggestLesson,
    strengths,
    weaknesses,
    coachSummary,
  };
}

// ─── Main Analysis Pipeline ────────────────────────────────────────────────────

export function analyzeGame(
  pgn: string,
  userColor: string,
): AnalyzedGame {
  const color: "white" | "black" = userColor === "black" ? "black" : "white";
  const { headers } = parsePGN(pgn);

  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return {
      moves: [],
      summary: {
        result: "*",
        opening: "Unknown",
        accuracy: 0,
        inaccuracies: 0,
        mistakes: 0,
        blunders: 0,
        avgCentipawnLoss: 0,
        biggestLesson: "Unable to analyze — the PGN could not be parsed.",
        strengths: "",
        weaknesses: "",
        coachSummary:
          "The game data appears to be invalid. Please check the PGN format and try again.",
      },
      criticalMoments: [],
      trainingTasks: [],
    };
  }

  const history = game.history({ verbose: true });
  const replay = new Chess();
  const analyzedMoves: AnalyzedMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const fenBefore = replay.fen();
    const evalBefore = evaluatePosition(fenBefore);
    const best = findBestMove(fenBefore);

    const move = history[i];
    replay.move(move.san);
    const fenAfter = replay.fen();
    const evalAfter = evaluatePosition(fenAfter);

    const isWhite = move.color === "w";
    const rawCpLoss = isWhite ? best.eval - evalAfter : evalAfter - best.eval;
    const cpLoss = Math.max(0, rawCpLoss);
    const evalGain = isWhite
      ? evalAfter - evalBefore
      : evalBefore - evalAfter;

    const phase = detectGamePhase(fenBefore);
    const isPlayerMove = color === "white" ? isWhite : !isWhite;

    const isCastle = move.flags.includes("k") || move.flags.includes("q");
    const isDev =
      (move.piece === "n" || move.piece === "b") &&
      (isWhite ? W_BACK.includes(move.from) : B_BACK.includes(move.from));
    const desc = describeMoveAction(
      move.san,
      move.piece,
      !!move.captured,
      move.flags,
    );
    const cls = classifyExtended(
      cpLoss,
      evalGain,
      move.san,
      best.san,
      !!move.captured,
    );

    analyzedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      isWhiteMove: isWhite,
      san: move.san,
      fen: fenAfter,
      evalBefore,
      evalAfter,
      evalDrop: cpLoss,
      bestMoveSan: best.san,
      bestMoveUci: best.uci,
      classification: cls,
      verdictLabel: VERDICT_LABEL[cls],
      humanExplanation: generateExplanation(
        cls, desc, phase, best.san, move.san, cpLoss,
        !!move.captured, isCastle, isDev,
        move.san.includes("+") || move.san.includes("#"),
        i,
      ),
      thinkingProcess: generateThinking(
        cls, phase, best.san, move.san,
        !!move.captured, isDev, isCastle, i,
      ),
      phase,
      isPlayerMove,
    });
  }

  const criticalMoments = detectCriticalMoments(analyzedMoves, color);
  const trainingTasks = generateTrainingTasks(analyzedMoves, headers, color);
  const summary = buildGameSummary(analyzedMoves, headers, color);

  return { moves: analyzedMoves, summary, criticalMoments, trainingTasks };
}
