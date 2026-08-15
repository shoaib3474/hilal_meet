import { showToast } from './toast.js';

export function getCurrentUser() {
    const s = localStorage.getItem('ph_current_user');
    return s ? JSON.parse(s) : null;
}

export function setCurrentUser(user) {
    const prevWishlistGuestId = localStorage.getItem('ph_wishlist_session_id');
    const prevCartGuestId = localStorage.getItem('ph_cart_session_id');
    localStorage.setItem('ph_current_user', JSON.stringify(user));
    const newUserId = `user-${user?.id ?? user?.customerId ?? user?.email}`;
    const newCartSessionId = `cart-user-${user?.id ?? user?.customerId ?? user?.email}`;

    if (prevWishlistGuestId && typeof window !== 'undefined') {
        const cleanGuestWishlistId = `anon-${prevWishlistGuestId.replace(/^anon-/, '')}`;
        fetch('/api/wishlist/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestId: cleanGuestWishlistId, userId: newUserId })
        }).catch(() => {}).finally(() => {
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new Event('wishlist:updated'));
            }
        });
    }

    if (prevCartGuestId && typeof window !== 'undefined') {
        const cleanGuestCartId = `cart-anon-${prevCartGuestId.replace(/^cart-anon-/, '').replace(/^anon-/, '')}`;
        fetch('/api/cart/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestSessionId: cleanGuestCartId, userSessionId: newCartSessionId })
        }).catch(() => {}).finally(() => {
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new Event('cart:updated'));
            }
        });
    }
}

export function logout() {
    localStorage.removeItem('ph_current_user');

    // Hard clear cart UI/cache so logged-out users never see old cart items.
    try {
        if (typeof window !== 'undefined') {
            window.__cartCache = [];
            window.dispatchEvent?.(new Event('cart:updated'));
            window.dispatchEvent?.(new Event('wishlist:updated'));
        }
    } catch (_) {}

    showToast('Logged out successfully', 'info');
    setTimeout(() => { location.href = '/'; }, 800);
}

export function updateUserNav() {
    const user = getCurrentUser();
    document.querySelectorAll('.login-link').forEach(el => { el.style.display = user ? 'none' : ''; });
    document.querySelectorAll('.user-menu').forEach(el => { el.style.display = user ? '' : 'none'; });
    document.querySelectorAll('.user-display-name').forEach(el => {
        if (user) el.textContent = user.firstName || user.name;
    });
}
