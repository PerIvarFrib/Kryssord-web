export interface ControlsPanelProps {
  canRevealLetter: boolean;
  /** Fremhev "Sjekk alt" når hele kryssordet er fylt ut, men ikke sjekket ennå. */
  highlightCheckAll?: boolean;
  onCheckAll: () => void;
  onRevealLetter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ControlsPanel({
  canRevealLetter,
  highlightCheckAll = false,
  onCheckAll,
  onRevealLetter,
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
}: ControlsPanelProps) {
  return (
    <div className="controls">
      <button
        id="check-all"
        className={highlightCheckAll ? "check-all--attention" : undefined}
        onClick={onCheckAll}
      >
        Sjekk alt
      </button>
      {highlightCheckAll && (
        <span className="sr-only" role="status" aria-live="polite">
          Kryssordet er fylt ut. Trykk «Sjekk alt» for å sjekke svaret.
        </span>
      )}
      <button
        id="reveal-letter"
        disabled={!canRevealLetter}
        onClick={onRevealLetter}
      >
        Vis bokstav
      </button>
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          aria-label="Zoom ut"
        >
          −
        </button>
        <button
          className="zoom-btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          aria-label="Zoom inn"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default ControlsPanel;
