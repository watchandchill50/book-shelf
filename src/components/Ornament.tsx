/** Eight-point star (khatam) — two squares, one turned 45°. */
export function Star({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-10 -10 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="-6.4" y="-6.4" width="12.8" height="12.8" />
      <rect x="-6.4" y="-6.4" width="12.8" height="12.8" transform="rotate(45)" />
    </svg>
  );
}
