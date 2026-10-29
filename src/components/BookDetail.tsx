import type { CSSProperties } from "react";
import type { Book } from "../data/books";
import { likesText, n, year } from "../lib/ar";
import { spineStyle } from "./spine";
import { Star } from "./Ornament";

type Props = {
  book: Book;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  error: string | null;
};

export function BookDetail({ book, likeCount, liked, onToggleLike, error }: Props) {
  const s = spineStyle(book);
  const facts = [book.year && year(book.year), book.pages && `${n(book.pages)} صفحة`].filter(
    Boolean,
  );

  return (
    <article className="book">
      <div className="cover-wrap">
        {book.cover ? (
          <img className="cover" src={book.cover} alt={`غلاف ${book.title}`} />
        ) : (
          <div
            className="cover cover-drawn"
            role="img"
            aria-label={`غلاف ${book.title}`}
            style={{ "--spine-bg": s.colors.bg, "--spine-fg": s.colors.fg } as CSSProperties}
          >
            <Star className="cover-star" size={26} />
            <span className="cover-title">{book.title}</span>
            <span className="cover-author">{book.author}</span>
          </div>
        )}
      </div>

      <div className="book-text">
        <h2>{book.title}</h2>
        <p className="byline">
          <span>{book.author}</span>
          {facts.length > 0 && <span className="facts">{facts.join("، ")}</span>}
        </p>

        <p className="blurb">{book.blurb}</p>

        {book.note && (
          <figure className="note">
            <blockquote>
              <p>{book.note}</p>
            </blockquote>
            <figcaption>لماذا هو على رفّي</figcaption>
          </figure>
        )}

        <div className="actions">
          <button type="button" className="like" aria-pressed={liked} onClick={onToggleLike}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
            </svg>
            <span>أعجبني</span>
          </button>
          <span className="like-total" aria-live="polite">
            {likesText(likeCount)}
          </span>
          {book.link && (
            <a className="more" href={book.link} target="_blank" rel="noreferrer">
              المزيد عن الكتاب
            </a>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
