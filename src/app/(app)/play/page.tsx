"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Chess, Move } from "chess.js";
import { Chessboard } from "@/components/chess/chessboard";
import {
  Swords,
  Clock,
  Crown,
  Brain,
  Target,
  Zap,
  Shuffle,
  Flag,
  Handshake,
  RotateCcw,
  Trophy,
  Minus,
  X,
  Timer,
  BookOpen,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  TrendingDown,
  BarChart2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BotStrength = {
  label: string;
  rating: number;
  description: string;
  randomness: number;
};

type TimeControl = {
  label: string;
  value: string;
  baseSeconds: number;
  increment: number;
};

type TrainingFocus = {
  label: string;
  value: string;
  icon: typeof Target;
};

type GameResult = "win" | "loss" | "draw" | null;

type MoveClass =
  | "brilliant"
  | "great"
  | "good"
  | "interesting"
  | "inaccuracy"
  | "mistake"
  | "blunder";

// ─── Constants ───────────────────────────────────────────────────────────────

const BOT_STRENGTHS: BotStrength[] = [
  { label: "Beginner", rating: 600, description: "Just learning the rules", randomness: 0.9 },
  { label: "Casual", rating: 1000, description: "Plays for fun", randomness: 0.7 },
  { label: "Club", rating: 1400, description: "Regular club player", randomness: 0.5 },
  { label: "Advanced", rating: 1800, description: "Strong tournament player", randomness: 0.3 },
  { label: "Expert", rating: 2100, description: "Near-master strength", randomness: 0.15 },
  { label: "Master", rating: 2400, description: "Grandmaster-level play", randomness: 0.05 },
];

// Stockfish engine settings per difficulty
const ENGINE_CONFIG: Record<string, { depth: number; skillLevel: number; moveTime: number }> = {
  Beginner: { depth: 1,  skillLevel: 0,  moveTime: 100 },
  Casual:   { depth: 3,  skillLevel: 5,  moveTime: 300 },
  Club:     { depth: 6,  skillLevel: 10, moveTime: 600 },
  Advanced: { depth: 10, skillLevel: 15, moveTime: 1500 },
  Expert:   { depth: 15, skillLevel: 18, moveTime: 3000 },
  Master:   { depth: 20, skillLevel: 20, moveTime: 5000 },
};

const TIME_CONTROLS: TimeControl[] = [
  { label: "Untimed", value: "untimed", baseSeconds: 0, increment: 0 },
  { label: "10+0", value: "10+0", baseSeconds: 600, increment: 0 },
  { label: "15+10", value: "15+10", baseSeconds: 900, increment: 10 },
  { label: "30+0", value: "30+0", baseSeconds: 1800, increment: 0 },
];

const TRAINING_FOCUSES: TrainingFocus[] = [
  { label: "General Play", value: "general", icon: Swords },
  { label: "Tactics", value: "tactics", icon: Zap },
  { label: "Opening Discipline", value: "opening", icon: BookOpen },
  { label: "Endgame Technique", value: "endgame", icon: Crown },
  { label: "Calculation", value: "calculation", icon: Brain },
  { label: "Positional Play", value: "positional", icon: Landmark },
];

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// ─── Live Evaluation Engine ───────────────────────────────────────────────────

const PIECE_VALS_CP: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
};
const CENTER_SQS = new Set(["d4", "e4", "d5", "e5"]);
const EXT_CENTER_SQS = new Set(["c3", "d3", "e3", "f3", "c4", "f4", "c5", "f5", "c6", "d6", "e6", "f6"]);
const W_BACK_SQS = new Set(["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]);
const B_BACK_SQS = new Set(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);

function evalPosition(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -9000 : 9000;
  if (chess.isDraw()) return 0;
  const board = chess.board();
  let score = 0;
  let wB = 0, bB = 0, wDev = 0, bDev = 0;
  const wPF: number[] = [], bPF: number[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const pc = board[r][c];
      if (!pc) continue;
      const s = pc.color === "w" ? 1 : -1;
      score += s * (PIECE_VALS_CP[pc.type] ?? 0);
      if (pc.type === "b") { if (pc.color === "w") wB++; else bB++; }
      if (pc.type === "p") { if (pc.color === "w") wPF.push(c); else bPF.push(c); }
      if (CENTER_SQS.has(pc.square)) score += s * (pc.type === "p" ? 30 : 20);
      else if (EXT_CENTER_SQS.has(pc.square)) score += s * 10;
      if ((pc.type === "n" || pc.type === "b") && !(pc.color === "w" ? W_BACK_SQS : B_BACK_SQS).has(pc.square)) {
        if (pc.color === "w") wDev++; else bDev++;
      }
    }
  }

  if (wB >= 2) score += 50;
  if (bB >= 2) score -= 50;
  score += (wDev - bDev) * 15;

  // Doubled pawn penalty
  const wFC = new Map<number, number>(), bFC = new Map<number, number>();
  for (const f of wPF) wFC.set(f, (wFC.get(f) ?? 0) + 1);
  for (const f of bPF) bFC.set(f, (bFC.get(f) ?? 0) + 1);
  for (const cv of Array.from(wFC.values())) if (cv > 1) score -= 20 * (cv - 1);
  for (const cv of Array.from(bFC.values())) if (cv > 1) score += 20 * (cv - 1);

  score += (chess.turn() === "w" ? 1 : -1) * chess.moves().length * 2;
  if (chess.isCheck()) score += chess.turn() === "w" ? -15 : 15;
  return score;
}

interface CandidateMove {
  san: string;
  uci: string;
  eval: number;
  rank: number;
  reason?: string;
}

function findBest1Ply(chess: Chess): { san: string; uci: string; eval: number } {
  const candidates = findTopCandidates(chess, 1);
  return candidates[0] ?? { san: "", uci: "", eval: evalPosition(chess) };
}

function findTopCandidates(chess: Chess, count: number = 3): CandidateMove[] {
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) return [{ san: "", uci: "", eval: evalPosition(chess), rank: 1 }];
  const maximize = chess.turn() === "w";

  const evaluated: CandidateMove[] = [];
  for (const m of legal) {
    chess.move(m.san);
    const e = evalPosition(chess);
    chess.undo();
    evaluated.push({
      san: m.san,
      uci: m.from + m.to + (m.promotion ?? ""),
      eval: e,
      rank: 0,
    });
  }

  evaluated.sort((a, b) => maximize ? b.eval - a.eval : a.eval - b.eval);
  const top = evaluated.slice(0, Math.min(count, evaluated.length));
  top.forEach((c, i) => { c.rank = i + 1; });

  // Add reasons for top moves
  for (const c of top) {
    const move = legal.find((m) => m.san === c.san);
    if (!move) continue;
    if (chess.isCheckmate()) {
      c.reason = "Delivers checkmate";
    } else if (move.captured) {
      const val = PIECE_VALUES[move.captured] ?? 0;
      c.reason = val >= 5 ? "Wins major material" : val >= 3 ? "Wins a piece" : "Wins material";
    } else if (move.san.includes("+")) {
      c.reason = "Gives check with initiative";
    } else if (CENTER_SQS.has(move.to)) {
      c.reason = "Strengthens central control";
    } else if (c.rank === 1 && top.length > 1) {
      const advantage = Math.abs(c.eval - (top[1]?.eval ?? 0));
      if (advantage > 100) c.reason = "Clearly the strongest continuation";
      else c.reason = "Maintains the best position";
    }
  }

  return top;
}

function classifyMoveQuality(
  cpLoss: number,
  evalGain: number,
  played: string,
  best: string,
  isCapture: boolean,
): MoveClass {
  if (evalGain > 150 && played === best) return "brilliant";
  if (isCapture && cpLoss > 10 && cpLoss < 50) return "interesting";
  if (cpLoss >= 200) return "blunder";
  if (cpLoss >= 100) return "mistake";
  if (cpLoss >= 50) return "inaccuracy";
  if (cpLoss < 10 || played === best) return "great";
  return "good";
}

const MOVE_CLASS_STYLES: Record<MoveClass, { color: string; bg: string; border: string; glyph: string; label: string }> = {
  brilliant:   { color: "text-cyan-400",      bg: "bg-cyan-400/10",      border: "border-cyan-400/20",    glyph: "!!",  label: "Brilliant" },
  great:       { color: "text-emerald-400",    bg: "bg-emerald-400/10",   border: "border-emerald-400/20", glyph: "!",   label: "Great Move" },
  good:        { color: "text-text-secondary", bg: "bg-bg-tertiary",      border: "border-border-subtle",  glyph: "",    label: "Good Move" },
  interesting: { color: "text-blue-400",       bg: "bg-blue-400/10",      border: "border-blue-400/20",    glyph: "!?",  label: "Interesting" },
  inaccuracy:  { color: "text-yellow-400",     bg: "bg-yellow-400/10",    border: "border-yellow-400/20",  glyph: "?!",  label: "Inaccuracy" },
  mistake:     { color: "text-orange-400",     bg: "bg-orange-400/10",    border: "border-orange-400/20",  glyph: "?",   label: "Mistake" },
  blunder:     { color: "text-rose-400",       bg: "bg-rose-400/10",      border: "border-rose-400/20",    glyph: "??",  label: "Blunder!" },
};

const COACH_TIPS: Record<MoveClass, string[]> = {
  brilliant: [
    "Outstanding find! This move wins significant material or creates a decisive advantage.",
    "Brilliant! Most players would have missed this resource entirely.",
  ],
  great: [
    "Excellent play! You found the strongest continuation in this position.",
    "Well played — this keeps you firmly in control of the game.",
  ],
  good: [
    "Solid choice that keeps the game on track.",
    "Reasonable continuation that maintains the balance.",
  ],
  interesting: [
    "Creative choice! This sacrifices a small edge for dynamic complications.",
    "Provocative — this sets real problems for your opponent.",
  ],
  inaccuracy: [
    "Slightly off target. There was a more precise option available.",
    "Minor slip — the position is still manageable, but precision matters.",
  ],
  mistake: [
    "Costly error. Your opponent now has a meaningful advantage.",
    "This shifts the balance significantly. Look for more active play.",
  ],
  blunder: [
    "Critical error! Before every move, ask: what is my opponent threatening?",
    "Game-altering blunder. Practice blunder-checking: always verify piece safety first.",
  ],
};

function getCoachTip(cls: MoveClass, bestSan: string, playedSan: string): string {
  const tips = COACH_TIPS[cls];
  const base = tips[Math.floor(Date.now() / 100) % tips.length];
  if ((cls === "inaccuracy" || cls === "mistake" || cls === "blunder") && bestSan && bestSan !== playedSan) {
    return `${base} Best was ${bestSan}.`;
  }
  return base;
}

function detectOpponentThreats(chess: Chess): string | null {
  if (chess.isCheck()) {
    return "You are in check! You must deal with this immediately.";
  }
  const moves = chess.moves({ verbose: true });
  const valuableCaptures = moves.filter(m => {
    if (!m.captured) return false;
    return (PIECE_VALS_CP[m.captured] ?? 0) >= 300;
  });
  if (valuableCaptures.length === 0) return null;
  const best = valuableCaptures.sort(
    (a, b) => (PIECE_VALS_CP[b.captured as string] ?? 0) - (PIECE_VALS_CP[a.captured as string] ?? 0),
  )[0];
  const names: Record<string, string> = { n: "knight", b: "bishop", r: "rook", q: "queen", p: "pawn" };
  const val = PIECE_VALS_CP[best.captured as string] ?? 0;
  const name = names[best.captured as string] ?? "piece";
  if (val >= 900) return `Your queen on ${best.to} is under attack!`;
  if (val >= 500) return `Opponent threatens to take your rook on ${best.to}.`;
  return `Opponent can take your ${name} on ${best.to}.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTimeControl(value: string): { base: number; increment: number } {
  const tc = TIME_CONTROLS.find((t) => t.value === value);
  if (!tc || value === "untimed") return { base: 0, increment: 0 };
  return { base: tc.baseSeconds, increment: tc.increment };
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function fetchBotMove(
  fen: string,
  label: string,
): Promise<{ uci: string; eval: number; bestLine: string[] } | null> {
  const cfg = ENGINE_CONFIG[label] ?? ENGINE_CONFIG.Club;
  try {
    const res = await fetch("/api/engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        depth: cfg.depth,
        skillLevel: cfg.skillLevel,
        moveTime: cfg.moveTime,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { uci: data.bestMove as string, eval: data.eval as number, bestLine: data.bestLine as string[] };
  } catch {
    return null;
  }
}

function getCapturedPieces(chess: Chess, color: "w" | "b"): string[] {
  const initial: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const remaining: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.color === color && sq.type !== "k") {
        remaining[sq.type] = (remaining[sq.type] || 0) + 1;
      }
    }
  }
  const captured: string[] = [];
  const prefix = color === "w" ? "w" : "b";
  for (const [piece, count] of Object.entries(initial)) {
    const diff = count - (remaining[piece] || 0);
    for (let i = 0; i < diff; i++) {
      captured.push(`/pieces/${prefix}${piece.toUpperCase()}.svg`);
    }
  }
  return captured;
}

function materialAdvantage(chess: Chess, perspective: "w" | "b"): number {
  let white = 0, black = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq || sq.type === "k") continue;
      const val = PIECE_VALUES[sq.type] || 0;
      if (sq.color === "w") white += val;
      else black += val;
    }
  }
  return perspective === "w" ? white - black : black - white;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlayPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Setup state
  const [phase, setPhase] = useState<"setup" | "playing">("setup");
  const [selectedStrength, setSelectedStrength] = useState(1);
  const [selectedTimeControl, setSelectedTimeControl] = useState("untimed");
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("white");
  const [selectedFocus, setSelectedFocus] = useState("general");

  // Game state
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [userColor, setUserColor] = useState<"white" | "black">("white");
  const [moves, setMoves] = useState<{ san: string; color: "w" | "b" }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>();
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [resultReason, setResultReason] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [moveFlash, setMoveFlash] = useState(false);

  // Live coaching state
  const [liveEval, setLiveEval] = useState(0);
  const [moveClass, setMoveClass] = useState<MoveClass | null>(null);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [threatMsg, setThreatMsg] = useState<string | null>(null);
  const [evalHistory, setEvalHistory] = useState<number[]>([0]);
  const [lastBestSan, setLastBestSan] = useState<string | null>(null);
  const [lastPlayerSan, setLastPlayerSan] = useState<string | null>(null);
  const [topCandidates, setTopCandidates] = useState<CandidateMove[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [showCoach, setShowCoach] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gm-path-show-coach");
      return stored !== null ? stored !== "false" : true;
    }
    return true;
  });

  // Clocks
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const isTimed = selectedTimeControl !== "untimed";
  const clockInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const chessRef = useRef(new Chess());
  const botGameIdRef = useRef<string>("");
  const gameOverRef = useRef(false);
  const moveListRef = useRef<HTMLDivElement>(null);

  const botStrength = BOT_STRENGTHS[selectedStrength];

  // Auto-scroll move list
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moves]);

  // ─── Clock Management ──────────────────────────────────────────────────────

  const stopClocks = useCallback(() => {
    if (clockInterval.current) { clearInterval(clockInterval.current); clockInterval.current = null; }
    if (elapsedInterval.current) { clearInterval(elapsedInterval.current); elapsedInterval.current = null; }
  }, []);

  const startClocks = useCallback(() => {
    stopClocks();
    if (isTimed) {
      clockInterval.current = setInterval(() => {
        const turn = chessRef.current.turn();
        if (gameOverRef.current) return;
        if (turn === "w") {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              gameOverRef.current = true;
              stopClocks();
              setGameResult(userColor === "white" ? "loss" : "win");
              setResultReason("White lost on time");
              setShowResultModal(true);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              gameOverRef.current = true;
              stopClocks();
              setGameResult(userColor === "black" ? "loss" : "win");
              setResultReason("Black lost on time");
              setShowResultModal(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    elapsedInterval.current = setInterval(() => {
      if (!gameOverRef.current) setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [isTimed, stopClocks, userColor]);

  useEffect(() => { return () => stopClocks(); }, [stopClocks]);

  // ─── End Game ──────────────────────────────────────────────────────────────

  const endGame = useCallback(
    (result: GameResult, reason: string) => {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      stopClocks();
      setGameResult(result);
      setResultReason(reason);
      setShowResultModal(true);

      const pgn = chessRef.current.pgn();
      botGameIdRef.current = `bot-${Date.now()}`;

      fetch("/api/bot-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: botGameIdRef.current,
          pgn,
          result: result === "win" ? "1-0" : result === "loss" ? "0-1" : "1/2-1/2",
          userColor,
          botRating: botStrength.rating,
          botLabel: botStrength.label,
          timeControl: selectedTimeControl,
          trainingFocus: selectedFocus,
          moves: moves.length,
        }),
      }).catch(() => {});
    },
    [stopClocks, userColor, botStrength, selectedTimeControl, selectedFocus, moves.length],
  );

  // ─── Check Game End ────────────────────────────────────────────────────────

  const checkGameEnd = useCallback(
    (chess: Chess) => {
      if (chess.isCheckmate()) {
        const loser = chess.turn();
        const playerLost = (loser === "w" && userColor === "white") || (loser === "b" && userColor === "black");
        endGame(playerLost ? "loss" : "win", "Checkmate");
        return true;
      }
      if (chess.isStalemate()) { endGame("draw", "Stalemate"); return true; }
      if (chess.isDraw()) { endGame("draw", "Draw by insufficient material"); return true; }
      if (chess.isThreefoldRepetition()) { endGame("draw", "Draw by repetition"); return true; }
      return false;
    },
    [endGame, userColor],
  );

  // ─── Bot Move ──────────────────────────────────────────────────────────────

  const makeBotMove = useCallback(async () => {
    if (gameOverRef.current) return;
    setBotThinking(true);

    const chess = chessRef.current;
    const fen = chess.fen();

    // Small UI delay so the "thinking" indicator registers
    await new Promise((r) => setTimeout(r, 250));
    if (gameOverRef.current) { setBotThinking(false); return; }

    // Call the real Stockfish engine
    const engineResult = await fetchBotMove(fen, botStrength.label);

    if (gameOverRef.current) { setBotThinking(false); return; }

    let result: Move | null = null;

    if (engineResult?.uci && engineResult.uci !== "(none)") {
      const uci = engineResult.uci;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length === 5 ? uci[4] : undefined;
      try {
        result = chess.move({ from, to, promotion }) as Move;
      } catch {
        // Fallback: pick any legal move
        const legal = chess.moves({ verbose: true });
        if (legal.length > 0) result = chess.move(legal[0].san) as Move;
      }
    } else {
      // API failed — pick a random legal move as graceful fallback
      const legal = chess.moves({ verbose: true });
      if (legal.length > 0) {
        const pick = legal[Math.floor(Math.random() * legal.length)];
        result = chess.move(pick.san) as Move;
      }
    }

    if (!result) { setBotThinking(false); return; }

    if (isTimed) {
      const { increment } = parseTimeControl(selectedTimeControl);
      if (result.color === "w") setWhiteTime((prev) => prev + increment);
      else setBlackTime((prev) => prev + increment);
    }

    // Use real Stockfish eval from API response; fall back to heuristic
    const realEval = engineResult?.eval ?? evalPosition(chess);
    setLiveEval(realEval);
    setEvalHistory((prev) => [...prev, realEval]);
    setMoveCount((c) => c + 1);

    if (chess.isCheck()) {
      setThreatMsg("You are in check! Deal with this immediately.");
    } else {
      setThreatMsg(null);
    }

    setFen(chess.fen());
    setLastMove({ from: result.from, to: result.to });
    setMoves((prev) => [...prev, { san: result.san, color: result.color }]);
    setMoveFlash(true);
    setTimeout(() => setMoveFlash(false), 300);
    setBotThinking(false);
    checkGameEnd(chess);
  }, [botStrength.label, checkGameEnd, isTimed, selectedTimeControl]);

  // ─── Player Move Handler ───────────────────────────────────────────────────

  const onMove = useCallback(
    (from: string, to: string): boolean => {
      if (gameOverRef.current || botThinking) return false;

      const chess = chessRef.current;
      const currentTurn = chess.turn();
      const isPlayerTurn =
        (currentTurn === "w" && userColor === "white") ||
        (currentTurn === "b" && userColor === "black");
      if (!isPlayerTurn) return false;

      // Pre-move snapshot for analysis
      const evalBefore = evalPosition(chess);
      const candidates = findTopCandidates(chess, 3);
      const bestBefore = candidates[0] ?? { san: "", uci: "", eval: evalBefore };

      const piece = chess.get(from as Parameters<typeof chess.get>[0]);
      const isPromotion =
        piece?.type === "p" &&
        ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));

      try {
        const result = chess.move({ from, to, promotion: isPromotion ? "q" : undefined });
        if (!result) return false;

        if (isTimed) {
          const { increment } = parseTimeControl(selectedTimeControl);
          if (result.color === "w") setWhiteTime((prev) => prev + increment);
          else setBlackTime((prev) => prev + increment);
        }

        // Post-move analysis — use heuristic instantly, then refine with Stockfish async
        const evalAfterHeuristic = evalPosition(chess);
        const isWhite = result.color === "w";
        const rawCpLoss = isWhite
          ? Math.max(0, bestBefore.eval - evalAfterHeuristic)
          : Math.max(0, -(bestBefore.eval - evalAfterHeuristic));
        const evalGain = isWhite ? evalAfterHeuristic - evalBefore : evalBefore - evalAfterHeuristic;

        const cls = classifyMoveQuality(rawCpLoss, evalGain, result.san, bestBefore.san, !!result.captured);
        const tip = getCoachTip(cls, bestBefore.san, result.san);
        const threats = detectOpponentThreats(chess);

        setLiveEval(evalAfterHeuristic);
        setMoveClass(cls);
        setLastBestSan(bestBefore.san);
        setLastPlayerSan(result.san);
        setTopCandidates(candidates);
        setCoachTip(tip);
        setThreatMsg(threats);
        setEvalHistory((prev) => [...prev, evalAfterHeuristic]);
        setMoveCount((c) => c + 1);

        setFen(chess.fen());
        setLastMove({ from: result.from, to: result.to });
        setMoves((prev) => [...prev, { san: result.san, color: result.color }]);
        setMoveFlash(true);
        setTimeout(() => setMoveFlash(false), 300);

        if (!checkGameEnd(chess)) makeBotMove();
        return true;
      } catch {
        return false;
      }
    },
    [userColor, botThinking, checkGameEnd, makeBotMove, isTimed, selectedTimeControl],
  );

  // ─── Start Game ────────────────────────────────────────────────────────────

  const startGame = () => {
    const color =
      selectedColor === "random"
        ? Math.random() < 0.5 ? "white" : "black"
        : selectedColor;

    setUserColor(color);
    const chess = new Chess();
    chessRef.current = chess;
    gameOverRef.current = false;
    botGameIdRef.current = "";

    setFen(chess.fen());
    setMoves([]);
    setLastMove(undefined);
    setGameResult(null);
    setResultReason("");
    setShowResultModal(false);
    setBotThinking(false);
    setElapsedTime(0);
    setLiveEval(0);
    setMoveClass(null);
    setCoachTip(null);
    setThreatMsg(null);
    setEvalHistory([0]);
    setLastBestSan(null);
    setLastPlayerSan(null);
    setMoveCount(0);

    if (isTimed) {
      const { base } = parseTimeControl(selectedTimeControl);
      setWhiteTime(base);
      setBlackTime(base);
    }

    setPhase("playing");

    setTimeout(() => {
      startClocks();
      if (color === "black") makeBotMove();
    }, 100);
  };

  const handleResign = () => endGame("loss", "Resignation");

  const handleOfferDraw = () => {
    if (Math.random() < 0.3) endGame("draw", "Draw agreed");
  };

  const handleNewGame = () => {
    stopClocks();
    gameOverRef.current = true;
    setPhase("setup");
  };

  // ─── Derived values ────────────────────────────────────────────────────────

  const playerName = session?.user?.name || "You";
  const botName = `Bot (${botStrength.label})`;
  const capturedByWhite = phase === "playing" ? getCapturedPieces(chessRef.current, "b") : [];
  const capturedByBlack = phase === "playing" ? getCapturedPieces(chessRef.current, "w") : [];
  const whiteMaterialAdv = phase === "playing" ? materialAdvantage(chessRef.current, "w") : 0;
  const blackMaterialAdv = phase === "playing" ? materialAdvantage(chessRef.current, "b") : 0;

  const topPlayerIsBlack = userColor === "white";
  const topCaptured = topPlayerIsBlack ? capturedByBlack : capturedByWhite;
  const bottomCaptured = topPlayerIsBlack ? capturedByWhite : capturedByBlack;
  const topAdv = topPlayerIsBlack ? blackMaterialAdv : whiteMaterialAdv;
  const bottomAdv = topPlayerIsBlack ? whiteMaterialAdv : blackMaterialAdv;
  const topName = topPlayerIsBlack ? botName : playerName;
  const bottomName = topPlayerIsBlack ? playerName : botName;
  const topRating = topPlayerIsBlack ? botStrength.rating : "—";
  const bottomRating = topPlayerIsBlack ? "—" : botStrength.rating;
  const topTime = topPlayerIsBlack ? blackTime : whiteTime;
  const bottomTime = topPlayerIsBlack ? whiteTime : blackTime;

  const movePairs: { num: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i]?.san,
      black: moves[i + 1]?.san,
    });
  }

  // ─── Render Setup Phase ────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
              <Swords className="w-8 h-8 text-accent-gold" />
              Play with Coach
            </h1>
            <p className="text-text-secondary mt-1">
              Get real-time coaching on every move, then deep analysis after the game
            </p>
          </div>

          {/* Bot Strength */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Bot Strength</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BOT_STRENGTHS.map((bot, idx) => (
                <button
                  key={bot.label}
                  onClick={() => setSelectedStrength(idx)}
                  className={`card p-4 text-left transition-all duration-200 border-2 ${
                    selectedStrength === idx
                      ? "border-accent-gold bg-accent-gold/10"
                      : "border-transparent hover:border-border-subtle hover:bg-bg-hover"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-text-primary text-sm">{bot.label}</span>
                    <span className="badge-gold text-xs">{bot.rating}</span>
                  </div>
                  <p className="text-text-muted text-xs">{bot.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Control */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Time Control</h2>
            <div className="flex flex-wrap gap-2">
              {TIME_CONTROLS.map((tc) => (
                <button
                  key={tc.value}
                  onClick={() => setSelectedTimeControl(tc.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTimeControl === tc.value
                      ? "bg-accent-gold text-bg-primary"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tc.value === "untimed" ? <Timer className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {tc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Play As</h2>
            <div className="flex gap-3">
              {(
                [
                  { value: "white" as const, label: "White", img: "/pieces/wK.svg" },
                  { value: "black" as const, label: "Black", img: "/pieces/bK.svg" },
                  { value: "random" as const, label: "Random", iconComponent: Shuffle },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedColor(opt.value)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                    selectedColor === opt.value
                      ? "border-accent-gold bg-accent-gold/10 text-text-primary"
                      : "border-border-subtle bg-bg-tertiary text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  {"img" in opt ? (
                    <img src={opt.img} alt={opt.label} className="w-6 h-6" draggable={false} />
                  ) : (
                    <opt.iconComponent className="w-5 h-5" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Training Focus */}
          <div className="mb-10">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Training Focus</h2>
            <div className="flex flex-wrap gap-2">
              {TRAINING_FOCUSES.map((focus) => {
                const Icon = focus.icon;
                return (
                  <button
                    key={focus.value}
                    onClick={() => setSelectedFocus(focus.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      selectedFocus === focus.value
                        ? "border-accent-emerald bg-accent-emerald/10 text-accent-emerald"
                        : "border-border-subtle bg-bg-tertiary text-text-secondary hover:border-border hover:text-text-primary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {focus.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startGame}
            className="btn-primary w-full py-4 text-lg font-display font-semibold flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            Start Game
          </button>

          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Brain, label: "Stockfish 18", desc: "Real engine at every difficulty level" },
              { icon: Zap, label: "Move Quality", desc: "Brilliant to blunder ratings" },
              { icon: BarChart2, label: "Eval Graph", desc: "Track advantage in real-time" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-lg bg-bg-tertiary border border-border-subtle text-center">
                <Icon className="w-5 h-5 text-accent-gold mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-text-primary">{label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Playing Phase ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 items-start">

        {/* Left Column: Board Area */}
        <div className="flex-shrink-0">
          <PlayerBar
            name={topName}
            rating={topRating}
            captured={topCaptured}
            materialAdv={topAdv}
            isBot={topPlayerIsBlack}
            thinking={topPlayerIsBlack && botThinking}
          />
          <ClockDisplay seconds={topTime} elapsed={elapsedTime} isTimed={isTimed}
            isActive={!gameOverRef.current && ((topPlayerIsBlack && chessRef.current.turn() === "b") || (!topPlayerIsBlack && chessRef.current.turn() === "w"))}
          />

          {/* Board with vertical eval bar */}
          <div className="flex gap-2 items-stretch">
            <VerticalEvalBar evalCp={liveEval} height={480} />
            <div className={`transition-all duration-300 ${moveFlash ? "ring-2 ring-accent-gold/40 rounded-lg" : ""}`}>
              <Chessboard
                fen={fen}
                orientation={userColor}
                interactive={!gameOverRef.current && !botThinking}
                onMove={onMove}
                size={480}
                lastMove={lastMove}
              />
            </div>
          </div>

          <ClockDisplay seconds={bottomTime} elapsed={elapsedTime} isTimed={isTimed}
            isActive={!gameOverRef.current && ((topPlayerIsBlack && chessRef.current.turn() === "w") || (!topPlayerIsBlack && chessRef.current.turn() === "b"))}
          />
          <PlayerBar
            name={bottomName}
            rating={bottomRating}
            captured={bottomCaptured}
            materialAdv={bottomAdv}
            isBot={!topPlayerIsBlack}
            thinking={!topPlayerIsBlack && botThinking}
          />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full lg:w-auto space-y-3">
          {/* Game Info Header */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-semibold text-text-primary text-sm">vs {botName}</h2>
              <span className="text-text-muted text-xs font-mono">
                {selectedTimeControl === "untimed" ? "Untimed" : selectedTimeControl}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {TRAINING_FOCUSES.find((f) => f.value === selectedFocus)?.label}
              </span>
              <span>·</span>
              <span>{userColor === "white" ? "Playing White" : "Playing Black"}</span>
              <span>·</span>
              <span>{moveCount} plies</span>
            </div>
          </div>

          {/* Coach toggle */}
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs text-text-muted font-medium">Live Coach</span>
            <button
              onClick={() => {
                const next = !showCoach;
                setShowCoach(next);
                localStorage.setItem("gm-path-show-coach", String(next));
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                showCoach ? "bg-accent-gold" : "bg-bg-tertiary"
              }`}
              title={showCoach ? "Hide live coach" : "Show live coach"}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showCoach ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Live Coach Panel */}
          {showCoach && (
            <LiveCoachPanel
              moveClass={moveClass}
              coachTip={coachTip}
              threatMsg={threatMsg}
              lastBestSan={lastBestSan}
              lastPlayerSan={lastPlayerSan}
              topCandidates={topCandidates}
              liveEval={liveEval}
              evalHistory={evalHistory}
              userColor={userColor}
              botThinking={botThinking}
              gameOver={gameOverRef.current}
            />
          )}

          {/* Move List */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Moves</h3>
            <div ref={moveListRef} className="max-h-48 overflow-y-auto scrollbar-thin">
              {movePairs.length === 0 ? (
                <p className="text-text-muted text-sm italic">
                  {userColor === "white" ? "Your move…" : "Bot is thinking…"}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {movePairs.map((pair, idx) => {
                    const wMove = moves[idx * 2];
                    const bMove = moves[idx * 2 + 1];
                    return (
                      <div key={pair.num} className="flex items-center text-sm font-mono">
                        <span className="w-7 text-text-muted text-right mr-2 flex-shrink-0 text-xs">{pair.num}.</span>
                        <span className={`w-20 ${wMove?.color === (userColor === "white" ? "w" : "b") ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                          {pair.white || ""}
                        </span>
                        <span className={`w-20 ${bMove?.color === (userColor === "black" ? "b" : "w") ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                          {pair.black || ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex flex-col gap-2">
            {!gameOverRef.current && (
              <>
                <button onClick={handleResign} className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2 text-accent-rose hover:bg-accent-rose/10">
                  <Flag className="w-4 h-4" /> Resign
                </button>
                <button onClick={handleOfferDraw} className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary">
                  <Handshake className="w-4 h-4" /> Offer Draw
                </button>
              </>
            )}
            <button onClick={handleNewGame} className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary">
              <RotateCcw className="w-4 h-4" /> New Game
            </button>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card p-8 max-w-sm w-full mx-4 text-center relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowResultModal(false)} className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>

            {gameResult === "win" && (
              <>
                <Trophy className="w-14 h-14 text-accent-gold mx-auto mb-3" />
                <h2 className="text-2xl font-display font-bold text-accent-gold mb-1">Victory!</h2>
              </>
            )}
            {gameResult === "loss" && (
              <>
                <Flag className="w-14 h-14 text-accent-rose mx-auto mb-3" />
                <h2 className="text-2xl font-display font-bold text-accent-rose mb-1">Defeat</h2>
              </>
            )}
            {gameResult === "draw" && (
              <>
                <Minus className="w-14 h-14 text-text-secondary mx-auto mb-3" />
                <h2 className="text-2xl font-display font-bold text-text-secondary mb-1">Draw</h2>
              </>
            )}

            <p className="text-text-muted text-sm mb-2">{resultReason}</p>

            {/* Quick game stats */}
            <div className="flex justify-center gap-4 mb-6 text-xs">
              <div className="text-center">
                <div className="font-bold text-lg text-text-primary">{moves.filter(m => (userColor === "white" ? m.color === "w" : m.color === "b")).length}</div>
                <div className="text-text-muted">Your moves</div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-lg ${liveEval > 50 ? "text-accent-emerald" : liveEval < -50 ? "text-accent-rose" : "text-text-muted"}`}>
                  {liveEval >= 0 ? `+${(liveEval / 100).toFixed(1)}` : (liveEval / 100).toFixed(1)}
                </div>
                <div className="text-text-muted">Final eval</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (botGameIdRef.current) router.push(`/play/${botGameIdRef.current}/review`);
                }}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Review with Coach
              </button>
              <button
                onClick={() => { setShowResultModal(false); handleNewGame(); }}
                className="btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlayerBar({
  name, rating, captured, materialAdv, isBot, thinking,
}: {
  name: string; rating: number | string; captured: string[];
  materialAdv: number; isBot: boolean; thinking: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isBot ? "bg-accent-purple/20 text-accent-purple" : "bg-accent-emerald/20 text-accent-emerald"}`}>
          {isBot ? "B" : "Y"}
        </div>
        <div>
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <span className="text-text-muted text-xs ml-1.5">({rating})</span>
        </div>
        {thinking && (
          <span className="flex items-center gap-1 text-xs text-accent-purple">
            <span className="animate-pulse">●</span> thinking
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {captured.map((src, i) => (
          <img key={i} src={src} alt="" className="w-4 h-4 opacity-80" draggable={false} />
        ))}
        {materialAdv > 0 && (
          <span className="text-xs text-accent-emerald font-mono ml-1">+{materialAdv}</span>
        )}
      </div>
    </div>
  );
}

function ClockDisplay({
  seconds, elapsed, isTimed, isActive,
}: {
  seconds: number; elapsed: number; isTimed: boolean; isActive: boolean;
}) {
  return (
    <div className={`flex items-center justify-end py-1.5 px-3 rounded-md mb-1 mt-1 transition-colors ${isActive ? "bg-bg-tertiary" : "bg-transparent"}`}>
      <span className={`font-mono text-lg tabular-nums ${isActive ? "text-text-primary font-semibold" : "text-text-muted"} ${isTimed && seconds <= 30 && isActive ? "text-accent-rose" : ""}`}>
        {isTimed ? formatClock(seconds) : formatClock(elapsed)}
      </span>
    </div>
  );
}

function VerticalEvalBar({ evalCp, height }: { evalCp: number; height: number }) {
  // Clamp eval to ±800cp. White is always at the bottom.
  const clamped = Math.max(-800, Math.min(800, evalCp));
  const whitePct = 50 + (clamped / 800) * 50;

  return (
    <div
      className="relative w-3 rounded overflow-hidden border border-border-subtle flex-shrink-0"
      style={{ height }}
      title={`Eval: ${clamped >= 0 ? "+" : ""}${(clamped / 100).toFixed(1)}`}
    >
      {/* Black background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, #2a2a3e, #1a1a2e)" }} />
      {/* White portion from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
        style={{ height: `${whitePct}%`, background: "linear-gradient(0deg, #e8e6e3, #d4d0c8)" }}
      />
    </div>
  );
}

function HorizontalEvalBar({ evalCp }: { evalCp: number }) {
  const clamped = Math.max(-800, Math.min(800, evalCp));
  const whitePct = 50 + (clamped / 800) * 50;
  const display = clamped >= 0 ? `+${(clamped / 100).toFixed(1)}` : (clamped / 100).toFixed(1);
  const isWhiteAdv = clamped >= 0;

  return (
    <div className="relative w-full h-5 rounded overflow-hidden border border-border-subtle" style={{ background: "#1a1a2e" }}>
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
        style={{ width: `${whitePct}%`, background: "linear-gradient(90deg, #e8e6e3, #d0ccc4)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-[10px] font-mono font-bold z-10 ${isWhiteAdv ? "text-[#1a1a2e]" : "text-[#e8e6e3]"}`}>
          {display}
        </span>
      </div>
    </div>
  );
}

function EvalSparkline({ evals }: { evals: number[] }) {
  if (evals.length < 2) return null;
  const last = evals.slice(-40);
  const W = 200, H = 40;
  const clamped = last.map((e) => Math.max(-600, Math.min(600, e)));
  const range = 1200; // fixed -600 to +600

  const pts = clamped.map((v, i) => {
    const x = last.length === 1 ? W / 2 : (i / (last.length - 1)) * W;
    const y = H - ((v + 600) / range) * H;
    return [x, y] as [number, number];
  });

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const zeroY = H / 2;

  const whitePoly = [
    `0,${zeroY}`,
    ...pts.map(([x, y]) => `${x},${Math.min(y, zeroY)}`),
    `${W},${zeroY}`,
  ].join(" ");

  const blackPoly = [
    `0,${zeroY}`,
    ...pts.map(([x, y]) => `${x},${Math.max(y, zeroY)}`),
    `${W},${zeroY}`,
  ].join(" ");

  return (
    <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polygon points={whitePoly} fill="rgba(232,230,227,0.12)" />
      <polygon points={blackPoly} fill="rgba(0,0,0,0.2)" />
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#333" strokeWidth="0.5" />
      <polyline points={polyline} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill="#c9a84c" />
      )}
    </svg>
  );
}

function LiveCoachPanel({
  moveClass, coachTip, threatMsg, lastBestSan, lastPlayerSan,
  topCandidates, liveEval, evalHistory, userColor, botThinking, gameOver,
}: {
  moveClass: MoveClass | null;
  coachTip: string | null;
  threatMsg: string | null;
  lastBestSan: string | null;
  lastPlayerSan: string | null;
  topCandidates: CandidateMove[];
  liveEval: number;
  evalHistory: number[];
  userColor: "white" | "black";
  botThinking: boolean;
  gameOver: boolean;
}) {
  const style = moveClass ? MOVE_CLASS_STYLES[moveClass] : null;
  const hasContent = moveClass || coachTip || threatMsg;

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-accent-gold" />
          Live Coach
        </h3>
        {botThinking && !gameOver && (
          <span className="text-xs text-accent-gold flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </span>
        )}
        {gameOver && (
          <span className="text-xs text-text-muted">Game over</span>
        )}
      </div>

      {/* Horizontal eval bar */}
      <div className="mb-3">
        <HorizontalEvalBar evalCp={liveEval} />
      </div>

      {/* Threat warning — always shown prominently if present */}
      {threatMsg && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg mb-3 bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="text-xs text-rose-300 font-medium leading-relaxed">{threatMsg}</span>
        </div>
      )}

      {/* Move quality badge */}
      {style && moveClass && (
        <div className={`flex items-center justify-between p-2.5 rounded-lg mb-2.5 border ${style.bg} ${style.border}`}>
          <div className="flex items-center gap-2">
            {moveClass === "brilliant" && <Sparkles className={`w-4 h-4 ${style.color}`} />}
            {(moveClass === "great" || moveClass === "good") && <CheckCircle2 className={`w-4 h-4 ${style.color}`} />}
            {moveClass === "interesting" && <Zap className={`w-4 h-4 ${style.color}`} />}
            {moveClass === "inaccuracy" && <TrendingDown className={`w-4 h-4 ${style.color}`} />}
            {(moveClass === "mistake" || moveClass === "blunder") && <AlertTriangle className={`w-4 h-4 ${style.color}`} />}
            <span className={`font-bold text-sm ${style.color}`}>
              {style.label}{style.glyph && <span className="ml-1 opacity-80">{style.glyph}</span>}
            </span>
          </div>
          {lastPlayerSan && (
            <span className="font-mono text-xs text-text-muted">{lastPlayerSan}</span>
          )}
        </div>
      )}

      {/* Coach tip */}
      {coachTip && (
        <p className="text-xs text-text-secondary leading-relaxed mb-2.5">{coachTip}</p>
      )}

      {/* Best move hint (shown for inaccuracies and above) */}
      {lastBestSan && moveClass && !["brilliant", "great", "good"].includes(moveClass) && (
        <div className="flex items-center gap-2 text-xs bg-bg-tertiary rounded-lg px-2.5 py-2 mb-2.5 font-mono border border-border-subtle">
          <Zap className="w-3.5 h-3.5 text-accent-gold shrink-0" />
          <span className="text-text-muted">Best was</span>
          <span className="font-semibold text-accent-emerald">{lastBestSan}</span>
        </div>
      )}

      {/* Top 3 candidate moves */}
      {topCandidates.length > 1 && moveClass && (
        <div className="mb-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
            Top Candidates
          </p>
          <div className="space-y-1">
            {topCandidates.map((c) => (
              <div
                key={c.san}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border ${
                  c.rank === 1
                    ? "bg-accent-emerald/5 border-accent-emerald/20"
                    : "bg-bg-tertiary border-border-subtle"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    c.rank === 1
                      ? "bg-accent-emerald/20 text-accent-emerald"
                      : c.rank === 2
                        ? "bg-accent-gold/20 text-accent-gold"
                        : "bg-bg-tertiary text-text-muted"
                  }`}
                >
                  {c.rank}
                </span>
                <span className="font-mono font-semibold text-text-primary">
                  {c.san}
                </span>
                {c.reason && (
                  <span className="text-text-muted truncate flex-1">
                    {c.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle state */}
      {!hasContent && !botThinking && (
        <p className="text-xs text-text-muted italic">
          {userColor === "white" ? "Make your first move to begin live analysis." : "Waiting for bot to move..."}
        </p>
      )}

      {/* Eval sparkline */}
      {evalHistory.length > 3 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
              <BarChart2 className="w-3 h-3" /> Eval History
            </span>
            <span className="text-[10px] text-text-muted font-mono">
              {evalHistory.length - 1} moves
            </span>
          </div>
          <EvalSparkline evals={evalHistory} />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted">Start</span>
            <span className="text-[9px] text-text-muted">Now</span>
          </div>
        </div>
      )}
    </div>
  );
}
