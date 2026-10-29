// Small line icons, drawn to match the site (24px grid, 1.8 stroke).
type P = { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  focusable: "false" as const,
});

export const HeartPath =
  "M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z";

export function HeartIcon({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-heart">
      <path d={HeartPath} />
    </svg>
  );
}

export function CommentIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M4 5.5h16v10H9.5L5 19.5v-4H4z" />
    </svg>
  );
}

export function ShareIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M12 3.5v11M7.5 8 12 3.5 16.5 8M5 12.5v7h14v-7" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Points right: in RTL that is "previous". */
export function ChevronRight({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronLeft({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function SunIcon({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </svg>
  );
}

export function MoonIcon({ size = 20 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
    </svg>
  );
}

export function DownloadIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </svg>
  );
}

export function CopyIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
    </svg>
  );
}

export function ImageIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </svg>
  );
}

export function MenuIcon({ size = 22 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function PenIcon({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" />
    </svg>
  );
}

export function ArrowLeft({ size = 18 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

/* ── Section icons (used on the home page tiles) ── */
export function DocIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M6 3.5h8.5L18.5 7.5V20.5H6z" />
      <path d="M14 3.5v4.5h4.5M9 11.5h6.5M9 14.5h6.5M9 17.5h4" />
    </svg>
  );
}
export function FeatherIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M20 4c-7 0-12 5-12.5 12.5L4 20" />
      <path d="M20 4c0 7-4.5 11.5-12.5 12.5M11.5 12.5H16M9.5 15h4" />
    </svg>
  );
}
export function VerseIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M4 7.5h7M13 7.5h7M4 12h7M13 12h7M4 16.5h7M13 16.5h7" />
    </svg>
  );
}
export function GlassesIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <circle cx="7" cy="14" r="3.5" />
      <circle cx="17" cy="14" r="3.5" />
      <path d="M10.5 14c.9-.8 2.1-.8 3 0M3.5 14 5 7.5M20.5 14 19 7.5" />
    </svg>
  );
}
export function QuoteIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M10 7c-3 1-4.5 3.2-4.5 6.5V17H10v-4.5H7M19 7c-3 1-4.5 3.2-4.5 6.5V17H19v-4.5h-3" />
    </svg>
  );
}
export function BookIcon({ size = 26 }: P) {
  return (
    <svg {...base(size)} className="i-line">
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13" />
    </svg>
  );
}

export function SectionIcon({ type, size = 26 }: { type: string; size?: number }) {
  switch (type) {
    case "article":
      return <DocIcon size={size} />;
    case "prose":
      return <FeatherIcon size={size} />;
    case "poem":
      return <VerseIcon size={size} />;
    case "review":
      return <GlassesIcon size={size} />;
    case "quote":
      return <QuoteIcon size={size} />;
    case "book":
      return <BookIcon size={size} />;
    default:
      return <ImageIcon size={size} />;
  }
}
