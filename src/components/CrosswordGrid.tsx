import CrosswordCell from "./CrosswordCell";
import type { WordPositions } from "../crossword/types";

export interface CrosswordGridProps {
  layout: string[];
  values: string[][];
  cellStatus: string[][];
  selectedCell: { row: number; col: number } | null;
  highlightedCells: { row: number; col: number }[];
  wordPositions: WordPositions;
  focusTrigger: number;
  onChangeCell: (row: number, col: number, value: string) => void;
  onCellClick: (row: number, col: number) => void;
  onKeyDown: (row: number, col: number, event: React.KeyboardEvent) => void;
}

export function CrosswordGrid({
  layout,
  values,
  cellStatus,
  selectedCell,
  highlightedCells,
  wordPositions,
  focusTrigger,
  onChangeCell,
  onCellClick,
  onKeyDown,
}: CrosswordGridProps) {
  if (!layout.length) {
    return null;
  }

  const columnCount = layout[0].length;

  // Build a map of cell coordinates to clue numbers
  const cellNumbers: Map<string, number[]> = new Map();
  Object.values(wordPositions).forEach((pos) => {
    const key = `${pos.row}-${pos.col}`;
    const numbers = cellNumbers.get(key) || [];
    numbers.push(pos.number);
    cellNumbers.set(key, numbers);
  });

  return (
    <div
      id="crossword-grid"
      className="crossword-grid"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, var(--cell-size))`,
      }}
    >
      {layout.map((row, rowIndex) =>
        row.split("").map((cellChar, colIndex) => {
          const isSelected =
            selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isHighlighted = highlightedCells.some(
            (c) => c.row === rowIndex && c.col === colIndex,
          );
          const statusRow = cellStatus[rowIndex] ?? [];
          const status = statusRow[colIndex];
          const isLocked =
            status === "correctConfirmed" || status === "revealed";
          const cellKey = `${rowIndex}-${colIndex}`;
          const numbers = cellNumbers.get(cellKey) || [];
          const clueNumber =
            numbers.length > 0 ? Math.min(...numbers) : undefined;
          return (
            <CrosswordCell
              key={cellKey}
              isBlock={cellChar === "#"}
              value={values[rowIndex]?.[colIndex] ?? ""}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isLocked={isLocked}
              clueNumber={clueNumber}
              focusTrigger={focusTrigger}
              onChange={(value) => onChangeCell(rowIndex, colIndex, value)}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onKeyDown={(event) => onKeyDown(rowIndex, colIndex, event)}
            />
          );
        }),
      )}
    </div>
  );
}

export default CrosswordGrid;
