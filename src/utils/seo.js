export const SITE_URL = 'https://avakaayafoods.com';
export const SITE_NAME = 'Avakaaya Foods';
export const DEFAULT_IMAGE = '/avakaaya-logo.png';

export const CATEGORY_SEO = {
  pickles: {
    name: 'Telugu Pickles',
    title: 'Authentic Telugu Pickles Online | Avakaaya Foods',
    description: 'Shop traditional Telugu pickles handcrafted in Hyderabad, including avakaya, gongura and more. Delivery across India and international shipping available.',
    introduction: 'Explore traditional Telugu pickles prepared with carefully sourced ingredients, freshly ground spices and time-honoured recipes.',
  },
  'veg-pickles': {
    name: 'Veg Pickles',
    title: 'Authentic Veg Telugu Pickles Online | Avakaaya Foods',
    description: 'Shop vegetarian Telugu pickles including avakaya, gongura, lemon and more, handcrafted in Hyderabad and delivered worldwide.',
    introduction: 'Explore traditional vegetarian Telugu pickles prepared with fresh produce, carefully sourced spices and time-honoured recipes.',
  },
  'non-veg-pickles': {
    name: 'Non-Veg Pickles',
    title: 'Telugu Non-Veg Pickles Online | Avakaaya Foods',
    description: 'Shop Telugu chicken, mutton, prawn and fish pickles prepared in Hyderabad with traditional spices and carefully packed for delivery.',
    introduction: 'Discover bold Telugu non-vegetarian pickles, prepared in separate batches with rich spices and careful packing.',
  },
  powders: {
    name: 'Podis & Powders',
    title: 'Telugu Podis & Spice Powders Online | Avakaaya Foods',
    description: 'Shop authentic Telugu podis and spice powders made in Hyderabad for idli, dosa and rice. Freshly packed for delivery in India and abroad.',
    introduction: 'Bring home the aroma of Telugu kitchens with podis and spice powders made for rice, idli, dosa and everyday meals.',
  },
  snacks: {
    name: 'Traditional Snacks',
    title: 'Traditional Telugu Snacks Online | Avakaaya Foods',
    description: 'Buy crisp traditional Telugu snacks from Avakaaya Foods, prepared in Hyderabad and delivered fresh to your doorstep.',
    introduction: 'Discover savoury Telugu snacks prepared for tea time, celebrations and sharing with family.',
  },
  sweets: {
    name: 'Indian Sweets',
    title: 'Traditional Indian Sweets Online | Avakaaya Foods',
    description: 'Order traditional sweets from Avakaaya Foods in Hyderabad, packed with care for celebrations, gifting and everyday treats.',
    introduction: 'Celebrate with handcrafted sweets prepared with familiar flavours and carefully packed for gifting or sharing.',
  },
  ghee: {
    name: 'Pure Ghee',
    title: 'Pure Ghee Online | Avakaaya Foods Hyderabad',
    description: 'Shop rich, aromatic ghee from Avakaaya Foods, packed in Hyderabad and delivered across India.',
    introduction: 'Choose pure, aromatic ghee for festive cooking, daily meals and the finishing touch on warm rice.',
  },
  'gift-hampers': {
    name: 'Gift Hampers',
    title: 'Telugu Food Gift Hampers Online | Avakaaya Foods',
    description: 'Send curated Telugu food gift hampers with pickles, podis, snacks and sweets from Avakaaya Foods.',
    introduction: 'Share authentic Telugu flavours with thoughtfully assembled hampers for celebrations and special occasions.',
  },
};

export const absoluteUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${path}`;
};

export const categoryPath = (category) => `/collections/${category}`;

export const collectionApiFilters = (category) => {
  if (category === 'veg-pickles') return { category: 'pickles', isVeg: 'true' };
  if (category === 'non-veg-pickles') return { category: 'pickles', isVeg: 'false' };
  return category ? { category } : {};
};

export const productCategorySlug = (product) => {
  if (product?.category !== 'pickles') return product?.category || '';
  return product.isVeg === false ? 'non-veg-pickles' : 'veg-pickles';
};

export const textSummary = (value = '', maximum = 155) => {
  const cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maximum) return cleaned;
  return `${cleaned.slice(0, maximum - 3).replace(/\s+\S*$/, '')}...`;
};
