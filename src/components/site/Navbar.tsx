import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SITE } from '../../data/site';
import { summary } from '../../data/serviceTimes';
import { navItems } from './navItems';
import MobilePanel, { GiveButton } from './MobilePanel';

const PANEL_ID = 'site-menu';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`p-header${stuck ? ' is-stuck' : ''}`}>
      {/* Utility bar: hidden below 900px, where the same facts live at the
          bottom of the mobile panel instead. */}
      <div className="p-utility">
        <div className="p-container p-utility__inner">
          <p className="p-utility__times">{summary}</p>
          <p className="p-utility__contact">
            <a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
      </div>

      <div className="p-nav">
        <div className="p-container p-nav__inner">
          <NavLink to="/" className="p-brand" aria-label={`${SITE.name} — home`}>
            <img src="/gvim-logo-128.jpg" alt="" width={44} height={44} className="p-brand__mark" />
            <span className="p-brand__name">
              <span className="p-brand__line1">God&rsquo;s Vessels</span>
              <span className="p-brand__line2">International Ministry</span>
            </span>
          </NavLink>

          <nav className="p-nav__links" aria-label="Main">
            <ul>
              {navItems.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => 'p-nav__link' + (isActive ? ' is-active' : '')}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-nav__actions">
            <GiveButton className="p-btn p-btn--primary p-nav__give" />
            <button
              type="button"
              className="p-nav__toggle"
              aria-expanded={open}
              aria-controls={PANEL_ID}
              onClick={() => setOpen(true)}
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
              <span className="p-sr">Open menu</span>
            </button>
          </div>
        </div>
      </div>

      <MobilePanel id={PANEL_ID} open={open} onClose={() => setOpen(false)} items={navItems} />
    </header>
  );
}
