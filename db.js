const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.NEON_DATABASE_URL
    || '';

function normalizeConnectionString(value) {
    if (!value) return '';

    // Strip conflicting sslmode query parameters to allow the Pool ssl option to handle TLS safely
    let cleaned = value.replace(/([?&])sslmode=[^&]*/gi, '');
    cleaned = cleaned.replace(/\?&/, '?').replace(/&&/, '&').replace(/[?&]$/, '');
    return cleaned;
}

const normalizedConnectionString = normalizeConnectionString(connectionString);
const isRemoteDatabase = Boolean(normalizedConnectionString) && /postgres(?:ql)?:\/\//i.test(normalizedConnectionString);

const pool = new Pool({
    ...(normalizedConnectionString ? { connectionString: normalizedConnectionString } : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || 5432),
        database: process.env.POSTGRES_DB || 'hilal_meet',
        user: process.env.POSTGRES_USER || 'hilal',
        password: process.env.POSTGRES_PASSWORD || 'hilal123',
    }),
    ...(isRemoteDatabase ? { ssl: { rejectUnauthorized: false } } : {})
});

const SEED_PRODUCTS = [
    {
        id: 1,
        name: 'Whole Chicken', category: 'chicken', price: 7.99, salePrice: null, weight: '1.2kg avg',
        image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', 'https://images.unsplash.com/photo-1563897539633-7374c276c212?w=800&q=80'],
        description: 'Fresh whole halal chicken, hand-slaughtered following Islamic guidelines. Perfect for roasting, currying or grilling. Sourced from UK farms.',
        inStock: true, featured: true, badge: 'Best Seller', rating: 4.9, reviews: 124
    },
    {
        id: 2,
        name: 'Chicken Breast (Boneless)', category: 'chicken', price: 8.99, salePrice: 7.49, weight: '500g',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11e19?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1604503468506-a8da13d11e19?w=800&q=80'],
        description: 'Lean, boneless chicken breast fillet. Ideal for grilling, stir-fry, salads or curries. Low fat and high protein.',
        inStock: true, featured: true, badge: 'Sale', rating: 4.8, reviews: 98
    },
    {
        id: 3,
        name: 'Chicken Wings', category: 'chicken', price: 5.49, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80'],
        description: 'Fresh chicken wings, perfect for BBQ, frying, or marinating. Great for parties and family meals.',
        inStock: true, featured: true, badge: null, rating: 4.7, reviews: 76
    },
    {
        id: 4,
        name: 'Chicken Thighs (Bone-in)', category: 'chicken', price: 6.49, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1569209257695-79f51ee4c11b?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1569209257695-79f51ee4c11b?w=800&q=80'],
        description: 'Juicy chicken thighs with bone. Perfect for curries, oven-baking and roasting. More flavourful than breast.',
        inStock: true, featured: false, badge: null, rating: 4.6, reviews: 55
    },
    {
        id: 5,
        name: 'Chicken Drumsticks', category: 'chicken', price: 5.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=800&q=80'],
        description: "Fresh chicken drumsticks, great for BBQ, baking or frying. Kids' favourite.",
        inStock: true, featured: false, badge: null, rating: 4.5, reviews: 42
    },
    {
        id: 6,
        name: 'Chicken Mince', category: 'chicken', price: 6.99, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
        description: 'Fresh chicken mince. Ideal for burgers, kebabs, pasta and stuffed dishes.',
        inStock: true, featured: false, badge: null, rating: 4.4, reviews: 33
    },
    {
        id: 7,
        name: 'Lamb Chops', category: 'lamb', price: 14.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80'],
        description: 'Premium quality lamb chops, tender and full of flavour. Perfect for grilling, BBQ or pan-frying.',
        inStock: true, featured: true, badge: 'Popular', rating: 4.9, reviews: 151
    },
    {
        id: 8,
        name: 'Lamb Leg (Whole)', category: 'lamb', price: 29.99, salePrice: 24.99, weight: '2kg avg',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'],
        description: 'Whole lamb leg, ideal for Sunday roast, Eid celebrations or slow-cooking. Succulent and flavourful.',
        inStock: true, featured: true, badge: 'Sale', rating: 4.8, reviews: 87
    },
    {
        id: 9,
        name: 'Lamb Shoulder (Diced)', category: 'lamb', price: 12.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'],
        description: 'Diced lamb shoulder, perfect for curries, stews and slow cooking. Rich, tender meat.',
        inStock: true, featured: false, badge: null, rating: 4.7, reviews: 63
    },
    {
        id: 10,
        name: 'Lamb Mince', category: 'lamb', price: 9.99, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
        description: "Fresh lamb mince, ideal for koftas, burgers, Bolognese, shepherd's pie and more.",
        inStock: true, featured: true, badge: null, rating: 4.8, reviews: 112
    },
    {
        id: 11,
        name: 'Lamb Shank', category: 'lamb', price: 11.99, salePrice: null, weight: 'per shank ~400g',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'],
        description: 'Succulent lamb shank, perfect for slow cooking and braising. Falls off the bone.',
        inStock: true, featured: false, badge: null, rating: 4.9, reviews: 44
    },
    {
        id: 12,
        name: 'Beef Mince', category: 'beef', price: 8.49, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
        description: 'Fresh lean beef mince. Great for burgers, pasta, cottage pie and traditional dishes.',
        inStock: true, featured: true, badge: 'Best Seller', rating: 4.8, reviews: 143
    },
    {
        id: 13,
        name: 'Sirloin Steak', category: 'beef', price: 16.99, salePrice: null, weight: '300g',
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
        description: 'Premium halal sirloin steak. Tender, juicy and full of flavour. Perfect for grilling or pan-frying.',
        inStock: true, featured: true, badge: 'Premium', rating: 4.9, reviews: 68
    },
    {
        id: 14,
        name: 'Beef Ribs', category: 'beef', price: 13.99, salePrice: 11.99, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'],
        description: 'Meaty beef ribs, perfect for slow cooking, BBQ or braising. Fall-off-the-bone tender.',
        inStock: true, featured: false, badge: 'Sale', rating: 4.7, reviews: 52
    },
    {
        id: 15,
        name: 'Beef Brisket', category: 'beef', price: 12.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
        description: 'Fresh halal beef brisket cut, ideal for home roasting or slow cooking.',
        inStock: true, featured: false, badge: null, rating: 4.6, reviews: 38
    },
    {
        id: 16,
        name: 'Beef Diced (Shoulder)', category: 'beef', price: 10.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80'],
        description: 'Diced beef shoulder, perfect for stews, curries and casseroles.',
        inStock: true, featured: false, badge: null, rating: 4.5, reviews: 29
    },
    {
        id: 17,
        name: 'Goat Meat (Diced)', category: 'goat', price: 12.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'],
        description: 'Fresh goat meat diced, perfect for traditional karahi, nihari, and biryani.',
        inStock: true, featured: true, badge: 'Popular', rating: 4.8, reviews: 95
    },
    {
        id: 18,
        name: 'Goat Leg', category: 'goat', price: 24.99, salePrice: null, weight: '2kg avg',
        image: 'https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=800&q=80'],
        description: 'Whole goat leg, ideal for Eid celebrations and special occasions.',
        inStock: true, featured: false, badge: null, rating: 4.7, reviews: 41
    },
    {
        id: 19,
        name: 'Goat Chops', category: 'goat', price: 11.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80'],
        description: 'Goat chops perfect for grilling, BBQ or traditional cooking.',
        inStock: true, featured: false, badge: null, rating: 4.6, reviews: 33
    },
    {
        id: 20,
        name: 'Marinated Chicken Tikka', category: 'marinated', price: 10.99, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
        description: 'Chicken tikka marinated in our secret blend of aromatic spices. Sold raw and ready for home oven or grill.',
        inStock: true, featured: true, badge: 'Popular', rating: 4.9, reviews: 178
    },
    {
        id: 21,
        name: 'Marinated Lamb Chops', category: 'marinated', price: 16.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'],
        description: 'Succulent lamb chops marinated in aromatic spices. BBQ and grill perfect.',
        inStock: true, featured: true, badge: 'New', rating: 4.8, reviews: 64
    },
    {
        id: 22,
        name: 'Seekh Kebab Mix', category: 'marinated', price: 9.99, salePrice: 8.49, weight: '500g',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80'],
        description: 'Traditional seekh kebab mix, prepared fresh in-store and sold raw for home cooking.',
        inStock: true, featured: true, badge: 'Sale', rating: 4.8, reviews: 89
    },
    {
        id: 23,
        name: 'Marinated Chicken Wings', category: 'marinated', price: 7.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80'],
        description: 'Chicken wings in our hot & spicy marinade. Fresh raw wings for home cooking.',
        inStock: true, featured: false, badge: null, rating: 4.7, reviews: 57
    },
    {
        id: 24,
        name: 'Lamb Liver', category: 'offal', price: 5.99, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
        description: 'Fresh lamb liver, rich in iron and nutrients. Great for traditional liver & onions.',
        inStock: true, featured: false, badge: null, rating: 4.4, reviews: 28
    },
    {
        id: 25,
        name: 'Chicken Liver', category: 'offal', price: 3.99, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80'],
        description: 'Fresh chicken liver, great for pâté, stir-fry and traditional recipes.',
        inStock: true, featured: false, badge: null, rating: 4.3, reviews: 21
    }
];

const SEED_ORDERS = [
    {
        id: 'PH-1001', date: '2026-06-10', status: 'pending',
        customer: { name: 'Ahmed Khan', email: 'ahmed.khan@email.com', phone: '07700900123' },
        items: [{ productId: 1, name: 'Whole Chicken', qty: 1, price: 7.99 }],
        subtotal: 7.99, delivery: 0, total: 7.99, address: '45 Green Street, East Ham, E7 8DA', paymentMethod: 'cash', notes: 'Please call before delivery.'
    },
    {
        id: 'PH-1002', date: '2026-06-11', status: 'processing',
        customer: { name: 'Fatima Ali', email: 'fatima.ali@email.com', phone: '07700900456' },
        items: [{ productId: 3, name: 'Lamb Chops', qty: 2, price: 14.99 }],
        subtotal: 29.98, delivery: 0, total: 29.98, address: '12 Barking Road, East Ham, E6 2PQ', paymentMethod: 'card', notes: ''
    }
];

const SEED_CUSTOMERS = [
    { name: 'Ahmed Khan', email: 'ahmed.khan@email.com', phone: '07700900123', address: '45 Green Street, East Ham, E7 8DA', joined: '2025-11-15', orders: 2, spent: 37.97 },
    { name: 'Fatima Ali', email: 'fatima.ali@email.com', phone: '07700900456', address: '12 Barking Road, East Ham, E6 2PQ', joined: '2025-12-02', orders: 1, spent: 29.98 }
];

const SEED_USERS = [
    {
        id: 1,
        firstName: 'Ahmed',
        lastName: 'Khan',
        email: 'customer@example.com',
        password: 'Pass@123',
        phone: '07700900123',
        address: '45 Green Street, East Ham, E7 8DA',
        joined: '2025-11-15',
        orders: 2,
        spent: 37.97
    },
    {
        id: 2,
        firstName: 'Fatima',
        lastName: 'Ali',
        email: 'fatima.ali@email.com',
        password: 'Pass@123',
        phone: '07700900456',
        address: '12 Barking Road, East Ham, E6 2PQ',
        joined: '2025-12-02',
        orders: 1,
        spent: 29.98
    }
];

async function waitForDatabaseConnection(maxAttempts = 3, delayMs = 300) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

async function initializeDatabase() {
    await waitForDatabaseConnection();

    // 1. Products Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            price NUMERIC(10, 2) NOT NULL DEFAULT 0,
            sale_price NUMERIC(10, 2),
            weight VARCHAR(100),
            image TEXT,
            gallery JSONB DEFAULT '[]'::jsonb,
            description TEXT,
            badge VARCHAR(100),
            in_stock BOOLEAN DEFAULT TRUE,
            featured BOOLEAN DEFAULT FALSE,
            rating NUMERIC(2, 1) DEFAULT 4.5,
            reviews INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Users Table (Authentication & User Profile)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            address TEXT,
            joined DATE NOT NULL DEFAULT CURRENT_DATE,
            orders_count INTEGER DEFAULT 0,
            spent NUMERIC(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 3. Customers Table (Admin Panel Customer Management Sync)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(50),
            address TEXT,
            joined DATE NOT NULL DEFAULT CURRENT_DATE,
            orders_count INTEGER DEFAULT 0,
            spent NUMERIC(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 4. Relational Cart Items (session_id, product_id, quantity)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(100) NOT NULL,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_session_cart_product UNIQUE (session_id, product_id)
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
        CREATE INDEX IF NOT EXISTS idx_cart_items_prod ON cart_items(product_id);
    `);

    // 5. Relational Wishlist Items (user_id, product_id)
    await pool.query('DROP TABLE IF EXISTS wishlist_items;');
    await pool.query(`
        CREATE TABLE wishlist_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_prod ON wishlist_items(product_id);
    `);

    // 6. Orders Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(100),
            order_date DATE NOT NULL DEFAULT CURRENT_DATE,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50),
            address TEXT NOT NULL,
            subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
            delivery NUMERIC(10, 2) NOT NULL DEFAULT 0,
            total NUMERIC(10, 2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(50),
            notes TEXT,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed Products
    const existingProducts = await pool.query('SELECT id FROM products LIMIT 1');
    if (existingProducts.rowCount === 0) {
        for (const product of SEED_PRODUCTS) {
            await pool.query(
                `INSERT INTO products (name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    product.name,
                    product.category,
                    product.price,
                    product.salePrice,
                    product.weight,
                    product.image,
                    JSON.stringify(product.gallery || []),
                    product.description,
                    product.badge,
                    product.inStock,
                    product.featured,
                    product.rating,
                    product.reviews
                ]
            );
        }
    }

    // Seed Users & Customers
    const existingUsers = await pool.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.rowCount === 0) {
        for (const user of SEED_USERS) {
            await pool.query(
                `INSERT INTO users (first_name, last_name, email, password_hash, phone, address, joined, orders_count, spent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (email) DO NOTHING`,
                [user.firstName, user.lastName, user.email, user.password, user.phone, user.address, user.joined, user.orders, user.spent]
            );
            await pool.query(
                `INSERT INTO customers (name, email, phone, address, joined, orders_count, spent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (email) DO NOTHING`,
                [`${user.firstName} ${user.lastName}`, user.email, user.phone, user.address, user.joined, user.orders, user.spent]
            );
        }
    }

    // Seed Orders
    const existingOrders = await pool.query('SELECT id FROM orders LIMIT 1');
    if (existingOrders.rowCount === 0) {
        for (const order of SEED_ORDERS) {
            await pool.query(
                `INSERT INTO orders (id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    order.id,
                    order.date,
                    order.status,
                    order.customer.name,
                    order.customer.email,
                    order.customer.phone,
                    order.address,
                    order.subtotal,
                    order.delivery,
                    order.total,
                    order.paymentMethod,
                    order.notes || '',
                    JSON.stringify(order.items)
                ]
            );
        }
    }
}

module.exports = {
    pool,
    initializeDatabase,
    SEED_PRODUCTS,
    SEED_USERS,
    SEED_CUSTOMERS,
    SEED_ORDERS
};
