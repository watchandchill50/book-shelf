import { useEffect, useMemo, useState } from "react";
import type { Post, PostInput, PostType } from "../lib/api";
import { useStore } from "../lib/store";
import { navigate, Link } from "../lib/router";
import { SECTIONS, sectionOf } from "../config";
import { BodyEditor } from "./BodyEditor";
import { Upload } from "./Upload";

type Draft = Omit<PostInput, "tags"> & { tags: string };

const TYPE_HELP: Record<PostType, string> = {
  article: "مقالة أدبية أو فكرية، بعنوان ونص طويل وصورة غلاف اختيارية.",
  prose: "نص نثري أو خاطرة.",
  poem: "قصيدة عمودية أو حرّة.",
  review: "قراءة أو تعليق على كتاب أو نص لأديب.",
  quote: "اقتباس لكِ أو لأديب أو مفكر.",
  book: "كتاب لكِ للتحميل، أو كتاب توصين به.",
  photo: "صورة للمعرض.",
};

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function blank(type: PostType): Draft {
  return {
    type,
    title: "",
    body: "",
    excerpt: "",
    coverUrl: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    linkUrl: null,
    refAuthor: null,
    refSource: null,
    bookKind: type === "book" ? "mine" : null,
    category: null,
    tags: "",
    status: "published",
    publishedAt: new Date().toISOString(),
    featured: false,
  };
}

const toDraft = (p: Post): Draft => ({ ...p, tags: p.tags.join("، ") });

export function Editor({ id, initialType }: { id?: string; initialType?: PostType }) {
  const { posts, savePost, deletePost, notify } = useStore();
  const existing = id ? posts.find((p) => p.id === id) : undefined;

  const [d, setD] = useState<Draft>(() => (existing ? toDraft(existing) : blank(initialType ?? "article")));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load once the post list arrives (direct link to /admin/edit/…).
  useEffect(() => {
    if (existing && d.id !== existing.id) setD(toDraft(existing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const categories = useMemo(
    () => [...new Set(posts.filter((p) => p.type === d.type && p.category).map((p) => p.category as string))],
    [posts, d.type],
  );

  const t = d.type;
  const needsTitle = t !== "quote";

  function validate(): string | null {
    if (needsTitle && t !== "photo" && !d.title?.trim()) return "اكتبي العنوان.";
    if ((t === "article" || t === "prose" || t === "poem" || t === "review" || t === "quote") && !d.body?.trim())
      return t === "quote" ? "اكتبي نص الاقتباس." : "اكتبي النص.";
    if (t === "photo" && !d.coverUrl) return "ارفعي الصورة.";
    return null;
  }

  async function save(status: "draft" | "published") {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tags = d.tags
        .split(/[,،]/)
        .map((s) => s.trim().replace(/^#/, ""))
        .filter(Boolean);
      const input: PostInput = {
        ...d,
        tags,
        status,
        title: d.title?.trim() ?? "",
        category: d.category?.trim() || null,
        refAuthor: d.refAuthor?.trim() || null,
        refSource: d.refSource?.trim() || null,
        linkUrl: d.linkUrl?.trim() || null,
      };
      // Columns the server owns.
      delete (input as Partial<Post>).createdAt;
      delete (input as Partial<Post>).updatedAt;
      delete (input as Partial<Post>).downloads;
      const saved = await savePost(input);
      setD(toDraft(saved));
      setDirty(false);
      const future = new Date(saved.publishedAt) > new Date();
      notify(status === "draft" ? "حُفظت المسودة" : future ? "جُدول للنشر" : "نُشر");
      if (!id) navigate(`/admin/edit/${saved.id}`, { replace: true, keepScroll: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!d.id || !confirm("حذف هذا المنشور نهائيًا؟ لا يمكن التراجع.")) return;
    try {
      await deletePost(d.id);
      setDirty(false);
      notify("حُذف المنشور");
      navigate("/admin/posts");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (id && !existing && !d.id) {
    return <p className="hint">جارٍ التحميل… إن لم يظهر المنشور فربما حُذف. <Link to="/admin/posts">كل المنشورات</Link></p>;
  }

  const published = d.status === "published";
  const scheduled = published && d.publishedAt && new Date(d.publishedAt) > new Date();

  return (
    <div className="ed">
      <div className="ed-head">
        <h1>{d.id ? "تعديل" : "منشور جديد"}</h1>
        {d.id && (
          <span className={`badge-status is-${scheduled ? "scheduled" : d.status}`}>
            {d.status === "draft" ? "مسودة" : scheduled ? "مجدول" : "منشور"}
          </span>
        )}
        {dirty && <span className="hint">تغييرات غير محفوظة</span>}
      </div>

      {!d.id && (
        <div className="type-picker" role="radiogroup" aria-label="نوع المنشور">
          {SECTIONS.map((s) => (
            <button
              key={s.type}
              type="button"
              role="radio"
              aria-checked={t === s.type}
              onClick={() => setD((x) => ({ ...blank(s.type), title: x.title, body: x.body }))}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <p className="hint">{TYPE_HELP[t]}</p>

      <div className="ed-grid">
        <div className="ed-main">
          {t === "book" && (
            <div className="seg seg-wide" role="radiogroup" aria-label="نوع الكتاب">
              <button type="button" role="radio" aria-checked={d.bookKind !== "recommended"} onClick={() => set("bookKind", "mine")}>
                كتابي (للتحميل)
              </button>
              <button type="button" role="radio" aria-checked={d.bookKind === "recommended"} onClick={() => set("bookKind", "recommended")}>
                كتاب أوصي به
              </button>
            </div>
          )}

          {t === "photo" && (
            <Upload
              kind="image"
              label="الصورة"
              value={d.coverUrl ?? null}
              onUploaded={(u) => set("coverUrl", u.url)}
              onClear={() => set("coverUrl", null)}
            />
          )}

          {needsTitle && (
            <label className="field">
              <span className="field-label">{t === "photo" ? "عنوان الصورة (اختياري)" : t === "book" ? "اسم الكتاب" : "العنوان"}</span>
              <input className="input-title" value={d.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={300} />
            </label>
          )}

          {(t === "review" || t === "quote" || (t === "book" && d.bookKind === "recommended")) && (
            <div className="field-row">
              <label className="field">
                <span className="field-label">
                  {t === "quote" ? "القائل (اتركيه فارغًا إن كان الاقتباس لكِ)" : t === "review" ? "الأديب / الكاتب" : "المؤلف"}
                </span>
                <input value={d.refAuthor ?? ""} onChange={(e) => set("refAuthor", e.target.value)} />
              </label>
              {t !== "book" && (
                <label className="field">
                  <span className="field-label">{t === "quote" ? "المصدر (كتاب، ديوان…)" : "العمل (اسم الكتاب أو النص)"}</span>
                  <input value={d.refSource ?? ""} onChange={(e) => set("refSource", e.target.value)} />
                </label>
              )}
            </div>
          )}

          {t === "quote" ? (
            <label className="field">
              <span className="field-label">نص الاقتباس</span>
              <textarea rows={5} value={d.body ?? ""} onChange={(e) => set("body", e.target.value)} className="quote-input" />
              <span className="hint">لبيت شعر: الصدر | العجز</span>
            </label>
          ) : t === "photo" ? (
            <label className="field">
              <span className="field-label">وصف قصير (اختياري)</span>
              <textarea rows={3} value={d.body ?? ""} onChange={(e) => set("body", e.target.value)} />
            </label>
          ) : (
            <BodyEditor
              label={t === "book" ? "عن الكتاب" : t === "poem" ? "القصيدة" : "النص"}
              value={d.body ?? ""}
              onChange={(v) => set("body", v)}
              poem={t === "poem"}
              rows={t === "book" ? 8 : 18}
            />
          )}

          {(t === "article" || t === "review" || t === "book") && (
            <label className="field">
              <span className="field-label">{t === "book" ? "وصف قصير يظهر على البطاقة" : "مقدمة قصيرة (تظهر في القوائم وعند المشاركة)"}</span>
              <textarea rows={2} maxLength={1000} value={d.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
            </label>
          )}
        </div>

        <aside className="ed-side">
          <div className="panel">
            <p className="panel-title">النشر</p>
            <label className="field">
              <span className="field-label">تاريخ النشر</span>
              <input
                type="datetime-local"
                value={d.publishedAt ? toLocalInput(d.publishedAt) : ""}
                onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
              />
              <span className="hint">اختاري وقتًا لاحقًا لجدولة النشر.</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={!!d.featured} onChange={(e) => set("featured", e.target.checked)} />
              مميّز (يظهر أولًا في الرئيسية)
            </label>
            <div className="panel-actions">
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save("published")}>
                {saving ? "جارٍ الحفظ…" : published && d.id ? "حفظ التغييرات" : scheduled ? "جدولة" : "نشر"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => save("draft")}>
                {published && d.id ? "إخفاء (مسودة)" : "حفظ كمسودة"}
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {d.id && (
              <div className="panel-links">
                <Link to={`/p/${d.id}`}>عرض في الموقع</Link>
                <button type="button" className="link-btn danger" onClick={remove}>
                  حذف
                </button>
              </div>
            )}
          </div>

          {t !== "photo" && t !== "quote" && (
            <div className="panel">
              <Upload
                kind="image"
                label={t === "book" ? "صورة الغلاف" : "صورة الغلاف (اختيارية)"}
                hint={t === "book" ? "بدونها يُرسم غلاف أنيق تلقائيًا." : undefined}
                value={d.coverUrl ?? null}
                onUploaded={(u) => set("coverUrl", u.url)}
                onClear={() => set("coverUrl", null)}
              />
            </div>
          )}

          {t === "book" && (
            <div className="panel">
              <Upload
                kind="pdf"
                label="ملف الكتاب (PDF)"
                hint={d.bookKind === "recommended" ? "ارفعي الملف فقط إن كان نشره مسموحًا (ملكية عامة أو بإذن)." : undefined}
                value={d.fileUrl ?? null}
                fileName={d.fileName}
                onUploaded={(u) => {
                  setD((x) => ({ ...x, fileUrl: u.url, fileName: u.name, fileSize: u.size }));
                  setDirty(true);
                }}
                onClear={() => {
                  setD((x) => ({ ...x, fileUrl: null, fileName: null, fileSize: null }));
                  setDirty(true);
                }}
              />
              <label className="field">
                <span className="field-label">رابط خارجي (اختياري)</span>
                <input dir="ltr" placeholder="https://" value={d.linkUrl ?? ""} onChange={(e) => set("linkUrl", e.target.value)} />
              </label>
            </div>
          )}

          <div className="panel">
            <label className="field">
              <span className="field-label">التصنيف</span>
              <input list="cats" value={d.category ?? ""} onChange={(e) => set("category", e.target.value)} placeholder={t === "poem" ? "شعر عمودي" : "فكر"} />
              <datalist id="cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            {t !== "photo" && (
              <label className="field">
                <span className="field-label">وسوم (افصلي بفاصلة)</span>
                <input value={d.tags} onChange={(e) => set("tags", e.target.value)} placeholder="القراءة، اللغة" />
              </label>
            )}
          </div>

          <p className="hint">
            القسم: <Link to={sectionOf(t).path}>{sectionOf(t).title}</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
