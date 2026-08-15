import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

type HighscoreRow = {
  dateKey: string;
  name: string;
  score: number;
  completedAt: string;
  totalLetters: number;
  confirmedLetters: number;
  revealedLetters: number;
  completionTimeSeconds: number;
  wrongCheckedLetters: number;
};

/**
 * Maks lengde på navn i highscore-listen.
 * Må holdes i synk med MAX_HIGHSCORE_NAME_LENGTH i src/storage/highscore.ts.
 */
const MAX_NAME_LENGTH = 40;

function validateName(rawName: unknown): string | null {
  if (typeof rawName !== "string") return null;
  const trimmed = rawName.trim();

  // Eneste kravet er at navnet ikke er tomt. Et for langt navn avvises ikke
  // — da ville brukeren blitt stående som "Anonym" — det kortes ned i stedet.
  if (trimmed.length === 0) return null;

  // Del opp i tegn (ikke UTF-16-enheter), slik at f.eks. emoji ikke kuttes i to.
  const characters = Array.from(trimmed);
  if (characters.length <= MAX_NAME_LENGTH) return trimmed;

  return characters.slice(0, MAX_NAME_LENGTH).join("").trim();
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const { dateKey } = req.query;
    if (!dateKey || typeof dateKey !== "string") {
      return res.status(400).json({ error: "Missing dateKey" });
    }

    try {
      const rows = (await sql`
        SELECT
          date_key AS "dateKey",
          name,
          score,
          completed_at AS "completedAt",
          total_letters AS "totalLetters",
          confirmed_letters AS "confirmedLetters",
          revealed_letters AS "revealedLetters",
          completion_time_seconds AS "completionTimeSeconds",
          wrong_checked_letters AS "wrongCheckedLetters"
        FROM highscores
        WHERE date_key = ${dateKey}
        ORDER BY score DESC, completed_at ASC
        LIMIT 100;
      `) as HighscoreRow[];

      return res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to load highscores" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body ?? {};
      const { action } = body;

      if (action === "rename") {
        const { dateKey, completedAt, name } = body;
        const validName = validateName(name);

        if (!dateKey || !completedAt || !validName) {
          return res.status(400).json({ error: "Invalid rename payload" });
        }

        await sql`
          UPDATE highscores
          SET name = ${validName}
          WHERE date_key = ${dateKey} AND completed_at = ${completedAt}
        `;

        return res.status(200).json({ ok: true });
      }

      const {
        dateKey,
        name,
        score,
        completedAt,
        totalLetters,
        confirmedLetters,
        revealedLetters,
        completionTimeSeconds,
        wrongCheckedLetters,
      } = body;

      const validName = validateName(name);

      if (
        !dateKey ||
        typeof dateKey !== "string" ||
        !validName ||
        typeof score !== "number" ||
        typeof totalLetters !== "number" ||
        typeof confirmedLetters !== "number" ||
        typeof revealedLetters !== "number" ||
        typeof completionTimeSeconds !== "number" ||
        typeof wrongCheckedLetters !== "number"
      ) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      if (
        !Number.isFinite(score) ||
        !Number.isFinite(totalLetters) ||
        !Number.isFinite(confirmedLetters) ||
        !Number.isFinite(revealedLetters) ||
        !Number.isFinite(completionTimeSeconds) ||
        !Number.isFinite(wrongCheckedLetters)
      ) {
        return res.status(400).json({ error: "Invalid numeric payload" });
      }

      if (totalLetters <= 0 || totalLetters > 1000) {
        return res.status(400).json({ error: "Unreasonable totalLetters" });
      }

      if (
        confirmedLetters < 0 ||
        revealedLetters < 0 ||
        completionTimeSeconds < 0 ||
        wrongCheckedLetters < 0
      ) {
        return res.status(400).json({ error: "Negative values not allowed" });
      }

      if (confirmedLetters + revealedLetters > totalLetters) {
        return res.status(400).json({ error: "Letter counts inconsistent" });
      }

      const S_max = 10 * totalLetters;
      if (score < 0 || score > S_max) {
        return res
          .status(400)
          .json({ error: "Score out of allowed range" });
      }

      await sql`
        INSERT INTO highscores (
          date_key,
          name,
          score,
          completed_at,
          total_letters,
          confirmed_letters,
          revealed_letters,
          completion_time_seconds,
          wrong_checked_letters
        ) VALUES (
          ${dateKey},
          ${validName},
          ${score},
          ${completedAt},
          ${totalLetters},
          ${confirmedLetters},
          ${revealedLetters},
          ${completionTimeSeconds},
          ${wrongCheckedLetters}
        )
      `;

      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to save highscore" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
