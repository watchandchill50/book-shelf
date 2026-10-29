import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, navigate, useLocation } from "../lib/router";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SECTIONS, SITE_NAME } from "../config";
import { api } from "../lib/api";
import { CloseIcon, MenuIcon, MoonIcon, PenIcon, SearchIcon, SunIcon } from "./Icons";
import { CalligraphyBand, Divider, Mandala, Rosette } from "./Ornament";

const MENU = [{ path: "/", title: "الرئيسية" }, ...SECTIONS.map((s) => ({ path: s.path, title: s.title })), { path: "/about", title: "عنّي" }];

const today = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const { theme, toggle } = useTheme();
  const { isAdmin, settings } = useStore();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [stuck, setStuck] = useState(false);
  const masthead = useRef<HTMLDivElement>(null);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
  }, [menu]);

  // Show the small logo in the nav bar once the big masthead scrolls away.
  useEffect(() => {
    const el = masthead.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: "-10px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  const home = path === "/";
  const compact = stuck || home;

  // Sections fade in as they scroll into view.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -6% 0px" },
    );
    const scan = () => document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  const submitSearch = () => {
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setSearch(false);
    setQ("");
  };

  return (
    <>
      <a className="skip" href="#main">
        تخطَّ إلى المحتوى
      </a>
      {api.mode === "demo" && (
        <p className="demo-bar">وضع تجريبي: المحتوى أمثلة، وما تضيفينه يُحفظ في هذا المتصفح فقط.</p>
      )}

      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>{today.format(new Date())}</span>
          <span className="topbar-links">
            {settings.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
            <Link to="/admin">{isAdmin ? "لوحة التحكم" : "دخول الكاتبة"}</Link>
          </span>
        </div>
      </div>

      <div className={`masthead${home ? " is-home" : ""}`} ref={masthead}>
        <div className="wrap masthead-inner">
          <div className="masthead-side">
            <button type="button" className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="القائمة" aria-expanded={menu}>
              <MenuIcon />
            </button>
          </div>
          <Link to="/" className="logo" aria-label={`${SITE_NAME} — الرئيسية`}>
            <span className="logo-name">{SITE_NAME}</span>
            <Divider className="logo-divider" />
            {settings.tagline && <span className="logo-tagline">{settings.tagline}</span>}
          </Link>
          <div className="masthead-side masthead-tools">
            <button type="button" className="icon-btn" onClick={() => setSearch(true)} aria-label="بحث" title="بحث">
              <SearchIcon />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            {isAdmin && (
              <Link to="/admin/new" className="btn btn-primary btn-sm write-btn">
                <PenIcon />
                اكتبي
              </Link>
            )}
          </div>
        </div>
      </div>

      <header className={`navbar${compact ? " is-stuck" : ""}`}>
        <div className="wrap navbar-inner">
          <Link to="/" className="nav-logo" aria-hidden={!compact} tabIndex={compact ? 0 : -1}>
            {SITE_NAME}
          </Link>
          <nav className="nav-links" aria-label="الأقسام">
            {MENU.map((m) => (
              <Link key={m.path} to={m.path} aria-current={active(m.path) ? "page" : undefined}>
                {m.title}
              </Link>
            ))}
          </nav>
          <div className="nav-tools">
            <button type="button" className="icon-btn icon-btn-plain" onClick={() => setSearch(true)} aria-label="بحث">
              <SearchIcon />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-plain nav-theme"
              onClick={toggle}
              aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button type="button" className="icon-btn icon-btn-plain menu-btn" onClick={() => setMenu(true)} aria-label="القائمة">
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {search && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="البحث" onClick={() => setSearch(false)}>
          <form
            className="search-box"
            role="search"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <SearchIcon size={22} />
            <input
              autoFocus
              type="search"
              placeholder="ابحث في المقالات والشعر والاقتباسات والكتب…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearch(false)}
              aria-label="ابحث في الموقع"
            />
            <button type="button" className="icon-btn icon-btn-plain" onClick={() => setSearch(false)} aria-label="إغلاق">
              <CloseIcon />
            </button>
          </form>
        </div>
      )}

      {menu && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="القائمة" onClick={() => setMenu(false)}>
          <nav className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="drawer-logo">{SITE_NAME}</span>
              <button type="button" className="icon-btn" onClick={() => setMenu(false)} aria-label="إغلاق">
                <CloseIcon />
              </button>
            </div>
            {MENU.map((m) => (
              <Link key={m.path} to={m.path} aria-current={active(m.path) ? "page" : undefined}>
                {m.title}
              </Link>
            ))}
            <div className="drawer-foot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={toggle}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              </button>
              <Link to="/admin" className="link-btn">
                {isAdmin ? "لوحة التحكم" : "دخول الكاتبة"}
              </Link>
            </div>
          </nav>
        </div>
      )}

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="footer">
        <Mandala className="footer-mandala" />
        <CalligraphyBand className="footer-band" count={14} />
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <Rosette className="footer-star" size={30} />
            <p className="footer-name">{SITE_NAME}</p>
            {settings.tagline && <p className="footer-tagline">{settings.tagline}</p>}
            {settings.intro && <p className="footer-intro">{settings.intro}</p>}
          </div>
          <nav className="footer-col" aria-label="الكتابات">
            <p className="footer-title">الكتابات</p>
            {SECTIONS.slice(0, 4).map((s) => (
              <Link key={s.path} to={s.path}>
                {s.title}
              </Link>
            ))}
          </nav>
          <nav className="footer-col" aria-label="المكتبة">
            <p className="footer-title">المكتبة</p>
            {SECTIONS.slice(4).map((s) => (
              <Link key={s.path} to={s.path}>
                {s.title}
              </Link>
            ))}
            <Link to="/about">عنّي</Link>
          </nav>
          <div className="footer-col">
            <p className="footer-title">تواصل</p>
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
            {!settings.email && settings.links.length === 0 && <Link to="/about">صفحة «عنّي»</Link>}
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>
            © {new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(new Date().getFullYear())} {SITE_NAME}. جميع الحقوق محفوظة.
          </span>
          <Link to="/admin">{isAdmin ? "لوحة التحكم" : "دخول الكاتبة"}</Link>
        </div>
      </footer>
    </>
  );
}

/** Linen banner at the top of every inner page: half mandala, calligraphy strip, title. */
export function PageHeader({ title, description, kicker, children }: { title: string; description?: string; kicker?: string; children?: ReactNode }) {
  return (
    <header className="page-hero">
      <Mandala className="page-hero-mandala" />
      <CalligraphyBand className="page-hero-band" count={8} />
      <div className="page-hero-inner">
        {kicker && <p className="page-kicker">{kicker}</p>}
        <h1>{title}</h1>
        <Divider />
        {description && <p className="page-desc">{description}</p>}
        {children}
      </div>
    </header>
  );
}

/** Centred section title in calligraphy, with an ornamental rule and a "see all" link. */
export function SectionHead({ title, to, more = "عرض الكل", sub }: { title: string; to?: string; more?: string; sub?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <Divider />
      {sub && <p className="section-sub">{sub}</p>}
      {to && (
        <Link to={to} className="section-more">
          {more}
        </Link>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
