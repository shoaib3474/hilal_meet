export function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');
    const closeBtn = document.getElementById('mobileNavClose');

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav?.classList.toggle('open');
        document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
    });
    overlay?.addEventListener('click', closeMobileNav);
    closeBtn?.addEventListener('click', closeMobileNav);
}

export function closeMobileNav() {
    document.getElementById('hamburger')?.classList.remove('open');
    document.getElementById('mobileNav')?.classList.remove('open');
    document.body.style.overflow = '';
}
