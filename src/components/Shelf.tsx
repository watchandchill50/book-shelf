import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import type { Book } from "../data/books";
import type { LikeSummary } from "../lib/backend";
import { likesText } from "../lib/ar";
import { spineStyle } from "./spine";
import { Star } from "./Ornament";

type Props = {
  books: Book[];
  selectedId: string;
  likes: LikeSummary;
  onSelect: (id: string) => void;
};

// Pointed arch, drawn in a 1000×120 box and stretched to the niche width.
const ARCH = "M0 120 C0 52 330 12 500 0 C670 12 1000 52 1000 120";

export function Shelf({ books, selectedId, likes, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);

  // The page reads right-to-left, so ← moves to the next book and → to the previous.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? 1 : -1;
    const i = books.findIndex((b) => b.id === selectedId);
    const next = books[(i + step + books.length) % books.length];
    onSelect(next.id);
    const btn = rowRef.current?.querySelector<HTMLButtonElement>(
      `[data-id="${CSS.escape(next.id)}"]`,
    );
    btn?.focus();
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <nav className="niche" aria-label="رفّ الكتب">
      <div className="niche-surface" aria-hidden="true" />
      <svg className="arch" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="arch-line" d={ARCH} />
      </svg>
      <Star className="arch-star" size={22} />

      <div className="niche-body">
        <div className="shelf-row" ref={rowRef} onKeyDown={onKeyDown}>
          {books.map((book) => {
            const s = spineStyle(book);
            const selected = book.id === selectedId;
            const count = likes.counts[book.id] ?? 0;
            return (
              <button
                key={book.id}
                data-id={book.id}
                type="button"
                className="spine"
                aria-current={selected ? "true" : undefined}
                aria-label={`${book.title}، ${book.author}، ${likesText(count)}`}
                onClick={() => onSelect(book.id)}
                style={
                  {
                    "--spine-bg": s.colors.bg,
                    "--spine-fg": s.colors.fg,
                    width: s.width,
                    height: s.height,
                  } as CSSProperties
                }
              >
                <span className="spine-title">{book.title}</span>
                <span className="spine-author">{book.author.split(" ").slice(-1)[0]}</span>
              </button>
            );
          })}
        </div>
        <div className="plank" aria-hidden="true" />
      </div>
    </nav>
  );
}
