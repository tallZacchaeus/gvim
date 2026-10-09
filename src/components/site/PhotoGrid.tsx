import { Link } from 'react-router-dom';
import type { GalleryItem } from '../../lib/api';
import { captionFor } from '../../data/gallery';

export default function PhotoGrid({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <ul className="p-photos">
        {items.map(item => {
          const caption = captionFor(item);
          return (
            <li key={item.id} className="p-photos__item">
              <figure>
                <img
                  src={item.url}
                  alt={caption ?? ''}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                />
                {caption && <figcaption>{caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>
      <p className="p-photos__more">
        <Link to="/gallery" className="p-link">View full gallery</Link>
      </p>
    </>
  );
}
