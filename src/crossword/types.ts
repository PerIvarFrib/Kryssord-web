export interface CrosswordMetadata {
  title: string;
  type: string;
  generated_by: string;
  generation_date: string;
  model_used: string;
  pairs_db_path: string;
  difficulty: string;
  language: string;
}

export interface CrosswordAnswersSet {
  across: Record<string, string>;
  down: Record<string, string>;
}

export interface CrosswordCluesSet {
  across: Record<string, string>;
  down: Record<string, string>;
}

export interface CrosswordPuzzle {
  metadata: CrosswordMetadata;
  layout: string[];
  solved_layout: string[];
  answers: CrosswordAnswersSet;
  clues: CrosswordCluesSet;
}

export type Direction = "across" | "down";

export type WordKey = string;

export type CellProgressStatus =
  | "empty"
  | "unconfirmed"
  | "correctConfirmed"
  | "revealed";

export interface WordPosition {
  key: WordKey;
  number: number;
  direction: Direction;
  row: number;
  col: number;
  length: number;
}

export type WordPositions = Record<WordKey, WordPosition>;
