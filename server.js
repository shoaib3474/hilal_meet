const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { pool, initializeDatabase } = require('./db');

dotenv.config();

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

function getCartSessionId(req) {
    return req.query?.sessionId || req.get('x-cart-session-id') || req.get('x-cart-session') || '';
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
        res.json(rows.map(parseProductRow));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
        '/shop': 'shop.html'
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

startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
