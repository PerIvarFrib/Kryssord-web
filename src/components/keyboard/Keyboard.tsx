import { Key } from "./Key";

type Props = {
  onChar: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  disabled?: boolean;
};

const topRow = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Å"];
const middleRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ø", "Æ"];
const bottomRow = ["Z", "X", "C", "V", "B", "N", "M"];

export const Keyboard = ({ onChar, onDelete, onEnter, disabled }: Props) => {
  const handleClick = (value: string) => {
    if (disabled) return;

    if (value === "ENTER") {
      onEnter();
    } else if (value === "DELETE") {
      onDelete();
    } else {
      onChar(value);
    }
  };

  return (
    <div className="mobile-keyboard" aria-label="Tastatur">
      <div className="mobile-keyboard__row">
        {topRow.map((key) => (
          <Key key={key} value={key} onClick={handleClick} />
        ))}
      </div>
      <div className="mobile-keyboard__row">
        {middleRow.map((key) => (
          <Key key={key} value={key} onClick={handleClick} />
        ))}
      </div>
      <div className="mobile-keyboard__row mobile-keyboard__row--actions">
        {/* <Key value="ENTER" width={74} isAction onClick={handleClick}>
          ENTER
        </Key> */}
        {bottomRow.map((key) => (
          <Key key={key} value={key} onClick={handleClick} />
        ))}
        <Key value="DELETE" width={74} isAction onClick={handleClick}>
          Slett
        </Key>
      </div>
    </div>
  );
};

export default Keyboard;
