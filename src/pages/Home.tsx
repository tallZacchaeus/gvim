import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, GalleryItem } from '../lib/api';
import { pickFeatured } from '../data/gallery';
import Hero from '../components/site/Hero';
import InfoStrip from '../components/site/InfoStrip';
import ServiceTimes from '../components/site/ServiceTimes';
import PhotoGrid from '../components/site/PhotoGrid';
import Testimonies from '../components/site/Testimonies';
import GiveBand from '../components/site/GiveBand';

/* Three pillars, stated plainly. No icon circles. */
const pillars = [
  { title: 'Biblical teaching', body: 'Sound doctrine, taught from the text and applied to ordinary life.' },
  { title: 'Community service', body: 'School supplies, Christmas hampers and outreach, here and abroad.' },
  { title: 'Worship & fellowship', body: 'Services twice each Sunday, and a church family that knows your name.' }
];

export default function Home() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    let live = true;
    /* No limit: the six curated photos are matched by filename, and a capped
       request can simply not contain them. */
    api.gallery.list()
      .then(r => { if (live) setItems(r); })
      .catch(() => { /* the section simply does not render */ });
    return () => { live = false; };
  }, []);

  const featured = pickFeatured(items, 6);
  const welcomePhoto = featured[0];

  return (
    <>
      <Hero />
      <InfoStrip />

      {/* 2 — Welcome */}
      <section className="p-section p-section--surface">
        <div className="p-container">
          <div className="p-welcome">
            <div className="p-prose">
              <h2>Who we are</h2>
              <p>
                At God&rsquo;s Vessels International Ministry we believe every person is a
                vessel chosen by God for His glory. We are a family church in Edmonton,
                equipping believers to fulfil their calling through worship, fellowship
                and service.
              </p>
              <p>
                Whether you are seeking spiritual growth, community, or answers to life&rsquo;s
                questions, you will find a warm welcome here.
              </p>
              <p><Link to="/about" className="p-link">Learn more about us</Link></p>
            </div>
            {welcomePhoto && (
              <figure className="p-welcome__photo">
                <img
                  src={welcomePhoto.url}
                  alt="Members of God&rsquo;s Vessels International Ministry at a community outreach"
                  loading="lazy" decoding="async" width={800} height={600}
                />
              </figure>
            )}
          </div>

          <ul className="p-pillars">
            {pillars.map(p => (
              <li key={p.title} className="p-pillars__item">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 — Service times */}
      <section className="p-section">
        <div className="p-container">
          <div className="p-head">
            <h2>Service times</h2>
            <p>Join us in person through the week as we worship, study and pray together.</p>
          </div>
          <ServiceTimes />
        </div>
      </section>

      {/* 4 — Ministry in action */}
      {featured.length > 0 && (
        <section className="p-section p-section--surface">
          <div className="p-container">
            <div className="p-head">
              <h2>Our ministry in action</h2>
              <p>Outreach, fellowship and service — photographed as it happened.</p>
            </div>
            <PhotoGrid items={featured} />
          </div>
        </section>
      )}

      {/* 5 — Give */}
      <GiveBand />

      {/* 6 — Testimonies */}
      <section className="p-section">
        <div className="p-container">
          <div className="p-head">
            <h2>From our church family</h2>
          </div>
          <Testimonies />
        </div>
      </section>
    </>
  );
}
