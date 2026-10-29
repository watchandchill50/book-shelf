import { useEffect } from "react";
import { StoreProvider, useStore } from "./lib/store";
import { match, useLocation } from "./lib/router";
import { SECTIONS, SITE_NAME } from "./config";
import { useToast } from "./components/Toast";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { SectionPage } from "./pages/Section";
import { BooksPage, GalleryPage, QuotesPage } from "./pages/Collections";
import { PostPage } from "./pages/PostPage";
import { AboutPage, NotFound, SearchPage } from "./pages/Misc";
import { Admin } from "./admin/Admin";

function Routes() {
  const { path } = useLocation();
  const { error } = useStore();

  useEffect(() => {
    const s = SECTIONS.find((x) => x.path === path);
    document.title =
      path === "/" ? SITE_NAME : s ? `${s.title} — ${SITE_NAME}` : path === "/about" ? `عنّي — ${SITE_NAME}` : document.title;
  }, [path]);

  if (path.startsWith("/admin")) return <Admin />;

  let page;
  let m;
  const section = SECTIONS.find((s) => s.path === path);
  if (path === "/") page = <Home />;
  else if (path === "/quotes") page = <QuotesPage />;
  else if (path === "/books") page = <BooksPage />;
  else if (path === "/gallery") page = <GalleryPage />;
  else if (section) page = <SectionPage key={section.path} section={section} />;
  else if ((m = match("/p/:id", path))) page = <PostPage key={m.id} id={m.id} />;
  else if (path === "/about") page = <AboutPage />;
  else if (path === "/search") page = <SearchPage />;
  else page = <NotFound />;

  return (
    <Layout>
      {error && (
        <p className="banner-error" role="alert">
          تعذّر تحميل المحتوى: {error}
        </p>
      )}
      {page}
    </Layout>
  );
}

export default function App() {
  const { notify, toast } = useToast();
  return (
    <StoreProvider notify={notify}>
      <Routes />
      {toast}
    </StoreProvider>
  );
}
