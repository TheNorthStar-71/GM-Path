import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 30;

interface EngineResult {
  bestMove: string;
  eval: number;
  mate: number | null;
  bestLine: string[];
  depth: number;
}

function runStockfish(
  fen: string,
  depth: number,
  skillLevel: number,
  moveTime?: number
): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const initEngine = require("stockfish");

    initEngine()
      .then(
        (engine: {
          onmessage: (msg: string) => void;
          postMessage: (msg: string) => void;
        }) => {
          let bestMove = "";
          let evaluation = 0;
          let mate: number | null = null;
          let bestLine: string[] = [];
          let finalDepth = 0;
          let resolved = false;

          const done = () => {
            if (resolved) return;
            resolved = true;
            resolve({ bestMove, eval: evaluation, mate, bestLine, depth: finalDepth });
          };

          const timeout = setTimeout(() => {
            if (!resolved) {
              engine.postMessage("stop");
            }
          }, moveTime ? moveTime + 2000 : 25000);

          engine.onmessage = (msg: string) => {
            if (typeof msg !== "string") return;

            if (msg.startsWith("info") && msg.includes("score")) {
              const cpMatch = msg.match(/score cp (-?\d+)/);
              const mateMatch = msg.match(/score mate (-?\d+)/);
              const depthMatch = msg.match(/\bdepth (\d+)\b/);
              const pvMatch = msg.match(/ pv (.+?)(?= pv | string |\s*$)/);

              if (cpMatch) {
                evaluation = parseInt(cpMatch[1]);
                mate = null;
              }
              if (mateMatch) {
                mate = parseInt(mateMatch[1]);
                evaluation = mate > 0 ? 30000 : -30000;
              }
              if (depthMatch) finalDepth = parseInt(depthMatch[1]);
              if (pvMatch) bestLine = pvMatch[1].trim().split(" ").filter(Boolean);
            }

            if (msg.startsWith("bestmove")) {
              clearTimeout(timeout);
              const parts = msg.split(" ");
              bestMove = parts[1] || "";
              done();
            }
          };

          engine.postMessage("uci");
          engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
          engine.postMessage("ucinewgame");
          engine.postMessage(`position fen ${fen}`);

          if (moveTime) {
            engine.postMessage(`go movetime ${moveTime}`);
          } else {
            engine.postMessage(`go depth ${depth}`);
          }
        }
      )
      .catch(reject);
  });
}

// POST /api/engine  — get best move + eval for a position
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fen,
      depth = 15,
      skillLevel = 20,
      moveTime,
    }: {
      fen: string;
      depth?: number;
      skillLevel?: number;
      moveTime?: number;
    } = body;

    if (!fen || typeof fen !== "string") {
      return NextResponse.json({ error: "fen required" }, { status: 400 });
    }

    const clampedDepth = Math.max(1, Math.min(20, depth));
    const clampedSkill = Math.max(0, Math.min(20, skillLevel));

    const result = await runStockfish(fen, clampedDepth, clampedSkill, moveTime);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Engine error:", err);
    return NextResponse.json({ error: "Engine failed" }, { status: 500 });
  }
}
