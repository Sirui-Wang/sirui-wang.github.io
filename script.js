document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const welcome = document.getElementById("welcome-screen");
    const appEn = document.getElementById("app-en");
    const appZh = document.getElementById("app-zh");

    let touchStartY = 0;
    let touchEndY = 0;

    welcome.addEventListener("touchstart", (event) => {
        touchStartY = event.changedTouches[0].clientY;
    });

    welcome.addEventListener("touchend", (event) => {
        touchEndY = event.changedTouches[0].clientY;
        handleSwipe();
    });

    welcome.addEventListener("click", (event) => {
        const rect = welcome.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        handleSwipe(event.clientY < midpoint ? "down" : "up");
    });

    function handleSwipe(forcedDirection = null) {
        const deltaY = touchEndY - touchStartY;
        const direction = forcedDirection || (deltaY < 0 ? "up" : "down");
        showSystem(direction === "up" ? "en" : "zh");
    }

    function showSystem(lang) {
        body.classList.add("enable-transitions");

        if (lang === "en") {
            welcome.style.transform = "translateY(-100%)";
            welcome.style.opacity = "0";
            appEn.style.display = "block";

            setTimeout(() => {
                appEn.style.opacity = "1";
                appEn.style.transform = "translateY(0)";
            }, 50);

            initLanguage("en");
            return;
        }

        welcome.style.transform = "translateY(100%)";
        welcome.style.opacity = "0";
        appZh.style.display = "block";
        appZh.style.transform = "translateY(-100%)";

        requestAnimationFrame(() => {
            setTimeout(() => {
                appZh.style.opacity = "1";
                appZh.style.transform = "translateY(0)";
            }, 50);
        });

        initLanguage("zh");
    }

    function initLanguage(lang) {
        if (window.innerWidth <= 768) {
            return;
        }

        const floatingMenu = document.getElementById(`floating-menu-${lang}`);
        const menuItems = Array.from(floatingMenu.querySelectorAll("a"));
        const sections = menuItems.map((button) =>
            document.getElementById(`content-${lang}-${button.dataset.index}`)
        );

        let activeIndex = 0;

        sections.forEach((section, index) => {
            section.style.transform = index === 0 ? "translateY(0)" : "translateY(100%)";
            section.style.opacity = index === 0 ? "1" : "0";
        });

        menuItems.forEach((button) => {
            button.style.opacity = "0";
        });

        placeButtons(menuItems, activeIndex, false);

        setTimeout(() => {
            menuItems.forEach((button, index) => {
                setTimeout(() => {
                    button.style.opacity = "1";
                }, index * 160);
            });
        }, 600);

        menuItems.forEach((button, index) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();

                if (index === activeIndex) {
                    return;
                }

                sections[activeIndex].style.transform = "translateY(100%)";
                sections[activeIndex].style.opacity = "0";
                sections[index].style.transform = "translateY(0)";
                sections[index].style.opacity = "1";

                activeIndex = index;
                placeButtons(menuItems, activeIndex, true);
            });
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) {
                placeButtons(menuItems, activeIndex, false);
            }
        });
    }

    function placeButtons(menuItems, activeIndex, animate) {
        const centerY = window.innerHeight / 2;
        const halfActiveHeight = 26;
        const activeScale = 1;
        const inactiveScale = 0.74;
        const firstGap = 88;
        const regularGap = 56;

        if (!animate) {
            menuItems.forEach((button) => {
                button.style.transition = "none";
            });
        }

        const activeY = centerY - halfActiveHeight;
        menuItems[activeIndex].style.transform = `translateY(${activeY}px) scale(${activeScale})`;

        let belowPosition = activeY;
        for (let index = activeIndex + 1; index < menuItems.length; index += 1) {
            belowPosition += index === activeIndex + 1 ? firstGap : regularGap;
            menuItems[index].style.transform = `translateY(${belowPosition}px) scale(${inactiveScale})`;
        }

        let abovePosition = activeY;
        for (let index = activeIndex - 1; index >= 0; index -= 1) {
            abovePosition -= index === activeIndex - 1 ? firstGap : regularGap;
            menuItems[index].style.transform = `translateY(${abovePosition}px) scale(${inactiveScale})`;
        }

        if (!animate) {
            requestAnimationFrame(() => {
                menuItems.forEach((button) => {
                    button.style.transition = "";
                });
            });
        }
    }
});
