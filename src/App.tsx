import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Sermons from './pages/Sermons';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';

/**
 * Admin routes are code-split.
 *
 * They were statically imported, so every public visitor downloaded the entire
 * admin UI — eight pages they can never reach — before the homepage could
 * render. That was already wasteful; once the admin gains TanStack Table,
 * react-hook-form, zod and Radix it would be indefensible.
 *
 * Public pages stay eagerly imported: they ARE the first paint, and splitting
 * them would add a network round trip to the thing visitors came for.
 */
/* ProtectedRoute is lazy too, not just the pages. It imports
   AdminFeedbackProvider, which imports sonner and Radix AlertDialog — so a
   static import put the admin's toast and dialog libraries into the public
   entry, costing every visitor ~35 kB of code they can never reach and
   defeating the point of splitting the pages. */
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

const Login         = lazy(() => import('./pages/admin/Login'));
const Dashboard     = lazy(() => import('./pages/admin/Dashboard'));
const GalleryUpload = lazy(() => import('./pages/admin/GalleryUpload'));
const GalleryManage = lazy(() => import('./pages/admin/GalleryManage'));
const SermonAdd     = lazy(() => import('./pages/admin/SermonAdd'));
const SermonManage  = lazy(() => import('./pages/admin/SermonManage'));
const Categories    = lazy(() => import('./pages/admin/Categories'));
const Contacts      = lazy(() => import('./pages/admin/Contacts'));

/** Shown while an admin chunk is in flight. Deliberately plain. */
function AdminLoading() {
  return (
    <div
      style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: 'hsl(224 24% 97%)', color: 'hsl(224 12% 46%)',
        fontFamily: 'var(--font-sans)', fontSize: '0.95rem'
      }}
      role="status"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}

const admin = (el: React.ReactNode, protect = true) => (
  <Suspense fallback={<AdminLoading />}>
    {protect ? <ProtectedRoute>{el}</ProtectedRoute> : el}
  </Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sermons" element={<Sermons />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/admin" element={admin(<Login />, false)} />
      <Route path="/admin/dashboard" element={admin(<Dashboard />)} />
      <Route path="/admin/gallery-upload" element={admin(<GalleryUpload />)} />
      <Route path="/admin/gallery-manage" element={admin(<GalleryManage />)} />
      <Route path="/admin/sermon-add" element={admin(<SermonAdd />)} />
      <Route path="/admin/sermon-manage" element={admin(<SermonManage />)} />
      <Route path="/admin/categories" element={admin(<Categories />)} />
      <Route path="/admin/contacts" element={admin(<Contacts />)} />
    </Routes>
  );
}
