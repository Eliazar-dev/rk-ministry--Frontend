import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppBubble from './WhatsAppBubble';

/** Shell for every page. The home page brings its own Navbar (inside the hero). */
export default function Layout() {
  const { pathname, hash } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    if (hash) {
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      {!isHome && <Navbar />}
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppBubble />
    </>
  );
}
