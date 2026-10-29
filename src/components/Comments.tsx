import { useEffect, useState, type FormEvent } from "react";
import type { Book } from "../data/books";
import { LIMITS, type Backend, type BookComment } from "../lib/backend";
import { commentsText, n, timeAgo } from "../lib/ar";

const NAME_KEY = "book-shelf-name";

function readName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

type Props = { book: Book; backend: Backend };

export function Comments({ book, backend }: Props) {
  const [comments, setComments] = useState<BookComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState(readName);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    backend
      .listComments(book.id)
      .then((c) => alive && setComments(c))
      .catch((e: Error) => alive && setLoadError(`لم تُحمَّل التعليقات: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [backend, book.id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const nm = name.trim();
    const b = body.trim();
    if (!nm || !b) {
      setPostError(!nm ? "اكتب اسمك ليعرف القرّاء من صاحب التعليق." : "اكتب تعليقك أولًا.");
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const c = await backend.addComment(book.id, nm, b);
      rememberName(nm);
      setComments((prev) => [c, ...(prev ?? [])]);
      setBody("");
    } catch (err) {
      setPostError(`لم يُنشر تعليقك: ${(err as Error).message}`);
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: string) {
    const before = comments;
    setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
    try {
      await backend.deleteComment(id);
    } catch (err) {
      setComments(before);
      setPostError(`تعذّر حذف التعليق: ${(err as Error).message}`);
    }
  }

  const left = LIMITS.body - body.length;

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h3 id="comments-heading">
        {comments === null ? "التعليقات" : commentsText(comments.length)}
      </h3>

      <form className="comment-form" onSubmit={submit} noValidate>
        <label className="field">
          <span>اسمك</span>
          <input
            value={name}
            maxLength={LIMITS.name}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>ما رأيك في «{book.title}»؟</span>
          <textarea
            value={body}
            rows={3}
            maxLength={LIMITS.body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <div className="form-row">
          <span className="chars" aria-hidden="true">
            {left < LIMITS.body * 0.2 ? `الأحرف المتبقية: ${n(left)}` : ""}
          </span>
          <button type="submit" className="primary" disabled={posting}>
            {posting ? "جارٍ النشر…" : "انشر التعليق"}
          </button>
        </div>
        {postError && (
          <p className="error" role="alert">
            {postError}
          </p>
        )}
      </form>

      {loadError && <p className="error">{loadError}</p>}
      {comments === null && !loadError && <p className="muted">جارٍ تحميل التعليقات…</p>}
      {comments?.length === 0 && <p className="muted">كن أول من يكتب عن هذا الكتاب.</p>}

      <ol className="comment-list">
        {comments?.map((c) => (
          <li key={c.id} className="comment">
            <div className="comment-head">
              <span className="avatar" aria-hidden="true">
                {c.name.trim().charAt(0)}
              </span>
              <strong>{c.name}</strong>
              <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString("ar")}>
                {timeAgo(c.createdAt)}
              </time>
              {c.mine && (
                <button type="button" className="delete" onClick={() => remove(c.id)}>
                  حذف
                </button>
              )}
            </div>
            <p dir="auto">{c.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
