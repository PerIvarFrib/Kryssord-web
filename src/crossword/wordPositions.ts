import type {
  CrosswordPuzzle,
  Direction,
  WordKey,
  WordPositions,
} from "./types";

export function buildWordPositions(puzzle: CrosswordPuzzle): WordPositions {
  const positions: WordPositions = {};

  const rows = puzzle.layout.length;
  const cols = rows > 0 ? puzzle.layout[0].length : 0;

  // Separate numbering for across and down, matching the JSON structure
  let acrossIndex = 1;
  let downIndex = 1;

  // Across words: scan row by row
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = puzzle.layout[row][col];
      if (ch === "#") continue;

      const isStartOfRow = col === 0 || puzzle.layout[row][col - 1] === "#";
      if (!isStartOfRow) continue;

      // Determine length of the across word
      let length = 0;
      while (col + length < cols && puzzle.layout[row][col + length] !== "#") {
        length++;
      }

      if (length < 2) {
        continue;
      }

      const numberStr = String(acrossIndex);
      // Only create a word if we have a corresponding clue/answer
      if (
        Object.prototype.hasOwnProperty.call(puzzle.answers.across, numberStr) ||
        Object.prototype.hasOwnProperty.call(puzzle.clues.across, numberStr)
      ) {
        const key: WordKey = `${numberStr}-across`;
        positions[key] = {
          key,
          number: acrossIndex,
          direction: "across" as Direction,
          row,
          col,
          length,
        };
      }

      acrossIndex++;
      // Skip to the end of this word segment
      col += length - 1;
    }
  }

  // Down words: scan column by column
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const ch = puzzle.layout[row][col];
      if (ch === "#") continue;

      const isStartOfCol = row === 0 || puzzle.layout[row - 1][col] === "#";
      if (!isStartOfCol) continue;

      // Determine length of the down word
      let length = 0;
      while (row + length < rows && puzzle.layout[row + length][col] !== "#") {
        length++;
      }

      if (length < 2) {
        continue;
      }

      const numberStr = String(downIndex);
      if (
        Object.prototype.hasOwnProperty.call(puzzle.answers.down, numberStr) ||
        Object.prototype.hasOwnProperty.call(puzzle.clues.down, numberStr)
      ) {
        const key: WordKey = `${numberStr}-down`;
        positions[key] = {
          key,
          number: downIndex,
          direction: "down" as Direction,
          row,
          col,
          length,
        };
      }

      downIndex++;
      // Skip to the end of this word segment
      row += length - 1;
    }
  }

  return positions;
}
