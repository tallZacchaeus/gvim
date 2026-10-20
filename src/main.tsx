import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import SafeBoundary from './components/SafeBoundary';
import './styles/style.css';
import './styles/public.css';
import './styles/admin.css';
import './styles/admin-mobile.css';
import './styles/admin-type.css';
import './styles/tailwind.css';

/* Vercel Web Analytics was removed with the move off Vercel: the component
   reports to Vercel's collector and does nothing when the site is served from
   anywhere else, so keeping it would have shipped dead weight and left the
   impression that page views were still being counted.

   Nothing replaces it yet. A self-hosted counter (GoAccess over the nginx
   access log, or Plausible/Umami on the same box) is the obvious successor
   and needs no third-party request from the visitor's browser. */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* App-level boundary. Self-hosted there is no platform error page to
          fall back on, so an uncaught render error would otherwise leave a
          blank document. */}
      <SafeBoundary>
        <App />
      </SafeBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
