import { showToast } from './toast.js';
import { getCurrentUser } from './auth.js';

let wishlistCache = null;

export function getWishlistUserId() {
    if (typeof window === 'undefined') return '';
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const userId = user?.id ?? user?.customerId ?? user?.email;
        if (userId) {
            return `user-${userId}`;
        }
    } catch (_) {}

    try {
        let sid = localStorage.getItem('ph_wishlist_session_id');
        if (!sid) {
            sid = `anon-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000 + 1000)}`;
            localStorage.setItem('ph_wishlist_session_id', sid);
        }
        return `anon-${sid}`;
    } catch (e) {
        return '';
    }
}

export function syncAllWishlistButtonsOnPage() {
    if (typeof document === 'undefined') return;
    const wishlist = getWishlist();

    // Update all product cards on current screen
    document.querySelectorAll('.product-card').forEach(card => {
        const idAttr = card.getAttribute('data-id');
        const id = Number(idAttr);
        const btn = card.querySelector('.product-wishlist');
        if (btn && !isNaN(id) && id > 0) {
            const inList = wishlist.includes(id);
            btn.classList.toggle('active', inList);
            btn.setAttribute('title', inList ? 'Remove from wishlist' : 'Add to wishlist');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = inList ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            }
        }
    });

    // Update product details page button
    document.querySelectorAll('.btn-wishlist-detail').forEach(btn => {
        let id = Number(window.__currentProductId);
        if (isNaN(id) || id <= 0) {
            const urlParams = new URLSearchParams(window.location.search);
            id = Number(urlParams.get('id'));
        }
        if (!isNaN(id) && id > 0) {
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

export async function hydrateWishlistFromServer() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;

    const userId = getWishlistUserId();
    if (!userId) {
        wishlistCache = [];
        notifyWishlistUpdated();
        return;
    }

    try {
        const response = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`, {
            headers: { 'x-user-id': userId }
        });

        if (!response.ok) throw new Error('Unable to load wishlist');

        const data = await response.json();
        if (Array.isArray(data.productIds)) {
            const raw = data.productIds.map(Number).filter(n => !isNaN(n) && n > 0);
            wishlistCache = Array.from(new Set(raw));
            try {
                localStorage.setItem(`ph_wishlist_${userId}`, JSON.stringify(wishlistCache));
                localStorage.setItem('ph_wishlist', JSON.stringify(wishlistCache));
            } catch (_) {}
            notifyWishlistUpdated();
        } else {
            wishlistCache = [];
        }
    } catch (error) {
        console.warn('Wishlist server sync fallback:', error.message);
        try {
            const local = localStorage.getItem(`ph_wishlist_${userId}`) || localStorage.getItem('ph_wishlist');
            const parsed = local ? JSON.parse(local).map(Number).filter(n => !isNaN(n) && n > 0) : [];
            wishlistCache = Array.from(new Set(parsed));
        } catch (_) {
            wishlistCache = [];
        }
        notifyWishlistUpdated();
    }
}

export function getWishlist() {
    const userId = getWishlistUserId();
    if (wishlistCache !== null && Array.isArray(wishlistCache)) {
        return [...wishlistCache];
    }

    try {
        const local = localStorage.getItem(`ph_wishlist_${userId}`) || localStorage.getItem('ph_wishlist');
        const raw = local ? JSON.parse(local).map(Number).filter(n => !isNaN(n) && n > 0) : [];
        wishlistCache = Array.from(new Set(raw));
    } catch (_) {
        wishlistCache = [];
    }

    void hydrateWishlistFromServer();
    return [...wishlistCache];
}

export function isProductInWishlist(productId) {
    const list = getWishlist();
    return list.includes(Number(productId));
}

export function updateWishlistCount() {
    if (typeof document === 'undefined') return;
    const count = getWishlist().length;
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

export async function toggleWishlist(btn, productId) {
    const id = Number(productId);
    if (isNaN(id) || id <= 0) return false;

    let wishlist = getWishlist();
    const idx = wishlist.indexOf(id);
    const userId = getWishlistUserId();
    let isAdded = false;

    if (idx > -1) {
        wishlist = wishlist.filter(item => item !== id);
        isAdded = false;
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist = Array.from(new Set([...wishlist, id]));
        isAdded = true;
        showToast('Added to wishlist!', 'success');
    }

    wishlistCache = wishlist;
    try {
        localStorage.setItem(`ph_wishlist_${userId}`, JSON.stringify(wishlist));
        localStorage.setItem('ph_wishlist', JSON.stringify(wishlist));
    } catch (_) {}

    notifyWishlistUpdated();

    // Async backend database persistence
    if (userId && typeof fetch === 'function') {
        try {
            await fetch('/api/wishlist/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ userId, productId: id })
            });
        } catch (err) {
            console.warn('Failed to sync wishlist toggle to server:', err.message);
        }
    }

    return isAdded;
}

export async function removeFromWishlist(productId) {
    const id = Number(productId);
    if (isNaN(id) || id <= 0) return;

    let wishlist = getWishlist().filter(item => item !== id);
    const userId = getWishlistUserId();

    wishlistCache = wishlist;
    try {
        localStorage.setItem(`ph_wishlist_${userId}`, JSON.stringify(wishlist));
        localStorage.setItem('ph_wishlist', JSON.stringify(wishlist));
    } catch (_) {}

    showToast('Removed from wishlist', 'info');
    notifyWishlistUpdated();

    if (userId && typeof fetch === 'function') {
        try {
            await fetch('/api/wishlist', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ userId, productIds: wishlist })
            });
        } catch (err) {
            console.warn('Failed to sync wishlist removal to server:', err.message);
        }
    }
}

export async function clearWishlist() {
    const userId = getWishlistUserId();
    wishlistCache = [];
    try {
        localStorage.setItem(`ph_wishlist_${userId}`, JSON.stringify([]));
        localStorage.setItem('ph_wishlist', JSON.stringify([]));
    } catch (_) {}

    showToast('Wishlist cleared', 'info');
    notifyWishlistUpdated();

    if (userId && typeof fetch === 'function') {
        try {
            await fetch('/api/wishlist/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ userId })
            });
        } catch (err) {
            console.warn('Failed to clear wishlist on server:', err.message);
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        updateWishlistCount();
        syncAllWishlistButtonsOnPage();
        void hydrateWishlistFromServer();
    });
}
