const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const localEnvPath = path.resolve(process.cwd(), '.env');
const neonEnvPath = path.resolve(process.cwd(), '.env.local');

dotenv.config({ path: localEnvPath });
dotenv.config({ path: neonEnvPath });

const localPool = new Pool({
    connectionString: process.env.LOCAL_DATABASE_URL,
    host: process.env.POSTGRES_HOST || process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
    database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'hilal_meet',
    user: process.env.POSTGRES_USER || process.env.PGUSER || 'hilal',
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'hilal123'
});

const neonPool = new Pool({
    connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
});

async function ensureSchema() {
    await neonPool.query(`
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

    await neonPool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            session_id VARCHAR(100) PRIMARY KEY,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await neonPool.query(`
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

    await neonPool.query(`
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
}

async function copyTable({ table, selectSql, mapRow, insertSql, targetColumns }) {
    const { rowCount: targetCount } = await neonPool.query(`SELECT 1 FROM ${table} LIMIT 1`);
    if (targetCount > 0) {
        console.log(`Skipping ${table}: target Neon table already contains data.`);
        return;
    }

    const { rows } = await localPool.query(selectSql);
    if (rows.length === 0) {
        console.log(`No rows found in local ${table}.`);
        return;
    }

    console.log(`Copying ${rows.length} row(s) into Neon.${table}...`);

    for (const row of rows) {
        const values = mapRow(row);
        await neonPool.query(insertSql, values);
    }

    console.log(`Copied ${rows.length} row(s) into Neon.${table}.`);
}

async function main() {
    if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
        throw new Error('Neon DATABASE_URL_UNPOOLED or DATABASE_URL is required in .env.local');
    }

    console.log('Connecting to local and Neon databases...');
    try {
        await localPool.query('SELECT 1');
    } catch (error) {
        throw new Error(
            `Local Postgres connection failed: ${error.message}.\n` +
            `Start your local Postgres service (for example, run 'docker compose up -d db') and ensure the connection settings in .env are correct.`
        );
    }

    try {
        await neonPool.query('SELECT 1');
    } catch (error) {
        throw new Error(`Neon connection failed: ${error.message}. Check .env.local for DATABASE_URL_UNPOOLED or DATABASE_URL.`);
    }

    console.log('Ensuring Neon schema exists...');
    await ensureSchema();

    await copyTable({
        table: 'products',
        selectSql: `SELECT id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews, created_at, updated_at FROM products ORDER BY id`,
        mapRow: (row) => [
            row.id,
            row.name,
            row.category,
            row.price,
            row.sale_price,
            row.weight,
            row.image,
            row.gallery,
            row.description,
            row.badge,
            row.in_stock,
            row.featured,
            row.rating,
            row.reviews,
            row.created_at,
            row.updated_at
        ],
        insertSql: `INSERT INTO products (id, name, category, price, sale_price, weight, image, gallery, description, badge, in_stock, featured, rating, reviews, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        targetColumns: []
    });

    await copyTable({
        table: 'customers',
        selectSql: `SELECT id, name, email, phone, address, joined, orders_count, spent, created_at FROM customers ORDER BY id`,
        mapRow: (row) => [
            row.id,
            row.name,
            row.email,
            row.phone,
            row.address,
            row.joined,
            row.orders_count,
            row.spent,
            row.created_at
        ],
        insertSql: `INSERT INTO customers (id, name, email, phone, address, joined, orders_count, spent, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        targetColumns: []
    });

    await copyTable({
        table: 'orders',
        selectSql: `SELECT id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items, created_at FROM orders ORDER BY id`,
        mapRow: (row) => [
            row.id,
            row.order_date,
            row.status,
            row.customer_name,
            row.customer_email,
            row.customer_phone,
            row.address,
            row.subtotal,
            row.delivery,
            row.total,
            row.payment_method,
            row.notes,
            row.items,
            row.created_at
        ],
        insertSql: `INSERT INTO orders (id, order_date, status, customer_name, customer_email, customer_phone, address, subtotal, delivery, total, payment_method, notes, items, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        targetColumns: []
    });

    await copyTable({
        table: 'carts',
        selectSql: `SELECT session_id, items, updated_at FROM carts ORDER BY session_id`,
        mapRow: (row) => [row.session_id, row.items, row.updated_at],
        insertSql: `INSERT INTO carts (session_id, items, updated_at) VALUES ($1,$2,$3)`,
        targetColumns: []
    });

    console.log('Database migration complete.');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error.message || error);
        process.exit(1);
    });
