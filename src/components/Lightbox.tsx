import { useEffect, useRef } from "react";
import type { Post } from "../lib/api";
import { ChevronLeft, ChevronRight, CloseIcon, DownloadIcon } from "./Icons";
import { Link } from "../lib/router";
import { postPath } from "./Cards";

type Props = {
  photos: Post[];
  index: number | null;
  onIndex: (i: number | null) => void;
};

/** Full-screen photo viewer: ← → to move, Esc to close. */
export function Lightbox({ photos, index, onIndex }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const photo = index !== null ? photos[index] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (photo && !d.open) d.showModal();
    if (!photo && d.open) d.close();
  }, [photo]);

  const go = (step: number) => {
    if (index === null) return;
    onIndex((index + step + photos.length) % photos.length);
  };

  return (
    <dialog
      ref={ref}
      className="lightbox"
      onClose={() => onIndex(null)}
      onClick={(e) => e.target === e.currentTarget && onIndex(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(1);
        if (e.key === "ArrowRight") go(-1);
      }}
      aria-label={photo?.title || "صورة"}
    >
      {photo && (
        <>
          <div className="lb-bar">
            <button type="button" className="icon-btn" onClick={() => onIndex(null)} aria-label="إغلاق">
              <CloseIcon />
            </button>
            {photo.coverUrl && (
              <a className="icon-btn" href={photo.coverUrl} download={`${photo.title || "صورة"}`} aria-label="تحميل الصورة" title="تحميل">
                <DownloadIcon />
              </a>
            )}
          </div>
          <figure className="lb-figure" key={photo.id}>
            {photo.coverUrl && <img src={photo.coverUrl} alt={photo.title} />}
            <figcaption>
              {photo.title && <strong>{photo.title}</strong>}
              {photo.body && <span>{photo.body}</span>}
              <Link to={postPath(photo)} className="lb-link">
                التعليقات والإعجاب
              </Link>
            </figcaption>
          </figure>
          {photos.length > 1 && (
            <>
              <button type="button" className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="السابقة">
                <ChevronRight size={26} />
              </button>
              <button type="button" className="lb-nav lb-next" onClick={() => go(1)} aria-label="التالية">
                <ChevronLeft size={26} />
              </button>
            </>
          )}
        </>
      )}
    </dialog>
  );
}
