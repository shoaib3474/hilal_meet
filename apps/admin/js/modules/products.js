import { adminToast, openModal, closeModal } from './ui.js';
import { updateDashboardStats } from './dashboard.js';
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from './api.js';

let editingProductId = null;
let productsCache = [];

function parseGalleryUrls(value = '') {
    return value
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean)
        .filter((url, index, array) => array.indexOf(url) === index);
}

function getTableFilters() {
    return {
        filter: document.getElementById('productSearch')?.value || '',
        category: document.getElementById('categoryFilter')?.value || ''
    };
}

export async function renderProductsTable(filter = '', category = '') {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        let products = await getProducts();
        productsCache = products;

        if (filter) {
            const q = filter.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
            );
        }
        if (category && category !== 'all') {
            products = products.filter(p => p.category === category);
        }

        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No products found</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <div class="product-img-cell">
                        <img class="product-thumb" src="${p.image}" alt="${p.name}"
                            onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100'">
                        <div class="product-info-cell">
                            <div class="name">${p.name}</div>
                            <div class="sku">ID: #${p.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="category-pill">${p.category}</span></td>
                <td><strong>£${(p.salePrice || p.price).toFixed(2)}</strong>${p.salePrice ? `<br><small style="text-decoration:line-through;color:var(--text-muted);">£${p.price.toFixed(2)}</small>` : ''}</td>
                <td>${p.weight}</td>
                <td>
                    <label class="toggle-switch">
                        <input type="checkbox" ${p.inStock ? 'checked' : ''} onchange="toggleStock(${p.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td><span class="status-badge ${p.inStock ? 'status-in-stock' : 'status-out-stock'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</span></td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm btn-icon action-edit" title="Edit" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-icon action-delete" title="Delete" onclick="confirmDeleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`).join('');
    } catch (error) {
        adminToast('Failed to load products', 'error');
        console.error('Error loading products:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:red;">Failed to load products</td></tr>`;
    }
}

export async function toggleStock(productId, inStock) {
    try {
        const product = productsCache.find(x => x.id === productId);
        if (!product) return;

        await updateProductStock(productId, inStock);
        adminToast(`${product.name} marked as ${inStock ? 'In Stock' : 'Out of Stock'}`, 'success');
        const { filter, category } = getTableFilters();
        await renderProductsTable(filter, category);
    } catch (error) {
        adminToast('Failed to update product stock', 'error');
        console.error('Error updating stock:', error);
        const { filter, category } = getTableFilters();
        await renderProductsTable(filter, category);
    }
}

export async function editProduct(productId) {
    const p = productsCache.find(x => x.id === productId);
    if (!p) return;
    editingProductId = productId;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pSalePrice').value = p.salePrice || '';
    document.getElementById('pWeight').value = p.weight;
    document.getElementById('pDescription').value = p.description;
    document.getElementById('pImage').value = p.image || '';
    document.getElementById('pGallery').value = Array.isArray(p.gallery) ? p.gallery.join('\n') : '';
    document.getElementById('pBadge').value = p.badge || '';
    document.getElementById('pInStock').checked = p.inStock;

    const preview = document.getElementById('imgPreview');
    if (preview) {
        preview.src = p.image;
        preview.style.display = 'block';
    }

    openModal('productModal');
}

export function openAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm')?.reset();
    const preview = document.getElementById('imgPreview');
    if (preview) preview.style.display = 'none';
    openModal('productModal');
}

export async function saveProduct() {
    const name = document.getElementById('pName').value.trim();
    const category = document.getElementById('pCategory').value;
    const price = parseFloat(document.getElementById('pPrice').value);
    const salePrice = parseFloat(document.getElementById('pSalePrice').value) || null;
    const weight = document.getElementById('pWeight').value.trim();
    const description = document.getElementById('pDescription').value.trim();
    const image = document.getElementById('pImage').value.trim();
    const galleryInput = document.getElementById('pGallery').value.trim();
    const gallery = parseGalleryUrls(galleryInput);
    const badge = document.getElementById('pBadge').value || null;
    const inStock = document.getElementById('pInStock').checked;

    if (!name || !category || !price || !weight) {
        adminToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const primaryImage = image || gallery[0] || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80';
        const productData = {
            name, category, price, salePrice, weight, description,
            image: primaryImage,
            gallery: gallery.length ? gallery : (image ? [image] : []),
            badge, inStock, featured: false, rating: 4.5, reviews: 0
        };

        if (editingProductId) {
            await updateProduct(editingProductId, productData);
            adminToast('Product updated successfully!', 'success');
        } else {
            await createProduct(productData);
            adminToast('Product added successfully!', 'success');
        }

        closeModal('productModal');
        const { filter, category: cat } = getTableFilters();
        await renderProductsTable(filter, cat);
        updateDashboardStats();
    } catch (error) {
        adminToast('Failed to save product', 'error');
        console.error('Error saving product:', error);
    }
}

export async function confirmDeleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This cannot be undone.')) {
        try {
            await deleteProduct(productId);
            adminToast('Product deleted', 'success');
            const { filter, category } = getTableFilters();
            await renderProductsTable(filter, category);
            updateDashboardStats();
        } catch (error) {
            adminToast('Failed to delete product', 'error');
            console.error('Error deleting product:', error);
        }
    }
}
