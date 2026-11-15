// Runs before every build: writes public/sitemap.xml + robots.txt from VITE_SITE_URL (skipped when it is not set).
import { mkdirSync, writeFileSync } from 'node:fs';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.richardkwanyasnr.org').replace(/\/$/, '');
const API_URL = process.env.VITE_API_URL || 'https://richardkwanya-ministry-backend.vercel.app/api';

mkdirSync('public', { recursive: true });

const staticPaths = [
  '/',
  '/about',
  '/contact',
  '/donate',
  '/store',
  '/resources/sermons',
  '/resources/sabbath-school',
  '/resources/devotionals',
  '/resources/blogs',
  '/resources/literature',
  '/resources/medical-missionary',
  '/resources/children-bible-stories',
  '/resources/ebooks',
  '/resources/mission-gallery',
];

const day = new Date().toISOString().slice(0, 10);

async function fetchAPIItems(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(item => ({ id: item.id, updated: item.updated || day }));
  } catch (error) {
    console.warn(`Failed to fetch ${endpoint}:`, error.message);
    return [];
  }
}

async function generateSitemap() {
  let paths = [...staticPaths];

  // Fetch dynamic content from API
  const [sermons, devotionals, articles, lessons, gallery] = await Promise.all([
    fetchAPIItems('/sermons/'),
    fetchAPIItems('/devotionals/'),
    fetchAPIItems('/blogs/'),
    fetchAPIItems('/lessons/'),
    fetchAPIItems('/gallery/'),
  ]);

  // Add sermon detail pages
  sermons.forEach(s => paths.push(`/resources/sermons/${s.id}`));
  // Add devotional detail pages
  devotionals.forEach(d => paths.push(`/resources/devotionals/${d.id}`));
  // Add article detail pages (group by category)
  const articleCategories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  articleCategories.forEach(cat => {
    articles.filter(a => a.category === cat).forEach(a => paths.push(`/resources/${cat.toLowerCase()}/${a.id}`));
  });
  // Add lesson detail pages
  lessons.forEach(l => paths.push(`/resources/sabbath-school/${l.id}`));
  // Add gallery detail pages
  gallery.forEach(g => paths.push(`/resources/mission-gallery/${g.id}`));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${day}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`sitemap: wrote ${paths.length} urls for ${SITE_URL}`);
}

function generateRobots() {
  const robots = `User-agent: *
Allow: /
Disallow: /manage
Disallow: /profile
Disallow: /cart
Disallow: /auth

Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync('public/robots.txt', robots);
  console.log('robots.txt updated');
}

generateSitemap().then(() => generateRobots()).catch(console.error);
