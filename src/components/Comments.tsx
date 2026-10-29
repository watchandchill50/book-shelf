import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api, LIMITS, type PostComment } from "../lib/api";
import { commentsText, n, timeAgo } from "../lib/ar";
import { useStore } from "../lib/store";
import { SITE_NAME } from "../config";

const NAME_KEY = "site-commenter-name";
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};

export function Comments({ postId, title }: { postId: string; title: string }) {
  const { isAdmin, commentsVersion, setCommentCount, notify } = useStore();
  const [all, setAll] = useState<PostComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState(readName);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    api
      .listComments(postId)
      .then((c) => {
        if (alive) {
          setAll(c);
          setLoadError(null);
        }
      })
      .catch((e: Error) => alive && setLoadError(`لم تُحمَّل التعليقات: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [postId, commentsVersion]);

  const { top, replies } = useMemo(() => {
    const top: PostComment[] = [];
    const replies = new Map<string, PostComment[]>();
    for (const c of all ?? []) {
      if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
      else top.push(c);
    }
    top.reverse(); // newest first
    return { top, replies };
  }, [all]);

  useEffect(() => {
    if (all) setCommentCount(postId, top.length);
  }, [all, top.length, postId, setCommentCount]);

  async function post(text: string, parentId: string | null) {
    const asAuthor = isAdmin;
    const who = asAuthor ? SITE_NAME : name.trim();
    if (!who) throw new Error("اكتب اسمك ليعرف القرّاء صاحب التعليق.");
    if (!text.trim()) throw new Error("اكتب تعليقك أولًا.");
    const c = await api.addComment({ postId, name: who, body: text.trim(), parentId, asAuthor });
    if (!asAuthor) {
      try {
        localStorage.setItem(NAME_KEY, who);
      } catch {
        /* ignore */
      }
    }
    setAll((prev) => [...(prev ?? []), c]);
    setFresh(c.id);
    return c;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPosting(true);
    setFormError(null);
    try {
      await post(body, null);
      setBody("");
      notify("نُشر تعليقك");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا التعليق؟")) return;
    const before = all;
    setAll((prev) => prev?.filter((c) => c.id !== id && c.parentId !== id) ?? null);
    try {
      await api.deleteComment(id);
      notify("حُذف التعليق");
    } catch (err) {
      setAll(before);
      notify(`تعذّر الحذف: ${(err as Error).message}`);
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-h">
      <h2 id="comments-h" className="comments-title">
        {all === null ? "التعليقات" : commentsText(top.length)}
      </h2>

      <form className="comment-form" onSubmit={submit} noValidate>
        {isAdmin ? (
          <p className="as-author">
            تكتبين باسم <strong>{SITE_NAME}</strong> <span className="badge-author">الكاتبة</span>
          </p>
        ) : (
          <label className="field">
            <span>اسمك</span>
            <input value={name} maxLength={LIMITS.name} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>ما رأيك في «{title}»؟</span>
          <textarea
            ref={bodyRef}
            rows={3}
            maxLength={LIMITS.comment}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>
        <div className="form-row">
          <span className="hint">
            {body.length > LIMITS.comment * 0.8 ? `الأحرف المتبقية: ${n(LIMITS.comment - body.length)}` : ""}
          </span>
          <button className="btn btn-primary" disabled={posting}>
            {posting ? "جارٍ النشر…" : "انشر التعليق"}
          </button>
        </div>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
      </form>

      {loadError && <p className="error">{loadError}</p>}
      {all === null && !loadError && (
        <div className="skeleton" aria-label="جارٍ التحميل">
          <i />
          <i />
        </div>
      )}
      {all?.length === 0 && (
        <button type="button" className="first-comment" onClick={() => bodyRef.current?.focus()}>
          كن أول من يعلّق
        </button>
      )}

      <ol className="comment-list">
        {top.map((c) => (
          <li key={c.id} className={`comment${c.id === fresh ? " is-fresh" : ""}${c.isAuthor ? " by-author" : ""}`}>
            <CommentBody c={c} canDelete={c.mine || isAdmin} onDelete={() => remove(c.id)} />

            {(replies.get(c.id) ?? []).map((r) => (
              <div key={r.id} className={`reply${r.id === fresh ? " is-fresh" : ""}`}>
                <CommentBody c={r} canDelete={r.mine || isAdmin} onDelete={() => remove(r.id)} />
              </div>
            ))}

            {isAdmin &&
              (replyTo === c.id ? (
                <ReplyForm
                  onCancel={() => setReplyTo(null)}
                  onSend={async (text) => {
                    await post(text, c.id);
                    setReplyTo(null);
                    notify("نُشر ردّك");
                  }}
                />
              ) : (
                <button type="button" className="reply-btn" onClick={() => setReplyTo(c.id)}>
                  ردّ باسم الكاتبة
                </button>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommentBody({ c, canDelete, onDelete }: { c: PostComment; canDelete: boolean; onDelete: () => void }) {
  return (
    <>
      <div className="comment-head">
        <span className={`avatar${c.isAuthor ? " avatar-author" : ""}`} aria-hidden="true">
          {c.name.trim().charAt(0)}
        </span>
        <strong>{c.name}</strong>
        {c.isAuthor && <span className="badge-author">الكاتبة</span>}
        {c.mine && !c.isAuthor && <span className="badge-you">أنت</span>}
        <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString("ar")}>
          {timeAgo(c.createdAt)}
        </time>
        {canDelete && (
          <button type="button" className="link-btn danger" onClick={onDelete}>
            حذف
          </button>
        )}
      </div>
      <p className="comment-text" dir="auto">
        {c.body}
      </p>
    </>
  );
}

export function ReplyForm({ onSend, onCancel }: { onSend: (text: string) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="reply-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          await onSend(text);
          setText("");
        } catch (x) {
          setErr((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <textarea
        autoFocus
        rows={2}
        maxLength={LIMITS.comment}
        value={text}
        placeholder="اكتبي ردّك…"
        onChange={(e) => setText(e.target.value)}
        aria-label="الرد"
      />
      <div className="form-row">
        <button type="button" className="link-btn" onClick={onCancel}>
          إلغاء
        </button>
        <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
          {busy ? "…" : "انشري الرد"}
        </button>
      </div>
      {err && <p className="error">{err}</p>}
    </form>
  );
}
