import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  value: string;
  width?: number;
  status?: "absent" | "present" | "correct";
  onClick: (value: string) => void;
  isAction?: boolean;
};

export const Key = ({
  children,
  status,
  width = 40,
  value,
  onClick,
  isAction = false,
}: Props) => {
  const classes = [
    "keyboard-key",
    isAction ? "keyboard-key--action" : "",
    status ? `keyboard-key--${status}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const styles = {
    width: `${width}px`,
  };

  return (
    <button
      type="button"
      style={styles}
      aria-label={value}
      className={classes}
      onClick={() => onClick(value)}
    >
      {children || value}
    </button>
  );
};

export default Key;
