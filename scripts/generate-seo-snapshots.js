const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://avakaayafoods.com';
const API_URL = process.env.SEO_API_URL || 'https://api.avakaayafoods.com/api';
const buildDir = path.join(__dirname, '..', 'build');
const shellPath = path.join(buildDir, 'index.html');
const defaultImage = `${SITE_URL}/avakaaya-logo.png`;

const collectionPages = {
  pickles: ['Authentic Andhra Pickles Online | Avakaaya Foods', 'Shop traditional Andhra pickles handcrafted in Hyderabad, including avakaya, gongura and more. Delivery across India and international shipping available.', 'Andhra Pickles'],
  powders: ['Andhra Podis & Spice Powders Online | Avakaaya Foods', 'Shop authentic Andhra podis and spice powders made in Hyderabad for idli, dosa and rice. Freshly packed for delivery in India and abroad.', 'Podis & Powders'],
  snacks: ['Traditional Andhra Snacks Online | Avakaaya Foods', 'Buy crisp traditional Andhra snacks from Avakaaya Foods, prepared in Hyderabad and delivered fresh to your doorstep.', 'Traditional Snacks'],
  sweets: ['Traditional Indian Sweets Online | Avakaaya Foods', 'Order traditional sweets from Avakaaya Foods in Hyderabad, packed with care for celebrations, gifting and everyday treats.', 'Indian Sweets'],
  ghee: ['Pure Ghee Online | Avakaaya Foods Hyderabad', 'Shop rich, aromatic ghee from Avakaaya Foods, packed in Hyderabad and delivered across India.', 'Pure Ghee'],
  'gift-hampers': ['Andhra Food Gift Hampers Online | Avakaaya Foods', 'Send curated Andhra food gift hampers with pickles, podis, snacks and sweets from Avakaaya Foods.', 'Gift Hampers'],
};

const staticPages = {
  products: ['Shop Andhra Foods Online | Avakaaya Foods', 'Browse authentic Andhra pickles, podis, snacks, sweets, ghee and gift hampers from Avakaaya Foods.'],
  about: ['Our Story | Traditional Andhra Recipes | Avakaaya Foods', 'Learn about Avakaaya Foods, our traditional Andhra recipes, fresh spices and small-batch approach to authentic homemade flavours.'],
  'shipping-info': ['Shipping Information | Avakaaya Foods', 'See shipping destinations, expected delivery times and packing information for Avakaaya Foods orders in India and overseas.'],
  contact: ['Contact Avakaaya Foods | Hyderabad', 'Contact Avakaaya Foods for product, order and delivery support by phone, WhatsApp or email.'],
  'store-locations': ['Avakaaya Foods Stores in Hyderabad | Locations & Hours', 'Visit Avakaaya Foods stores in Kukatpally, Chanda Nagar and Ameerpet, Hyderabad. View addresses, directions and store hours.'],
  'refund-policy': ['Refund & Cancellation Policy | Avakaaya Foods', 'Review the refund, replacement and cancellation policy for orders placed with Avakaaya Foods.'],
  terms: ['Terms & Conditions | Avakaaya Foods', 'Read the terms and conditions governing use of Avakaaya Foods and online purchases.'],
  'privacy-policy': ['Privacy Policy | Avakaaya Foods', 'Learn how Avakaaya Foods handles order information, website activity and customer enquiries.'],
  'gift-hamper': ['Build an Andhra Food Gift Hamper | Avakaaya Foods', 'Build a personalised gift hamper with Avakaaya Foods pickles, podis, sweets and traditional snacks.'],
};

const htmlEscape = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const jsonText = value => JSON.stringify(value).replace(/</g, '\\u003c');

const absolute = value => {
  if (!value) return defaultImage;
  return /^https?:\/\//i.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const summary = value => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 155) return clean;
  return `${clean.slice(0, 152).replace(/\s+\S*$/, '')}...`;
};

const setMeta = (html, attribute, key, content) => {
  const expression = new RegExp(`<meta ${attribute}="${key}" content="[^"]*"\\s*/?>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${htmlEscape(content)}"/>`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `${tag}</head>`);
};

const pageHtml = (shell, { pathName, title, description, image = defaultImage, type = 'website', jsonLd = [] }) => {
  const canonical = `${SITE_URL}${pathName}`;
  let html = shell.replace(/<title>.*?<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:type', type);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:image', absolute(image));
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', absolute(image));
  html = html.replace(/<link rel="canonical"[^>]*>/i, '');
  html = html.replace(/<script type="application\/ld\+json" data-seo-jsonld="true">[\s\S]*?<\/script>/gi, '');
  const structuredData = jsonLd.map(schema => `<script type="application/ld+json" data-seo-jsonld="true">${jsonText(schema)}</script>`).join('');
  return html.replace('</head>', `<link rel="canonical" href="${canonical}"/>${structuredData}</head>`);
};

const writeSnapshot = (route, html) => {
  const directory = path.join(buildDir, ...route.split('/').filter(Boolean));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html, 'utf8');
};

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

const main = async () => {
  if (!fs.existsSync(shellPath)) throw new Error('Build index.html is missing. Run after react-scripts build.');
  const shell = fs.readFileSync(shellPath, 'utf8');

  Object.entries(staticPages).forEach(([route, [title, description]]) => {
    writeSnapshot(route, pageHtml(shell, { pathName: `/${route}`, title, description }));
  });

  Object.entries(collectionPages).forEach(([slug, [title, description, name]]) => {
    const url = `${SITE_URL}/collections/${slug}`;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    };
    writeSnapshot(`collections/${slug}`, pageHtml(shell, { pathName: `/collections/${slug}`, title, description, jsonLd: [schema] }));
  });

  let products = [];
  try {
    products = await fetchProducts();
  } catch (error) {
    console.warn(`Product SEO snapshots skipped: ${error.message}`);
    console.log(`Wrote ${Object.keys(staticPages).length + Object.keys(collectionPages).length} non-product SEO snapshots.`);
    return;
  }

  products.filter(product => product.slug).forEach(product => {
    const route = `/products/${encodeURIComponent(product.slug)}`;
    const image = product.thumbnail || (Array.isArray(product.images) ? product.images[0] : null);
    const offers = (product.variants || []).map(variant => ({
      '@type': 'Offer',
      url: `${SITE_URL}${route}`,
      sku: variant.sku || undefined,
      priceCurrency: 'INR',
      price: String(variant.price),
      availability: Number(variant.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    }));
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: [absolute(image)],
      sku: product.variants?.[0]?.sku || String(product.id || product._id),
      brand: { '@type': 'Brand', name: 'Avakaaya Foods' },
      ...(offers.length ? { offers } : {}),
      ...(Number(product.rating) > 0 && Number(product.numReviews) > 0 ? {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews },
      } : {}),
    };
    writeSnapshot(route, pageHtml(shell, {
      pathName: route,
      title: `${product.name} Online | Avakaaya Foods`,
      description: summary(product.shortDescription || product.description),
      image,
      type: 'product',
      jsonLd: [schema],
    }));
  });

  console.log(`Wrote ${Object.keys(staticPages).length + Object.keys(collectionPages).length + products.length} SEO snapshots, including ${products.length} products.`);
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
