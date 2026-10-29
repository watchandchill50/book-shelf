import { useMemo } from "react";
import { useStore, isLive } from "../lib/store";
import { useLocation, Link } from "../lib/router";
import { Markdown, plainText } from "../lib/markdown";
import { normalizeArabic } from "../lib/search";
import { n } from "../lib/ar";
import { SECTIONS, SITE_NAME } from "../config";
import { Empty, PageHeader } from "../components/Layout";
import { BookCard, QuoteCard, StoryCard, TextTile } from "../components/Cards";
import { Star } from "../components/Ornament";

export function AboutPage() {
  const { settings } = useStore();
  return (
    <div className="page about">
      <PageHeader title="عنّي" description={settings.tagline} />
      <div className="about-grid">
        <aside className="about-card">
          {settings.photoUrl ? (
            <img className="about-photo" src={settings.photoUrl} alt={SITE_NAME} />
          ) : (
            <div className="about-photo about-photo-empty" aria-hidden="true">
              <Star size={48} />
            </div>
          )}
          <p className="about-name">{SITE_NAME}</p>
          {settings.email && (
            <a className="btn btn-primary" href={`mailto:${settings.email}`}>
              راسلني
            </a>
          )}
          {settings.links.length > 0 && (
            <p className="about-links">
              {settings.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </aside>
        <div className="post-body">
          {settings.about ? <Markdown text={settings.about} /> : <Empty>ستُضاف النبذة قريبًا.</Empty>}
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const { search } = useLocation();
  const q = search.get("q") ?? "";
  const { posts, isAdmin } = useStore();

  const groups = useMemo(() => {
    const nq = normalizeArabic(q);
    if (!nq) return [];
    const hits = posts.filter(
      (p) =>
        (isAdmin || isLive(p)) &&
        normalizeArabic(
          `${p.title} ${p.refAuthor ?? ""} ${p.refSource ?? ""} ${p.category ?? ""} ${p.tags.join(" ")} ${plainText(p.body)}`,
        ).includes(nq),
    );
    return SECTIONS.map((s) => ({ s, items: hits.filter((p) => p.type === s.type) })).filter((g) => g.items.length);
  }, [q, posts, isAdmin]);

  const total = groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <div className="page">
      <PageHeader title="البحث" description={q ? `نتائج «${q}»: ${n(total)}` : "اكتب كلمة في مربع البحث أعلى الصفحة."} />
      {q && total === 0 && <Empty>لا نتائج. جرّب كلمة أخرى، أو تصفّح الأقسام من القائمة.</Empty>}
      {groups.map(({ s, items }) => (
        <section key={s.path} className="search-group">
          <h2>
            <Link to={s.path}>{s.title}</Link> <span className="chip-count">{n(items.length)}</span>
          </h2>
          <div className={s.type === "quote" ? "quotes-row" : s.type === "book" ? "books-grid" : s.type === "prose" || s.type === "poem" ? "tiles" : "grid-3"}>
            {items.slice(0, 6).map((p) =>
              s.type === "quote" ? (
                <QuoteCard key={p.id} post={p} />
              ) : s.type === "book" ? (
                <BookCard key={p.id} post={p} />
              ) : s.type === "prose" || s.type === "poem" ? (
                <TextTile key={p.id} post={p} />
              ) : (
                <StoryCard key={p.id} post={p} />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page">
      <PageHeader title="الصفحة غير موجودة" />
      <Empty>
        ربما تغيّر الرابط. <Link to="/">العودة إلى الرئيسية</Link>
      </Empty>
    </div>
  );
}
