import { showToast } from './toast.js';
import { getCurrentUser } from './auth.js';

let wishlistCache = null;

export function getWishlistUserId() {
    if (typeof window === 'undefined') return '';
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const userId = user?.id ?? user?.customerId ?? user?.email;
    if (userId) {
        return `user-${userId}`;
    }

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

function notifyWishlistUpdated() {
    updateWishlistCount();
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
            wishlistCache = data.productIds.map(Number).filter(n => !isNaN(n));
            try {
                localStorage.setItem(`ph_wishlist_${userId}`, JSON.stringify(wishlistCache));
            } catch (_) {}
            notifyWishlistUpdated();
        } else {
            wishlistCache = [];
        }
    } catch (error) {
        console.warn('Wishlist sync unavailable:', error.message);
        try {
            const local = localStorage.getItem(`ph_wishlist_${userId}`);
            wishlistCache = local ? JSON.parse(local) : [];
        } catch (_) {
            wishlistCache = [];
        }
    }
}

export function getWishlist() {
    const userId = getWishlistUserId();
    if (wishlistCache !== null && Array.isArray(wishlistCache)) {
        return [...wishlistCache];
    }

    try {
        const local = localStorage.getItem(`ph_wishlist_${userId}`) || localStorage.getItem('ph_wishlist');
        wishlistCache = local ? JSON.parse(local).map(Number).filter(n => !isNaN(n)) : [];
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
    if (isNaN(id)) return;

    let wishlist = getWishlist();
    const idx = wishlist.indexOf(id);
    const userId = getWishlistUserId();
    let isAdded = false;

    if (idx > -1) {
        wishlist.splice(idx, 1);
        isAdded = false;
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-regular fa-heart';
            btn.classList.remove('active');
        }
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist.push(id);
        isAdded = true;
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-heart';
            btn.classList.add('active');
        }
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
    if (isNaN(id)) return;

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
                method: 'DELETE',
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

void hydrateWishlistFromServer();
