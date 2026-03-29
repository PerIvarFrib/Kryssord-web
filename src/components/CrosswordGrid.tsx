import CrosswordCell from "./CrosswordCell";
import { useRef } from "react";
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
  revealTarget?: { row: number; col: number } | null;
  inCellRobot?: "thinking" | "revealing";
  wrongCheckCounts?: Record<string, number>;
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
  revealTarget,
  inCellRobot,
  wrongCheckCounts,
}: CrosswordGridProps) {
  if (!layout.length) {
    return null;
  }

  const columnCount = layout[0].length;

  // Track how many times each cell has been revealed so the pop animation re-fires
  const revealCountsRef = useRef<Record<string, number>>({});

  // Track transitions to "correctConfirmed" to fire the gray check flash.
  // We store the last-seen status per cell to detect the moment of transition.
  const checkCountsRef = useRef<Record<string, number>>({});
  const prevStatusRef = useRef<Record<string, string>>({});

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

          // Increment reveal counter when status becomes "revealed" so the
          // pop animation re-fires on the same cell if it ever needs to.
          const revealCount = revealCountsRef.current[cellKey] ?? 0;
          if (status === "revealed" && revealCount === 0) {
            revealCountsRef.current[cellKey] = 1;
          }
          const revealAnimKey = revealCountsRef.current[cellKey] ?? 0;

          const wrongAnimKey = wrongCheckCounts?.[cellKey] ?? 0;

          // Increment check counter when status transitions to "correctConfirmed"
          // (only possible via checkLetter / checkWord / checkAll, never via typing).
          const prevStatus = prevStatusRef.current[cellKey];
          if (
            status === "correctConfirmed" &&
            prevStatus !== "correctConfirmed"
          ) {
            checkCountsRef.current[cellKey] =
              (checkCountsRef.current[cellKey] ?? 0) + 1;
          }
          prevStatusRef.current[cellKey] = status;
          const checkAnimKey = checkCountsRef.current[cellKey] ?? 0;

          const robotIndicator =
            inCellRobot &&
            revealTarget?.row === rowIndex &&
            revealTarget?.col === colIndex
              ? inCellRobot
              : undefined;

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
              revealAnimKey={revealAnimKey}
              checkAnimKey={checkAnimKey}
              wrongAnimKey={wrongAnimKey}
              robotIndicator={robotIndicator}
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
