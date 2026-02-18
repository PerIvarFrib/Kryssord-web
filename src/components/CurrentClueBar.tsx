export interface CurrentClueBarProps {
  visible: boolean;
  clueLabel?: string;
  clueText?: string;
}

export function CurrentClueBar({
  visible,
  clueLabel,
  clueText,
}: CurrentClueBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="current-clue" id="current-clue">
      <strong id="current-clue-number">{clueLabel}</strong>
      <span id="current-clue-text">{clueText}</span>
    </div>
  );
}

export default CurrentClueBar;
