import * as cart from './modules/cart.js';
import * as cartSidebar from './modules/cart-sidebar.js';
import * as auth from './modules/auth.js';
import * as wishlist from './modules/wishlist.js';
import * as products from './modules/products.js';
import * as toast from './modules/toast.js';
import * as utils from './modules/utils.js';
import { initHeroSlider } from './modules/ui/hero-slider.js';
import { initMobileNav, closeMobileNav } from './modules/ui/mobile-nav.js';
import { initSearchOverlay, doSearch } from './modules/ui/search.js';
import { initStickyHeader } from './modules/ui/sticky-header.js';
import { highlightActiveNav } from './modules/ui/nav.js';
import { initCountdown } from './modules/ui/countdown.js';

function addToCart(productId, qty = 1) {
    if (cart.addToCart(productId, qty)) {
        cartSidebar.renderCartSidebar();
        cartSidebar.openCartSidebar();
    }
}

function removeFromCart(productId) {
    cart.removeFromCart(productId);
    cartSidebar.renderCartSidebar();
}

function initAll() {
    cart.updateCartCount();
    wishlist.updateWishlistCount();
    void wishlist.hydrateWishlistFromServer();
    initMobileNav();
    initSearchOverlay();
    cartSidebar.initCartSidebar();
    initHeroSlider();
    initStickyHeader();
    initCountdown();
    highlightActiveNav();
}

Object.assign(window, {
    ...cart,
    ...auth,
    ...wishlist,
    ...products,
    ...toast,
    ...utils,
    ...cartSidebar,
    addToCart,
    removeFromCart,
    doSearch,
    closeMobileNav,
    initAll
});

document.addEventListener('DOMContentLoaded', initAll);
