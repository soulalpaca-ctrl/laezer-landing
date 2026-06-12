/* =========================================================
   LaEzer — Mongolia Landing  |  Interactions
   ========================================================= */
(function () {
  "use strict";

  /* ---- 1. Header scroll state ---- */
  const header = document.getElementById("header");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
    const st = document.getElementById("scrollTop");
    if (st) st.classList.toggle("show", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- 2. Mobile menu ---- */
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("open");
    });
    navMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("open");
      })
    );
  }

  /* ---- 3. Scroll-to-top ---- */
  const scrollTopBtn = document.getElementById("scrollTop");
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---- 4. Reveal on scroll ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const ro = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => ro.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- 5. Counter animation (supports decimals) ---- */
  const counters = document.querySelectorAll(".counter");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target || "0");
    const decimals = (el.dataset.target || "").includes(".") ? 1 : 0;
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && counters.length) {
    const co = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCounter(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.dataset.target));
  }

  /* ---- 6. Reviews marquee (seamless) ---- */
  const track = document.getElementById("reviewsTrack");
  if (track) {
    // duplicate cards for seamless loop
    track.innerHTML += track.innerHTML;
    let offset = 0;
    let paused = false;
    const speed = 0.4; // px per frame
    const half = () => track.scrollWidth / 2;
    track.addEventListener("mouseenter", () => (paused = true));
    track.addEventListener("mouseleave", () => (paused = false));
    const loop = () => {
      if (!paused) {
        offset += speed;
        if (offset >= half()) offset = 0;
        track.style.transform = `translateX(-${offset}px)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---- 7. Smooth anchor offset for fixed header ---- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", function (ev) {
      const id = this.getAttribute("href");
      if (id.length < 2) return;
      const tgt = document.querySelector(id);
      if (!tgt) return;
      ev.preventDefault();
      const top = tgt.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
})();
