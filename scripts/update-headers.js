const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../apps/store/pages');

const COMMON_HEADER = `<body>

    <!-- ANNOUNCEMENT BAR -->
    <div class="announcement-bar">
        📢 FREE Local Delivery on orders over £30 | Fresh Halal Meat, Poultry, Grocery &amp; Frozen Foods!
        <a href="/shop.html">Order Now ➔</a>
    </div>

    <!-- TOP BAR -->
    <div class="top-bar">
        <div class="container">
            <div class="top-bar-left">
                <a href="tel:02085035721"><i class="fa-solid fa-phone"></i> 020 8503 5721</a>
                <a href="mailto:info@pakeezahilalmeat.co.uk"><i class="fa-solid fa-envelope"></i> info@pakeezahilalmeat.co.uk</a>
                <span><i class="fa-solid fa-location-dot"></i> High Street North, E12 6SB</span>
            </div>
            <div class="top-bar-right">
                <a href="https://wa.me/442085035721" target="_blank"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
                <a href="/account.html"><i class="fa-regular fa-user"></i> My Account</a>
                <a href="/admin/" style="color:var(--gold-light);font-weight:600;"><i class="fa-solid fa-lock"></i> Admin</a>
            </div>
        </div>
    </div>

    <!-- HEADER -->
    <header class="site-header">
        <div class="container">
            <div class="header-inner">
                <a href="/index.html" class="logo">
                    <img src="/images/logo.svg" alt="Pakeeza Hilal Meat" class="header-logo-img">
                </a>

                <nav class="main-nav">
                    <a href="/index.html" class="nav-link">Home</a>
                    <div class="nav-dropdown">
                        <a href="/shop.html" class="nav-link">Shop <i class="fa-solid fa-chevron-down" style="font-size:0.65rem;margin-left:3px;"></i></a>
                        <div class="nav-dropdown-menu">
                            <a href="/shop.html?cat=chicken"><i class="fa-solid fa-drumstick-bite" style="width:20px;color:var(--primary);"></i> Chicken</a>
                            <a href="/shop.html?cat=lamb"><i class="fa-solid fa-bone" style="width:20px;color:var(--primary);"></i> Lamb</a>
                            <a href="/shop.html?cat=beef"><i class="fa-solid fa-cow" style="width:20px;color:var(--primary);"></i> Beef</a>
                            <a href="/shop.html?cat=goat"><i class="fa-solid fa-paw" style="width:20px;color:var(--primary);"></i> Goat</a>
                            <a href="/shop.html?cat=marinated"><i class="fa-solid fa-fire" style="width:20px;color:var(--gold);"></i> Marinated</a>
                            <a href="/shop.html?cat=offal"><i class="fa-solid fa-heart-pulse" style="width:20px;color:var(--red);"></i> Offal &amp; Extras</a>
                            <a href="/shop.html?cat=grocery"><i class="fa-solid fa-basket-shopping" style="width:20px;color:var(--primary);"></i> Grocery</a>
                            <a href="/shop.html?cat=frozen"><i class="fa-solid fa-snowflake" style="width:20px;color:#1565C0;"></i> Frozen Foods</a>
                        </div>
                    </div>
                    <a href="/about.html" class="nav-link">About</a>
                    <a href="/contact.html" class="nav-link">Contact</a>
                </nav>

                <div class="header-actions">
                    <button class="header-btn" id="searchBtn" title="Search">
                        <i class="fa-solid fa-search"></i>
                    </button>
                    <a href="/account.html" class="header-btn" title="My Account">
                        <i class="fa-regular fa-user"></i>
                    </a>
                    <button class="header-btn" id="cartBtn" title="Cart" onclick="openCartSidebar()">
                        <i class="fa-solid fa-basket-shopping"></i>
                        <span class="cart-badge cart-count" style="display:none;">0</span>
                    </button>
                    <div class="hamburger" id="hamburger">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- MOBILE NAV -->
    <div class="mobile-nav" id="mobileNav">
        <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>
        <div class="mobile-nav-drawer">
            <div class="mobile-nav-header">
                <div class="logo">
                    <img src="/images/logo-icon.svg" alt="Pakeeza Hilal Meat" class="mobile-logo-icon">
                    <div class="logo-text">
                        <div class="name" style="font-weight:700;font-size:0.9rem;color:var(--dark);">Pakeeza Hilal Meat</div>
                    </div>
                </div>
                <button id="mobileNavClose" style="background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="mobile-nav-links">
                <a href="/index.html"><i class="fa-solid fa-house"></i> Home</a>
                <a href="/shop.html"><i class="fa-solid fa-shop"></i> Shop All</a>
                <a href="/shop.html?cat=chicken"><i class="fa-solid fa-drumstick-bite"></i> Chicken</a>
                <a href="/shop.html?cat=lamb"><i class="fa-solid fa-bone"></i> Lamb</a>
                <a href="/shop.html?cat=beef"><i class="fa-solid fa-cow"></i> Beef</a>
                <a href="/shop.html?cat=goat"><i class="fa-solid fa-paw"></i> Goat</a>
                <a href="/shop.html?cat=marinated"><i class="fa-solid fa-fire"></i> Marinated</a>
                <a href="/shop.html?cat=offal"><i class="fa-solid fa-heart-pulse"></i> Offal &amp; Extras</a>
                <a href="/shop.html?cat=grocery"><i class="fa-solid fa-basket-shopping"></i> Grocery</a>
                <a href="/shop.html?cat=frozen"><i class="fa-solid fa-snowflake"></i> Frozen Foods</a>
                <a href="/about.html"><i class="fa-solid fa-circle-info"></i> About Us</a>
                <a href="/contact.html"><i class="fa-solid fa-envelope"></i> Contact</a>
                <a href="/account.html"><i class="fa-regular fa-user"></i> My Account</a>
                <a href="/cart.html" onclick="closeMobileNav()"><i class="fa-solid fa-basket-shopping"></i> My Cart</a>
            </div>
        </div>
    </div>

    <!-- SEARCH OVERLAY -->
    <div class="search-overlay" id="searchOverlay">
        <div class="search-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="font-size:1rem;font-weight:700;">Search Products</h3>
                <button id="searchClose" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--text-muted);"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="search-input-wrap">
                <input type="text" id="searchInput" placeholder="Search for chicken, lamb, beef..." autocomplete="off">
                <button class="btn btn-primary" onclick="doSearch(document.getElementById('searchInput').value)"><i class="fa-solid fa-search"></i></button>
            </div>
            <div id="searchResults" class="search-results-list"></div>
        </div>
    </div>

    <!-- CART SIDEBAR -->
    <div class="cart-sidebar-overlay" id="cartOverlay"></div>
    <div class="cart-sidebar" id="cartSidebar">
        <div class="cart-sidebar-header">
            <h3><i class="fa-solid fa-basket-shopping" style="color:var(--primary);margin-right:8px;"></i> My Cart</h3>
            <button onclick="closeCartSidebar()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;"><i class="fa-solid fa-times"></i></button>
        </div>
        <div class="cart-sidebar-body" id="cartSidebarBody"></div>
        <div class="cart-sidebar-footer">
            <div class="cart-sidebar-total">
                <span>Total:</span>
                <span id="cartSidebarTotal">£0.00</span>
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">🚚 Free delivery on orders over £30</p>
            <a href="/cart.html" class="btn btn-outline btn-block" style="margin-bottom:10px;">View Cart</a>
            <a href="/checkout.html" class="btn btn-primary btn-block">Checkout <i class="fa-solid fa-arrow-right"></i></a>
        </div>
    </div>

    `;

const TARGETS = [
    '<div class="page-hero">',
    '<!-- ============================================================',
    '<!-- BREADCRUMB -->',
    '<!-- PAGE HERO -->'
];

fs.readdirSync(PAGES_DIR).forEach(file => {
    if (!file.endsWith('.html') || file === 'reset-demo.html') return;
    const filePath = path.join(PAGES_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const bodyStartIdx = content.indexOf('<body>');
    if (bodyStartIdx === -1) {
        console.log(`Skipping ${file}: body tag not found`);
        return;
    }

    let targetIdx = -1;
    let foundTarget = '';
    for (const target of TARGETS) {
        const idx = content.indexOf(target);
        if (idx !== -1 && (targetIdx === -1 || idx < targetIdx)) {
            targetIdx = idx;
            foundTarget = target;
        }
    }

    if (targetIdx === -1) {
        console.log(`Skipping ${file}: content target start tag not found`);
        return;
    }

    // Replace everything between <body> and target
    const newContent = content.substring(0, bodyStartIdx) + COMMON_HEADER + content.substring(targetIdx);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Successfully updated headers in ${file}`);
});
