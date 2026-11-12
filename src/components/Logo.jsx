import { Link } from 'react-router-dom';

export const LOGO_URL =
  import.meta.env.VITE_LOGO_URL ||
  'https://res.cloudinary.com/gfiqfk7x/image/upload/v1784123661/WhatsApp_Image_2026-07-15_at_4.53.19_PM_ktrbpg.jpg';

/** Logo image: Cloudinary first, bundled /logo.jpg if that link ever fails. */
export function LogoImg({ alt = 'RK logo' }) {
  return (
    <img
      src={LOGO_URL}
      alt={alt}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith('/logo.jpg')) e.currentTarget.src = '/logo.jpg';
      }}
    />
  );
}

export default function Logo({ dark = false, showText = true }) {
  return (
    <Link to="/" className={`logo ${dark ? 'dark' : ''}`} aria-label="Richard Kwanya Snr — Home">
      <span className="logo-badge">
        <LogoImg />
      </span>
      {showText && (
        <span className="logo-text">
          <strong>Richard Kwanya Snr</strong>
          <span>#Babawa</span>
        </span>
      )}
    </Link>
  );
}
