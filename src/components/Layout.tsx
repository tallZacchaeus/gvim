import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './site/Navbar';
import Footer from './site/Footer';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  /* .site scopes the public design tokens. The admin lives outside this tree
     and keeps drawing its tokens from style.css. */
  return (
    <div className="site">
      <a className="p-skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
