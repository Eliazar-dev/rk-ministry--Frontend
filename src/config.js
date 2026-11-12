// One place for the details that appear all over the site. Change them with environment variables
// (Vercel > Project > Settings > Environment Variables), not by editing code.
const env = import.meta.env;

export const SITE_NAME = 'Richard Kwanya Snr';
export const TAGLINE = 'Equipping people, transforming lives';
export const MAP_QUERY = env.VITE_MAP_QUERY || 'Baraton University, Eldoret, Kenya';
export const PHONE = env.VITE_CONTACT_PHONE || '+254 700 000 000';
export const EMAIL = env.VITE_CONTACT_EMAIL || 'info@richardkwanya.org';

const q = encodeURIComponent(MAP_QUERY).replace(/%20/g, '+');
export const MAP_EMBED = `https://www.google.com/maps?q=${q}&output=embed`;
export const MAP_OPEN = `https://www.google.com/maps/search/?api=1&query=${q}`;
export const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
