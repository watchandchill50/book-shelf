import { useCallback, useEffect, useMemo, useState } from "react";
import { books } from "./data/books";
import { site } from "./config";
import { createBackend, type LikeSummary } from "./lib/backend";
import { booksText } from "./lib/ar";
import { Shelf } from "./components/Shelf";
import { BookDetail } from "./components/BookDetail";
import { Comments } from "./components/Comments";

const backend = createBackend();

function idFromHash(): string | null {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return books.some((b) => b.id === id) ? id : null;
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(() => idFromHash() ?? books[0]?.id);
  const [likes, setLikes] = useState<LikeSummary>({ counts: {}, mine: [] });
  const [likesError, setLikesError] = useState<string | null>(null);

  const book = useMemo(() => books.find((b) => b.id === selectedId) ?? books[0], [selectedId]);

  // The URL follows the selected book, so one book can be shared: yoursite.com/#book-id
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash();
      if (id) setSelectedId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    backend
      .getLikes()
      .then(setLikes)
      .catch((e: Error) => setLikesError(`لم تُحمَّل الإعجابات: ${e.message}`));
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  }, []);

  const toggleLike = useCallback(
    async (bookId: string) => {
      const liked = likes.mine.includes(bookId);
      const apply = (state: LikeSummary, nowLiked: boolean): LikeSummary => ({
        counts: {
          ...state.counts,
          [bookId]: Math.max(0, (state.counts[bookId] ?? 0) + (nowLiked ? 1 : -1)),
        },
        mine: nowLiked ? [...state.mine, bookId] : state.mine.filter((id) => id !== bookId),
      });
      // Show the change straight away; undo it if saving fails.
      setLikes((s) => apply(s, !liked));
      setLikesError(null);
      try {
        await backend.setLiked(bookId, !liked);
      } catch (e) {
        setLikes((s) => apply(s, liked));
        setLikesError(`لم يُحفظ إعجابك: ${(e as Error).message}`);
      }
    },
    [likes.mine],
  );

  if (!book) {
    return (
      <main className="empty">
        <p>
          الرف فارغ. أضف كتبك في الملف <code>src/data/books.ts</code>.
        </p>
      </main>
    );
  }

  return (
    <>
      <header className="masthead">
        <h1>{site.title}</h1>
        <p>{site.intro}</p>
      </header>

      {backend.mode === "demo" && (
        <p className="demo-note" role="note">
          وضع تجريبي: الإعجابات والتعليقات محفوظة في هذا المتصفح فقط. أضف مفاتيح Supabase ليراها
          جميع الزوار.
        </p>
      )}

      <Shelf books={books} selectedId={book.id} likes={likes} onSelect={select} />

      <main className="reading">
        <BookDetail
          key={book.id}
          book={book}
          likeCount={likes.counts[book.id] ?? 0}
          liked={likes.mine.includes(book.id)}
          onToggleLike={() => toggleLike(book.id)}
          error={likesError}
        />
        <Comments key={`c-${book.id}`} book={book} backend={backend} />
      </main>

      <footer className="foot">{booksText(books.length)}</footer>
    </>
  );
}
