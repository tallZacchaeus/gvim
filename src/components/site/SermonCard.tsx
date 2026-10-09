import type { SermonRecord } from '../../data/sermonsSchema';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SermonCard({ sermon }: { sermon: SermonRecord }) {
  const href = sermon.youtubeId ? `https://www.youtube.com/watch?v=${sermon.youtubeId}` : null;
  return (
    <li className="p-sermon">
      <div className="p-sermon__thumb">
        {sermon.youtubeId ? (
          <img
            src={`https://i.ytimg.com/vi/${sermon.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy" decoding="async" width={480} height={360}
          />
        ) : (
          <div className="p-sermon__noThumb" aria-hidden="true">
            <i className="fas fa-microphone-lines"></i>
          </div>
        )}
      </div>
      <div className="p-sermon__body">
        {sermon.series && <p className="p-sermon__series">{sermon.series}</p>}
        <h3 className="p-sermon__title">
          {href
            ? <a href={href} target="_blank" rel="noopener noreferrer">{sermon.title}</a>
            : sermon.title}
        </h3>
        <p className="p-sermon__meta">
          <span>{sermon.speaker}</span>
          {sermon.date && <><span aria-hidden="true">·</span><span>{formatDate(sermon.date)}</span></>}
        </p>
        {sermon.scripture && <p className="p-sermon__ref">{sermon.scripture}</p>}
        {sermon.description && <p className="p-sermon__desc">{sermon.description}</p>}
      </div>
    </li>
  );
}
