import { useEffect, useMemo, useState } from "react";
import { useStore, isLive } from "../lib/store";
import { Link } from "../lib/router";
import { Markdown, Poem } from "../lib/markdown";
import { n } from "../lib/ar";
import { SECTIONS, SITE_NAME } from "../config";
import type { Post } from "../lib/api";
import { BookActions, Meta, QuoteCard, RankItem, StoryCard, StoryImage, TextTile, excerptOf, postPath } from "../components/Cards";
import { Cover } from "../components/Cover";
import { CalligraphyBand, Divider, Mandala, Medallion, Rosette, Star } from "../components/Ornament";
import { ChevronLeft, ChevronRight, ImageIcon } from "../components/Icons";
import { downloadQuoteImage } from "../components/quoteImage";
import { Lightbox } from "../components/Lightbox";
import { SectionHead } from "../components/Layout";

export function Home() {
  const { posts, settings, isAdmin, ready, likes } = useStore();
  const live = useMemo(() => posts.filter(isLive), [posts]);
  const of = (t: Post["type"]) => live.filter((p) => p.type === t);

  const stories = live.filter((p) => p.type === "article" || p.type === "review");
  const lead = stories.find((p) => p.featured) ?? stories[0];
  const secondary = stories.filter((p) => p !== lead).slice(0, 3);
  const writings = live.filter((p) => ["article", "prose", "poem", "review"].includes(p.type));
  const popular = [...writings]
    .filter((p) => (likes.counts[p.id] ?? 0) > 0)
    .sort((a, b) => (likes.counts[b.id] ?? 0) - (likes.counts[a.id] ?? 0))
    .slice(0, 5);
  const sideList = popular.length >= 3 ? popular : writings.filter((p) => p !== lead).slice(0, 5);
  const poem = of("poem")[0];
  const prose = of("prose").slice(0, 3);
  const readings = of("review").filter((p) => p !== lead && !secondary.includes(p)).slice(0, 3);
  const myBooks = of("book").filter((b) => b.bookKind !== "recommended");
  const recBooks = of("book").filter((b) => b.bookKind === "recommended");
  const quotes = of("quote");
  const photos = of("photo").filter((p) => p.coverUrl).slice(0, 5);
  const [lb, setLb] = useState<number | null>(null);
  const tiles = SECTIONS.map((s) => ({ s, count: of(s.type).length }));

  return (
    <div className="home">
      {/* ═══ Hero: linen, calligraphy, mandala and the pen-and-book artwork ═══ */}
      <section className="hero" aria-label={SITE_NAME}>
        <div className="hero-linen" aria-hidden="true" />
        <Mandala className="hero-mandala" />
        <div className="wrap hero-grid">
          <div className="hero-text">
            <p className="hero-kicker">
              <Rosette size={18} />
              {settings.tagline || "كاتبة"}
            </p>
            <h1 className="hero-name">{SITE_NAME}</h1>
            <Divider className="hero-divider" />
            {settings.intro && <p className="hero-intro">{settings.intro}</p>}
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" to="/articles">
                ابدأ القراءة
              </Link>
              <Link className="btn btn-ghost btn-lg" to="/books">
                كتبي للتحميل
              </Link>
            </div>
            <dl className="hero-stats">
              {[
                { label: "مقالة", c: of("article").length },
                { label: "قصيدة", c: of("poem").length },
                { label: "اقتباس", c: of("quote").length },
                { label: "كتاب", c: of("book").length },
              ]
                .filter((x) => x.c > 0)
                .map((x) => (
                  <div key={x.label}>
                    <dd>{n(x.c)}</dd>
                    <dt>{x.label}</dt>
                  </div>
                ))}
            </dl>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img src="/images/pen-book.jpg" alt="" />
          </div>
        </div>
      </section>

      {/* ═══ Sections as medallions ═══ */}
      <nav className="wrap explore" aria-label="الأقسام">
        {tiles.map(({ s, count }) => (
          <Link key={s.path} to={s.path} className="explore-tile">
            <Medallion letter={LETTER[s.type]} />
            <span className="explore-title">{s.title}</span>
            <span className="explore-count">{count ? n(count) : "قريبًا"}</span>
          </Link>
        ))}
      </nav>

      {ready && live.length === 0 && (
        <div className="wrap">
          <div className="welcome">
            <Star size={28} className="page-star" />
            <h2>أهلًا بك</h2>
            <p>لا منشورات بعد. ستظهر هنا المقالات والشعر والنثر والقراءات والكتب فور نشرها.</p>
            {isAdmin && (
              <Link className="btn btn-primary" to="/admin/new">
                اكتبي أول منشور
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═══ Featured ═══ */}
      {lead && (
        <section className="wrap block reveal">
          <SectionHead title="مختارات" to="/articles" more="كل المقالات" />
          <div className="front">
            <article className="lead">
              <StoryImage post={lead} className="lead-img" />
              <div className="lead-body">
                <p className="kicker">
                  <Link to={lead.type === "review" ? "/readings" : "/articles"}>{lead.type === "review" ? "قراءة" : "مقالة"}</Link>
                  {lead.category && <span>{lead.category}</span>}
                </p>
                <h2 className="lead-title">
                  <Link to={postPath(lead)}>{lead.title}</Link>
                </h2>
                <p className="lead-excerpt">{excerptOf(lead, 240)}</p>
                <div className="byline">
                  <span className="byline-avatar" aria-hidden="true">
                    {settings.photoUrl ? <img src={settings.photoUrl} alt="" /> : SITE_NAME.charAt(0)}
                  </span>
                  <span>
                    <strong>{SITE_NAME}</strong>
                    <Meta post={lead} counts={false} />
                  </span>
                </div>
              </div>
            </article>

            <aside className="front-side" aria-labelledby="side-h">
              <h3 id="side-h" className="side-title">
                {popular.length >= 3 ? "الأكثر إعجابًا" : "الأحدث"}
              </h3>
              <ol className="rank-list">
                {sideList.map((p, i) => (
                  <RankItem key={p.id} post={p} index={i} />
                ))}
              </ol>
            </aside>
          </div>
          {secondary.length > 0 && (
            <div className="grid-3 front-more">
              {secondary.map((p) => (
                <StoryCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ Quote band ═══ */}
      {quotes.length > 0 && <QuoteBand quotes={quotes} />}

      {/* ═══ Poetry & prose ═══ */}
      {(poem || prose.length > 0) && (
        <section className="band band-tint reveal">
          <div className="wrap">
            <SectionHead title="شعر ونثر" to={poem ? "/poetry" : "/prose"} />
            <div className="verse-split">
              {poem && (
                <article className="poem-feature">
                  <span className="poem-corner pc-1" aria-hidden="true"><Rosette size={26} /></span>
                  <span className="poem-corner pc-2" aria-hidden="true"><Rosette size={26} /></span>
                  <span className="poem-corner pc-3" aria-hidden="true"><Rosette size={26} /></span>
                  <span className="poem-corner pc-4" aria-hidden="true"><Rosette size={26} /></span>
                  <p className="kicker">
                    <Link to="/poetry">قصيدة</Link>
                    {poem.category && <span>{poem.category}</span>}
                  </p>
                  <h3>
                    <Link to={postPath(poem)}>{poem.title}</Link>
                  </h3>
                  <Poem text={poem.body.split(/\n{2,}/)[0]} />
                  <Link to={postPath(poem)} className="more-pill">
                    أكمل القصيدة
                  </Link>
                </article>
              )}
              <div className="prose-col">
                {prose.map((p) => (
                  <TextTile key={p.id} post={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Readings ═══ */}
      {readings.length > 0 && (
        <section className="wrap block reveal">
          <SectionHead title="قراءات في كتابات الأدباء" to="/readings" />
          <div className="grid-3">
            {readings.map((p) => (
              <StoryCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ Books ═══ */}
      {(myBooks.length > 0 || recBooks.length > 0) && (
        <section className="books-band reveal">
          <Mandala className="band-mandala" />
          <CalligraphyBand className="band-calli" count={14} />
          <div className="wrap">
            <SectionHead title="المكتبة" to="/books" more="كل الكتب" />
            <div className="books-feature">
              {myBooks[0] && (
                <article className="book-hero">
                  <Link to={postPath(myBooks[0])} className="book-hero-cover" aria-label={myBooks[0].title}>
                    <Cover post={myBooks[0]} />
                  </Link>
                  <div>
                    <p className="kicker">
                      <span>من كتبي

                        
                      </span>
                    </p>
                    <h3>
                      <Link to={postPath(myBooks[0])}>{myBooks[0].title}</Link>
                    </h3>
                    <p className="book-hero-text">{excerptOf(myBooks[0], 200)}</p>
                    <BookActions post={myBooks[0]} />
                  </div>
                </article>
              )}
              <div className="book-shelf">
                {[...myBooks.slice(1), ...recBooks].slice(0, 4).map((b) => (
                  <Link key={b.id} to={postPath(b)} className="shelf-book" aria-label={b.title}>
                    <Cover post={b} />
                    <span className="shelf-book-title">{b.title}</span>
                    <span className="shelf-book-note">{b.bookKind === "recommended" ? "أوصي به" : "من كتبي"}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Quotes ═══ */}
      {quotes.length > 1 && (
        <section className="wrap block reveal">
          <SectionHead title="اقتباسات" to="/quotes" />
          <div className="grid-3 quotes-grid">
            {quotes.slice(1, 4).map((q) => (
              <QuoteCard key={q.id} post={q} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ Gallery ═══ */}
      {photos.length > 0 && (
        <section className="wrap block reveal">
          <SectionHead title="من المعرض" to="/gallery" />
          <div className={`mosaic mosaic-${Math.min(photos.length, 5)}`}>
            {photos.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setLb(i)} aria-label={`عرض: ${p.title || "صورة"}`}>
                <img src={p.coverUrl!} alt={p.title} loading="lazy" />
                {p.title && <span>{p.title}</span>}
              </button>
            ))}
          </div>
          <Lightbox photos={photos} index={lb} onIndex={setLb} />
        </section>
      )}

      {/* ═══ About ═══ */}
      {settings.about && (
        <section className="wrap block reveal">
          <div className="about-teaser">
            <div className="about-teaser-photo" aria-hidden="true">
              {settings.photoUrl ? <img src={settings.photoUrl} alt="" /> : <Mandala className="about-teaser-mandala" />}
            </div>
            <div>
              <p className="kicker">
                <span>عن الكاتبة</span>
              </p>
              <h2>{SITE_NAME}</h2>
              {settings.tagline && <p className="about-teaser-tag">{settings.tagline}</p>}
              <div className="about-teaser-text">
                <Markdown text={settings.about.split(/\n{2,}/).filter((b) => !b.startsWith("#")).slice(0, 1).join("\n\n")} />
              </div>
              <Link to="/about" className="btn btn-primary">
                اقرأ المزيد عنّي
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Call to action ═══ */}
      {live.length > 0 && (
        <section className="wrap block reveal">
          <div className="cta">
            <Mandala className="cta-mandala" />
            <Rosette className="cta-star" size={34} />
            <h2>قرأتَ شيئًا أعجبك؟</h2>
            <p>شاركني رأيك في التعليقات، أو اضغط «أعجبني» على ما لامسك. كل كلمة تصلني.</p>
            <div className="cta-actions">
              <Link to="/quotes" className="btn btn-gold">
                تصفّح الاقتباسات
              </Link>
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className="btn btn-outline-light">
                  راسلني
                </a>
              ) : (
                <Link to="/about" className="btn btn-outline-light">
                  عنّي
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const LETTER: Record<Post["type"], string> = {
  article: "م",
  prose: "ن",
  poem: "ش",
  review: "ق",
  quote: "ا",
  book: "ك",
  photo: "ص",
};

/** Full-width espresso band with a large mandala and a rotating quote. */
function QuoteBand({ quotes }: { quotes: Post[] }) {
  const { notify } = useStore();
  const ordered = useMemo(() => [...quotes.filter((q) => q.featured), ...quotes.filter((q) => !q.featured)], [quotes]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const idx = ((i % ordered.length) + ordered.length) % ordered.length;
  const q = ordered[idx];

  useEffect(() => {
    if (ordered.length < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((x) => x + 1), 9000);
    return () => window.clearInterval(t);
  }, [ordered.length, paused]);

  const halves = q.body.split("|").map((s) => s.trim());

  return (
    <section className="quote-band reveal" aria-label="اقتباس" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Mandala className="quote-band-mandala" />
      <div className="wrap quote-band-inner">
        <p className="quote-band-label">
          <Rosette size={16} />
          من الاقتباسات
          <Rosette size={16} />
        </p>
        <figure className="band-quote" key={q.id} aria-live="polite">
          <blockquote>
            {halves.length === 2 ? (
              <p className="verse verse-classic">
                <span>{halves[0]}</span>
                <span>{halves[1]}</span>
              </p>
            ) : (
              <p>{q.body}</p>
            )}
          </blockquote>
          <Divider />
          <figcaption>
            {q.refAuthor || SITE_NAME}
            {q.refSource && <span>{q.refSource}</span>}
          </figcaption>
        </figure>
        <div className="quote-band-controls">
          {ordered.length > 1 && (
            <button type="button" className="icon-btn on-dark" onClick={() => setI((x) => x - 1)} aria-label="الاقتباس السابق">
              <ChevronRight />
            </button>
          )}
          <button
            type="button"
            className="icon-btn on-dark"
            onClick={() => downloadQuoteImage(q).then(() => notify("حُمّلت الصورة"))}
            aria-label="تحميل الاقتباس صورة"
            title="تحميل صورة"
          >
            <ImageIcon />
          </button>
          {ordered.length > 1 && (
            <button type="button" className="icon-btn on-dark" onClick={() => setI((x) => x + 1)} aria-label="الاقتباس التالي">
              <ChevronLeft />
            </button>
          )}
        </div>
        {ordered.length > 1 && (
          <div className="band-dots" aria-hidden="true">
            {ordered.slice(0, 8).map((x, k) => (
              <i key={x.id} className={k === idx ? "on" : ""} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
