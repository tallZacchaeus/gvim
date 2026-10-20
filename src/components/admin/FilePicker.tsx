import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Stable identity for a File, so removing one does not disturb the others. */
function keyFor(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export interface FilePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  /** Shown under the controls; keep it short. */
  hint?: string;
  describedBy?: string;
  invalid?: boolean;
}

/**
 * Touch-first replacement for a bare <input type="file">.
 *
 * The native control is a ~20px tap target that shows "No file chosen", offers
 * no camera, and gives no way to drop a wrong photo before uploading — all of
 * which matter most on the phone, which is where this CMS is actually used.
 */
export default function FilePicker({
  files, onChange, disabled, hint, describedBy, invalid
}: FilePickerProps) {
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  /* Object URLs must be revoked or the page leaks a blob per preview. Keyed by
     file identity so re-renders do not recreate them. */
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const k = keyFor(f);
      next[k] = previews[k] ?? URL.createObjectURL(f);
    }
    for (const [k, url] of Object.entries(previews)) {
      if (!next[k]) URL.revokeObjectURL(url);
    }
    setPreviews(next);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => () => {
    Object.values(previews).forEach(URL.revokeObjectURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function add(list: FileList | null) {
    if (!list) return;
    const existing = new Set(files.map(keyFor));
    const merged = [...files];
    for (const f of Array.from(list)) {
      if (!existing.has(keyFor(f))) merged.push(f);
    }
    onChange(merged);
  }

  function remove(file: File) {
    onChange(files.filter(f => keyFor(f) !== keyFor(file)));
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  const oversized = files.filter(f => f.size > MAX_BYTES);

  return (
    <div className="picker" data-invalid={invalid ? 'true' : undefined}>
      <input
        ref={pickRef} type="file" multiple accept="image/*,video/*" className="sr-only"
        tabIndex={-1} aria-hidden="true"
        onChange={e => { add(e.target.files); e.target.value = ''; }}
      />
      {/* capture= asks the phone for the camera directly rather than the
          photo library. Desktop browsers ignore it, so the button is hidden
          there via CSS rather than user-agent sniffing. */}
      <input
        ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only"
        tabIndex={-1} aria-hidden="true"
        onChange={e => { add(e.target.files); e.target.value = ''; }}
      />

      <div className="picker__actions">
        <button
          type="button" className="picker__btn" disabled={disabled}
          aria-describedby={describedBy}
          onClick={() => pickRef.current?.click()}
        >
          <ImagePlus size={20} aria-hidden="true" />
          <span>{files.length ? 'Add more' : 'Choose photos'}</span>
        </button>
        <button
          type="button" className="picker__btn picker__btn--camera" disabled={disabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera size={20} aria-hidden="true" />
          <span>Take photo</span>
        </button>
      </div>

      {hint && !files.length && <p className="picker__hint" id={describedBy}>{hint}</p>}

      {files.length > 0 && (
        <>
          <p className="picker__summary" aria-live="polite">
            {files.length} file{files.length === 1 ? '' : 's'} · {formatSize(total)}
          </p>
          <ul className="picker__grid">
            {files.map(file => {
              const k = keyFor(file);
              const tooBig = file.size > MAX_BYTES;
              return (
                <li key={k} className="picker__item" data-oversize={tooBig ? 'true' : undefined}>
                  {previews[k]
                    ? <img src={previews[k]} alt="" loading="lazy" decoding="async" />
                    : <span className="picker__file" aria-hidden="true">
                        {(file.name.split('.').pop() || '?').toUpperCase()}
                      </span>}
                  <button
                    type="button" className="picker__remove" disabled={disabled}
                    onClick={() => remove(file)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                  <span className="picker__size">{formatSize(file.size)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {oversized.length > 0 && (
        <p className="picker__error" role="alert">
          {oversized.length} file{oversized.length === 1 ? ' is' : 's are'} over 50 MB and
          cannot be uploaded. Remove {oversized.length === 1 ? 'it' : 'them'} to continue.
        </p>
      )}
    </div>
  );
}
