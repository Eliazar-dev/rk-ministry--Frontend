import { useEffect } from 'react';

const BASE = 'Richard Kwanya Snr | #Babawa';

/** usePageTitle('Sermons', 'optional description') → "Sermons | Richard Kwanya Snr" */
export default function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Richard Kwanya Snr` : BASE;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
