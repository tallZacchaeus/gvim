import { Link } from 'react-router-dom';
import { SITE } from '../lib/api';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h2>God's Vessels International Ministry</h2>
            <p>Transforming lives through the power of God's love</p>
            <div className="social-links">
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href={SITE.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter/X"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/sermons">Sermons</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Service Times</h3>
            <ul>
              <li>Sunday: 10:00 AM & 2:00 PM MDT</li>
              <li>Tuesday: 6:00 PM MDT (Bible Study)</li>
              <li>1st of Month: 6:00 AM MDT (Healing Hour)</li>
              <li>3rd Sunday: 2:00 PM MDT (Family Service)</li>
              <li>4th Sunday: 2:00 PM MDT (Prayer Meeting)</li>
              <li>5th Sunday: 2:00 PM MDT (Youth Service)</li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact Info</h3>
            <ul>
              <li><i className="fas fa-map-marker-alt"></i> 4511, 36 Ave NW, Edmonton, T6L 3R9</li>
              <li><i className="fas fa-phone"></i> <a href="tel:+18252027450">{SITE.phone}</a></li>
              <li><i className="fas fa-envelope"></i> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} God's Vessels International Ministry. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
