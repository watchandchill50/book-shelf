import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A tiny router: real URLs (/articles, /p/123), no extra package.
// Vercel serves index.html for every path (see vercel.json).

type Loc = { path: string; search: URLSearchParams };
const listeners = new Set<() => void>();

const current = (): Loc => ({
  path: decodeURI(location.pathname).replace(/\/+$/, "") || "/",
  search: new URLSearchParams(location.search),
});

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) {
  if (to === location.pathname + location.search) return;
  history[opts.replace ? "replaceState" : "pushState"](null, "", to);
  listeners.forEach((l) => l());
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
}

window.addEventListener("popstate", () => listeners.forEach((l) => l()));

export function useLocation(): Loc {
  const [loc, setLoc] = useState(current);
  useEffect(() => {
    const l = () => setLoc(current());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return loc;
}

/** "/p/:id" against "/p/abc" -> { id: "abc" } (or null) */
export function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handle} {...rest} />;
}
