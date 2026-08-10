/**
 * Assembles apps/store, apps/admin, and shared/ into public/ for local dev and deploy.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const src = path.join(srcDir, entry.name);
        const dest = path.join(destDir, entry.name);
        if (entry.isDirectory()) copyDir(src, dest);
        else copyFile(src, dest);
    }
}

function findExistingPath(candidates) {
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function cleanPublic() {
    if (fs.existsSync(publicDir)) {
        for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
            const entryPath = path.join(publicDir, entry.name);
            try {
                if (entry.isDirectory()) {
                    fs.rmSync(entryPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(entryPath);
                }
            } catch (err) {
                console.warn(`Could not delete ${entry.name}: ${err.message}`);
            }
        }
    }
}

function build() {
    cleanPublic();

    const storePages = path.join(root, 'apps/store/pages');
    for (const file of fs.readdirSync(storePages)) {
        if (file.endsWith('.html')) {
            copyFile(path.join(storePages, file), path.join(publicDir, file));
        }
    }

    const storeCss = findExistingPath([
        path.join(root, 'apps/store/css/style.css'),
        path.join(root, 'apps/store/assets/css/style.css')
    ]);
    if (storeCss) {
        copyFile(storeCss, path.join(publicDir, 'css/style.css'));
    }

    const storeJs = findExistingPath([
        path.join(root, 'apps/store/js'),
        path.join(root, 'apps/store/assets/js')
    ]);
    if (storeJs) {
        copyDir(storeJs, path.join(publicDir, 'js'));
    }

    copyFile(path.join(root, 'shared/js/data.js'), path.join(publicDir, 'js/data.js'));
    copyDir(path.join(root, 'shared/assets/images'), path.join(publicDir, 'images'));

    if (fs.existsSync(path.join(root, 'serve.json'))) {
        copyFile(path.join(root, 'serve.json'), path.join(publicDir, 'serve.json'));
    }

    const adminPages = path.join(root, 'apps/admin/pages');
    for (const file of fs.readdirSync(adminPages)) {
        if (file.endsWith('.html')) {
            copyFile(path.join(adminPages, file), path.join(publicDir, 'admin', file));
        }
    }

    const adminCss = findExistingPath([
        path.join(root, 'apps/admin/css/admin.css'),
        path.join(root, 'apps/admin/assets/css/admin.css')
    ]);
    if (adminCss) {
        copyFile(adminCss, path.join(publicDir, 'admin/css/admin.css'));
    }

    const adminJs = findExistingPath([
        path.join(root, 'apps/admin/js'),
        path.join(root, 'apps/admin/assets/js')
    ]);
    if (adminJs) {
        copyDir(adminJs, path.join(publicDir, 'admin/js'));
    }

    console.log('Built public/ from apps/store, apps/admin, and shared/');
}

build();
