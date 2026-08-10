export function adminToast(message, type = 'success') {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'admin-toast';
        document.body.appendChild(toast);
    }
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `<span style="font-size:1rem;">${icons[type] || icons.success}</span> ${message}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

export function openModal(id) {
    document.getElementById(id)?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
    document.body.style.overflow = '';
}

export function initAdminSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    toggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (
            sidebar?.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== toggle
        ) {
            sidebar.classList.remove('open');
        }
    });
}

export function initModalOverlay() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}
