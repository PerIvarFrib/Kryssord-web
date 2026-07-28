import CrosswordCell from "./CrosswordCell";
import { useEffect, useRef, useState } from "react";
import type {
  ClueCellData,
  ClueCellMap,
  WordKey,
  WordPositions,
} from "../crossword/types";

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
  /** Clue data for # cells that carry in-grid clues. */
  clueCellMap?: ClueCellMap;
  /** Words that could not be placed in-grid and remain in the sidebar. */
  sidebarFallbackWordKeys?: Set<WordKey>;
  /** Called when the user clicks a clue slot inside a # cell. */
  onClueCellClick?: (wordKey: WordKey) => void;
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
  clueCellMap,
  sidebarFallbackWordKeys,
  onClueCellClick,
}: CrosswordGridProps) {
  if (!layout.length) {
    return null;
  }

  const columnCount = layout[0].length;

  // Collect overflow clue cells (row === -1) rendered above the main grid.
  const topOverflowByCol = new Map<number, ClueCellData>();
  // Collect overflow clue cells (col < 0) rendered to the left of the main grid.
  const leftOverflowByRow = new Map<number, ClueCellData>();
  if (clueCellMap) {
    for (const data of clueCellMap.values()) {
      if (data.row === -1) {
        topOverflowByCol.set(data.col, data);
      } else if (data.col < 0) {
        leftOverflowByRow.set(data.row, data);
      }
    }
  }
  const hasTopOverflow = topOverflowByCol.size > 0;
  const hasLeftOverflow = leftOverflowByRow.size > 0;
  const rowCount = layout.length;

  // Track how many times each cell has been revealed so the pop animation re-fires
  const revealCountsRef = useRef<Record<string, number>>({});

  // Dynamically compute --cell-size so the grid fills the wrapper width
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(57);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const totalCols = columnCount + (hasLeftOverflow ? 1 : 0);
    const compute = (width: number) => {
      const size = Math.min(Math.floor(width / totalCols), 60);
      setCellSize(Math.max(size, 20));
    };
    // Measure immediately
    compute(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        compute(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [columnCount, hasLeftOverflow]);

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
      ref={wrapperRef}
      className="crossword-grid-wrapper"
      style={{ "--cell-size": `${cellSize}px` } as React.CSSProperties}
    >
      {/* Overflow row — appears above the main grid for down-words that start at row 0 */}
      {hasTopOverflow && (
        <div
          className="crossword-overflow-row"
          style={{
            gridTemplateColumns: `${hasLeftOverflow ? "var(--cell-size) " : ""}repeat(${columnCount}, var(--cell-size))`,
          }}
        >
          {/* When a left-overflow column is present, offset the top row by one cell */}
          {hasLeftOverflow && (
            <div key="ov-corner" className="overflow-placeholder" />
          )}
          {Array.from({ length: columnCount }, (_, c) => {
            const overflowData = topOverflowByCol.get(c);
            return overflowData ? (
              <CrosswordCell
                key={`ov-c${c}`}
                isBlock={true}
                clueCellData={overflowData}
                onClueCellClick={onClueCellClick}
              />
            ) : (
              <div key={`ov-empty-c${c}`} className="overflow-placeholder" />
            );
          })}
        </div>
      )}
      <div className="crossword-grid-inner">
        {/* Overflow column — appears to the left of the main grid for across-words that start at col 0 */}
        {hasLeftOverflow && (
          <div
            className="crossword-overflow-col"
            style={{
              gridTemplateRows: `repeat(${rowCount}, var(--cell-size))`,
            }}
          >
            {Array.from({ length: rowCount }, (_, r) => {
              const overflowData = leftOverflowByRow.get(r);
              return overflowData ? (
                <CrosswordCell
                  key={`ov-r${r}`}
                  isBlock={true}
                  clueCellData={overflowData}
                  onClueCellClick={onClueCellClick}
                />
              ) : (
                <div key={`ov-empty-r${r}`} className="overflow-placeholder" />
              );
            })}
          </div>
        )}
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
                selectedCell?.row === rowIndex &&
                selectedCell?.col === colIndex;
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
              // Only show the corner clue number when the word is a sidebar fallback
              // (i.e. it could not be placed in an adjacent # clue cell).
              const fallbackNumbers = numbers.filter((n) => {
                if (!sidebarFallbackWordKeys) return true;
                // Check both across and down variants of this number
                return (
                  sidebarFallbackWordKeys.has(`${n}-across`) ||
                  sidebarFallbackWordKeys.has(`${n}-down`)
                );
              });
              const clueNumber =
                fallbackNumbers.length > 0
                  ? Math.min(...fallbackNumbers)
                  : undefined;
              const clueCellData = clueCellMap?.get(cellKey);
              return (
                <CrosswordCell
                  key={cellKey}
                  isBlock={cellChar === "#"}
                  clueCellData={clueCellData}
                  onClueCellClick={onClueCellClick}
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
      </div>
    </div>
  );
}

export default CrosswordGrid;
