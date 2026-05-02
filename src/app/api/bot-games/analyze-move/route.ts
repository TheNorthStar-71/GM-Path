/**
 * POST /api/bot-games/analyze-move
 *
 * Real-time per-move analysis endpoint.
 * Takes a FEN + the move just played, returns:
 *   - evaluation (centipawns)
 *   - best move (SAN + UCI)
 *   - move classification
 *   - coaching tip
 *   - threat warning
 *
 * This runs the same heuristic engine as the client-side coach.
 * Future: swap evaluatePosition/findBestMove with Stockfish WASM.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeGame } from "@/lib/coach-analysis";
import { Chess } from "chess.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoveClass =
  | "brilliant" | "great" | "good" | "interesting"
  | "inaccuracy" | "mistake" | "blunder";

// ─── Inline fast evaluation (mirrors coach-analysis but no DB) ────────────────

const PIECE_VALS: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
};
const CENTER_SQS = new Set(["d4", "e4", "d5", "e5"]);
const EXT_CENTER = new Set(["c3", "d3", "e3", "f3", "c4", "f4", "c5", "f5", "c6", "d6", "e6", "f6"]);
const W_BACK = new Set(["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]);
const B_BACK = new Set(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);

function evalPosition(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -9000 : 9000;
  if (chess.isDraw()) return 0;
  const board = chess.board();
  let score = 0, wB = 0, bB = 0, wDev = 0, bDev = 0;
  const wPF: number[] = [], bPF: number[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const pc = board[r][c];
      if (!pc) continue;
      const s = pc.color === "w" ? 1 : -1;
      score += s * (PIECE_VALS[pc.type] ?? 0);
      if (pc.type === "b") { if (pc.color === "w") wB++; else bB++; }
      if (pc.type === "p") { if (pc.color === "w") wPF.push(c); else bPF.push(c); }
      if (CENTER_SQS.has(pc.square)) score += s * (pc.type === "p" ? 30 : 20);
      else if (EXT_CENTER.has(pc.square)) score += s * 10;
      if ((pc.type === "n" || pc.type === "b") && !(pc.color === "w" ? W_BACK : B_BACK).has(pc.square)) {
        if (pc.color === "w") wDev++; else bDev++;
      }
    }
  }
  if (wB >= 2) score += 50;
  if (bB >= 2) score -= 50;
  score += (wDev - bDev) * 15;
  const wFC = new Map<number, number>(), bFC = new Map<number, number>();
  for (const f of wPF) wFC.set(f, (wFC.get(f) ?? 0) + 1);
  for (const f of bPF) bFC.set(f, (bFC.get(f) ?? 0) + 1);
  for (const cv of Array.from(wFC.values())) if (cv > 1) score -= 20 * (cv - 1);
  for (const cv of Array.from(bFC.values())) if (cv > 1) score += 20 * (cv - 1);
  score += (chess.turn() === "w" ? 1 : -1) * chess.moves().length * 2;
  if (chess.isCheck()) score += chess.turn() === "w" ? -15 : 15;
  return score;
}

function findBestMove(chess: Chess): { san: string; uci: string; eval: number } {
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) return { san: "", uci: "", eval: evalPosition(chess) };
  const maximize = chess.turn() === "w";
  let bestSan = legal[0].san;
  let bestUci = legal[0].from + legal[0].to + (legal[0].promotion ?? "");
  let bestEval = maximize ? -Infinity : Infinity;
  for (const m of legal) {
    chess.move(m.san);
    const e = evalPosition(chess);
    chess.undo();
    if (maximize ? e > bestEval : e < bestEval) {
      bestEval = e;
      bestSan = m.san;
      bestUci = m.from + m.to + (m.promotion ?? "");
    }
  }
  return { san: bestSan, uci: bestUci, eval: bestEval };
}

function classifyMove(cpLoss: number, evalGain: number, played: string, best: string, isCapture: boolean): MoveClass {
  if (evalGain > 150 && played === best) return "brilliant";
  if (isCapture && cpLoss > 10 && cpLoss < 50) return "interesting";
  if (cpLoss >= 200) return "blunder";
  if (cpLoss >= 100) return "mistake";
  if (cpLoss >= 50) return "inaccuracy";
  if (cpLoss < 10 || played === best) return "great";
  return "good";
}

function getCoachTip(cls: MoveClass, bestSan: string, playedSan: string): string {
  const tips: Record<MoveClass, string> = {
    brilliant: "Outstanding find! This is a top-level move that creates a decisive advantage.",
    great: "Excellent play! You found the strongest continuation.",
    good: "Solid move that keeps the game on track.",
    interesting: "Creative choice — this complicates the position in an unconventional way.",
    inaccuracy: `Slightly off. ${bestSan !== playedSan ? `${bestSan} was more accurate.` : ""}`,
    mistake: `Costly error. ${bestSan !== playedSan ? `${bestSan} was needed to maintain balance.` : ""}`,
    blunder: `Critical error! Before every move, ask: what is my opponent threatening? ${bestSan !== playedSan ? `${bestSan} was the correct move.` : ""}`,
  };
  return tips[cls];
}

function detectThreats(chess: Chess): string | null {
  if (chess.isCheck()) return "You are in check! Deal with this immediately.";
  const moves = chess.moves({ verbose: true });
  const caps = moves.filter(m => (PIECE_VALS[m.captured ?? ""] ?? 0) >= 300);
  if (caps.length === 0) return null;
  const best = caps.sort((a, b) => (PIECE_VALS[b.captured as string] ?? 0) - (PIECE_VALS[a.captured as string] ?? 0))[0];
  const names: Record<string, string> = { n: "knight", b: "bishop", r: "rook", q: "queen", p: "pawn" };
  return `Opponent can take your ${names[best.captured as string] ?? "piece"} on ${best.to}.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fenBefore, moveSan, userColor } = await req.json();

  if (!fenBefore || !moveSan) {
    return NextResponse.json({ error: "fenBefore and moveSan required" }, { status: 400 });
  }

  try {
    // Reconstruct position before the move
    const chessBefore = new Chess(fenBefore);
    const evalBefore = evalPosition(chessBefore);
    const best = findBestMove(chessBefore);

    // Apply the move
    const result = chessBefore.move(moveSan);
    if (!result) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    const evalAfter = evalPosition(chessBefore);
    const isWhite = result.color === "w";
    const cpLoss = isWhite
      ? Math.max(0, best.eval - evalAfter)
      : Math.max(0, -(best.eval - evalAfter));
    const evalGain = isWhite ? evalAfter - evalBefore : evalBefore - evalAfter;

    const cls = classifyMove(cpLoss, evalGain, result.san, best.san, !!result.captured);
    const tip = getCoachTip(cls, best.san, result.san);
    const threat = detectThreats(chessBefore);

    return NextResponse.json({
      evalBefore,
      evalAfter,
      evalDrop: cpLoss,
      bestMoveSan: best.san,
      bestMoveUci: best.uci,
      classification: cls,
      coachTip: tip,
      threatWarning: threat,
    });
  } catch (err) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
