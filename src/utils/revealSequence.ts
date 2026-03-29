import type { CrosswordPuzzle } from "../crossword/types";

/** djb2 hash — converts a string to a 32-bit unsigned integer. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Mulberry32 PRNG — returns a function yielding the next value in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using a seeded PRNG. */
function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates a deterministic reveal sequence for a puzzle.
 * The sequence is identical for all players on the same puzzle.
 * Returns [row, col] pairs for all letter cells in shuffled order.
 */
export function generateRevealSequence(
  puzzle: CrosswordPuzzle,
): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < puzzle.layout.length; row++) {
    const rowStr = puzzle.layout[row];
    for (let col = 0; col < rowStr.length; col++) {
      if (rowStr[col] !== "#") {
        cells.push([row, col]);
      }
    }
  }
  const seed = hashString(puzzle.solved_layout.join(""));
  const rand = mulberry32(seed);
  return seededShuffle(cells, rand);
}
