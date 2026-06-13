import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Sermons from './pages/Sermons';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import GalleryUpload from './pages/admin/GalleryUpload';
import GalleryManage from './pages/admin/GalleryManage';
import SermonAdd from './pages/admin/SermonAdd';
import SermonManage from './pages/admin/SermonManage';
import Categories from './pages/admin/Categories';
import Contacts from './pages/admin/Contacts';
import ProtectedRoute from './components/ProtectedRoute';

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
      <Route path="/admin" element={<Login />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/gallery-upload" element={<ProtectedRoute><GalleryUpload /></ProtectedRoute>} />
      <Route path="/admin/gallery-manage" element={<ProtectedRoute><GalleryManage /></ProtectedRoute>} />
      <Route path="/admin/sermon-add" element={<ProtectedRoute><SermonAdd /></ProtectedRoute>} />
      <Route path="/admin/sermon-manage" element={<ProtectedRoute><SermonManage /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/admin/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
    </Routes>
  );
}
