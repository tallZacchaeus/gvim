import { useEffect, useState } from 'react';
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

const services = [
  { icon: 'fa-sun', h3: 'Sunday Morning', p: 'First Service', time: '10:00 AM MDT' },
  { icon: 'fa-sunset', h3: 'Sunday Afternoon', p: 'Second Service', time: '2:00 PM MDT' },
  { icon: 'fa-book-open', h3: 'Tuesday', p: 'Bible Study', time: '6:00 PM MDT' },
  { icon: 'fa-hands-praying', h3: '1st of the Month', p: 'Healing Hour', time: '6:00 AM MDT' },
  { icon: 'fa-heart', h3: 'Third Sunday', p: '"Just as it was" — Family Service', time: '2:00 PM MDT', special: true },
  { icon: 'fa-heart', h3: 'Fourth Sunday', p: 'Prayer Meeting', time: '2:00 PM MDT', special: true },
  { icon: 'fa-users', h3: 'Fifth Sunday', p: 'Youth Service', time: '2:00 PM MDT', special: true }
];

export default function Home() {
  const [featured, setFeatured] = useState<GalleryItem[]>([]);
  useEffect(() => { api.gallery.list(undefined, 6).then(setFeatured).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to God's Vessels International Ministry</h1>
          <p>Where faith meets community and hearts are transformed</p>
          <div className="hero-buttons">
            <Link to="/about" className="btn btn-primary">Learn More</Link>
            <a href="mailto:godvesselsinternational@gmail.com?subject=Donation&body=I would like to make a donation to GVIM." className="btn btn-secondary">
              <i className="fas fa-heart"></i> Donate
            </a>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      <section className="service-times">
        <div className="container">
          <h2>Service Times</h2>
          <div className="times-grid">
            {services.map((s, i) => (
              <div key={i} className={`time-card${s.special ? ' special-service' : ''}`}>
                <i className={`fas ${s.icon} fa-2x`}></i>
                <h3>{s.h3}</h3>
                <p>{s.p}</p>
                <span className="time">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="monthly-theme">
        <div className="container">
          <div className="theme-content">
            <div className="theme-text">
              <h2>This Month's Theme</h2>
              <h3>"Walking in Divine Purpose"</h3>
              <p>Join us this month as we explore God's divine purpose for our lives. Through prayer, study, and fellowship, we'll discover how to align our hearts with His will and walk confidently in the path He has prepared for us.</p>
              <blockquote>
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."
                <cite>— Jeremiah 29:11</cite>
              </blockquote>
            </div>
            <div className="theme-image"><i className="fas fa-cross fa-8x"></i></div>
          </div>
        </div>
      </section>

      <section className="welcome">
        <div className="container">
          <div className="welcome-grid">
            <div className="welcome-text">
              <h2>Welcome to Our Family Church</h2>
              <p>At God's Vessels International Ministry, we believe that every person is a vessel chosen by God for His glory. Our mission is to equip believers to fulfill their divine calling through worship, fellowship, and service.</p>
              <p>Whether you're seeking spiritual growth, community connection, or answers to life's questions, you'll find a warm welcome here. Join us as we journey together in faith, hope, and love.</p>
              <Link to="/about" className="btn btn-outline">Discover Our Story</Link>
            </div>
            <div className="welcome-features">
              <div className="feature"><i className="fas fa-bible fa-lg"></i><div><h4>Biblical Teaching</h4><p>Sound doctrine grounded in God's Word</p></div></div>
              <div className="feature"><i className="fas fa-hands-helping fa-lg"></i><div><h4>Community Service</h4><p>Serving our community with love and compassion</p></div></div>
              <div className="feature"><i className="fas fa-heart fa-lg"></i><div><h4>Worship & Fellowship</h4><p>Authentic worship and meaningful connections</p></div></div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mini-gallery">
          <div className="container">
            <h2>Our Ministry in Action</h2>
            <p>Capturing moments of faith, fellowship, and community service</p>
            <div className="mini-gallery-grid">
              {featured.map(item => (
                <div key={item.id} className="mini-gallery-item">
                  {item.type === 'video'
                    ? <video src={item.url} muted preload="metadata" className="gallery-thumb-video"></video>
                    : <img src={item.url} alt={item.title} loading="lazy" width={400} height={300} />}
                  <div className="mini-overlay"><h4>{item.title}</h4></div>
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
          <h2>Lives Transformed</h2>
          <p>Hear from our church family about God's work in their lives</p>
          <div className="testimonials-grid">
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
                    <h4>{t.name}</h4>
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
