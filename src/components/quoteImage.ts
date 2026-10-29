import type { Post } from "../lib/api";
import { SITE_NAME } from "../config";

/**
 * Draws a quote as a 1080×1350 image (good for Instagram / WhatsApp status)
 * and downloads it. Everything happens in the visitor's browser.
 */
export async function downloadQuoteImage(post: Post) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  try {
    await Promise.all([
      document.fonts.load('48px "Noto Naskh Arabic"'),
      document.fonts.load('700 48px "Aref Ruqaa"'),
      document.fonts.load('700 40px "Noto Naskh Arabic"'),
    ]);
  } catch {
    /* fall back to system fonts */
  }

  // background
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#3B2C22");
  g.addColorStop(1, "#5C4533");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // faint eight-point stars
  ctx.strokeStyle = "rgba(210, 180, 134, 0.13)";
  ctx.lineWidth = 1.5;
  const step = 120;
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      for (const rot of [0, Math.PI / 4]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeRect(-20, -20, 40, 40);
        ctx.restore();
      }
    }
  }

  // frame
  ctx.strokeStyle = "rgba(210, 180, 134, 0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#F3EADC";

  // quote text, wrapped
  const verses = post.body.split("|").map((s) => s.trim());
  const isVerse = verses.length === 2;
  let size = post.body.length > 220 ? 44 : post.body.length > 120 ? 52 : 62;
  const maxW = W - 240;
  let lines: string[] = [];
  const wrap = (text: string) => {
    const words = text.split(/\s+/);
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    if (line) out.push(line);
    return out;
  };
  for (let tries = 0; tries < 6; tries++) {
    ctx.font = `${size}px "Noto Naskh Arabic", serif`;
    lines = isVerse ? verses.flatMap(wrap) : post.body.split("\n").flatMap(wrap);
    if (lines.length * size * 1.9 < H - 520) break;
    size -= 6;
  }
  const lh = size * 1.9;
  let y = H / 2 - ((lines.length - 1) * lh) / 2 - 40;

  // opening ornament
  ctx.fillStyle = "#D2B486";
  ctx.font = `700 120px "Aref Ruqaa", serif`;
  ctx.fillText("«", W / 2, y - lh - 10);

  ctx.fillStyle = "#F3EADC";
  ctx.font = `${size}px "Noto Naskh Arabic", serif`;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += lh;
  }

  // who said it
  const who = post.refAuthor || SITE_NAME;
  ctx.fillStyle = "#D2B486";
  ctx.font = `700 36px "Noto Naskh Arabic", serif`;
  ctx.fillText(`— ${who}`, W / 2, y + 40);
  if (post.refSource) {
    ctx.fillStyle = "rgba(243, 234, 220, 0.7)";
    ctx.font = `28px "Noto Naskh Arabic", serif`;
    ctx.fillText(post.refSource, W / 2, y + 96);
  }

  // site signature
  ctx.fillStyle = "rgba(243, 234, 220, 0.75)";
  ctx.font = `700 48px "Aref Ruqaa", serif`;
  ctx.fillText(SITE_NAME, W / 2, H - 110);

  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `اقتباس-${who}.png`.replace(/\s+/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
