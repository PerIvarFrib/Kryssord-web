import { useState } from "react";
import type { HighscoreEntry } from "../storage/highscore";

export interface CompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  todayEntries: HighscoreEntry[];
  yesterdayEntries: HighscoreEntry[];
  onSubmitName: (name: string) => void;
  hasSubmittedName: boolean;
}

interface HighscoreSectionProps {
  title: string;
  entries: HighscoreEntry[];
  emptyMessage: string;
}

function HighscoreSection({
  title,
  entries,
  emptyMessage,
}: HighscoreSectionProps) {
  return (
    <section className="highscore-section">
      <h3>{title}</h3>
      {entries.length === 0 ? (
        <p className="highscore-empty">{emptyMessage}</p>
      ) : (
        <ol className="highscore-list">
          {entries.map((entry, index) => {
            const time = new Date(entry.completedAt);
            const formattedTime = time.toLocaleTimeString("nb-NO", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li
                key={`${entry.name}-${entry.completedAt}-${index}`}
                className="highscore-item"
              >
                <span className="highscore-rank">{index + 1}.</span>
                <span className="highscore-name">{entry.name}</span>
                <span className="highscore-score">{entry.score} poeng</span>
                <span className="highscore-time">kl. {formattedTime}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function CompletionPopup({
  isOpen,
  onClose,
  score,
  todayEntries,
  yesterdayEntries,
  onSubmitName,
  hasSubmittedName,
}: CompletionPopupProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (hasSubmittedName) return;
    const trimmed = name.trim();
    if (!trimmed) {
      // Tillat anonyme resultater, men bruk vennlig standardnavn
      onSubmitName("Anonym");
    } else {
      onSubmitName(trimmed);
    }
    setName("");
  };

  return (
    <div className="completion-overlay" role="dialog" aria-modal="true">
      <div className="completion-dialog">
        <header className="completion-header">
          <h2>Gratulerer!</h2>
          <p>Du har løst dagens kryssord.</p>
        </header>

        <div className="completion-score">
          <span className="completion-score-label">Din poengsum</span>
          <span className="completion-score-value">{score}</span>
        </div>

        {!hasSubmittedName ? (
          <form className="completion-form" onSubmit={handleSubmit}>
            <label htmlFor="player-name" className="completion-label">
              Skriv inn navnet ditt for highscore-listen (valgfritt):
            </label>
            <div className="completion-input-row">
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Navn eller kallenavn"
                className="completion-input"
              />
              <button type="submit">Lagre resultat</button>
            </div>
          </form>
        ) : (
          <p className="highscore-empty">
            Resultatet ditt er lagret. Takk for at du spilte!
          </p>
        )}

        <div className="highscore-sections">
          <HighscoreSection
            title="I dag"
            entries={todayEntries}
            emptyMessage="Ingen resultater for i dag ennå. Vær den første!"
          />
          <HighscoreSection
            title="I går"
            entries={yesterdayEntries}
            emptyMessage="Ingen resultater for i går ennå."
          />
        </div>

        <div className="completion-actions">
          <button type="button" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionPopup;
