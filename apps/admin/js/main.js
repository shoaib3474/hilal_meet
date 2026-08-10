import * as auth from './modules/auth.js';
import * as ui from './modules/ui.js';
import * as utils from './modules/utils.js';
import * as products from './modules/products.js';
import * as orders from './modules/orders.js';
import * as customers from './modules/customers.js';
import * as dashboard from './modules/dashboard.js';

ui.initModalOverlay();

Object.assign(window, {
    ...auth,
    ...ui,
    ...utils,
    ...products,
    ...orders,
    ...customers,
    ...dashboard
});

document.addEventListener('DOMContentLoaded', () => {
    auth.checkAdminAuth();
    ui.initAdminSidebar();
});
