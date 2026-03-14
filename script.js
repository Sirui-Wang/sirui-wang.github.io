document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const welcome = document.getElementById("welcome-screen");
    const appEn = document.getElementById("app-en");
    const appZh = document.getElementById("app-zh");
    const galleryImageList = Array.isArray(window.GALLERY_IMAGES) ? window.GALLERY_IMAGES : [];

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

    renderGallery("en", galleryImageList);
    renderGallery("zh", galleryImageList);

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
            initTimelines(lang);
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

        initTimelines(lang);
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

    function initTimelines(lang) {
        const timelineItems = document.querySelectorAll(`#app-${lang} .timeline-item`);

        timelineItems.forEach((item) => {
            item.addEventListener("click", () => {
                const shouldOpen = !item.classList.contains("is-open");

                timelineItems.forEach((entry) => {
                    entry.classList.remove("is-open");
                });

                if (shouldOpen) {
                    item.classList.add("is-open");
                }
            });
        });
    }

    function renderGallery(lang, images) {
        const gallery = document.getElementById(`gallery-${lang}`);
        if (!gallery) {
            return;
        }

        gallery.innerHTML = "";

        images.forEach((imageData, index) => {
            const figure = document.createElement("figure");
            figure.className = "gallery-card";

            const image = document.createElement("img");
            image.src = imageData.src;
            image.alt = imageData.alt;
            image.loading = "lazy";

            const caption = document.createElement("figcaption");
            caption.textContent = lang === "zh" ? imageData.captionZh : imageData.captionEn;

            image.addEventListener("load", () => {
                if (image.naturalWidth > image.naturalHeight) {
                    figure.classList.add("is-landscape");
                }
            });

            image.addEventListener("error", () => {
                figure.classList.add("is-placeholder");
                figure.textContent = lang === "zh"
                    ? imageData.captionZh || `照片占位 ${index + 1}`
                    : imageData.captionEn || `Photo Placeholder ${index + 1}`;
            });

            figure.appendChild(image);
            figure.appendChild(caption);
            gallery.appendChild(figure);
        });

        if (images.length === 0) {
            const emptyState = document.createElement("figure");
            emptyState.className = "gallery-card is-placeholder";
            emptyState.textContent = lang === "zh"
                ? "将图片拖入 media/gallery/ 后重新生成画廊清单"
                : "Drop images into media/gallery/ and regenerate the gallery manifest";
            gallery.appendChild(emptyState);
        }
    }
});
