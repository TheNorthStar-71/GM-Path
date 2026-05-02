import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("DemoPass123!@#", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@gmpath.com" },
    update: { role: "super_admin" },
    create: {
      role: "super_admin",
      email: "demo@gmpath.com",
      name: "Alex Fischer",
      passwordHash,
      profile: {
        create: {
          ratingBlitz: 1350,
          ratingRapid: 1420,
          ratingClassical: 1480,
          ratingPuzzle: 1550,
          goal: "reach_1800",
          hoursPerWeek: 7,
          improvementTrack: "serious",
          age: 28,
          tournamentExperience: "club",
          skillOpening: 6,
          skillMiddlegame: 5,
          skillTactics: 7,
          skillStrategy: 5,
          skillEndgame: 4,
          skillCalculation: 5,
          skillTimeManagement: 6,
          primaryWeakness: "endgame",
          secondaryWeakness: "calculation",
          strengthArea: "tactics",
          onboardingComplete: true,
          preferredOpeningsWhite: ["1.e4"],
          preferredOpeningsBlack: ["Sicilian", "King's Indian"],
        },
      },
    },
  });

  // Seed puzzles
  const puzzles = [
    {
      fen: "r1b1k2r/pppp1ppp/2n2n2/2b1p2q/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
      moves: "Nxe5 Nxe5 Bxf7+",
      rating: 1250,
      themes: ["fork", "discovered_attack"],
      phase: "middlegame",
      explanation: "White exploits the undefended queen on h5 with a discovered attack through Nxe5.",
    },
    {
      fen: "r4rk1/pp1b1ppp/1qn1pn2/8/2BN4/2N1B3/PPP2PPP/R2Q1RK1 w - - 0 12",
      moves: "Nxe6 fxe6 Bxe6+",
      rating: 1450,
      themes: ["fork", "removal_of_defender"],
      phase: "middlegame",
      explanation: "Nxe6 removes the pawn defender, and after fxe6, Bxe6+ forks the king and rook.",
    },
    {
      fen: "2r3k1/5pp1/p3p2p/1p6/3Pn3/1B2PN2/PP3PPP/3R2K1 w - - 0 24",
      moves: "Bxe6 fxe6 Nd2",
      rating: 1350,
      themes: ["pin", "removal_of_defender"],
      phase: "endgame",
      explanation: "Bxe6 exploits the pin on the f7 pawn, winning the knight on e4.",
    },
    {
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      moves: "Ng5 d5 exd5",
      rating: 1100,
      themes: ["attack", "center_control"],
      phase: "opening",
      explanation: "Ng5 attacks f7, the weakest point in Black's position. This is the Fried Liver idea.",
    },
    {
      fen: "r2q1rk1/ppp2ppp/2nb4/3nN3/3P4/8/PPP2PPP/RNBQ1RK1 w - - 0 10",
      moves: "Nxd6 cxd6 Bxd5",
      rating: 1500,
      themes: ["deflection", "discovered_attack"],
      phase: "middlegame",
      explanation: "Nxd6 deflects a defender, then Bxd5 wins material with a discovered attack.",
    },
    {
      fen: "r1b2rk1/pp3ppp/2n1pn2/q1bp4/3P4/2NBB3/PPP1NPPP/R2Q1RK1 w - - 0 9",
      moves: "dxc5 Bxc5 b4",
      rating: 1600,
      themes: ["pawn_fork", "space"],
      phase: "middlegame",
      explanation: "dxc5 followed by b4 wins a piece with a pawn fork on the bishop and queen.",
    },
    {
      fen: "6k1/5ppp/p7/1p6/2p5/2P2P2/PP4PP/6K1 w - - 0 30",
      moves: "a4 bxa4 bxa4",
      rating: 1200,
      themes: ["passed_pawn", "endgame_technique"],
      phase: "endgame",
      explanation: "a4 creates an outside passed pawn that will distract the Black king.",
    },
    {
      fen: "r3kb1r/pp1n1ppp/2p1pn2/q7/3P4/2N2N2/PPP1BPPP/R1BQ1RK1 w kq - 0 8",
      moves: "e4 e5 Bg5",
      rating: 1400,
      themes: ["center_control", "pin"],
      phase: "middlegame",
      explanation: "e4 seizes the center and prepares Bg5 pin on the knight.",
    },
    {
      fen: "r1bq1rk1/ppp2ppp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQR1K1 w - - 0 7",
      moves: "Nxe5 Nxe5 Rxe5",
      rating: 1300,
      themes: ["fork", "tactical_sequence"],
      phase: "middlegame",
      explanation: "Nxe5 wins a pawn. After Nxe5, Rxe5 keeps material advantage.",
    },
    {
      fen: "r4rk1/pppq1ppp/2n1bn2/4p3/2B1P3/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 8",
      moves: "Bg5 h6 Bxf6",
      rating: 1550,
      themes: ["pin", "exchange"],
      phase: "middlegame",
      explanation: "Bg5 pins the knight to the queen. After h6, Bxf6 wins the knight or damages the pawn structure.",
    },
    {
      fen: "r1bqk2r/ppppbppp/2n5/4P3/4n3/5N2/PPP1BPPP/RNBQK2R w KQkq - 1 6",
      moves: "O-O O-O d4",
      rating: 1150,
      themes: ["development", "center_control"],
      phase: "opening",
      explanation: "Castling first, then seizing the center with d4 is the principled approach.",
    },
    {
      fen: "2r2rk1/pp1bppbp/6p1/q2pN3/3P4/4B3/PPP1BPPP/R2Q1RK1 w - - 0 14",
      moves: "Nxd7 Qxd7 Bf4",
      rating: 1650,
      themes: ["exchange", "positional"],
      phase: "middlegame",
      explanation: "Nxd7 exchanges the strong knight for the bishop, then Bf4 controls key diagonals.",
    },
  ];

  for (const puzzle of puzzles) {
    await prisma.puzzle.upsert({
      where: { id: `puzzle-${puzzle.rating}-${puzzle.themes[0]}` },
      update: {},
      create: {
        id: `puzzle-${puzzle.rating}-${puzzle.themes[0]}`,
        ...puzzle,
      },
    });
  }

  // Seed endgame modules
  const endgameModules = [
    {
      id: "eg-king-pawn",
      title: "King & Pawn Basics",
      category: "king_pawn",
      subcategory: "basics",
      difficulty: 1,
      description: "The fundamental building blocks of endgame play. Learn the square rule, key squares, and basic pawn promotion techniques.",
      order: 1,
    },
    {
      id: "eg-opposition",
      title: "Opposition",
      category: "king_pawn",
      subcategory: "opposition",
      difficulty: 2,
      description: "Direct and distant opposition, triangulation, and corresponding squares.",
      order: 2,
    },
    {
      id: "eg-lucena",
      title: "Lucena & Philidor",
      category: "rook",
      subcategory: "lucena_philidor",
      difficulty: 3,
      description: "The two most important rook endgame positions. Learn the bridge technique and Philidor defense.",
      order: 3,
    },
    {
      id: "eg-rook-basic",
      title: "Basic Rook Endings",
      category: "rook",
      subcategory: "basics",
      difficulty: 4,
      description: "Rook vs passed pawn, active vs passive rook, cutting off the king.",
      order: 4,
    },
    {
      id: "eg-minor",
      title: "Minor Piece Endings",
      category: "minor_piece",
      subcategory: "basics",
      difficulty: 5,
      description: "Good vs bad bishop, opposite-colored bishops, bishop vs knight.",
      order: 5,
    },
    {
      id: "eg-queen",
      title: "Queen Endings",
      category: "queen",
      subcategory: "basics",
      difficulty: 6,
      description: "Queen vs pawn, queen vs queen with pawns, perpetual check patterns.",
      order: 6,
    },
  ];

  for (const module of endgameModules) {
    await prisma.endgameModule.upsert({
      where: { id: module.id },
      update: {},
      create: module,
    });
  }

  // Seed endgame positions
  const endgamePositions = [
    {
      id: "ep-1",
      moduleId: "eg-king-pawn",
      fen: "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1",
      objective: "win",
      solution: "Ke2 is the key move to maintain opposition and promote the pawn.",
      explanation: "With the pawn on e2 and White to move, the key is to advance the king first, not the pawn. Ke2 maintains central control.",
      order: 1,
    },
    {
      id: "ep-2",
      moduleId: "eg-king-pawn",
      fen: "8/8/4k3/8/8/4K3/4P3/8 w - - 0 1",
      objective: "win",
      solution: "Kf4! to take opposition, then advance the pawn at the right moment.",
      explanation: "The key is reaching a position where your king is in front of the pawn with opposition. Kf4 is the winning move.",
      order: 2,
    },
    {
      id: "ep-3",
      moduleId: "eg-opposition",
      fen: "8/8/8/3k4/8/3K4/3P4/8 w - - 0 1",
      objective: "win",
      solution: "Ke3! Direct opposition. Black must give way.",
      explanation: "By playing Ke3, White takes the direct opposition. Black must move aside, allowing White's king to advance.",
      order: 1,
    },
    {
      id: "ep-4",
      moduleId: "eg-lucena",
      fen: "1K6/1P1k4/8/8/8/8/1r6/5R2 w - - 0 1",
      objective: "win",
      solution: "Rd1+ Ke7 Re1+ Kf6 Re4! (building the bridge) then Kc7 Rc4+ etc.",
      explanation: "The Lucena position with the bridge technique. White uses the rook to shield the king from checks.",
      order: 1,
    },
    {
      id: "ep-5",
      moduleId: "eg-lucena",
      fen: "8/2k5/8/1PK5/8/8/8/4r3 b - - 0 1",
      objective: "draw",
      solution: "Re6! The Philidor defense. Cut off the king on the 6th rank, then switch to checking from behind.",
      explanation: "The Philidor defense: place the rook on the 6th rank to prevent the king from advancing, then check from behind when the pawn advances.",
      order: 2,
    },
  ];

  for (const pos of endgamePositions) {
    await prisma.endgamePosition.upsert({
      where: { id: pos.id },
      update: {},
      create: pos,
    });
  }

  // Seed openings
  const openings = [
    {
      id: "op-sicilian",
      name: "Sicilian Defense",
      eco: "B20",
      color: "black",
      strategicGoals: "Counter-attack on the queenside while White attacks on the kingside. Fight for the d5 square. Use the half-open c-file.",
      pawnStructures: "Typical structures include the Scheveningen (pawns on d6, e6), Dragon (pawns on d6, g6), and Najdorf (pawns on a6, d6, e5).",
      tacticalMotifs: "Nd4 sacrifices, exchange sacrifice on c3, d5 pawn break, kingside attacks after long castling.",
      commonMistakes: "Playing passively, not challenging White's center, neglecting development for pawn moves.",
      keyPlans: "1. Control d5 and prepare ...d5 break\n2. Counter on the c-file after ...dxc\n3. Prepare queenside attack if White castles long",
    },
    {
      id: "op-italian",
      name: "Italian Game",
      eco: "C50",
      color: "white",
      strategicGoals: "Build a strong center with d4, develop pieces rapidly, and create kingside attacking chances.",
      pawnStructures: "After d4 exd4 Nxd4, White has a classical center. The Giuoco Piano leads to slower positional play.",
      tacticalMotifs: "Sacrifice on f7, discovered attacks with Ng5, pin on the d-file.",
      commonMistakes: "Playing d4 too early without preparation, neglecting queenside development.",
      keyPlans: "1. Play d4 at the right moment\n2. Use the bishop pair actively\n3. Create pressure on f7",
    },
    {
      id: "op-qgd",
      name: "Queen's Gambit Declined",
      eco: "D30",
      color: "black",
      strategicGoals: "Maintain solid pawn structure, develop pieces harmoniously, prepare ...c5 or ...e5 breaks.",
      pawnStructures: "Carlsbad structure (pawns on d5, e6 vs d4, e3) or Semi-Tarrasch with IQP.",
      tacticalMotifs: "Central pawn breaks, minority attack defense, piece exchanges to relieve pressure.",
      commonMistakes: "Passive play, not challenging White's center, getting a cramped position.",
      keyPlans: "1. Develop the light-squared bishop before playing ...e6\n2. Prepare ...c5 to challenge the center\n3. Activate pieces before committing to pawn structure",
    },
  ];

  for (const opening of openings) {
    await prisma.opening.upsert({
      where: { id: opening.id },
      update: {},
      create: {
        ...opening,
        modelGameIds: [],
      },
    });
  }

  // Seed a demo game
  await prisma.game.upsert({
    where: { id: "demo-game-1" },
    update: {},
    create: {
      id: "demo-game-1",
      userId: user.id,
      pgn: `[Event "Rapid Game"]
[Site "Online"]
[Date "2024.03.10"]
[White "Alex Fischer"]
[Black "Opponent_1847"]
[Result "0-1"]
[WhiteElo "1420"]
[BlackElo "1520"]
[TimeControl "600+5"]
[ECO "B90"]
[Opening "Sicilian Defense, Najdorf"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be7
8. f3 O-O 9. Qd2 Be6 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Nd5 Bxd5
14. exd5 g6 15. Rg1 Nb6 16. Na5 Nc4 17. Bxc4 bxc4 18. Nc6 Qd7 19. Nxe7+
Qxe7 20. Bh6 Rfb8 21. Qe2 Nf4 22. Qxc4 Rb4 23. Qc6 Rab8 0-1`,
      white: "Alex Fischer",
      black: "Opponent_1847",
      result: "0-1",
      date: new Date("2024-03-10"),
      event: "Rapid Game",
      timeControl: "rapid",
      eco: "B90",
      opening: "Sicilian Defense, Najdorf",
      source: "manual",
      selfReviewComplete: true,
      engineReviewComplete: true,
      accuracy: 78.5,
      averageCentipawnLoss: 32,
    },
  });

  // Seed model games
  const modelGames = [
    {
      id: "model-1",
      pgn: `[Event "Candidates 1971"]
[White "Fischer"]
[Black "Petrosian"]
[Result "1-0"]
1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nc6 6. Nxc6 bxc6 7. O-O d5 8. c4 Nf6 9. cxd5 cxd5 10. exd5 exd5 11. Nc3 Be7 12. Qa4+ Qd7 13. Re1 Qxa4 14. Nxa4 Be6 15. Be3 O-O 16. Bc5 Rfe8 17. Bxe7 Rxe7 18. b4 1-0`,
      white: "Fischer",
      black: "Petrosian",
      result: "1-0",
      year: 1971,
      event: "Candidates Match",
      eco: "B17",
      opening: "Sicilian Defense",
      themes: ["endgame", "positional", "pawn_structure"],
      annotations: "A masterclass in exploiting an isolated pawn. Fischer demonstrates how to transition from middlegame to a winning endgame.",
      difficulty: 7,
    },
    {
      id: "model-2",
      pgn: `[Event "Zurich 1953"]
[White "Keres"]
[Black "Geller"]
[Result "1-0"]
1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 c6 8. Nge2 cxd5 9. cxd5 Nbd7 10. Qd2 a6 11. g4 b5 12. Ng3 Nb6 13. a4 bxa4 14. Nxa4 Nxa4 15. Rxa4 Nd7 16. Be2 f5 17. gxf5 gxf5 18. exf5 Rxf5 19. O-O 1-0`,
      white: "Keres",
      black: "Geller",
      result: "1-0",
      year: 1953,
      event: "Zurich Candidates",
      eco: "E73",
      opening: "King's Indian Defense",
      themes: ["attack", "kingside", "pawn_storm"],
      annotations: "A classical King's Indian battle. White's f3-g4 setup aims to restrict Black's counterplay while preparing a kingside attack.",
      difficulty: 6,
    },
  ];

  for (const game of modelGames) {
    await prisma.modelGame.upsert({
      where: { id: game.id },
      update: {},
      create: game,
    });
  }

  // Seed progress snapshots for the demo user
  const dates = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  for (let i = 0; i < dates.length; i++) {
    await prisma.progressSnapshot.create({
      data: {
        userId: user.id,
        date: dates[i],
        ratingBlitz: 1300 + Math.floor(i * 1.7) + Math.floor(Math.random() * 15 - 7),
        ratingRapid: 1370 + Math.floor(i * 1.5) + Math.floor(Math.random() * 12 - 6),
        ratingPuzzle: 1500 + Math.floor(i * 2) + Math.floor(Math.random() * 20 - 10),
        tacticalAccuracy: 65 + i * 0.3 + Math.random() * 5,
        calculationDepth: 50 + i * 0.4 + Math.random() * 4,
        endgameAccuracy: 40 + i * 0.5 + Math.random() * 6,
        openingRetention: 60 + i * 0.2 + Math.random() * 5,
        conversionRate: 55 + i * 0.3 + Math.random() * 8,
        defensiveSaveRate: 40 + i * 0.35 + Math.random() * 6,
        avgCentipawnLoss: 45 - i * 0.4 + Math.random() * 5,
        timeTroubleFreq: 35 - i * 0.3 + Math.random() * 5,
        blunderRate: 12 - i * 0.2 + Math.random() * 2,
        motifScores: {
          fork: 75 + i * 0.3,
          pin: 68 + i * 0.25,
          skewer: 60 + i * 0.2,
          back_rank: 72 + i * 0.15,
          discovery: 55 + i * 0.35,
          deflection: 45 + i * 0.3,
        },
        trainingMinutes: 30 + Math.floor(Math.random() * 40),
        tasksCompleted: 3 + Math.floor(Math.random() * 5),
        streakDays: Math.min(i + 1, 12),
      },
    });
  }

  // Seed a training plan
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  const plan = await prisma.trainingPlan.create({
    data: {
      userId: user.id,
      weekOf: weekStart,
    },
  });

  const tasks = [
    { day: 0, category: "tactics", title: "Pattern Recognition Drill", description: "Solve 15 puzzles focused on forks and pins", duration: 20, order: 0 },
    { day: 0, category: "game_review", title: "Self-Annotate Recent Game", description: "Review your last rapid game without engine help", duration: 25, order: 1 },
    { day: 0, category: "endgame", title: "Rook Endgame Technique", description: "Lucena and Philidor positions practice", duration: 20, order: 2 },
    { day: 1, category: "tactics", title: "Woodpecker Repetition", description: "Re-solve yesterday's puzzles for speed", duration: 15, order: 3 },
    { day: 1, category: "opening", title: "Opening Line Review", description: "Spaced repetition for your Sicilian lines", duration: 15, order: 4 },
    { day: 1, category: "calculation", title: "Candidate Move Training", description: "Find all candidate moves in 5 positions", duration: 20, order: 5 },
    { day: 2, category: "tactics", title: "Tactical Survival", description: "Puzzle survival mode: how many in a row?", duration: 20, order: 6 },
    { day: 2, category: "middlegame", title: "Pawn Structure Study", description: "IQP positions — plans for both sides", duration: 15, order: 7 },
    { day: 2, category: "endgame", title: "Endgame Flash Positions", description: "Quick assessment: win, draw, or loss?", duration: 15, order: 8 },
    { day: 3, category: "game_review", title: "Engine-Assisted Review", description: "Check your self-analysis with the engine", duration: 25, order: 9 },
    { day: 3, category: "tactics", title: "Motif Focus: Discoveries", description: "Targeted puzzles on discovered attacks", duration: 20, order: 10 },
    { day: 4, category: "opening", title: "Sideline Preparation", description: "Study common anti-Sicilian systems", duration: 20, order: 11 },
    { day: 4, category: "calculation", title: "Deep Calculation Exercise", description: "Calculate forcing sequences 5 moves deep", duration: 20, order: 12 },
    { day: 5, category: "model_games", title: "Guess the Master Move", description: "Fischer vs Petrosian 1971 — try to guess each move", duration: 25, order: 13 },
    { day: 5, category: "tactics", title: "Spaced Repetition Review", description: "Review puzzles from this week using SRS", duration: 15, order: 14 },
  ];

  for (const task of tasks) {
    await prisma.trainingTask.create({
      data: {
        planId: plan.id,
        ...task,
        completed: task.order < 3, // First 3 tasks completed
      },
    });
  }

  // Seed coach reports
  await prisma.coachReport.create({
    data: {
      userId: user.id,
      type: "weekly",
      title: "Week of March 4–10",
      content: "Solid training week with consistent puzzle work. Game review revealed recurring calculation issues in the middlegame.",
      insights: {
        strengths: ["Tactical pattern recognition improved 8%"],
        weaknesses: ["Calculation depth still 1 move short in complex positions"],
        actions: ["Add 3 extra calculation exercises per day this week"],
      },
      period: "2024-W10",
    },
  });

  await prisma.coachReport.create({
    data: {
      userId: user.id,
      type: "plateau",
      title: "Plateau Diagnosis — Rating 1350-1400",
      content: "Your rating has been stuck for 6 weeks. Analysis shows three key factors: shallow opening understanding, impatient middlegame decisions, and endgame avoidance.",
      insights: {
        bottlenecks: [
          "You know opening moves but not the plans that follow",
          "Impatient pawn pushes in equal positions",
          "Endgame study avoidance is costing you half-points",
        ],
        prescription: "Shift 30% of training from tactics to endgames and opening ideas for 3 weeks",
      },
      period: "2024-02",
    },
  });

  const morePuzzles = [
    {
      id: "puzzle-1300-skewer",
      fen: "4r3/5k2/6p1/7B/5N2/8/PPP2PPP/6K1 w - - 0 30",
      moves: "Bxg6+ Ke7 Bxe8",
      rating: 1300,
      themes: ["skewer"],
      phase: "endgame",
      explanation: "Bxg6+ removes the pawn and checks the king. The bishop on g6 skewers the king and the rook on e8 along the same diagonal. After the king moves, Bxe8 wins the exchange.",
    },
    {
      id: "puzzle-1700-skewer",
      fen: "4k3/pp3p2/8/8/r7/8/PP4BP/6K1 w - - 0 40",
      moves: "Bc6+ Kd8 Bxa4",
      rating: 1700,
      themes: ["skewer"],
      phase: "endgame",
      explanation: "Bc6+ skewers the king on the a4-e8 diagonal. After Kd8, Bxa4 captures the undefended rook. The key is recognizing the long diagonal geometry.",
    },
    {
      id: "puzzle-1000-back_rank",
      fen: "6k1/ppp2ppp/8/4r3/8/8/PPP2PPP/3R2K1 w - - 0 30",
      moves: "Rd8+ Re8 Rxe8#",
      rating: 1000,
      themes: ["back_rank", "checkmate"],
      phase: "endgame",
      explanation: "Rd8+ forces the rook to interpose with Re8. Rxe8# is checkmate — the f7, g7, h7 pawns trap the king with no escape squares on the back rank.",
    },
    {
      id: "puzzle-1500-back_rank",
      fen: "2r2rk1/pp2bppp/4p3/2B5/4n3/6P1/PPP1QPKP/3RR3 w - - 0 20",
      moves: "Bxe7 Rxc2 Rd8 Rxd8 Rxd8#",
      rating: 1500,
      themes: ["back_rank", "sacrifice"],
      phase: "middlegame",
      explanation: "Bxe7 wins a piece and clears c5. After Rxc2, Rd8 forces the exchange and Rxd8# is back rank mate — the e7 bishop removal was key to opening the d-file.",
    },
    {
      id: "puzzle-900-mate_pattern",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
      moves: "Qxf7#",
      rating: 900,
      themes: ["mate_pattern", "scholars_mate"],
      phase: "opening",
      explanation: "Scholar's Mate: Qxf7# delivers checkmate. The queen and bishop battery targets f7, the weakest point in Black's position. The king has no escape — d8 is blocked by the queen, f8 by the bishop.",
    },
    {
      id: "puzzle-1400-mate_pattern",
      fen: "4r1k1/p4Npp/8/2B5/8/8/PPP3PP/4R1K1 w - - 0 30",
      moves: "Nh6+ Kh8 Rxe8#",
      rating: 1400,
      themes: ["mate_pattern", "arabian_mate"],
      phase: "endgame",
      explanation: "Nh6+ forces Kh8 — the bishop on c5 covers f8, and the knight covers g8. Rxe8# delivers mate on the back rank with the knight sealing the escape.",
    },
    {
      id: "puzzle-1600-attraction",
      fen: "r1b2rk1/ppq2ppp/2n1p3/3pN3/3P4/2PB4/PP3PPP/R2Q1RK1 w - - 0 14",
      moves: "Bxh7+ Kxh7 Qh5+ Kg8 Qxf7+",
      rating: 1600,
      themes: ["attraction", "sacrifice"],
      phase: "middlegame",
      explanation: "The Greek Gift sacrifice Bxh7+ attracts the king to h7. After Kxh7 Qh5+, the king is drawn into the open. Qxf7+ continues the attack with decisive threats.",
    },
    {
      id: "puzzle-1200-attraction",
      fen: "r1bqk2r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5",
      moves: "Nxf7 Kxf7 Qf3+ Ke8 Qxa8",
      rating: 1200,
      themes: ["attraction", "fork"],
      phase: "opening",
      explanation: "Nxf7 attracts the king to f7 with a sacrifice. After Kxf7, Qf3+ forces the king back, and Qxa8 wins the rook. A classic attraction motif in the Italian Game.",
    },
    {
      id: "puzzle-1350-deflection",
      fen: "r2q1rk1/pp2bppp/2n1p3/3pN3/3P1B2/4P3/PP3PPP/R2Q1RK1 w - - 0 12",
      moves: "Nxc6 bxc6 Bxa8 Qxa8 Qg4",
      rating: 1350,
      themes: ["deflection", "exchange"],
      phase: "middlegame",
      explanation: "Nxc6 deflects the b-pawn from protecting the a8 rook. After bxc6 Bxa8, White wins the exchange. Qg4 keeps pressure on the kingside.",
    },
    {
      id: "puzzle-1800-deflection",
      fen: "r2qr1k1/1b1nbppp/p2ppn2/1p6/3NP1P1/1BN1BP2/PPPQ3P/R4RK1 w - - 0 14",
      moves: "Nd5 exd5 exd5 Ne5 fxe5 Bxe5",
      rating: 1800,
      themes: ["deflection", "pawn_break"],
      phase: "middlegame",
      explanation: "Nd5 deflects the e-pawn. After exd5 exd5, the central pawn storm deflects Black's defenses. Ne5 then fxe5 Bxe5 leaves White dominating the dark squares.",
    },
    {
      id: "puzzle-1450-clearance",
      fen: "r1bq1rk1/pp2ppbp/2np2p1/8/2BNP3/2N1B3/PPP2PPP/R2Q1RK1 w - - 0 10",
      moves: "Nd5 e6 Nf4 Ne5 Nxe6 fxe6 Bxe6+",
      rating: 1450,
      themes: ["clearance", "sacrifice"],
      phase: "middlegame",
      explanation: "Nd5 clears the c3 square and forces e6, weakening f7. The knight retreats to f4 then Nxe6 opens the diagonal for Bxe6+, a clearance sacrifice exposing the king.",
    },
    {
      id: "puzzle-1100-clearance",
      fen: "rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2",
      moves: "d5 e5 c5 c3 Nc6",
      rating: 1100,
      themes: ["clearance", "center_control"],
      phase: "opening",
      explanation: "d5 clears the d7 square for the knight and challenges White's center directly. After e5 c5, Black gains queenside space. A standard French Defense clearance idea.",
    },
    {
      id: "puzzle-1900-interference",
      fen: "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 8",
      moves: "c5 b6 cxb6 axb6 e4 dxe4 Nxe4",
      rating: 1900,
      themes: ["interference", "pawn_break"],
      phase: "middlegame",
      explanation: "c5 interferes with Black's pawn chain, disrupting the coordination between b7 and d5. The follow-up e4 break shatters the center and activates White's pieces.",
    },
    {
      id: "puzzle-1550-interference",
      fen: "r1bq1rk1/ppp1bppp/2n2n2/3pp3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6",
      moves: "Bg5 d4 Nd5 Be6 Bxf6 Bxf6 Nxf6+",
      rating: 1550,
      themes: ["interference", "pin"],
      phase: "middlegame",
      explanation: "Bg5 pins the f6 knight. After d4 Nd5, the knight on d5 interferes with Black's pawn structure. Bxf6 Bxf6 Nxf6+ wins material by exploiting the weakened defense.",
    },
    {
      id: "puzzle-1650-overloaded_piece",
      fen: "r2q1rk1/pb1nbppp/1p2pn2/2p5/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 10",
      moves: "d5 exd5 cxd5 Na5 Nd4 Nxb3 Nxe6",
      rating: 1650,
      themes: ["overloaded_piece", "center_control"],
      phase: "middlegame",
      explanation: "After d5, Black's e6 pawn is overloaded — it must support d5 and cover f5. The central break forces Black to choose which weakness to concede, and the knight on e6 lands with devastating effect.",
    },
    {
      id: "puzzle-1250-overloaded_piece",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      moves: "d4 exd4 e5 d5 exf6 dxc4 fxg7",
      rating: 1250,
      themes: ["overloaded_piece", "gambit"],
      phase: "opening",
      explanation: "The d-pawn is overloaded defending e5 and c6. After d4 exd4 e5, the knight on f6 is attacked and the d5 pawn must cover c4 and e4. The pawn storm creates multiple overloaded defenders.",
    },
    {
      id: "puzzle-1750-zwischenzug",
      fen: "r1b2rk1/pp3ppp/2n1pq2/3p4/1b1P4/2NB1N2/PP2QPPP/R1B2RK1 w - - 0 10",
      moves: "dxc5 Bxc3 Nd4 Qg6 Nxe6",
      rating: 1750,
      themes: ["zwischenzug", "tactic"],
      phase: "middlegame",
      explanation: "Instead of recapturing on c3, Nd4 is a zwischenzug — an in-between move that attacks the queen while threatening Nxe6. Black must deal with the knight before recovering the piece.",
    },
    {
      id: "puzzle-2000-zwischenzug",
      fen: "r1b2rk1/pp1pqppp/2n1p3/2b5/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 w - - 0 9",
      moves: "d5 exd5 e5 dxc4 exf6 Qxf6 Nd5",
      rating: 2000,
      themes: ["zwischenzug", "pawn_push"],
      phase: "middlegame",
      explanation: "After d5 exd5, e5 is a zwischenzug — instead of recapturing d5, White pushes e5 attacking the f6 knight first. After dxc4 exf6 Qxf6, Nd5 forks the queen and c7 with a winning position.",
    },
  ];

  for (const puzzle of morePuzzles) {
    await prisma.puzzle.upsert({
      where: { id: puzzle.id },
      update: {},
      create: puzzle,
    });
  }

  const calculationExercises = [
    {
      id: "calc-1",
      fen: "r1bq1rk1/pp2ppbp/2np2p1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9",
      type: "forcing",
      difficulty: 6,
      bestMoves: [
        { move: "Nd5", eval: 1.8 },
        { move: "Bc4", eval: 0.9 },
        { move: "g4", eval: 0.7 },
      ],
      mainLine: "Nd5 Nxd5 exd5 Ne5 fxe5 Bxe5 with pressure on the dark squares",
      theme: "attack",
    },
    {
      id: "calc-2",
      fen: "r2qr1k1/1b1nbppp/pp1ppn2/8/2PNP3/1PN1BP2/P4QPP/R2R1BK1 w - - 0 14",
      type: "forcing",
      difficulty: 8,
      bestMoves: [
        { move: "Nf5", eval: 2.3 },
        { move: "e5", eval: 0.8 },
        { move: "Bf4", eval: 0.5 },
      ],
      mainLine: "Nf5 exf5 Nd5 Nxd5 exd5 Bf6 Bxf6 gxf6 Qh4 with a crushing kingside attack",
      theme: "attack",
    },
    {
      id: "calc-3",
      fen: "r1b2rk1/2q1bppp/p1nppn2/1p4B1/3NP3/2N2P2/PPPQ2PP/R3KB1R w KQ - 0 11",
      type: "non_forcing",
      difficulty: 5,
      bestMoves: [
        { move: "Bxf6", eval: 0.6 },
        { move: "a3", eval: 0.4 },
        { move: "Be2", eval: 0.3 },
      ],
      mainLine: "Bxf6 Bxf6 Nxc6 Qxc6 Nd5 Qd7 Nxf6+ gxf6 with a weakened kingside",
      theme: "positional",
    },
    {
      id: "calc-4",
      fen: "r1bq1rk1/pp1n1ppp/2pbpn2/8/2PP4/2N2NP1/PP2PPBP/R1BQ1RK1 w - - 0 8",
      type: "non_forcing",
      difficulty: 4,
      bestMoves: [
        { move: "e4", eval: 0.5 },
        { move: "b3", eval: 0.4 },
        { move: "Bf4", eval: 0.3 },
      ],
      mainLine: "e4 e5 dxe5 dxe5 Bg5 Qe7 Qc2 preparing Rad1 with central pressure",
      theme: "center_control",
    },
    {
      id: "calc-5",
      fen: "r4rk1/pp1q1ppp/2p1pn2/3n2B1/3P4/2NB4/PPP2PPP/R2Q1RK1 w - - 0 13",
      type: "forcing",
      difficulty: 8,
      bestMoves: [
        { move: "Nxd5", eval: 2.1 },
        { move: "Bh7+", eval: 1.5 },
        { move: "Bxf6", eval: 0.6 },
      ],
      mainLine: "Nxd5 cxd5 Bxf6 gxf6 Qg4+ Kh8 Qh5 with a mating attack",
      theme: "attack",
    },
    {
      id: "calc-6",
      fen: "2r2rk1/pp2qppp/2n1pn2/3p4/3P4/2PB1N2/P1Q1NPPP/R4RK1 w - - 0 14",
      type: "mixed",
      difficulty: 6,
      bestMoves: [
        { move: "Ng3", eval: 0.7 },
        { move: "Nf4", eval: 0.6 },
        { move: "a3", eval: 0.3 },
      ],
      mainLine: "Ng3 g6 Nf5 exf5 Bxf5 Ne4 Bxe4 dxe4 Ng5 with kingside pressure",
      theme: "positional",
    },
    {
      id: "calc-7",
      fen: "r1b2rk1/pp3ppp/2n1pq2/3p4/1b1P4/2NB1N2/PP2QPPP/R1B2RK1 w - - 0 10",
      type: "mixed",
      difficulty: 7,
      bestMoves: [
        { move: "a3", eval: 0.9 },
        { move: "Bg5", eval: 0.7 },
        { move: "Ne5", eval: 0.4 },
      ],
      mainLine: "a3 Ba5 b4 Bb6 Na4 Qd8 Nxb6 axb6 c4 opening the center",
      theme: "defense",
    },
    {
      id: "calc-8",
      fen: "r4rk1/pp1q1ppp/2nbpn2/3p4/2PP4/1QN1PN2/PP1B1PPP/R3K2R w KQ - 0 10",
      type: "forcing",
      difficulty: 9,
      bestMoves: [
        { move: "cxd5", eval: 1.4 },
        { move: "O-O", eval: 0.5 },
        { move: "Be2", eval: 0.3 },
      ],
      mainLine: "cxd5 exd5 Nxd5 Nxd5 exd5 Bxh2 dxc6 Qxc6 Qxc6 bxc6 winning a pawn with the better structure",
      theme: "endgame_conversion",
    },
  ];

  for (const ex of calculationExercises) {
    await prisma.calculationExercise.upsert({
      where: { id: ex.id },
      update: {},
      create: ex,
    });
  }

  const openingLines = [
    {
      id: "ol-sicilian-najdorf",
      openingId: "op-sicilian",
      name: "Najdorf Variation",
      moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
      fen: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      isCritical: true,
      annotation: "The Najdorf is Black's most aggressive Sicilian. 5...a6 prepares ...e5 and ...b5. White chooses between 6.Be3 (English Attack), 6.Bg5 (classical), 6.Be2 (positional), and 6.f3.",
    },
    {
      id: "ol-sicilian-dragon",
      openingId: "op-sicilian",
      name: "Dragon Variation",
      moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6",
      fen: "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      isCritical: true,
      annotation: "The Dragon features a fianchettoed bishop on g7 aiming at the queenside. White often plays the Yugoslav Attack (Be3, Qd2, O-O-O) leading to opposite-side castling and mutual attacks.",
    },
    {
      id: "ol-sicilian-scheveningen",
      openingId: "op-sicilian",
      name: "Scheveningen Variation",
      moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6",
      fen: "rnbqkb1r/pp3ppp/3ppn2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      isCritical: false,
      annotation: "The Scheveningen (d6+e6) is solid but slightly passive. Black aims for ...a6 and ...b5 queenside expansion. The Keres Attack (6.g4) is White's most aggressive try.",
    },
    {
      id: "ol-sicilian-accelerated-dragon",
      openingId: "op-sicilian",
      name: "Accelerated Dragon",
      moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6",
      fen: "r1bqkbnr/pp1ppp1p/2n3p1/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 5",
      isCritical: false,
      annotation: "By playing ...g6 before ...d6, Black avoids Yugoslav Attack lines. The Maroczy Bind (c4) is White's main weapon, grabbing central space.",
    },
    {
      id: "ol-italian-giuoco-piano",
      openingId: "op-italian",
      name: "Giuoco Piano",
      moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4",
      fen: "r1bqk2r/pppp1ppp/2n2n2/2b5/2BPP3/5N2/PP3PPP/RNBQK2R b KQkq d3 0 6",
      isCritical: true,
      annotation: "The Giuoco Piano leads to rich middlegame play. After 6...Bb4+ White chooses between 7.Bd2 (quiet) and 7.Nc3 (gambit). Understanding IQP structures is essential.",
    },
    {
      id: "ol-italian-evans-gambit",
      openingId: "op-italian",
      name: "Evans Gambit",
      moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5",
      fen: "r1bqk1nr/pppp1ppp/2n5/b3p3/2B1P3/2P2N2/P2P1PPP/RNBQK2R w KQkq - 1 6",
      isCritical: false,
      annotation: "The Evans Gambit sacrifices a pawn for rapid development and central control. After 6.d4, White gets a strong center. A favorite weapon for aggressive players below 2000.",
    },
    {
      id: "ol-italian-two-knights",
      openingId: "op-italian",
      name: "Two Knights Defense",
      moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5",
      fen: "r1bqkb1r/ppp2ppp/5n2/n2pN3/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 1 6",
      isCritical: true,
      annotation: "The Two Knights with 4.Ng5 leads to sharp play. After 5.exd5 Na5 6.Bb5+ c6 7.dxc6 bxc6, Black gets active piece play as compensation for the pawn.",
    },
    {
      id: "ol-qgd-orthodox",
      openingId: "op-qgd",
      name: "Orthodox Defense",
      moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7",
      fen: "r1bq1rk1/pppnbppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQ - 3 7",
      isCritical: true,
      annotation: "The Orthodox QGD is one of the most solid defenses. Black maintains d5 and develops harmoniously. White's plans include the minority attack (a4-b4-b5) and central play with e4.",
    },
    {
      id: "ol-qgd-tartakower",
      openingId: "op-qgd",
      name: "Tartakower Variation",
      moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6",
      fen: "rnbq1rk1/p1p1bpp1/1p2pn1p/3p4/2PP3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8",
      isCritical: true,
      annotation: "Tartakower's 7...b6 solves the light-squared bishop problem. After 8.cxd5 Nxd5, Black gets active play. A cornerstone of world championship matches.",
    },
    {
      id: "ol-qgd-exchange",
      openingId: "op-qgd",
      name: "Exchange Variation",
      moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 c6 6. e3 Bf5",
      fen: "rn1qkb1r/pp3ppp/2p2n2/3p1bB1/3P4/2N1P3/PP3PPP/R2QKBNR w KQkq - 1 7",
      isCritical: false,
      annotation: "The Exchange creates a symmetrical pawn structure but White keeps a slight initiative. The minority attack (b4-b5) is White's main long-term plan.",
    },
    {
      id: "ol-qgd-cambridge-springs",
      openingId: "op-qgd",
      name: "Cambridge Springs Defense",
      moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Qa5",
      fen: "r1b1kb1r/pp1n1ppp/2p1pn2/q2p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQkq - 1 7",
      isCritical: false,
      annotation: "The Cambridge Springs creates tactical pressure against c3 and g5 with the queen on a5. White must avoid traps involving ...Ne4 and ...Bb4.",
    },
  ];

  for (const line of openingLines) {
    await prisma.openingLine.upsert({
      where: { id: line.id },
      update: {},
      create: line,
    });
  }

  const moreEndgamePositions = [
    {
      id: "ep-6",
      moduleId: "eg-rook-basic",
      fen: "8/8/8/4k3/R7/4K3/8/1r6 w - - 0 40",
      objective: "win",
      solution: "Ra5+! forces the king to choose a side, then cut off with the rook while advancing the own king to support passed pawns.",
      explanation: "Active rook play is critical in rook endings. By checking first and cutting off the king, White creates a decisive advantage with superior king activity.",
      order: 1,
    },
    {
      id: "ep-7",
      moduleId: "eg-rook-basic",
      fen: "8/1R6/6pp/5k2/5p2/8/5KPP/8 w - - 0 38",
      objective: "win",
      solution: "Rb5+ Kg4 Rb4 pins the f-pawn. Then Ke2-d3 brings the king over to support the g and h pawns while Black's king is cut off.",
      explanation: "The rook behind the passed pawn and an active king are the two winning factors. Cutting off the enemy king from the action is the key technique.",
      order: 2,
    },
    {
      id: "ep-8",
      moduleId: "eg-minor",
      fen: "8/8/4kpp1/3p3p/1B1K3P/5PP1/8/8 w - - 0 42",
      objective: "win",
      solution: "Ba5! followed by Bc7 restricts Black's king. Then f4 and Ke3-d4 creates a passed pawn on the kingside.",
      explanation: "Good bishop vs bad pawn structure. White's bishop operates on both sides of the board while Black's pawns are fixed on the same color as the missing bishop.",
      order: 1,
    },
    {
      id: "ep-9",
      moduleId: "eg-minor",
      fen: "8/5pk1/4p1p1/3pP1Pp/2pP3P/2P2N2/8/6K1 w - - 0 45",
      objective: "draw",
      solution: "Nh4! Kg8 Nf3 maintaining the blockade. Black cannot break through on either side of the board.",
      explanation: "The knight blockades the kingside pawns and maintains a fortress. The position is drawn because Black has no way to create a passed pawn or infiltrate.",
      order: 2,
    },
    {
      id: "ep-10",
      moduleId: "eg-queen",
      fen: "8/8/8/5k2/8/2K5/4Q3/1q6 w - - 0 55",
      objective: "win",
      solution: "Qe5+ Kg6 Qd6+ Kf7 Qd5+ Ke7 Kc4 using checks to improve the king's position while driving back Black's queen.",
      explanation: "In queen endgames, the stronger side uses checks to centralize the king. Perpetual check threats are converted into winning positions by methodical king marches.",
      order: 2,
    },
    {
      id: "ep-11",
      moduleId: "eg-opposition",
      fen: "8/8/8/8/4k3/8/3PK3/8 w - - 0 1",
      objective: "win",
      solution: "Ke3! takes the opposition. If Kd5 then Kf4; if Kf5 then Kd4. White's king gets in front of the pawn.",
      explanation: "Distant opposition is the key concept. White must get the king in front of the pawn with opposition to guarantee promotion. Triangulation may be needed if Black mirrors moves.",
      order: 3,
    },
  ];

  for (const pos of moreEndgamePositions) {
    await prisma.endgamePosition.upsert({
      where: { id: pos.id },
      update: {},
      create: pos,
    });
  }

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  const spacedItems = [
    {
      id: "sri-1",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1250-fork",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: new Date(now.getTime() - 2 * DAY),
      lastReview: new Date(now.getTime() - 3 * DAY),
    },
    {
      id: "sri-2",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1450-fork",
      easeFactor: 2.3,
      interval: 3,
      repetitions: 2,
      nextReview: now,
      lastReview: new Date(now.getTime() - 3 * DAY),
    },
    {
      id: "sri-3",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1350-pin",
      easeFactor: 2.1,
      interval: 7,
      repetitions: 3,
      nextReview: new Date(now.getTime() + 5 * DAY),
      lastReview: new Date(now.getTime() - 2 * DAY),
    },
    {
      id: "sri-4",
      userId: user.id,
      itemType: "opening_line",
      itemId: "ol-sicilian-najdorf",
      easeFactor: 2.6,
      interval: 14,
      repetitions: 4,
      nextReview: new Date(now.getTime() + 10 * DAY),
      lastReview: new Date(now.getTime() - 4 * DAY),
    },
    {
      id: "sri-5",
      userId: user.id,
      itemType: "opening_line",
      itemId: "ol-italian-giuoco-piano",
      easeFactor: 2.4,
      interval: 1,
      repetitions: 0,
      nextReview: new Date(now.getTime() - 1 * DAY),
      lastReview: new Date(now.getTime() - 2 * DAY),
    },
    {
      id: "sri-6",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1000-back_rank",
      easeFactor: 2.8,
      interval: 21,
      repetitions: 5,
      nextReview: new Date(now.getTime() + 14 * DAY),
      lastReview: new Date(now.getTime() - 7 * DAY),
    },
    {
      id: "sri-7",
      userId: user.id,
      itemType: "opening_line",
      itemId: "ol-qgd-orthodox",
      easeFactor: 2.2,
      interval: 2,
      repetitions: 1,
      nextReview: now,
      lastReview: new Date(now.getTime() - 2 * DAY),
    },
    {
      id: "sri-8",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1600-attraction",
      easeFactor: 2.0,
      interval: 1,
      repetitions: 0,
      nextReview: new Date(now.getTime() - 4 * DAY),
      lastReview: new Date(now.getTime() - 5 * DAY),
    },
    {
      id: "sri-9",
      userId: user.id,
      itemType: "opening_line",
      itemId: "ol-sicilian-dragon",
      easeFactor: 2.5,
      interval: 7,
      repetitions: 3,
      nextReview: new Date(now.getTime() + 3 * DAY),
      lastReview: new Date(now.getTime() - 4 * DAY),
    },
    {
      id: "sri-10",
      userId: user.id,
      itemType: "puzzle",
      itemId: "puzzle-1750-zwischenzug",
      easeFactor: 1.8,
      interval: 1,
      repetitions: 1,
      nextReview: now,
      lastReview: new Date(now.getTime() - 1 * DAY),
    },
  ];

  for (const item of spacedItems) {
    await prisma.spacedRepetitionItem.upsert({
      where: {
        userId_itemType_itemId: {
          userId: item.userId,
          itemType: item.itemType,
          itemId: item.itemId,
        },
      },
      update: {},
      create: item,
    });
  }

  const gameMistakes = [
    {
      id: "gm-1",
      gameId: "demo-game-1",
      moveNumber: 17,
      fen: "r4rk1/p2qbppp/2pp4/1p2P1P1/2n5/1BN1B3/PPPQ3P/1K1R3R w - - 0 17",
      playedMove: "Bxc4",
      bestMove: "Qf2",
      evalDrop: 1.8,
      category: "positional_misunderstanding",
      subcategory: "piece_activity",
      explanation: "Trading the dark-squared bishop removes White's most active attacking piece. In the Najdorf with opposite-side castling, the dark-squared bishop is essential for the kingside attack. Qf2 keeps all pieces aimed at the Black king.",
      phase: "middlegame",
    },
    {
      id: "gm-2",
      gameId: "demo-game-1",
      moveNumber: 21,
      fen: "rr4k1/ppp1qp1p/3p2pB/3Pp3/8/8/PPPQ1PPP/1K1R3R w - - 0 21",
      playedMove: "Qe2",
      bestMove: "Qg5",
      evalDrop: 2.1,
      category: "tactical_blindness",
      subcategory: "missed_attack",
      explanation: "Qe2 is passive and gives Black time to consolidate. Qg5 maintains kingside pressure by threatening Qf6, and the bishop on h6 creates a deadly battery. The attack practically plays itself after Qg5.",
      phase: "middlegame",
    },
    {
      id: "gm-3",
      gameId: "demo-game-1",
      moveNumber: 22,
      fen: "rr4k1/ppp1qp1p/3p2pB/3Pp3/5n2/8/PPP1QPPP/1K1R3R w - - 0 22",
      playedMove: "Qxc4",
      bestMove: "Bg5",
      evalDrop: 3.4,
      category: "calculation_failure",
      subcategory: "missed_tactic",
      explanation: "Qxc4 grabs a pawn but walks into Black's counterattack. After ...Rb4, both rooks dominate the b-file with devastating threats against the White king. Bg5 would challenge the queen and maintain defensive chances.",
      phase: "middlegame",
    },
  ];

  for (const mistake of gameMistakes) {
    await prisma.gameMistake.upsert({
      where: { id: mistake.id },
      update: {},
      create: mistake,
    });
  }

  await prisma.game.upsert({
    where: { id: "demo-game-2" },
    update: {},
    create: {
      id: "demo-game-2",
      userId: user.id,
      pgn: `[Event "Rapid Game"]
[Site "Online"]
[Date "2024.03.08"]
[White "Alex Fischer"]
[Black "Opponent_1389"]
[Result "1-0"]
[WhiteElo "1420"]
[BlackElo "1389"]
[TimeControl "600+5"]
[ECO "C54"]
[Opening "Italian Game, Giuoco Piano"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+
7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Na5 11. Qa4+ Nc6
12. Qb3 Nce7 13. O-O O-O 14. Rfe1 c6 15. Ne4 Nf5 16. Nc5 b6
17. Nd3 Bb7 18. Nfe5 Qd6 19. Rad1 Rad8 20. f4 f6 21. Nc4 Qc7
22. g4 Nfe7 23. f5 Ng8 24. Nce5 fxe5 25. Nxe5 Nf6 26. Qg3 Rde8
27. Ng6 Re2 28. Nxf8 Kxf8 29. Rxe2 1-0`,
      white: "Alex Fischer",
      black: "Opponent_1389",
      result: "1-0",
      date: new Date("2024-03-08"),
      event: "Rapid Game",
      timeControl: "rapid",
      eco: "C54",
      opening: "Italian Game, Giuoco Piano",
      source: "manual",
      selfReviewComplete: true,
      engineReviewComplete: false,
      accuracy: 84.2,
      averageCentipawnLoss: 24,
    },
  });

  const weeklyReviewData = [
    {
      id: "wr-4",
      userId: user.id,
      weekOf: new Date(now.getTime() - 4 * 7 * DAY),
      gamesPlayed: 5,
      gamesReviewed: 2,
      puzzlesSolved: 28,
      trainingMinutes: 185,
      tasksCompleted: 10,
      totalTasks: 15,
      keyInsight: "Most blunders happen after move 25 — fatigue and time pressure are recurring factors. Need to work on stamina and time allocation in longer games.",
      biggestWeakness: "endgame",
      improvement: "Tactical accuracy improved by 5% in fork-themed puzzles after focused woodpecker training.",
    },
    {
      id: "wr-3",
      userId: user.id,
      weekOf: new Date(now.getTime() - 3 * 7 * DAY),
      gamesPlayed: 4,
      gamesReviewed: 3,
      puzzlesSolved: 35,
      trainingMinutes: 220,
      tasksCompleted: 12,
      totalTasks: 15,
      keyInsight: "Opening preparation is paying off — Sicilian Najdorf games feel much more comfortable now. Knowing the plans behind the moves makes a huge difference.",
      biggestWeakness: "calculation",
      improvement: "Rating up 30 points in rapid after focused opening study. Won two games out of the opening preparation.",
    },
    {
      id: "wr-2",
      userId: user.id,
      weekOf: new Date(now.getTime() - 2 * 7 * DAY),
      gamesPlayed: 3,
      gamesReviewed: 2,
      puzzlesSolved: 22,
      trainingMinutes: 160,
      tasksCompleted: 9,
      totalTasks: 15,
      keyInsight: "Need to slow down in critical positions. Two games were lost by playing the first move that looked good instead of comparing candidate moves systematically.",
      biggestWeakness: "calculation",
      improvement: "Endgame technique improved — successfully converted a rook endgame using the Lucena bridge technique studied last week.",
    },
    {
      id: "wr-1",
      userId: user.id,
      weekOf: new Date(now.getTime() - 1 * 7 * DAY),
      gamesPlayed: 6,
      gamesReviewed: 3,
      puzzlesSolved: 42,
      trainingMinutes: 280,
      tasksCompleted: 13,
      totalTasks: 15,
      keyInsight: "Best training week so far. Puzzle streak reached 12 days. The woodpecker method is clearly working for pattern recognition speed — solving familiar themes 40% faster.",
      biggestWeakness: "positional_play",
      improvement: "Blunder rate decreased from 8% to 5%. Puzzle rating crossed 1600 for the first time.",
    },
  ];

  for (const review of weeklyReviewData) {
    await prisma.weeklyReview.upsert({
      where: { id: review.id },
      update: {},
      create: review,
    });
  }

  // Seed a sample bot game with full analysis
  const botGame = await prisma.botGame.upsert({
    where: { id: "bot-game-demo-1" },
    update: {},
    create: {
      id: "bot-game-demo-1",
      userId: user.id,
      pgn: `[Event "Training Game"]
[Site "GM Path"]
[Date "2024.03.11"]
[White "Alex Fischer"]
[Black "Bot (Club 1400)"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6
8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6
14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7 17. Rc1 Qb8 18. Nf1 exd4 19. Bxd4 Nxd4
20. Nxd4 Be6 21. Nxe6 fxe6 22. Ng3 Qb6 23. Qd3 Rac8 24. Bb1 d5 25. e5 Nd7
26. Qg6 Rf7 27. Nf5 Bf8 28. Nh6+ gxh6 29. Qxf7+ Kh8 30. Re3 Rc1+ 31. Rxc1 Qxe3
32. Qf3 Qxf3 33. gxf3 Nc5 34. Rc2 Nd3 35. Bxd3 1-0`,
      white: "Alex Fischer",
      black: "Bot (Club 1400)",
      result: "1-0",
      userColor: "white",
      botStrength: "club",
      timeControl: "15+10",
      trainingFocus: "general",
      opening: "Ruy Lopez, Closed",
      eco: "C92",
      totalMoves: 35,
      analysisComplete: true,
      accuracy: 82.3,
      avgCentipawnLoss: 28,
      summaryVerdict: "You played a solid Ruy Lopez with good opening knowledge. Your attack was creative but slightly imprecise — the kingside breakthrough worked thanks to your opponent's passive defense, but cleaner calculation would have won material earlier.",
      summaryStrengths: "Strong opening play following main-line theory. Good sense of when to attack on the kingside.",
      summaryWeaknesses: "Calculation in the critical attacking phase could be sharper. The transition to the endgame was slightly wasteful.",
      summaryLesson: "When you have a kingside attack, calculate the sacrificial lines fully before committing. Here, Nf5 was strong but the follow-up could have been even more decisive with Qg4 instead of Qg6.",
    },
  });

  // Seed bot game moves
  const botGameMoves = [
    { moveNumber: 1, isWhiteMove: true, san: "e4", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", evalBefore: 0.0, evalAfter: 0.3, evalDrop: 0, classification: "good", verdictLabel: "Good move", humanExplanation: "The King's Pawn opening controls the center and opens lines for the bishop and queen. A principled first move.", thinkingProcess: "1.e4 and 1.d4 are the two main first moves. Both fight for the center immediately.", phase: "opening", isPlayerMove: true },
    { moveNumber: 1, isWhiteMove: false, san: "e5", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", evalBefore: 0.3, evalAfter: 0.3, evalDrop: 0, classification: "good", verdictLabel: "Good move", humanExplanation: "Symmetric response, fighting for the center.", thinkingProcess: "Standard response. The Sicilian (1...c5) is sharper.", phase: "opening", isPlayerMove: false },
    { moveNumber: 2, isWhiteMove: true, san: "Nf3", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", evalBefore: 0.3, evalAfter: 0.4, evalDrop: 0, classification: "good", verdictLabel: "Good move", humanExplanation: "Develops the knight to its best square, attacking the e5 pawn and preparing to castle.", thinkingProcess: "Nf3 is the most natural developing move. It attacks e5 immediately.", phase: "opening", isPlayerMove: true },
    { moveNumber: 2, isWhiteMove: false, san: "Nc6", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", evalBefore: 0.4, evalAfter: 0.3, evalDrop: 0, classification: "good", verdictLabel: "Good move", humanExplanation: "Defends the e5 pawn and develops toward the center.", thinkingProcess: "Nc6 is the most common defense of e5.", phase: "opening", isPlayerMove: false },
    { moveNumber: 3, isWhiteMove: true, san: "Bb5", fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", evalBefore: 0.3, evalAfter: 0.4, evalDrop: 0, classification: "great", verdictLabel: "Great move", humanExplanation: "The Ruy Lopez! This puts pressure on the knight defending e5 and is one of the most tested openings in chess history.", thinkingProcess: "Bb5 (Ruy Lopez) is the most classical choice. Bc4 (Italian) is the main alternative. Both are excellent.", phase: "opening", isPlayerMove: true },
    { moveNumber: 14, isWhiteMove: true, san: "Nb3", fen: "r1bq1rk1/2pn1ppp/p2p1n2/1p2p3/P2PP3/1BN2N2/1PP2PPP/R2Q1RK1 b - - 0 14", evalBefore: 0.5, evalAfter: -0.1, evalDrop: 0.6, classification: "inaccuracy", verdictLabel: "Inaccuracy", humanExplanation: "The knight retreats to a passive square. While it eyes a5, it no longer pressures the center. The position called for maintaining central tension with d5 or Nf1-g3.", thinkingProcess: "Candidate moves: d5 (opening the center while ahead in development), Nf1 (regrouping to g3 for kingside attack), a4 (challenging Black's queenside). Nb3 is the least active option.", phase: "middlegame", isPlayerMove: true },
    { moveNumber: 22, isWhiteMove: true, san: "Ng3", fen: "qr4k1/2pnbppp/p2pp3/1p2P3/3P4/2N3N1/PPB2PPP/R2Q1RK1 b - - 0 22", evalBefore: 0.6, evalAfter: 0.5, evalDrop: 0.1, classification: "good", verdictLabel: "Good move", humanExplanation: "The knight heads for f5, eyeing the weakened squares around the Black king. Good strategic play.", thinkingProcess: "The knight maneuver Ng3-f5 is the natural plan in this structure. The e6 pawn makes f5 a strong outpost.", phase: "middlegame", isPlayerMove: true },
    { moveNumber: 26, isWhiteMove: true, san: "Qg6", fen: "1r3bk1/2qn1p1p/p3p1p1/1p1pP3/8/5NQ1/PPB2PPP/2R1R1K1 b - - 0 26", evalBefore: 2.1, evalAfter: 1.4, evalDrop: 0.7, classification: "inaccuracy", verdictLabel: "Inaccuracy", humanExplanation: "Qg6 looks aggressive but allows Black defensive resources. The queen is powerful here but Qg4 was more accurate, keeping more options open and threatening Nf5 with greater force.", thinkingProcess: "Candidate moves: Qg4 (flexible, threatens Nf5 and Qh4), Nf5 (direct sacrifice), Qg6 (showy but committal). A stronger player would prefer the flexible Qg4.", phase: "middlegame", isPlayerMove: true },
    { moveNumber: 27, isWhiteMove: true, san: "Nf5", fen: "1r3bk1/2pn1r1p/p3p1Q1/1p1pPN2/8/8/PPB2PPP/2R1R1K1 b - - 0 27", evalBefore: 1.4, evalAfter: 3.2, evalDrop: 0, classification: "brilliant", verdictLabel: "Brilliant move!", humanExplanation: "A crushing knight sacrifice! Nf5 attacks e6 and threatens devastating discovered attacks. The knight cannot be taken because of the queen's power on g6.", thinkingProcess: "This is the culmination of the Ng3-f5 plan. The sacrifice works because after exf5, Qxf7+ picks up material with a continuing attack.", phase: "middlegame", isPlayerMove: true },
    { moveNumber: 28, isWhiteMove: true, san: "Nh6+", fen: "1r3bk1/2pn1r1p/p3pQNp/1p1p4/8/8/PPB2PPP/2R1R1K1 b - - 0 28", evalBefore: 3.2, evalAfter: 5.5, evalDrop: 0, classification: "great", verdictLabel: "Great move", humanExplanation: "The knight check forces the king to the corner and sets up the decisive Qxf7+. The attack is now winning by force.", thinkingProcess: "After Nh6+ Kh8, Qxf7 threatens Qg8# and there is no defense.", phase: "middlegame", isPlayerMove: true },
    { moveNumber: 32, isWhiteMove: true, san: "Qf3", fen: "7k/2pn1b2/p3p2p/1p1pP3/8/4qP2/PP3P1P/2R3K1 w - - 0 32", evalBefore: 2.0, evalAfter: 1.2, evalDrop: 0.8, classification: "mistake", verdictLabel: "Mistake", humanExplanation: "Trading queens when you have an attack is usually wrong. Here, the endgame is still winning but the margin is smaller. Keeping queens on with Qf5 maintained overwhelming pressure.", thinkingProcess: "A stronger player would ask: 'Do I benefit from trading queens?' The answer is no — your attack was powerful and the endgame, while winning, is technically harder. Qf5 keeps the pressure.", phase: "endgame", isPlayerMove: true },
  ];

  for (const move of botGameMoves) {
    await prisma.botGameMove.create({
      data: {
        botGameId: botGame.id,
        ...move,
      },
    });
  }

  // Seed critical moments
  const criticalMomentsData = [
    { moveNumber: 14, type: "opening_departure", title: "Passive Knight Retreat", description: "Nb3 was the first inaccuracy. The knight retreats to a less active square when the position called for central action.", severity: 4 },
    { moveNumber: 26, type: "missed_tactic", title: "Missed Stronger Attack", description: "Qg6 is aggressive but Qg4 was more flexible and stronger. The difference is about half a pawn, but in attack positions precision matters.", severity: 5 },
    { moveNumber: 27, type: "best_move", title: "Brilliant Sacrifice!", description: "Nf5! was the highlight of the game. A beautiful knight sacrifice that cracks open the kingside.", severity: 9 },
    { moveNumber: 32, type: "turning_point", title: "Premature Queen Trade", description: "Trading queens reduced the winning advantage significantly. The attack was still powerful and keeping queens on would have led to a faster victory.", severity: 6 },
  ];

  for (const cm of criticalMomentsData) {
    await prisma.botGameCriticalMoment.create({
      data: { botGameId: botGame.id, ...cm },
    });
  }

  // Seed derived training tasks
  const derivedTasksData = [
    { moveNumber: 14, category: "opening", title: "Ruy Lopez Middlegame Plans", description: "Study the typical plans after the Ruy Lopez closed defense. Focus on when to play d5, Nf1-g3, and how to handle the queenside expansion." },
    { moveNumber: 26, category: "calculation", title: "Attacking Move Selection", description: "Practice positions where you must choose between multiple aggressive continuations. Focus on comparing candidate moves before committing." },
    { moveNumber: 32, category: "middlegame_strategy", title: "When to Keep Queens On", description: "Study positions where trading queens helps vs. hurts. Key principle: if you have an attack, keep the queens. If you're defending, trade." },
  ];

  for (const task of derivedTasksData) {
    await prisma.derivedTrainingTask.create({
      data: { botGameId: botGame.id, ...task },
    });
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
