import assert from 'node:assert/strict';

const store = {};
const userKey = 'ph_wishlist_session_id';
const sessionValue = 'anon-1234';
store[userKey] = sessionValue;

globalThis.localStorage = {
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
        store[key] = String(value);
    },
    removeItem(key) {
        delete store[key];
    }
};

globalThis.window = {
    location: { search: '' },
    dispatchEvent() { },
    addEventListener() { }
};

globalThis.document = {
    querySelectorAll() {
        return [];
    },
    getElementById() {
        return null;
    },
    createElement() {
        return {
            className: '',
            style: {},
            setAttribute() { },
            appendChild() { },
            addEventListener() { },
            remove() { }
        };
    },
    body: {
        appendChild() { }
    }
};

let responseQueue = [
    { ok: true, json: async () => ({ productIds: [7, 9], items: [{ id: 7, name: 'P1' }, { id: 9, name: 'P2' }] }) },
    { ok: true, json: async () => ({ productIds: [7, 9, 2], items: [{ id: 7, name: 'P1' }, { id: 9, name: 'P2' }, { id: 2, name: 'P3' }] }) }
];

globalThis.fetch = async (url, init = {}) => {
    if (url.startsWith('/api/wishlist?')) {
        return responseQueue.shift();
    }
    if (url === '/api/wishlist/toggle') {
        const body = JSON.parse(init.body || '{}');
        return {
            ok: true,
            json: async () => ({
                productIds: [7, 9, body.productId],
                items: [{ id: 7, name: 'P1' }, { id: 9, name: 'P2' }, { id: body.productId, name: 'P3' }]
            })
        };
    }
    throw new Error(`Unexpected fetch: ${url}`);
};

const wishlistModule = await import('../apps/store/js/modules/wishlist.js');
const { hydrateWishlistFromServer, getWishlist, toggleWishlist } = wishlistModule;

const hydrated = await hydrateWishlistFromServer(true);
assert.deepEqual(hydrated.map(item => item.id), [7, 9]);
assert.deepEqual(getWishlist(), [7, 9]);

const added = await toggleWishlist(null, 2);
assert.equal(added, true);
assert.deepEqual(getWishlist(), [7, 9, 2]);

console.log('wishlist persistence check passed');
