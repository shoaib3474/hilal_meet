// =====================================================
//   WEBSITE-BACKED WHATSAPP SHOP CONFIG
// =====================================================

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_CONFIG = {
  shopName: process.env.WHATSAPP_SHOP_NAME || 'Pakeeza Hilal Meat',
  ownerName: process.env.WHATSAPP_OWNER_NAME || 'Owner',
  phone: process.env.WHATSAPP_PHONE || '+44 208 503 5721',
  location: process.env.WHATSAPP_LOCATION || 'High Street North, London E12 6SB',
  hours: process.env.WHATSAPP_HOURS || 'Mon–Sat: 8:00am – 8:00pm | Sun: 9:00am – 6:00pm',
  ownerWhatsApp: process.env.WHATSAPP_OWNER_WHATSAPP || '442085035721',
  payment: process.env.WHATSAPP_PAYMENT || 'Cash on Delivery\nCard / Online payment on request',
  delivery: process.env.WHATSAPP_DELIVERY || 'Delivery available in the local area\nMinimum order applies',
  products: []
};

function normalizeBaseUrl(rawUrl) {
  if (!rawUrl) {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }

  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request to ${url} failed with ${response.status}: ${text}`);
  }

  return response.json();
}

async function getShopConfig() {
  const baseUrl = normalizeBaseUrl(process.env.WHATSAPP_API_BASE_URL || process.env.WEBSITE_API_URL || process.env.PUBLIC_URL);

  try {
    const products = await fetchJson(`${baseUrl}/api/products`);
    const mappedProducts = Array.isArray(products)
      ? products.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          unit: product.weight || 'item',
          category: product.category || ''
        }))
      : [];

    return {
      ...DEFAULT_CONFIG,
      products: mappedProducts
    };
  } catch (error) {
    console.warn(`⚠️ Unable to load products from website API (${baseUrl}). Using fallback config.`, error.message);
    return { ...DEFAULT_CONFIG };
  }
}

async function createOrderInWebsite(order) {
  const baseUrl = normalizeBaseUrl(process.env.WHATSAPP_API_BASE_URL || process.env.WEBSITE_API_URL || process.env.PUBLIC_URL);

  return fetchJson(`${baseUrl}/api/orders`, {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

module.exports = {
  ...DEFAULT_CONFIG,
  getShopConfig,
  createOrderInWebsite
};
