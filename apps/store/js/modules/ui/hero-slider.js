export function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    let current = 0;
    let interval;

    function goTo(idx) {
        slides[current].classList.remove('active');
        dots[current]?.classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current]?.classList.add('active');
    }

    function startAuto() {
        interval = setInterval(() => goTo(current + 1), 5000);
    }

    document.querySelector('.hero-next')?.addEventListener('click', () => {
        clearInterval(interval); goTo(current + 1); startAuto();
    });
    document.querySelector('.hero-prev')?.addEventListener('click', () => {
        clearInterval(interval); goTo(current - 1); startAuto();
    });
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
        clearInterval(interval); goTo(i); startAuto();
    }));

    goTo(0);
    startAuto();
}
