import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import SafeBoundary from './components/SafeBoundary';
import './styles/style.css';
import './styles/public.css';
import './styles/admin.css';
import './styles/tailwind.css';

/**
 * Vercel Web Analytics — page views only.
 *
 * Cookieless: visitors are identified by a hash of the request, no IP or personal
 * identifier is stored, and the session hash is discarded after 24 hours. No
 * consent banner is required.
 *
 * Admin routes are dropped before sending. They are staff traffic, not visitor
 * behaviour, so counting them would skew the numbers and consume part of the
 * Hobby allowance (50,000 events/month) for no insight.
 *
 * Custom events (track()) are a Pro feature and are deliberately not used — on
 * Hobby they would silently do nothing.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <SafeBoundary>
        <Analytics beforeSend={event => (event.url.includes('/admin') ? null : event)} />
      </SafeBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
