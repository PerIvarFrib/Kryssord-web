export interface PuzzleInfoBarProps {
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
}

export function PuzzleInfoBar({
  totalLetters,
  confirmedLetters,
  revealedLetters,
}: PuzzleInfoBarProps) {
  const filled = confirmedLetters + revealedLetters;
  const safeTotal = totalLetters || 1; // avoid divide by zero
  const greenPercent = Math.min(100, (confirmedLetters / safeTotal) * 100);
  const orangePercent = Math.min(
    100 - greenPercent,
    (revealedLetters / safeTotal) * 100,
  );

  return (
    <div className="puzzle-info">
      <div className="puzzle-info-bar">
        <div
          className="puzzle-info-bar__green"
          style={{ width: `${greenPercent}%` }}
        />
        <div
          className="puzzle-info-bar__orange"
          style={{ width: `${orangePercent}%` }}
        />
      </div>
      <div className="puzzle-meta">
        <span id="puzzle-stats">
          {filled}/{totalLetters} bokstaver riktige
        </span>
      </div>
    </div>
  );
}

export default PuzzleInfoBar;
