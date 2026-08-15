// API utility functions for admin panel

export async function apiCall(method, endpoint, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(endpoint, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error.message);
        throw error;
    }
}

// Products API
export async function getProducts() {
    return apiCall('GET', '/api/products');
}

export async function createProduct(product) {
    return apiCall('POST', '/api/products', product);
}

export async function updateProduct(id, product) {
    return apiCall('PUT', `/api/products/${id}`, product);
}

export async function updateProductStock(id, inStock) {
    return apiCall('PATCH', `/api/products/${id}`, { inStock });
}

export async function deleteProduct(id) {
    return apiCall('DELETE', `/api/products/${id}`);
}

// Orders API
export async function getOrders() {
    return apiCall('GET', '/api/orders');
}

export async function getOrderStats() {
    return apiCall('GET', '/api/orders/stats');
}

export async function createOrder(order) {
    return apiCall('POST', '/api/orders', order);
}

export async function updateOrder(id, order) {
    return apiCall('PUT', `/api/orders/${id}`, order);
}

export async function deleteOrder(id) {
    return apiCall('DELETE', `/api/orders/${id}`);
}

// Customers API
export async function getCustomers() {
    return apiCall('GET', '/api/customers');
}
