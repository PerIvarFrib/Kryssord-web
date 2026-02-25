import "./App.css";
import { useEffect, useRef, useState } from "react";
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
import CompletionPopup from "./components/CompletionPopup";
import { getTodayKey, getYesterdayKey } from "./utils/dateKeys";
import {
  addHighscoreEntry,
  calculateScore,
  getHighscoresForTodayAndYesterday,
  updateHighscoreName,
  type HighscoreEntry,
} from "./storage/highscore";

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
  const [hasCompletedTodayPuzzle, setHasCompletedTodayPuzzle] = useState(false);
  const [isCompletionPopupOpen, setIsCompletionPopupOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState<{
    score: number;
    totalLetters: number;
    confirmedLetters: number;
    revealedLetters: number;
    completionTimeSeconds: number;
    wrongCheckedLetters: number;
    completedAt: string;
  } | null>(null);
  const [todayHighscores, setTodayHighscores] = useState<HighscoreEntry[]>([]);
  const [yesterdayHighscores, setYesterdayHighscores] = useState<
    HighscoreEntry[]
  >([]);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [canSubmitHighscore, setCanSubmitHighscore] = useState(false);
  const lastPuzzleRef = useRef<CrosswordPuzzle | null>(null);

  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  // Tilgjengelige puslespillvalg i menyen.
  const puzzles: PuzzleOption[] = [
    { id: "today", label: "Dagens" },
    { id: "yesterday", label: "Gårsdagens" },
  ];

  const handleChangeSelectedPuzzle = (id: string) => {
    setSelectedPuzzleId(id);
  };

  const handleLoadPuzzle = () => {
    let nextPuzzle: CrosswordPuzzle | null = null;

    if (selectedPuzzleId === "today") {
      nextPuzzle = getPuzzleForDate(new Date());
    } else if (selectedPuzzleId === "yesterday") {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      nextPuzzle = getPuzzleForDate(yesterdayDate);
    }

    if (!nextPuzzle) {
      nextPuzzle = samplePuzzleJson as CrosswordPuzzle;
    }

    setPuzzle(nextPuzzle);

    // Nullstill fullførings-/navnestatus når et nytt kryssord lastes
    setCompletionStats(null);
    setIsCompletionPopupOpen(false);
    setHasSubmittedName(false);
    setCanSubmitHighscore(false);

    if (nextPuzzle) {
      const selectedOption = puzzles.find((p) => p.id === selectedPuzzleId);
      if (selectedOption) {
        setLoadMessage(`${selectedOption.label} kryssord er lastet inn.`);
      } else {
        setLoadMessage("Kryssordet er lastet inn.");
      }
    }

    if (nextPuzzle) {
      setStartTimeMs(Date.now());
      setElapsedSeconds(0);

      if (selectedPuzzleId === "today") {
        setHasCompletedTodayPuzzle(false);
      }
    }
  };

  // Skjul bekreftelsesmelding etter en kort stund
  useEffect(() => {
    if (!loadMessage) return;
    const id = window.setTimeout(() => {
      setLoadMessage(null);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [loadMessage]);

  // Automatically load today's puzzle once on initial render when "Dagens kryssord" is selected
  useEffect(() => {
    if (!puzzle && selectedPuzzleId === "today") {
      handleLoadPuzzle();
    }
  }, [puzzle, selectedPuzzleId]);

  const { totalLetters, confirmedLetters, revealedLetters, wordPositions } =
    state;
  const { wrongCheckedLettersCount } = state;

  const refreshHighscores = async () => {
    const { today, yesterday } = await getHighscoresForTodayAndYesterday(
      todayKey,
      yesterdayKey,
    );
    setTodayHighscores(today);
    setYesterdayHighscores(yesterday);
  };

  useEffect(() => {
    void refreshHighscores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, yesterdayKey]);

  // Oppdater tidstelling for aktivt kryssord (uansett hvilken dag)
  useEffect(() => {
    if (!puzzle) return;
    if (!startTimeMs) return;
    if (completionStats) return;

    const id = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000)),
      );
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [puzzle, startTimeMs, completionStats]);

  // Registrer fullføring for både dagens og andre kryssord,
  // men lagre highscore kun for dagens.
  useEffect(() => {
    if (!puzzle) return;
    // Når vi nettopp har lastet inn et nytt kryssord, skal vi ikke
    // tolke eventuell gammel status som en fullføring. Hopp over
    // første kjøring etter at "puzzle" er endret.
    if (lastPuzzleRef.current !== puzzle) {
      lastPuzzleRef.current = puzzle;
      return;
    }
    if (totalLetters === 0) return;
    if (!startTimeMs) return;

    const filled = confirmedLetters + revealedLetters;
    const isCompletedNow = filled === totalLetters;

    if (!isCompletedNow) return;
    // Unngå å registrere samme fullføring flere ganger
    if (completionStats) return;

    const isTodayPuzzle = selectedPuzzleId === "today";

    const completionTimeSeconds = elapsedSeconds;
    const completedAt = new Date().toISOString();

    const score = calculateScore({
      totalLetters,
      completionTimeSeconds,
      wrongCheckedLetters: wrongCheckedLettersCount,
      revealedLetters,
    });

    setCompletionStats({
      score,
      totalLetters,
      confirmedLetters,
      revealedLetters,
      completionTimeSeconds,
      wrongCheckedLetters: wrongCheckedLettersCount,
      completedAt,
    });
    setIsCompletionPopupOpen(true);
    setCanSubmitHighscore(isTodayPuzzle);

    if (isTodayPuzzle) {
      const autoEntry: HighscoreEntry = {
        name: "Anonym",
        score,
        dateKey: todayKey,
        completedAt,
        totalLetters,
        confirmedLetters,
        revealedLetters,
        completionTimeSeconds,
        wrongCheckedLetters: wrongCheckedLettersCount,
      };

      void (async () => {
        await addHighscoreEntry(autoEntry);
        await refreshHighscores();
      })();
      setHasCompletedTodayPuzzle(true);
    }
  }, [
    puzzle,
    selectedPuzzleId,
    totalLetters,
    confirmedLetters,
    revealedLetters,
    completionStats,
  ]);

  const handleSubmitName = async (name: string) => {
    if (!completionStats) return;
     if (!canSubmitHighscore) return;
    if (hasSubmittedName) return;

    await updateHighscoreName(todayKey, completionStats.completedAt, name);
    setHasSubmittedName(true);
    await refreshHighscores();
  };
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

  return (
    <div className="container">
      <Header title="Daglig kryssord" subtitle="Gratis norsk kryssord hver dag">
        <PuzzleSelector
          puzzles={puzzles}
          selectedPuzzleId={selectedPuzzleId}
          onChangeSelected={handleChangeSelectedPuzzle}
          onLoadPuzzle={handleLoadPuzzle}
        />
      </Header>

      {loadMessage && (
        <div className="load-status" role="status" aria-live="polite">
          {loadMessage}
        </div>
      )}

      {puzzle && (
        <main className="main-content" id="main-content">
          <PuzzleInfoBar
            totalLetters={totalLetters}
            confirmedLetters={confirmedLetters}
            revealedLetters={revealedLetters}
          />

          {hasCompletedTodayPuzzle && (
            <div className="completion-reopen">
              <button
                type="button"
                onClick={() => setIsCompletionPopupOpen(true)}
              >
                Vis resultat og highscore
              </button>
            </div>
          )}

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

      {completionStats && (
        <CompletionPopup
          isOpen={isCompletionPopupOpen}
          onClose={() => setIsCompletionPopupOpen(false)}
          score={completionStats.score}
          todayEntries={todayHighscores}
          yesterdayEntries={yesterdayHighscores}
          onSubmitName={handleSubmitName}
          hasSubmittedName={hasSubmittedName}
          canSubmitHighscore={canSubmitHighscore}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
