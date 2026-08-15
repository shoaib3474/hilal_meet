import {
    getCart,
    getCartTotal,
    saveCart,
    removeFromCart
} from './cart.js';

export function openCartSidebar() {
    document.getElementById('cartSidebar')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeCartSidebar() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

export function renderCartSidebar() {
    const body = document.getElementById('cartSidebarBody');
    const totalEl = document.getElementById('cartSidebarTotal');
    if (!body) return;

    const cart = getCart();
    if (cart.length === 0) {
        body.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
                <i class="fa-solid fa-basket-shopping" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:14px;"></i>
                <p style="font-weight:600;">Your cart is empty</p>
                <a href="/shop" onclick="closeCartSidebar()" class="btn btn-primary" style="margin-top:16px;display:inline-flex;">Shop Now</a>
            </div>`;
    } else {
        body.innerHTML = cart.map(item => `
            <div class="cart-sidebar-item" onclick="window.location.href='/product.html?id=${item.id}'" style="cursor:pointer;" title="View ${item.name}">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&q=60'">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-weight">${item.weight}</div>
                    <div class="item-price">£${(item.price * item.qty).toFixed(2)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;" onclick="event.stopPropagation();">
                        <div style="display:flex;align-items:center;border:1px solid var(--border);border-radius:6px;overflow:hidden;">
                            <button class="qty-btn" onclick="event.stopPropagation(); changeSidebarQty(${item.id}, -1)" style="width:26px;height:26px;background:none;border:none;cursor:pointer;font-size:0.9rem;">−</button>
                            <span style="width:28px;text-align:center;font-weight:600;font-size:0.85rem;">${item.qty}</span>
                            <button class="qty-btn" onclick="event.stopPropagation(); changeSidebarQty(${item.id}, 1)" style="width:26px;height:26px;background:none;border:none;cursor:pointer;font-size:0.9rem;">+</button>
                        </div>
                        <button onclick="event.stopPropagation(); removeFromCart(${item.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:0.85rem;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>`).join('');
    }

    if (totalEl) totalEl.textContent = `£${getCartTotal().toFixed(2)}`;
}

export function changeSidebarQty(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(1, item.qty + delta);
        saveCart(cart);
        renderCartSidebar();
    }
}

export function initCartSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (!sidebar) return;

    if (document.body.dataset.cartSidebarBound === 'true') {
        renderCartSidebar();
        return;
    }

    document.body.dataset.cartSidebarBound = 'true';
    overlay?.addEventListener('click', closeCartSidebar);
    window.addEventListener('cart:updated', renderCartSidebar);
    document.addEventListener('cart:updated', renderCartSidebar);
    renderCartSidebar();
}
