import { formatDate } from './utils.js';
import { getCustomers } from './api.js';
import { adminToast } from './ui.js';

export async function renderCustomersTable(filter = '') {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    try {
        let customers = await getCustomers();

        if (filter) {
            const q = filter.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        if (!customers.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No customers found</td></tr>`;
            return;
        }

        tbody.innerHTML = customers.map(c => `
            <tr>
                <td>
                    <div class="customer-cell">
                        <div class="customer-avatar">${c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div class="info">
                            <div class="name">${c.name}</div>
                            <div class="email">${c.email}</div>
                        </div>
                    </div>
                </td>
                <td>${c.phone}</td>
                <td>${c.address}</td>
                <td>${formatDate(c.joined)}</td>
                <td><strong>${c.orders}</strong></td>
                <td><strong style="color:var(--primary);">£${c.spent.toFixed(2)}</strong></td>
            </tr>`).join('');
    } catch (error) {
        adminToast('Failed to load customers', 'error');
        console.error('Error loading customers:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:red;">Failed to load customers</td></tr>`;
    }
}
