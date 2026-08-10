export function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    const target = new Date().getTime() + 48 * 60 * 60 * 1000;

    function update() {
        const now = new Date().getTime();
        const diff = target - now;
        if (diff <= 0) { el.innerHTML = '<span>Offer ended!</span>'; return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        ['hours', 'mins', 'secs'].forEach((key, i) => {
            const numEl = el.querySelector(`[data-unit="${key}"]`);
            if (numEl) numEl.textContent = [h, m, s][i].toString().padStart(2, '0');
        });
    }

    update();
    setInterval(update, 1000);
}
