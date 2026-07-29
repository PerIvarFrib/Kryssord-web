export interface ControlsPanelProps {
  canRevealLetter: boolean;
  onCheckAll: () => void;
  onRevealLetter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ControlsPanel({
  canRevealLetter,
  onCheckAll,
  onRevealLetter,
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
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
