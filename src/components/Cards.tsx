import type { Post } from "../lib/api";
import { Link } from "../lib/router";
import { useStore } from "../lib/store";
import { formatDate, n, readingTime, downloadsText, fileSizeText } from "../lib/ar";
import { plainText } from "../lib/markdown";
import { sectionOf, SITE_NAME } from "../config";
import { LikeButton } from "./LikeButton";
import { CommentIcon, CopyIcon, DownloadIcon, HeartIcon, ImageIcon } from "./Icons";
import { Cover } from "./Cover";
import { Mandala } from "./Ornament";
import { downloadQuoteImage } from "./quoteImage";
import { api } from "../lib/api";

export const postPath = (p: Post) => `/p/${p.id}`;

export function excerptOf(p: Post, len = 180) {
  if (p.excerpt) return p.excerpt;
  const t = plainText(p.body);
  return t.length > len ? `${t.slice(0, len).replace(/\s+\S*$/, "")}…` : t;
}

function Stats({ post }: { post: Post }) {
  const { likes, commentCounts, toggleLike } = useStore();
  return (
    <div className="stats">
      <LikeButton
        size="sm"
        liked={likes.mine.includes(post.id)}
        count={likes.counts[post.id] ?? 0}
        label={post.title || "الاقتباس"}
        onToggle={() => toggleLike(post.id)}
      />
      <Link className="stat-link" to={`${postPath(post)}#comments`} aria-label={`التعليقات: ${n(commentCounts[post.id] ?? 0)}`}>
        <CommentIcon />
        {n(commentCounts[post.id] ?? 0)}
      </Link>
    </div>
  );
}

function Draft({ post }: { post: Post }) {
  if (post.status === "published" && new Date(post.publishedAt) <= new Date()) return null;
  return <span className="badge-draft">{post.status === "draft" ? "مسودة" : "مجدول"}</span>;
}


/** Small meta line: date, reading time, and quiet like/comment counts. */
export function Meta({ post, time = true, counts = true }: { post: Post; time?: boolean; counts?: boolean }) {
  const { likes, commentCounts } = useStore();
  const l = likes.counts[post.id] ?? 0;
  const c = commentCounts[post.id] ?? 0;
  return (
    <p className="meta">
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      {time && (post.type === "article" || post.type === "review") && <span>{readingTime(post.body)}</span>}
      {counts && l > 0 && (
        <span className="meta-count" aria-label={`${n(l)} إعجاب`}>
          <HeartIcon size={14} />
          {n(l)}
        </span>
      )}
      {counts && c > 0 && (
        <span className="meta-count" aria-label={`${n(c)} تعليق`}>
          <CommentIcon size={14} />
          {n(c)}
        </span>
      )}
      <Draft post={post} />
    </p>
  );
}

/** Picture for a story: its cover, or a typographic panel when there is none. */
export function StoryImage({ post, className = "" }: { post: Post; className?: string }) {
  return (
    <Link to={postPath(post)} className={`story-img ${className}`} tabIndex={-1} aria-hidden="true">
      {post.coverUrl ? (
        <img src={post.coverUrl} alt="" loading="lazy" />
      ) : (
        <span className={`story-fallback fb-${post.type}`}>
          <Mandala className="fb-mandala" />
          <span className="fb-label">{post.type === "review" && post.refSource ? post.refSource : sectionOf(post.type).label}</span>
        </span>
      )}
    </Link>
  );
}

function Kicker({ post }: { post: Post }) {
  const s = sectionOf(post.type);
  return (
    <p className="kicker">
      <Link to={s.path}>{s.label}</Link>
      {post.category && <span>{post.category}</span>}
    </p>
  );
}

/** The standard story card used across the site: picture, kicker, title, excerpt, meta. */
export function StoryCard({ post, size = "md", excerpt = true }: { post: Post; size?: "lg" | "md" | "sm"; excerpt?: boolean }) {
  return (
    <article className={`story story-${size}`}>
      <StoryImage post={post} />
      <div className="story-body">
        <Kicker post={post} />
        <h3 className="story-title">
          <Link to={postPath(post)}>{post.title}</Link>
        </h3>
        {post.type === "review" && (post.refSource || post.refAuthor) && (
          <p className="about-work">
            قراءة في {post.refSource ? `«${post.refSource}»` : ""}
            {post.refAuthor ? ` لـ${post.refAuthor}` : ""}
          </p>
        )}
        {excerpt && <p className="story-excerpt">{excerptOf(post, size === "lg" ? 260 : 150)}</p>}
        <Meta post={post} />
      </div>
    </article>
  );
}

/** A compact numbered row for side lists ("الأكثر إعجابًا"). */
export function RankItem({ post, index }: { post: Post; index: number }) {
  return (
    <li className="rank-item">
      <span className="rank-n">{n(index + 1)}</span>
      <div>
        <p className="kicker">
          <span>{sectionOf(post.type).label}</span>
        </p>
        <Link to={postPath(post)} className="rank-title">
          {post.title || excerptOf(post, 70)}
        </Link>
      </div>
    </li>
  );
}

/** Articles and readings: a horizontal row with cover. */
export function RowCard({ post, showType = false }: { post: Post; showType?: boolean }) {
  return (
    <article className="row-card">
      {post.coverUrl && (
        <Link to={postPath(post)} className="row-cover" tabIndex={-1} aria-hidden="true">
          <img src={post.coverUrl} alt="" loading="lazy" />
        </Link>
      )}
      <div className="row-body">
        <p className="meta">
          {showType && <span className="meta-type">{sectionOf(post.type).label}</span>}
          {post.category && <span>{post.category}</span>}
          <span>{formatDate(post.publishedAt)}</span>
          {post.type === "article" && <span>{readingTime(post.body)}</span>}
          <Draft post={post} />
        </p>
        <h3 className="row-title">
          <Link to={postPath(post)}>{post.title}</Link>
        </h3>
        {post.type === "review" && (post.refSource || post.refAuthor) && (
          <p className="about-work">
            عن {post.refSource ? `«${post.refSource}»` : ""}
            {post.refAuthor ? ` لـ${post.refAuthor}` : ""}
          </p>
        )}
        <p className="row-excerpt">{excerptOf(post)}</p>
        <Stats post={post} />
      </div>
    </article>
  );
}

/** Prose and poems: a text tile with the opening lines. */
export function TextTile({ post, showType = false }: { post: Post; showType?: boolean }) {
  const lines = post.body
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, post.type === "poem" ? 3 : 4);
  return (
    <article className={`tile tile-${post.type}`}>
      {showType ? <Kicker post={post} /> : post.category ? <p className="kicker"><span>{post.category}</span></p> : null}
      <h3 className="tile-title">
        <Link to={postPath(post)}>{post.title}</Link>
      </h3>
      <Link to={postPath(post)} className="tile-lines" tabIndex={-1}>
        {lines.map((l, i) => {
          const halves = l.split("|").map((s) => s.trim());
          return halves.length === 2 ? (
            <span key={i} className="tile-verse">
              <span>{halves[0]}</span>
              <span>{halves[1]}</span>
            </span>
          ) : (
            <span key={i}>{l}</span>
          );
        })}
      </Link>
      <div className="tile-foot">
        <Meta post={post} />
      </div>
    </article>
  );
}

/** A quote, with copy and "download as image". */
export function QuoteCard({ post, big = false }: { post: Post; big?: boolean }) {
  const { notify, likes, toggleLike } = useStore();
  const halves = post.body.split("|").map((s) => s.trim());
  const mine = !post.refAuthor;

  async function copy() {
    const who = post.refAuthor || SITE_NAME;
    try {
      await navigator.clipboard.writeText(`${post.body.replace(/\s*\|\s*/, "\n")}\n— ${who}`);
      notify("نُسخ الاقتباس");
    } catch {
      notify("تعذّر النسخ");
    }
  }

  return (
    <figure className={`quote-card${mine ? " is-mine" : ""}${big ? " is-big" : ""}`}>
      <Draft post={post} />
      <blockquote>
        {halves.length === 2 ? (
          <p className="verse verse-classic">
            <span>{halves[0]}</span>
            <span>{halves[1]}</span>
          </p>
        ) : (
          <p>{post.body}</p>
        )}
      </blockquote>
      <figcaption>
        <span className="quote-who">{post.refAuthor || SITE_NAME}</span>
        {post.refSource && <span className="quote-source">{post.refSource}</span>}
      </figcaption>
      <div className="quote-actions">
        <LikeButton
          size="sm"
          liked={likes.mine.includes(post.id)}
          count={likes.counts[post.id] ?? 0}
          label="الاقتباس"
          onToggle={() => toggleLike(post.id)}
        />
        <button type="button" className="icon-btn" onClick={copy} aria-label="نسخ الاقتباس" title="نسخ">
          <CopyIcon />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => downloadQuoteImage(post).then(() => notify("حُمّلت الصورة"))}
          aria-label="تحميل الاقتباس صورة"
          title="تحميل صورة"
        >
          <ImageIcon />
        </button>
        <Link className="icon-btn" to={postPath(post)} aria-label="التعليقات" title="التعليقات">
          <CommentIcon />
        </Link>
      </div>
    </figure>
  );
}

/** A book card: cover, details and a download or external link. */
export function BookCard({ post }: { post: Post }) {
  return (
    <article className="book-card">
      <Link to={postPath(post)} className="book-cover-link" aria-label={post.title}>
        <Cover post={post} />
      </Link>
      <div className="book-info">
        <p className="meta">
          {post.category && <span>{post.category}</span>}
          <Draft post={post} />
        </p>
        <h3>
          <Link to={postPath(post)}>{post.title}</Link>
        </h3>
        <p className="book-author">{post.refAuthor || SITE_NAME}</p>
        <p className="book-excerpt">{excerptOf(post, 120)}</p>
        <BookActions post={post} compact />
      </div>
    </article>
  );
}

export function BookActions({ post, compact = false }: { post: Post; compact?: boolean }) {
  const { notify } = useStore();
  return (
    <div className="book-actions">
      {post.fileUrl ? (
        <a
          className={`btn btn-primary${compact ? " btn-sm" : ""}`}
          href={downloadUrl(post)}
          download={post.fileName ?? true}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            api.recordDownload(post.id).catch(() => {});
            notify("بدأ التحميل");
          }}
        >
          <DownloadIcon />
          تحميل PDF
          {post.fileSize ? <span className="btn-note">{fileSizeText(post.fileSize)}</span> : null}
        </a>
      ) : null}
      {post.linkUrl && (
        <a className={`btn btn-ghost${compact ? " btn-sm" : ""}`} href={post.linkUrl} target="_blank" rel="noreferrer">
          {post.bookKind === "recommended" ? "أين أجده" : "رابط الكتاب"}
        </a>
      )}
      {post.fileUrl && <span className="downloads">{downloadsText(post.downloads)}</span>}
    </div>
  );
}

/** Supabase public URLs accept ?download=name to save instead of opening. */
export function downloadUrl(p: Post) {
  if (!p.fileUrl) return "#";
  if (/^https?:/.test(p.fileUrl) && p.fileUrl.includes("/storage/v1/object/public/")) {
    return `${p.fileUrl}?download=${encodeURIComponent(p.fileName ?? "")}`;
  }
  return p.fileUrl;
}

export function PhotoTile({ post, onOpen }: { post: Post; onOpen: () => void }) {
  return (
    <figure className="photo-tile">
      <button type="button" onClick={onOpen} aria-label={`عرض: ${post.title || "صورة"}`}>
        {post.coverUrl && <img src={post.coverUrl} alt={post.title} loading="lazy" />}
      </button>
      {post.title && (
        <figcaption>
          {post.title}
          <Draft post={post} />
        </figcaption>
      )}
    </figure>
  );
}
