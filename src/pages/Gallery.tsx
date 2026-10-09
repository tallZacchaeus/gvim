import { useEffect, useMemo, useState } from 'react';
import { api, Category, GalleryItem } from '../lib/api';
import { captionFor, categoryLabel } from '../data/gallery';
import PageHeader from '../components/site/PageHeader';
import Lightbox from '../components/site/Lightbox';

const SKELETONS = 12;

export default function Gallery() {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  /* Three states, not two: loading is distinct from "loaded and empty".
     Conflating them is what produced the "No media yet" flash. */
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      api.categories.list().catch(() => [] as Category[]),
      api.gallery.list()
    ])
      .then(([c, g]) => {
        if (!live) return;
        setCats(c);
        setItems(g);
        setStatus('ready');
      })
      .catch(() => { if (live) setStatus('error'); });
    return () => { live = false; };
  }, []);

  /* Only offer categories that actually have photographs. A filter that leads
     to an empty grid is a dead end. */
  const available = useMemo(() => {
    const present = new Set(items.map(i => i.category));
    const named = cats.filter(c => present.has(c.slug));
    const known = new Set(named.map(c => c.slug));
    const extra = [...present].filter(s => !known.has(s)).map(s => ({ slug: s, label: s }));
    return [...named, ...extra];
  }, [cats, items]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter(i => i.category === filter)),
    [items, filter]
  );

  useEffect(() => { setLightbox(null); }, [filter]);

  return (
    <>
      <PageHeader
        crumb="Gallery"
        title="Gallery"
        lede="Worship, fellowship and community service — photographed as it happened."
      />

      <section className="p-section">
        <div className="p-container">
          {available.length > 0 && (
            <div className="p-filters" role="group" aria-label="Filter photographs by category">
              <button
                type="button"
                className={'p-filters__btn' + (filter === 'all' ? ' is-on' : '')}
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All <span className="p-filters__n">{items.length}</span>
              </button>
              {available.map(c => {
                const n = items.filter(i => i.category === c.slug).length;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    className={'p-filters__btn' + (filter === c.slug ? ' is-on' : '')}
                    aria-pressed={filter === c.slug}
                    onClick={() => setFilter(c.slug)}
                  >
                    {categoryLabel(c.slug, c.label)} <span className="p-filters__n">{n}</span>
                  </button>
                );
              })}
            </div>
          )}

          {status === 'loading' && (
            <ul className="p-grid" aria-busy="true" aria-label="Loading photographs">
              {Array.from({ length: SKELETONS }, (_, i) => (
                <li key={i} className="p-grid__item"><div className="p-skel" /></li>
              ))}
            </ul>
          )}

          {status === 'error' && (
            <p className="p-empty">The gallery could not be loaded. Please try again later.</p>
          )}

          {status === 'ready' && visible.length === 0 && (
            <p className="p-empty">No photographs in this category yet.</p>
          )}

          {status === 'ready' && visible.length > 0 && (
            <ul className="p-grid">
              {visible.map((item, i) => {
                const caption = captionFor(item);
                return (
                  <li key={item.id} className="p-grid__item">
                    <button
                      type="button"
                      className="p-grid__btn"
                      onClick={() => setLightbox(i)}
                      aria-label={caption ? `Open: ${caption}` : 'Open photograph'}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} muted preload="metadata" className="p-grid__media" />
                      ) : (
                        /* width/height give the browser the ratio before the
                           bytes arrive, so the grid never shifts. */
                        <img
                          src={item.url}
                          /* The visible .p-grid__cap and the button's
                             aria-label already describe this image. */
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={800}
                          height={600}
                          className="p-grid__media"
                        />
                      )}
                      {item.type === 'video' && (
                        <span className="p-grid__play" aria-hidden="true">
                          <i className="fas fa-play"></i>
                        </span>
                      )}
                    </button>
                    {caption && <p className="p-grid__cap">{caption}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <Lightbox items={visible} index={lightbox} onClose={() => setLightbox(null)} onMove={setLightbox} />
    </>
  );
}
