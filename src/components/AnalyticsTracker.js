import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/tracking';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', { metadata: { title: document.title } });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event) => {
      const target = event.target.closest?.('a,button');
      if (!target) return;
      const href = target.getAttribute('href') || '';
      const label = (target.getAttribute('aria-label') || target.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);

      if (/wa\.me|whatsapp/i.test(href)) {
        trackEvent('contact_whatsapp', { metadata: { label, href } });
      } else if (/^tel:/i.test(href)) {
        trackEvent('contact_phone', { metadata: { label, href } });
      } else {
        trackEvent('generic_click', { metadata: { label, href } });
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
};

export default AnalyticsTracker;
