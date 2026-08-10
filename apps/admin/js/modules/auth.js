export function isAdminLoginPage() {
    const path = window.location.pathname.replace(/\/$/, '');
    return path === '/admin' || path.endsWith('/admin/index');
}

export function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('ph_admin_logged_in');
    if (!isLoggedIn && !isAdminLoginPage()) {
        window.location.href = '/admin/';
    }
}

export function adminLogin(email, password) {
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
