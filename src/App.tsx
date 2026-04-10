import "./App.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import PuzzleSelector, { type PuzzleOption } from "./components/PuzzleSelector";
import PuzzleInfoBar from "./components/PuzzleInfoBar";
import CurrentClueBar from "./components/CurrentClueBar";
import ControlsPanel from "./components/ControlsPanel";
import type { RobotState } from "./components/AutoRevealRobot";
import ClueSidebar from "./components/ClueSidebar";
import Footer from "./components/Footer";
import { type CrosswordPuzzle } from "./crossword/types";
import samplePuzzleJson from "../history/crossword_seed0402202601_medium.json";
import CrosswordGrid from "./components/CrosswordGrid";
import {
  useCrosswordController,
  type CrosswordProgressSnapshot,
} from "./crossword/useCrosswordController";
import CompletionPopup from "./components/CompletionPopup";
import { getTodayKey, getYesterdayKey } from "./utils/dateKeys";
import {
  addHighscoreEntry,
  calculateScore,
  getHighscoresForTodayAndYesterday,
  updateHighscoreName,
  getRevealTiming,
  type HighscoreEntry,
} from "./storage/highscore";
import { generateRevealSequence } from "./utils/revealSequence";

const puzzleModules = import.meta.glob("../puzzles/crossword_seed*.json", {
  eager: true,
}) as Record<string, unknown>;

const getPuzzleForDate = (date: Date): CrosswordPuzzle | null => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  const dateKey = `${day}${month}${year}`;

  const entry = Object.entries(puzzleModules).find(([path]) =>
    path.includes(`seed${dateKey}`),
  );

  if (!entry) {
    console.info("[PuzzleLoader] No puzzle matched date key", { dateKey });
    return null;
  }

  console.info("[PuzzleLoader] Matched puzzle file", {
    dateKey,
    path: entry[0],
  });

  const mod = entry[1] as any;
  const puzzle = (mod && mod.default) || mod;
  return puzzle as CrosswordPuzzle;
};

function App() {
  const [selectedPuzzleId, setSelectedPuzzleId] = useState("today");
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
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
  const [autoRevealEnabled, setAutoRevealEnabled] = useState(true);
  const [isRevealingNow, setIsRevealingNow] = useState(false);
  const [revealTargetCell, setRevealTargetCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const lastPuzzleRef = useRef<CrosswordPuzzle | null>(null);
  const lastRevealTickRef = useRef(0);
  const revealSequenceRef = useRef<Array<[number, number]>>([]);
  const revealSeqIndexRef = useRef(0);

  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  // Nøkkel som identifiserer det KJØRENDE kryssordet (ikke bare valgt i menyen).
  // Denne settes når et kryssord faktisk lastes inn med "Last inn".
  const [currentPuzzleKey, setCurrentPuzzleKey] = useState<string | null>(null);

  const activePuzzleKey = currentPuzzleKey;

  const [progressByKey, setProgressByKey] = useState<
    Record<string, CrosswordProgressSnapshot | undefined>
  >({});

  const handleProgressChange = useCallback(
    (snapshot: CrosswordProgressSnapshot) => {
      if (!activePuzzleKey) return;
      setProgressByKey((prev) => ({
        ...prev,
        [activePuzzleKey]: snapshot,
      }));
    },
    [activePuzzleKey],
  );

  const { state, actions } = useCrosswordController(
    puzzle,
    activePuzzleKey ? (progressByKey[activePuzzleKey] ?? null) : null,
    handleProgressChange,
  );

  // Tilgjengelige puslespillvalg i menyen.
  const puzzles: PuzzleOption[] = [
    { id: "today", label: "Dagens" },
    { id: "yesterday", label: "Gårsdagens" },
  ];

  const handleChangeSelectedPuzzle = (id: string) => {
    setSelectedPuzzleId(id);
  };

  const handleLoadPuzzle = () => {
    // Hvis dagens kryssord allerede er fullført, skal ikke "Last inn"
    // laste det inn på nytt og lagre enda en highscore. Vis bare resultatet.
    if (
      selectedPuzzleId === "today" &&
      hasCompletedTodayPuzzle &&
      completionStats
    ) {
      setIsCompletionPopupOpen(true);
      return;
    }

    let nextPuzzle: CrosswordPuzzle | null = null;
    let puzzleKey: string | null = null;

    if (selectedPuzzleId === "today") {
      nextPuzzle = getPuzzleForDate(new Date());
      puzzleKey = todayKey;
    } else if (selectedPuzzleId === "yesterday") {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      nextPuzzle = getPuzzleForDate(yesterdayDate);
      puzzleKey = yesterdayKey;
    }

    if (!nextPuzzle) {
      nextPuzzle = samplePuzzleJson as CrosswordPuzzle;
      console.info("[PuzzleLoader] Using fallback puzzle file", {
        path: "../puzzles/crossword_seed0402202601_medium.json",
        selectedPuzzleId,
      });
    }

    // Når vi bytter mellom ulike kryssord (for eksempel dagens/ gårsdagens),
    // skal auto-avslør alltid starte av. Brukeren må selv aktivere det igjen
    // per kryssord for å unngå overraskelser ved gjenopptak.
    if (currentPuzzleKey && puzzleKey && currentPuzzleKey !== puzzleKey) {
      setAutoRevealEnabled(false);
    }

    setCurrentPuzzleKey(puzzleKey);
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
      lastRevealTickRef.current = 0;
      revealSeqIndexRef.current = 0;
      revealSequenceRef.current = generateRevealSequence(nextPuzzle);
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

  const { totalLetters, confirmedLetters, revealedLetters, wordPositions } =
    state;

  // Per-puzzle timing derived from letter count
  const { targetSec: revealTargetSec, intervalSec: revealIntervalSec } =
    useMemo(() => getRevealTiming(totalLetters), [totalLetters]);
  const { wrongCheckedLettersCount, wrongCheckCounts } = state;

  const isTodayCurrentPuzzle = currentPuzzleKey === todayKey;
  const canReopenResult = !!completionStats && !!puzzle;

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

  // Last inn dagens kryssord automatisk første gang siden lastes
  useEffect(() => {
    if (!puzzle && selectedPuzzleId === "today") {
      handleLoadPuzzle();
    }
    // Vi vil bare kjøre dette én gang ved første innlasting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Auto-avslør: avslør maks én bokstav per tick i henhold til en deterministisk sekvens.
  // Når auto-avslør er pausert, fortsetter tidsstraffen å løpe, men vi hopper over
  // avsløringer i pausen og tar ikke igjen "tapte" ticks når brukeren slår på igjen.
  useEffect(() => {
    if (!puzzle || completionStats) {
      setRevealTargetCell(null);
      return;
    }

    const currentTick =
      elapsedSeconds < revealTargetSec
        ? 0
        : Math.floor((elapsedSeconds - revealTargetSec) / revealIntervalSec) +
          1;

    const seq = revealSequenceRef.current;

    // Always skip past already-handled cells so the target highlight stays in sync
    while (revealSeqIndexRef.current < seq.length) {
      const [pr, pc] = seq[revealSeqIndexRef.current];
      const s = state.cellStatus[pr]?.[pc];
      if (s !== "revealed" && s !== "correctConfirmed") break;
      revealSeqIndexRef.current += 1;
    }

    const idx = revealSeqIndexRef.current;
    setRevealTargetCell(
      idx < seq.length ? { row: seq[idx][0], col: seq[idx][1] } : null,
    );

    if (currentTick <= lastRevealTickRef.current) return;

    // Hold alltid tritt med tiden slik at pauser ikke bygger opp et backlogg
    // av avsløringer som fyrer av når auto-avslør slås på igjen.
    if (!autoRevealEnabled) {
      lastRevealTickRef.current = currentTick;
      return;
    }

    if (idx >= seq.length) {
      lastRevealTickRef.current = currentTick;
      return;
    }

    const [r, c] = seq[idx];
    revealSeqIndexRef.current += 1;
    lastRevealTickRef.current = currentTick;
    actions.revealCellAt(r, c);
    setIsRevealingNow(true);
    window.setTimeout(() => setIsRevealingNow(false), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, autoRevealEnabled, puzzle, completionStats]);

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

    if (isTodayPuzzle && !hasCompletedTodayPuzzle) {
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
    hasCompletedTodayPuzzle,
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

  // Derive the robot animation state from current reveal status
  const robotState: RobotState = (() => {
    if (!puzzle || completionStats) return "done";
    if (!autoRevealEnabled) return "sleeping";
    if (isRevealingNow) return "revealing";
    // "thinking": up to 3 seconds before the next reveal tick fires
    const nextRevealAtSec =
      revealTargetSec + lastRevealTickRef.current * revealIntervalSec;
    if (
      nextRevealAtSec > elapsedSeconds &&
      nextRevealAtSec - elapsedSeconds <= 3 &&
      revealSeqIndexRef.current < revealSequenceRef.current.length
    ) {
      return "thinking";
    }
    return "idle";
  })();

  const inCellRobot: "thinking" | "revealing" | undefined =
    robotState === "thinking" || robotState === "revealing"
      ? robotState
      : undefined;

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

          {canReopenResult && (
            <div className="completion-reopen">
              <button
                type="button"
                onClick={() => setIsCompletionPopupOpen(true)}
              >
                {isTodayCurrentPuzzle
                  ? "Vis resultat og highscore"
                  : "Vis resultat"}
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
                revealTarget={revealTargetCell}
                inCellRobot={inCellRobot}
                wrongCheckCounts={wrongCheckCounts}
                clueCellMap={state.clueCellMap}
                sidebarFallbackWordKeys={state.sidebarFallbackWordKeys}
                onClueCellClick={actions.selectWordByKey}
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
                autoRevealEnabled={autoRevealEnabled}
                onToggleAutoReveal={() => setAutoRevealEnabled((v) => !v)}
                robotState={robotState}
              />

              <ClueSidebar
                acrossClues={acrossClues}
                downClues={downClues}
                selectedWordKey={selectedWordKey}
                completedWordKeys={completedWordKeys}
                sidebarFallbackWordKeys={state.sidebarFallbackWordKeys}
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
