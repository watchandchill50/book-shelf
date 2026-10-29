import { useMemo, useState } from "react";
import { useStore, isLive } from "../lib/store";
import { normalizeArabic } from "../lib/search";
import { n, plural } from "../lib/ar";
import type { Section } from "../config";
import type { Post } from "../lib/api";
import { Empty, PageHeader } from "../components/Layout";
import { StoryCard, TextTile } from "../components/Cards";
import { SearchIcon } from "../components/Icons";
import { plainText } from "../lib/markdown";

const ALL = "الكل";

/** Shared filter bar: categories as chips + a search box. */
export function useFilter(items: Post[]) {
  const [cat, setCat] = useState(ALL);
  const [q, setQ] = useState("");
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items) if (p.category) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return [...m.entries()];
  }, [items]);
  const shown = useMemo(() => {
    const nq = normalizeArabic(q);
    return items.filter(
      (p) =>
        (cat === ALL || p.category === cat) &&
        (!nq ||
          normalizeArabic(`${p.title} ${p.refAuthor ?? ""} ${p.refSource ?? ""} ${p.category ?? ""} ${p.tags.join(" ")} ${plainText(p.body)}`).includes(nq)),
    );
  }, [items, cat, q]);

  const bar = (
    <div className="filter-bar">
      {cats.length > 1 && (
        <div className="chips" role="group" aria-label="التصنيفات">
          {[[ALL, items.length] as [string, number], ...cats].map(([c, count]) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
              <span className="chip-count">{n(count)}</span>
            </button>
          ))}
        </div>
      )}
      {items.length > 4 && (
        <label className="search-field">
          <SearchIcon />
          <input type="search" placeholder="ابحث هنا" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ابحث في هذا القسم" />
        </label>
      )}
    </div>
  );

  const reset = () => {
    setCat(ALL);
    setQ("");
  };
  return { shown, bar, filtered: cat !== ALL || q !== "", reset };
}

export function SectionPage({ section }: { section: Section }) {
  const { posts, isAdmin, ready } = useStore();
  const items = useMemo(
    () => posts.filter((p) => p.type === section.type && (isAdmin || isLive(p))),
    [posts, section.type, isAdmin],
  );
  const { shown, bar, filtered, reset } = useFilter(items);
  const tiles = section.type === "prose" || section.type === "poem";

  const [first, ...rest] = shown;
  return (
    <div className="page">
      <PageHeader title={section.title} description={section.description} kicker={items.length ? plural(items.length, { zero: "", one: "منشور واحد", two: "منشوران", few: "# منشورات", many: "# منشورًا", other: "# منشور" }) : undefined} />
      {bar}
      {ready && items.length === 0 ? (
        <Empty>لا {section.title === "الشعر" ? "قصائد" : "منشورات"} هنا بعد.</Empty>
      ) : shown.length === 0 && filtered ? (
        <Empty>
          لا نتائج.{" "}
          <button type="button" className="link-btn" onClick={reset}>
            اعرض الكل
          </button>
        </Empty>
      ) : tiles ? (
        <div className={`tiles tiles-${section.type}`}>
          {shown.map((p) => (
            <TextTile key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <>
          {first && !filtered ? <StoryCard post={first} size="lg" /> : null}
          <div className="grid-3 section-grid">
            {(filtered ? shown : rest).map((p) => (
              <StoryCard key={p.id} post={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
