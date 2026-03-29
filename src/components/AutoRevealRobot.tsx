export type RobotState =
  | "idle"
  | "sleeping"
  | "thinking"
  | "revealing"
  | "done";

export interface AutoRevealRobotProps {
  robotState: RobotState;
}

export function AutoRevealRobot({ robotState }: AutoRevealRobotProps) {
  return (
    <span className={`robot robot--${robotState}`} aria-hidden="true">
      {robotState === "sleeping" && (
        <span className="robot__zzz" aria-hidden="true">
          <span>z</span>
          <span>z</span>
        </span>
      )}
      {robotState === "thinking" && (
        <span className="robot__thinking" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
      <span className="robot__emoji">🤖</span>
    </span>
  );
}

export default AutoRevealRobot;
