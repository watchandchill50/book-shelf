import { useRef, useState, type DragEvent } from "react";
import { api, type Uploaded } from "../lib/api";
import { fileSizeText, n } from "../lib/ar";

/** Shrinks big photos before upload (max 2000px, JPEG) so pages stay fast. */
async function prepareImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1_200_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type Props = {
  kind: "image" | "pdf";
  label: string;
  hint?: string;
  value: string | null;
  fileName?: string | null;
  onUploaded: (u: Uploaded) => void;
  onClear?: () => void;
};

export function Upload({ kind, label, hint, value, fileName, onUploaded, onClear }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setErr(null);
    if (kind === "pdf" && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErr("اختاري ملف PDF.");
      return;
    }
    if (kind === "image" && !file.type.startsWith("image/")) {
      setErr("اختاري صورة (JPG أو PNG أو WebP).");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErr(`الملف كبير (${fileSizeText(file.size)}). الحد الأقصى ٥٠ م.ب.`);
      return;
    }
    setPct(0);
    try {
      const ready = kind === "image" ? await prepareImage(file) : file;
      const u = await api.upload(ready, kind === "image" ? "images" : "files", setPct);
      onUploaded({ ...u, name: file.name });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPct(null);
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    handle(e.dataTransfer.files[0]);
  }

  return (
    <div className="upload">
      <span className="field-label">{label}</span>
      <div
        className={`drop${over ? " is-over" : ""}${value ? " has-value" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {value && kind === "image" && <img src={value} alt="" className="drop-preview" />}
        {value && kind === "pdf" && <p className="drop-file">{fileName || "ملف PDF"}</p>}
        {pct !== null ? (
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
            <span>جارٍ الرفع… {n(pct)}٪</span>
          </div>
        ) : (
          <div className="drop-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>
              {value ? "استبدال" : kind === "image" ? "اختاري صورة" : "اختاري ملف PDF"}
            </button>
            {value && onClear && (
              <button type="button" className="link-btn danger" onClick={onClear}>
                إزالة
              </button>
            )}
            {!value && <span className="hint">أو اسحبيه وأفلتيه هنا</span>}
          </div>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept={kind === "image" ? "image/*" : "application/pdf,.pdf"}
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {hint && <span className="hint">{hint}</span>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
