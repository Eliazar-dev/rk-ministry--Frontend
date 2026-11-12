import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Recover from './pages/Recover';
import Home from './pages/Home';
import ResourcePage from './pages/ResourcePage';
import Reader from './pages/Reader';
import Store from './pages/Store';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import About from './pages/About';

// The admin panel is its own chunk, so visitors never download it
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** Only checkout and the profile page need an account up front; everything else is open to visitors. */
function Protected({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<Recover mode="forgot" />} />
      <Route path="/reset-password" element={<Recover mode="reset" />} />
      <Route
        path="/manage/*"
        element={
          <Suspense fallback={<div className="route-loading">Loading admin…</div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/resources/:slug" element={<ResourcePage />} />
        <Route path="/resources/:slug/:id" element={<Reader />} />
        <Route path="/gallery" element={<Navigate to="/resources/mission-gallery" replace />} />
        <Route path="/store" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
