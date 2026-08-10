import { showToast } from './toast.js';

export function getWishlist() {
    return JSON.parse(localStorage.getItem('ph_wishlist') || '[]');
}

export function toggleWishlist(btn, productId) {
    let wishlist = getWishlist();
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        btn.querySelector('i').className = 'fa-regular fa-heart';
        btn.classList.remove('active');
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist.push(productId);
        btn.querySelector('i').className = 'fa-solid fa-heart';
        btn.classList.add('active');
        showToast('Added to wishlist!', 'success');
    }
    localStorage.setItem('ph_wishlist', JSON.stringify(wishlist));
}
