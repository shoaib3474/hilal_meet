import { showToast } from './toast.js';
import { getCurrentUser } from './auth.js';

function getUserCartSessionId() {
    if (typeof window === 'undefined') return '';

    const user = getCurrentUser?.();
    const userId = user?.id ?? user?.customerId ?? user?.email;

    // Cart is blocked when logged out (production requirement).
    if (!userId) return '';

    return `cart-user-${userId}`;
}


function resolveProductImage(product) {
    return product.image || (Array.isArray(product.gallery) && product.gallery[0]) || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80';
}

function notifyCartUpdated() {
    updateCartCount();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('cart:updated'));
    }
}

export async function hydrateCartFromServer() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;

    const sessionId = getUserCartSessionId();
    if (!sessionId) {
        window.__cartCache = [];
        notifyCartUpdated();
        return;
    }

    try {
        const response = await fetch(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`, {
            headers: { 'x-cart-session-id': sessionId }
        });

        if (!response.ok) throw new Error('Unable to load cart');

        const data = await response.json();
        if (Array.isArray(data.items)) {
            window.__cartCache = data.items;
            notifyCartUpdated();
        } else {
            window.__cartCache = [];
        }
    } catch (error) {
        console.warn('Cart sync unavailable:', error.message);
        window.__cartCache = [];
    }
}


export function getCart() {
    if (typeof window === 'undefined') return [];

    if (window.__cartCache === undefined || window.__cartCache === null) {
        const sessionId = getUserCartSessionId();
        if (!sessionId) {
            window.__cartCache = [];
            return window.__cartCache;
        }

        if (typeof window.apiRequestSync === 'function') {
            try {
                const data = window.apiRequestSync('GET', `${window.getApiBase()}/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
                window.__cartCache = data && Array.isArray(data.items) ? data.items : [];
            } catch (error) {
                console.warn('Failed to load cart from DB:', error);
                window.__cartCache = [];
            }
        } else {
            window.__cartCache = [];
        }
    }


    const dbProducts = typeof window.getProducts === 'function' ? window.getProducts() : [];
    const resolvedCart = window.__cartCache.map(item => {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        if (!dbProduct) return null;
        return {
            ...item,
            name: dbProduct.name,
            price: dbProduct.salePrice !== null && dbProduct.salePrice !== undefined ? dbProduct.salePrice : dbProduct.price,
            weight: dbProduct.weight,
            image: dbProduct.image || (Array.isArray(dbProduct.gallery) && dbProduct.gallery[0]) || item.image
        };
    }).filter(Boolean);

    if (resolvedCart.length !== window.__cartCache.length) {
        window.__cartCache = resolvedCart;
        saveCart(resolvedCart);
    }

    return resolvedCart;
}

export function updateCartCount() {
    const count = getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

export function saveCart(cart) {
    if (typeof window !== 'undefined') {
        window.__cartCache = Array.isArray(cart) ? cart : [];
    }
    notifyCartUpdated();

    const sessionId = getUserCartSessionId();
    if (!sessionId) return;

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
        fetch('/api/cart', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-cart-session-id': sessionId
            },
            body: JSON.stringify({ sessionId, items: cart })
        }).catch((error) => console.warn('Cart sync failed:', error.message));
    }
}


export function getCartTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function addToCart(productId, qty = 1) {
    // Block adding to cart when logged out.
    const sessionId = getUserCartSessionId();
    if (!sessionId) {
        showToast('Please login to add items to cart.', 'info');
        return false;
    }

    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    let cart = getCart();
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            image: resolveProductImage(product),
            price: product.salePrice || product.price,
            weight: product.weight,
            qty
        });
    }
    saveCart(cart);
    showToast(`${product.name} added to cart!`, 'success');
    return true;
}


export function removeFromCart(productId) {
    const sessionId = getUserCartSessionId();
    if (!sessionId) {
        window.__cartCache = [];
        notifyCartUpdated();
        return;
    }
    saveCart(getCart().filter(i => i.id !== productId));
}


export function updateCartQty(productId, qty) {
    const sessionId = getUserCartSessionId();
    if (!sessionId) return;

    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty = Math.max(1, qty);
        saveCart(cart);
    }
}


void hydrateCartFromServer();
