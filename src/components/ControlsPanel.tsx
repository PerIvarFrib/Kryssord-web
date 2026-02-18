export interface ControlsPanelProps {
  canCheckLetter: boolean;
  canCheckWord: boolean;
  canRevealLetter: boolean;
  canRevealWord: boolean;
  onCheckLetter: () => void;
  onCheckWord: () => void;
  onCheckAll: () => void;
  onRevealLetter: () => void;
  onRevealWord: () => void;
}

export function ControlsPanel({
  canCheckLetter,
  canCheckWord,
  canRevealLetter,
  canRevealWord,
  onCheckLetter,
  onCheckWord,
  onCheckAll,
  onRevealLetter,
  onRevealWord,
}: ControlsPanelProps) {
  return (
    <div className="controls">
      <h3>Kontroller</h3>
      <div className="control-group">
        <h4>Sjekk svar</h4>
        <button
          id="check-letter"
          disabled={!canCheckLetter}
          onClick={onCheckLetter}
        >
          Sjekk bokstav
        </button>
        <button id="check-word" disabled={!canCheckWord} onClick={onCheckWord}>
          Sjekk ord
        </button>
        <button id="check-all" onClick={onCheckAll}>
          Sjekk alt
        </button>
      </div>

      <div className="control-group">
        <h4>Vis svar</h4>
        <button
          id="reveal-letter"
          disabled={!canRevealLetter}
          onClick={onRevealLetter}
        >
          Vis bokstav
        </button>
        <button
          id="reveal-word"
          disabled={!canRevealWord}
          onClick={onRevealWord}
        >
          Vis ord
        </button>
      </div>
    </div>
  );
}

export default ControlsPanel;
