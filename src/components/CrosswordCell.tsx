import type { ChangeEvent } from "react";
import { useRef, useEffect } from "react";
import ClueCellContent from "./ClueCellContent";
import type { ClueCellData, WordKey } from "../crossword/types";

export interface CrosswordCellProps {
  isBlock: boolean;
  value?: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isLocked?: boolean;
  /** Increment to re-trigger the reveal pop animation on the same cell. */
  revealAnimKey?: number;
  /** Increment to re-trigger the check confirmation flash on the same cell. */
  checkAnimKey?: number;
  /** Increment to re-trigger the wrong-check (wiped letter) flash on the same cell. */
  wrongAnimKey?: number;
  /** Shows the robot in this cell: 'thinking' (pulsing) or 'revealing' (scale-out). */
  robotIndicator?: "thinking" | "revealing";
  clueNumber?: number;
  focusTrigger?: number;
  onChange?: (value: string) => void;
  onClick?: () => void;
  onKeyDown?: (
    event: React.KeyboardEvent,
  ) => void; /** When set, this block cell renders clue text instead of a solid black square. */
  clueCellData?: ClueCellData;
  /** Called when a clue slot inside the cell is clicked. */
  onClueCellClick?: (wordKey: WordKey) => void;
}

export function CrosswordCell({
  isBlock,
  value = "",
  isSelected = false,
  isHighlighted = false,
  revealAnimKey = 0,
  checkAnimKey = 0,
  wrongAnimKey = 0,
  robotIndicator,
  clueNumber,
  focusTrigger = 0,
  onChange,
  onClick,
  onKeyDown,
  clueCellData,
  onClueCellClick,
}: CrosswordCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when cell becomes selected or when focus is triggered
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, focusTrigger]);

  let className = isBlock ? "cell block" : "cell empty";
  if (isSelected && !isBlock) {
    className += " selected";
  } else if (isHighlighted && !isBlock) {
    className += " highlighted";
  }

  if (isBlock) {
    if (clueCellData) {
      return (
        <div className={`${className} clue-cell`}>
          <ClueCellContent
            data={clueCellData}
            onClueCellClick={onClueCellClick}
          />
        </div>
      );
    }
    return <div className={className} />;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    // Take the last character typed (allows overwriting existing letters)
    const lastChar = raw.slice(-1).toUpperCase();
    const nextValue = /[A-ZÆØÅ]/.test(lastChar) ? lastChar : "";
    // Always call onChange to allow navigation, even for locked cells
    onChange?.(nextValue);
  };

  return (
    <div className={className} onClick={onClick}>
      {clueNumber !== undefined && (
        <span className="cell-number">{clueNumber}</span>
      )}
      {/* revealAnimKey change forces this span to remount, replaying the animation */}
      {revealAnimKey > 0 && (
        <span
          key={revealAnimKey}
          className="cell-reveal-flash"
          aria-hidden="true"
        />
      )}
      {/* checkAnimKey change forces this span to remount, replaying the gray flash */}
      {checkAnimKey > 0 && (
        <span
          key={`c${checkAnimKey}`}
          className="cell-check-flash"
          aria-hidden="true"
        />
      )}
      {/* wrongAnimKey change forces this span to remount, replaying the wrong flash */}
      {wrongAnimKey > 0 && (
        <span
          key={`w${wrongAnimKey}`}
          className="cell-wrong-flash"
          aria-hidden="true"
        />
      )}
      {robotIndicator && (
        <span
          className={`cell-robot cell-robot--${robotIndicator}`}
          aria-hidden="true"
        >
          {robotIndicator === "thinking" && (
            <span className="cell-robot__dots">
              <span />
              <span />
              <span />
            </span>
          )}
          <span className="cell-robot__emoji">🤖</span>
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        inputMode="text"
      />
    </div>
  );
}

export default CrosswordCell;
