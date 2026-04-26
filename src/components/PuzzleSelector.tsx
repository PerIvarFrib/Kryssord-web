export interface PuzzleOption {
  id: string;
  label: string;
}

export interface PuzzleSelectorProps {
  puzzles: PuzzleOption[];
  selectedPuzzleId: string;
  onChangeSelected: (id: string) => void;
  onLoadPuzzle: () => void;
  onOpenHighscore: () => void;
}

export function PuzzleSelector({
  puzzles,
  selectedPuzzleId,
  onChangeSelected,
  onLoadPuzzle,
  onOpenHighscore,
}: PuzzleSelectorProps) {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeSelected(event.target.value);
  };

  const handleLoadClick = () => {
    onLoadPuzzle();
  };

  const isLoadDisabled = !selectedPuzzleId;

  return (
    <div className="puzzle-selector">
      <label htmlFor="puzzle-select">Velg kryssord:</label>
      <select
        id="puzzle-select"
        value={selectedPuzzleId}
        onChange={handleSelectChange}
      >
        {puzzles.map((puzzle) => (
          <option key={puzzle.id} value={puzzle.id}>
            {puzzle.label}
          </option>
        ))}
      </select>
      <button
        id="load-puzzle"
        onClick={handleLoadClick}
        disabled={isLoadDisabled}
      >
        Last inn
      </button>
      <button type="button" onClick={onOpenHighscore}>
        Vis resultat og highscore
      </button>
    </div>
  );
}

export default PuzzleSelector;
