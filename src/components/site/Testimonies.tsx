import { useState } from 'react';
import { testimonies } from '../../data/team';

const PAGE = 3;

/* Three at a time, advanced by the reader. No autoplay: a quote that moves
   while someone is reading it is a bug, not a feature. */
export default function Testimonies() {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(testimonies.length / PAGE);
  const shown = testimonies.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="p-quotes">
      <ul className="p-quotes__grid">
        {shown.map(t => (
          <li key={t.name} className="p-quotes__item">
            <blockquote>
              <p>{t.quote}</p>
            </blockquote>
            <p className="p-quotes__by">
              <span className="p-quotes__name">{t.name}</span>
              <span className="p-quotes__role">{t.role}</span>
            </p>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="p-quotes__nav">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={'p-quotes__dot' + (i === page ? ' is-on' : '')}
              aria-current={i === page}
              onClick={() => setPage(i)}
            >
              <span className="p-sr">Show testimonies {i * PAGE + 1} to {Math.min((i + 1) * PAGE, testimonies.length)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
