import { capitalize, formatDate } from './utils.js';
import { adminToast, openModal } from './ui.js';
import { getOrders, updateOrder, deleteOrder as deleteOrderApi } from './api.js';

let ordersCache = [];

export async function renderOrdersTable(filter = '', status = '') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    try {
        let orders = await getOrders();
        ordersCache = orders;

        if (filter) {
            const q = filter.toLowerCase();
            orders = orders.filter(o =>
                o.id.toLowerCase().includes(q) ||
                o.customer.name.toLowerCase().includes(q) ||
                o.customer.email.toLowerCase().includes(q)
            );
        }
        if (status && status !== 'all') {
            orders = orders.filter(o => o.status === status);
        }

        orders = orders.slice().reverse();

        if (!orders.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No orders found</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>
                    <div class="customer-cell">
                        <div class="customer-avatar">${o.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div class="info">
                            <div class="name">${o.customer.name}</div>
                            <div class="email">${o.customer.email}</div>
                        </div>
                    </div>
                </td>
                <td>${formatDate(o.date)}</td>
                <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
                <td><strong>£${o.total.toFixed(2)}</strong></td>
                <td>
                    <select class="form-control form-control-sm" style="width:130px;" onchange="updateOrderStatus('${o.id}', this.value)">
                        ${['pending', 'processing', 'delivered', 'cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
        ).join('')}
                    </select>
                </td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm btn-icon action-view" title="View" onclick="viewOrder('${o.id}')"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-sm btn-icon action-delete" title="Delete" onclick="deleteOrder('${o.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`).join('');
    } catch (error) {
        adminToast('Failed to load orders', 'error');
        console.error('Error loading orders:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:red;">Failed to load orders</td></tr>`;
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        await updateOrder(orderId, { status });
        const order = ordersCache.find(o => o.id === orderId);
        if (order) {
            adminToast(`Order ${orderId} marked as ${capitalize(status)}`, 'success');
        }
    } catch (error) {
        adminToast('Failed to update order status', 'error');
        console.error('Error updating order status:', error);
    }
}

export async function viewOrder(orderId) {
    const o = ordersCache.find(x => x.id === orderId);
    if (!o) {
        // Try to fetch from API if not in cache
        try {
            const orders = await getOrders();
            const order = orders.find(x => x.id === orderId);
            if (!order) return;
        } catch (error) {
            return;
        }
    }

    const body = document.getElementById('orderDetailBody');
    if (!body) return;

    body.innerHTML = `
        <div class="order-detail-grid">
            <div class="order-info-block">
                <div class="block-label">Order Details</div>
                <div class="block-value">
                    <strong>Order ID:</strong> ${o.id}<br>
                    <strong>Date:</strong> ${formatDate(o.date)}<br>
                    <strong>Payment:</strong> ${capitalize(o.paymentMethod || 'card')}<br>
                    <strong>Delivery:</strong> ${o.delivery === 0 ? 'Free' : '£' + o.delivery.toFixed(2)}
                </div>
            </div>
            <div class="order-info-block">
                <div class="block-label">Customer</div>
                <div class="block-value">
                    <strong>${o.customer.name}</strong><br>
                    ${o.customer.email}<br>
                    ${o.customer.phone}<br>
                    ${o.address}
                </div>
            </div>
        </div>
        <table class="order-items-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
                ${o.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td>£${item.price.toFixed(2)}</td>
                        <td>£${(item.qty * item.price).toFixed(2)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>
        <div class="order-totals" style="margin-top:16px;padding:12px;background:var(--bg);border-radius:var(--radius);">
            <div class="total-row">Subtotal: <strong>£${o.subtotal.toFixed(2)}</strong></div>
            <div class="total-row">Delivery: <strong>${o.delivery === 0 ? 'Free' : '£' + o.delivery.toFixed(2)}</strong></div>
            <div class="total-row grand">Total: <strong>£${o.total.toFixed(2)}</strong></div>
        </div>
        <div style="margin-top:16px;">
            <label style="font-size:0.82rem;font-weight:600;">Update Status:</label>
            <select class="form-control" style="width:200px;margin-top:6px;" id="orderStatusSelect" onchange="updateOrderStatus('${o.id}', this.value)">
                ${['pending', 'processing', 'delivered', 'cancelled'].map(s =>
        `<option value="${s}" ${o.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
    ).join('')}
            </select>
        </div>`;

    openModal('orderModal');
}

export async function deleteOrder(orderId) {
    if (confirm('Delete this order?')) {
        try {
            await deleteOrderApi(orderId);
            adminToast('Order deleted', 'success');
            await renderOrdersTable();
        } catch (error) {
            adminToast('Failed to delete order', 'error');
            console.error('Error deleting order:', error);
        }
    }
}
