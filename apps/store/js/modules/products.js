import { isProductInWishlist } from './wishlist.js';

export function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products.length) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size:2.5rem;opacity:0.3;display:block;margin-bottom:12px;"></i>
            <p>No products found</p></div>`;
        return;
    }

    container.innerHTML = products.map(p => {
        const price = p.salePrice || p.price;
        const badgeHtml = p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase().replace(/\s/g, '-')}">${p.badge}</span>` : '';
        const salePriceHtml = p.salePrice ? `<span class="product-price-old">£${p.price.toFixed(2)}</span>` : '';
        const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
        const inWishlist = typeof isProductInWishlist === 'function' && isProductInWishlist(p.id);
        const heartClass = inWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const wishlistActiveClass = inWishlist ? 'active' : '';

        return `
<div class="product-card ${!p.inStock ? 'out-of-stock' : ''}" data-id="${p.id}" onclick="handleProductCardClick(event, ${p.id})">
            <div class="product-card-img">
                <a href="/product.html?id=${p.id}">
                    <img src="${p.image}" alt="${p.name}" loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=60'">
                </a>
                ${badgeHtml}
                <button class="product-wishlist ${wishlistActiveClass}" title="Add to wishlist" onclick="event.stopPropagation(); toggleWishlist(this, ${p.id})">
                    <i class="${heartClass}"></i>
                </button>
            </div>
            <div class="product-card-body">
                <div class="product-category">${p.category}</div>
                <a href="/product/${p.id}" onclick="event.stopPropagation();"><div class="product-name">${p.name}</div></a>
                <div class="product-weight"><i class="fa-solid fa-weight-hanging" style="font-size:0.7rem;margin-right:4px;"></i>${p.weight}</div>
                <div class="product-price-row">
                    <span class="product-price">£${price.toFixed(2)}</span>
                    ${salePriceHtml}
                </div>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span>(${p.reviews})</span>
                </div>
            </div>
            <div class="product-card-footer">
                <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})">
                    <i class="fa-solid fa-cart-plus"></i>
                    ${p.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>`;
    }).join('');

    // Add event listeners for product card clicks
    setTimeout(() => {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.product-wishlist') && !e.target.closest('.btn-add-cart')) {
                    const productId = this.getAttribute('data-id');
                    window.location.href = `/product/${productId}`;
                }
            });
        });
    }, 0);
}

export function renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = CATEGORIES.map((cat, i) => `
        <div class="category-card ${i === 0 ? 'cat-featured' : ''}" onclick="location.href='/shop?cat=${cat.id}'">
            <img src="${cat.image}" alt="${cat.name}" loading="lazy">
            <div class="category-card-overlay">
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
                <span class="shop-link">Shop Now →</span>
            </div>
        </div>`).join('');
}
