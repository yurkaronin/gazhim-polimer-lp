/* ==========================================================================
   gazhim-polimer.ru — main.js
   Минимальный ванильный JS: шапка при прокрутке, мобильное меню,
   аккордеон «Продукция», слайдер «Продукция» (переключение по кругу +
   автосмена с паузой при наведении), кнопка «наверх», анимация появления.
   Без внешних зависимостей.
   ========================================================================== */

(function () {
  "use strict";

  var header = document.querySelector(".header");
  var burger = document.querySelector(".header__burger");
  var mobileMenu = document.querySelector(".mobile-menu");
  var toTop = document.querySelector(".to-top");

  /* Порог, после которого desktop-навигация видна, а мобильное меню
     сворачивается. Должен совпадать с брейкпоинтом в main.css (≤992px). */
  var DESKTOP_BREAKPOINT = 992;

  /* --- Шапка: фон появляется при прокрутке --- */
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (header) {
      header.classList.toggle("header--scrolled", y > 8);
    }

    if (toTop) {
      toTop.classList.toggle("to-top--visible", y > 600);
    }
  }

  /* --- Мобильное меню --- */
  function setAccordions(expanded) {
    var toggles = document.querySelectorAll(".mobile-menu__toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  }

  function closeMenu() {
    if (!header) return;
    header.classList.remove("header--menu-open");
    if (mobileMenu) mobileMenu.classList.remove("mobile-menu--open");
    if (burger) {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
      var icon = burger.querySelector(".icon");
      if (icon) icon.textContent = "menu";
    }
    setAccordions(false);
    document.body.style.overflow = "";
  }

  function openMenu() {
    if (!header) return;
    header.classList.add("header--menu-open");
    if (mobileMenu) mobileMenu.classList.add("mobile-menu--open");
    if (burger) {
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Закрыть меню");
      var icon = burger.querySelector(".icon");
      if (icon) icon.textContent = "close";
    }
    document.body.style.overflow = "hidden";
  }

  if (burger && header) {
    burger.addEventListener("click", function () {
      var isOpen = header.classList.contains("header--menu-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  /* Закрытие меню по клику на ссылку внутри панели */
  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        closeMenu();
      }
    });
  }

  /* Закрытие меню по Escape */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header && header.classList.contains("header--menu-open")) {
      closeMenu();
    }
  });

  /* --- Аккордеон «Продукция» (кнопки с aria-expanded) --- */
  var accordionToggles = document.querySelectorAll(".mobile-menu__toggle");
  for (var i = 0; i < accordionToggles.length; i++) {
    accordionToggles[i].addEventListener("click", function () {
      var expanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", expanded ? "false" : "true");
    });
  }

  /* --- Прокрутка и ресайз --- */
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    onScroll();
    /* При переходе к desktop-ширине закрываем меню и разблокируем скролл */
    if (window.innerWidth > DESKTOP_BREAKPOINT) {
      closeMenu();
    }
  });
  onScroll();

  /* --- Кнопка «наверх» --- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --- Слайдер «Продукция» (шаг 9 + 14) ---
     Нативный горизонтальный скролл со scroll-snap. Переключение по кругу:
     на последнем слайде «дальше» возвращает к первому, на первом «назад» —
     к последнему. Автосмена слайдов с паузой при наведении/фокусе на слайдер
     и при неактивной вкладке. Плавность — с учётом prefers-reduced-motion. */
  var slider = document.querySelector(".products__slider");
  if (slider) {
    var viewport = slider.querySelector(".products__viewport");
    var track = slider.querySelector(".products__track");
    var slides = slider.querySelectorAll(".products__slide");
    var prevArrow = slider.querySelector(".products__arrow--prev");
    var nextArrow = slider.querySelector(".products__arrow--next");
    var dots = document.querySelectorAll(".products__dots .products__dot");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var AUTOPLAY_DELAY = 5000;  /* интервал автосмены, мс */
    var step = 0;               /* ширина слайда + зазор между слайдами */
    var ticking = false;
    var autoplayTimer = null;
    var hovered = false;

    function slideStep() {
      if (!slides.length) return 0;
      var gap = 0;
      if (track) {
        var cs = window.getComputedStyle(track);
        gap = parseFloat(cs.columnGap || cs.gap) || 0;
      }
      return slides[0].getBoundingClientRect().width + gap;
    }

    function maxScrollLeft() {
      return viewport ? viewport.scrollWidth - viewport.clientWidth : 0;
    }

    function pageCount() {
      if (!viewport || step <= 0) return 1;
      var max = maxScrollLeft();
      if (max <= 0) return 1;
      return Math.round(max / step) + 1;
    }

    function activeIndex() {
      if (!viewport || step <= 0) return 0;
      var max = maxScrollLeft();
      if (max <= 0) return 0;
      var idx = Math.round(viewport.scrollLeft / step);
      return Math.min(Math.max(idx, 0), pageCount() - 1);
    }

    function refresh() {
      if (!viewport) return;
      var idx = activeIndex();
      var count = pageCount();

      /* Стрелки всегда активны — слайдер зациклен */
      if (prevArrow) prevArrow.disabled = false;
      if (nextArrow) nextArrow.disabled = false;

      for (var i = 0; i < dots.length; i++) {
        var active = i === idx;
        dots[i].setAttribute("aria-current", active ? "true" : "false");
        dots[i].classList.toggle("products__dot--active", active);
        /* Показываем столько точек, сколько позиций (страниц) у слайдера:
           3 видимых слайда → 3 точки, 2 → 4, 1 → 5. Так пагинация не
           «ломается» при переключении по кругу: последняя точка — это
           крайняя позиция, и переход на первый слайд снова ведёт к 1-й. */
        dots[i].hidden = i >= count;
      }
    }

    function onSliderScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          refresh();
        });
      }
    }

    function scrollToIndex(index) {
      if (!viewport) return;
      var left = Math.min(index * step, maxScrollLeft());
      viewport.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
    }

    /* Сдвиг на один шаг с зацикливанием */
    function goBy(delta) {
      if (!viewport) return;
      var max = maxScrollLeft();
      var left = viewport.scrollLeft;
      var target;
      var wrap = false;

      if (delta > 0) {
        if (left >= max - 1) {
          target = 0;           /* с последнего — на первый */
          wrap = true;
        } else {
          target = Math.min(left + step, max);
        }
      } else {
        if (left <= 1) {
          target = max;         /* с первого — на последний */
          wrap = true;
        } else {
          target = Math.max(left - step, 0);
        }
      }

      viewport.scrollTo({
        left: target,
        behavior: (reduceMotion || wrap) ? "auto" : "smooth"
      });
    }

    /* --- Автосмена (пауза при наведении/фокусе и неактивной вкладке) --- */
    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (reduceMotion || slides.length < 2 || hovered) return;
      autoplayTimer = window.setInterval(function () {
        if (document.hidden) return;
        goBy(1);
      }, AUTOPLAY_DELAY);
    }

    function recalc() {
      step = slideStep();
      refresh();
    }

    if (prevArrow) prevArrow.addEventListener("click", function () { goBy(-1); startAutoplay(); });
    if (nextArrow) nextArrow.addEventListener("click", function () { goBy(1); startAutoplay(); });

    for (var d = 0; d < dots.length; d++) {
      (function (index) {
        dots[index].addEventListener("click", function () { scrollToIndex(index); startAutoplay(); });
      })(d);
    }

    if (viewport) {
      viewport.addEventListener("scroll", onSliderScroll, { passive: true });
      /* Пауза автосмены на время перетаскивания пальцем */
      viewport.addEventListener("touchstart", function () { stopAutoplay(); }, { passive: true });
      viewport.addEventListener("touchend", function () { startAutoplay(); });
    }

    /* Пауза автосмены при наведении/фокусе на слайдер */
    slider.addEventListener("mouseenter", function () { hovered = true; stopAutoplay(); });
    slider.addEventListener("mouseleave", function () { hovered = false; startAutoplay(); });
    slider.addEventListener("focusin", function () { hovered = true; stopAutoplay(); });
    slider.addEventListener("focusout", function () { hovered = false; startAutoplay(); });

    /* Пауза при неактивной вкладке */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    window.addEventListener("resize", recalc);

    recalc();
    startAutoplay();

    /* Открытие страницы с якорем #product-* — показываем нужную карточку */
    function showFromHash() {
      var hash = window.location.hash;
      if (!hash || !viewport || !slides.length) return;
      var target = slider.querySelector(hash);
      if (!target) return;
      var index = Array.prototype.indexOf.call(slides, target);
      if (index > -1) scrollToIndex(index);
    }
    window.addEventListener("hashchange", showFromHash);
    showFromHash();
  }

  /* --- Анимация появления секций/блоков (шаг 14) ---
     IntersectionObserver добавляет/снимает .is-visible при входе/выходе блока
     во вьюпорт — эффект работает в обе стороны (прокрутка вниз — появление,
     вверх — скрытие), без дублирования эффекта. При отсутствии IO или
     prefers-reduced-motion всё показывается сразу. */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    var reduceMotionReveal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduceMotionReveal) {
      for (var r = 0; r < revealEls.length; r++) {
        revealEls[r].classList.add("is-visible");
      }
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        }
      }, {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px"
      });

      for (var r2 = 0; r2 < revealEls.length; r2++) {
        revealObserver.observe(revealEls[r2]);
      }
    }
  }
})();
