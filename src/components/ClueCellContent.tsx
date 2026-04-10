import type { ClueCellData, WordKey } from "../crossword/types";

export interface ClueCellContentProps {
  data: ClueCellData;
  onClueCellClick?: (wordKey: WordKey) => void;
}

/**
 * Renders the interior of a Swedish-style clue cell.
 *
 * - 1 placement → full-height text slot with arrow.
 * - 2 placements → two half-height slots separated by a divider line.
 *   Placement[0] is always the across clue (top half).
 *   Placement[1] is always the down clue (bottom half).
 */
export function ClueCellContent({
  data,
  onClueCellClick,
}: ClueCellContentProps) {
  const { placements } = data;

  if (placements.length === 1) {
    const p = placements[0];
    return (
      <div
        className="clue-slot"
        onClick={(e) => {
          e.stopPropagation();
          onClueCellClick?.(p.wordKey);
        }}
        title={p.text}
      >
        <span className={`clue-arrow clue-arrow-${arrowClass(p.arrow)}`}>
          {p.arrow}
        </span>
        <span className="clue-text">{p.text}</span>
      </div>
    );
  }

  const [top, bottom] = placements;
  return (
    <>
      <div
        className="clue-slot clue-slot-top"
        onClick={(e) => {
          e.stopPropagation();
          onClueCellClick?.(top.wordKey);
        }}
        title={top.text}
      >
        <span className={`clue-arrow clue-arrow-${arrowClass(top.arrow)}`}>
          {top.arrow}
        </span>
        <span className="clue-text">{top.text}</span>
      </div>
      <div className="clue-cell-divider" />
      <div
        className="clue-slot clue-slot-bottom"
        onClick={(e) => {
          e.stopPropagation();
          onClueCellClick?.(bottom.wordKey);
        }}
        title={bottom.text}
      >
        <span className={`clue-arrow clue-arrow-${arrowClass(bottom.arrow)}`}>
          {bottom.arrow}
        </span>
        <span className="clue-text">{bottom.text}</span>
      </div>
    </>
  );
}

/** Maps a Unicode arrow character to a stable CSS class name suffix. */
function arrowClass(arrow: string): string {
  switch (arrow) {
    case "→":
      return "right";
    case "↓":
      return "down";
    case "↳":
      return "down-right";
    case "↴":
      return "right-down";
    default:
      return "right";
  }
}

export default ClueCellContent;
