import { useEffect, useMemo, useState } from "react";
import type {
  CellProgressStatus,
  ClueCellMap,
  CrosswordPuzzle,
  Direction,
  WordKey,
  WordPositions,
  WordPosition,
} from "./types";
import { buildWordPositions } from "./wordPositions";
import { buildCluePlacements } from "./cluePlacements";

export interface CrosswordProgressSnapshot {
  values: string[][];
  cellStatus: CellProgressStatus[][];
  selectedCell: { row: number; col: number } | null;
  direction: Direction;
  selectedWordKey: WordKey | null;
  wrongCheckedLettersCount: number;
}

export interface CrosswordControllerState {
  values: string[][];
  cellStatus: CellProgressStatus[][];
  selectedCell: { row: number; col: number } | null;
  direction: Direction;
  highlightedCells: { row: number; col: number }[];
  selectedWordKey: WordKey | null;
  wordPositions: WordPositions;
  completedWordKeys: Set<WordKey>;
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
    wrongCheckedLettersCount: number;
  wrongCheckCounts: Record<string, number>;
  focusTrigger: number;
  currentClueLabel?: string;
  currentClueText?: string;
  canCheckLetter: boolean;
  canCheckWord: boolean;
  canRevealLetter: boolean;
  canRevealWord: boolean;
  /** Clue data for each # cell that carries an in-grid clue. */
  clueCellMap: ClueCellMap;
  /** Word keys that could not be placed in-grid and remain in the sidebar. */
  sidebarFallbackWordKeys: Set<WordKey>;
}

export interface CrosswordControllerActions {
  handleChangeCell: (row: number, col: number, value: string) => void;
  handleCellClick: (row: number, col: number) => void;
  handleKeyDown: (row: number, col: number, event: React.KeyboardEvent) => void;
  /** Handle a virtual keyboard key press (character, 'DELETE', or 'ENTER'). */
  handleVirtualKey: (key: string) => void;
  selectWord: (direction: Direction, number: number) => void;
  /** Select a word directly by its WordKey (used by clue cell click handlers). */
  selectWordByKey: (wordKey: WordKey) => void;
  checkLetter: () => void;
  checkWord: () => void;
  checkAll: () => void;
  revealLetter: () => void;
  revealWord: () => void;
  revealCellAt: (row: number, col: number) => void;
}

export interface CrosswordControllerResult {
  state: CrosswordControllerState;
  actions: CrosswordControllerActions;
}

export function useCrosswordController(
  puzzle: CrosswordPuzzle | null,
  initialProgress?: CrosswordProgressSnapshot | null,
  onProgressChange?: (snapshot: CrosswordProgressSnapshot) => void,
): CrosswordControllerResult {
  const [values, setValues] = useState<string[][]>([]);
  const [cellStatus, setCellStatus] = useState<CellProgressStatus[][]>([]);
  const [wordPositions, setWordPositions] = useState<WordPositions>({});
  const [clueCellMap, setClueCellMap] = useState<ClueCellMap>(() => new Map());
  const [sidebarFallbackWordKeys, setSidebarFallbackWordKeys] = useState<Set<WordKey>>(
    () => new Set(),
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [direction, setDirection] = useState<Direction>("across");
  const [selectedWordKey, setSelectedWordKey] = useState<WordKey | null>(null);
  const [completedWordKeys, setCompletedWordKeys] = useState<Set<WordKey>>(
    () => new Set(),
  );
  const [totalLetters, setTotalLetters] = useState(0);
  const [confirmedLetters, setConfirmedLetters] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState(0);
  const [wrongCheckedLettersCount, setWrongCheckedLettersCount] = useState(0);
  const [wrongCheckCounts, setWrongCheckCounts] = useState<Record<string, number>>({});
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Reset or restore state when puzzle changes
  useEffect(() => {
    if (!puzzle) {
      setValues([]);
      setCellStatus([]);
      setWordPositions({});
      setSelectedCell(null);
      setSelectedWordKey(null);
      setDirection("across");
      setCompletedWordKeys(new Set());
      setTotalLetters(0);
      setConfirmedLetters(0);
      setRevealedLetters(0);
      setWrongCheckedLettersCount(0);
      setWrongCheckCounts({});
      setClueCellMap(new Map());
      setSidebarFallbackWordKeys(new Set());
      setFocusTrigger(0);
      return;
    }
    const emptyValues: string[][] = [];
    const statusMatrix: CellProgressStatus[][] = [];
    let letters = 0;

    for (const row of puzzle.layout) {
      const valueRow: string[] = [];
      const statusRow: CellProgressStatus[] = [];
      for (const cellChar of row.split("")) {
        if (cellChar === "#") {
          valueRow.push("");
          statusRow.push("empty");
        } else {
          valueRow.push("");
          statusRow.push("empty");
          letters += 1;
        }
      }
      emptyValues.push(valueRow);
      statusMatrix.push(statusRow);
    }

    const positions = buildWordPositions(puzzle);
    const { wordPositions: enrichedPositions, clueCellMap: newClueCellMap, sidebarFallbackKeys } =
      buildCluePlacements(puzzle, positions);
    setWordPositions(enrichedPositions);
    setClueCellMap(newClueCellMap);
    setSidebarFallbackWordKeys(sidebarFallbackKeys);
    setTotalLetters(letters);

    if (initialProgress && initialProgress.values.length) {
      const restoredValues = initialProgress.values;
      const restoredStatus = initialProgress.cellStatus;

      setValues(restoredValues);
      setCellStatus(restoredStatus);
      setSelectedCell(initialProgress.selectedCell);
      setDirection(initialProgress.direction);
      setSelectedWordKey(initialProgress.selectedWordKey);
      setWrongCheckedLettersCount(initialProgress.wrongCheckedLettersCount);

      const flat = restoredStatus.flat();
      setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
      setRevealedLetters(flat.filter((s) => s === "revealed").length);

      const nextCompleted = new Set<WordKey>();
      for (const pos of Object.values(positions)) {
        let allCorrect = true;
        for (let i = 0; i < pos.length; i++) {
          const r = pos.direction === "across" ? pos.row : pos.row + i;
          const c = pos.direction === "across" ? pos.col + i : pos.col;
          const expected = puzzle.solved_layout[r][c];
          const actual = restoredValues[r]?.[c] ?? "";
          if (!actual || actual.toUpperCase() !== expected.toUpperCase()) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) {
          nextCompleted.add(pos.key);
        }
      }
      setCompletedWordKeys(nextCompleted);
    } else {
      setValues(emptyValues);
      setCellStatus(statusMatrix);
      setSelectedCell(null);
      setSelectedWordKey(null);
      setDirection("across");
      setCompletedWordKeys(new Set());
      setConfirmedLetters(0);
      setRevealedLetters(0);
      setWrongCheckedLettersCount(0);
      setWrongCheckCounts({});
    }
  }, [puzzle]);

  const getWordCells = (
    row: number,
    col: number,
    dir: Direction,
  ): { row: number; col: number }[] => {
    if (!puzzle) return [];
    const layout = puzzle.layout;
    const cells: { row: number; col: number }[] = [];

    if (dir === "across") {
      let startCol = col;
      while (startCol > 0 && layout[row][startCol - 1] !== "#") {
        startCol--;
      }
      let c = startCol;
      while (c < layout[row].length && layout[row][c] !== "#") {
        cells.push({ row, col: c });
        c++;
      }
    } else {
      let startRow = row;
      while (startRow > 0 && layout[startRow - 1][col] !== "#") {
        startRow--;
      }
      let r = startRow;
      while (r < layout.length && layout[r][col] !== "#") {
        cells.push({ row: r, col });
        r++;
      }
    }

    return cells;
  };

  const highlightedCells = useMemo(
    () =>
      selectedCell
        ? getWordCells(selectedCell.row, selectedCell.col, direction)
        : [],
    [selectedCell, direction],
  );

  const getWordKeyForCell = (
    row: number,
    col: number,
    dir: Direction,
  ): WordKey | null => {
    for (const pos of Object.values(wordPositions)) {
      if (pos.direction !== dir) continue;

      if (dir === "across") {
        if (pos.row === row && col >= pos.col && col < pos.col + pos.length) {
          return pos.key;
        }
      } else {
        if (pos.col === col && row >= pos.row && row < pos.row + pos.length) {
          return pos.key;
        }
      }
    }
    return null;
  };

  const selectCell = (row: number, col: number, newDirection?: Direction) => {
    if (!puzzle) return;
    if (puzzle.layout[row][col] === "#") return;

    let dir = newDirection ?? direction;

    // If the desired direction has no word for this cell, force the other direction
    if (!getWordKeyForCell(row, col, dir)) {
      const otherDir: Direction = dir === "across" ? "down" : "across";
      if (getWordKeyForCell(row, col, otherDir)) {
        dir = otherDir;
      }
    }

    setSelectedCell({ row, col });
    setDirection(dir);
    const key = getWordKeyForCell(row, col, dir);
    setSelectedWordKey(key);
    setFocusTrigger((prev) => prev + 1);
  };

  const handleChangeCell = (row: number, col: number, value: string) => {
    const isLocked = cellStatus[row]?.[col] === "correctConfirmed" || cellStatus[row]?.[col] === "revealed";

    // If cell is not locked, update the value
    if (!isLocked) {
      setValues((prev) => {
        const next = prev.map((r) => [...r]);
        if (!next[row]) {
          return prev;
        }
        next[row][col] = value;
        return next;
      });

      setCellStatus((prev) => {
        const next = prev.map((r) => [...r]);
        if (!next[row]) return prev;
        next[row][col] = value ? "unconfirmed" : "empty";
        return next;
      });
    }

    // Auto-advance to next cell if a value was typed (works for both locked and unlocked),
    // but do NOT auto-advance when we're on the last cell of a word so the cell
    // stays selected and the user can easily overwrite it.
    if (value && selectedCell) {
      const wordCells = getWordCells(row, col, direction);
      const currentIndex = wordCells.findIndex(
        (c) => c.row === row && c.col === col,
      );
      if (currentIndex >= 0) {
        const isLastInWord = currentIndex === wordCells.length - 1;

        if (isLastInWord) {
          // Keep selection on the same cell (no auto-advance), but
          // still go through selectCell so direction/word key stay in sync.
          selectCell(row, col, direction);
        } else {
          const nextCell = wordCells[currentIndex + 1];
          if (nextCell) {
            selectCell(nextCell.row, nextCell.col, direction);
          }
        }
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!puzzle) return;

    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      const toggledDirection: Direction =
        direction === "across" ? "down" : "across";
      selectCell(row, col, toggledDirection);
      // Trigger focus after toggling direction
      setFocusTrigger(prev => prev + 1);
    } else {
      selectCell(row, col);
    }
  };

  const handleKeyDown = (
    row: number,
    col: number,
    event: React.KeyboardEvent,
  ) => {
    if (!selectedCell) return;

    const wordCells = getWordCells(row, col, direction);
    const currentIndex = wordCells.findIndex(
      (c) => c.row === row && c.col === col,
    );

    const isLocked = cellStatus[row]?.[col] === "correctConfirmed" || cellStatus[row]?.[col] === "revealed";

    if (event.key === "Backspace") {
      event.preventDefault();
      
      // Only delete value if cell is not locked
      if (!isLocked) {
        setValues((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = "";
          return next;
        });
        setCellStatus((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = "empty";
          return next;
        });
      }
      
      // Move backward regardless of lock status
      if (currentIndex > 0) {
        const prevCell = wordCells[currentIndex - 1];
        selectCell(prevCell.row, prevCell.col, direction);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (direction === "across") {
        if (currentIndex > 0) {
          const prevCell = wordCells[currentIndex - 1];
          selectCell(prevCell.row, prevCell.col, direction);
        }
      } else {
        selectCell(row, col, "across");
      }
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (direction === "across") {
        if (currentIndex < wordCells.length - 1) {
          const nextCell = wordCells[currentIndex + 1];
          selectCell(nextCell.row, nextCell.col, direction);
        }
      } else {
        selectCell(row, col, "across");
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (direction === "down") {
        if (currentIndex > 0) {
          const prevCell = wordCells[currentIndex - 1];
          selectCell(prevCell.row, prevCell.col, direction);
        }
      } else {
        selectCell(row, col, "down");
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (direction === "down") {
        if (currentIndex < wordCells.length - 1) {
          const nextCell = wordCells[currentIndex + 1];
          selectCell(nextCell.row, nextCell.col, direction);
        }
      } else {
        selectCell(row, col, "down");
      }
    } else if (event.key === "Enter") {
      event.preventDefault();

      // Move to the next word in the same direction as the currently selected word,
      // wrapping around to the first word when reaching the end.
      let dirForNext: Direction | null = null;
      let currentNumber: number | null = null;

      if (selectedWordKey) {
        const [numberStr, dir] = selectedWordKey.split("-") as [
          string,
          Direction,
        ];
        currentNumber = Number(numberStr);
        dirForNext = dir;
      } else {
        dirForNext = direction;
      }

      if (!dirForNext) return;

      const wordsInDir = Object.values(wordPositions)
        .filter((pos) => pos.direction === dirForNext)
        .sort((a, b) => a.number - b.number);

      if (wordsInDir.length === 0) return;

      let target: WordPosition | undefined;
      if (currentNumber == null) {
        target = wordsInDir[0];
      } else {
        target = wordsInDir.find((pos) => pos.number > currentNumber) ??
          wordsInDir[0];
      }

      if (target) {
        selectWord(target.direction, target.number);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();

      // Swap between across and down for the current selected cell
      if (selectedCell) {
        const toggledDirection: Direction =
          direction === "across" ? "down" : "across";
        selectCell(selectedCell.row, selectedCell.col, toggledDirection);
        setFocusTrigger((prev) => prev + 1);
      }
    }
  };

  const selectWord = (dir: Direction, number: number) => {
    const key: WordKey = `${number}-${dir}`;
    const pos: WordPosition | undefined = wordPositions[key];
    if (!puzzle || !pos) return;
    selectCell(pos.row, pos.col, dir);
  };

  const updateCompletedWordsFromValues = (
    currentValues: string[][],
    previousCompleted: Set<WordKey>,
  ): Set<WordKey> => {
    if (!puzzle) return previousCompleted;

    const nextCompleted = new Set(previousCompleted);

    for (const pos of Object.values(wordPositions)) {
      let allCorrect = true;
      for (let i = 0; i < pos.length; i++) {
        const r = pos.direction === "across" ? pos.row : pos.row + i;
        const c = pos.direction === "across" ? pos.col + i : pos.col;
        const expected = puzzle.solved_layout[r][c];
        const actual = currentValues[r]?.[c] ?? "";
        if (!actual || actual.toUpperCase() !== expected.toUpperCase()) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect) {
        nextCompleted.add(pos.key);
      } else {
        nextCompleted.delete(pos.key);
      }
    }

    return nextCompleted;
  };

  const checkLetter = () => {
    if (!puzzle || !selectedCell) return;
    const { row, col } = selectedCell;
    const expected = puzzle.solved_layout[row][col];
    
    // Compute all new state values first
    const nextValues = values.map((r) => [...r]);
    const current = nextValues[row]?.[col] ?? "";
    const nextStatus = cellStatus.map((r) => [...r]);
    const status = nextStatus[row]?.[col];
    
    if (status === "revealed") {
      // revealed stays revealed, no changes
      return;
    }
    
    let wrongIncrement = 0;

    if (current && current.toUpperCase() === expected.toUpperCase()) {
      nextStatus[row][col] = "correctConfirmed";
    } else {
      if (current && current.toUpperCase() !== expected.toUpperCase()) {
        wrongIncrement = 1;
      }
      nextStatus[row][col] = "empty";
      nextValues[row][col] = "";
    }
    
    const flat = nextStatus.flat();
    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    
    // Now update all state sequentially
    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
    if (wrongIncrement > 0) {
      setWrongCheckedLettersCount((prev) => prev + wrongIncrement);
      setWrongCheckCounts((prev) => ({
        ...prev,
        [`${row}-${col}`]: (prev[`${row}-${col}`] ?? 0) + 1,
      }));
    }
    setFocusTrigger(prev => prev + 1);
  };

  const applyToWord = (
    key: WordKey | null,
    fn: (r: number, c: number, expected: string, values: string[][]) => void,
  ) => {
    if (!puzzle || !key) return;
    const pos = wordPositions[key];
    if (!pos) return;

  const nextValues = values.map((r) => [...r]);
  const nextStatus = cellStatus.map((r) => [...r]);
  let wrongIncrement = 0;
  const wrongCells: Array<[number, number]> = [];
    
    for (let i = 0; i < pos.length; i++) {
      const r = pos.direction === "across" ? pos.row : pos.row + i;
      const c = pos.direction === "across" ? pos.col + i : pos.col;
      const expected = puzzle.solved_layout[r][c];
      const before = nextValues[r]?.[c] ?? "";
      fn(r, c, expected, nextValues);
      const current = nextValues[r]?.[c] ?? "";
      const status = nextStatus[r]?.[c];
      if (before && !current) {
        wrongIncrement += 1;
        wrongCells.push([r, c]);
      }
      if (status !== "revealed") {
        if (current && current.toUpperCase() === expected.toUpperCase()) {
          nextStatus[r][c] = "correctConfirmed";
        } else if (!current) {
          nextStatus[r][c] = "empty";
        } else {
          nextStatus[r][c] = "unconfirmed";
        }
      }
    }
    
    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    const flat = nextStatus.flat();
    
    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
    if (wrongIncrement > 0) {
      setWrongCheckedLettersCount((prev) => prev + wrongIncrement);
      setWrongCheckCounts((prev) => {
        const next = { ...prev };
        for (const [wr, wc] of wrongCells) {
          const k = `${wr}-${wc}`;
          next[k] = (prev[k] ?? 0) + 1;
        }
        return next;
      });
    }
    setFocusTrigger(prev => prev + 1);
  };

  const checkWord = () => {
    applyToWord(selectedWordKey, (r, c, expected, matrix) => {
      const current = matrix[r]?.[c] ?? "";
      if (current && current.toUpperCase() !== expected.toUpperCase()) {
        matrix[r][c] = "";
      }
    });
  };

  const checkAll = () => {
    if (!puzzle) return;
    
    const nextValues = values.map((r) => [...r]);
    const nextStatus = cellStatus.map((r) => [...r]);
    let wrongIncrement = 0;
    const wrongCells: Array<[number, number]> = [];
    
    for (let r = 0; r < puzzle.layout.length; r++) {
      for (let c = 0; c < puzzle.layout[r].length; c++) {
        if (puzzle.layout[r][c] === "#") continue;
        const expected = puzzle.solved_layout[r][c];
        const current = nextValues[r]?.[c] ?? "";
        const status = nextStatus[r]?.[c];
        if (status === "revealed") continue;
        if (current && current.toUpperCase() === expected.toUpperCase()) {
          nextStatus[r][c] = "correctConfirmed";
        } else {
          if (current && current.toUpperCase() !== expected.toUpperCase()) {
            wrongIncrement += 1;
            wrongCells.push([r, c]);
          }
          nextValues[r][c] = "";
          nextStatus[r][c] = "empty";
        }
      }
    }
    
    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    const flat = nextStatus.flat();
    
    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
    if (wrongIncrement > 0) {
      setWrongCheckedLettersCount((prev) => prev + wrongIncrement);
      setWrongCheckCounts((prev) => {
        const next = { ...prev };
        for (const [wr, wc] of wrongCells) {
          const k = `${wr}-${wc}`;
          next[k] = (prev[k] ?? 0) + 1;
        }
        return next;
      });
    }
    setFocusTrigger(prev => prev + 1);
  };

  const revealLetter = () => {
    if (!puzzle || !selectedCell) return;
    const { row, col } = selectedCell;
    // Skip cells that are already locked to avoid double-counting
    if (
      cellStatus[row]?.[col] === "revealed" ||
      cellStatus[row]?.[col] === "correctConfirmed"
    )
      return;
    const expected = puzzle.solved_layout[row][col];
    
    const nextValues = values.map((r) => [...r]);
    const nextStatus = cellStatus.map((r) => [...r]);
    const current = nextValues[row]?.[col] ?? "";

    // Hvis bokstaven allerede er korrekt, skal den ikke straffes som "avslørt".
    // Marker den som bekreftet i stedet for avslørt.
    if (current && current.toUpperCase() === expected.toUpperCase()) {
      nextValues[row][col] = current.toUpperCase();
      nextStatus[row][col] = "correctConfirmed";
    } else {
      nextValues[row][col] = expected.toUpperCase();
      nextStatus[row][col] = "revealed";
    }

    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    const flat = nextStatus.flat();
    
    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
    setFocusTrigger(prev => prev + 1);
  };

  const revealWord = () => {
    if (!puzzle) return;
    const key = selectedWordKey;
    const pos = key ? wordPositions[key] : undefined;
    if (!key || !pos) return;

    const nextValues = values.map((r) => [...r]);
    const nextStatus = cellStatus.map((r) => [...r]);
    
    for (let i = 0; i < pos.length; i++) {
      const r = pos.direction === "across" ? pos.row : pos.row + i;
      const c = pos.direction === "across" ? pos.col + i : pos.col;
      // Skip cells that are already locked to avoid double-counting
      if (
        nextStatus[r]?.[c] === "revealed" ||
        nextStatus[r]?.[c] === "correctConfirmed"
      )
        continue;
      const expected = puzzle.solved_layout[r][c];
      const current = nextValues[r]?.[c] ?? "";

      // Ikke straff bokstaver som allerede er riktige; bekreft dem i stedet.
      if (current && current.toUpperCase() === expected.toUpperCase()) {
        nextValues[r][c] = current.toUpperCase();
        nextStatus[r][c] = "correctConfirmed";
      } else {
        nextValues[r][c] = expected.toUpperCase();
        nextStatus[r][c] = "revealed";
      }
    }
    
    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    const flat = nextStatus.flat();
    
    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
    setFocusTrigger(prev => prev + 1);
  };

  const revealCellAt = (row: number, col: number) => {
    if (!puzzle) return;
    // Guard: state arrays may not yet be initialized for the current puzzle
    if (!values[row] || !cellStatus[row]) return;
    const rowStr = puzzle.layout[row];
    if (!rowStr || rowStr[col] === "#" || rowStr[col] === undefined) return;
    // Skip cells that are already handled to avoid altering penalties
    if (
      cellStatus[row]?.[col] === "revealed" ||
      cellStatus[row]?.[col] === "correctConfirmed"
    )
      return;

    const expected = puzzle.solved_layout[row][col];
    const nextValues = values.map((r) => [...r]);
    const nextStatus = cellStatus.map((r) => [...r]);
    const current = nextValues[row]?.[col] ?? "";

    if (current && current.toUpperCase() === expected.toUpperCase()) {
      nextValues[row][col] = current.toUpperCase();
      nextStatus[row][col] = "correctConfirmed";
    } else {
      nextValues[row][col] = expected.toUpperCase();
      nextStatus[row][col] = "revealed";
    }

    const updatedCompleted = updateCompletedWordsFromValues(
      nextValues,
      completedWordKeys,
    );
    const flat = nextStatus.flat();

    setValues(nextValues);
    setCellStatus(nextStatus);
    setConfirmedLetters(flat.filter((s) => s === "correctConfirmed").length);
    setRevealedLetters(flat.filter((s) => s === "revealed").length);
    setCompletedWordKeys(updatedCompleted);
  };

  const currentClue = useMemo(() => {
    if (!puzzle || !selectedWordKey) return { label: undefined, text: undefined };
    const [numberStr, dir] = selectedWordKey.split("-") as [
      string,
      Direction,
    ];
    const clueNumber = Number(numberStr);
    const directionKey = dir === "across" ? "across" : "down";
    const rawClueText = puzzle.clues[directionKey][numberStr];
    const clueText = rawClueText
      ? rawClueText.charAt(0).toUpperCase() + rawClueText.slice(1)
      : rawClueText;
    const directionLabel = dir === "across" ? "Vannrett" : "Loddrett";
    return {
      label: `${clueNumber} ${directionLabel}:`,
      text: clueText,
    };
  }, [puzzle, selectedWordKey]);

  const canCheckLetter = !!(puzzle && selectedCell);
  const canCheckWord = !!(puzzle && selectedWordKey);
  const canRevealLetter = canCheckLetter;
  const canRevealWord = canCheckWord;

  const state: CrosswordControllerState = {
    values,
    cellStatus,
    selectedCell,
    direction,
    highlightedCells,
    selectedWordKey,
    wordPositions,
    completedWordKeys,
    totalLetters,
    confirmedLetters,
    revealedLetters,
    wrongCheckedLettersCount,
    wrongCheckCounts,
    focusTrigger,
    currentClueLabel: currentClue.label,
    currentClueText: currentClue.text,
    canCheckLetter,
    canCheckWord,
    canRevealLetter,
    canRevealWord,
    clueCellMap,
    sidebarFallbackWordKeys,
  };

  // Eksporter nåværende fremdrift til eventuell lytter (for lagring i App)
  useEffect(() => {
    if (!puzzle || !onProgressChange) return;
    const snapshot: CrosswordProgressSnapshot = {
      values,
      cellStatus,
      selectedCell,
      direction,
      selectedWordKey,
      wrongCheckedLettersCount,
    };
    onProgressChange(snapshot);
  }, [
    puzzle,
    values,
    cellStatus,
    selectedCell,
    direction,
    selectedWordKey,
    wrongCheckedLettersCount,
    onProgressChange,
  ]);

  const handleVirtualKey = (key: string) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (key === "DELETE" || key === "Backspace") {
      const isLocked =
        cellStatus[row]?.[col] === "correctConfirmed" ||
        cellStatus[row]?.[col] === "revealed";
      if (!isLocked) {
        setValues((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = "";
          return next;
        });
        setCellStatus((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = "empty";
          return next;
        });
      }
      const wordCells = getWordCells(row, col, direction);
      const currentIndex = wordCells.findIndex(
        (c) => c.row === row && c.col === col,
      );
      if (currentIndex > 0) {
        const prevCell = wordCells[currentIndex - 1];
        selectCell(prevCell.row, prevCell.col, direction);
      }
    } else if (key === "ENTER") {
      // Move to the next word
      if (!selectedWordKey) return;
      const [numberStr, dir] = selectedWordKey.split("-") as [string, Direction];
      const currentNumber = Number(numberStr);
      const wordsInDir = Object.values(wordPositions)
        .filter((pos) => pos.direction === dir)
        .sort((a, b) => a.number - b.number);
      if (wordsInDir.length === 0) return;
      const target =
        wordsInDir.find((pos) => pos.number > currentNumber) ?? wordsInDir[0];
      if (target) selectWord(target.direction, target.number);
    } else {
      // Regular character
      handleChangeCell(row, col, key);
    }
  };

  const actions: CrosswordControllerActions = {
    handleChangeCell,
    handleCellClick,
    handleKeyDown,
    handleVirtualKey,
    selectWord,
    selectWordByKey: (wordKey: WordKey) => {
      const pos = wordPositions[wordKey];
      if (pos) selectWord(pos.direction, pos.number);
    },
    checkLetter,
    checkWord,
    checkAll,
    revealLetter,
    revealWord,
    revealCellAt,
  };

  return { state, actions };
}
