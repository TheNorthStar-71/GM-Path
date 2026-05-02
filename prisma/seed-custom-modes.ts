import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const planExercises = [
  {
    fen: "r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQ - 4 6",
    sideToMove: "white",
    goal: "Improve your position — what's your plan for the next 2–3 moves?",
    difficulty: 2,
    ratingMin: 1200,
    ratingMax: 1800,
    goodPlans: JSON.stringify([
      { moves: ["e2e3", "f1d3", "e1g1"], summary: "Complete development and castle kingside for a solid position.", eval: 0.3 },
      { moves: ["c1g5", "e2e3", "f1d3"], summary: "Develop the bishop actively to g5 pinning the knight, then finish development.", eval: 0.4 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["c4d5", "e6d5", "d1b3"], reason: "Opening the center too early without finishing development gives Black easy play." },
      { moves: ["e2e4", "d5e4", "c3e4"], reason: "Premature central push loses a pawn and disrupts your own structure." },
    ]),
    explanation: "In this Queen's Gambit Declined position, White should prioritize completing development (Bg5 or e3 + Bd3 + O-O) before initiating central action. Pushing e4 prematurely or exchanging on d5 without preparation lets Black equalize easily. The key principle: finish development before creating confrontation.",
  },
  {
    fen: "r2q1rk1/pp2ppbp/2np1np1/8/2PNP3/2N1BP2/PP4PP/R2QKB1R w KQ - 0 9",
    sideToMove: "white",
    goal: "You have a space advantage in the King's Indian. Plan your next 2–3 moves.",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2200,
    goodPlans: JSON.stringify([
      { moves: ["f1e2", "e1g1", "d1d2"], summary: "Complete kingside development, castle, connect rooks, and prepare for queenside expansion with b4.", eval: 0.5 },
      { moves: ["f1e2", "e1g1", "f3f4"], summary: "Develop, castle, and prepare the f4-f5 pawn storm on the kingside.", eval: 0.6 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["g2g4", "h2h4", "g4g5"], reason: "Launching a kingside pawn storm before castling is reckless — your king is stuck in the center." },
    ]),
    explanation: "In the King's Indian, White's main plans involve either queenside expansion (a4-b4) or a kingside pawn storm (f4-f5). But first, you must finish development: Be2 and O-O are essential. Only then can you choose your attacking plan based on Black's setup. King safety first, aggression second.",
  },
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    sideToMove: "white",
    goal: "It's move 3 in the Italian/Ruy Lopez. What's your opening plan?",
    difficulty: 1,
    ratingMin: 1000,
    ratingMax: 1600,
    goodPlans: JSON.stringify([
      { moves: ["f1c4", "d2d3", "e1g1"], summary: "Italian Game setup: develop the bishop to c4, support the center with d3, castle kingside.", eval: 0.2 },
      { moves: ["f1b5", "e1g1", "d2d3"], summary: "Ruy Lopez: Bb5 to pressure the knight defending e5, castle quickly, prepare central play.", eval: 0.3 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["d2d4", "e4d4", "f3d4"], reason: "Scotch Game is playable, but if you didn't intend it, you're releasing central tension too early." },
      { moves: ["f1e2", "d2d3", "c1e3"], reason: "Be2 is passive — it blocks the queen and doesn't put pressure on f7 or the center." },
    ]),
    explanation: "At this stage of the Italian/Ruy Lopez, the key principle is active piece development toward the center and kingside. Bc4 targets f7, Bb5 pressures the knight on c6. Both are excellent. The plan should include quick castling and preparing d3 (or d4 after proper preparation).",
  },
  {
    fen: "r1bq1rk1/pp3ppp/2n1pn2/2pp4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 7",
    sideToMove: "white",
    goal: "Black has pinned your knight. How do you address this and develop?",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2000,
    goodPlans: JSON.stringify([
      { moves: ["e1g1", "a2a3", "b4c3"], summary: "Castle first (unpinning), then chase the bishop with a3, gaining the bishop pair and tempo.", eval: 0.4 },
      { moves: ["c1d2", "e1g1", "a2a3"], summary: "Develop the bishop to d2 breaking the pin, castle, then expand on the queenside.", eval: 0.3 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a2a3", "b4c3", "b2c3"], reason: "Playing a3 before castling wastes time — your king is still in the center." },
    ]),
    explanation: "When pinned, the priority is to resolve the pin without compromising your position. Castling (O-O) unpins the knight naturally. Then a3 forces the bishop to decide. Bd2 is also fine, breaking the pin directly. The key lesson: don't panic about pins — address them calmly while continuing development.",
  },
  {
    fen: "r4rk1/pp1q1ppp/2nbpn2/3p4/3P1B2/2PB1N2/PP1Q1PPP/R3R1K1 w - - 0 12",
    sideToMove: "white",
    goal: "You have a strong center. How do you improve your pieces over the next 2–3 moves?",
    difficulty: 4,
    ratingMin: 1600,
    ratingMax: 2400,
    goodPlans: JSON.stringify([
      { moves: ["f3e5", "f2f3", "e1e2"], summary: "Centralize the knight on e5 (the ideal outpost), support it with f3, then double rooks.", eval: 0.6 },
      { moves: ["a1e1", "f3e5", "f2f3"], summary: "Activate the rook first, then plant the knight on e5 with full support.", eval: 0.5 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["f4h6", "d2h6", "f3g5"], reason: "Trading the dark-squared bishop removes your best piece — Black's bishop on d6 is passive." },
    ]),
    explanation: "The e5 square is a dream outpost for the knight — it can't be kicked by pawns and controls critical squares. The plan should revolve around Ne5, supporting it with f3, and connecting the rooks. Don't trade your active bishop for Black's passive one. Improve your worst-placed piece (the a1 rook) and centralize everything.",
  },
];

const opponentPlanExercises = [
  {
    fen: "r1bq1rk1/ppp2ppp/2n2n2/3pp3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 b - - 0 6",
    sideToMove: "black",
    goal: "What is White's plan in the next 2–3 moves? Then propose your counter-plan.",
    difficulty: 2,
    ratingMin: 1200,
    ratingMax: 1800,
    goodPlans: JSON.stringify([
      {
        moves: ["d5d4", "c6a5", "a5c4"],
        summary: "Opponent wants to play d4, opening the center. Counter by pushing d4 yourself to lock the center, then reroute the knight to attack the bishop.",
        eval: 0.0,
      },
      {
        moves: ["c8g4", "d5e4", "c6d4"],
        summary: "Opponent aims for Bg5 and Nbd2. Counter with Bg4 to pin, then exd4 to clarify the center in your favor.",
        eval: -0.1,
      },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a7a6", "b7b5", "c8b7"], reason: "Queenside expansion ignores White's central plans — you'll be run over in the center." },
    ]),
    explanation: "White's plan here is to play d4 (after preparation with Nbd2, Re1) to open the center where the bishop on c4 is strong. Black should either lock the center with ...d4, or counter in the center with ...dxe4. Ignoring the center and playing on the wings is a classic club-player mistake. Always ask: what does my opponent want?",
  },
  {
    fen: "r2qr1k1/pp1bbppp/2n1pn2/3p4/3P1B2/2NBPN2/PP3PPP/R2Q1RK1 b - - 5 10",
    sideToMove: "black",
    goal: "White has a London System setup. What is White threatening? What's your plan?",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2200,
    goodPlans: JSON.stringify([
      {
        moves: ["f6h5", "h5f4", "e3f4"],
        summary: "White wants Ne5 + Qf3 + attack on the kingside. Counter by playing Nh5 to trade the strong bishop on f4, neutralizing the attack.",
        eval: -0.1,
      },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a7a6", "b7b5", "c8b7"], reason: "Queenside play is too slow — White's kingside buildup with Ne5-Qf3 arrives first." },
    ]),
    explanation: "In the London System, White's typical plan is Ne5, Qf3, and potentially h4-h5 for a kingside attack. The dark-squared bishop on f4 is White's best piece. Black's best counter is to trade it off with ...Nh5, which defuses the entire attack plan. Recognizing the opponent's key piece and targeting it is a hallmark of strong play.",
  },
  {
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/2P1P3/2N1BN2/PP2BPPP/R2QK2R b KQ - 3 7",
    sideToMove: "black",
    goal: "White hasn't castled yet. What's their plan? How do you exploit the delay?",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2000,
    goodPlans: JSON.stringify([
      {
        moves: ["e7e5", "f6d7", "f7f5"],
        summary: "White wants to castle and play d4. Strike with ...e5 before White castles to open the center against the uncastled king.",
        eval: -0.3,
      },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a7a6", "b7b5", "c8b7"], reason: "Slow queenside play lets White castle safely and take control of the center." },
    ]),
    explanation: "When your opponent hasn't castled, the center is your weapon. Opening the center with ...e5 creates immediate problems for White's king. The principle: an uncastled king is a target — use central pawn breaks to expose it before they complete development.",
  },
  {
    fen: "r2q1rk1/pp2bppp/2n1bn2/3pp3/8/1BN1PN2/PP2QPPP/R1B2RK1 b - - 0 9",
    sideToMove: "black",
    goal: "White has the bishop on b3 eyeing f7. What's their plan? Defend accordingly.",
    difficulty: 2,
    ratingMin: 1200,
    ratingMax: 1800,
    goodPlans: JSON.stringify([
      {
        moves: ["d5d4", "e6e5", "c6a5"],
        summary: "White aims for Ng5 + Qh5 attacking f7. Block with ...d4 closing lines, then ...Na5 to trade the dangerous bishop.",
        eval: -0.2,
      },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a7a6", "b7b5", "c8b7"], reason: "Ignoring the f7 threat is dangerous — White can build a strong attack with Ng5 and Qh5." },
    ]),
    explanation: "The bishop on b3 combined with a knight on g5 is a classic attacking pattern against f7. Black must either close the diagonal (...d4), trade the bishop (...Na5), or reinforce f7 (...Qd6). The key defensive instinct: identify the target square (f7) and fortify it before the opponent's pieces converge.",
  },
  {
    fen: "r1bq1rk1/pp1n1ppp/4pn2/2ppP3/3P4/2PB1N2/PP3PPP/R1BQ1RK1 b - - 0 8",
    sideToMove: "black",
    goal: "White has a pawn on e5. What's White's attacking plan? How do you counter it?",
    difficulty: 4,
    ratingMin: 1600,
    ratingMax: 2400,
    goodPlans: JSON.stringify([
      {
        moves: ["c5c4", "d7b6", "c8d7"],
        summary: "White wants Ng5-Qh5 or Bxh7+ sac. Play ...c4 to deflect the bishop, then ...Nb6 to control d5 and reorganize. The key is blocking the Bd3-h7 diagonal.",
        eval: -0.2,
      },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["f7f5", "e5f6", "d7f6"], reason: "...f5 weakens the kingside fatally — after exf6 Nxf6, the e6 pawn is backward and the king is exposed." },
    ]),
    explanation: "In French Defense structures with e5, White's plan is typically a kingside attack: Ng5, Qh5, or the classic Bxh7+ Greek Gift sacrifice. Black must counter on the queenside (c4 to deflect the bishop) and keep the kingside sealed. Opening the f-file with ...f5 is almost always wrong in these structures — it helps White's attack.",
  },
];

const tradeExercises = [
  {
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 w - - 0 8",
    sideToMove: "white",
    goal: "You can capture on d6 (Bxf6 or take on c6). Should you trade?",
    difficulty: 2,
    ratingMin: 1200,
    ratingMax: 1800,
    tradeAnswer: "avoid",
    tradeThemes: "minor_piece,space_advantage",
    goodPlans: JSON.stringify([
      { moves: ["c1e3", "d1d2", "a1d1"], summary: "Avoid trading — your pieces are more active. Keep the tension and build pressure.", eval: 0.5 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["c4f7", "f8f7", "f3g5"], reason: "The sacrifice on f7 is unsound here — Black can defend with ...Rf7 and the knight on g5 gets trapped." },
    ]),
    explanation: "When you have a space advantage (pawns on d4 and e4), avoid trading pieces! More pieces on the board amplifies your space advantage because your opponent's pieces are cramped. Trading helps the defender breathe. Keep pieces, increase pressure, make the cramp uncomfortable. Classic principle: the side with more space should avoid exchanges.",
  },
  {
    fen: "r2q1rk1/pp2bppp/2n1bn2/3pP3/5B2/2N2N2/PPP1QPPP/R3KB1R w KQ - 0 9",
    sideToMove: "white",
    goal: "Your bishop on f4 can be exchanged. Should you trade bishops or retreat?",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2200,
    tradeAnswer: "avoid",
    tradeThemes: "good_bishop,opposite_color_bishops",
    goodPlans: JSON.stringify([
      { moves: ["f4g3", "f1d3", "e1g1"], summary: "Retreat the bishop — it's your best piece, controlling key dark squares. Don't exchange strength for weakness.", eval: 0.4 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["f4d6", "e7d6", "d1d6"], reason: "Trading your active bishop for Black's passive one is a positional error. You're helping Black fix their bad piece." },
    ]),
    explanation: "Your bishop on f4 is active and controls important dark squares. Black's bishop on e7 is passive. Never trade your good pieces for your opponent's bad ones — that's like swapping your MVP for their bench player. Instead, reposition to g3 where the bishop stays active while being safe. Principle: trade your bad pieces, keep your good ones.",
  },
  {
    fen: "2rq1rk1/pp1bppbp/2np1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9",
    sideToMove: "white",
    goal: "Black offers to trade rooks on the c-file. Should you exchange rooks?",
    difficulty: 3,
    ratingMin: 1400,
    ratingMax: 2200,
    tradeAnswer: "trade",
    tradeThemes: "rook_exchange,space_advantage",
    goodPlans: JSON.stringify([
      { moves: ["c1e3", "a1c1", "c1c8"], summary: "Trade one pair of rooks on c-file. With space advantage, trading one pair helps control the open file; keeping one rook maintains attacking chances.", eval: 0.6 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["a1b1", "b2b3", "c1d2"], reason: "Avoiding the c-file entirely lets Black dominate the only open file." },
    ]),
    explanation: "This is a nuanced case. Trading ONE pair of rooks is often correct when you have a space advantage — it simplifies just enough to make your advantage easier to convert while keeping enough firepower. The key: don't trade ALL your heavy pieces (you need them for attacking), but don't concede the open file either. Partial exchanges can be a powerful tool.",
  },
  {
    fen: "r2qr1k1/pppb1ppp/2n2n2/3pp3/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 7",
    sideToMove: "white",
    goal: "Should you trade pawns in the center (cxd5 or dxe5)?",
    difficulty: 2,
    ratingMin: 1200,
    ratingMax: 1800,
    tradeAnswer: "trade_after_improving",
    tradeThemes: "central_tension,pawn_structure",
    goodPlans: JSON.stringify([
      { moves: ["e1g1", "a2a3", "c4d5"], summary: "Castle first, chase the bishop with a3, THEN trade in the center when your pieces are ready to exploit the resulting structure.", eval: 0.4 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["c4d5", "e6d5", "d4e5"], reason: "Releasing central tension before castling or completing development gives Black easy play." },
    ]),
    explanation: "The decision to trade in the center should be based on readiness, not urgency. Principle: 'Trade after improving.' Castle first (your king is in the center!), kick the bishop with a3, and THEN open the center when your pieces are ready to exploit it. Premature pawn exchanges in the center often help the opponent develop naturally.",
  },
  {
    fen: "r1b2rk1/pp1nqppp/4pn2/2ppP3/3P4/P1N2N2/1PQ2PPP/R1B1KB1R w KQ - 0 9",
    sideToMove: "white",
    goal: "Should you exchange queens (Qxe7) or keep them on?",
    difficulty: 4,
    ratingMin: 1600,
    ratingMax: 2400,
    tradeAnswer: "avoid",
    tradeThemes: "queen_exchange,attacking_potential",
    goodPlans: JSON.stringify([
      { moves: ["f1d3", "e1g1", "c1g5"], summary: "Keep queens on! You have a kingside attack brewing with Bd3-Qc2-h7, Bg5, and Ng5. Queens amplify your attacking chances.", eval: 0.5 },
    ]),
    wrongPlans: JSON.stringify([
      { moves: ["c2e2", "e2e7", "f8e7"], reason: "Trading queens kills your attack. The resulting endgame is roughly equal, wasting your better piece activity." },
    ]),
    explanation: "Queens amplify attacking potential. If you have a kingside attack (Bd3 pointing at h7, possibility of Bg5 and Ng5), keeping queens on the board is essential. Trade queens only when: (1) you're better in the endgame, (2) you're defending, or (3) the queen exchange wins material. Here, the queen is your attacking general — don't dismiss her!",
  },
];

async function seedCustomModes() {
  console.log("Seeding custom mode exercises...");

  // Clear existing
  await prisma.customModeAttempt.deleteMany();
  await prisma.customModeExercise.deleteMany();

  for (const ex of planExercises) {
    await prisma.customModeExercise.create({
      data: { mode: "plan", ...ex },
    });
  }

  for (const ex of opponentPlanExercises) {
    await prisma.customModeExercise.create({
      data: { mode: "opponent_plan", ...ex },
    });
  }

  for (const ex of tradeExercises) {
    await prisma.customModeExercise.create({
      data: { mode: "trade", ...ex },
    });
  }

  console.log(`Seeded ${planExercises.length + opponentPlanExercises.length + tradeExercises.length} custom mode exercises.`);
}

seedCustomModes()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
