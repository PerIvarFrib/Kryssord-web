import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import PuzzleSelector, { type PuzzleOption } from "./components/PuzzleSelector";
import PuzzleInfoBar from "./components/PuzzleInfoBar";
import ControlsPanel from "./components/ControlsPanel";
import Keyboard from "./components/keyboard/Keyboard";
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
  type HighscoreEntry,
} from "./storage/highscore";
import {
  getPuzzleSignature,
  loadPuzzleSession,
  prunePuzzleSessions,
  savePuzzleSession,
  type CompletionStats,
  type StoredPuzzleSession,
} from "./storage/puzzleSession";

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

const hasAnyFilledLetter = (session: StoredPuzzleSession | null): boolean =>
  !!session?.progress.values.some((row) => row.some((cell) => cell !== ""));

function App() {
  const [selectedPuzzleId, setSelectedPuzzleId] = useState("today");
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [hasCompletedTodayPuzzle, setHasCompletedTodayPuzzle] = useState(false);
  const [isCompletionPopupOpen, setIsCompletionPopupOpen] = useState(false);
  const [completionStats, setCompletionStats] =
    useState<CompletionStats | null>(null);
  const [todayHighscores, setTodayHighscores] = useState<HighscoreEntry[]>([]);
  const [yesterdayHighscores, setYesterdayHighscores] = useState<
    HighscoreEntry[]
  >([]);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  // Tid som allerede var brukt før denne økten (gjenopprettet fra lagret spill).
  const [baseElapsedSeconds, setBaseElapsedSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [canSubmitHighscore, setCanSubmitHighscore] = useState(false);
  const [zoomMaxCellSize, setZoomMaxCellSize] = useState(60);
  const [crosswordPixelWidth, setCrosswordPixelWidth] = useState<number | null>(null);
  const ZOOM_STEP = 8;
  const ZOOM_MIN = 24;
  const ZOOM_MAX = 100;
  const lastPuzzleRef = useRef<CrosswordPuzzle | null>(null);
  const completionPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  // Nøkkel som identifiserer det KJØRENDE kryssordet (ikke bare valgt i menyen).
  // Denne settes når et kryssord faktisk lastes inn med "Last inn".
  const [currentPuzzleKey, setCurrentPuzzleKey] = useState<string | null>(null);
  // Signatur for det kjørende brettet, brukt til å validere lagret fremdrift.
  const [puzzleSignature, setPuzzleSignature] = useState<string | null>(null);

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

    // Hent eventuell lagret økt, slik at en oppdatering av siden ikke
    // sletter fremdriften brukeren har lagt ned.
    const signature = getPuzzleSignature(nextPuzzle);
    const stored = puzzleKey ? loadPuzzleSession(puzzleKey, signature) : null;

    setCurrentPuzzleKey(puzzleKey);
    setPuzzleSignature(signature);
    setPuzzle(nextPuzzle);

    if (puzzleKey) {
      setProgressByKey((prev) => ({
        ...prev,
        [puzzleKey]: stored?.progress,
      }));
    }

    // Gjenopprett (eller nullstill) fullførings-/navnestatus
    if (completionPopupTimerRef.current !== null) {
      clearTimeout(completionPopupTimerRef.current);
      completionPopupTimerRef.current = null;
    }
    setCompletionStats(stored?.completion ?? null);
    setIsCompletionPopupOpen(false);
    setHasSubmittedName(stored?.hasSubmittedName ?? false);
    setCanSubmitHighscore(stored?.canSubmitHighscore ?? false);
    if (puzzleKey === todayKey) {
      setHasCompletedTodayPuzzle(stored?.hasSavedHighscore ?? false);
    }

    const selectedOption = puzzles.find((p) => p.id === selectedPuzzleId);
    const puzzleLabel = selectedOption
      ? `${selectedOption.label} kryssord`
      : "Kryssordet";
    if (hasAnyFilledLetter(stored)) {
      setLoadMessage(`${puzzleLabel} er hentet fram igjen der du slapp.`);
    } else {
      setLoadMessage(`${puzzleLabel} er lastet inn.`);
    }

    // Tiden fortsetter der den slapp; tid mens fanen var lukket telles ikke.
    const resumedSeconds = stored?.elapsedSeconds ?? 0;
    setBaseElapsedSeconds(resumedSeconds);
    setElapsedSeconds(resumedSeconds);
    setStartTimeMs(Date.now());
  };

  // Skjul bekreftelsesmelding etter en kort stund
  useEffect(() => {
    if (!loadMessage) return;
    const id = window.setTimeout(() => {
      setLoadMessage(null);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [loadMessage]);

  const {
    totalLetters,
    confirmedLetters,
    revealedLetters,
    filledLetters,
    wordPositions,
  } = state;

  // Alt er fylt ut, men ennå ikke bekreftet/avslørt: da bør brukeren
  // gjøres oppmerksom på "Sjekk alt"-knappen.
  const shouldHighlightCheckAll =
    totalLetters > 0 &&
    filledLetters === totalLetters &&
    confirmedLetters + revealedLetters < totalLetters;

  const { wrongCheckedLettersCount, wrongCheckCounts } = state;

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
    // Rydd bort lagrede spill for datoer som ikke lenger kan spilles.
    prunePuzzleSessions([todayKey, yesterdayKey]);

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
        baseElapsedSeconds +
          Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000)),
      );
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [puzzle, startTimeMs, baseElapsedSeconds, completionStats]);

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

    // Tidsbruken påvirker ikke poengsummen, men lagres for statistikk.
    const score = calculateScore({
      totalLetters,
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
    completionPopupTimerRef.current = window.setTimeout(() => {
      setIsCompletionPopupOpen(true);
      completionPopupTimerRef.current = null;
    }, 1000);
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

  // --- Lagring av økt, slik at fremdriften overlever at siden lastes på nytt ---

  const sessionToSaveRef = useRef<Omit<
    StoredPuzzleSession,
    "version" | "savedAt"
  > | null>(null);

  const activeProgress = activePuzzleKey
    ? progressByKey[activePuzzleKey]
    : undefined;

  // Hold alltid en oppdatert kopi av det som skal lagres. Denne effekten
  // må stå før effektene som faktisk skriver til lagringen.
  useEffect(() => {
    if (!puzzle || !activePuzzleKey || !puzzleSignature) {
      sessionToSaveRef.current = null;
      return;
    }
    // Vent til kryssord-tilstanden faktisk hører til det aktive brettet.
    if (!state.isInitialized || !activeProgress) return;

    sessionToSaveRef.current = {
      dateKey: activePuzzleKey,
      puzzleSignature,
      elapsedSeconds,
      progress: activeProgress,
      completion: completionStats,
      hasSubmittedName,
      canSubmitHighscore,
      hasSavedHighscore:
        activePuzzleKey === todayKey ? hasCompletedTodayPuzzle : false,
    };
  }, [
    puzzle,
    activePuzzleKey,
    puzzleSignature,
    state.isInitialized,
    activeProgress,
    elapsedSeconds,
    completionStats,
    hasSubmittedName,
    canSubmitHighscore,
    hasCompletedTodayPuzzle,
    todayKey,
  ]);

  const flushSession = useCallback(() => {
    if (sessionToSaveRef.current) {
      savePuzzleSession(sessionToSaveRef.current);
    }
  }, []);

  // Lagre umiddelbart når selve spillet endrer seg.
  useEffect(() => {
    flushSession();
  }, [
    flushSession,
    activeProgress,
    completionStats,
    hasSubmittedName,
    canSubmitHighscore,
    hasCompletedTodayPuzzle,
  ]);

  // Tidsbruken tikker hvert sekund; den lagres jevnlig i stedet for hvert
  // sekund, og alltid når brukeren forlater eller skjuler fanen.
  useEffect(() => {
    const intervalId = window.setInterval(flushSession, 10000);
    window.addEventListener("pagehide", flushSession);
    document.addEventListener("visibilitychange", flushSession);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pagehide", flushSession);
      document.removeEventListener("visibilitychange", flushSession);
      flushSession();
    };
  }, [flushSession]);

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
    focusTrigger,
    currentClueText,
    canRevealLetter,
  } = state;

  return (
    <div className="container">
      <Header title="Daglig kryssord" subtitle="Gratis norsk kryssord hver dag">
        <PuzzleSelector
          puzzles={puzzles}
          selectedPuzzleId={selectedPuzzleId}
          onChangeSelected={handleChangeSelectedPuzzle}
          onLoadPuzzle={handleLoadPuzzle}
          onOpenHighscore={() => setIsCompletionPopupOpen(true)}
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

          <ControlsPanel
            canRevealLetter={canRevealLetter}
            highlightCheckAll={shouldHighlightCheckAll}
            onCheckAll={actions.checkAll}
            onRevealLetter={actions.revealLetter}
            onZoomIn={() => setZoomMaxCellSize((v) => Math.min(v + ZOOM_STEP, ZOOM_MAX))}
            onZoomOut={() => setZoomMaxCellSize((v) => Math.max(v - ZOOM_STEP, ZOOM_MIN))}
            canZoomIn={zoomMaxCellSize < ZOOM_MAX}
            canZoomOut={zoomMaxCellSize > ZOOM_MIN}
          />

          <div className="game-container">
            <div className="crossword-container">
              <CrosswordGrid
                layout={puzzle.layout}
                values={values}
                cellStatus={cellStatus}
                selectedCell={selectedCell}
                highlightedCells={highlightedCells}
                wordPositions={wordPositions}
                focusTrigger={focusTrigger}
                revealTarget={undefined}
                inCellRobot={undefined}
                wrongCheckCounts={wrongCheckCounts}
                clueCellMap={state.clueCellMap}
                sidebarFallbackWordKeys={state.sidebarFallbackWordKeys}
                onClueCellClick={actions.selectWordByKey}
                onChangeCell={actions.handleChangeCell}
                onCellClick={actions.handleCellClick}
                onKeyDown={actions.handleKeyDown}
                maxCellSize={zoomMaxCellSize}
                onCellSizeChange={(px) => setCrosswordPixelWidth(px)}
              />
            </div>

            {selectedWordKey && (
              <div className="current-clue-display" aria-live="polite">
                <span className="current-clue-display__text">{currentClueText}</span>
              </div>
            )}

            <div
              className="keyboard-wrapper"
              style={crosswordPixelWidth ? { width: `${crosswordPixelWidth}px` } : undefined}
            >
              <Keyboard
                onChar={(value) => actions.handleVirtualKey(value)}
                onDelete={() => actions.handleVirtualKey("DELETE")}
                onEnter={() => actions.handleVirtualKey("ENTER")}
                disabled={!selectedCell}
              />
            </div>
          </div>
        </main>
      )}

      <CompletionPopup
        isOpen={isCompletionPopupOpen}
        onClose={() => setIsCompletionPopupOpen(false)}
        score={completionStats?.score}
        todayEntries={todayHighscores}
        yesterdayEntries={yesterdayHighscores}
        onSubmitName={handleSubmitName}
        hasSubmittedName={hasSubmittedName}
        canSubmitHighscore={canSubmitHighscore}
      />

      <Footer />
    </div>
  );
}

export default App;
