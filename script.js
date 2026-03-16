document.addEventListener("DOMContentLoaded", () => {
    const DESKTOP_BREAKPOINT = 1100;
    const WELCOME_TRANSITION_MS = 850;
    const SWIPE_THRESHOLD_PX = 24;
    const body = document.body;
    const welcome = document.getElementById("welcome-screen");
    const appEn = document.getElementById("app-en");
    const appZh = document.getElementById("app-zh");
    const galleryImageList = Array.isArray(window.GALLERY_IMAGES) ? window.GALLERY_IMAGES : [];
    const languageStates = new Map();

    let touchStartY = 0;
    let touchEndY = 0;

    welcome.addEventListener("touchstart", (event) => {
        touchStartY = event.changedTouches[0].clientY;
    });

    welcome.addEventListener("touchend", (event) => {
        touchEndY = event.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaY) >= SWIPE_THRESHOLD_PX) {
            handleSwipe(deltaY < 0 ? "up" : "down");
            return;
        }

        const rect = welcome.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        handleSwipe(touchEndY < midpoint ? "down" : "up");
    });

    welcome.addEventListener("click", (event) => {
        const rect = welcome.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        handleSwipe(event.clientY < midpoint ? "down" : "up");
    });

    renderGallery("en", galleryImageList);
    renderGallery("zh", galleryImageList);

    Array.from(document.querySelectorAll(".language-switch")).forEach((button) => {
        button.addEventListener("click", () => {
            switchLanguage(button.dataset.targetLang);
        });
    });

    function handleSwipe(forcedDirection = null) {
        const deltaY = touchEndY - touchStartY;
        const direction = forcedDirection || (deltaY < 0 ? "up" : "down");
        showSystem(direction === "up" ? "en" : "zh");
    }

    function showSystem(lang) {
        body.classList.add("enable-transitions");
        welcome.style.pointerEvents = "none";

        if (lang === "en") {
            welcome.style.transform = "translateY(-100%)";
            welcome.style.opacity = "0";
            appEn.style.display = "block";

            setTimeout(() => {
                appEn.style.opacity = "1";
                appEn.style.transform = "translateY(0)";
            }, 50);

            initLanguage("en");
            window.setTimeout(() => {
                welcome.style.display = "none";
            }, WELCOME_TRANSITION_MS);
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
        window.setTimeout(() => {
            welcome.style.display = "none";
        }, WELCOME_TRANSITION_MS);
    }

    function initLanguage(lang) {
        const app = document.getElementById(`app-${lang}`);
        const sections = Array.from({ length: 5 }, (_, index) =>
            document.getElementById(`content-${lang}-${index}`)
        );
        const existingState = languageStates.get(lang) || { timelineReady: false };

        if (!existingState.timelineReady) {
            initTimelines(lang);
        }

        applyLanguageMode(lang, app, sections, true);
        languageStates.set(lang, {
            ...languageStates.get(lang),
            timelineReady: true
        });
    }

    function getVisibleLanguage() {
        if (appEn.style.display === "block") {
            return "en";
        }

        if (appZh.style.display === "block") {
            return "zh";
        }

        return null;
    }

    function switchLanguage(targetLang) {
        const currentLang = getVisibleLanguage();

        if (!targetLang || targetLang === currentLang) {
            return;
        }

        const sourceState = currentLang ? languageStates.get(currentLang) : null;
        const targetState = languageStates.get(targetLang) || {};
        const targetIndex = sourceState?.currentIndex ?? targetState.currentIndex ?? 0;

        languageStates.set(targetLang, {
            ...targetState,
            currentIndex: targetIndex
        });

        appEn.style.display = targetLang === "en" ? "block" : "none";
        appZh.style.display = targetLang === "zh" ? "block" : "none";
        appEn.style.opacity = targetLang === "en" ? "1" : "0";
        appZh.style.opacity = targetLang === "zh" ? "1" : "0";
        appEn.style.transform = "translateY(0)";
        appZh.style.transform = "translateY(0)";

        initLanguage(targetLang);

        const targetApp = document.getElementById(`app-${targetLang}`);
        if (window.innerWidth <= DESKTOP_BREAKPOINT) {
            const targetSection = document.getElementById(`content-${targetLang}-${targetIndex}`);
            const stickyNav = document.getElementById(`sticky-nav-${targetLang}`);
            const languageBar = document.getElementById(`language-bar-${targetLang}`);
            const stickyOffset = (stickyNav?.offsetHeight || 0) + (languageBar?.offsetHeight || 0) + 12;

            if (targetSection) {
                const targetTop = Math.max(targetSection.offsetTop - stickyOffset, 0);
                targetApp.scrollTo({ top: targetTop, behavior: "auto" });
                window.scrollTo({ top: 0, behavior: "auto" });
            }
        }
    }

    function applyLanguageMode(lang, app, sections, force = false) {
        const nextMode = window.innerWidth > DESKTOP_BREAKPOINT ? "desktop" : "stacked";
        const state = languageStates.get(lang) || {};

        if (!force && state.mode === nextMode) {
            state.sync?.();
            return;
        }

        state.cleanup?.();
        resetNavigationState(lang, sections);

        const navigation = nextMode === "desktop"
            ? initDesktopNavigation(lang, sections, state.currentIndex || 0)
            : initStackedNavigation(app, lang, sections);

        languageStates.set(lang, {
            ...state,
            ...navigation,
            mode: nextMode
        });
    }

    function resetNavigationState(lang, sections) {
        const floatingMenu = document.getElementById(`floating-menu-${lang}`);
        const stickyNav = document.getElementById(`sticky-nav-${lang}`);

        if (floatingMenu) {
            Array.from(floatingMenu.querySelectorAll("a")).forEach((button) => {
                button.style.opacity = "";
                button.style.transform = "";
                button.style.transition = "";
            });
        }

        if (stickyNav) {
            Array.from(stickyNav.querySelectorAll("a")).forEach((button) => {
                button.classList.remove("is-active");
            });
            stickyNav.scrollLeft = 0;
        }

        sections.forEach((section) => {
            section.style.transform = "";
            section.style.opacity = "";
        });
    }

    function initDesktopNavigation(lang, sections, initialIndex) {
        const floatingMenu = document.getElementById(`floating-menu-${lang}`);
        const menuItems = Array.from(floatingMenu.querySelectorAll("a"));
        let activeIndex = Math.max(0, Math.min(initialIndex, sections.length - 1));

        sections.forEach((section, index) => {
            section.style.transform = index === activeIndex ? "translateY(0)" : "translateY(100%)";
            section.style.opacity = index === activeIndex ? "1" : "0";
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
                const state = languageStates.get(lang);
                if (state) {
                    state.currentIndex = activeIndex;
                }
                placeButtons(menuItems, activeIndex, true);
            });
        });

        return {
            currentIndex: activeIndex,
            sync: () => {
                placeButtons(menuItems, activeIndex, false);
            },
            cleanup: () => {
                menuItems.forEach((button) => {
                    const clone = button.cloneNode(true);
                    button.replaceWith(clone);
                });
            }
        };
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

    function initStackedNavigation(app, lang, sections) {
        const stickyNav = document.getElementById(`sticky-nav-${lang}`);
        const languageBar = document.getElementById(`language-bar-${lang}`);
        if (!stickyNav) {
            return {
                currentIndex: 0,
                sync: () => {},
                cleanup: () => {}
            };
        }

        const navItems = Array.from(stickyNav.querySelectorAll("a"));
        const getStickyOffset = () => stickyNav.offsetHeight + (languageBar?.offsetHeight || 0) + 12;
        const getScrollRoot = () => (
            app.scrollHeight > app.clientHeight + 4
                ? app
                : document.scrollingElement || document.documentElement
        );
        const centerActiveNavItem = (activeItem) => {
            const targetLeft = activeItem.offsetLeft - ((stickyNav.clientWidth - activeItem.clientWidth) / 2);

            stickyNav.scrollTo({
                left: Math.max(targetLeft, 0),
                behavior: "smooth"
            });
        };
        const updateActiveItem = (activeIndex) => {
            navItems.forEach((item, index) => {
                item.classList.toggle("is-active", index === activeIndex);
            });

            const activeItem = navItems[activeIndex];
            if (activeItem) {
                centerActiveNavItem(activeItem);
            }

            const state = languageStates.get(lang);
            if (state) {
                state.currentIndex = activeIndex;
            }
        };

        let currentIndex = 0;
        let suppressSync = false;

        const detectActiveIndex = () => {
            const offset = getStickyOffset();

            return sections.reduce((bestIndex, section, index) => {
                const rect = section.getBoundingClientRect();
                const distance = Math.abs(rect.top - offset);
                const bestRect = sections[bestIndex].getBoundingClientRect();
                const bestDistance = Math.abs(bestRect.top - offset);

                return distance < bestDistance ? index : bestIndex;
            }, 0);
        };

        navItems.forEach((item) => {
            item.addEventListener("click", (event) => {
                event.preventDefault();
                const index = Number(item.dataset.index);
                const targetSection = sections[index];

                if (!targetSection) {
                    return;
                }

                const scrollRoot = getScrollRoot();
                const stickyOffset = getStickyOffset();
                currentIndex = index;
                updateActiveItem(currentIndex);
                suppressSync = true;

                window.setTimeout(() => {
                    suppressSync = false;
                    syncActiveItem();
                }, 450);

                if (scrollRoot === app) {
                    const appRect = app.getBoundingClientRect();
                    const sectionRect = targetSection.getBoundingClientRect();
                    const targetTop = app.scrollTop + sectionRect.top - appRect.top - stickyOffset;

                    app.scrollTo({
                        top: Math.max(targetTop, 0),
                        behavior: "smooth"
                    });
                    return;
                }

                const targetTop = window.scrollY + targetSection.getBoundingClientRect().top - stickyOffset;
                window.scrollTo({
                    top: Math.max(targetTop, 0),
                    behavior: "smooth"
                });
            });
        });

        const syncActiveItem = () => {
            if (suppressSync) {
                return;
            }

            currentIndex = detectActiveIndex();

            if (currentIndex >= 0) {
                updateActiveItem(currentIndex);
            }
        };

        app.addEventListener("scroll", syncActiveItem, { passive: true });
        window.addEventListener("scroll", syncActiveItem, { passive: true });
        window.addEventListener("resize", syncActiveItem);
        syncActiveItem();

        return {
            currentIndex,
            sync: syncActiveItem,
            cleanup: () => {
                navItems.forEach((item) => {
                    const clone = item.cloneNode(true);
                    item.replaceWith(clone);
                });
                app.removeEventListener("scroll", syncActiveItem);
                window.removeEventListener("scroll", syncActiveItem);
                window.removeEventListener("resize", syncActiveItem);
            }
        };
    }

    function initTimelines(lang) {
        const timelineItems = document.querySelectorAll(`#app-${lang} .timeline-item`);

        if (timelineItems.length > 0) {
            timelineItems[0].classList.add("is-open");
        }

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

    window.addEventListener("resize", () => {
        ["en", "zh"].forEach((lang) => {
            const state = languageStates.get(lang);

            if (!state?.timelineReady) {
                return;
            }

            const app = document.getElementById(`app-${lang}`);
            const sections = Array.from({ length: 5 }, (_, index) =>
                document.getElementById(`content-${lang}-${index}`)
            );

            applyLanguageMode(lang, app, sections);
        });
    });
});
