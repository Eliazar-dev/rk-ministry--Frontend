// Runs before every build: writes public/sitemap.xml + robots.txt from VITE_SITE_URL (skipped when it is not set).
import { mkdirSync, writeFileSync } from 'node:fs';

const site = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
mkdirSync('public', { recursive: true });
if (!site) {
  console.log('sitemap: VITE_SITE_URL not set, skipping (set it on Vercel before launch)');
  writeFileSync('public/robots.txt', 'User-agent: *\nAllow: /\nDisallow: /manage\nDisallow: /auth\n');
  process.exit(0);
}
const paths = ['/', '/about', '/contact', '/donate', '/store', '/resources/sermons', '/resources/sabbath-school', '/resources/devotionals',
  '/resources/blogs', '/resources/literature', '/resources/medical-missionary', '/resources/children-bible-stories', '/resources/ebooks', '/resources/mission-gallery'];
const day = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
  .map((p) => `  <url><loc>${site}${p}</loc><lastmod>${day}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`;
writeFileSync('public/sitemap.xml', xml);
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /manage\nDisallow: /auth\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap: wrote ${paths.length} urls for ${site}`);
