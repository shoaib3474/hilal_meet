import { debounce } from '../utils.js';

export function doSearch(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;
    if (!query.trim()) { resultsEl.innerHTML = ''; return; }

    const products = getProducts();
    const q = query.toLowerCase();
    const matches = products.filter(p =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!matches.length) {
        resultsEl.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No products found for "${query}"</p>`;
        return;
    }

    resultsEl.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="location.href='/product/${p.id}'">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&q=60'">
            <div>
                <div class="name">${p.name}</div>
                <div class="price">£${(p.salePrice || p.price).toFixed(2)} <span style="font-size:0.72rem;color:var(--text-muted);">${p.weight}</span></div>
            </div>
        </div>`).join('');
}

export function initSearchOverlay() {
    const searchBtn = document.getElementById('searchBtn');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const closeBtn = document.getElementById('searchClose');
    if (!overlay) return;

    searchBtn?.addEventListener('click', () => {
        overlay.classList.add('open');
        setTimeout(() => input?.focus(), 100);
    });
    closeBtn?.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
    });

    input?.addEventListener('input', debounce(function () {
        doSearch(this.value);
    }, 250));
}
