function getAdminCredentials() {
    if (typeof window !== 'undefined' && window.ADMIN_CREDENTIALS) {
        return window.ADMIN_CREDENTIALS;
    }
    if (typeof globalThis !== 'undefined' && globalThis.ADMIN_CREDENTIALS) {
        return globalThis.ADMIN_CREDENTIALS;
    }
    return null;
}

export function isAdminLoginPage() {
    const path = window.location.pathname.replace(/\/$/, '');
    return path === '/admin' || path === '/admin/index.html' || path.endsWith('/admin/index');
}

export function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('ph_admin_logged_in');
    if (!isLoggedIn && !isAdminLoginPage()) {
        window.location.href = '/admin/';
    }
}

export function adminLogin(email, password) {
    const ADMIN_CREDENTIALS = getAdminCredentials();
    if (!ADMIN_CREDENTIALS) {
        return false;
    }
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('ph_admin_logged_in', 'true');
        sessionStorage.setItem('ph_admin_email', email);
        return true;
    }
    return false;
}

export function adminLogout() {
    sessionStorage.removeItem('ph_admin_logged_in');
    sessionStorage.removeItem('ph_admin_email');
    window.location.href = '/admin/';
}
