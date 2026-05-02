export interface UserProfile {
  id: string;
  ratingBlitz: number | null;
  ratingRapid: number | null;
  ratingClassical: number | null;
  ratingFide: number | null;
  ratingPuzzle: number;
  goal: string;
  hoursPerWeek: number;
  improvementTrack: string;
  skillOpening: number;
  skillMiddlegame: number;
  skillTactics: number;
  skillStrategy: number;
  skillEndgame: number;
  skillCalculation: number;
  skillTimeManagement: number;
  primaryWeakness: string | null;
  secondaryWeakness: string | null;
  onboardingComplete: boolean;
}

export interface DashboardStats {
  currentStreak: number;
  puzzlesSolvedToday: number;
  reviewsDueToday: number;
  tasksCompletedToday: number;
  totalTasksToday: number;
  weeklyTrainingMinutes: number;
  ratingChange: number;
}

export interface TrainingTask {
  id: string;
  category: string;
  title: string;
  description: string;
  duration: number;
  completed: boolean;
  order: number;
}

export interface PuzzleData {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  explanation?: string;
  wrongMoveExplanations?: Record<string, string>;
}

export interface GameData {
  id: string;
  pgn: string;
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

export type ChessPiece = "K" | "Q" | "R" | "B" | "N" | "P" | "k" | "q" | "r" | "b" | "n" | "p";
export type SquareColor = "light" | "dark";

export interface Square {
  file: number; // 0-7
  rank: number; // 0-7
  piece: ChessPiece | null;
  color: SquareColor;
}
