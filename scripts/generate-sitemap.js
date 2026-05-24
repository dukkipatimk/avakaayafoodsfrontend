const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://avakaayafoods.com';
const API_URL = process.env.SEO_API_URL || 'https://api.avakaayafoods.com/api';
const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

const staticPaths = [
  '/',
  '/products',
  '/collections/pickles',
  '/collections/powders',
  '/collections/snacks',
  '/collections/sweets',
  '/collections/ghee',
  '/collections/gift-hampers',
  '/gift-hamper',
  '/about',
  '/shipping-info',
  '/contact',
  '/store-locations',
  '/refund-policy',
  '/terms',
  '/privacy-policy',
];

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const fetchProducts = async () => {
  const products = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await fetch(`${API_URL}/products?page=${page}&limit=100`);
    if (!response.ok) throw new Error(`Product API returned ${response.status}`);
    const body = await response.json();
    products.push(...(body.products || []));
    pages = Number(body.pages || 1);
    page += 1;
  } while (page <= pages);
  return products;
};

const createUrl = ({ location, lastModified, priority, frequency }) => [
  '  <url>',
  `    <loc>${escapeXml(`${SITE_URL}${location}`)}</loc>`,
  lastModified ? `    <lastmod>${escapeXml(lastModified)}</lastmod>` : null,
  `    <changefreq>${frequency}</changefreq>`,
  `    <priority>${priority}</priority>`,
  '  </url>',
].filter(Boolean).join('\n');

const main = async () => {
  let products = [];
  try {
    products = await fetchProducts();
    console.log(`Including ${products.length} live product URLs in sitemap.`);
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      console.warn(`Could not load live products for sitemap: ${error.message}. Keeping the existing sitemap.`);
      return;
    }
    console.warn(`Could not load live products for sitemap: ${error.message}. Writing public pages only.`);
  }

  const urls = [
    ...staticPaths.map(location => ({
      location,
      priority: location === '/' ? '1.0' : location.startsWith('/collections/') ? '0.8' : '0.6',
      frequency: location === '/' || location.startsWith('/collections/') ? 'weekly' : 'monthly',
    })),
    ...products.filter(product => product.slug).map(product => ({
      location: `/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt ? String(product.updatedAt).slice(0, 10) : undefined,
      priority: '0.8',
      frequency: 'weekly',
    })),
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(createUrl),
    '</urlset>',
    '',
  ].join('\n');

  fs.writeFileSync(outputPath, sitemap, 'utf8');
  console.log(`Wrote ${urls.length} URLs to ${outputPath}.`);
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
