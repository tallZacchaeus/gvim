import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../components/site/navItems';

/**
 * Public 404.
 *
 * Rendered inside Layout, so the header and footer come with it — a dead end
 * that still shows the way out is not a dead end. Every page should answer
 * where you are, where you can go, and how to leave.
 */
export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <section className="p-section">
      <div className="p-container p-prose">
        <p className="p-404__code">Error 404</p>
        <h1>We couldn&rsquo;t find that page</h1>
        <p>
          There is nothing at <code className="p-404__path">{pathname}</code>. The link may
          be out of date, or the address may have been mistyped.
        </p>
        <nav aria-label="Main sections" className="p-404__links">
          <ul>
            {navItems.map(item => (
              <li key={item.to}><Link to={item.to} className="p-link">{item.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="p-btn-row p-404__cta">
          <Link to="/" className="p-btn p-btn--primary">Back to home</Link>
          <Link to="/contact" className="p-btn p-btn--outline">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
