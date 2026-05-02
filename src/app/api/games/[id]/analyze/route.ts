import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Chess } from "chess.js";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Stockfish helper — same implementation as /api/engine but stripped to eval
// ---------------------------------------------------------------------------

interface EvalResult {
  eval: number;    // centipawns from white's perspective
  mate: number | null;
  bestMove: string;
  bestLine: string[];
}

function evalPosition(fen: string, depth: number): Promise<EvalResult> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const initEngine = require("stockfish");
    initEngine().then(
      (engine: { onmessage: (m: string) => void; postMessage: (m: string) => void }) => {
        let evaluation = 0;
        let mate: number | null = null;
        let bestMove = "";
        let bestLine: string[] = [];
        let resolved = false;

        const done = () => {
          if (resolved) return;
          resolved = true;
          resolve({ eval: evaluation, mate, bestMove, bestLine });
        };

        const timeout = setTimeout(() => {
          if (!resolved) engine.postMessage("stop");
        }, 8000);

        engine.onmessage = (msg: string) => {
          if (typeof msg !== "string") return;
          if (msg.startsWith("info") && msg.includes("score")) {
            const cpMatch = msg.match(/score cp (-?\d+)/);
            const mateMatch = msg.match(/score mate (-?\d+)/);
            const pvMatch = msg.match(/ pv (.+?)(?= pv | string |\s*$)/);
            if (cpMatch) { evaluation = parseInt(cpMatch[1]); mate = null; }
            if (mateMatch) { mate = parseInt(mateMatch[1]); evaluation = mate > 0 ? 30000 : -30000; }
            if (pvMatch) bestLine = pvMatch[1].trim().split(" ").filter(Boolean);
          }
          if (msg.startsWith("bestmove")) {
            clearTimeout(timeout);
            bestMove = msg.split(" ")[1] || "";
            done();
          }
        };

        engine.postMessage("uci");
        engine.postMessage("setoption name Skill Level value 20");
        engine.postMessage("ucinewgame");
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${depth}`);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Move classification by centipawn loss
// ---------------------------------------------------------------------------

function classifyMove(cpLoss: number, isMate: boolean): string {
  if (isMate) return "blunder";
  if (cpLoss <= 10) return "great";
  if (cpLoss <= 30) return "good";
  if (cpLoss <= 60) return "inaccuracy";
  if (cpLoss <= 120) return "mistake";
  return "blunder";
}

// Determine game phase by move number
function getPhase(moveNumber: number): string {
  if (moveNumber <= 12) return "opening";
  if (moveNumber <= 30) return "middlegame";
  return "endgame";
}

// Classify mistake category from the chess position context
function getMistakeCategory(cpLoss: number, phase: string): string {
  if (phase === "opening") return "opening_ignorance";
  if (phase === "endgame") return "endgame_failure";
  if (cpLoss > 200) return "tactical_blindness";
  return "positional_misunderstanding";
}

// ---------------------------------------------------------------------------
// POST /api/games/[id]/analyze
// ---------------------------------------------------------------------------

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const gameId = params.id;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, userId: true, pgn: true, engineReviewComplete: true },
  });

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (game.engineReviewComplete) {
    return NextResponse.json({ message: "Already analyzed", cached: true });
  }

  // Parse PGN
  const chess = new Chess();
  try {
    chess.loadPgn(game.pgn);
  } catch {
    return NextResponse.json({ error: "Invalid PGN" }, { status: 400 });
  }

  const history = chess.history({ verbose: true });
  const MAX_POSITIONS = 40;
  const positions = history.slice(0, MAX_POSITIONS);

  // Replay moves and collect FENs before each move
  const chess2 = new Chess();
  const fensBefore: string[] = [];
  for (const move of positions) {
    fensBefore.push(chess2.fen());
    chess2.move(move.san);
  }

  const depth = 12; // balanced: ~1-2s per position at depth 12

  // Analyse sequentially (Vercel 60s limit, ~40 positions × ~1.5s each)
  const annotations: {
    moveNumber: number;
    isWhiteMove: boolean;
    fen: string;
    playedMove: string;
    evalBefore: number;
    evalAfter: number;
    bestMove: string;
    bestLine: string[];
    classification: string;
    isCriticalMoment: boolean;
  }[] = [];

  let totalCpLoss = 0;
  let moveCount = 0;
  const mistakes: {
    moveNumber: number;
    fen: string;
    playedMove: string;
    bestMove: string;
    evalDrop: number;
    category: string;
    phase: string;
  }[] = [];

  for (let i = 0; i < positions.length; i++) {
    const move = positions[i];
    const fenBefore = fensBefore[i];

    // Rebuild FEN after the move
    const tempChess = new Chess(fenBefore);
    tempChess.move(move.san);
    const fenAfter = tempChess.fen();

    const [evalBefore, evalAfter] = await Promise.all([
      evalPosition(fenBefore, depth),
      evalPosition(fenAfter, depth),
    ]);

    // Negate after-eval for the side that just moved
    const isWhiteMove = move.color === "w";
    const evalBeforeCp = isWhiteMove ? evalBefore.eval : -evalBefore.eval;
    const evalAfterCp = isWhiteMove ? evalAfter.eval : -evalAfter.eval;

    // cpLoss from the perspective of the player who just moved
    const cpLoss = Math.max(0, evalBeforeCp - evalAfterCp);
    const classification = classifyMove(cpLoss, evalAfter.mate !== null && evalAfter.mate < 0);

    const isCritical = cpLoss >= 100 || (evalAfter.mate !== null && evalAfter.mate < 0);

    totalCpLoss += cpLoss;
    moveCount++;

    annotations.push({
      moveNumber: Math.ceil((i + 1) / 2),
      isWhiteMove,
      fen: fenBefore,
      playedMove: move.lan,
      evalBefore: evalBefore.eval / 100, // store as pawns
      evalAfter: evalAfter.eval / 100,
      bestMove: evalBefore.bestMove,
      bestLine: evalBefore.bestLine,
      classification,
      isCriticalMoment: isCritical,
    });

    if (classification === "mistake" || classification === "blunder") {
      const phase = getPhase(Math.ceil((i + 1) / 2));
      mistakes.push({
        moveNumber: Math.ceil((i + 1) / 2),
        fen: fenBefore,
        playedMove: move.lan,
        bestMove: evalBefore.bestMove,
        evalDrop: cpLoss / 100,
        category: getMistakeCategory(cpLoss, phase),
        phase,
      });
    }
  }

  const averageCpLoss = moveCount > 0 ? totalCpLoss / moveCount : 0;
  const accuracy = Math.max(0, 100 - averageCpLoss / 10);

  // Write everything to DB in a transaction
  await prisma.$transaction([
    // Delete old annotations for this game
    prisma.gameAnnotation.deleteMany({ where: { gameId } }),
    prisma.gameMistake.deleteMany({ where: { gameId } }),

    // Insert new annotations
    ...annotations.map((a) =>
      prisma.gameAnnotation.create({
        data: {
          gameId,
          moveNumber: a.moveNumber,
          isWhiteMove: a.isWhiteMove,
          fen: a.fen,
          playedMove: a.playedMove,
          engineEval: a.evalAfter,
          bestMove: a.bestMove,
          classification: a.classification,
          isCriticalMoment: a.isCriticalMoment,
        },
      })
    ),

    // Insert mistakes
    ...mistakes.map((m) =>
      prisma.gameMistake.create({
        data: {
          gameId,
          moveNumber: m.moveNumber,
          fen: m.fen,
          playedMove: m.playedMove,
          bestMove: m.bestMove,
          evalDrop: m.evalDrop,
          category: m.category,
          phase: m.phase,
        },
      })
    ),

    // Mark game as engine-reviewed
    prisma.game.update({
      where: { id: gameId },
      data: {
        engineReviewComplete: true,
        averageCentipawnLoss: averageCpLoss / 100,
        accuracy,
      },
    }),
  ]);

  return NextResponse.json({
    message: "Analysis complete",
    movesAnalyzed: annotations.length,
    averageCpLoss: Math.round(averageCpLoss),
    accuracy: Math.round(accuracy),
    mistakes: mistakes.length,
    criticalMoments: annotations.filter((a) => a.isCriticalMoment).length,
  });
}
