
    document.addEventListener('DOMContentLoaded', () => {
    const body      = document.body;
    const welcome   = document.getElementById('welcome-screen');
    const appEn     = document.getElementById('app-en');
    const appZh     = document.getElementById('app-zh');

    let touchStartY = 0;
    let touchEndY   = 0;

    // Capture swipe on welcome screen
    welcome.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].clientY;
});
    welcome.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
});

    // Also allow quick testing on desktop by clicking top/bottom:
    welcome.addEventListener('click', (e) => {
    const rect = welcome.getBoundingClientRect();
    const mid  = rect.top + rect.height / 2;
    // Now top half => 'down' => Chinese
    // bottom half => 'up' => English
    if (e.clientY < mid) {
    handleSwipe('down');
} else {
    handleSwipe('up');
}
});

    function handleSwipe(forcedDir = null) {
    const deltaY = touchEndY - touchStartY;
    let direction = forcedDir;
    if (!direction) {
    direction = (deltaY < 0) ? 'up' : 'down';
}

    // Swipe Up => English
    // Swipe Down => Chinese
    if (direction === 'up') {
    showSystem('en');
} else {
    showSystem('zh');
}
}

    function showSystem(lang) {
    // Enable transitions
    body.classList.add('enable-transitions');

    if (lang === 'en') {
    // Move welcome screen up
    welcome.style.transform = 'translateY(-100%)';
    welcome.style.opacity   = '0';

    // Show the EN container, which starts at translateY(100%)
    appEn.style.display = 'block';
    setTimeout(() => {
    appEn.style.opacity   = '1';
    appEn.style.transform = 'translateY(0)';
}, 50);

    initEnglish();
} else {
    // Move welcome screen down
    welcome.style.transform = 'translateY(100%)';
    welcome.style.opacity   = '0';

    // Show the ZH container
    appZh.style.display = 'block';
    // We treat it as if it's above the screen (translateY(-100%)).
    appZh.style.transform = 'translateY(-100%)';
    requestAnimationFrame(() => {
    setTimeout(() => {
    appZh.style.opacity   = '1';
    appZh.style.transform = 'translateY(0)';
}, 50);
});

    initChinese();
}
}

    // ============== Desktop Logic for English ==============
    function initEnglish() {
    if (window.innerWidth <= 768) return;
    // On mobile, we rely on scroll-snap.

    const floatingEn  = document.getElementById('floating-menu-en');
    const menuItemsEn = Array.from(floatingEn.querySelectorAll('a'));
    const sectionsEn  = menuItemsEn.map(
    btn => document.getElementById('content-en-' + btn.dataset.index)
    );

    let activeIndex = 0;
    sectionsEn.forEach((sec, i) => {
    if (i === 0) {
    sec.style.transform = 'translateY(0)';
    sec.style.opacity   = '1';
} else {
    sec.style.transform = 'translateY(100%)';
    sec.style.opacity   = '0';
}
});

    // Menus start invisible
    menuItemsEn.forEach(btn => btn.style.opacity = '0');
    placeButtons(menuItemsEn, activeIndex, false);

    // Stagger fade in
    setTimeout(() => {
    menuItemsEn.forEach((btn, idx) => {
    setTimeout(() => {
    btn.style.opacity = '1';
}, idx * 200);
});
}, 600);

    // Click handlers
    menuItemsEn.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (i === activeIndex) return;

    sectionsEn[activeIndex].style.transform = 'translateY(100%)';
    sectionsEn[activeIndex].style.opacity   = '0';
    sectionsEn[i].style.transform = 'translateY(0)';
    sectionsEn[i].style.opacity   = '1';

    activeIndex = i;
    placeButtons(menuItemsEn, activeIndex, true);
});
});

    // Re-center on window resize
    window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
    placeButtons(menuItemsEn, activeIndex, false);
}
});
}

    // ============== Desktop Logic for Chinese ==============
    function initChinese() {
    if (window.innerWidth <= 768) return;

    const floatingZh  = document.getElementById('floating-menu-zh');
    const menuItemsZh = Array.from(floatingZh.querySelectorAll('a'));
    const sectionsZh  = menuItemsZh.map(
    btn => document.getElementById('content-zh-' + btn.dataset.index)
    );

    let activeIndex = 0;
    sectionsZh.forEach((sec, i) => {
    if (i === 0) {
    sec.style.transform = 'translateY(0)';
    sec.style.opacity   = '1';
} else {
    sec.style.transform = 'translateY(100%)';
    sec.style.opacity   = '0';
}
});

    menuItemsZh.forEach(btn => btn.style.opacity = '0');
    placeButtons(menuItemsZh, activeIndex, false);

    setTimeout(() => {
    menuItemsZh.forEach((btn, idx) => {
    setTimeout(() => {
    btn.style.opacity = '1';
}, idx * 200);
});
}, 600);

    // Click handlers
    menuItemsZh.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (i === activeIndex) return;
    sectionsZh[activeIndex].style.transform = 'translateY(100%)';
    sectionsZh[activeIndex].style.opacity   = '0';
    sectionsZh[i].style.transform = 'translateY(0)';
    sectionsZh[i].style.opacity   = '1';

    activeIndex = i;
    placeButtons(menuItemsZh, activeIndex, true);
});
});

    window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
    placeButtons(menuItemsZh, activeIndex, false);
}
});
}

    // ============== placeButtons (shared) ==============
    function placeButtons(menuItems, activeIdx, animate) {
    const centerY = window.innerHeight / 2;
    const halfActive = 25;
    const scaleActive = 1.0;
    const scaleInactive = 0.7;

    const spacingFromActive = 80;
    const spacingUnselected = 50;

    if (!animate) {
    menuItems.forEach(btn => {
    btn.style.transition = 'none';
});
}

    // Place active in center
    const activeY = centerY - halfActive;
    menuItems[activeIdx].style.transform =
    `translateY(${activeY}px) scale(${scaleActive})`;

    // Below the active
    let belowPos = activeY;
    for (let j = activeIdx + 1; j < menuItems.length; j++) {
    const dist = (j === activeIdx + 1)
    ? spacingFromActive
    : spacingUnselected;
    belowPos += dist;
    menuItems[j].style.transform =
    `translateY(${belowPos}px) scale(${scaleInactive})`;
}

    // Above the active
    let abovePos = activeY;
    for (let j = activeIdx - 1; j >= 0; j--) {
    const dist = (j === activeIdx - 1)
    ? spacingFromActive
    : spacingUnselected;
    abovePos -= dist;
    menuItems[j].style.transform =
    `translateY(${abovePos}px) scale(${scaleInactive})`;
}

    if (!animate) {
    requestAnimationFrame(() => {
    menuItems.forEach(btn => {
    btn.style.transition = '';
});
});
}
}
});
