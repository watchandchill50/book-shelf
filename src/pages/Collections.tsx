import { useMemo, useState } from "react";
import { useStore, isLive } from "../lib/store";
import { n } from "../lib/ar";
import { sectionOf, SITE_NAME } from "../config";
import { Empty, PageHeader } from "../components/Layout";
import { BookCard, PhotoTile, QuoteCard } from "../components/Cards";
import { Lightbox } from "../components/Lightbox";
import { useFilter } from "./Section";

function usePosts(type: "quote" | "book" | "photo") {
  const { posts, isAdmin } = useStore();
  return useMemo(() => posts.filter((p) => p.type === type && (isAdmin || isLive(p))), [posts, type, isAdmin]);
}

type Tab<T extends string> = { id: T; label: string; count: number };

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: Tab<T>[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className="tab" onClick={() => onChange(t.id)}>
          {t.label}
          <span className="chip-count">{n(t.count)}</span>
        </button>
      ))}
    </div>
  );
}

/* ───────── Quotes ───────── */
export function QuotesPage() {
  const all = usePosts("quote");
  const [who, setWho] = useState<"all" | "mine" | "others">("all");
  const scoped = all.filter((q) => (who === "all" ? true : who === "mine" ? !q.refAuthor : !!q.refAuthor));
  const { shown, bar } = useFilter(scoped);
  const s = sectionOf("quote");

  return (
    <div className="page">
      <PageHeader title={s.title} description={s.description} />
      <Tabs
        value={who}
        onChange={setWho}
        tabs={[
          { id: "all", label: "الكل", count: all.length },
          { id: "mine", label: "اقتباساتي", count: all.filter((q) => !q.refAuthor).length },
          { id: "others", label: "من أدباء ومفكرين", count: all.filter((q) => q.refAuthor).length },
        ]}
      />
      {bar}
      {shown.length === 0 ? (
        <Empty>لا اقتباسات هنا بعد.</Empty>
      ) : (
        <div className="quotes-masonry">
          {shown.map((q) => (
            <QuoteCard key={q.id} post={q} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Books ───────── */
export function BooksPage() {
  const all = usePosts("book");
  const mine = all.filter((b) => b.bookKind !== "recommended");
  const rec = all.filter((b) => b.bookKind === "recommended");
  const [tab, setTab] = useState<"mine" | "rec">(mine.length || !rec.length ? "mine" : "rec");
  const list = tab === "mine" ? mine : rec;
  const s = sectionOf("book");

  return (
    <div className="page">
      <PageHeader title={s.title} description={s.description} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "mine", label: `كتب ${SITE_NAME.split(" ")[0]}`, count: mine.length },
          { id: "rec", label: "كتب أوصي بها", count: rec.length },
        ]}
      />
      {tab === "rec" && rec.length > 0 && (
        <p className="tab-note">
          كتب أحببتها وأنصح بقراءتها. يتاح التحميل فقط لما يُسمح بنشره، وغيره تجد رابطًا للحصول عليه.
        </p>
      )}
      {list.length === 0 ? (
        <Empty>لا كتب هنا بعد.</Empty>
      ) : (
        <div className="books-grid">
          {list.map((b) => (
            <BookCard key={b.id} post={b} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Gallery ───────── */
export function GalleryPage() {
  const all = usePosts("photo").filter((p) => p.coverUrl);
  const [i, setI] = useState<number | null>(null);
  const s = sectionOf("photo");
  return (
    <div className="page">
      <PageHeader title={s.title} description={s.description} />
      {all.length === 0 ? (
        <Empty>لا صور بعد.</Empty>
      ) : (
        <div className="gallery">
          {all.map((p, idx) => (
            <PhotoTile key={p.id} post={p} onOpen={() => setI(idx)} />
          ))}
        </div>
      )}
      <Lightbox photos={all} index={i} onIndex={setI} />
    </div>
  );
}
