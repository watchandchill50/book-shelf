import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useStore, isLive } from "../lib/store";
import { Link, match, navigate, useLocation } from "../lib/router";
import { api, type PostComment, type PostType, type Settings } from "../lib/api";
import { SECTIONS, SITE_NAME, sectionOf } from "../config";
import { commentsText, formatDate, likesText, n, timeAgo, downloadsText } from "../lib/ar";
import { normalizeArabic } from "../lib/search";
import { Editor } from "./Editor";
import { Upload } from "./Upload";
import { BodyEditor } from "./BodyEditor";
import { ReplyForm } from "../components/Comments";
import { Rosette, Star } from "../components/Ornament";

/* ═════════ Gate: login, then the dashboard ═════════ */
export function Admin() {
  const { session, ready, isAdmin } = useStore();
  if (!ready) return <div className="admin-loading">جارٍ التحميل…</div>;
  if (!session) return <Login />;
  if (!isAdmin) return <NotAdmin email={session.email} />;
  return <Dashboard />;
}

function Login() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(email, password);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <Star size={28} className="page-star" />
        <h1>دخول الكاتبة</h1>
        <p className="hint">لوحة التحكم لنشر المقالات والكتب والصور والرد على التعليقات.</p>
        {api.mode === "demo" && <p className="demo-note">وضع تجريبي: أي بريد وكلمة مرور تفتح اللوحة.</p>}
        <label className="field">
          <span className="field-label">البريد الإلكتروني</span>
          <input type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">كلمة المرور</span>
          <input type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}
        <Link to="/" className="hint">
          العودة إلى الموقع
        </Link>
      </form>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  const { signOut } = useStore();
  return (
    <div className="login">
      <div className="login-card">
        <h1>لا صلاحية</h1>
        <p>
          الحساب <bdi>{email}</bdi> مسجّل، لكنه ليس حساب المديرة بعد. أضيفيه إلى جدول <code>admins</code> كما في ملف
          الإعداد، ثم سجّلي الدخول من جديد.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut()}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

/* ═════════ Dashboard shell ═════════ */
const NAV = [
  { path: "/admin", label: "نظرة عامة" },
  { path: "/admin/posts", label: "المنشورات" },
  { path: "/admin/new", label: "منشور جديد" },
  { path: "/admin/comments", label: "التعليقات" },
  { path: "/admin/settings", label: "الإعدادات" },
];

function Dashboard() {
  const { path, search } = useLocation();
  const { session, signOut } = useStore();

  let page;
  let m;
  if ((m = match("/admin/edit/:id", path))) page = <Editor key={m.id} id={m.id} />;
  else if (path === "/admin/new") page = <Editor key={`new-${search.get("type")}`} initialType={(search.get("type") as PostType) || undefined} />;
  else if (path === "/admin/posts") page = <PostsList />;
  else if (path === "/admin/comments") page = <CommentsAdmin />;
  else if (path === "/admin/settings") page = <SettingsAdmin />;
  else page = <Overview />;

  const current = (p: string) => (p === "/admin" ? path === "/admin" : path.startsWith(p) || (p === "/admin/posts" && path.startsWith("/admin/edit")));

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="admin-brand">
          <Rosette size={22} className="brand-star" />
          {SITE_NAME}
        </Link>
        <nav aria-label="لوحة التحكم">
          {NAV.map((x) => (
            <Link key={x.path} to={x.path} aria-current={current(x.path) ? "page" : undefined}>
              {x.label}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/">عرض الموقع</Link>
          <span className="hint" dir="ltr">
            {session?.email}
          </span>
          <button
            type="button"
            className="link-btn"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <section className="admin-main">{page}</section>
    </div>
  );
}

/* ═════════ Overview ═════════ */
function Overview() {
  const { posts, likes, commentCounts, settings } = useStore();
  const [recent, setRecent] = useState<PostComment[] | null>(null);
  useEffect(() => {
    api.listRecentComments(6).then(setRecent).catch(() => setRecent([]));
  }, []);

  const totalLikes = Object.values(likes.counts).reduce((a, b) => a + b, 0);
  const totalComments = Object.values(commentCounts).reduce((a, b) => a + b, 0);
  const totalDownloads = posts.reduce((a, p) => a + p.downloads, 0);
  const drafts = posts.filter((p) => p.status === "draft").length;
  const top = [...posts].sort((a, b) => (likes.counts[b.id] ?? 0) - (likes.counts[a.id] ?? 0)).filter((p) => likes.counts[p.id]).slice(0, 5);
  const byId = new Map(posts.map((p) => [p.id, p]));

  return (
    <div className="ov">
      <h1>أهلًا {SITE_NAME.split(" ")[0]}</h1>
      <p className="hint">ماذا ستكتبين اليوم؟</p>

      <div className="quick">
        {SECTIONS.map((s) => (
          <Link key={s.type} to={`/admin/new?type=${s.type}`} className="quick-btn">
            <span>+</span>
            {s.label}
          </Link>
        ))}
      </div>

      {!settings.about && (
        <p className="nudge">
          صفحة «عنّي» فارغة. <Link to="/admin/settings">أضيفي نبذتك وصورتك</Link>
        </p>
      )}

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-n">{n(posts.filter(isLive).length)}</span>
          <span>منشور ظاهر{drafts ? ` · ${n(drafts)} مسودة` : ""}</span>
        </div>
        <div className="stat">
          <span className="stat-n">{n(totalLikes)}</span>
          <span>إعجاب</span>
        </div>
        <div className="stat">
          <span className="stat-n">{n(totalComments)}</span>
          <span>تعليق</span>
        </div>
        <div className="stat">
          <span className="stat-n">{n(totalDownloads)}</span>
          <span>تحميل للكتب</span>
        </div>
      </div>

      <div className="ov-cols">
        <section className="panel">
          <p className="panel-title">آخر التعليقات</p>
          {recent === null ? (
            <p className="hint">جارٍ التحميل…</p>
          ) : recent.length === 0 ? (
            <p className="hint">لا تعليقات بعد.</p>
          ) : (
            <ul className="mini-list">
              {recent.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>
                  {c.isAuthor && <span className="badge-author">الكاتبة</span>}
                  <span className="hint"> على «{byId.get(c.postId)?.title || "اقتباس"}» · {timeAgo(c.createdAt)}</span>
                  <p className="mini-text">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/comments" className="more-link">
            كل التعليقات والرد عليها
          </Link>
        </section>

        <section className="panel">
          <p className="panel-title">الأكثر إعجابًا</p>
          {top.length === 0 ? (
            <p className="hint">لا إعجابات بعد.</p>
          ) : (
            <ol className="mini-rank">
              {top.map((p) => (
                <li key={p.id}>
                  <Link to={`/p/${p.id}`}>{p.title || p.body.slice(0, 40)}</Link>
                  <span className="hint">
                    {sectionOf(p.type).label} · {likesText(likes.counts[p.id] ?? 0)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

/* ═════════ Posts list ═════════ */
function PostsList() {
  const { posts, likes, commentCounts, deletePost, notify } = useStore();
  const [type, setType] = useState<PostType | "all">("all");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const nq = normalizeArabic(q);
    return posts.filter(
      (p) =>
        (type === "all" || p.type === type) &&
        (status === "all" || p.status === status) &&
        (!nq || normalizeArabic(`${p.title} ${p.body} ${p.refAuthor ?? ""}`).includes(nq)),
    );
  }, [posts, type, status, q]);

  async function remove(id: string, title: string) {
    if (!confirm(`حذف «${title || "هذا المنشور"}» نهائيًا؟`)) return;
    try {
      await deletePost(id);
      notify("حُذف");
    } catch (e) {
      notify((e as Error).message);
    }
  }

  return (
    <div>
      <div className="ed-head">
        <h1>المنشورات</h1>
        <Link to="/admin/new" className="btn btn-primary btn-sm">
          + منشور جديد
        </Link>
      </div>

      <div className="list-filters">
        <select value={type} onChange={(e) => setType(e.target.value as PostType | "all")} aria-label="النوع">
          <option value="all">كل الأنواع ({n(posts.length)})</option>
          {SECTIONS.map((s) => (
            <option key={s.type} value={s.type}>
              {s.title} ({n(posts.filter((p) => p.type === s.type).length)})
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="الحالة">
          <option value="all">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
        <input type="search" placeholder="ابحثي" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
      </div>

      {shown.length === 0 ? (
        <p className="empty">لا منشورات.</p>
      ) : (
        <ul className="post-table">
          {shown.map((p) => {
            const scheduled = p.status === "published" && !isLive(p);
            return (
              <li key={p.id}>
                <div className="pt-main">
                  <Link to={`/admin/edit/${p.id}`} className="pt-title">
                    {p.title || (p.type === "quote" ? `«${p.body.slice(0, 60)}»` : "بلا عنوان")}
                  </Link>
                  <span className="pt-meta">
                    <span className="meta-type">{sectionOf(p.type).label}</span>
                    <span className={`badge-status is-${scheduled ? "scheduled" : p.status}`}>
                      {p.status === "draft" ? "مسودة" : scheduled ? "مجدول" : "منشور"}
                    </span>
                    <span>{formatDate(p.publishedAt)}</span>
                    <span>{likesText(likes.counts[p.id] ?? 0)}</span>
                    <span>{commentsText(commentCounts[p.id] ?? 0)}</span>
                    {p.fileUrl && <span>{downloadsText(p.downloads)}</span>}
                  </span>
                </div>
                <div className="pt-actions">
                  <Link to={`/admin/edit/${p.id}`} className="btn btn-ghost btn-sm">
                    تعديل
                  </Link>
                  <Link to={`/p/${p.id}`} className="link-btn">
                    عرض
                  </Link>
                  <button type="button" className="link-btn danger" onClick={() => remove(p.id, p.title)}>
                    حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ═════════ Comments: moderate + reply as the author ═════════ */
function CommentsAdmin() {
  const { posts, notify, commentsVersion } = useStore();
  const [list, setList] = useState<PostComment[] | null>(null);
  const [only, setOnly] = useState<"unanswered" | "all">("unanswered");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const byId = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const load = () => api.listRecentComments(300).then(setList).catch((e) => notify((e as Error).message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsVersion]);

  const answered = new Set((list ?? []).filter((c) => c.parentId && c.isAuthor).map((c) => c.parentId));
  const top = (list ?? []).filter((c) => !c.parentId && !c.isAuthor);
  const shown = only === "unanswered" ? top.filter((c) => !answered.has(c.id)) : top;
  const repliesOf = (id: string) => (list ?? []).filter((c) => c.parentId === id).reverse();

  async function remove(id: string) {
    if (!confirm("حذف هذا التعليق؟")) return;
    try {
      await api.deleteComment(id);
      setList((l) => l?.filter((c) => c.id !== id && c.parentId !== id) ?? null);
      notify("حُذف");
    } catch (e) {
      notify((e as Error).message);
    }
  }

  return (
    <div>
      <div className="ed-head">
        <h1>التعليقات</h1>
      </div>
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={only === "unanswered"} onClick={() => setOnly("unanswered")}>
          بانتظار ردّك ({n(top.filter((c) => !answered.has(c.id)).length)})
        </button>
        <button type="button" role="tab" aria-selected={only === "all"} onClick={() => setOnly("all")}>
          الكل ({n(top.length)})
        </button>
      </div>

      {list === null ? (
        <p className="hint">جارٍ التحميل…</p>
      ) : shown.length === 0 ? (
        <p className="empty">{only === "unanswered" ? "لا تعليقات بانتظار الرد." : "لا تعليقات بعد."}</p>
      ) : (
        <ul className="c-admin">
          {shown.map((c) => {
            const post = byId.get(c.postId);
            return (
              <li key={c.id} className="panel">
                <p className="hint">
                  على{" "}
                  <Link to={`/p/${c.postId}#comments`}>{post?.title || (post?.type === "quote" ? "اقتباس" : "منشور")}</Link> ·{" "}
                  {timeAgo(c.createdAt)}
                </p>
                <p>
                  <strong>{c.name}</strong>
                </p>
                <p className="comment-text">{c.body}</p>
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} className="reply">
                    <strong>{r.name}</strong> <span className="badge-author">الكاتبة</span>
                    <p className="comment-text">{r.body}</p>
                    <button type="button" className="link-btn danger" onClick={() => remove(r.id)}>
                      حذف الرد
                    </button>
                  </div>
                ))}
                {replyTo === c.id ? (
                  <ReplyForm
                    onCancel={() => setReplyTo(null)}
                    onSend={async (text) => {
                      const r = await api.addComment({ postId: c.postId, name: SITE_NAME, body: text.trim(), parentId: c.id, asAuthor: true });
                      setList((l) => [r, ...(l ?? [])]);
                      setReplyTo(null);
                      notify("نُشر ردّك");
                    }}
                  />
                ) : (
                  <div className="c-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setReplyTo(c.id)}>
                      ردّ باسم الكاتبة
                    </button>
                    <button type="button" className="link-btn danger" onClick={() => remove(c.id)}>
                      حذف
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ═════════ Settings ═════════ */
function SettingsAdmin() {
  const { settings, saveSettings, notify } = useStore();
  const [s, setS] = useState<Settings>(settings);
  const [busy, setBusy] = useState(false);
  useEffect(() => setS(settings), [settings]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      await saveSettings({ ...s, links: s.links.filter((l) => l.label.trim() && l.url.trim()) });
      notify("حُفظت الإعدادات");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings">
      <div className="ed-head">
        <h1>الإعدادات</h1>
      </div>
      <div className="ed-grid">
        <div className="ed-main">
          <label className="field">
            <span className="field-label">سطر التعريف (يظهر تحت الاسم)</span>
            <input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="كاتبة وباحثة في الأدب والفكر" />
          </label>
          <label className="field">
            <span className="field-label">مقدمة الصفحة الرئيسية</span>
            <textarea rows={3} value={s.intro} onChange={(e) => set("intro", e.target.value)} />
          </label>
          <BodyEditor label="صفحة «عنّي»" value={s.about} onChange={(v) => set("about", v)} rows={12} />
        </div>
        <aside className="ed-side">
          <div className="panel">
            <Upload kind="image" label="صورتك الشخصية" value={s.photoUrl} onUploaded={(u) => set("photoUrl", u.url)} onClear={() => set("photoUrl", null)} />
          </div>
          <div className="panel">
            <label className="field">
              <span className="field-label">البريد للتواصل</span>
              <input type="email" dir="ltr" value={s.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <span className="field-label">روابط (X، إنستغرام…)</span>
            {s.links.map((l, i) => (
              <div className="link-row" key={i}>
                <input
                  value={l.label}
                  placeholder="الاسم"
                  onChange={(e) => set("links", s.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  aria-label="اسم الرابط"
                />
                <input
                  dir="ltr"
                  value={l.url}
                  placeholder="https://"
                  onChange={(e) => set("links", s.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  aria-label="الرابط"
                />
                <button type="button" className="link-btn danger" onClick={() => set("links", s.links.filter((_, j) => j !== i))} aria-label="حذف الرابط">
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={() => set("links", [...s.links, { label: "", url: "" }])}>
              + إضافة رابط
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={save}>
            {busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
          </button>
        </aside>
      </div>
    </div>
  );
}
