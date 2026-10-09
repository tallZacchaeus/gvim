import { Link } from 'react-router-dom';
import { SITE, address, addressOneLine, socials, legalLine } from '../../data/site';
import { weekly, timezoneNote } from '../../data/serviceTimes';
import { navItems } from './navItems';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="p-footer">
      <div className="p-container p-footer__grid">
        <div className="p-footer__col p-footer__col--about">
          <h2 className="p-footer__brand">God&rsquo;s Vessels<br />International Ministry</h2>
          <p className="p-footer__blurb">
            A family church in Edmonton, Alberta, standing for the truth and equipping
            believers to walk in their divine purpose.
          </p>
          <ul className="p-footer__social">
            {socials.map(s => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <i className={s.icon} aria-hidden="true"></i>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="p-footer__col" aria-label="Quick links">
          <h2 className="p-footer__title">Quick links</h2>
          <ul className="p-footer__list">
            {navItems.map(i => (
              <li key={i.to}><Link to={i.to}>{i.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="p-footer__col">
          <h2 className="p-footer__title">Service times</h2>
          <ul className="p-footer__list p-footer__times">
            {weekly.map((s, i) => (
              <li key={i}>
                <span>{s.when} · {s.what}</span>
                <span className="p-footer__time">{s.time}</span>
              </li>
            ))}
          </ul>
          <p className="p-footer__note">{timezoneNote}</p>
        </div>

        <address className="p-footer__col p-footer__contact">
          <h2 className="p-footer__title">Contact</h2>
          <p className="p-break">{address.street}<br />{address.city}, {address.region} {address.postal}</p>
          <p><a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a></p>
          {/* p-break: this address overflows a narrow column without it. */}
          <p><a className="p-break" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
          <p className="p-sr">{addressOneLine}</p>
        </address>
      </div>

      <div className="p-container p-footer__bar">
        <p>&copy; {year} {SITE.name}. All rights reserved.</p>
        <p>{legalLine}</p>
      </div>
    </footer>
  );
}
