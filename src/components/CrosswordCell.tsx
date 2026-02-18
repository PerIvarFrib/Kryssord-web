import type { ChangeEvent } from "react";
import { useRef, useEffect } from "react";

export interface CrosswordCellProps {
  isBlock: boolean;
  value?: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isLocked?: boolean;
  clueNumber?: number;
  focusTrigger?: number;
  onChange?: (value: string) => void;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export function CrosswordCell({
  isBlock,
  value = "",
  isSelected = false,
  isHighlighted = false,
  clueNumber,
  focusTrigger = 0,
  onChange,
  onClick,
  onKeyDown,
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
      <input
        ref={inputRef}
        type="text"
        maxLength={1}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}

export default CrosswordCell;
