import { Fragment, type ReactNode } from "react";

/*
  A small, safe Markdown subset for posts (no raw HTML is ever rendered):

    ## عنوان         ### عنوان أصغر
    > اقتباس
    - عنصر قائمة     1. قائمة مرقمة
    ![وصف](رابط الصورة)
    ---              فاصل
    **عريض**  *مائل*  [نص](رابط)

  Blank line = new paragraph. Single line breaks inside a paragraph are kept.
*/

function safeUrl(url: string) {
  const u = url.trim();
  return /^(https?:|data:image\/|blob:|\/|#)/i.test(u) ? u : "#";
}

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{inline(m[2], i)}</strong>);
    else if (m[4]) out.push(<em key={k}>{m[4]}</em>);
    else if (m[6]) {
      const href = safeUrl(m[7]);
      const external = /^https?:/i.test(href);
      out.push(
        <a key={k} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {m[6]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(text: string): ReactNode[] {
  const lines = text.split("\n");
  return lines.map((l, i) => (
    <Fragment key={i}>
      {inline(l, i)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function Markdown({ text, className = "prose" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const first = lines[0];

        if (/^---+$/.test(block.trim())) return <hr key={bi} />;

        const h = first.match(/^(#{1,3})\s+(.*)$/);
        if (h && lines.length === 1) {
          const level = h[1].length;
          return level === 1 ? (
            <h2 key={bi}>{inline(h[2])}</h2>
          ) : level === 2 ? (
            <h2 key={bi}>{inline(h[2])}</h2>
          ) : (
            <h3 key={bi}>{inline(h[2])}</h3>
          );
        }

        const img = block.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (img) {
          return (
            <figure key={bi} className="prose-figure">
              <img src={safeUrl(img[2])} alt={img[1]} loading="lazy" />
              {img[1] && <figcaption>{img[1]}</figcaption>}
            </figure>
          );
        }

        if (lines.every((l) => l.startsWith(">"))) {
          return (
            <blockquote key={bi}>
              <p>{withBreaks(lines.map((l) => l.replace(/^>\s?/, "")).join("\n"))}</p>
            </blockquote>
          );
        }

        if (lines.every((l) => /^[-*•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^[0-9٠-٩]+[.)]\s+/.test(l))) {
          return (
            <ol key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^[0-9٠-٩]+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return <p key={bi}>{withBreaks(block)}</p>;
      })}
    </div>
  );
}

/**
 * Poetry. A line with "|" is a classical verse: صدر | عجز, set in two
 * balanced halves. Other lines are free verse. Blank line = new stanza.
 */
export function Poem({ text, className = "poem" }: { text: string; className?: string }) {
  const stanzas = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={className}>
      {stanzas.map((st, si) => (
        <div className="stanza" key={si}>
          {st.split("\n").map((line, li) => {
            const halves = line.split("|").map((s) => s.trim());
            return halves.length === 2 ? (
              <p className="verse verse-classic" key={li}>
                <span>{halves[0]}</span>
                <span>{halves[1]}</span>
              </p>
            ) : (
              <p className="verse" key={li}>
                {line}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Plain text of a post body, for excerpts and search. */
export function plainText(md: string) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
