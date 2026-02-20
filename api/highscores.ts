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
        if (!dateKey || !completedAt || !name) {
          return res.status(400).json({ error: "Invalid rename payload" });
        }

        await sql`
          UPDATE highscores
          SET name = ${name}
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

      if (
        !dateKey ||
        typeof dateKey !== "string" ||
        typeof name !== "string" ||
        typeof score !== "number"
      ) {
        return res.status(400).json({ error: "Invalid payload" });
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
          ${name},
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
