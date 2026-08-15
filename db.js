const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || 'hilal_meet',
    user: process.env.POSTGRES_USER || 'hilal',
    password: process.env.POSTGRES_PASSWORD || 'hilal123',
    connectionString: process.env.DATABASE_URL
});

const SEED_PRODUCTS = [
    {
        name: 'Whole Chicken', category: 'chicken', price: 7.99, salePrice: null, weight: '1.2kg avg',
        image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80'],
        description: 'Fresh whole halal chicken.', inStock: true, featured: true, badge: 'Best Seller', rating: 4.9, reviews: 124
    },

    {
        name: 'Lamb Chops', category: 'lamb', price: 14.99, salePrice: null, weight: '1kg',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80'],
        description: 'Premium quality lamb chops.', inStock: true, featured: true, badge: 'Popular', rating: 4.9, reviews: 151
    },
    {
        name: 'Beef Mince', category: 'beef', price: 8.49, salePrice: null, weight: '500g',
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80',
        gallery: ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
        description: 'Fresh halal beef mince.', inStock: true, featured: false, badge: null, rating: 4.7, reviews: 67
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

async function waitForDatabaseConnection(maxAttempts = 15, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            console.warn(`Database unavailable, retrying (${attempt}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

async function initializeDatabase() {
    await waitForDatabaseConnection();

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

    await pool.query(`
        ALTER TABLE products
            ADD COLUMN IF NOT EXISTS category VARCHAR(100),
            ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2),
            ADD COLUMN IF NOT EXISTS weight VARCHAR(100),
            ADD COLUMN IF NOT EXISTS image TEXT,
            ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS badge VARCHAR(100),
            ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 4.5,
            ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            session_id VARCHAR(100) PRIMARY KEY,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        ALTER TABLE carts
            ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS wishlists (
            user_id VARCHAR(100) PRIMARY KEY,
            product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        ALTER TABLE wishlists
            ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
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

    const existingOrders = await pool.query('SELECT id FROM orders LIMIT 1');
    if (existingOrders.rowCount === 0) {
        for (const order of SEED_ORDERS) {
            await pool.query(
                `INSERT INTO orders (id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

    const existingCustomers = await pool.query('SELECT id FROM customers LIMIT 1');
    if (existingCustomers.rowCount === 0) {
        for (const customer of SEED_CUSTOMERS) {
            await pool.query(
                `INSERT INTO customers (name, email, phone, address, joined, orders_count, spent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [customer.name, customer.email, customer.phone, customer.address, customer.joined, customer.orders, customer.spent]
            );
        }
    }
}

module.exports = {
    pool,
    initializeDatabase
};
