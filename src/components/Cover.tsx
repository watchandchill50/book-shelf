import type { CSSProperties } from "react";
import type { Post } from "../lib/api";
import { Rosette } from "./Ornament";
import { SITE_NAME } from "../config";

// Leather-and-cloth tones that sit well on linen.
const PALETTES = [
  { bg: "#3b2c22", fg: "#ecdcc0" }, // espresso leather
  { bg: "#6b2e26", fg: "#f3e2cf" }, // oxblood
  { bg: "#4b4a2e", fg: "#efe8cf" }, // olive cloth
  { bg: "#2f3a45", fg: "#e7e1d3" }, // slate
  { bg: "#8a6a48", fg: "#fbf1de" }, // tan
  { bg: "#d9cdbb", fg: "#3b2c22" }, // natural linen
]

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A book's cover image, or a drawn cover if none was uploaded. */
export function Cover({ post, className = "" }: { post: Post; className?: string }) {
  if (post.coverUrl) {
    return <img className={`cover ${className}`} src={post.coverUrl} alt={`غلاف ${post.title}`} loading="lazy" />;
  }
  const p = PALETTES[hash(post.id) % PALETTES.length];
  return (
    <div
      className={`cover cover-drawn ${className}`}
      role="img"
      aria-label={`غلاف ${post.title}`}
      style={{ "--c-bg": p.bg, "--c-fg": p.fg } as CSSProperties}
    >
      <Rosette className="cover-star" size={26} />
      <span className="cover-title">{post.title}</span>
      <span className="cover-author">{post.refAuthor || SITE_NAME}</span>
    </div>
  );
}
