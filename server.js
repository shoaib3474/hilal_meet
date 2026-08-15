const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { pool, initializeDatabase, SEED_PRODUCTS } = require('./db');

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

let databaseReady = false;

function parseOrderRow(row) {
    return {
        id: row.id,
        date: row.order_date ? row.order_date.toISOString().split('T')[0] : '',
        status: row.status,
        customer: {
            name: row.customer_name,
            email: row.customer_email,
            phone: row.customer_phone
        },
        items: row.items || [],
        subtotal: Number(row.subtotal || 0),
        delivery: Number(row.delivery || 0),
        total: Number(row.total || 0),
        address: row.address,
        paymentMethod: row.payment_method,
        notes: row.notes || ''
    };
}

function parseProductRow(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price || 0),
        salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
        weight: row.weight,
        image: row.image,
        gallery: Array.isArray(row.gallery) ? row.gallery : [],
        description: row.description,
        badge: row.badge,
        inStock: row.in_stock,
        featured: row.featured,
        rating: Number(row.rating || 4.5),
        reviews: Number(row.reviews || 0)
    };
}

function getFallbackProducts() {
    return (SEED_PRODUCTS || []).map((p, idx) => ({
        id: p.id || idx + 1,
        name: p.name,
        category: p.category,
        price: Number(p.price || 0),
        salePrice: p.salePrice !== null && p.salePrice !== undefined ? Number(p.salePrice) : null,
        weight: p.weight || '',
        image: p.image || '',
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        description: p.description || '',
        badge: p.badge || null,
        inStock: p.inStock !== false,
        featured: Boolean(p.featured),
        rating: Number(p.rating || 4.5),
        reviews: Number(p.reviews || 0)
    }));
}

function getCartSessionId(req) {
    return req.query?.sessionId || req.get('x-cart-session-id') || req.get('x-cart-session') || '';
}

function getWishlistUserId(req) {
    return req.query?.userId || req.body?.userId || req.get('x-user-id') || req.get('x-wishlist-user-id') || '';
}

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({
            status: 'ok',
            database: 'postgres',
            time: result.rows[0].current_time,
            connected: true
        });
    } catch (error) {
        res.status(503).json({
            status: 'degraded',
            database: 'postgres',
            connected: false,
            message: error.message
        });
    }
});

const inMemoryWishlists = new Map();

app.get('/api/wishlist', async (req, res) => {
    const userId = getWishlistUserId(req);
    if (!userId) {
        return res.json({ userId: '', productIds: [] });
    }

    try {
        const { rows } = await pool.query(
            'SELECT user_id, product_ids FROM wishlists WHERE user_id = $1',
            [userId]
        );
        const rawIds = rows[0] && Array.isArray(rows[0].product_ids) ? rows[0].product_ids : [];
        const productIds = Array.from(new Set(rawIds.map(Number))).filter(n => !isNaN(n) && n > 0);
        inMemoryWishlists.set(userId, productIds);
        res.json({ userId, productIds });
    } catch (error) {
        const raw = inMemoryWishlists.get(userId) || [];
        const productIds = Array.from(new Set(raw.map(Number))).filter(n => !isNaN(n) && n > 0);
        res.json({ userId, productIds });
    }
});

app.post('/api/wishlist/toggle', async (req, res) => {
    const userId = getWishlistUserId(req);
    const productId = parseInt(req.body?.productId);

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Valid product id is required' });
    }

    let productIds = inMemoryWishlists.get(userId) || [];

    try {
        const { rows } = await pool.query(
            'SELECT product_ids FROM wishlists WHERE user_id = $1',
            [userId]
        );
        if (rows[0] && Array.isArray(rows[0].product_ids)) {
            productIds = rows[0].product_ids;
        }
    } catch (_) {}

    productIds = Array.from(new Set(productIds.map(Number))).filter(n => !isNaN(n) && n > 0);
    const idx = productIds.indexOf(productId);
    let action = '';

    if (idx > -1) {
        productIds = productIds.filter(id => id !== productId);
        action = 'removed';
    } else {
        productIds.push(productId);
        action = 'added';
    }

    inMemoryWishlists.set(userId, productIds);

    try {
        await pool.query(
            `INSERT INTO wishlists (user_id, product_ids, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET
                 product_ids = EXCLUDED.product_ids,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId, JSON.stringify(productIds)]
        );
    } catch (_) {}

    res.json({ userId, productIds, action, inWishlist: action === 'added' });
});

app.put('/api/wishlist', async (req, res) => {
    const userId = getWishlistUserId(req);
    const rawIds = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    const productIds = Array.from(new Set(rawIds.map(Number))).filter(n => !isNaN(n) && n > 0);

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }

    inMemoryWishlists.set(userId, productIds);

    try {
        await pool.query(
            `INSERT INTO wishlists (user_id, product_ids, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET
                 product_ids = EXCLUDED.product_ids,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId, JSON.stringify(productIds)]
        );
    } catch (_) {}

    res.json({ userId, productIds });
});

const handleClearWishlist = async (req, res) => {
    const userId = getWishlistUserId(req);
    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }

    inMemoryWishlists.set(userId, []);

    try {
        await pool.query(
            `INSERT INTO wishlists (user_id, product_ids, updated_at)
             VALUES ($1, '[]'::jsonb, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET
                 product_ids = '[]'::jsonb,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId]
        );
    } catch (_) {}

    res.json({ userId, productIds: [] });
};

app.delete('/api/wishlist/clear', handleClearWishlist);
app.post('/api/wishlist/clear', handleClearWishlist);

app.get('/api/cart', async (req, res) => {
    try {
        const sessionId = getCartSessionId(req);
        if (!sessionId) {
            return res.json({ sessionId: '', items: [] });
        }

        const { rows } = await pool.query(
            'SELECT session_id, items FROM carts WHERE session_id = $1',
            [sessionId]
        );

        const items = rows[0] && Array.isArray(rows[0].items) ? rows[0].items : [];
        res.json({ sessionId, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/cart', async (req, res) => {
    try {
        const sessionId = req.body?.sessionId || getCartSessionId(req);
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        if (!sessionId) {
            return res.status(400).json({ error: 'Session id is required' });
        }

        await pool.query(
            `INSERT INTO carts (session_id, items, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (session_id) DO UPDATE SET
                 items = EXCLUDED.items,
                 updated_at = CURRENT_TIMESTAMP`,
            [sessionId, JSON.stringify(items)]
        );

        res.json({ sessionId, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews FROM products ORDER BY id ASC'
        );
        if (rows && rows.length > 0) {
            return res.json(rows.map(parseProductRow));
        }
    } catch (error) {
        console.warn('DB query for products failed, falling back to seed catalog:', error.message);
    }
    res.json(getFallbackProducts());
});

app.get('/api/products/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const { rows } = await pool.query(
            'SELECT id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews FROM products WHERE id = $1',
            [id]
        );
        if (rows && rows.length > 0) {
            return res.json(parseProductRow(rows[0]));
        }
    } catch (error) {
        console.warn('DB query for product by id failed:', error.message);
    }
    const all = getFallbackProducts();
    const found = all.find(p => p.id === id);
    if (found) {
        return res.json(found);
    }
    res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', async (req, res) => {
    try {
        const product = req.body;
        if (!product.name || !product.category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }
        const { rows } = await pool.query(
            `INSERT INTO products (name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews`,
            [
                product.name,
                product.category,
                Number(product.price || 0),
                product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null,
                product.weight || '',
                product.image || '',
                JSON.stringify(product.gallery || []),
                product.description || '',
                product.badge || null,
                Boolean(product.inStock),
                Boolean(product.featured),
                Number(product.rating || 4.5),
                Number(product.reviews || 0)
            ]
        );
        res.json(parseProductRow(rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const product = req.body;
        const id = parseInt(req.params.id);
        const { rows } = await pool.query(
            `UPDATE products SET name = $1, category = $2, price = $3, sale_price = $4, weight = $5, image = $6, gallery = $7, description = $8, badge = $9, in_stock = $10, featured = $11, rating = $12, reviews = $13
             WHERE id = $14
             RETURNING id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews`,
            [
                product.name,
                product.category,
                Number(product.price || 0),
                product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null,
                product.weight || '',
                product.image || '',
                JSON.stringify(product.gallery || []),
                product.description || '',
                product.badge || null,
                Boolean(product.inStock),
                Boolean(product.featured),
                Number(product.rating || 4.5),
                Number(product.reviews || 0),
                id
            ]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(parseProductRow(rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/products/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { inStock } = req.body;
        const { rows } = await pool.query(
            `UPDATE products SET in_stock = $1
             WHERE id = $2
             RETURNING id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews`,
            [Boolean(inStock), id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(parseProductRow(rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { rows } = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING id',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products', async (req, res) => {
    try {
        const payload = Array.isArray(req.body) ? req.body : [];
        await pool.query('DELETE FROM products');
        for (const product of payload) {
            await pool.query(
                `INSERT INTO products (name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    product.name,
                    product.category,
                    Number(product.price || 0),
                    product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null,
                    product.weight || '',
                    product.image || '',
                    JSON.stringify(product.gallery || []),
                    product.description || '',
                    product.badge || null,
                    Boolean(product.inStock),
                    Boolean(product.featured),
                    Number(product.rating || 4.5),
                    Number(product.reviews || 0)
                ]
            );
        }
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items FROM orders ORDER BY created_at ASC'
        );
        res.json(rows.map(parseOrderRow));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order = req.body;
        if (!order || !order.id) {
            return res.status(400).json({ error: 'Order payload is required' });
        }
        await pool.query(
            `INSERT INTO orders (id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
                 order_date = EXCLUDED.order_date,
                 status = EXCLUDED.status,
                 customer_name = EXCLUDED.customer_name,
                 customer_email = EXCLUDED.customer_email,
                 customer_phone = EXCLUDED.customer_phone,
                 address = EXCLUDED.address,
                 subtotal = EXCLUDED.subtotal,
                 delivery = EXCLUDED.delivery,
                 total = EXCLUDED.total,
                 payment_method = EXCLUDED.payment_method,
                 notes = EXCLUDED.notes,
                 items = EXCLUDED.items`,
            [
                order.id,
                order.date,
                order.status || 'pending',
                order.customer?.name || '',
                order.customer?.email || '',
                order.customer?.phone || '',
                order.address || '',
                Number(order.subtotal || 0),
                Number(order.delivery || 0),
                Number(order.total || 0),
                order.paymentMethod || 'card',
                order.notes || '',
                JSON.stringify(order.items || [])
            ]
        );
        await pool.query(
            `INSERT INTO customers (name, email, phone, address, joined, orders_count, spent)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, 1, $5)
             ON CONFLICT (email) DO UPDATE SET
                 name = EXCLUDED.name,
                 phone = EXCLUDED.phone,
                 address = EXCLUDED.address,
                 orders_count = customers.orders_count + 1,
                 spent = customers.spent + EXCLUDED.spent`,
            [
                order.customer?.name || '',
                order.customer?.email || '',
                order.customer?.phone || '',
                order.address || '',
                Number(order.total || 0)
            ]
        );
        res.json(parseOrderRow({
            id: order.id,
            order_date: new Date(order.date),
            status: order.status || 'pending',
            customer_name: order.customer?.name || '',
            customer_email: order.customer?.email || '',
            customer_phone: order.customer?.phone || '',
            address: order.address || '',
            subtotal: Number(order.subtotal || 0),
            delivery: Number(order.delivery || 0),
            total: Number(order.total || 0),
            payment_method: order.paymentMethod || 'card',
            notes: order.notes || '',
            items: order.items || []
        }));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        const { rows } = await pool.query(
            `UPDATE orders SET status = $1
             WHERE id = $2
             RETURNING id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items`,
            [status, orderId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(parseOrderRow(rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { rows } = await pool.query(
            'DELETE FROM orders WHERE id = $1 RETURNING id',
            [orderId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully', id: orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders', async (req, res) => {
    try {
        const payload = Array.isArray(req.body) ? req.body : [];
        await pool.query('DELETE FROM orders');
        for (const order of payload) {
            await pool.query(
                `INSERT INTO orders (id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    order.id,
                    order.date,
                    order.status || 'pending',
                    order.customer?.name || '',
                    order.customer?.email || '',
                    order.customer?.phone || '',
                    order.address || '',
                    Number(order.subtotal || 0),
                    Number(order.delivery || 0),
                    Number(order.total || 0),
                    order.paymentMethod || 'card',
                    order.notes || '',
                    JSON.stringify(order.items || [])
                ]
            );
        }
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/customers', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, phone, address, joined, orders_count, spent FROM customers ORDER BY id ASC'
        );
        res.json(rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            joined: row.joined ? row.joined.toISOString().split('T')[0] : '',
            orders: Number(row.orders_count || 0),
            spent: Number(row.spent || 0)
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/customers', async (req, res) => {
    try {
        const payload = Array.isArray(req.body) ? req.body : [];
        await pool.query('DELETE FROM customers');
        for (const customer of payload) {
            await pool.query(
                `INSERT INTO customers (name, email, phone, address, joined, orders_count, spent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [customer.name, customer.email, customer.phone, customer.address, customer.joined || '', Number(customer.orders || 0), Number(customer.spent || 0)]
            );
        }
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();

    const publicDir = path.join(__dirname, 'public');
    const pathname = req.path === '/' ? '/index.html' : req.path;
    const cleanPath = pathname.replace(/\/+$/, '');

    const routeMap = {
        '/about': 'about.html',
        '/account': 'account.html',
        '/cart': 'cart.html',
        '/checkout': 'checkout.html',
        '/contact': 'contact.html',
        '/product': 'product.html',
        '/reset-demo': 'reset-demo.html',
        '/shop': 'shop.html',
        '/wishlist': 'wishlist.html'
    };

    const firstSegment = cleanPath.split('/').filter(Boolean)[0];
    const directMatch = routeMap[cleanPath] || routeMap[`/${firstSegment}`];

    if (directMatch) {
        return res.sendFile(path.join(publicDir, directMatch));
    }

    const candidate = path.join(publicDir, `${cleanPath}.html`);
    if (fs.existsSync(candidate)) {
        return res.sendFile(candidate);
    }

    if (cleanPath === '/index.html' || cleanPath === '/') {
        return res.sendFile(path.join(publicDir, 'index.html'));
    }

    return res.sendFile(path.join(publicDir, 'index.html'));
});

async function startServer() {
    try {
        await initializeDatabase();
        databaseReady = true;
        console.log('PostgreSQL connection established');
    } catch (error) {
        console.warn('PostgreSQL is not available yet:', error.message);
    }

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Failed to start server', error);
        process.exit(1);
    });
}

module.exports = app;
