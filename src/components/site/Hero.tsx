import { Link } from 'react-router-dom';
import { hero } from '../../data/gallery';
import { locationLabel } from '../../data/site';
import { GiveButton } from './MobilePanel';

export default function Hero() {
  return (
    <section className="p-hero">
      {/* The photograph is content, not decoration, so it is a real <img> with a
          described alt — not a CSS background. fetchPriority high because this
          is the LCP element. */}
      <img
        className="p-hero__img"
        src={hero.src}
        srcSet={hero.srcSet}
        sizes={hero.sizes}
        width={hero.width}
        height={hero.height}
        alt={hero.alt}
        fetchPriority="high"
        decoding="async"
      />
      {/* Flat solid overlay — not a gradient. */}
      <div className="p-hero__veil" aria-hidden="true" />

      <div className="p-container p-hero__inner p-on-dark">
        <p className="p-hero__label">{locationLabel}</p>
        <h1 className="p-hero__title">A family church standing for the truth</h1>
        <p className="p-hero__lede">
          Equipping every believer to walk confidently in their divine purpose, through
          worship, teaching and service in Edmonton and beyond.
        </p>
        <div className="p-btn-row">
          <Link to="/contact" className="p-btn p-btn--primary p-hero__cta">Plan your visit</Link>
          <GiveButton className="p-btn p-btn--outline" />
        </div>
      </div>
    </section>
  );
}
