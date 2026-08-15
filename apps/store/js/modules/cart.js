import { showToast } from './toast.js';
import { getCurrentUser } from './auth.js';

export function getUserCartSessionId() {
    if (typeof window === 'undefined') return '';

    const user = getCurrentUser?.();
    const userId = user?.id ?? user?.customerId ?? user?.email;

    if (userId) {
        return `cart-user-${userId}`;
    }

    try {
        let sid = localStorage.getItem('ph_cart_session_id');
        if (!sid) {
            sid = `anon-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000 + 1000)}`;
            localStorage.setItem('ph_cart_session_id', sid);
        }
        return `cart-anon-${sid}`;
    } catch (e) {
        return '';
    }
}

export function getCartSessionId() {
    return getUserCartSessionId();
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

function normalizeCartItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
        if (!item || typeof item !== 'object') return null;
        const id = parseInt(item.id || item.productId);
        if (isNaN(id) || id <= 0) return null;
        return {
            id,
            name: item.name || '',
            category: item.category || '',
            price: item.price !== undefined ? Number(item.price) : 0,
            salePrice: item.salePrice !== null && item.salePrice !== undefined ? Number(item.salePrice) : null,
            regularPrice: item.regularPrice !== undefined ? Number(item.regularPrice) : Number(item.price || 0),
            weight: item.weight || '',
            image: item.image || resolveProductImage(item),
            inStock: item.inStock !== false,
            qty: Math.max(1, parseInt(item.qty || item.quantity || 1))
        };
    }).filter(Boolean);
}

export async function hydrateCartFromServer() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;

    if (window.__cartHydrationPromise) {
        await window.__cartHydrationPromise;
        return;
    }

    window.__cartHydrationPromise = (async () => {
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
                window.__cartCache = normalizeCartItems(data.items);
                notifyCartUpdated();
            } else {
                window.__cartCache = [];
                notifyCartUpdated();
            }
        } catch (error) {
            console.warn('Cart sync unavailable:', error.message);
            if (!Array.isArray(window.__cartCache)) {
                window.__cartCache = [];
            }
            notifyCartUpdated();
        }
    })();

    try {
        await window.__cartHydrationPromise;
    } finally {
        window.__cartHydrationPromise = null;
    }
}

export async function waitForCartHydration() {
    if (typeof window === 'undefined') return [];

    if (!window.__cartHydrationPromise) {
        window.__cartHydrationPromise = hydrateCartFromServer();
    }

    await window.__cartHydrationPromise;
    if (!Array.isArray(window.__cartCache)) {
        window.__cartCache = [];
    }
    return window.__cartCache;
}

export function getCart() {
    if (typeof window === 'undefined') return [];

    if (window.__cartCache === undefined || window.__cartCache === null) {
        window.__cartCache = [];
        void hydrateCartFromServer();
        return window.__cartCache;
    }

    return window.__cartCache;
}

export function updateCartCount() {
    const count = getCart().reduce((s, i) => s + (i.qty || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

export function getCartTotal() {
    return getCart().reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0);
}

export async function addToCart(productId, qty = 1) {
    const sessionId = getUserCartSessionId();
    const pid = parseInt(productId);
    const quantity = Math.max(1, parseInt(qty || 1));

    if (isNaN(pid) || pid <= 0) return false;

    // Optimistic local update
    let cart = getCart();
    const existing = cart.find(i => i.id === pid);
    if (existing) {
        existing.qty += quantity;
    } else {
        const products = typeof window.getProducts === 'function' ? window.getProducts() : [];
        const prod = products.find(p => p.id === pid);
        if (prod) {
            cart.push({
                id: prod.id,
                name: prod.name,
                image: resolveProductImage(prod),
                price: prod.salePrice !== null && prod.salePrice !== undefined ? Number(prod.salePrice) : Number(prod.price),
                weight: prod.weight || '',
                qty: quantity
            });
        } else {
            cart.push({ id: pid, name: 'Product', image: '', price: 0, weight: '', qty: quantity });
        }
    }
    window.__cartCache = cart;
    notifyCartUpdated();

    // Server update
    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-cart-session-id': sessionId },
            body: JSON.stringify({ sessionId, productId: pid, qty: existing ? existing.qty : quantity })
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items)) {
                window.__cartCache = normalizeCartItems(data.items);
                notifyCartUpdated();
            }
        }
    } catch (err) {
        console.warn('Cart add error:', err.message);
    }

    const addedItem = getCart().find(i => i.id === pid);
    showToast(`${addedItem?.name || 'Product'} added to cart!`, 'success');
    if (typeof window.renderCartSidebar === 'function') {
        try { window.renderCartSidebar(); } catch (e) { }
    }
    return true;
}

export async function removeFromCart(productId) {
    const sessionId = getUserCartSessionId();
    const pid = parseInt(productId);
    if (isNaN(pid) || pid <= 0) return;

    window.__cartCache = getCart().filter(i => i.id !== pid);
    notifyCartUpdated();

    try {
        await fetch(`/api/cart/item?sessionId=${encodeURIComponent(sessionId)}&productId=${pid}`, {
            method: 'DELETE',
            headers: { 'x-cart-session-id': sessionId }
        });
    } catch (err) {
        console.warn('Cart remove error:', err.message);
    }
}

export async function updateCartQty(productId, qty) {
    const sessionId = getUserCartSessionId();
    const pid = parseInt(productId);
    const newQty = parseInt(qty);

    if (isNaN(pid) || pid <= 0) return;

    if (newQty <= 0) {
        return removeFromCart(pid);
    }

    const cart = getCart();
    const item = cart.find(i => i.id === pid);
    if (item) {
        item.qty = newQty;
        window.__cartCache = cart;
        notifyCartUpdated();
    }

    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-cart-session-id': sessionId },
            body: JSON.stringify({ sessionId, productId: pid, qty: newQty })
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items)) {
                window.__cartCache = normalizeCartItems(data.items);
                notifyCartUpdated();
            }
        }
    } catch (err) {
        console.warn('Cart update qty error:', err.message);
    }
}

export async function clearCart() {
    const sessionId = getUserCartSessionId();
    window.__cartCache = [];
    notifyCartUpdated();

    try {
        await fetch('/api/cart/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-cart-session-id': sessionId },
            body: JSON.stringify({ sessionId })
        });
    } catch (err) {
        console.warn('Clear cart error:', err.message);
    }
}

export function saveCart(cart) {
    const sessionId = getUserCartSessionId();
    window.__cartCache = normalizeCartItems(cart);
    notifyCartUpdated();

    if (typeof fetch === 'function') {
        fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-cart-session-id': sessionId },
            body: JSON.stringify({ sessionId, items: window.__cartCache })
        }).catch(err => console.warn('Save cart error:', err.message));
    }
}

// Initial hydration
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        void hydrateCartFromServer();
    });
    window.addEventListener('auth:changed', () => {
        void hydrateCartFromServer();
    });
}
