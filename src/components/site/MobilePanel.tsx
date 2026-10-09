import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { SITE, giving } from '../../data/site';
import { weekly, timezoneNote } from '../../data/serviceTimes';
import type { NavItem } from './navItems';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MobilePanel({
  open, onClose, items, id
}: { open: boolean; onClose: () => void; items: NavItem[]; id: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Scroll lock. Restores the exact previous value rather than clearing it, so
     the admin's own overflow handling is never trampled. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Focus management: move focus in on open, trap it while open, and return it
     to whatever opened the panel on close. */
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes);
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`p-scrim${open ? ' is-open' : ''}`}
        onClick={onClose}
        hidden={!open}
        aria-hidden="true"
      />
      <div
        id={id}
        ref={panelRef}
        className={`p-panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
      >
        <div className="p-panel__top">
          <span className="p-panel__title">Menu</span>
          <button type="button" className="p-panel__close" onClick={onClose} aria-label="Close menu">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <nav aria-label="Site">
          <ul className="p-panel__links">
            {items.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => 'p-panel__link' + (isActive ? ' is-active' : '')}
                  onClick={onClose}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-panel__cta">
          <GiveButton className="p-btn p-btn--primary" onNavigate={onClose} />
        </div>

        <div className="p-panel__foot">
          <h2 className="p-panel__footTitle">Service times</h2>
          <ul className="p-panel__times">
            {weekly.map((s, i) => (
              <li key={i}><span>{s.when} · {s.what}</span><span>{s.time}</span></li>
            ))}
          </ul>
          <p className="p-panel__note">{timezoneNote}</p>
          <a className="p-panel__contact p-break" href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a>
          <a className="p-panel__contact p-break" href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
      </div>
    </>
  );
}

/* Shared so the desktop bar and the panel cannot drift apart. When no giving URL
   is configured the control degrades to the e-transfer mailto rather than
   linking nowhere. */
export function GiveButton({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  const href = giving.onlineUrl
    ? giving.onlineUrl
    : `mailto:${giving.eTransferEmail}?subject=${encodeURIComponent('Giving to GVIM')}`;
  const external = Boolean(giving.onlineUrl);
  return (
    <a
      className={className}
      href={href}
      onClick={onNavigate}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      Give
    </a>
  );
}
