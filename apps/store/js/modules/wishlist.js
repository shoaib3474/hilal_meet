import { showToast } from './toast.js';
import { getCurrentUser } from './auth.js';

let wishlistCache = [];
let wishlistItemsCache = [];
let wishlistSyncInFlight = null;
let wishlistLastHydratedAt = 0;

export function getWishlistUserId() {
    if (typeof window === 'undefined') return '';
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const raw = user?.id ?? user?.customerId ?? user?.email ?? '';
        if (raw !== '') {
            return String(raw).replace(/^user-/i, '').replace(/^anon-/i, '');
        }
    } catch (_) { }
    return '';
}

export function syncAllWishlistButtonsOnPage() {
    if (typeof document === 'undefined') return;
    const wishlist = getWishlist();

    document.querySelectorAll('.product-card').forEach((card) => {
        const idAttr = card.getAttribute('data-id');
        const id = parseInt(idAttr, 10);
        const btn = card.querySelector('.product-wishlist');
        if (btn && !Number.isNaN(id) && id > 0) {
            const inList = wishlist.includes(id);
            btn.classList.toggle('active', inList);
            btn.setAttribute('title', inList ? 'Remove from wishlist' : 'Add to wishlist');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = inList ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            }
        }
    });

    document.querySelectorAll('.btn-wishlist-detail').forEach((btn) => {
        let id = parseInt(window.__currentProductId, 10);
        if (Number.isNaN(id) || id <= 0) {
            const urlParams = new URLSearchParams(window.location.search);
            id = parseInt(urlParams.get('id'), 10);
        }
        if (!Number.isNaN(id) && id > 0) {
            const inList = wishlist.includes(id);
            btn.classList.toggle('active', inList);
            btn.setAttribute('title', inList ? 'Remove from wishlist' : 'Add to wishlist');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = inList ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            }
        }
    });
}

function notifyWishlistUpdated() {
    updateWishlistCount();
    syncAllWishlistButtonsOnPage();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('wishlist:updated'));
    }
}

export async function hydrateWishlistFromServer(force = false) {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return [];
    if (wishlistSyncInFlight) {
        return wishlistSyncInFlight;
    }

    const userId = getWishlistUserId();
    if (!userId) {
        wishlistCache = [];
        wishlistItemsCache = [];
        updateWishlistCount();
        syncAllWishlistButtonsOnPage();
        return [];
    }

    const now = Date.now();
    if (!force && wishlistLastHydratedAt && (now - wishlistLastHydratedAt < 300000) && Array.isArray(wishlistItemsCache)) {
        return wishlistItemsCache;
    }

    wishlistSyncInFlight = (async () => {
        try {
            const response = await fetch('/api/wishlist', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': String(userId)
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load wishlist');
            }

            const data = await response.json();
            wishlistCache = Array.isArray(data.productIds) ? data.productIds.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) : [];
            wishlistItemsCache = Array.isArray(data.items) ? data.items : [];
            wishlistLastHydratedAt = Date.now();
            notifyWishlistUpdated();
            return wishlistItemsCache;
        } catch (error) {
            console.warn('Wishlist hydration failed:', error.message);
            wishlistCache = [];
            wishlistItemsCache = [];
            wishlistLastHydratedAt = Date.now();
            notifyWishlistUpdated();
            return [];
        } finally {
            wishlistSyncInFlight = null;
        }
    })();

    return wishlistSyncInFlight;
}

export function getWishlist() {
    return Array.isArray(wishlistCache) ? [...wishlistCache] : [];
}

export function getWishlistItems() {
    return Array.isArray(wishlistItemsCache) ? [...wishlistItemsCache] : [];
}

export function isProductInWishlist(productId) {
    const id = Number(productId);
    if (!Number.isFinite(id) || id <= 0) return false;
    return getWishlist().includes(id);
}

export function updateWishlistCount() {
    if (typeof document === 'undefined') return;
    const count = getWishlist().length;
    document.querySelectorAll('.wishlist-count').forEach((el) => {
        el.textContent = String(count);
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

export async function toggleWishlist(btn, productId) {
    const id = Number(productId);
    if (!Number.isFinite(id) || id <= 0) return false;

    const userId = getWishlistUserId();
    if (!userId) {
        showToast('Please log in to use wishlist', 'info');
        return false;
    }

    const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId)
        },
        body: JSON.stringify({ userId, productId: id })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        showToast(data.error || 'Unable to update wishlist', 'error');
        return false;
    }

    await hydrateWishlistFromServer(true);
    showToast(data.action === 'removed' ? 'Removed from wishlist' : 'Added to wishlist!', data.action === 'removed' ? 'info' : 'success');
    return data.action !== 'removed';
}

export async function removeFromWishlist(productId) {
    const id = Number(productId);
    const userId = getWishlistUserId();
    if (!userId || !Number.isFinite(id) || id <= 0) return;

    const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId)
        },
        body: JSON.stringify({ userId, productId: id })
    });

    if (res.ok) {
        await hydrateWishlistFromServer(true);
        showToast('Removed from wishlist', 'info');
    }
}

export async function clearWishlist() {
    const userId = getWishlistUserId();
    if (!userId) {
        showToast('Please log in to clear wishlist', 'info');
        return;
    }

    const res = await fetch('/api/wishlist/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId)
        },
        body: JSON.stringify({ userId })
    });

    if (res.ok) {
        await hydrateWishlistFromServer(true);
        showToast('Wishlist cleared', 'info');
    }
}

export async function migrateGuestWishlistToUser() {
    return;
}


