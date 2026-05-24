import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Seo from './Seo';
import { DEFAULT_IMAGE, SITE_URL } from '../utils/seo';

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Avakaaya Foods',
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_IMAGE}`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-91155-95959',
    contactType: 'customer service',
    areaServed: ['IN', 'US', 'GB', 'SG', 'AU', 'MY'],
  },
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Avakaaya Foods',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/products?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const STORE_SCHEMA = [
  ['Kukatpally', 'LIG-75, 1st Phase, Dharma Reddy Colony Phase I, Kukatpally', '500072', '+91-91155-95959'],
  ['Chanda Nagar', 'Under Shoe Lala Building, H.3-10, Near RS Brothers, Gangaram, Chanda Nagar', '500050', '+91-91155-95959'],
  ['Ameerpet', 'H No. 7-1-455/2 & 3, Green House Building, Beside Passport Office, Ameerpet', '500038', '+91-62693-99399'],
].map(([area, streetAddress, postalCode, telephone]) => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: `Avakaaya Foods - ${area}`,
  url: `${SITE_URL}/store-locations`,
  telephone,
  address: {
    '@type': 'PostalAddress',
    streetAddress,
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode,
    addressCountry: 'IN',
  },
  openingHours: 'Mo-Su 09:00-22:00',
}));

const STATIC_PAGES = {
  '/': {
    title: 'Authentic Andhra Pickles, Podis & Sweets Online | Avakaaya Foods',
    description: 'Shop authentic Andhra pickles, podis, sweets, snacks and ghee handcrafted in Hyderabad. Delivery across India and worldwide shipping available.',
    jsonLd: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  },
  '/about': {
    title: 'Our Story | Traditional Andhra Recipes | Avakaaya Foods',
    description: 'Learn about Avakaaya Foods, our traditional Andhra recipes, fresh spices and small-batch approach to authentic homemade flavours.',
  },
  '/shipping-info': {
    title: 'Shipping Information | Avakaaya Foods',
    description: 'See shipping destinations, expected delivery times and packing information for Avakaaya Foods orders in India and overseas.',
  },
  '/contact': {
    title: 'Contact Avakaaya Foods | Hyderabad',
    description: 'Contact Avakaaya Foods for product, order and delivery support by phone, WhatsApp or email.',
  },
  '/store-locations': {
    title: 'Avakaaya Foods Stores in Hyderabad | Locations & Hours',
    description: 'Visit Avakaaya Foods stores in Kukatpally, Chanda Nagar and Ameerpet, Hyderabad. View addresses, directions and store hours.',
    jsonLd: STORE_SCHEMA,
  },
  '/refund-policy': {
    title: 'Refund & Cancellation Policy | Avakaaya Foods',
    description: 'Review the refund, replacement and cancellation policy for orders placed with Avakaaya Foods.',
  },
  '/terms': {
    title: 'Terms & Conditions | Avakaaya Foods',
    description: 'Read the terms and conditions governing use of Avakaaya Foods and online purchases.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Avakaaya Foods',
    description: 'Learn how Avakaaya Foods handles order information, website activity and customer enquiries.',
  },
  '/gift-hamper': {
    title: 'Build an Andhra Food Gift Hamper | Avakaaya Foods',
    description: 'Build a personalised gift hamper with Avakaaya Foods pickles, podis, sweets and traditional snacks.',
  },
};

const PRIVATE_PREFIXES = ['/admin', '/account', '/my-orders', '/wishlist', '/cart', '/checkout', '/order/', '/login', '/register', '/forgot-password', '/reset-password'];

const RouteSeo = () => {
  const { pathname } = useLocation();
  const props = useMemo(() => {
    if (STATIC_PAGES[pathname]) return { ...STATIC_PAGES[pathname], path: pathname };
    if (pathname === '/products' || pathname.startsWith('/products/') || pathname.startsWith('/collections/')) return null;
    const isPrivate = PRIVATE_PREFIXES.some(prefix => pathname.startsWith(prefix));
    return {
      title: isPrivate ? 'Customer Area | Avakaaya Foods' : 'Page Not Found | Avakaaya Foods',
      description: isPrivate ? 'Secure Avakaaya Foods customer page.' : 'The requested page could not be found.',
      path: pathname,
      noIndex: true,
    };
  }, [pathname]);

  if (!props) return null;
  return <Seo {...props} />;
};

export default RouteSeo;
