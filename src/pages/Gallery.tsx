import { useEffect, useState } from 'react';
import { api, Category, GalleryItem } from '../lib/api';

export default function Gallery() {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [modal, setModal] = useState<GalleryItem | null>(null);

  useEffect(() => {
    api.categories.list().then(setCats).catch(() => {});
    api.gallery.list().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { document.body.style.overflow = modal ? 'hidden' : ''; }, [modal]);

  const visible = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <>
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Moments of Grace</span>
          <h1>Photo &amp; Video Gallery</h1>
          <p>Celebrating moments of worship, fellowship, and community service.</p>
        </div>
      </section>

      <section className="gallery-filter">
        <div className="container">
          <div className="filter-buttons">
            <button className={`filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All Media</button>
            {cats.map(c => (
              <button key={c.slug} className={`filter-btn${filter === c.slug ? ' active' : ''}`} onClick={() => setFilter(c.slug)}>{c.label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery">
        <div className="container">
          {visible.length === 0 ? (
            <p className="text-center" style={{ padding: '3rem' }}>No media yet. Check back soon!</p>
          ) : (
            <div className="gallery-grid">
              {visible.map(item => (
                <div key={item.id} className="gallery-item" tabIndex={0} role="button"
                  onClick={() => setModal(item)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModal(item); } }}>
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} preload="metadata" muted className="gallery-media" />
                      <div className="video-badge"><i className="fas fa-play-circle"></i></div>
                    </>
                  ) : (
                    <img src={item.url} alt={item.title} loading="lazy" className="gallery-media" width={400} height={300} />
                  )}
                  <div className="gallery-overlay">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <button className="view-btn" onClick={e => { e.stopPropagation(); setModal(item); }}>
                      {item.type === 'video' ? <><i className="fas fa-play"></i> Play</> : <><i className="fas fa-expand"></i> View</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {modal && (
        <div className="modal open" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-content modal-media-content">
            <button className="close" aria-label="Close" onClick={() => setModal(null)}>×</button>
            <div className="modal-media">
              {modal.type === 'video'
                ? <video src={modal.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: '0 auto' }} />
                : <img src={modal.url} alt={modal.title} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />}
            </div>
            <div className="modal-info">
              <h3>{modal.title}</h3>
              <p>{modal.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
