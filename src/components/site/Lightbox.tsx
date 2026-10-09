import { useEffect, useRef } from 'react';
import type { GalleryItem } from '../../lib/api';
import { captionFor } from '../../data/gallery';

/* Native <dialog> gives focus trapping, Escape and inertness for free — all of
   which are easy to get subtly wrong by hand. */
export default function Lightbox({
  items, index, onClose, onMove
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onMove: (next: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onMove((index! + 1) % items.length); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onMove((index! - 1 + items.length) % items.length); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, items.length, onMove]);

  const item = open ? items[index!] : null;
  const caption = item ? captionFor(item) : null;

  return (
    <dialog ref={ref} className="p-lb" onClose={onClose} aria-label="Photo viewer">
      {item && (
        <div className="p-lb__inner">
          <div className="p-lb__bar">
            <p className="p-lb__count">{index! + 1} of {items.length}</p>
            <button type="button" className="p-lb__btn" onClick={onClose} aria-label="Close viewer">
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <figure className="p-lb__figure">
            {item.type === 'video'
              ? <video src={item.url} controls className="p-lb__media" />
              : <img src={item.url} alt={caption ?? ''} className="p-lb__media" />}
            {caption && <figcaption className="p-lb__cap">{caption}</figcaption>}
          </figure>

          {items.length > 1 && (
            <div className="p-lb__nav">
              <button type="button" className="p-lb__btn"
                onClick={() => onMove((index! - 1 + items.length) % items.length)} aria-label="Previous photo">
                <i className="fas fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button type="button" className="p-lb__btn"
                onClick={() => onMove((index! + 1) % items.length)} aria-label="Next photo">
                <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
