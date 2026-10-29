import { useEffect, useMemo, useState } from "react";
import { useStore, isLive } from "../lib/store";
import { Link } from "../lib/router";
import { Markdown, Poem } from "../lib/markdown";
import { formatDate, readingTime } from "../lib/ar";
import { sectionOf, SITE_NAME } from "../config";
import { LikeButton } from "../components/LikeButton";
import { Share } from "../components/Share";
import { Comments } from "../components/Comments";
import { BookActions, QuoteCard, StoryCard, TextTile, postPath, excerptOf } from "../components/Cards";
import { Cover } from "../components/Cover";
import { ChevronLeft, ChevronRight, PenIcon } from "../components/Icons";
import { Empty } from "../components/Layout";
import { Star } from "../components/Ornament";

/** Thin gold bar at the top showing how far you've read. */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = document.querySelector(".post-body");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setPct(Math.max(0, Math.min(1, (-r.top + window.innerHeight * 0.2) / Math.max(total, 1))));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return <div className="progress-bar" style={{ transform: `scaleX(${pct})` }} aria-hidden="true" />;
}

export function PostPage({ id }: { id: string }) {
  const { posts, likes, toggleLike, isAdmin, ready, settings } = useStore();
  const post = posts.find((p) => p.id === id);

  const siblings = useMemo(
    () => (post ? posts.filter((p) => p.type === post.type && (isAdmin || isLive(p))) : []),
    [posts, post, isAdmin],
  );
  const idx = siblings.findIndex((p) => p.id === id);
  const newer = idx > 0 ? siblings[idx - 1] : null;
  const older = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const related = post
    ? [
        ...siblings.filter((p) => p.id !== post.id && post.category && p.category === post.category),
        ...siblings.filter((p) => p.id !== post.id && (!post.category || p.category !== post.category)),
      ].slice(0, 3)
    : [];

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title || sectionOf(post.type).label} — ${SITE_NAME}`;
    if (location.hash === "#comments") {
      setTimeout(() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
    return () => {
      document.title = SITE_NAME;
    };
  }, [post]);

  if (!post) {
    return ready ? (
      <div className="page">
        <Empty>
          لم نجد هذه الصفحة. ربما حُذفت أو لم تُنشر بعد. <Link to="/">العودة إلى الرئيسية</Link>
        </Empty>
      </div>
    ) : (
      <div className="page">
        <div className="skeleton skeleton-page" aria-label="جارٍ التحميل">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  const section = sectionOf(post.type);
  const t = post.type;
  const titleText = post.title || (t === "quote" ? `اقتباس — ${post.refAuthor || SITE_NAME}` : section.label);
  const long = t === "article" || t === "review" || t === "prose";
  const centered = t === "poem" || t === "prose";
  const hers = !(t === "quote" && post.refAuthor) && !(t === "book" && post.bookKind === "recommended") && t !== "photo";

  return (
    <article className={`post post-${t}`}>
      {long && <ReadingProgress />}

      <div className="post-wrap">
        <nav className="crumbs" aria-label="المسار">
          <Link to="/">الرئيسية</Link>
          <ChevronLeft size={14} />
          <Link to={section.path}>{section.title}</Link>
          {isAdmin && (
            <Link to={`/admin/edit/${post.id}`} className="btn btn-ghost btn-sm crumbs-edit">
              <PenIcon />
              تعديل
            </Link>
          )}
        </nav>

        {(post.status === "draft" || !isLive(post)) && (
          <p className="draft-note">
            {post.status === "draft" ? "مسودة — لا يراها الزوار." : `مجدول للنشر في ${formatDate(post.publishedAt)}.`}
          </p>
        )}

        {t === "quote" ? (
          <div className="post-quote">
            <QuoteCard post={post} big />
          </div>
        ) : t === "book" ? (
          <header className="book-head">
            <div className="book-head-cover">
              <Cover post={post} />
            </div>
            <div className="book-head-text">
              <p className="kicker">
                <Link to="/books">{post.bookKind === "recommended" ? "كتاب أوصي به" : "من كتبي"}</Link>
                {post.category && <span>{post.category}</span>}
              </p>
              <h1 className="post-title">{post.title}</h1>
              <p className="post-byline-text">{post.refAuthor || SITE_NAME}</p>
              {post.excerpt && <p className="post-dek">{post.excerpt}</p>}
              <BookActions post={post} />
            </div>
          </header>
        ) : (
          <header className={`post-head${centered ? " is-centered" : ""}`}>
            <p className="kicker">
              <Link to={section.path}>{section.label}</Link>
              {post.category && <span>{post.category}</span>}
            </p>
            <h1 className="post-title">{post.title}</h1>
            {t === "review" && (post.refAuthor || post.refSource) && (
              <p className="review-of">
                قراءة في {post.refSource ? <strong>«{post.refSource}»</strong> : null}
                {post.refAuthor ? <> لـ<strong>{post.refAuthor}</strong></> : null}
              </p>
            )}
            {post.excerpt && t === "article" && <p className="post-dek">{post.excerpt}</p>}
            {t !== "photo" && (
              <div className="byline">
                <span className="byline-avatar" aria-hidden="true">
                  {settings.photoUrl ? <img src={settings.photoUrl} alt="" /> : SITE_NAME.charAt(0)}
                </span>
                <span>
                  <strong>{SITE_NAME}</strong>
                  <span className="meta">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    {(t === "article" || t === "review") && <span>{readingTime(post.body)}</span>}
                  </span>
                </span>
              </div>
            )}
          </header>
        )}
      </div>

      {t !== "book" && t !== "quote" && post.coverUrl && (
        <figure className={`post-cover${t === "photo" ? " post-photo" : ""}`}>
          <img src={post.coverUrl} alt={t === "photo" ? post.title : ""} />
          {t === "photo" && post.title && <figcaption>{post.title}</figcaption>}
        </figure>
      )}

      <div className="post-wrap">
        {t !== "quote" && post.body && (
          <div className={`post-body${centered ? " is-centered" : ""}`}>
            {t === "poem" ? <Poem text={post.body} /> : <Markdown text={post.body} />}
          </div>
        )}

        {t !== "quote" && (
          <div className="post-actions">
            <LikeButton liked={likes.mine.includes(post.id)} count={likes.counts[post.id] ?? 0} label={titleText} onToggle={() => toggleLike(post.id)} />
            <Share title={titleText} path={postPath(post)} />
          </div>
        )}
        {t === "quote" && (
          <div className="post-actions post-actions-center">
            <Share title={titleText} path={postPath(post)} />
          </div>
        )}

        {post.tags.length > 0 && (
          <p className="tags">
            {post.tags.map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="tag">
                #{tag}
              </Link>
            ))}
          </p>
        )}

        {hers && t !== "book" && (
          <aside className="author-box">
            <span className="author-photo" aria-hidden="true">
              {settings.photoUrl ? <img src={settings.photoUrl} alt="" /> : <Star size={30} />}
            </span>
            <div>
              <p className="author-label">بقلم</p>
              <p className="author-name">{SITE_NAME}</p>
              {settings.tagline && <p className="author-tag">{settings.tagline}</p>}
              <Link to="/about" className="more-link">
                عن الكاتبة
              </Link>
            </div>
          </aside>
        )}

        {(newer || older) && (
          <nav className="pager" aria-label="التنقل بين المنشورات">
            {newer ? (
              <Link to={postPath(newer)} className="pager-link">
                <span className="pager-label">
                  <ChevronRight size={16} />
                  الأحدث
                </span>
                <span className="pager-title">{newer.title || excerptOf(newer, 50)}</span>
              </Link>
            ) : (
              <span />
            )}
            {older ? (
              <Link to={postPath(older)} className="pager-link pager-older">
                <span className="pager-label">
                  الأقدم
                  <ChevronLeft size={16} />
                </span>
                <span className="pager-title">{older.title || excerptOf(older, 50)}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <div id="comments">
          <Comments postId={post.id} title={titleText} />
        </div>
      </div>

      {related.length > 0 && t !== "photo" && (
        <section className="related">
          <div className="wrap">
            <div className="section-head">
              <h2>اقرأ أيضًا</h2>
              <Link to={section.path} className="more-link">
                كل {section.title}
              </Link>
            </div>
            <div className={t === "prose" || t === "poem" ? "tiles" : t === "quote" ? "grid-3 quotes-grid" : t === "book" ? "books-grid" : "grid-3"}>
              {related.map((p) =>
                p.type === "prose" || p.type === "poem" ? (
                  <TextTile key={p.id} post={p} />
                ) : p.type === "quote" ? (
                  <QuoteCard key={p.id} post={p} />
                ) : p.type === "book" ? (
                  <Link key={p.id} to={postPath(p)} className="shelf-book">
                    <Cover post={p} />
                    <span className="shelf-book-title">{p.title}</span>
                  </Link>
                ) : (
                  <StoryCard key={p.id} post={p} />
                ),
              )}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
