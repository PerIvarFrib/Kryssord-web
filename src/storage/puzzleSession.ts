import type { CrosswordPuzzle } from "../crossword/types";
import type { CrosswordProgressSnapshot } from "../crossword/useCrosswordController";

/** Statistikk for et fullført kryssord. */
export interface CompletionStats {
  score: number;
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
  completionTimeSeconds: number;
  wrongCheckedLetters: number;
  completedAt: string;
}

/**
 * Alt som må til for å gjenopprette et kryssord etter at siden lastes på nytt:
 * selve utfyllingen, tiden som er brukt, og eventuell fullføringsstatus.
 */
export interface StoredPuzzleSession {
  version: number;
  dateKey: string;
  /** Signatur for kryssordet, slik at gammel fremdrift ikke brukes på et nytt brett. */
  puzzleSignature: string;
  savedAt: string;
  elapsedSeconds: number;
  progress: CrosswordProgressSnapshot;
  completion: CompletionStats | null;
  hasSubmittedName: boolean;
  canSubmitHighscore: boolean;
  /** Om resultatet allerede er sendt til highscore-listen. */
  hasSavedHighscore: boolean;
}

const STORAGE_PREFIX = "kryssord:session:";
const SESSION_VERSION = 1;

const storageKeyFor = (dateKey: string) => `${STORAGE_PREFIX}${dateKey}`;

const getStorage = (): Storage | null => {
  try {
    // Kan kaste i privat modus / med blokkerte cookies.
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Kort signatur av brettet. Hvis et kryssord for samme dato skulle bli
 * regenerert, vil signaturen endre seg og lagret fremdrift forkastes.
 */
export function getPuzzleSignature(puzzle: CrosswordPuzzle): string {
  const source = [...puzzle.layout, "|", ...puzzle.solved_layout].join("\n");
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${source.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}

const isStringMatrix = (value: unknown): value is string[][] =>
  Array.isArray(value) &&
  value.every(
    (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"),
  );

const isValidSession = (value: unknown): value is StoredPuzzleSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<StoredPuzzleSession>;

  if (session.version !== SESSION_VERSION) return false;
  if (typeof session.dateKey !== "string") return false;
  if (typeof session.puzzleSignature !== "string") return false;
  if (typeof session.elapsedSeconds !== "number") return false;
  if (!Number.isFinite(session.elapsedSeconds) || session.elapsedSeconds < 0) {
    return false;
  }

  const progress = session.progress as
    | Partial<CrosswordProgressSnapshot>
    | undefined;
  if (!progress) return false;
  if (!isStringMatrix(progress.values)) return false;
  if (!isStringMatrix(progress.cellStatus)) return false;
  if (typeof progress.wrongCheckedLettersCount !== "number") return false;

  return true;
};

/**
 * Hent lagret økt for en dato. Returnerer null hvis ingenting er lagret,
 * hvis dataene er ugyldige, eller hvis kryssordet er byttet ut.
 */
export function loadPuzzleSession(
  dateKey: string,
  puzzleSignature: string,
): StoredPuzzleSession | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(storageKeyFor(dateKey));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      storage.removeItem(storageKeyFor(dateKey));
      return null;
    }
    if (parsed.dateKey !== dateKey) return null;
    if (parsed.puzzleSignature !== puzzleSignature) {
      storage.removeItem(storageKeyFor(dateKey));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function savePuzzleSession(
  session: Omit<StoredPuzzleSession, "version" | "savedAt">,
): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const payload: StoredPuzzleSession = {
      ...session,
      version: SESSION_VERSION,
      savedAt: new Date().toISOString(),
    };
    storage.setItem(storageKeyFor(session.dateKey), JSON.stringify(payload));
  } catch {
    // Full/utilgjengelig lagring skal aldri ødelegge spillopplevelsen.
  }
}

export function clearPuzzleSession(dateKey: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKeyFor(dateKey));
  } catch {
    // Ignorer
  }
}

/** Fjern lagrede økter for datoer som ikke lenger kan spilles. */
export function prunePuzzleSessions(keepDateKeys: string[]): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const staleKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const dateKey = key.slice(STORAGE_PREFIX.length);
      if (!keepDateKeys.includes(dateKey)) {
        staleKeys.push(key);
      }
    }
    for (const key of staleKeys) {
      storage.removeItem(key);
    }
  } catch {
    // Ignorer
  }
}
