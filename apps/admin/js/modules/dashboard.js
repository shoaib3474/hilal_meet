import { capitalize, formatDate } from './utils.js';
import { adminToast, openModal } from './ui.js';
import { getProducts, getOrders, getCustomers } from './api.js';

export async function updateDashboardStats() {
    try {
        const products = await getProducts();
        const orders = await getOrders();
        const customers = await getCustomers();

        const revenue = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((s, o) => s + o.total, 0);
        const pending = orders.filter(o => o.status === 'pending').length;

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setEl('statRevenue', `£${revenue.toFixed(2)}`);
        setEl('statOrders', orders.length);
        setEl('statProducts', products.length);
        setEl('statCustomers', customers.length);
        setEl('statPending', pending);
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

export async function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    try {
        const orders = await getOrders();
        tbody.innerHTML = orders.slice().reverse().slice(0, 5).map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer.name}</td>
                <td>£${o.total.toFixed(2)}</td>
                <td><span class="status-badge status-${o.status}">${capitalize(o.status)}</span></td>
                <td><button class="btn btn-sm action-view btn-icon" onclick="location.href='/admin/orders.html'" title="View"><i class="fa-solid fa-eye"></i></button></td>
            </tr>`).join('');
    } catch (error) {
        console.error('Error rendering recent orders:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Failed to load recent orders</td></tr>`;
    }
}

export async function renderTopProducts() {
    const list = document.getElementById('topProductsList');
    if (!list) return;

    try {
        const products = await getProducts();
        list.innerHTML = products.slice(0, 5).map((p, i) => `
            <div class="top-item">
                <div class="top-item-rank">${i + 1}</div>
                <img class="top-item-img" src="${p.image}" alt="${p.name}"
                    onerror="this.src='https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100'">
                <div class="top-item-info">
                    <div class="top-item-name">${p.name}</div>
                    <div class="top-item-meta">£${p.price.toFixed(2)}</div>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error('Error rendering top products:', error);
        list.innerHTML = `<div style="text-align:center;color:red;">Failed to load top products</div>`;
    }
}

export async function renderActivity() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    try {
        const orders = await getOrders();
        const activities = orders.slice().reverse().slice(0, 5).map(o => ({
            text: `New order <strong>${o.id}</strong> from ${o.customer.name}`,
            time: o.date,
            type: o.status === 'cancelled' ? 'red' : o.status === 'delivered' ? '' : 'gold'
        }));

        feed.innerHTML = activities.map(a => `
            <div class="activity-item">
                <div class="activity-dot ${a.type}"></div>
                <div class="activity-text">
                    <div>${a.text}</div>
                    <div class="activity-time">${formatDate(a.time)}</div>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error('Error rendering activity feed:', error);
        feed.innerHTML = `<div style="text-align:center;color:red;">Failed to load activity feed</div>`;
    }
}

export function drawRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;

    const data = [1240, 1890, 1420, 2100, 1750, 2450, 1980];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const max = Math.max(...data);
    const w = canvas.offsetWidth || 600;
    const h = 240;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const points = data.map((v, i) => ({
        x: pad.left + (i / (data.length - 1)) * chartW,
        y: pad.top + chartH - (v / max) * chartH
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y} `).join(' ');
    const areaD = `${pathD} L${points[points.length - 1].x},${h - pad.bottom} L${points[0].x},${h - pad.bottom} Z`;

    canvas.innerHTML = `
    < svg viewBox = "0 0 ${w} ${h}" xmlns = "http://www.w3.org/2000/svg" style = "width:100%;height:${h}px;" >
        <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1B5E20" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#1B5E20" stop-opacity="0.02" />
            </linearGradient>
        </defs>
            ${[0, 0.25, 0.5, 0.75, 1].map(t => `
                <line x1="${pad.left}" y1="${pad.top + chartH * t}" x2="${w - pad.right}" y2="${pad.top + chartH * t}"
                    stroke="#E0E5E1" stroke-width="1" stroke-dasharray="4,4"/>
                <text x="${pad.left - 8}" y="${pad.top + chartH * t + 4}" text-anchor="end" font-size="11" fill="#7A7A7A">
                    £${Math.round(max * (1 - t))}
                </text>`).join('')
        }
            <path d="${areaD}" fill="url(#grad)"/>
            <path d="${pathD}" fill="none" stroke="#1B5E20" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#1B5E20" stroke="white" stroke-width="2"/>`).join('')}
            ${labels.map((l, i) => `
                <text x="${pad.left + (i / (data.length - 1)) * chartW}" y="${h - 8}"
                    text-anchor="middle" font-size="11" fill="#7A7A7A">${l}</text>`).join('')
        }
        </svg > `;
}
