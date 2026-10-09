import { useEffect, useMemo, useState } from 'react';
import { api, SITE } from '../lib/api';
import type { SermonRecord } from '../data/sermonsSchema';
import { seedSermons } from '../data/sermonsSchema';
import PageHeader from '../components/site/PageHeader';
import SermonCard from '../components/site/SermonCard';

/* The API is the primary source. sermons.json seeds the page so it is not empty
   before anything has been uploaded. */
function fromApi(rows: Awaited<ReturnType<typeof api.sermons.list>>): SermonRecord[] {
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    speaker: r.speaker,
    date: r.sermon_date ?? '',
    scripture: r.scripture || undefined,
    youtubeId: r.youtube_id || undefined,
    description: r.description || undefined
  }));
}

export default function Sermons() {
  const [sermons, setSermons] = useState<SermonRecord[]>(seedSermons);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [speaker, setSpeaker] = useState('all');
  const [series, setSeries] = useState('all');

  useEffect(() => {
    let live = true;
    api.sermons.list()
      .then(rows => {
        if (!live) return;
        const mapped = fromApi(rows);
        if (mapped.length > 0) setSermons(mapped);
        setStatus('ready');
      })
      .catch(() => { if (live) setStatus('ready'); });
    return () => { live = false; };
  }, []);

  /* Filters are derived from the data, so the bar can never offer a speaker or
     series with nothing behind it. */
  const speakers = useMemo(
    () => [...new Set(sermons.map(s => s.speaker).filter(Boolean))].sort(),
    [sermons]
  );
  const allSeries = useMemo(
    () => [...new Set(sermons.map(s => s.series).filter((s): s is string => Boolean(s)))].sort(),
    [sermons]
  );

  const visible = sermons.filter(s =>
    (speaker === 'all' || s.speaker === speaker) &&
    (series === 'all' || s.series === series)
  );

  const featured = visible.find(s => s.youtubeId) ?? null;
  const rest = featured ? visible.filter(s => s.id !== featured.id) : visible;

  return (
    <>
      <PageHeader
        crumb="Sermons"
        title="Sermons & messages"
        lede="Teaching from God&rsquo;s Vessels International Ministry. New messages are posted to YouTube."
      />

      <section className="p-section">
        <div className="p-container">
          {featured && (
            <div className="p-featured">
              <div className="p-featured__video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${featured.youtubeId}`}
                  title={featured.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-featured__meta">
                <p className="p-featured__kicker">Latest message</p>
                <h2>{featured.title}</h2>
                <p className="p-sermon__meta"><span>{featured.speaker}</span></p>
                {featured.scripture && <p className="p-sermon__ref">{featured.scripture}</p>}
                {featured.description && <p>{featured.description}</p>}
              </div>
            </div>
          )}

          {(speakers.length > 1 || allSeries.length > 0) && (
            <div className="p-filters" role="group" aria-label="Filter sermons">
              {allSeries.length > 0 && (
                <label className="p-select">
                  <span className="p-select__label">Series</span>
                  <select value={series} onChange={e => setSeries(e.target.value)}>
                    <option value="all">All series</option>
                    {allSeries.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
              {speakers.length > 1 && (
                <label className="p-select">
                  <span className="p-select__label">Speaker</span>
                  <select value={speaker} onChange={e => setSpeaker(e.target.value)}>
                    <option value="all">All speakers</option>
                    {speakers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          {rest.length > 0 && (
            <ul className="p-sermons">
              {rest.map(s => <SermonCard key={s.id} sermon={s} />)}
            </ul>
          )}

          {/* An empty state that reads as deliberate, with somewhere to go. */}
          {status === 'ready' && visible.length === 0 && (
            <div className="p-noSermons">
              <h2>Messages are published on YouTube</h2>
              <p>
                Recordings are not listed here yet. In the meantime every message is on
                our YouTube channel, and you are welcome to join us in person.
              </p>
              <div className="p-btn-row">
                <a className="p-btn p-btn--primary" href={SITE.youtube} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="p-section p-section--navy">
        <div className="p-container p-follow">
          <div>
            <h2>Never miss a message</h2>
            <p className="p-visit__lede">
              Subscribe on YouTube for every service, or follow along on Facebook.
            </p>
          </div>
          <div className="p-btn-row">
            <a className="p-btn p-btn--outline" href={SITE.youtube} target="_blank" rel="noopener noreferrer">
              Subscribe on YouTube
            </a>
            <a className="p-btn p-btn--outline" href={SITE.facebook} target="_blank" rel="noopener noreferrer">
              Follow on Facebook
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
