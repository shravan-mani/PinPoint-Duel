export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  lastGuess?: {
    lat: number;
    lng: number;
    distance: number;
    points: number;
  };
}

export interface Location {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export type GameState = 'LOBBY' | 'STUDY' | 'GUESSING' | 'REVEAL' | 'LEADERBOARD';

export const PLAYER_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];
