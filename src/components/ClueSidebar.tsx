import type { Direction, WordKey } from "../crossword/types";

export interface ClueItemData {
  number: number;
  text: string;
}

export interface ClueSidebarProps {
  acrossClues: ClueItemData[];
  downClues: ClueItemData[];
  selectedWordKey?: string | null;
  onClueClick?: (direction: Direction, number: number) => void;
  completedWordKeys?: Set<string>;
  /**
   * When provided, only clues whose WordKey is in this set are rendered.
   * Use this to show only the sidebar-fallback clues (i.e. clues that could
   * not be placed into an adjacent # cell in the grid).
   */
  sidebarFallbackWordKeys?: Set<WordKey>;
}

export function ClueSidebar({
  acrossClues,
  downClues,
  selectedWordKey,
  onClueClick,
  completedWordKeys,
  sidebarFallbackWordKeys,
}: ClueSidebarProps) {
  const isCompleted = (direction: Direction, number: number) => {
    if (!completedWordKeys) return false;
    const key = `${number}-${direction}`;
    return completedWordKeys.has(key);
  };

  // Filter to only fallback clues when the set is provided
  const visibleAcross = sidebarFallbackWordKeys
    ? acrossClues.filter((c) =>
        sidebarFallbackWordKeys.has(`${c.number}-across`),
      )
    : acrossClues;
  const visibleDown = sidebarFallbackWordKeys
    ? downClues.filter((c) => sidebarFallbackWordKeys.has(`${c.number}-down`))
    : downClues;

  return (
    <div className="clues">
      <div className="clues-section">
        <h3>Vannrett</h3>
        <div id="across-clues" className="clues-list">
          {visibleAcross.map((clue) => (
            <div
              key={`across-${clue.number}`}
              className={
                "clue-item" +
                (selectedWordKey === `${clue.number}-across` ? " active" : "") +
                (isCompleted("across", clue.number) ? " completed" : "")
              }
              onClick={() => onClueClick?.("across", clue.number)}
            >
              <span className="clue-number">{clue.number}</span>
              <span className="clue-text">{clue.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="clues-section">
        <h3>Loddrett</h3>
        <div id="down-clues" className="clues-list">
          {visibleDown.map((clue) => (
            <div
              key={`down-${clue.number}`}
              className={
                "clue-item" +
                (selectedWordKey === `${clue.number}-down` ? " active" : "") +
                (isCompleted("down", clue.number) ? " completed" : "")
              }
              onClick={() => onClueClick?.("down", clue.number)}
            >
              <span className="clue-number">{clue.number}</span>
              <span className="clue-text">{clue.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClueSidebar;
