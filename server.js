const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { pool, initializeDatabase, SEED_PRODUCTS, SEED_USERS, SEED_CUSTOMERS, SEED_ORDERS } = require('./db');

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        console.warn('JSON parse failed for', req.method, req.path, err.message);
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }
    next(err);
});

let databaseReady = false;
let initDbPromise = null;

async function ensureDbInitialized() {
    if (databaseReady) return;
    if (!initDbPromise) {
        initDbPromise = initializeDatabase()
            .then(() => {
                databaseReady = true;
            })
            .catch(err => {
                console.warn('Database initialization note:', err.message);
                initDbPromise = null;
            });
    }
    await initDbPromise;
}

app.use('/api', async (req, res, next) => {
    try {
        await ensureDbInitialized();
    } catch (_) { }
    next();
});

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
    return req.query?.sessionId || req.body?.sessionId || req.get('x-cart-session-id') || req.get('x-cart-session') || '';
}

function normalizeWishlistUserId(value) {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    return raw.replace(/^user-/i, '').replace(/^anon-/i, '');
}

function getWishlistUserId(req) {
    return normalizeWishlistUserId(req.query?.userId || req.body?.userId || req.get('x-user-id') || req.get('x-wishlist-user-id') || '');
}

function setNoStoreHeaders(res) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
}

function normalizeWishlistRow(row) {
    if (!row || !row.id) return null;
    if (!row.name || String(row.name).trim() === '') return null;
    if (!row.image || String(row.image).trim() === '') return null;
    return row;
}

app.get('/api/health', async (req, res) => {
    setNoStoreHeaders(res);
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

// In-Memory Fallback Caches
let inMemoryUsers = [...(SEED_USERS || [])];
let inMemoryProducts = getFallbackProducts();
let inMemoryWishlistItems = [];
let inMemoryCartItems = [];

// ==========================================
// AUTHENTICATION & USER ENDPOINTS
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    setNoStoreHeaders(res);
    try {
        const { firstName, lastName, email, phone, password, address } = req.body || {};
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'First name, last name, email, and password are required' });
        }
        const cleanEmail = email.trim().toLowerCase();

        try {
            const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
            if (existing.rowCount > 0) {
                return res.status(400).json({ error: 'An account with this email already exists' });
            }

            const { rows } = await pool.query(
                `INSERT INTO users (first_name, last_name, email, password_hash, phone, address)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, first_name, last_name, email, phone, address, joined, orders_count, spent`,
                [firstName.trim(), lastName.trim(), cleanEmail, password, phone?.trim() || '', address?.trim() || '']
            );

            await pool.query(
                `INSERT INTO customers (name, email, phone, address)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO NOTHING`,
                [`${firstName.trim()} ${lastName.trim()}`, cleanEmail, phone?.trim() || '', address?.trim() || '']
            );

            const user = {
                id: rows[0].id,
                firstName: rows[0].first_name,
                lastName: rows[0].last_name,
                email: rows[0].email,
                phone: rows[0].phone,
                address: rows[0].address
            };
            return res.status(201).json({ success: true, user });
        } catch (dbErr) {
            console.error('Registration failed: database unavailable or write failed.', dbErr.message);
            return res.status(503).json({
                success: false,
                error: 'Database unavailable. Start PostgreSQL or configure DATABASE_URL/POSTGRES_* before registering.'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    setNoStoreHeaders(res);
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const cleanEmail = email.trim().toLowerCase();

        try {
            const { rows } = await pool.query(
                `SELECT id, first_name, last_name, email, password_hash, phone, address, orders_count, spent 
                 FROM users WHERE LOWER(email) = $1`,
                [cleanEmail]
            );
            if (rows.length === 0 || rows[0].password_hash !== password) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            const user = {
                id: rows[0].id,
                firstName: rows[0].first_name,
                lastName: rows[0].last_name,
                email: rows[0].email,
                phone: rows[0].phone,
                address: rows[0].address
            };
            return res.json({ success: true, user });
        } catch (dbErr) {
            console.error('Login failed: database unavailable or query failed.', dbErr.message);
            return res.status(503).json({
                success: false,
                error: 'Database unavailable. Please start PostgreSQL or configure DATABASE_URL/POSTGRES_*.'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', async (req, res) => {
    setNoStoreHeaders(res);
    const email = req.query?.email || req.get('x-user-email');
    const userId = req.query?.id || req.get('x-user-id');
    if (!email && !userId) {
        return res.status(400).json({ error: 'User identifier required' });
    }
    try {
        let query = 'SELECT id, first_name, last_name, email, phone, address, joined, orders_count, spent FROM users WHERE ';
        let params = [];
        if (userId) {
            query += 'id = $1';
            params.push(parseInt(userId.toString().replace('user-', '')) || 0);
        } else {
            query += 'LOWER(email) = $1';
            params.push(email.toLowerCase());
        }
        const { rows } = await pool.query(query, params);
        if (rows.length > 0) {
            return res.json({
                id: rows[0].id,
                firstName: rows[0].first_name,
                lastName: rows[0].last_name,
                email: rows[0].email,
                phone: rows[0].phone,
                address: rows[0].address,
                joined: rows[0].joined,
                ordersCount: rows[0].orders_count,
                spent: Number(rows[0].spent)
            });
        }
    } catch (_) { }
    const found = inMemoryUsers.find(u => (userId && (u.id == userId || `user-${u.id}` == userId)) || (email && u.email.toLowerCase() === email.toLowerCase()));
    if (found) {
        return res.json({ id: found.id, firstName: found.firstName, lastName: found.lastName, email: found.email, phone: found.phone, address: found.address });
    }
    res.status(404).json({ error: 'User not found' });
});

// ==========================================
// RELATIONAL WISHLIST ENDPOINTS
// ==========================================
app.get('/api/wishlist', async (req, res) => {
    const userId = getWishlistUserId(req);
    setNoStoreHeaders(res);
    if (!userId) {
        return res.json({ userId: '', productIds: [], items: [] });
    }

    try {
        const { rows } = await pool.query(
            `SELECT 
                w.id as wishlist_id,
                w.user_id,
                w.product_id,
                w.created_at as wishlisted_at,
                p.id,
                p.name,
                p.category,
                p.price,
                p.sale_price,
                p.weight,
                p.image,
                p.gallery,
                p.description,
                p.badge,
                p.in_stock,
                p.featured,
                p.rating,
                p.reviews
             FROM wishlist_items w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [userId]
        );

        const items = rows
            .map(normalizeWishlistRow)
            .filter(Boolean)
            .map(r => ({
                id: r.id,
                name: r.name,
                category: r.category,
                price: Number(r.price || 0),
                salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
                weight: r.weight,
                image: r.image,
                gallery: Array.isArray(r.gallery) ? r.gallery : [],
                description: r.description,
                badge: r.badge,
                inStock: r.in_stock,
                featured: r.featured,
                rating: Number(r.rating || 4.5),
                reviews: Number(r.reviews || 0),
                wishlistedAt: r.wishlisted_at
            }));
        const productIds = items.map(i => i.id);

        inMemoryWishlistItems = inMemoryWishlistItems.filter(item => item.user_id !== userId);
        productIds.forEach(pid => inMemoryWishlistItems.push({ id: Date.now(), user_id: userId, product_id: pid, created_at: new Date() }));

        return res.json({ userId, productIds, items });
    } catch (error) {
        console.warn('DB query for wishlist items failed, using memory fallback:', error.message);
    }

    const userRecords = inMemoryWishlistItems.filter(item => item.user_id === userId);
    const allProducts = inMemoryProducts;
    const items = userRecords.map(rec => {
        const p = allProducts.find(prod => prod.id === rec.product_id);
        return p ? { ...p, wishlistedAt: rec.created_at } : null;
    }).filter(Boolean);
    const productIds = items.map(i => i.id);

    res.json({ userId, productIds, items });
});

app.post('/api/wishlist/toggle', async (req, res) => {
    const userId = getWishlistUserId(req);
    const productId = parseInt(req.body?.productId);
    setNoStoreHeaders(res);

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Valid product id is required' });
    }

    let action = 'added';
    let inWishlist = true;

    try {
        const check = await pool.query(
            'SELECT id FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (check.rowCount > 0) {
            await pool.query(
                'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
                [userId, productId]
            );
            action = 'removed';
            inWishlist = false;
        } else {
            await pool.query(
                `INSERT INTO wishlist_items (user_id, product_id, created_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, product_id) DO NOTHING`,
                [userId, productId]
            );
            action = 'added';
            inWishlist = true;
        }
    } catch (error) {
        console.warn('DB wishlist toggle failed, falling back to memory:', error.message);
        const existingIdx = inMemoryWishlistItems.findIndex(i => i.user_id === userId && i.product_id === productId);
        if (existingIdx > -1) {
            inMemoryWishlistItems.splice(existingIdx, 1);
            action = 'removed';
            inWishlist = false;
        } else {
            inMemoryWishlistItems.push({ id: Date.now(), user_id: userId, product_id: productId, created_at: new Date() });
            action = 'added';
            inWishlist = true;
        }
    }

    try {
        const { rows } = await pool.query(
            `SELECT 
                p.id, p.name, p.category, p.price, p.sale_price, p.weight, p.image, p.gallery, p.description, p.badge, p.in_stock, p.featured, p.rating, p.reviews, w.created_at as wishlisted_at
             FROM wishlist_items w
             JOIN products p ON w.product_id = p.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [userId]
        );
        const items = rows
            .map(normalizeWishlistRow)
            .filter(Boolean)
            .map(r => ({
                id: r.id,
                name: r.name,
                category: r.category,
                price: Number(r.price || 0),
                salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
                weight: r.weight,
                image: r.image,
                gallery: Array.isArray(r.gallery) ? r.gallery : [],
                description: r.description,
                badge: r.badge,
                inStock: r.in_stock,
                featured: r.featured,
                rating: Number(r.rating || 4.5),
                reviews: Number(r.reviews || 0),
                wishlistedAt: r.wishlisted_at
            }));
        return res.json({ userId, productId, action, inWishlist, productIds: items.map(i => i.id), items });
    } catch (_) {
        const userRecords = inMemoryWishlistItems.filter(item => item.user_id === userId);
        const allProducts = inMemoryProducts;
        const items = userRecords.map(rec => allProducts.find(p => p.id === rec.product_id)).filter(Boolean);
        return res.json({ userId, productId, action, inWishlist, productIds: items.map(i => i.id), items });
    }
});

app.post('/api/wishlist', async (req, res) => {
    setNoStoreHeaders(res);
    const userId = getWishlistUserId(req);
    const productId = parseInt(req.body?.productId);

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Valid product id is required' });
    }

    try {
        await pool.query(
            `INSERT INTO wishlist_items (user_id, product_id, created_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, product_id) DO NOTHING`,
            [userId, productId]
        );
    } catch (_) {
        if (!inMemoryWishlistItems.some(i => i.user_id === userId && i.product_id === productId)) {
            inMemoryWishlistItems.push({ id: Date.now(), user_id: userId, product_id: productId, created_at: new Date() });
        }
    }

    res.json({ success: true, action: 'added', userId, productId });
});

app.delete('/api/wishlist', async (req, res) => {
    setNoStoreHeaders(res);
    const userId = getWishlistUserId(req);
    const productId = parseInt(req.query?.productId || req.body?.productId);

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Valid product id is required' });
    }

    try {
        await pool.query(
            'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
    } catch (_) {
        inMemoryWishlistItems = inMemoryWishlistItems.filter(i => !(i.user_id === userId && i.product_id === productId));
    }

    res.json({ success: true, action: 'removed', userId, productId });
});

app.post('/api/wishlist/migrate', async (req, res) => {
    setNoStoreHeaders(res);
    const guestId = req.body?.guestId;
    const userId = req.body?.userId;

    if (!guestId || !userId || guestId === userId) {
        return res.json({ success: true, message: 'No migration needed' });
    }

    try {
        await pool.query(
            `INSERT INTO wishlist_items (user_id, product_id, created_at)
             SELECT $1, product_id, created_at FROM wishlist_items WHERE user_id = $2
             ON CONFLICT (user_id, product_id) DO NOTHING`,
            [userId, guestId]
        );
        await pool.query('DELETE FROM wishlist_items WHERE user_id = $1', [guestId]);
    } catch (_) {
        const guestItems = inMemoryWishlistItems.filter(i => i.user_id === guestId);
        guestItems.forEach(item => {
            if (!inMemoryWishlistItems.some(i => i.user_id === userId && i.product_id === item.product_id)) {
                inMemoryWishlistItems.push({ id: Date.now(), user_id: userId, product_id: item.product_id, created_at: item.created_at });
            }
        });
        inMemoryWishlistItems = inMemoryWishlistItems.filter(i => i.user_id !== guestId);
    }

    res.json({ success: true, migrated: true });
});

const handleClearWishlist = async (req, res) => {
    setNoStoreHeaders(res);
    const userId = getWishlistUserId(req);
    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }

    try {
        await pool.query('DELETE FROM wishlist_items WHERE user_id = $1', [userId]);
    } catch (_) {
        inMemoryWishlistItems = inMemoryWishlistItems.filter(i => i.user_id !== userId);
    }

    res.json({ userId, productIds: [], items: [] });
};

app.delete('/api/wishlist/clear', handleClearWishlist);
app.post('/api/wishlist/clear', handleClearWishlist);

// ==========================================
// RELATIONAL CART ENDPOINTS (SQL JOIN)
// ==========================================
app.get('/api/cart', async (req, res) => {
    setNoStoreHeaders(res);
    const sessionId = getCartSessionId(req);
    if (!sessionId) {
        return res.json({ sessionId: '', items: [] });
    }

    try {
        const { rows } = await pool.query(
            `SELECT 
                c.id as cart_item_id,
                c.session_id,
                c.product_id,
                c.quantity,
                c.updated_at,
                p.id,
                p.name,
                p.category,
                p.price,
                p.sale_price,
                p.weight,
                p.image,
                p.gallery,
                p.in_stock,
                p.rating,
                p.badge
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.session_id = $1
             ORDER BY c.updated_at DESC`,
            [sessionId]
        );

        const items = rows.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            price: r.sale_price !== null ? Number(r.sale_price) : Number(r.price || 0),
            regularPrice: Number(r.price || 0),
            salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
            weight: r.weight,
            image: r.image,
            gallery: Array.isArray(r.gallery) ? r.gallery : [],
            inStock: r.in_stock,
            rating: Number(r.rating || 4.5),
            badge: r.badge,
            qty: Number(r.quantity || 1)
        }));

        inMemoryCartItems = inMemoryCartItems.filter(item => item.session_id !== sessionId);
        items.forEach(it => inMemoryCartItems.push({ id: Date.now(), session_id: sessionId, product_id: it.id, quantity: it.qty, updated_at: new Date() }));

        return res.json({ sessionId, items });
    } catch (error) {
        console.warn('DB cart query failed, using memory fallback:', error.message);
    }

    const sessionRecords = inMemoryCartItems.filter(item => item.session_id === sessionId);
    const allProducts = inMemoryProducts;
    const items = sessionRecords.map(rec => {
        const prod = allProducts.find(p => p.id === rec.product_id);
        if (!prod) return null;
        return {
            id: prod.id,
            name: prod.name,
            category: prod.category,
            price: prod.salePrice !== null ? prod.salePrice : prod.price,
            regularPrice: prod.price,
            salePrice: prod.salePrice,
            weight: prod.weight,
            image: prod.image,
            gallery: prod.gallery,
            inStock: prod.inStock,
            rating: prod.rating,
            badge: prod.badge,
            qty: rec.quantity
        };
    }).filter(Boolean);

    res.json({ sessionId, items });
});

app.post('/api/cart', async (req, res) => {
    const sessionId = req.body?.sessionId || getCartSessionId(req);
    const productId = parseInt(req.body?.productId || req.body?.id);
    let qty = parseInt(req.body?.qty || req.body?.quantity || 1);

    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });
    if (isNaN(productId) || productId <= 0) return res.status(400).json({ error: 'Valid product ID is required' });

    if (req.body?.change !== undefined) {
        const change = parseInt(req.body.change);
        try {
            const curr = await pool.query('SELECT quantity FROM cart_items WHERE session_id = $1 AND product_id = $2', [sessionId, productId]);
            qty = (curr.rows[0]?.quantity || 0) + change;
        } catch (_) {
            const currRec = inMemoryCartItems.find(i => i.session_id === sessionId && i.product_id === productId);
            qty = (currRec?.quantity || 0) + change;
        }
    }

    if (qty <= 0) {
        try {
            await pool.query('DELETE FROM cart_items WHERE session_id = $1 AND product_id = $2', [sessionId, productId]);
        } catch (_) {
            inMemoryCartItems = inMemoryCartItems.filter(i => !(i.session_id === sessionId && i.product_id === productId));
        }
    } else {
        try {
            await pool.query(
                `INSERT INTO cart_items (session_id, product_id, quantity, updated_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (session_id, product_id) DO UPDATE SET
                     quantity = EXCLUDED.quantity,
                     updated_at = CURRENT_TIMESTAMP`,
                [sessionId, productId, qty]
            );
        } catch (_) {
            const existingIdx = inMemoryCartItems.findIndex(i => i.session_id === sessionId && i.product_id === productId);
            if (existingIdx > -1) {
                inMemoryCartItems[existingIdx].quantity = qty;
                inMemoryCartItems[existingIdx].updated_at = new Date();
            } else {
                inMemoryCartItems.push({ id: Date.now(), session_id: sessionId, product_id: productId, quantity: qty, updated_at: new Date() });
            }
        }
    }

    try {
        const { rows } = await pool.query(
            `SELECT 
                c.id as cart_item_id, c.session_id, c.product_id, c.quantity, c.updated_at,
                p.id, p.name, p.category, p.price, p.sale_price, p.weight, p.image, p.gallery, p.in_stock, p.rating, p.badge
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.session_id = $1
             ORDER BY c.updated_at DESC`,
            [sessionId]
        );
        const items = rows.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            price: r.sale_price !== null ? Number(r.sale_price) : Number(r.price || 0),
            regularPrice: Number(r.price || 0),
            salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
            weight: r.weight,
            image: r.image,
            gallery: Array.isArray(r.gallery) ? r.gallery : [],
            inStock: r.in_stock,
            rating: Number(r.rating || 4.5),
            badge: r.badge,
            qty: Number(r.quantity || 1)
        }));
        return res.json({ sessionId, items });
    } catch (_) {
        const sessionRecords = inMemoryCartItems.filter(item => item.session_id === sessionId);
        const allProducts = getFallbackProducts();
        const items = sessionRecords.map(rec => {
            const prod = allProducts.find(p => p.id === rec.product_id);
            return prod ? { ...prod, qty: rec.quantity } : null;
        }).filter(Boolean);
        return res.json({ sessionId, items });
    }
});

app.put('/api/cart', async (req, res) => {
    const sessionId = req.body?.sessionId || getCartSessionId(req);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    try {
        await pool.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
        for (const item of rawItems) {
            const pid = parseInt(item.id || item.productId);
            const q = parseInt(item.qty || item.quantity || 1);
            if (!isNaN(pid) && pid > 0 && q > 0) {
                await pool.query(
                    `INSERT INTO cart_items (session_id, product_id, quantity, updated_at)
                     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                     ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
                    [sessionId, pid, q]
                );
            }
        }
    } catch (err) {
        inMemoryCartItems = inMemoryCartItems.filter(i => i.session_id !== sessionId);
        rawItems.forEach(item => {
            const pid = parseInt(item.id || item.productId);
            const q = parseInt(item.qty || item.quantity || 1);
            if (!isNaN(pid) && pid > 0 && q > 0) {
                inMemoryCartItems.push({ id: Date.now(), session_id: sessionId, product_id: pid, quantity: q, updated_at: new Date() });
            }
        });
    }

    try {
        const { rows } = await pool.query(
            `SELECT c.product_id, c.quantity, p.id, p.name, p.category, p.price, p.sale_price, p.weight, p.image, p.gallery, p.in_stock, p.rating, p.badge
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.session_id = $1`,
            [sessionId]
        );
        const items = rows.map(r => ({
            id: r.id,
            name: r.name,
            price: r.sale_price !== null ? Number(r.sale_price) : Number(r.price || 0),
            regularPrice: Number(r.price || 0),
            salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
            weight: r.weight,
            image: r.image,
            qty: r.quantity
        }));
        return res.json({ sessionId, items });
    } catch (_) {
        return res.json({ sessionId, items: rawItems });
    }
});

app.delete('/api/cart/item', async (req, res) => {
    const sessionId = req.query?.sessionId || req.body?.sessionId || getCartSessionId(req);
    const productId = parseInt(req.query?.productId || req.body?.productId || req.query?.id);
    if (!sessionId || isNaN(productId)) {
        return res.status(400).json({ error: 'Session ID and Product ID required' });
    }

    try {
        await pool.query('DELETE FROM cart_items WHERE session_id = $1 AND product_id = $2', [sessionId, productId]);
    } catch (_) {
        inMemoryCartItems = inMemoryCartItems.filter(i => !(i.session_id === sessionId && i.product_id === productId));
    }

    res.json({ success: true, sessionId, productId });
});

app.post('/api/cart/migrate', async (req, res) => {
    const guestSessionId = req.body?.guestSessionId;
    const userSessionId = req.body?.userSessionId;

    if (!guestSessionId || !userSessionId || guestSessionId === userSessionId) {
        return res.json({ success: true, message: 'No cart migration needed' });
    }

    try {
        await pool.query(
            `INSERT INTO cart_items (session_id, product_id, quantity, updated_at)
             SELECT $1, product_id, quantity, CURRENT_TIMESTAMP FROM cart_items WHERE session_id = $2
             ON CONFLICT (session_id, product_id) DO UPDATE SET
                 quantity = cart_items.quantity + EXCLUDED.quantity,
                 updated_at = CURRENT_TIMESTAMP`,
            [userSessionId, guestSessionId]
        );
        await pool.query('DELETE FROM cart_items WHERE session_id = $1', [guestSessionId]);
    } catch (_) {
        const guestCart = inMemoryCartItems.filter(i => i.session_id === guestSessionId);
        guestCart.forEach(g => {
            const u = inMemoryCartItems.find(i => i.session_id === userSessionId && i.product_id === g.product_id);
            if (u) u.quantity += g.quantity;
            else inMemoryCartItems.push({ id: Date.now(), session_id: userSessionId, product_id: g.product_id, quantity: g.quantity, updated_at: new Date() });
        });
        inMemoryCartItems = inMemoryCartItems.filter(i => i.session_id !== guestSessionId);
    }

    res.json({ success: true, migrated: true });
});

const handleClearCart = async (req, res) => {
    const sessionId = req.body?.sessionId || getCartSessionId(req);
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    try {
        await pool.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
    } catch (_) {
        inMemoryCartItems = inMemoryCartItems.filter(i => i.session_id !== sessionId);
    }

    res.json({ sessionId, items: [] });
};
app.delete('/api/cart/clear', handleClearCart);
app.post('/api/cart/clear', handleClearCart);

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================

app.get('/api/products', async (req, res) => {
    setNoStoreHeaders(res);
    try {
        const { rows } = await pool.query(
            'SELECT id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews FROM products ORDER BY id ASC'
        );
        if (rows && rows.length > 0) {
            inMemoryProducts = rows.map(parseProductRow);
            return res.json(inMemoryProducts);
        }
    } catch (error) {
        console.warn('DB query for products failed, falling back to seed/memory catalog:', error.message);
    }
    res.json(inMemoryProducts);
});

app.get('/api/products/:id', async (req, res) => {
    setNoStoreHeaders(res);
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
    const found = inMemoryProducts.find(p => p.id === id);
    if (found) {
        return res.json(found);
    }
    res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', async (req, res) => {
    setNoStoreHeaders(res);
    const product = req.body;
    if (!product.name || !product.category) {
        return res.status(400).json({ error: 'Name and category are required' });
    }
    try {
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
        const saved = parseProductRow(rows[0]);
        inMemoryProducts.push(saved);
        return res.json(saved);
    } catch (error) {
        console.warn('DB insert for product failed, using in-memory store:', error.message);
        const newId = inMemoryProducts.length > 0 ? Math.max(...inMemoryProducts.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            name: product.name,
            category: product.category,
            price: Number(product.price || 0),
            salePrice: product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null,
            weight: product.weight || '',
            image: product.image || '',
            gallery: Array.isArray(product.gallery) ? product.gallery : (product.image ? [product.image] : []),
            description: product.description || '',
            badge: product.badge || null,
            inStock: product.inStock !== false,
            featured: Boolean(product.featured),
            rating: Number(product.rating || 4.5),
            reviews: Number(product.reviews || 0)
        };
        inMemoryProducts.push(newProduct);
        return res.json(newProduct);
    }
});

app.put('/api/products/:id', async (req, res) => {
    const product = req.body;
    const id = parseInt(req.params.id);
    try {
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
        if (rows.length > 0) {
            const updated = parseProductRow(rows[0]);
            const idx = inMemoryProducts.findIndex(p => p.id === id);
            if (idx >= 0) inMemoryProducts[idx] = updated;
            return res.json(updated);
        }
    } catch (error) {
        console.warn('DB update for product failed, using in-memory store:', error.message);
    }
    const idx = inMemoryProducts.findIndex(p => p.id === id);
    if (idx >= 0) {
        inMemoryProducts[idx] = {
            ...inMemoryProducts[idx],
            ...product,
            id,
            price: Number(product.price || 0),
            salePrice: product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : null,
            image: product.image || inMemoryProducts[idx].image,
            gallery: Array.isArray(product.gallery) ? product.gallery : inMemoryProducts[idx].gallery
        };
        return res.json(inMemoryProducts[idx]);
    }
    res.status(404).json({ error: 'Product not found' });
});

app.patch('/api/products/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { inStock } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE products SET in_stock = $1
             WHERE id = $2
             RETURNING id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews`,
            [Boolean(inStock), id]
        );
        if (rows.length > 0) {
            const updated = parseProductRow(rows[0]);
            const idx = inMemoryProducts.findIndex(p => p.id === id);
            if (idx >= 0) inMemoryProducts[idx] = updated;
            return res.json(updated);
        }
    } catch (error) {
        console.warn('DB patch for product failed, using in-memory store:', error.message);
    }
    const idx = inMemoryProducts.findIndex(p => p.id === id);
    if (idx >= 0) {
        inMemoryProducts[idx].inStock = Boolean(inStock);
        return res.json(inMemoryProducts[idx]);
    }
    res.status(404).json({ error: 'Product not found' });
});

app.delete('/api/products/:id', async (req, res) => {
    setNoStoreHeaders(res);
    const id = parseInt(req.params.id);
    try {
        const { rows } = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING id',
            [id]
        );
        if (rows.length > 0) {
            inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);
            return res.json({ message: 'Product deleted successfully', id });
        }
    } catch (error) {
        console.warn('DB delete for product failed, using in-memory store:', error.message);
    }
    const idx = inMemoryProducts.findIndex(p => p.id === id);
    if (idx >= 0) {
        inMemoryProducts.splice(idx, 1);
        return res.json({ message: 'Product deleted successfully', id });
    }
    res.status(404).json({ error: 'Product not found' });
});

app.put('/api/products', async (req, res) => {
    setNoStoreHeaders(res);
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
    setNoStoreHeaders(res);
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
    setNoStoreHeaders(res);
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
    setNoStoreHeaders(res);
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
    setNoStoreHeaders(res);
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
    setNoStoreHeaders(res);
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
