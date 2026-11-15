import { useEffect } from 'react';

const SITE_URL = 'https://www.richardkwanyasnr.org';
const LOGO_URL = 'https://res.cloudinary.com/gfiqfk7x/image/upload/v1784123661/WhatsApp_Image_2026-07-15_at_4.53.19_PM_ktrbpg.jpg';

export function useSEO({ title, description, image, canonical, type = 'website', article }) {
  useEffect(() => {
    document.title = title || 'Richard Kwanya Snr | #Babawa';

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description || 'Richard Kwanya Snr Ministry — Equipping people, transforming lives.';

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonical || `${SITE_URL}${window.location.pathname}`;

    // Update Open Graph tags
    updateMetaTag('og:title', title || 'Richard Kwanya Snr | #Babawa');
    updateMetaTag('og:description', description || 'Equipping people, transforming lives.');
    updateMetaTag('og:type', type);
    updateMetaTag('og:image', image || LOGO_URL);
    updateMetaTag('og:url', canonical || `${SITE_URL}${window.location.pathname}`);

    // Update Twitter card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || 'Richard Kwanya Snr | #Babawa');
    updateMetaTag('twitter:description', description || 'Equipping people, transforming lives.');
    updateMetaTag('twitter:image', image || LOGO_URL);

    // Add Article schema if provided
    if (article) {
      updateJSONLD({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.headline,
        image: article.image,
        author: article.author,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        url: article.url,
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, [title, description, image, canonical, type, article]);
}

function updateMetaTag(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(property.includes('twitter:') ? 'name' : 'property', property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function updateJSONLD(data) {
  let script = document.getElementById('json-ld-schema');
  if (!script) {
    script = document.createElement('script');
    script.id = 'json-ld-schema';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
