export function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
