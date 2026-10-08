import { useEffect, useState } from 'react';
import { api, Sermon } from '../lib/api';

function isAudio(path: string) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return ['mp3','wav','m4a','ogg'].includes(ext);
}

function isVideo(path: string) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return ['mp4','webm','mov'].includes(ext);
}

function FeaturedMedia({ s }: { s: Sermon }) {
  if (s.file_path && isVideo(s.file_path)) {
    return (
      <video controls preload="metadata" style={{ width: '100%', borderRadius: '0.75rem' }}>
        <source src={s.url} />
      </video>
    );
  }
  if (s.file_path && isAudio(s.file_path)) {
    return (
      <>
        <div className="video-placeholder">
          <img src="/gvim-logo-128.jpg" alt="GVIM" className="sermon-logo" />
          <div className="play-overlay"><i className="fas fa-headphones fa-3x"></i></div>
        </div>
        <audio controls style={{ width: '100%', marginTop: '1rem' }}>
          <source src={s.url} type="audio/mpeg" />
        </audio>
      </>
    );
  }
  if (s.youtube_id) {
    return (
      <iframe src={`https://www.youtube.com/embed/${s.youtube_id}`} title={s.title}
        allowFullScreen style={{ width: '100%', aspectRatio: '16/9', borderRadius: '0.75rem', border: 0 }} loading="lazy" />
    );
  }
  return (
    <div className="video-placeholder">
      <img src="/gvim-logo-128.jpg" alt="GVIM" className="sermon-logo" />
      <div className="play-overlay"><i className="fas fa-play-circle fa-4x"></i></div>
    </div>
  );
}

export default function Sermons() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  useEffect(() => { api.sermons.list().then(setSermons).catch(() => setSermons([])); }, []);

  const featured = sermons && sermons.length > 0 ? sermons[0] : null;
  const rest = sermons ? sermons.slice(1) : [];

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Sermons & Messages</h1>
          <p>Be encouraged and inspired by God's Word through our sermons and teachings</p>
        </div>
      </section>

      {featured ? (
        <section className="featured-sermon">
          <div className="container">
            <h2>Latest Message</h2>
            <div className="featured-content">
              <div className="sermon-video"><FeaturedMedia s={featured} /></div>
              <div className="sermon-details">
                <h3>{featured.title}</h3>
                <p className="sermon-meta">
                  <i className="fas fa-calendar"></i> {featured.sermon_date || ''}  | 
                  <i className="fas fa-user"></i> {featured.speaker || 'Rev. Godwin BB. Olutimi'}  | 
                  <i className="fas fa-clock"></i> {featured.duration || ''}
                </p>
                <p className="sermon-description" style={{ whiteSpace: 'pre-line' }}>{featured.description}</p>
                {featured.scripture && <p className="sermon-verse"><strong>Key Scripture:</strong> {featured.scripture}</p>}
                <div className="sermon-actions">
                  {featured.youtube_id && (
                    <a href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <i className="fab fa-youtube"></i> Watch on YouTube
                    </a>
                  )}
                  {featured.file_path && isAudio(featured.file_path) && (
                    <a href={featured.url} download className="btn btn-outline"><i className="fas fa-download"></i> Download Audio</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : sermons !== null && (
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="container">
            <i className="fas fa-microphone-slash fa-3x" style={{ color: '#a0aec0', marginBottom: '1rem' }}></i>
            <h2>Sermons Coming Soon</h2>
            <p>Check back soon or subscribe to our YouTube channel for the latest messages.</p>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="recent-sermons">
          <div className="container">
            <h2>More Messages</h2>
            <div className="sermons-grid">
              {rest.map(s => (
                <div key={s.id} className="sermon-card">
                  <div className="sermon-thumbnail">
                    <img src="/gvim-logo-128.jpg" alt="GVIM" className="sermon-thumbnail-logo" loading="lazy" />
                    <div className="sermon-play-overlay"><i className="fas fa-play-circle fa-3x"></i></div>
                  </div>
                  <div className="sermon-info">
                    <h3>{s.title}</h3>
                    <p className="sermon-date"><i className="fas fa-calendar"></i> {s.sermon_date || ''}</p>
                    <p className="sermon-speaker"><i className="fas fa-user"></i> {s.speaker || 'Rev. Godwin BB. Olutimi'}</p>
                    <p className="sermon-excerpt">{(s.description || '').slice(0, 120)}...</p>
                    <div className="sermon-links">
                      {s.youtube_id ? (
                        <a href={`https://www.youtube.com/watch?v=${s.youtube_id}`} target="_blank" rel="noopener noreferrer" className="watch-link">
                          <i className="fas fa-play"></i> Watch
                        </a>
                      ) : s.file_path && (
                        <a href={s.url} className="watch-link"><i className="fas fa-play"></i> Play</a>
                      )}
                      {s.file_path && isAudio(s.file_path) && (
                        <a href={s.url} download className="audio-link"><i className="fas fa-download"></i> Audio</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sermon-subscribe">
        <div className="container">
          <div className="subscribe-content">
            <h2>Stay Connected</h2>
            <p>Subscribe to our YouTube channel, follow us on Facebook, and join our live Bible study sessions.</p>
            <div className="subscribe-links">
              <a href="https://www.youtube.com/@godsvesselsinternationalmi4365" target="_blank" rel="noopener noreferrer" className="subscribe-btn youtube"><i className="fab fa-youtube"></i> Subscribe on YouTube</a>
              <a href="https://web.facebook.com/GVIMM" target="_blank" rel="noopener noreferrer" className="subscribe-btn facebook"><i className="fab fa-facebook"></i> Follow on Facebook</a>
              <a href="https://us02web.zoom.us/j/5723669101?pwd=QzY3R2lKYXNpQy81QTdwaEJQUEZDUT09" target="_blank" rel="noopener noreferrer" className="subscribe-btn zoom"><i className="fas fa-video"></i> Join Us Live</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
