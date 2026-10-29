import type { CSSProperties, ReactElement } from "react";

/** Eight-point star (khatam) — two squares, one turned 45°. */
export function Star({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="-10 -10 20 20" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="-6.4" y="-6.4" width="12.8" height="12.8" />
      <rect x="-6.4" y="-6.4" width="12.8" height="12.8" transform="rotate(45)" />
    </svg>
  );
}

/* ── helpers: petals drawn pointing up, then rotated around the centre ── */
const f = (x: number) => +x.toFixed(2);

/** Slim pointed petal from radius r1 (base) to r2 (tip). */
function slimPetal(r1: number, r2: number, w: number) {
  const d = r2 - r1;
  return `M0 ${f(-r1)} C${f(w)} ${f(-(r1 + 0.3 * d))} ${f(w * 0.7)} ${f(-(r2 - 0.25 * d))} 0 ${f(-r2)} C${f(-w * 0.7)} ${f(-(r2 - 0.25 * d))} ${f(-w)} ${f(-(r1 + 0.3 * d))} 0 ${f(-r1)}Z`;
}

/** Broad lotus petal with a base width of 2w and a drawn-out tip. */
function lotusPetal(r1: number, r2: number, w: number) {
  const d = r2 - r1;
  return `M${f(-w)} ${f(-r1)} C${f(-w * 1.15)} ${f(-(r1 + 0.55 * d))} ${f(-w * 0.25)} ${f(-(r2 - 0.32 * d))} 0 ${f(-r2)} C${f(w * 0.25)} ${f(-(r2 - 0.32 * d))} ${f(w * 1.15)} ${f(-(r1 + 0.55 * d))} ${f(w)} ${f(-r1)}`;
}

function ring(count: number, render: (angle: number, i: number) => ReactElement, offset = 0) {
  return Array.from({ length: count }, (_, i) => render(offset + (360 / count) * i, i));
}

function dots(count: number, r: number, size: number) {
  return ring(count, (a, i) => <circle key={`d${r}-${i}`} cx="0" cy={-r} r={size} transform={`rotate(${a})`} />);
}

/**
 * A drawn mandala in the spirit of the reference artwork: lotus petals, a
 * dotted band, a ring of slim petals and a rosette. Line-only, coloured with
 * currentColor so it can sit faintly on linen or bright on dark sections.
 */
export function Mandala({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* outer lotus petals, with an inner petal, a curl and a seed */}
        {ring(12, (a, i) => (
          <g key={`o${i}`} transform={`rotate(${a})`}>
            <path d={lotusPetal(64, 97, 15)} strokeWidth="0.9" />
            <path d={lotusPetal(66, 88, 9)} strokeWidth="0.5" />
            <path d={slimPetal(70, 82, 3)} strokeWidth="0.45" />
            <circle cx="0" cy="-74" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="-7" cy="-70" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="7" cy="-70" r="0.8" fill="currentColor" stroke="none" />
          </g>
        ))}
        {/* secondary petals peeking between the lotus petals */}
        {ring(12, (a, i) => <path key={`s${i}`} d={slimPetal(62, 80, 6)} transform={`rotate(${a})`} strokeWidth="0.55" />, 15)}

        {/* dotted band */}
        <circle r="61" strokeWidth="0.8" />
        <g fill="currentColor" stroke="none">{dots(64, 58.2, 0.7)}</g>
        <circle r="55.5" strokeWidth="0.5" />

        {/* scallops */}
        {ring(24, (a, i) => (
          <path key={`sc${i}`} d="M-7 -55.5 Q0 -47 7 -55.5" transform={`rotate(${a})`} strokeWidth="0.55" />
        ))}

        {/* ring of slim petals with veins */}
        {ring(16, (a, i) => (
          <g key={`m${i}`} transform={`rotate(${a})`}>
            <path d={slimPetal(28, 47, 6.5)} strokeWidth="0.7" />
            <path d="M0 -31 L0 -44" strokeWidth="0.4" />
          </g>
        ))}
        <circle r="27" strokeWidth="0.7" />
        <g fill="currentColor" stroke="none">{dots(32, 24.4, 0.55)}</g>
        <circle r="22" strokeWidth="0.45" />

        {/* rosette */}
        {ring(8, (a, i) => (
          <path key={`r${i}`} d={lotusPetal(7, 20, 5.5)} transform={`rotate(${a})`} strokeWidth="0.7" />
        ))}
        {ring(8, (a, i) => <path key={`r2${i}`} d={slimPetal(8, 15, 2)} transform={`rotate(${a})`} strokeWidth="0.4" />, 22.5)}
        <circle r="6" strokeWidth="0.7" />
        <circle r="2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** Small rosette used in dividers and medallions. */
export function Rosette({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="-30 -30 60 60" width={size} height={size} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        {ring(8, (a, i) => <path key={i} d={lotusPetal(6, 27, 7)} transform={`rotate(${a})`} strokeWidth="1.4" />)}
        {ring(8, (a, i) => <path key={`b${i}`} d={slimPetal(7, 18, 2.5)} transform={`rotate(${a})`} strokeWidth="1" />, 22.5)}
        <circle r="5" strokeWidth="1.4" />
        <circle r="1.8" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** ─── line · rosette · line ─── */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <span className={`divider ${className}`} aria-hidden="true">
      <i />
      <Rosette size={22} />
      <i />
    </span>
  );
}

/**
 * Section medallion: a round ornamental frame with a calligraphic letter in
 * the middle — used instead of generic icons.
 */
export function Medallion({ letter, className = "" }: { letter: string; className?: string }) {
  return (
    <span className={`medallion ${className}`} aria-hidden="true">
      <svg viewBox="-50 -50 100 100">
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          {ring(16, (a, i) => <path key={i} d={lotusPetal(38, 49, 6.5)} transform={`rotate(${a})`} strokeWidth="1" />)}
          <circle r="37" strokeWidth="1.2" />
          <g fill="currentColor" stroke="none">{dots(36, 34, 0.75)}</g>
          <circle r="31" strokeWidth="0.7" />
        </g>
      </svg>
      <b>{letter}</b>
    </span>
  );
}

const LETTERS = ["ق", "طّ", "دُ", "ثَ", "كـ", "صَ", "ي", "سِ", "تُ", "ن", "عَ", "م", "ف", "ح", "ر", "ل"];

/**
 * A vertical strip of large, scattered calligraphic letters with small
 * diacritics, like the band in the reference image.
 */
export function CalligraphyBand({ className = "", count = 22 }: { className?: string; count?: number }) {
  return (
    <div className={`calli-band ${className}`} aria-hidden="true">
      <div className="calli-inner">
        {Array.from({ length: count }, (_, i) => {
          const big = i % 3 === 0;
          return (
            <span
              key={i}
              className={big ? "calli-big" : i % 3 === 1 ? "calli-mid" : "calli-small"}
              style={{ marginInlineStart: `${((i * 37) % 50) - 10}%`, transform: `rotate(${((i * 13) % 14) - 7}deg)` }}
            >
              {LETTERS[(i * 5) % LETTERS.length]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
