import { useStore } from "../lib/store";
import { CopyIcon, ShareIcon } from "./Icons";

/** Share buttons: native share sheet on phones, WhatsApp / X / copy link everywhere. */
export function Share({ title, path }: { title: string; path: string }) {
  const { notify } = useStore();
  const url = `${location.origin}${path}`;
  const text = encodeURIComponent(`${title}\n${url}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      notify("نُسخ الرابط");
    } catch {
      notify("تعذّر النسخ، انسخ الرابط من شريط العنوان");
    }
  }

  async function native() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* closed */
    }
  }

  const canNative = typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches;

  return (
    <div className="share" role="group" aria-label="مشاركة">
      {canNative && (
        <button type="button" className="pill" onClick={native}>
          <ShareIcon />
          شارك
        </button>
      )}
      <a className="pill" href={`https://wa.me/?text=${text}`} target="_blank" rel="noreferrer">
        واتساب
      </a>
      <a
        className="pill"
        href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
      >
        X
      </a>
      <button type="button" className="pill" onClick={copy}>
        <CopyIcon />
        نسخ الرابط
      </button>
    </div>
  );
}
