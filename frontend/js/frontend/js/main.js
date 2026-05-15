/* ═══════════════════════════════════════════
   AREND GESIN INVESTMENT — main.js
   Shared JS for all pages
═══════════════════════════════════════════ */

'use strict';

(function () {

  /* ── Smooth reveal on scroll ── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          // stagger siblings
          const siblings = Array.from(e.target.parentElement.children);
          const idx = siblings.indexOf(e.target);
          e.target.style.transitionDelay = (idx * 60) + 'ms';
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.10 });
    els.forEach(el => io.observe(el));
  }

  /* ── Active nav link ── */
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.includes(path)) {
        a.style.fontWeight = '500';
        a.style.color = 'var(--red)';
      }
    });
  }

  /* ── Navbar colour fix on non-hero pages ── */
  function initNavbarForPage() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const hero = document.querySelector('.hero');
    if (!hero) {
      // Non-hero page: always show scrolled style
      nav.classList.add('scrolled');
    }
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── Hamburger toggle ── */
  function initHamburger() {
    const ham = document.getElementById('hamburger');
    const links = document.getElementById('navLinks');
    if (!ham || !links) return;
    ham.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      ham.setAttribute('aria-expanded', String(open));
      ham.classList.toggle('active', open);
    });
    // Close on nav link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        ham.classList.remove('active');
        ham.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initActiveNav();
    initNavbarForPage();
    initHamburger();
  });

})();
