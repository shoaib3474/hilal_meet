import { adminToast, openModal, closeModal } from './ui.js';
import { updateDashboardStats } from './dashboard.js';
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from './api.js';

let editingProductId = null;
let productsCache = [];
let selectedDeviceImage = null; // { dataUrl, name, size }
let existingProductImage = null;

function parseGalleryUrls(value = '') {
    return value
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean)
        .filter((url, index, array) => array.indexOf(url) === index);
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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

export function initProductImageDropzone() {
    const dropzone = document.getElementById('galleryDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt?.files;
        if (files && files.length > 0) {
            handleGalleryFileSelect(files);
        }
    }, false);
}

export function triggerGalleryFilePicker() {
    const fileInput = document.getElementById('pGalleryFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

export async function handleGalleryFileSelect(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        adminToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
        return;
    }

    try {
        const compressedDataUrl = await compressImage(file, 1200, 0.85);
        selectedDeviceImage = {
            dataUrl: compressedDataUrl,
            name: file.name,
            size: file.size
        };

        const previewImg = document.getElementById('deviceImgPreview');
        const fileNameEl = document.getElementById('deviceFileName');
        const fileMetaEl = document.getElementById('deviceFileMeta');
        const previewCard = document.getElementById('devicePreviewCard');
        const dropzone = document.getElementById('galleryDropzone');

        if (previewImg) previewImg.src = compressedDataUrl;
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileMetaEl) fileMetaEl.textContent = `${formatFileSize(file.size)} • Ready to save`;
        if (previewCard) previewCard.style.display = 'flex';
        if (dropzone) dropzone.style.display = 'none';

        updateImageStatusUI();
    } catch (err) {
        console.error('Error processing gallery image:', err);
        adminToast('Failed to process device image', 'error');
    }
}

export function removeDeviceGalleryImage() {
    selectedDeviceImage = null;
    const fileInput = document.getElementById('pGalleryFileInput');
    if (fileInput) fileInput.value = '';

    const previewCard = document.getElementById('devicePreviewCard');
    const dropzone = document.getElementById('galleryDropzone');
    if (previewCard) previewCard.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';

    updateImageStatusUI();
}

export function onOnlineUrlInput(url) {
    const trimmed = (url || '').trim();
    const clearBtn = document.getElementById('btnClearUrl');
    const previewBox = document.getElementById('urlPreviewBox');
    const previewImg = document.getElementById('urlImgPreview');

    if (clearBtn) clearBtn.style.display = trimmed ? 'flex' : 'none';

    if (trimmed) {
        if (previewImg) previewImg.src = trimmed;
        if (previewBox) previewBox.style.display = 'flex';
    } else {
        if (previewBox) previewBox.style.display = 'none';
    }

    updateImageStatusUI();
}

export function clearOnlineUrl() {
    const urlInput = document.getElementById('pImage');
    if (urlInput) urlInput.value = '';
    onOnlineUrlInput('');
}

export function onUrlImageError() {
    const previewBox = document.getElementById('urlPreviewBox');
    if (previewBox) {
        previewBox.innerHTML = `
            <div style="font-size:0.75rem;color:var(--red);display:flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Unable to load image from URL
            </div>
        `;
    }
}

function updateImageStatusUI() {
    const urlInput = document.getElementById('pImage');
    const onlineUrl = urlInput ? urlInput.value.trim() : '';
    const hasDeviceImage = Boolean(selectedDeviceImage);
    const hasExistingImage = Boolean(editingProductId && existingProductImage && !onlineUrl && !hasDeviceImage);

    const cardOnline = document.getElementById('cardOnlineUrl');
    const cardGallery = document.getElementById('cardDeviceGallery');
    const urlBadge = document.getElementById('urlStatusBadge');
    const galleryBadge = document.getElementById('galleryStatusBadge');
    const reqBadge = document.getElementById('imageRequirementBadge');
    const section = document.getElementById('productImageSection');

    if (section) section.classList.remove('has-error');

    // Online URL Card State
    if (onlineUrl) {
        if (cardOnline) cardOnline.classList.add('active');
        if (urlBadge) {
            urlBadge.textContent = 'Provided';
            urlBadge.className = 'source-status-badge provided';
        }
    } else {
        if (cardOnline) cardOnline.classList.remove('active');
        if (urlBadge) {
            urlBadge.textContent = hasDeviceImage ? 'Optional (Gallery used)' : 'Optional';
            urlBadge.className = 'source-status-badge optional';
        }
    }

    // Device Gallery Card State
    if (hasDeviceImage) {
        if (cardGallery) cardGallery.classList.add('active');
        if (galleryBadge) {
            galleryBadge.textContent = 'Provided';
            galleryBadge.className = 'source-status-badge provided';
        }
    } else {
        if (cardGallery && !hasExistingImage) cardGallery.classList.remove('active');
        if (galleryBadge) {
            galleryBadge.textContent = onlineUrl ? 'Optional (URL used)' : 'Optional';
            galleryBadge.className = 'source-status-badge optional';
        }
    }

    // Top Requirement Badge
    if (onlineUrl || hasDeviceImage || hasExistingImage) {
        if (reqBadge) {
            reqBadge.textContent = '✓ Image provided';
            reqBadge.className = 'image-requirement-badge valid';
        }
    } else {
        if (reqBadge) {
            reqBadge.textContent = 'Provide either Online URL or Device Gallery Image';
            reqBadge.className = 'image-requirement-badge';
        }
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
    selectedDeviceImage = null;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pCategory').value = p.category || '';
    document.getElementById('pPrice').value = p.price || '';
    document.getElementById('pSalePrice').value = p.salePrice || '';
    document.getElementById('pWeight').value = p.weight || '';
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pBadge').value = p.badge || '';
    document.getElementById('pInStock').checked = Boolean(p.inStock);

    const urlInput = document.getElementById('pImage');
    const fileInput = document.getElementById('pGalleryFileInput');
    if (fileInput) fileInput.value = '';

    const previewCard = document.getElementById('devicePreviewCard');
    const dropzone = document.getElementById('galleryDropzone');

    if (p.image && p.image.startsWith('data:image/')) {
        // Device upload / base64 image
        if (urlInput) urlInput.value = '';
        onOnlineUrlInput('');
        const previewImg = document.getElementById('deviceImgPreview');
        const fileNameEl = document.getElementById('deviceFileName');
        const fileMetaEl = document.getElementById('deviceFileMeta');
        if (previewImg) previewImg.src = p.image;
        if (fileNameEl) fileNameEl.textContent = 'Current Product Image';
        if (fileMetaEl) fileMetaEl.textContent = 'Device gallery image saved';
        if (previewCard) previewCard.style.display = 'flex';
        if (dropzone) dropzone.style.display = 'none';
        selectedDeviceImage = { dataUrl: p.image, name: 'Current Image', size: 0 };
    } else if (p.image) {
        // Online URL image
        if (urlInput) urlInput.value = p.image;
        onOnlineUrlInput(p.image);
        if (previewCard) previewCard.style.display = 'none';
        if (dropzone) dropzone.style.display = 'flex';
    } else {
        if (urlInput) urlInput.value = '';
        onOnlineUrlInput('');
        if (previewCard) previewCard.style.display = 'none';
        if (dropzone) dropzone.style.display = 'flex';
    }

    updateImageStatusUI();
    openModal('productModal');
}

export function openAddProductModal() {
    editingProductId = null;
    existingProductImage = null;
    selectedDeviceImage = null;

    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm')?.reset();

    const fileInput = document.getElementById('pGalleryFileInput');
    if (fileInput) fileInput.value = '';

    const previewCard = document.getElementById('devicePreviewCard');
    const dropzone = document.getElementById('galleryDropzone');
    if (previewCard) previewCard.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';

    clearOnlineUrl();
    updateImageStatusUI();
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

    // Check standard required fields
    if (!name || !category || isNaN(price) || !weight) {
        adminToast('Please fill in all required fields (Name, Category, Price, Weight)', 'error');
        return;
    }

    // Dual Image Validation
    const onlineUrl = document.getElementById('pImage')?.value.trim() || '';
    const deviceImage = selectedDeviceImage?.dataUrl || '';
    const existingImg = (editingProductId && !onlineUrl && !deviceImage) ? existingProductImage : '';

    const primaryImage = deviceImage || onlineUrl || existingImg;

    if (!primaryImage) {
        adminToast('Please provide a product image (either an Online Image URL or select an image from your Device Gallery)', 'error');
        const section = document.getElementById('productImageSection');
        if (section) section.classList.add('has-error');
        const reqBadge = document.getElementById('imageRequirementBadge');
        if (reqBadge) {
            reqBadge.textContent = '⚠ Required: Provide URL or Device Image';
            reqBadge.className = 'image-requirement-badge error';
        }
        return;
    }

    try {
        // Construct gallery
        const gallery = [];
        if (deviceImage) gallery.push(deviceImage);
        if (onlineUrl && onlineUrl !== deviceImage) gallery.push(onlineUrl);
        if (gallery.length === 0 && existingImg) gallery.push(existingImg);

        const productData = {
            name, category, price, salePrice, weight, description,
            image: primaryImage,
            gallery: gallery.length ? gallery : [primaryImage],
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

