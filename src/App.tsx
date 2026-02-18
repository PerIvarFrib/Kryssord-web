import "./App.css";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import PuzzleSelector, { type PuzzleOption } from "./components/PuzzleSelector";
import PuzzleInfoBar from "./components/PuzzleInfoBar";
import CurrentClueBar from "./components/CurrentClueBar";
import ControlsPanel from "./components/ControlsPanel";
import ClueSidebar from "./components/ClueSidebar";
import Footer from "./components/Footer";
import { type CrosswordPuzzle } from "./crossword/types";
import samplePuzzleJson from "../puzzles/crossword_seed0402202601_medium.json";
import CrosswordGrid from "./components/CrosswordGrid";
import { useCrosswordController } from "./crossword/useCrosswordController";

const puzzleModules = import.meta.glob(
  "../puzzles/crossword_seed*_medium.json",
  {
    eager: true,
  },
) as Record<string, unknown>;

const getPuzzleForDate = (date: Date): CrosswordPuzzle | null => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  const dateKey = `${day}${month}${year}`;

  const entry = Object.entries(puzzleModules).find(([path]) =>
    path.includes(`seed${dateKey}`),
  );

  if (!entry) {
    return null;
  }

  const mod = entry[1] as any;
  const puzzle = (mod && mod.default) || mod;
  return puzzle as CrosswordPuzzle;
};

function App() {
  const [selectedPuzzleId, setSelectedPuzzleId] = useState("today");
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const { state, actions } = useCrosswordController(puzzle);

  // Midlertidige, statiske data for å komme i gang med React-strukturen.
  // Senere kobler vi dette mot de faktiske JSON-filene og spill-logikken.
  const puzzles: PuzzleOption[] = [
    { id: "today", label: "Dagens kryssord" },
    { id: "example-1", label: "Eksempel-kryssord 1" },
    { id: "example-2", label: "Eksempel-kryssord 2" },
  ];

  const handleChangeSelectedPuzzle = (id: string) => {
    setSelectedPuzzleId(id);
  };

  const handleLoadPuzzle = () => {
    // Første versjon: last inn et fast JSON-puslespill når brukeren klikker.
    // Senere kan vi koble dette mot faktisk dato / valg i menyen.
    let nextPuzzle: CrosswordPuzzle | null = null;

    if (selectedPuzzleId === "today") {
      nextPuzzle = getPuzzleForDate(new Date());
    }

    if (!nextPuzzle) {
      nextPuzzle = samplePuzzleJson as CrosswordPuzzle;
    }

    setPuzzle(nextPuzzle);
  };

  // Automatically load today's puzzle once on initial render when "Dagens kryssord" is selected
  useEffect(() => {
    if (!puzzle && selectedPuzzleId === "today") {
      handleLoadPuzzle();
    }
  }, [puzzle, selectedPuzzleId]);
  const {
    values,
    cellStatus,
    selectedCell,
    highlightedCells,
    selectedWordKey,
    completedWordKeys,
    focusTrigger,
    currentClueLabel,
    currentClueText,
    canCheckLetter,
    canCheckWord,
    canRevealLetter,
    canRevealWord,
  } = state;

  const acrossClues = puzzle
    ? Object.entries(puzzle.clues.across).map(([number, text]) => ({
        number: Number(number),
        text,
      }))
    : [];

  const downClues = puzzle
    ? Object.entries(puzzle.clues.down).map(([number, text]) => ({
        number: Number(number),
        text,
      }))
    : [];

  const { totalLetters, confirmedLetters, revealedLetters, wordPositions } =
    state;

  return (
    <div className="container">
      <Header
        title="🧩 Daglig kryssord"
        subtitle="Gratis norsk kryssord hver dag"
      >
        <PuzzleSelector
          puzzles={puzzles}
          selectedPuzzleId={selectedPuzzleId}
          onChangeSelected={handleChangeSelectedPuzzle}
          onLoadPuzzle={handleLoadPuzzle}
        />
      </Header>

      {puzzle && (
        <main className="main-content" id="main-content">
          <PuzzleInfoBar
            totalLetters={totalLetters}
            confirmedLetters={confirmedLetters}
            revealedLetters={revealedLetters}
          />

          <div className="game-container">
            <div className="crossword-container">
              <CurrentClueBar
                visible={!!selectedWordKey}
                clueLabel={currentClueLabel}
                clueText={currentClueText}
              />
              <CrosswordGrid
                layout={puzzle.layout}
                values={values}
                cellStatus={cellStatus}
                selectedCell={selectedCell}
                highlightedCells={highlightedCells}
                wordPositions={wordPositions}
                focusTrigger={focusTrigger}
                onChangeCell={actions.handleChangeCell}
                onCellClick={actions.handleCellClick}
                onKeyDown={actions.handleKeyDown}
              />
            </div>

            <div className="sidebar">
              <ControlsPanel
                canCheckLetter={canCheckLetter}
                canCheckWord={canCheckWord}
                canRevealLetter={canRevealLetter}
                canRevealWord={canRevealWord}
                onCheckLetter={actions.checkLetter}
                onCheckWord={actions.checkWord}
                onCheckAll={actions.checkAll}
                onRevealLetter={actions.revealLetter}
                onRevealWord={actions.revealWord}
              />

              <ClueSidebar
                acrossClues={acrossClues}
                downClues={downClues}
                selectedWordKey={selectedWordKey}
                completedWordKeys={completedWordKeys}
                onClueClick={(dir, number) => {
                  actions.selectWord(dir, number);
                }}
              />
            </div>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}

export default App;
