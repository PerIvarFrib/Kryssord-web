export interface ControlsPanelProps {
  canRevealLetter: boolean;
  onCheckAll: () => void;
  onRevealLetter: () => void;
}

export function ControlsPanel({
  canRevealLetter,
  onCheckAll,
  onRevealLetter,
}: ControlsPanelProps) {
  return (
    <div className="controls">
      <button id="check-all" onClick={onCheckAll}>
        Sjekk alt
      </button>
      <button
        id="reveal-letter"
        disabled={!canRevealLetter}
        onClick={onRevealLetter}
      >
        Vis bokstav
      </button>
    </div>
  );
}

export default ControlsPanel;
