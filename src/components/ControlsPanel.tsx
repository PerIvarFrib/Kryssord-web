import AutoRevealRobot, { type RobotState } from "./AutoRevealRobot";

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
  autoRevealEnabled: boolean;
  onToggleAutoReveal: () => void;
  robotState: RobotState;
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
  autoRevealEnabled,
  onToggleAutoReveal,
  robotState,
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

        <div className="auto-reveal-row">
          <label className="auto-reveal-toggle">
            <input
              type="checkbox"
              checked={autoRevealEnabled}
              onChange={onToggleAutoReveal}
            />
            <AutoRevealRobot robotState={robotState} />
            <span className="auto-reveal-track">
              <span className="auto-reveal-knob" />
            </span>
            <span className="auto-reveal-label-text">
              {autoRevealEnabled ? "Skru av roboten" : "Skru på roboten"}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default ControlsPanel;
