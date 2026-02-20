export interface PuzzleInfoBarProps {
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
  elapsedSeconds?: number;
  liveScore?: number;
}

export function PuzzleInfoBar({
  totalLetters,
  confirmedLetters,
  revealedLetters,
  elapsedSeconds,
  liveScore,
}: PuzzleInfoBarProps) {
  const filled = confirmedLetters + revealedLetters;
  const safeTotal = totalLetters || 1; // avoid divide by zero
  const greenPercent = Math.min(100, (confirmedLetters / safeTotal) * 100);
  const orangePercent = Math.min(
    100 - greenPercent,
    (revealedLetters / safeTotal) * 100,
  );

  const hasTiming = typeof elapsedSeconds === "number" && elapsedSeconds >= 0;
  const minutes = hasTiming ? Math.floor(elapsedSeconds! / 60) : 0;
  const seconds = hasTiming ? elapsedSeconds! % 60 : 0;
  const formattedTime = hasTiming
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : undefined;

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
        {hasTiming && (
          <span style={{ marginLeft: "16px" }}>Tid: {formattedTime}</span>
        )}
        {typeof liveScore === "number" && totalLetters > 0 && (
          <span style={{ marginLeft: "16px" }}>
            Foreløpig score: {liveScore}
          </span>
        )}
      </div>
    </div>
  );
}

export default PuzzleInfoBar;
