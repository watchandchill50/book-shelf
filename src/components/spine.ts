import { SPINES, type Book, type SpineColor } from "../data/books";

const ORDER = Object.keys(SPINES) as SpineColor[];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Colour, height and thickness for a book's spine — stable per book id. */
export function spineStyle(book: Book) {
  const h = hash(book.id);
  const colors = SPINES[book.color ?? ORDER[h % ORDER.length]];
  const pages = book.pages ?? 250;
  return {
    colors,
    // thicker for longer books, within limits that keep titles readable
    width: Math.round(Math.min(68, Math.max(46, 30 + pages / 12))),
    // a little variety in height, like a real shelf
    height: 200 + (h % 5) * 12,
  };
}
