// Training plan generation engine
// Generates weekly training plans based on rating range and detected weaknesses

export interface PlanTask {
  day: number; // 0-6 (Mon-Sun)
  category: string;
  title: string;
  description: string;
  duration: number; // minutes
  order: number;
}

export interface WeaknessProfile {
  tactical: number; // 0-100 score
  calculation: number;
  endgame: number;
  opening: number;
  positional: number;
  timeManagement: number;
}

type RatingRange = "beginner" | "intermediate" | "advanced" | "expert" | "master";

function getRatingRange(rating: number): RatingRange {
  if (rating < 1000) return "beginner";
  if (rating < 1400) return "intermediate";
  if (rating < 1800) return "advanced";
  if (rating < 2200) return "expert";
  return "master";
}

// Time allocation by rating range (percentage of available time)
const TIME_ALLOCATION: Record<RatingRange, Record<string, number>> = {
  beginner: {
    tactics: 40,
    endgame: 15,
    opening: 10,
    game_review: 20,
    calculation: 5,
    middlegame: 5,
    model_games: 5,
  },
  intermediate: {
    tactics: 30,
    endgame: 15,
    opening: 15,
    game_review: 20,
    calculation: 10,
    middlegame: 5,
    model_games: 5,
  },
  advanced: {
    tactics: 20,
    endgame: 15,
    opening: 15,
    game_review: 20,
    calculation: 15,
    middlegame: 10,
    model_games: 5,
  },
  expert: {
    tactics: 15,
    endgame: 15,
    opening: 15,
    game_review: 20,
    calculation: 15,
    middlegame: 10,
    model_games: 10,
  },
  master: {
    tactics: 10,
    endgame: 10,
    opening: 20,
    game_review: 20,
    calculation: 15,
    middlegame: 10,
    model_games: 15,
  },
};

const TASK_TEMPLATES: Record<string, { title: string; description: string }[]> = {
  tactics: [
    { title: "Pattern Recognition Drill", description: "Solve 15-20 puzzles focused on your weakest motifs. Take time to find the key idea before moving." },
    { title: "Woodpecker Repetition", description: "Re-solve previously seen puzzles for speed and pattern reinforcement. Aim for instant recognition." },
    { title: "Tactical Survival", description: "Puzzle survival mode: how many can you solve in a row without a mistake?" },
  ],
  endgame: [
    { title: "Endgame Technique Drill", description: "Work through endgame positions. Focus on understanding the winning method, not just the moves." },
    { title: "Endgame Flash Positions", description: "Quick assessment: win, draw, or loss? Train your endgame intuition." },
    { title: "Play vs Engine from Endgame", description: "Practice converting or defending endgame positions against engine play." },
  ],
  opening: [
    { title: "Opening Review", description: "Study the key ideas and plans in your repertoire. Focus on understanding, not memorization." },
    { title: "Opening Line Repetition", description: "Spaced repetition review of critical opening lines. Test yourself on the key positions." },
    { title: "Sideline Preparation", description: "Study common sidelines and anti-systems you might face. Know the key ideas." },
  ],
  game_review: [
    { title: "Self-Annotate Recent Game", description: "Review your latest game without engine. Mark critical moments, explain your decisions, identify where you went wrong." },
    { title: "Engine-Assisted Review", description: "Now check your analysis with the engine. Focus on understanding WHY the engine's moves are better." },
    { title: "Mistake Pattern Review", description: "Review recurring mistake patterns from your games. What themes keep appearing?" },
  ],
  calculation: [
    { title: "Candidate Move Training", description: "Practice identifying all candidate moves in complex positions before calculating." },
    { title: "Deep Calculation Exercise", description: "Calculate forcing sequences 5-7 moves deep. Write down your analysis before checking." },
    { title: "Visualization Training", description: "Practice seeing positions in your head. Can you evaluate the position 3 moves ahead without a board?" },
  ],
  middlegame: [
    { title: "Pawn Structure Study", description: "Study a pawn structure type and its typical plans for both sides." },
    { title: "Strategic Themes Practice", description: "Solve positional puzzles focusing on strategic concepts like outposts, weak squares, and exchanges." },
    { title: "Model Game Study", description: "Study a master game annotated for strategic ideas. Guess the moves." },
  ],
  model_games: [
    { title: "Guess the Master Move", description: "Play through a master game move-by-move. Try to guess each move before seeing it." },
    { title: "Annotated Game Study", description: "Read through a thoroughly annotated master game. Note the ideas you haven't seen before." },
  ],
};

export function generateWeeklyPlan(
  rating: number,
  hoursPerWeek: number,
  weaknesses?: WeaknessProfile
): PlanTask[] {
  const range = getRatingRange(rating);
  const allocation = { ...TIME_ALLOCATION[range] };

  // Adjust allocation based on weaknesses
  if (weaknesses) {
    const weakestArea = Object.entries(weaknesses).sort(
      ([, a], [, b]) => a - b
    )[0];
    if (weakestArea) {
      const [area] = weakestArea;
      const categoryMap: Record<string, string> = {
        tactical: "tactics",
        calculation: "calculation",
        endgame: "endgame",
        opening: "opening",
        positional: "middlegame",
        timeManagement: "game_review",
      };
      const category = categoryMap[area];
      if (category && allocation[category]) {
        // Boost weakest area by 10%, reduce strongest
        allocation[category] = Math.min(allocation[category] + 10, 50);
      }
    }
  }

  const totalMinutes = hoursPerWeek * 60;
  const tasks: PlanTask[] = [];
  let order = 0;

  // Distribute tasks across 6 days (rest on Sunday)
  for (let day = 0; day < 6; day++) {
    const dayMinutes = totalMinutes / 6;
    let remainingMinutes = dayMinutes;

    // Pick 2-3 categories for each day
    const categories = Object.entries(allocation)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [category, percentage] of categories) {
      if (remainingMinutes <= 0) break;

      const templates = TASK_TEMPLATES[category];
      if (!templates) continue;

      const template = templates[day % templates.length];
      const duration = Math.min(
        Math.round((percentage / 100) * dayMinutes),
        remainingMinutes
      );

      if (duration >= 10) {
        tasks.push({
          day,
          category,
          title: template.title,
          description: template.description,
          duration,
          order: order++,
        });
        remainingMinutes -= duration;
      }
    }
  }

  return tasks;
}

export function getBottleneckExplanation(
  rating: number,
  weaknesses: WeaknessProfile
): string {
  const entries = Object.entries(weaknesses).sort(([, a], [, b]) => a - b);
  const [weakest, weakestScore] = entries[0];

  const explanations: Record<string, string[]> = {
    tactical: [
      "You are missing tactical patterns that players at your level should see.",
      "Your losses often come from one-move tactical oversights.",
      "Focus on pattern recognition — you need to see forks, pins, and skewers instantly.",
    ],
    calculation: [
      "You identify the right ideas but calculate one move too short.",
      "Your analysis breaks down in complex positions with multiple forcing lines.",
      "Practice calculating candidate moves deeper before committing.",
    ],
    endgame: [
      "You reach good positions but fail to convert them in the endgame.",
      "Your endgame technique needs structured work — you're leaving half-points on the table.",
      "Learn key endgame positions by heart. The basics will save you many games.",
    ],
    opening: [
      "You leave the opening with a disadvantage too often.",
      "You know moves but not plans — you need to understand opening ideas, not just memorize.",
      "Your opening problems are causing middlegame difficulties downstream.",
    ],
    positional: [
      "You handle tactics well but struggle with quiet positions.",
      "Your piece placement and pawn decisions in the middlegame need improvement.",
      "Study pawn structures and learn the typical plans for your openings.",
    ],
    timeManagement: [
      "You spend too much time early and rush critical decisions later.",
      "Time pressure is costing you games that you should be winning.",
      "Practice making decisions within a time budget for each phase of the game.",
    ],
  };

  const msgs = explanations[weakest] || ["Focus on consistent, structured training."];
  const idx = Math.min(Math.floor((100 - weakestScore) / 33), msgs.length - 1);

  return msgs[idx];
}
