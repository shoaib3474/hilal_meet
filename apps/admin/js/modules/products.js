import { adminToast, openModal, closeModal } from './ui.js';
import { updateDashboardStats } from './dashboard.js';
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from './api.js';

let editingProductId = null;
let productsCache = [];
let selectedGalleryImage = null;
let existingProductImage = null;

function compressImage(file, maxDimension = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function handleGalleryFile(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        adminToast('Please select a valid image file', 'error');
        return;
    }

    try {
        const dataUrl = await compressImage(file, 1200, 0.85);
        selectedGalleryImage = dataUrl;
        const img = document.getElementById('imgPreview');
        if (img) {
            img.src = dataUrl;
            img.style.display = 'block';
        }
    } catch (error) {
        console.error('Error reading gallery image:', error);
        adminToast('Failed to load gallery image', 'error');
    }
}

export function previewImage(url) {
    const img = document.getElementById('imgPreview');
    if (!img) return;
    if (url) {
        img.src = url;
        img.style.display = 'block';
    } else if (selectedGalleryImage) {
        img.src = selectedGalleryImage;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
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
    existingProductImage = p.image || null;
    selectedGalleryImage = null;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pCategory').value = p.category || '';
    document.getElementById('pPrice').value = p.price || '';
    document.getElementById('pSalePrice').value = p.salePrice || '';
    document.getElementById('pWeight').value = p.weight || '';
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pBadge').value = p.badge || '';
    document.getElementById('pInStock').checked = Boolean(p.inStock);

    const imageInput = document.getElementById('pImage');
    const galleryInput = document.getElementById('pGallery');
    if (galleryInput) galleryInput.value = '';

    if (imageInput) {
        imageInput.value = p.image && !p.image.startsWith('data:') ? p.image : '';
    }

    const preview = document.getElementById('imgPreview');
    if (preview) {
        if (p.image) {
            preview.src = p.image;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    openModal('productModal');
}

export function openAddProductModal() {
    editingProductId = null;
    existingProductImage = null;
    selectedGalleryImage = null;

    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm')?.reset();
    const preview = document.getElementById('imgPreview');
    if (preview) preview.style.display = 'none';
    openModal('productModal');
}

export async function saveProduct() {
    const name = document.getElementById('pName')?.value.trim() || '';
    const category = document.getElementById('pCategory')?.value || '';
    const price = parseFloat(document.getElementById('pPrice')?.value);
    const salePrice = parseFloat(document.getElementById('pSalePrice')?.value) || null;
    const weight = document.getElementById('pWeight')?.value.trim() || '';
    const description = document.getElementById('pDescription')?.value.trim() || '';
    const badge = document.getElementById('pBadge')?.value || null;
    const inStock = document.getElementById('pInStock')?.checked ?? true;

    // Check required basic fields
    if (!name || !category || isNaN(price) || !weight) {
        adminToast('Please fill in all required fields (Name, Category, Price, Weight)', 'error');
        return;
    }

    // Dual Image Validation (either Online URL OR Gallery image)
    const onlineUrl = document.getElementById('pImage')?.value.trim() || '';
    const galleryImage = selectedGalleryImage || (editingProductId && !onlineUrl ? existingProductImage : null);

    const primaryImage = onlineUrl || galleryImage;

    if (!primaryImage) {
        adminToast('Please provide an Online Image URL or choose a Gallery Image from your device', 'error');
        return;
    }

    try {
        const productData = {
            name, category, price, salePrice, weight, description,
            image: primaryImage,
            gallery: [primaryImage],
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
        adminToast('Failed to save product: ' + (error.message || 'Unknown error'), 'error');
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
