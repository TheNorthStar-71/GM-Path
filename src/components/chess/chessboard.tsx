"use client";

import { useState, useCallback, useMemo } from "react";
import { Chess, Square as ChessSquare } from "chess.js";

function pieceSrc(color: "w" | "b", type: string): string {
  const prefix = color === "w" ? "w" : "b";
  const pieceLetter = type.toUpperCase();
  return `/pieces/${prefix}${pieceLetter}.svg`;
}

interface ChessboardProps {
  fen?: string;
  orientation?: "white" | "black";
  interactive?: boolean;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
  highlightSquares?: string[];
  arrowFrom?: string;
  arrowTo?: string;
  size?: number;
  lastMove?: { from: string; to: string };
}

function coordToSquare(file: number, rank: number): string {
  return String.fromCharCode(97 + file) + (rank + 1);
}

const LIGHT = "#eeeed2";
const DARK = "#769656";
const SELECTED = "#f6f669";
const LAST_MOVE_LIGHT = "#f2f587";
const LAST_MOVE_DARK = "#baca44";
const HIGHLIGHT_LIGHT = "rgba(235,97,80,0.45)";
const HIGHLIGHT_DARK = "rgba(235,97,80,0.55)";
const COORD_LIGHT = "#769656";
const COORD_DARK = "#eeeed2";

export function Chessboard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  interactive = false,
  onMove,
  highlightSquares = [],
  size = 480,
  lastMove,
}: ChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  const chess = useMemo(() => {
    const c = new Chess();
    try { c.load(fen); } catch { /* use default */ }
    return c;
  }, [fen]);

  const board = useMemo(() => chess.board(), [chess]);

  const squareSize = size / 8;

  const handleSquareClick = useCallback(
    (file: number, rank: number) => {
      if (!interactive) return;

      const square = coordToSquare(file, rank) as ChessSquare;

      if (selectedSquare) {
        if (onMove) {
          const success = onMove(selectedSquare, square);
          if (success) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }
        }
        setSelectedSquare(null);
        setLegalMoves([]);
      }

      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
      }
    },
    [interactive, selectedSquare, chess, onMove]
  );

  const renderSquare = (file: number, rank: number) => {
    // For white: rank 0 (top row) = chess rank 8, rank 7 (bottom) = chess rank 1
    // For black: rank 0 (top row) = chess rank 1, rank 7 (bottom) = chess rank 8, files mirrored
    const actualRank = orientation === "white" ? 7 - rank : rank;
    const actualFile = orientation === "white" ? file : 7 - file;

    const square = coordToSquare(actualFile, actualRank);
    const isLight = (actualFile + actualRank) % 2 === 1;
    const piece = board[7 - actualRank]?.[actualFile];
    const isSelected = selectedSquare === square;
    const isLegalTarget = legalMoves.includes(square);
    const isHighlighted = highlightSquares.includes(square);
    const isLastMove =
      lastMove && (lastMove.from === square || lastMove.to === square);

    let bgColor = isLight ? LIGHT : DARK;
    if (isSelected) bgColor = SELECTED;
    else if (isLastMove) bgColor = isLight ? LAST_MOVE_LIGHT : LAST_MOVE_DARK;
    else if (isHighlighted) bgColor = isLight ? HIGHLIGHT_LIGHT : HIGHLIGHT_DARK;

    return (
      <div
        key={`${file}-${rank}`}
        onClick={() => handleSquareClick(actualFile, actualRank)}
        style={{
          width: squareSize,
          height: squareSize,
          backgroundColor: bgColor,
        }}
        className="relative flex items-center justify-center select-none cursor-pointer"
      >
        {rank === 7 && (
          <span
            className="absolute bottom-0.5 right-1 font-semibold pointer-events-none"
            style={{
              color: isLight ? COORD_LIGHT : COORD_DARK,
              fontSize: Math.max(squareSize * 0.18, 9),
              lineHeight: 1,
            }}
          >
            {String.fromCharCode(97 + actualFile)}
          </span>
        )}
        {file === 0 && (
          <span
            className="absolute top-0.5 left-1 font-semibold pointer-events-none"
            style={{
              color: isLight ? COORD_LIGHT : COORD_DARK,
              fontSize: Math.max(squareSize * 0.18, 9),
              lineHeight: 1,
            }}
          >
            {actualRank + 1}
          </span>
        )}

        {isLegalTarget && !piece && (
          <div
            className="absolute rounded-full bg-black/20"
            style={{
              width: squareSize * 0.33,
              height: squareSize * 0.33,
            }}
          />
        )}
        {isLegalTarget && piece && (
          <div
            className="absolute rounded-full border-[3px] border-black/20"
            style={{
              width: squareSize * 0.85,
              height: squareSize * 0.85,
            }}
          />
        )}

        {piece && (
          <img
            src={pieceSrc(piece.color, piece.type)}
            alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`}
            draggable={false}
            className="select-none z-10 pointer-events-none"
            style={{
              width: squareSize * 0.85,
              height: squareSize * 0.85,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="inline-block rounded-lg overflow-hidden shadow-2xl border-2 border-border-subtle"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 8 }, (_, rank) => (
        <div key={rank} className="flex">
          {Array.from({ length: 8 }, (_, file) => renderSquare(file, rank))}
        </div>
      ))}
    </div>
  );
}
