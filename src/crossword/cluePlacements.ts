import type {
  ClueArrow,
  ClueCellMap,
  CluePlacement,
  CrosswordPuzzle,
  WordKey,
  WordPositions,
} from "./types";

export interface CluePlacementResult {
  /** Mutated copy of wordPositions with clueCellRow/Col/clueArrow/isSidebarFallback set. */
  wordPositions: WordPositions;
  /** Map from "row-col" to clue cell data (1 or 2 placements). */
  clueCellMap: ClueCellMap;
  /** WordKeys that could not be placed in any adjacent # cell. */
  sidebarFallbackKeys: Set<WordKey>;
}

/**
 * Computes Swedish-style in-grid clue cell placements for all words.
 *
 * Standard candidates per word:
 *   - Across (r, c): try (r, c-1) with "→", then (r-1, c) with "↳"
 *   - Down   (r, c): try (r-1, c) with "↓", then (r, c-1) with "↴"
 *
 * A # cell accepts at most 2 placements; the two arrows must differ.
 * Across words are processed before down words (top slot priority).
 *
 * Overflow cells:
 *   When all in-bounds candidates fail, a new out-of-bounds position (row = -1)
 *   is allocated exclusively for that word — one word per overflow cell.
 *   Existing overflow cells are never shared.
 */
export function buildCluePlacements(
  puzzle: CrosswordPuzzle,
  wordPositions: WordPositions,
): CluePlacementResult {
  const layout = puzzle.layout;
  const rows = layout.length;
  const cols = rows > 0 ? layout[0].length : 0;

  // Deep-clone so we don't mutate the original positions object.
  const wp: WordPositions = {};
  for (const k of Object.keys(wordPositions)) {
    wp[k] = { ...wordPositions[k] };
  }

  const clueCellMap: ClueCellMap = new Map();
  const sidebarFallbackKeys: Set<WordKey> = new Set();

  /**
   * Try to assign a placement to a cell.
   * Valid target positions:
   *   - In-bounds # (block) cells in the layout.
   *   - Out-of-bounds positions (row < 0 etc.) — treated as virtual overflow cells.
   * Returns true on success.
   */
  const tryAssign = (
    cellR: number,
    cellC: number,
    placement: CluePlacement,
  ): boolean => {
    const inBoundsBlack =
      cellR >= 0 && cellR < rows && cellC >= 0 && cellC < cols &&
      layout[cellR][cellC] === "#";
    const isOutOfBounds =
      cellR < 0 || cellR >= rows || cellC < 0 || cellC >= cols;

    // Reject in-bounds non-# cells (letter cells or normal white cells).
    if (!inBoundsBlack && !isOutOfBounds) return false;

    // Overflow cells are exclusive: never share with another word.
    if (isOutOfBounds && clueCellMap.has(`${cellR}-${cellC}`)) return false;

    const key = `${cellR}-${cellC}`;
    const existing = clueCellMap.get(key);

    if (!existing) {
      clueCellMap.set(key, {
        row: cellR,
        col: cellC,
        placements: [placement],
      });
      return true;
    }

    // Overflow (out-of-bounds) cells are exclusive: never accept a second placement.
    if (isOutOfBounds) return false;

    // Accept a second placement only when the cell has exactly 1 placement
    // and the new arrow differs from the existing one (no duplicate arrows).
    if (
      existing.placements.length === 1 &&
      existing.placements[0].arrow !== placement.arrow
    ) {
      // Slot ordering priority (lower = top slot):
      //   0: →   (across, points right)
      //   1: ↳   (across, turns down-right)
      //   2: ↴   (down, enters from left then turns down — visually "above" a pure ↓)
      //   3: ↓   (down, points straight down)
      const slotPriority = (a: ClueArrow): number => {
        if (a === "→") return 0;
        if (a === "↳") return 1;
        if (a === "↴") return 2;
        return 3; // ↓
      };

      let top: CluePlacement;
      let bottom: CluePlacement;

      if (slotPriority(placement.arrow) < slotPriority(existing.placements[0].arrow)) {
        top = placement;
        bottom = existing.placements[0];
      } else {
        top = existing.placements[0];
        bottom = placement;
      }

      clueCellMap.set(key, {
        row: cellR,
        col: cellC,
        placements: [top, bottom],
      });
      return true;
    }

    return false;
  };

  // ── Sort order: across first (row ASC, col ASC), then down (col ASC, row ASC)
  const allPositions = Object.values(wp);
  const acrossPositions = allPositions
    .filter((p) => p.direction === "across")
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const downPositions = allPositions
    .filter((p) => p.direction === "down")
    .sort((a, b) => a.col - b.col || a.row - b.row);

  // Set of "row-col" keys where BOTH an across and a down word start.
  // Used to give down words priority for the shared ↳/↓ candidate cell
  // when the across word has an OOB fallback available.
  const downStartSet = new Set<string>(
    downPositions.map((p) => `${p.row}-${p.col}`),
  );

  const clueText = (pos: (typeof allPositions)[0]): string => {
    const dir = pos.direction;
    const num = String(pos.number);
    return puzzle.clues[dir][num] ?? puzzle.answers[dir][num] ?? "";
  };

  for (const pos of [...acrossPositions, ...downPositions]) {
    const { row: r, col: c, direction } = pos;

    // Full candidate list (may include out-of-bounds positions).
    const rawCandidates: Array<[number, number, ClueArrow]> =
      direction === "across"
        ? [
            [r, c - 1, "→"],
            [r - 1, c, "↳"],
          ]
        : [
            [r - 1, c, "↓"],
            [r, c - 1, "↴"],
          ];

    // In-bounds candidates first, then overflow (new cells only — never shared).
    // Overflow direction is restricted by word direction:
    //   Across words → left overflow only (col < 0); never top overflow (row < 0).
    //   Down words   → top overflow only  (row < 0); never left overflow (col < 0).
    const inBounds = rawCandidates.filter(([cr, cc]) => cr >= 0 && cc >= 0);
    const outOfBounds = rawCandidates.filter(([cr, cc]) => {
      if (cr >= 0 && cc >= 0) return false; // in-bounds handled above
      if (direction === "down" && cc < 0) return false;   // down words never use left overflow
      if (direction === "across" && cr < 0) return false; // across words never use top overflow
      return true;
    });
    const orderedCandidates = [...inBounds, ...outOfBounds];

    const text = clueText(pos);
    let placed = false;

    for (const [cr, cc, arrow] of orderedCandidates) {
      // Yield the ↳ in-bounds slot to the competing down word when:
      //   1. This is an across word using the ↳ candidate (cell above start column).
      //   2. A down word starts at the same (row, col) — it will also want this cell (↓).
      //   3. The cell is already at 1 placement, so only one more clue can fit.
      //   4. An OOB fallback exists for this across word.
      // Without this, the across word fills the cell's last slot and the down word
      // is forced to sidebar even though the across word could use OOB instead.
      if (
        direction === "across" &&
        arrow === "↳" &&
        downStartSet.has(`${r}-${c}`) &&
        outOfBounds.length > 0
      ) {
        const existing = clueCellMap.get(`${cr}-${cc}`);
        if (existing && existing.placements.length === 1) {
          continue;
        }
      }

      const placement: CluePlacement = { text, arrow, wordKey: pos.key };
      if (tryAssign(cr, cc, placement)) {
        wp[pos.key].clueCellRow = cr;
        wp[pos.key].clueCellCol = cc;
        wp[pos.key].clueArrow = arrow;
        wp[pos.key].isSidebarFallback = false;
        placed = true;
        break;
      }
    }

    if (!placed) {
      wp[pos.key].isSidebarFallback = true;
      sidebarFallbackKeys.add(pos.key);
    }
  }

  return { wordPositions: wp, clueCellMap, sidebarFallbackKeys };
}
