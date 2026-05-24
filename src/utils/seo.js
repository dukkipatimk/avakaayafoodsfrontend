export const SITE_URL = 'https://avakaayafoods.com';
export const SITE_NAME = 'Avakaaya Foods';
export const DEFAULT_IMAGE = '/avakaaya-logo.png';

export const CATEGORY_SEO = {
  pickles: {
    name: 'Andhra Pickles',
    title: 'Authentic Andhra Pickles Online | Avakaaya Foods',
    description: 'Shop traditional Andhra pickles handcrafted in Hyderabad, including avakaya, gongura and more. Delivery across India and international shipping available.',
    introduction: 'Explore traditional Andhra pickles prepared with carefully sourced ingredients, freshly ground spices and time-honoured recipes.',
  },
  powders: {
    name: 'Podis & Powders',
    title: 'Andhra Podis & Spice Powders Online | Avakaaya Foods',
    description: 'Shop authentic Andhra podis and spice powders made in Hyderabad for idli, dosa and rice. Freshly packed for delivery in India and abroad.',
    introduction: 'Bring home the aroma of Andhra kitchens with podis and spice powders made for rice, idli, dosa and everyday meals.',
  },
  snacks: {
    name: 'Traditional Snacks',
    title: 'Traditional Andhra Snacks Online | Avakaaya Foods',
    description: 'Buy crisp traditional Andhra snacks from Avakaaya Foods, prepared in Hyderabad and delivered fresh to your doorstep.',
    introduction: 'Discover savoury Andhra snacks prepared for tea time, celebrations and sharing with family.',
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
    title: 'Andhra Food Gift Hampers Online | Avakaaya Foods',
    description: 'Send curated Andhra food gift hampers with pickles, podis, snacks and sweets from Avakaaya Foods.',
    introduction: 'Share authentic Andhra flavours with thoughtfully assembled hampers for celebrations and special occasions.',
  },
};

export const absoluteUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${path}`;
};

export const categoryPath = (category) => `/collections/${category}`;

export const textSummary = (value = '', maximum = 155) => {
  const cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maximum) return cleaned;
  return `${cleaned.slice(0, maximum - 3).replace(/\s+\S*$/, '')}...`;
};

