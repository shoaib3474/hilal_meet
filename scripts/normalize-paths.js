/**
 * One-time path normalizer for modular app structure (root-absolute URLs).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (/\.(html|js)$/.test(entry.name)) files.push(full);
    }
    return files;
}

function applyReplacements(content, replacements) {
    let result = content;
    for (const [from, to] of replacements) {
        result = result.split(from).join(to);
    }
    return result;
}

const storeReplacements = [
    ['href="css/', 'href="/css/'],
    ['src="css/', 'src="/css/'],
    ['src="js/', 'src="/js/'],
    ['href="images/', 'href="/images/'],
    ['src="images/', 'src="/images/'],
    ['href="index.html', 'href="/index.html'],
    ['href="shop.html', 'href="/shop.html'],
    ['href="cart.html', 'href="/cart.html'],
    ['href="checkout.html', 'href="/checkout.html'],
    ['href="account.html', 'href="/account.html'],
    ['href="product.html', 'href="/product.html'],
    ['href="about.html', 'href="/about.html'],
    ['href="contact.html', 'href="/contact.html'],
    ['href="reset-demo.html', 'href="/reset-demo.html'],
    ['href="admin/index.html', 'href="/admin/'],
    ["location.href = 'index.html'", "location.href = '/'"],
    ["window.location.href = 'index.html'", "window.location.href = '/'"],
];

const adminReplacements = [
    ['href="../css/', 'href="/admin/css/'],
    ['src="../css/', 'src="/admin/css/'],
    ['src="../js/data.js"', 'src="/js/data.js"'],
    ['src="../js/admin.js"', 'src="/admin/js/admin.js"'],
    ['src="../images/', 'src="/images/'],
    ['href="../index.html"', 'href="/"'],
    ['href="../shop.html"', 'href="/shop.html"'],
    ['href="dashboard.html"', 'href="/admin/dashboard.html"'],
    ['href="orders.html"', 'href="/admin/orders.html"'],
    ['href="products.html"', 'href="/admin/products.html"'],
    ['href="customers.html"', 'href="/admin/customers.html"'],
];

const mainJsReplacements = [
    ["location.href='product.html", "location.href='/product.html"],
    ["location.href='shop.html", "location.href='/shop.html"],
    ["location.href = 'index.html'", "location.href = '/'"],
];

const adminJsReplacements = [
    ["location.href='orders.html'", "location.href='/admin/orders.html'"],
];

function normalize() {
    const storeDir = path.join(root, 'apps/store');
    const adminDir = path.join(root, 'apps/admin');

    for (const file of walk(storeDir)) {
        const content = fs.readFileSync(file, 'utf8');
        fs.writeFileSync(file, applyReplacements(content, storeReplacements));
    }

    for (const file of walk(adminDir)) {
        let content = fs.readFileSync(file, 'utf8');
        content = applyReplacements(content, adminReplacements);
        if (file.endsWith('admin.js')) {
            content = applyReplacements(content, adminJsReplacements);
        }
        fs.writeFileSync(file, content);
    }

    const mainJs = path.join(storeDir, 'assets/js/main.js');
    if (fs.existsSync(mainJs)) {
        const content = fs.readFileSync(mainJs, 'utf8');
        fs.writeFileSync(mainJs, applyReplacements(content, mainJsReplacements));
    }

    console.log('Normalized paths in apps/store and apps/admin');
}

normalize();
