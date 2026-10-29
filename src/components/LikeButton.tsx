import { useState, type CSSProperties } from "react";
import { n } from "../lib/ar";
import { HeartIcon } from "./Icons";

type Props = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  size?: "lg" | "sm";
  /** Accessible name of the book, e.g. for "أعجبني: الأيام" */
  label: string;
};

/** Heart toggle with a count. A small burst plays when a like is added. */
export function LikeButton({ liked, count, onToggle, size = "lg", label }: Props) {
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      className={`like like-${size}`}
      aria-pressed={liked}
      aria-label={`أعجبني: ${label}، ${n(count)}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!liked) setBurst((b) => b + 1);
        onToggle();
      }}
    >
      <span className="like-heart">
        <HeartIcon size={size === "lg" ? 22 : 18} />
        {burst > 0 && liked && (
          <span className="burst" key={burst} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ "--a": `${i * 45}deg` } as CSSProperties} />
            ))}
          </span>
        )}
      </span>
      {size === "lg" && <span className="like-word">أعجبني</span>}
      <span className="like-count" key={count}>
        {n(count)}
      </span>
    </button>
  );
}
