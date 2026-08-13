/**
 * Compute per-puzzle reveal timing so the robot is guaranteed to finish
 * within L*40 seconds in the worst case (user types nothing).
 *
 *   targetSec   = 10 * L              — delay before first reveal
 *   intervalSec = 30 * L / (L − 1)   — seconds between subsequent reveals
 *
 * Edge cases: L ≤ 1 → fixed 10 s / 30 s fallback.
 */
export function getRevealTiming(totalLetters: number): {
  targetSec: number;
  intervalSec: number;
} {
  if (totalLetters <= 1) return { targetSec: 10, intervalSec: 30 };
  const targetSec = 10 * totalLetters;
  const intervalSec = Math.max(1, (30 * totalLetters) / (totalLetters - 1));
  return { targetSec, intervalSec };
}

export interface HighscoreEntry {
  name: string;
  score: number;
  dateKey: string;
  completedAt: string;
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
  completionTimeSeconds: number;
  wrongCheckedLetters: number;
}

function sortEntries(entries: HighscoreEntry[]): HighscoreEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = new Date(a.completedAt).getTime();
    const bTime = new Date(b.completedAt).getTime();
    return aTime - bTime;
  });
}

export async function getHighscoresForDate(
  dateKey: string,
): Promise<HighscoreEntry[]> {
  try {
    const res = await fetch(`/api/highscores?dateKey=${encodeURIComponent(dateKey)}`);
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as HighscoreEntry[];
    return sortEntries(data);
  } catch {
    return [];
  }
}

export async function getHighscoresForTodayAndYesterday(
  todayKey: string,
  yesterdayKey: string,
): Promise<{ today: HighscoreEntry[]; yesterday: HighscoreEntry[] }> {
  const [today, yesterday] = await Promise.all([
    getHighscoresForDate(todayKey),
    getHighscoresForDate(yesterdayKey),
  ]);
  return {
    today: sortEntries(today),
    yesterday: sortEntries(yesterday),
  };
}

export async function addHighscoreEntry(entry: HighscoreEntry): Promise<void> {
  try {
    await fetch("/api/highscores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateKey: entry.dateKey,
        name: entry.name,
        score: entry.score,
        completedAt: entry.completedAt,
        totalLetters: entry.totalLetters,
        confirmedLetters: entry.confirmedLetters,
        revealedLetters: entry.revealedLetters,
        completionTimeSeconds: entry.completionTimeSeconds,
        wrongCheckedLetters: entry.wrongCheckedLetters,
      }),
    });
  } catch {
    // Ignore network errors for now
  }
}

export async function updateHighscoreName(
  dateKey: string,
  completedAt: string,
  name: string,
): Promise<void> {
  try {
    await fetch("/api/highscores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rename",
        dateKey,
        completedAt,
        name,
      }),
    });
  } catch {
    // Ignore network errors for now
  }
}

/**
 * Poengsummen er bevisst uavhengig av tidsbruk: brukeren skal kunne ta en pause
 * eller laste siden på nytt uten å bli straffet. Tiden måles fortsatt og lagres
 * sammen med resultatet, men kun for statistikk/utvikling.
 */
export function calculateScore(params: {
  totalLetters: number; // L
  wrongCheckedLetters: number; // W
  revealedLetters: number; // R
}): number {
  const {
    totalLetters: L,
    wrongCheckedLetters: W,
    revealedLetters: R,
  } = params;

  if (L <= 0) return 0;

  const S_max = 10 * L;

  // Straff for feilbokstaver
  const P_wrong_raw = W;
  const P_wrong_max = 0.4 * S_max;
  const P_wrong = Math.min(P_wrong_raw, P_wrong_max);

  const P_revealed = R * 10; // Hver avslørt bokstav gir 10 poeng i straff

  let S = S_max - P_wrong - P_revealed;

  if (S < 0) S = 0;
  if (S > S_max) S = S_max;

  return Math.round(S);
}
