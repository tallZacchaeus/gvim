import { useEffect, useRef, useState } from 'react';
import { useReveal } from '../lib/motion';
import { Link } from 'react-router-dom';
import { api, GalleryItem } from '../lib/api';

const testimonials = [
  { name: 'Hammed Boluwatife Victoria', role: 'Church Member', text: 'God has been faithful to me in all ways. God gave me a job last two months. Halleluyah!' },
  { name: 'Jeremiah Victor', role: 'Member', text: "God's Vessel International Ministry is literally a family for me. I love especially how genuine love of God runs this family and how we share and learn undiluted truth of God's Word. May God keep blessing and increasing the Ministry. God bless you real good." },
  { name: 'Enyi Lawrence O.', role: 'Leader', text: "GVIM is a gathering where Jesus is taught and learnt in full righteousness and experience. I'm really blessed to be part of this family." },
  { name: 'Adetutu Akorede Olutimi', role: 'Leader', text: 'GVIM has been a blessing in all ways — spiritual food, physical and financial blessings. GVIM is a game changer for every child of God.' },
  { name: 'Ajibike Christianah Obayomi', role: 'Member', text: 'A space where the word of God is taught with clarity. My stay in GVIM has given me more insights and understanding. Glory to God!' },
  { name: 'Oladimeji Shina', role: 'Leader', text: 'Being a member of the GVIM family has uplifted my spiritual life. The teachings and prayers have kept my faith alive in Christ Jesus.' }
];

/* A congregation reads this as a timetable, not as seven feature cards. Grouping
   weekly from monthly is the distinction that actually matters to a visitor. */
const weekly = [
  { when: 'Sunday',  what: 'First Service',  time: '10:00 AM' },
  { when: 'Sunday',  what: 'Second Service', time: '2:00 PM' },
  { when: 'Tuesday', what: 'Bible Study',    time: '6:00 PM' }
];

const monthly = [
  { when: '1st of the month', what: 'Healing Hour',                        time: '6:00 AM' },
  { when: 'Third Sunday',     what: '"Just as it was" — Family Service',   time: '2:00 PM' },
  { when: 'Fourth Sunday',    what: 'Prayer Meeting',                      time: '2:00 PM' },
  { when: 'Fifth Sunday',     what: 'Youth Service',                       time: '2:00 PM' }
];

export default function Home() {
  /* Scroll choreography. Every reveal animates an element from an offset TO its
     natural state, so content is readable even if GSAP never loads. The hero
     mosaic is deliberately NOT animated on load — it contains the LCP image and
     delaying it would trade a real metric for decoration. */
  const scheduleRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useReveal(scheduleRef, { children: '.schedule-col', y: 28 });
  useReveal(themeRef, { y: 24 });
  useReveal(welcomeRef, { children: '.feature', y: 20, stagger: 0.09 });
  useReveal(galleryRef, { children: '.mini-gallery-item', y: 22, stagger: 0.06 });
  useReveal(testimonialsRef, { children: '.testimonial-card', y: 24, stagger: 0.07 });

  const [featured, setFeatured] = useState<GalleryItem[]>([]);
  useEffect(() => { api.gallery.list(undefined, 6).then(setFeatured).catch(() => {}); }, []);

  // The hero mosaic needs four images. Prefer real photos; if the API is slow or
  // empty the grid simply collapses rather than showing broken frames.
  const mosaic = featured.filter(i => i.type === 'image').slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="eyebrow"><i className="fas fa-dove"></i> Vessels of Truth · Edmonton, Canada</span>
            <h1>Where faith meets community and hearts are <span className="accent">transformed</span></h1>
            <p>
              A family church standing for the truth — equipping every believer to walk
              confidently in their divine purpose.
            </p>
            <div className="hero-buttons">
              <Link to="/about" className="btn btn-primary">Discover GVIM</Link>
              <a href="mailto:godvesselsinternational@gmail.com?subject=Donation&body=I would like to make a donation to GVIM." className="btn btn-secondary">
                <i className="fas fa-heart"></i> Give a Gift
              </a>
            </div>
            <dl className="hero-meta">
              <div><dt>Sunday Worship</dt><dd>10:00 AM &amp; 2:00 PM</dd></div>
              <div><dt>Bible Study</dt><dd>Tuesdays, 6:00 PM</dd></div>
              <div><dt>Where</dt><dd>4511 36 Ave NW, Edmonton</dd></div>
            </dl>
          </div>
          {mosaic.length === 4 && (
            <div className="hero-mosaic" aria-hidden="true">
              {mosaic.map(item => (
                <figure key={item.id}>
                  <img src={item.url} alt="" loading="eager" decoding="async" />
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="service-times">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Gather With Us</span>
            <h2>Service Times</h2>
            <p className="lede">Join us in person throughout the week as we worship, study and pray together. All times Mountain (MDT).</p>
          </div>
          <div className="schedule" ref={scheduleRef}>
            <div className="schedule-col">
              <h3 className="schedule-title">Every Week</h3>
              <ul className="schedule-list">
                {weekly.map((s, i) => (
                  <li key={i}>
                    <span className="schedule-when">{s.when}</span>
                    <span className="schedule-what">{s.what}</span>
                    <span className="schedule-time">{s.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="schedule-col">
              <h3 className="schedule-title">Through the Month</h3>
              <ul className="schedule-list">
                {monthly.map((s, i) => (
                  <li key={i}>
                    <span className="schedule-when">{s.when}</span>
                    <span className="schedule-what">{s.what}</span>
                    <span className="schedule-time">{s.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="monthly-theme">
        <div className="container">
          <div className="theme-content" ref={themeRef}>
            <div className="theme-text">
              <span className="eyebrow">This Month at GVIM</span>
              <h2>Walking in Divine Purpose</h2>
              <p>Join us this month as we explore God's divine purpose for our lives. Through prayer, study, and fellowship, we'll discover how to align our hearts with His will and walk confidently in the path He has prepared for us.</p>
              <blockquote>
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."
                <cite>— Jeremiah 29:11</cite>
              </blockquote>
            </div>
            {/* A real photograph rather than an oversized icon placeholder. */}
            {mosaic[1] && (
              <figure className="theme-image">
                <img src={mosaic[1].url} alt="" loading="lazy" decoding="async" />
              </figure>
            )}
          </div>
        </div>
      </section>

      <section className="welcome">
        <div className="container">
          <div className="welcome-grid">
            <div className="welcome-text">
              <span className="eyebrow">Who We Are</span>
              <h2>A family church standing for the truth</h2>
              <p>At God's Vessels International Ministry, we believe that every person is a vessel chosen by God for His glory. Our mission is to equip believers to fulfill their divine calling through worship, fellowship, and service.</p>
              <p>Whether you're seeking spiritual growth, community connection, or answers to life's questions, you'll find a warm welcome here. Join us as we journey together in faith, hope, and love.</p>
              <Link to="/about" className="btn btn-outline">Discover Our Story</Link>
            </div>
            <div className="welcome-features" ref={welcomeRef}>
              <div className="feature"><i className="fas fa-bible fa-lg"></i><div><h3>Biblical Teaching</h3><p>Sound doctrine grounded in God's Word</p></div></div>
              <div className="feature"><i className="fas fa-hands-helping fa-lg"></i><div><h3>Community Service</h3><p>Serving our community with love and compassion</p></div></div>
              <div className="feature"><i className="fas fa-heart fa-lg"></i><div><h3>Worship & Fellowship</h3><p>Authentic worship and meaningful connections</p></div></div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mini-gallery">
          <div className="container">
            <h2>Our Ministry in Action</h2>
            <p>Capturing moments of faith, fellowship, and community service</p>
            <div className="mini-gallery-grid" ref={galleryRef}>
              {featured.map(item => (
                <div key={item.id} className="mini-gallery-item">
                  {item.type === 'video'
                    ? <video src={item.url} muted preload="metadata" className="gallery-thumb-video"></video>
                    : <img src={item.url} alt={item.title} loading="lazy" width={400} height={300} />}
                  <div className="mini-overlay"><h3>{item.title}</h3></div>
                </div>
              ))}
            </div>
            <div className="text-center" style={{ marginTop: '2rem' }}>
              <Link to="/gallery" className="btn btn-primary">View Full Gallery</Link>
            </div>
          </div>
        </section>
      )}

      <section className="testimonials">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Testimonies</span>
            <h2>Lives Transformed</h2>
            <p className="lede">Hear from our church family about God's work in their lives</p>
          </div>
          <div className="testimonials-grid" ref={testimonialsRef}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-content"><p>{t.text}</p></div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'hsl(213 94% 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(213 94% 40%)', fontWeight: 700 }}>
                      {t.name.charAt(0)}
                    </div>
                  </div>
                  <div className="author-info">
                    <h3>{t.name}</h3>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
