export function debounce(fn, delay) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function formatPrice(price) {
    return `£${Number(price).toFixed(2)}`;
}

export function getUrlParam(key) {
    const searchValue = new URLSearchParams(window.location.search).get(key);
    if (searchValue) return searchValue;

    const segments = window.location.pathname.split('/').filter(Boolean);
    if (key === 'id' && segments[0] === 'product' && segments[1]) {
        return segments[1];
    }

    if (key === 'cat' && segments[0] === 'shop' && segments[1]) {
        return segments[1];
    }

    return null;
}
