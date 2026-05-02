"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface GameRecord {
  id: string;
  white: string;
  black: string;
  result: string;
  date: string | null;
  timeControl: string | null;
  opening: string | null;
  selfReviewComplete: boolean;
  engineReviewComplete: boolean;
  accuracy: number | null;
}

export default function GamesPage() {
  const [pgn, setPgn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!pgn.trim()) return;
    setUploading(true);
    setUploadError(null);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgn }),
      });

      if (res.ok) {
        const game = await res.json();
        setGames((prev) => [game, ...prev]);
        setShowUpload(false);
        setPgn("");
        window.location.href = `/games/${game.id}/review`;
      } else {
        const err = await res.json();
        setUploadError(err.error || "Failed to upload game");
      }
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Game Review</h1>
          <p className="text-text-muted mt-1">
            Upload games, self-analyze first, then check with the engine
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Game
        </button>
      </div>

      {showUpload && (
        <div className="card border-accent-gold/20">
          <h2 className="font-semibold text-lg mb-4">Import Game</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label block mb-1.5">Paste PGN</label>
                <textarea
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  className="input-field h-48 font-mono text-sm resize-none"
                  placeholder={`[Event "Casual Game"]\n[White "You"]\n[Black "Opponent"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 ...`}
                />
              </div>
              {uploadError && (
                <p className="text-sm text-accent-rose flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!pgn.trim() || uploading}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload & Start Review"}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <h3 className="text-sm font-semibold mb-2">
                  How the review process works:
                </h3>
                <ol className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="badge-gold text-[10px] mt-0.5">1</span>
                    <span>
                      First, you annotate the game yourself — find critical
                      moments, explain decisions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="badge-gold text-[10px] mt-0.5">2</span>
                    <span>
                      Then, the engine analysis reveals what you missed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="badge-gold text-[10px] mt-0.5">3</span>
                    <span>
                      Mistakes are classified and converted into training tasks
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="badge-gold text-[10px] mt-0.5">4</span>
                    <span>
                      Your weakness profile updates based on recurring error
                      patterns
                    </span>
                  </li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-accent-gold/5 border border-accent-gold/10">
                <p className="text-sm text-accent-gold">
                  <strong>Coming soon:</strong> Connect your Lichess or
                  Chess.com account to automatically import games.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No games yet</h3>
          <p className="text-text-muted text-sm mb-4">
            Upload a PGN to start your structured game review journey.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Your First Game
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}/review`}
              className="card-hover flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary flex items-center justify-center">
                <FileText className="w-6 h-6 text-text-muted" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {game.white} vs {game.black}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      game.result === "1-0"
                        ? "text-accent-emerald"
                        : game.result === "0-1"
                          ? "text-accent-rose"
                          : "text-text-muted"
                    }`}
                  >
                    {game.result}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {game.opening && (
                    <span className="text-xs text-text-muted">
                      {game.opening}
                    </span>
                  )}
                  {game.timeControl && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {game.timeControl}
                    </span>
                  )}
                  {game.date && (
                    <span className="text-xs text-text-muted">
                      {new Date(game.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {game.accuracy !== null && (
                  <span className="badge-blue">{game.accuracy}% accuracy</span>
                )}
                {game.selfReviewComplete && game.engineReviewComplete ? (
                  <span className="badge-emerald flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Reviewed
                  </span>
                ) : game.selfReviewComplete ? (
                  <span className="badge-gold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Engine pending
                  </span>
                ) : (
                  <span className="badge-rose flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Needs review
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-gold transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
