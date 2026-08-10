const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const storeDir = path.join(root, 'apps/store');

function processDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            if (content.includes('/shop.html')) {
                content = content.replace(/\/shop\.html/g, '/shop');
                updated = true;
            }
            if (content.includes('/product.html')) {
                content = content.replace(/\/product\.html/g, '/product');
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated links in: ${path.relative(root, fullPath)}`);
            }
        }
    }
}

processDir(storeDir);
console.log('Finished updating links in apps/store.');
