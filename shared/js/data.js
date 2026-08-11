// ============================================================
// Pakeeza Hilal Meat - Store Data
// ============================================================

const STORE_CONFIG = {
    name: "Pakeeza Hilal Meat",
    tagline: "Fresh Halal Meat, Poultry, Grocery & Frozen Foods",
    subtitle: "Your Local Halal Shop — High Street North, E12",
    phone: "020 8503 5721",
    whatsapp: "+442085035721",
    email: "info@pakeezahilalmeat.co.uk",
    address: "High Street North, London E12 6SB",
    hours: "Mon–Sat: 8:00am – 8:00pm  |  Sun: 9:00am – 6:00pm",
    mapUrl: "https://maps.google.com/?q=High+Street+North+E12+6SB+London",
    social: {
        facebook: "#",
        instagram: "#",
        twitter: "#",
        tiktok: "#"
    },
    deliveryMin: 30,
    freeDeliveryOver: 30
};

// ============================================================
// CATEGORIES
// ============================================================
const CATEGORIES = [
    {
        id: "chicken",
        name: "Chicken",
        image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80",
        description: "Fresh halal chicken — whole & portioned",
        count: 6
    },
    {
        id: "lamb",
        name: "Lamb",
        image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&q=80",
        description: "Premium quality halal lamb cuts",
        count: 5
    },
    {
        id: "beef",
        name: "Beef",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
        description: "Tender halal beef, freshly cut daily",
        count: 5
    },
    {
        id: "goat",
        name: "Goat",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
        description: "Fresh goat meat, traditional cuts",
        count: 3
    },
    {
        id: "marinated",
        name: "Marinated",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
        description: "Fresh raw marinated cuts",
        count: 4
    },
    {
        id: "offal",
        name: "Offal & Extras",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80",
        description: "Liver, kidneys & specialty cuts",
        count: 2
    }
    ,
    {
        id: "grocery",
        name: "Grocery",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
        description: "Spices, sauces & everyday essentials",
        count: 6
    },
    {
        id: "frozen",
        name: "Frozen Foods",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80",
        description: "Frozen meats, ready meals & more",
        count: 4
    }
];

// ============================================================
// PRODUCTS
// ============================================================
const PRODUCTS = [
    // --- CHICKEN ---
    {
        id: 1,
        name: "Whole Chicken",
        category: "chicken",
        price: 7.99,
        salePrice: null,
        weight: "1.2kg avg",
        image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80",
            "https://images.unsplash.com/photo-1563897539633-7374c276c212?w=800&q=80"
        ],
        description: "Fresh whole halal chicken, hand-slaughtered following Islamic guidelines. Perfect for roasting, currying or grilling. Sourced from UK farms.",
        inStock: true,
        featured: true,
        badge: "Best Seller",
        rating: 4.9,
        reviews: 124
    },
    {
        id: 2,
        name: "Chicken Breast (Boneless)",
        category: "chicken",
        price: 8.99,
        salePrice: 7.49,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1604503468506-a8da13d11e19?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1604503468506-a8da13d11e19?w=800&q=80"],
        description: "Lean, boneless chicken breast fillet. Ideal for grilling, stir-fry, salads or curries. Low fat and high protein.",
        inStock: true,
        featured: true,
        badge: "Sale",
        rating: 4.8,
        reviews: 98
    },
    {
        id: 3,
        name: "Chicken Wings",
        category: "chicken",
        price: 5.49,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80"],
        description: "Fresh chicken wings, perfect for BBQ, frying, or marinating. Great for parties and family meals.",
        inStock: true,
        featured: true,
        badge: null,
        rating: 4.7,
        reviews: 76
    },
    {
        id: 4,
        name: "Chicken Thighs (Bone-in)",
        category: "chicken",
        price: 6.49,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1569209257695-79f51ee4c11b?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1569209257695-79f51ee4c11b?w=800&q=80"],
        description: "Juicy chicken thighs with bone. Perfect for curries, oven-baking and roasting. More flavourful than breast.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.6,
        reviews: 55
    },
    {
        id: 5,
        name: "Chicken Drumsticks",
        category: "chicken",
        price: 5.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=800&q=80"],
        description: "Fresh chicken drumsticks, great for BBQ, baking or frying. Kids' favourite.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.5,
        reviews: 42
    },
    {
        id: 6,
        name: "Chicken Mince",
        category: "chicken",
        price: 6.99,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80"],
        description: "Fresh chicken mince. Ideal for burgers, kebabs, pasta and stuffed dishes.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.4,
        reviews: 33
    },
    // --- LAMB ---
    {
        id: 7,
        name: "Lamb Chops",
        category: "lamb",
        price: 14.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80"],
        description: "Premium quality lamb chops, tender and full of flavour. Perfect for grilling, BBQ or pan-frying.",
        inStock: true,
        featured: true,
        badge: "Popular",
        rating: 4.9,
        reviews: 151
    },
    {
        id: 8,
        name: "Lamb Leg (Whole)",
        category: "lamb",
        price: 29.99,
        salePrice: 24.99,
        weight: "2kg avg",
        image: "https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=800&q=80"],
        description: "Whole lamb leg, ideal for Sunday roast, Eid celebrations or slow-cooking. Succulent and flavourful.",
        inStock: true,
        featured: true,
        badge: "Sale",
        rating: 4.8,
        reviews: 87
    },
    {
        id: 9,
        name: "Lamb Shoulder (Diced)",
        category: "lamb",
        price: 12.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"],
        description: "Diced lamb shoulder, perfect for curries, stews and slow cooking. Rich, tender meat.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.7,
        reviews: 63
    },
    {
        id: 10,
        name: "Lamb Mince",
        category: "lamb",
        price: 9.99,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80"],
        description: "Fresh lamb mince, ideal for koftas, burgers, Bolognese, shepherd's pie and more.",
        inStock: true,
        featured: true,
        badge: null,
        rating: 4.8,
        reviews: 112
    },
    {
        id: 11,
        name: "Lamb Shank",
        category: "lamb",
        price: 11.99,
        salePrice: null,
        weight: "per shank ~400g",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"],
        description: "Succulent lamb shank, perfect for slow cooking and braising. Falls off the bone.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.9,
        reviews: 44
    },
    // --- BEEF ---
    {
        id: 12,
        name: "Beef Mince",
        category: "beef",
        price: 8.49,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80"],
        description: "Fresh lean beef mince. Great for burgers, pasta, cottage pie and traditional dishes.",
        inStock: true,
        featured: true,
        badge: "Best Seller",
        rating: 4.8,
        reviews: 143
    },
    {
        id: 13,
        name: "Sirloin Steak",
        category: "beef",
        price: 16.99,
        salePrice: null,
        weight: "300g",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80"],
        description: "Premium halal sirloin steak. Tender, juicy and full of flavour. Perfect for grilling or pan-frying.",
        inStock: true,
        featured: true,
        badge: "Premium",
        rating: 4.9,
        reviews: 68
    },
    {
        id: 14,
        name: "Beef Ribs",
        category: "beef",
        price: 13.99,
        salePrice: 11.99,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"],
        description: "Meaty beef ribs, perfect for slow cooking, BBQ or braising. Fall-off-the-bone tender.",
        inStock: true,
        featured: false,
        badge: "Sale",
        rating: 4.7,
        reviews: 52
    },
    {
        id: 15,
        name: "Beef Brisket",
        category: "beef",
        price: 12.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80"],
        description: "Fresh halal beef brisket cut, ideal for home roasting or slow cooking.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.6,
        reviews: 38
    },
    {
        id: 16,
        name: "Beef Diced (Shoulder)",
        category: "beef",
        price: 10.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80"],
        description: "Diced beef shoulder, perfect for stews, curries and casseroles.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.5,
        reviews: 29
    },
    // --- GOAT ---
    {
        id: 17,
        name: "Goat Meat (Diced)",
        category: "goat",
        price: 12.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"],
        description: "Fresh goat meat diced, perfect for traditional karahi, nihari, and biryani.",
        inStock: true,
        featured: true,
        badge: "Popular",
        rating: 4.8,
        reviews: 95
    },
    {
        id: 18,
        name: "Goat Leg",
        category: "goat",
        price: 24.99,
        salePrice: null,
        weight: "2kg avg",
        image: "https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1602543090842-f06d6a1095ba?w=800&q=80"],
        description: "Whole goat leg, ideal for Eid celebrations and special occasions.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.7,
        reviews: 41
    },
    {
        id: 19,
        name: "Goat Chops",
        category: "goat",
        price: 11.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80"],
        description: "Goat chops perfect for grilling, BBQ or traditional cooking.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.6,
        reviews: 33
    },
    // --- MARINATED ---
    {
        id: 20,
        name: "Marinated Chicken Tikka",
        category: "marinated",
        price: 10.99,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"],
        description: "Chicken tikka marinated in our secret blend of aromatic spices. Sold raw and ready for home oven or grill.",
        inStock: true,
        featured: true,
        badge: "Popular",
        rating: 4.9,
        reviews: 178
    },
    {
        id: 21,
        name: "Marinated Lamb Chops",
        category: "marinated",
        price: 16.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"],
        description: "Succulent lamb chops marinated in aromatic spices. BBQ and grill perfect.",
        inStock: true,
        featured: true,
        badge: "New",
        rating: 4.8,
        reviews: 64
    },
    {
        id: 22,
        name: "Seekh Kebab Mix",
        category: "marinated",
        price: 9.99,
        salePrice: 8.49,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80"],
        description: "Traditional seekh kebab mix, prepared fresh in-store and sold raw for home cooking.",
        inStock: true,
        featured: true,
        badge: "Sale",
        rating: 4.8,
        reviews: 89
    },
    {
        id: 23,
        name: "Marinated Chicken Wings",
        category: "marinated",
        price: 7.99,
        salePrice: null,
        weight: "1kg",
        image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80"],
        description: "Chicken wings in our hot & spicy marinade. Fresh raw wings for home cooking.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.7,
        reviews: 57
    },
    // --- OFFAL ---
    {
        id: 24,
        name: "Lamb Liver",
        category: "offal",
        price: 5.99,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80"],
        description: "Fresh lamb liver, rich in iron and nutrients. Great for traditional liver & onions.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.4,
        reviews: 28
    },
    {
        id: 25,
        name: "Chicken Liver",
        category: "offal",
        price: 3.99,
        salePrice: null,
        weight: "500g",
        image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80",
        gallery: ["https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80"],
        description: "Fresh chicken liver, great for pâté, stir-fry and traditional recipes.",
        inStock: true,
        featured: false,
        badge: null,
        rating: 4.3,
        reviews: 21
    }
];

// ============================================================
// DEMO ORDERS (for Admin Panel seeding)
// ============================================================
const DEMO_ORDERS = [
    {
        id: "PH-1001", date: "2026-06-10", status: "delivered",
        customer: { name: "Ahmed Khan", email: "ahmed.khan@email.com", phone: "07700900123" },
        items: [{ productId: 1, name: "Whole Chicken", qty: 2, price: 7.99 }, { productId: 7, name: "Lamb Chops", qty: 1, price: 14.99 }],
        subtotal: 30.97, delivery: 3.99, total: 34.96, address: "45 Green Street, East Ham, E7 8DA", paymentMethod: "card"
    },
    {
        id: "PH-1002", date: "2026-06-11", status: "processing",
        customer: { name: "Fatima Ali", email: "fatima.ali@email.com", phone: "07700900456" },
        items: [{ productId: 20, name: "Marinated Chicken Tikka", qty: 2, price: 10.99 }, { productId: 22, name: "Seekh Kebab Mix", qty: 1, price: 8.49 }],
        subtotal: 30.47, delivery: 0, total: 30.47, address: "12 Barking Road, East Ham, E6 2PQ", paymentMethod: "card"
    },
    {
        id: "PH-1003", date: "2026-06-12", status: "pending",
        customer: { name: "Mohammed Hussain", email: "m.hussain@email.com", phone: "07700900789" },
        items: [{ productId: 8, name: "Lamb Leg (Whole)", qty: 1, price: 24.99 }, { productId: 10, name: "Lamb Mince", qty: 2, price: 9.99 }],
        subtotal: 44.97, delivery: 0, total: 44.97, address: "78 Plashet Road, East Ham, E13 0QY", paymentMethod: "cash"
    },
    {
        id: "PH-1004", date: "2026-06-12", status: "processing",
        customer: { name: "Sadia Rahman", email: "sadia.r@email.com", phone: "07700900321" },
        items: [{ productId: 13, name: "Sirloin Steak", qty: 2, price: 16.99 }, { productId: 12, name: "Beef Mince", qty: 1, price: 8.49 }],
        subtotal: 42.47, delivery: 0, total: 42.47, address: "33 Katherine Road, East Ham, E6 1HZ", paymentMethod: "card"
    },
    {
        id: "PH-1005", date: "2026-06-13", status: "pending",
        customer: { name: "Usman Malik", email: "usman.m@email.com", phone: "07700900654" },
        items: [{ productId: 17, name: "Goat Meat (Diced)", qty: 3, price: 12.99 }],
        subtotal: 38.97, delivery: 3.99, total: 42.96, address: "9 Salisbury Road, Forest Gate, E7 8AZ", paymentMethod: "card"
    },
    {
        id: "PH-1006", date: "2026-06-13", status: "cancelled",
        customer: { name: "Nadia Islam", email: "nadia.i@email.com", phone: "07700900987" },
        items: [{ productId: 2, name: "Chicken Breast (Boneless)", qty: 2, price: 7.49 }],
        subtotal: 14.98, delivery: 3.99, total: 18.97, address: "56 Romford Road, Manor Park, E12 5RG", paymentMethod: "card"
    }
];

// ============================================================
// DEMO CUSTOMERS (for Admin Panel)
// ============================================================
const DEMO_CUSTOMERS = [
    { id: "C001", name: "Ahmed Khan", email: "ahmed.khan@email.com", phone: "07700900123", address: "45 Green Street, East Ham, E7 8DA", joined: "2025-11-15", orders: 8, spent: 284.50 },
    { id: "C002", name: "Fatima Ali", email: "fatima.ali@email.com", phone: "07700900456", address: "12 Barking Road, East Ham, E6 2PQ", joined: "2025-12-02", orders: 5, spent: 172.30 },
    { id: "C003", name: "Mohammed Hussain", email: "m.hussain@email.com", phone: "07700900789", address: "78 Plashet Road, East Ham, E13 0QY", joined: "2026-01-10", orders: 3, spent: 118.40 },
    { id: "C004", name: "Sadia Rahman", email: "sadia.r@email.com", phone: "07700900321", address: "33 Katherine Road, East Ham, E6 1HZ", joined: "2026-02-20", orders: 6, spent: 213.75 },
    { id: "C005", name: "Usman Malik", email: "usman.m@email.com", phone: "07700900654", address: "9 Salisbury Road, Forest Gate, E7 8AZ", joined: "2026-03-05", orders: 4, spent: 156.80 },
    { id: "C006", name: "Nadia Islam", email: "nadia.i@email.com", phone: "07700900987", address: "56 Romford Road, Manor Park, E12 5RG", joined: "2026-04-15", orders: 2, spent: 58.90 },
    { id: "C007", name: "Tariq Hassan", email: "tariq.h@email.com", phone: "07700900111", address: "22 Plashet Grove, East Ham, E6 1AH", joined: "2026-05-01", orders: 7, spent: 298.20 },
    { id: "C008", name: "Zara Patel", email: "zara.p@email.com", phone: "07700900222", address: "67 Hartley Avenue, East Ham, E6 1PG", joined: "2026-05-22", orders: 1, spent: 34.96 }
];

// Admin credentials (MVP - in production use backend auth)
const ADMIN_CREDENTIALS = {
    email: "admin@pakeezahilal.co.uk",
    password: "Admin@123"
};

if (typeof window !== 'undefined') {
    window.ADMIN_CREDENTIALS = ADMIN_CREDENTIALS;
}

let __productsCache = null;
let __ordersCache = null;
let __customersCache = null;
let __cartCache = null;

function apiRequestSync(method, url, body = null) {
    const request = new XMLHttpRequest();
    request.open(method, url, false);
    if (body !== null) {
        request.setRequestHeader('Content-Type', 'application/json');
    }
    request.send(body === null ? null : JSON.stringify(body));

    if (request.status >= 200 && request.status < 300) {
        return request.responseText ? JSON.parse(request.responseText) : null;
    }

    throw new Error(request.responseText || 'Request failed');
}

function getApiBase() {
    return (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin
        : '';
}

function seedData() {
    try {
        __productsCache = apiRequestSync('GET', `${getApiBase()}/api/products`) || PRODUCTS;
    } catch (error) {
        __productsCache = PRODUCTS;
    }

    try {
        __ordersCache = apiRequestSync('GET', `${getApiBase()}/api/orders`) || DEMO_ORDERS;
    } catch (error) {
        __ordersCache = DEMO_ORDERS;
    }

    try {
        __customersCache = apiRequestSync('GET', `${getApiBase()}/api/customers`) || DEMO_CUSTOMERS;
    } catch (error) {
        __customersCache = DEMO_CUSTOMERS;
    }

}

function getProducts() {
    if (__productsCache === null) {
        seedData();
    }
    return __productsCache || PRODUCTS;
}

function saveProducts(products) {
    __productsCache = Array.isArray(products) ? products : [];
    apiRequestSync('PUT', `${getApiBase()}/api/products`, __productsCache);
    return __productsCache;
}

function getOrders() {
    if (__ordersCache === null) {
        seedData();
    }
    return __ordersCache || DEMO_ORDERS;
}

function saveOrders(orders) {
    __ordersCache = Array.isArray(orders) ? orders : [];
    apiRequestSync('PUT', `${getApiBase()}/api/orders`, __ordersCache);
    return __ordersCache;
}

function getCustomers() {
    if (__customersCache === null) {
        seedData();
    }
    return __customersCache || DEMO_CUSTOMERS;
}

function saveCustomers(customers) {
    __customersCache = Array.isArray(customers) ? customers : [];
    apiRequestSync('PUT', `${getApiBase()}/api/customers`, __customersCache);
    return __customersCache;
}

function getCartSessionId() {
    if (typeof window === 'undefined') return '';
    let sessionId = localStorage.getItem('ph_cart_session_id');
    if (!sessionId) {
        sessionId = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('ph_cart_session_id', sessionId);
    }
    return sessionId;
}

function getCart() {
    if (typeof window === 'undefined') return [];
    if (__cartCache === null) {
        const sessionId = getCartSessionId();
        if (sessionId) {
            try {
                const data = apiRequestSync('GET', `${getApiBase()}/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
                __cartCache = data && Array.isArray(data.items) ? data.items : [];
            } catch (error) {
                console.warn('Failed to load cart from DB:', error);
                __cartCache = [];
            }
        } else {
            __cartCache = [];
        }
    }

    const dbProducts = getProducts();
    const resolvedCart = __cartCache.map(item => {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        if (!dbProduct) return null;
        return {
            ...item,
            name: dbProduct.name,
            price: dbProduct.salePrice !== null && dbProduct.salePrice !== undefined ? dbProduct.salePrice : dbProduct.price,
            weight: dbProduct.weight,
            image: dbProduct.image || (Array.isArray(dbProduct.gallery) && dbProduct.gallery[0]) || item.image
        };
    }).filter(Boolean);

    if (resolvedCart.length !== __cartCache.length) {
        __cartCache = resolvedCart;
        saveCart(__cartCache);
    }

    return resolvedCart;
}

function saveCart(cart) {
    if (typeof window === 'undefined') return;
    __cartCache = Array.isArray(cart) ? cart : [];
    const sessionId = getCartSessionId();
    if (!sessionId) return;
    try {
        apiRequestSync('PUT', `${getApiBase()}/api/cart`, { sessionId, items: __cartCache });
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new Event('cart:updated'));
        }
    } catch (error) {
        console.warn('Failed to save cart to DB:', error);
    }
}

function getCurrentUser() {
    const stored = localStorage.getItem('ph_current_user');
    return stored ? JSON.parse(stored) : null;
}

seedData();
