import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-container">
          <div className="nav-logo">
            <NavLink to="/">
              <img src="/gvim-logo-128.jpg" alt="GVIM Logo" className="header-logo" width={60} height={60} />
            </NavLink>
          </div>
          <ul className={`nav-menu${open ? ' active' : ''}`} id="nav-menu">
            <li className="nav-item"><NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Home</NavLink></li>
            <li className="nav-item"><NavLink to="/about" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>About</NavLink></li>
            <li className="nav-item"><NavLink to="/gallery" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Gallery</NavLink></li>
            <li className="nav-item"><NavLink to="/sermons" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Sermons</NavLink></li>
            <li className="nav-item"><NavLink to="/contact" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Contact</NavLink></li>
          </ul>
          <button
            className={`nav-toggle${open ? ' active' : ''}`}
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen(v => !v)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </nav>
    </header>
  );
}
