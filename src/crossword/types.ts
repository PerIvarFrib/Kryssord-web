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
  /** Row of the clue cell that holds this word's clue text. */
  clueCellRow?: number;
  /** Column of the clue cell that holds this word's clue text. */
  clueCellCol?: number;
  /** Arrow direction from the clue cell into the word. */
  clueArrow?: ClueArrow;
  /** True when no adjacent # cell was found; clue falls back to the sidebar. */
  isSidebarFallback?: boolean;
}

export type WordPositions = Record<WordKey, WordPosition>;

// ── Swedish-style clue cell types ────────────────────────────────────────────

/** Four arrow types used in Swedish crossword clue cells. */
export type ClueArrow = "→" | "↓" | "↳" | "↴";

/** A single clue text + its arrow direction, associated with one word. */
export interface CluePlacement {
  text: string;
  arrow: ClueArrow;
  wordKey: WordKey;
}

/** Data stored for one # cell that has been assigned one or two clues. */
export interface ClueCellData {
  row: number;
  col: number;
  /** 1 placement = full cell; 2 placements = split cell (top/bottom halves). */
  placements: [CluePlacement] | [CluePlacement, CluePlacement];
}

/** Map from "row-col" string to the clue data for that # cell. */
export type ClueCellMap = Map<string, ClueCellData>;
