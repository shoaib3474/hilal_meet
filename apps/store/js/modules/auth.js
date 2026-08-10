import { showToast } from './toast.js';

export function getCurrentUser() {
    const s = localStorage.getItem('ph_current_user');
    return s ? JSON.parse(s) : null;
}

export function setCurrentUser(user) {
    localStorage.setItem('ph_current_user', JSON.stringify(user));
}

export function logout() {
    localStorage.removeItem('ph_current_user');

    // Hard clear cart UI/cache so logged-out users never see old cart items.
    try {
        if (typeof window !== 'undefined') {
            window.__cartCache = [];
            window.dispatchEvent?.(new Event('cart:updated'));
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
