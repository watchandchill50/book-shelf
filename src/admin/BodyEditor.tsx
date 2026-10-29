import { useRef, useState } from "react";
import { Markdown, Poem } from "../lib/markdown";
import { api } from "../lib/api";
import { n } from "../lib/ar";

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  poem?: boolean;
  rows?: number;
  placeholder?: string;
};

/**
 * Writing area with a formatting toolbar and a live preview.
 * Formatting is simple Markdown, so what she writes stays readable as plain text.
 */
export function BodyEditor({ value, onChange, label, poem = false, rows = 16, placeholder }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  /** Wrap the selection (or insert at the cursor) and keep focus. */
  function apply(before: string, after = "", placeholderText = "") {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || placeholderText;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  /** Prefix each selected line (headings, quotes, lists). */
  function linePrefix(prefix: string) {
    const el = ta.current;
    if (!el) return;
    const s = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const e = el.selectionEnd;
    const block = value.slice(s, e) || "";
    const lines = (block || " ").split("\n").map((l) => prefix + l.replace(/^(#{1,3}\s|>\s?|-\s)/, ""));
    const next = value.slice(0, s) + lines.join("\n") + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  }

  async function insertImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const u = await api.upload(file, "images");
      apply(`\n\n![${file.name.replace(/\.\w+$/, "")}](${u.url})\n\n`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (imgInput.current) imgInput.current.value = "";
    }
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="editor">
      <div className="editor-top">
        <span className="field-label">{label}</span>
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")}>
            كتابة
          </button>
          <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")}>
            معاينة
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <>
          {!poem && (
            <div className="toolbar" role="toolbar" aria-label="التنسيق">
              <button type="button" onClick={() => linePrefix("## ")} title="عنوان فرعي">
                عنوان
              </button>
              <button type="button" onClick={() => apply("**", "**", "نص عريض")} title="عريض">
                <strong>ع</strong>
              </button>
              <button type="button" onClick={() => apply("*", "*", "نص مائل")} title="مائل">
                <em>م</em>
              </button>
              <button type="button" onClick={() => linePrefix("> ")} title="اقتباس داخل النص">
                اقتباس
              </button>
              <button type="button" onClick={() => linePrefix("- ")} title="قائمة">
                قائمة
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt("الرابط:", "https://");
                  if (url) apply("[", `](${url})`, "نص الرابط");
                }}
                title="رابط"
              >
                رابط
              </button>
              <button type="button" onClick={() => imgInput.current?.click()} disabled={uploading} title="إدراج صورة">
                {uploading ? "جارٍ الرفع…" : "صورة"}
              </button>
              <button type="button" onClick={() => apply("\n\n---\n\n")} title="فاصل">
                فاصل
              </button>
              <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => insertImage(e.target.files?.[0])} />
            </div>
          )}
          <textarea
            ref={ta}
            className="editor-area"
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            dir="rtl"
          />
        </>
      ) : (
        <div className="editor-preview">
          {value.trim() ? poem ? <Poem text={value} /> : <Markdown text={value} /> : <p className="hint">لا شيء للمعاينة بعد.</p>}
        </div>
      )}
      <p className="hint editor-foot">
        {n(words)} كلمة
        {poem && " — للبيت العمودي: اكتبي الصدر ثم | ثم العجز في السطر نفسه. سطر فارغ = مقطع جديد."}
        {!poem && " — سطر فارغ يبدأ فقرة جديدة."}
      </p>
    </div>
  );
}
