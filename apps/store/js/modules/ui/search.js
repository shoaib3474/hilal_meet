import { debounce } from '../utils.js';

export function doSearch(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) { resultsEl.innerHTML = ''; return; }

    const products = typeof getProducts === 'function' ? getProducts() : (window.PRODUCTS || []);
    const q = cleanQuery.toLowerCase();
    const matches = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 6);

    if (!matches.length) {
        resultsEl.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;margin:0;">No products found for "${cleanQuery}"</p>`;
        return;
    }

    resultsEl.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="location.href='/product.html?id=${p.id}'" role="button" tabindex="0">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&q=60'">
            <div style="min-width:0;flex:1;">
                <div class="name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
                <div class="price">£${Number(p.salePrice || p.price || 0).toFixed(2)} <span style="font-size:0.72rem;color:var(--text-muted);font-weight:normal;">${p.weight || ''}</span></div>
            </div>
        </div>`).join('');
}

export function initSearchOverlay() {
    const searchBtn = document.getElementById('searchBtn');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const closeBtn = document.getElementById('searchClose');
    if (!overlay) return;

    const openSearch = () => {
        overlay.classList.add('open');
        document.body.classList.add('search-overlay-open');
        overlay.scrollTop = 0;
        setTimeout(() => input?.focus(), 80);
    };

    const closeSearch = () => {
        overlay.classList.remove('open');
        document.body.classList.remove('search-overlay-open');
    };

    searchBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
    });

    closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        closeSearch();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSearch();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            closeSearch();
        }
    });

    input?.addEventListener('input', debounce(function () {
        doSearch(this.value);
    }, 200));

    input?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = this.value.trim();
            if (val) {
                window.location.href = `/shop.html?search=${encodeURIComponent(val)}`;
            }
        }
    });

    window.doSearch = doSearch;
    window.openSearchOverlay = openSearch;
    window.closeSearchOverlay = closeSearch;
}
