export function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const currentFilename = currentPath.split('/').pop() || 'index.html';
    const currentSearch = window.location.search;

    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-links a, .nav-dropdown-menu a');

    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href') || '';
        const [hrefPath, hrefSearch] = href.split('?');
        const hrefFilename = hrefPath.split('/').pop() || 'index.html';

        const isIndex = (name) => {
            const clean = name.replace('.html', '');
            return clean === 'index' || clean === '' || clean === '/';
        };
        
        const cleanCurrent = currentFilename.replace('.html', '');
        const cleanHref = hrefFilename.replace('.html', '');
        
        const isPathMatch = (isIndex(currentFilename) && isIndex(hrefFilename)) || 
                            (!isIndex(currentFilename) && cleanCurrent === cleanHref);

        if (isPathMatch) {
            if (hrefSearch) {
                // If query is present (e.g. ?cat=chicken)
                if (currentSearch && currentSearch.includes(hrefSearch)) {
                    link.classList.add('active');
                }
            } else {
                // If it is pathname only (e.g. index.html, about.html)
                if (cleanHref !== 'shop') {
                    link.classList.add('active');
                }
            }
        }
    });

    // Parent navigation highlighting for Shop page/categories
    if (currentFilename.replace('.html', '') === 'shop') {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const filename = href.split('?')[0].split('/').pop() || '';
            if (filename.replace('.html', '') === 'shop') {
                link.classList.add('active');
            }
        });
    }
}
