/**
 * Glicko-2 Rating System
 * Based on Mark Glickman's algorithm: http://www.glicko.net/glicko/glicko2.pdf
 *
 * Key concepts:
 *   r  — rating (default 1500 on Glicko-1 scale; 0 on Glicko-2 scale)
 *   RD — Rating Deviation (uncertainty; lower = more reliable)
 *   σ  — volatility (how erratic the player's performance is)
 */

const TAU = 0.5; // System constant — controls volatility change speed
const EPSILON = 0.000001; // Convergence tolerance
const SCALE = 173.7178; // Converts between Glicko-1 and Glicko-2 scales

export interface Glicko2Player {
  rating: number;       // Glicko-1 scale (1500 = average)
  rd: number;           // Rating Deviation (1 SD, Glicko-1 scale; ~200 for new player)
  volatility: number;   // Volatility σ (typically 0.06)
}

export interface Glicko2Result {
  rating: number;
  rd: number;
  volatility: number;
  /** 95% confidence interval: [rating - 2*rd, rating + 2*rd] */
  low: number;
  high: number;
  /** Display string e.g. "1650 ± 80" */
  display: string;
}

/** Convert Glicko-1 rating to Glicko-2 scale */
function toG2(r: number): number {
  return (r - 1500) / SCALE;
}

/** Convert Glicko-2 rating back to Glicko-1 scale */
function fromG2(mu: number): number {
  return mu * SCALE + 1500;
}

/** Convert Glicko-1 RD to Glicko-2 scale */
function rdToG2(rd: number): number {
  return rd / SCALE;
}

/** Convert Glicko-2 RD back to Glicko-1 scale */
function rdFromG2(phi: number): number {
  return phi * SCALE;
}

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

/**
 * Update a player's Glicko-2 rating after a rating period.
 *
 * @param player  Current player ratings
 * @param opponents  Array of opponents faced in this period
 * @param scores  Game scores vs each opponent (1=win, 0.5=draw, 0=loss)
 */
export function updateGlicko2(
  player: Glicko2Player,
  opponents: Glicko2Player[],
  scores: number[]
): Glicko2Result {
  if (opponents.length === 0) {
    // No games — increase RD (uncertainty grows with inactivity)
    const newRd = Math.min(
      Math.sqrt(player.rd * player.rd + player.volatility * player.volatility),
      350
    );
    return buildResult({ ...player, rd: newRd });
  }

  // Step 2: Convert to Glicko-2 scale
  const mu = toG2(player.rating);
  const phi = rdToG2(player.rd);
  const sigma = player.volatility;

  const mus = opponents.map((o) => toG2(o.rating));
  const phis = opponents.map((o) => rdToG2(o.rd));

  // Step 3: Compute v (estimated variance)
  let v = 0;
  for (let j = 0; j < opponents.length; j++) {
    const gj = g(phis[j]);
    const Ej = E(mu, mus[j], phis[j]);
    v += gj * gj * Ej * (1 - Ej);
  }
  v = 1 / v;

  // Step 4: Compute delta (improvement score)
  let delta = 0;
  for (let j = 0; j < opponents.length; j++) {
    const gj = g(phis[j]);
    const Ej = E(mu, mus[j], phis[j]);
    delta += gj * (scores[j] - Ej);
  }
  delta = v * delta;

  // Step 5: Compute new volatility σ' via Illinois algorithm
  const a = Math.log(sigma * sigma);

  function f(x: number): number {
    const ex = Math.exp(x);
    const phi2 = phi * phi;
    const d2 = delta * delta;
    const denom = (phi2 + v + ex);
    return (
      (ex * (d2 - phi2 - v - ex)) / (2 * denom * denom) -
      (x - a) / (TAU * TAU)
    );
  }

  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);
  let iter = 0;
  while (Math.abs(B - A) > EPSILON && iter < 200) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
    iter++;
  }
  const sigmaPrime = Math.exp(A / 2);

  // Step 6: Update RD (pre-rating period)
  const phiStar = Math.sqrt(phi * phi + sigmaPrime * sigmaPrime);

  // Step 7: Update rating and RD
  const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  let muPrime = mu;
  for (let j = 0; j < opponents.length; j++) {
    const gj = g(phis[j]);
    const Ej = E(mu, mus[j], phis[j]);
    muPrime += phiPrime * phiPrime * gj * (scores[j] - Ej);
  }

  const newRating = Math.round(fromG2(muPrime));
  const newRd = Math.min(Math.round(rdFromG2(phiPrime)), 350);
  const newVolatility = Math.round(sigmaPrime * 10000) / 10000;

  return buildResult({ rating: newRating, rd: newRd, volatility: newVolatility });
}

function buildResult(p: Glicko2Player): Glicko2Result {
  const low = Math.round(p.rating - 2 * p.rd);
  const high = Math.round(p.rating + 2 * p.rd);
  const display = `${p.rating} ± ${p.rd}`;
  return { ...p, low, high, display };
}

/**
 * Quick single-game update helper — models a puzzle solve as a
 * "match" between player and puzzle (each treated as an opponent).
 *
 * @param player  Player's current Glicko-2 state
 * @param puzzleRating  Puzzle's rating (Glicko-1 scale)
 * @param puzzleRd  Puzzle's RD (typically 100-200)
 * @param score  1 = solved, 0 = failed, 0.5 = partial
 */
export function updatePuzzleRating(
  player: Glicko2Player,
  puzzleRating: number,
  puzzleRd: number,
  score: 0 | 0.5 | 1
): Glicko2Result {
  const opponent: Glicko2Player = {
    rating: puzzleRating,
    rd: puzzleRd,
    volatility: 0.06,
  };
  return updateGlicko2(player, [opponent], [score]);
}

/** Format a rating for display: "1650 ± 80" */
export function formatRating(rating: number, rd: number): string {
  return `${rating} ± ${Math.round(rd)}`;
}

/** Initial rating for a new player */
export const INITIAL_PLAYER: Glicko2Player = {
  rating: 1000,
  rd: 200,
  volatility: 0.06,
};
