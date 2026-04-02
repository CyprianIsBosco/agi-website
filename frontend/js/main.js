// Custom cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
if (cursor && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animCursor() {
    rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();
  document.querySelectorAll('a,button,.service-card,.portfolio-item,.service-option,.order-pkg,.pricing-btn,input,textarea,select').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width='20px'; cursor.style.height='20px'; ring.style.width='60px'; ring.style.height='60px'; ring.style.borderColor='rgba(239,159,39,0.6)'; });
    el.addEventListener('mouseleave', () => { cursor.style.width='12px'; cursor.style.height='12px'; ring.style.width='36px'; ring.style.height='36px'; ring.style.borderColor='rgba(0,245,200,0.5)'; });
  });
}

// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileClose = document.getElementById('mobileClose');
if (hamburger && mobileOverlay) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileOverlay.classList.toggle('open');
    document.body.style.overflow = mobileOverlay.classList.contains('open') ? 'hidden' : '';
  });
  mobileClose && mobileClose.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
  document.querySelectorAll('.mobile-link,.mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Counter animation
function animCount(el, target, suffix = '') {
  let start = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start) + suffix;
  }, 25);
}
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.stat-num').forEach(el => {
          const t = parseInt(el.dataset.target);
          const suf = el.dataset.target == '98' ? '%' : el.dataset.target == '500' ? '+' : '';
          animCount(el, t, suf);
        });
        statObs.disconnect();
      }
    });
  }, { threshold: 0.5 });
  statObs.observe(heroStats);
}

// Nav shrink
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.padding = window.scrollY > 50 ? '.85rem 5%' : '1.4rem 5%';
});

// Contact form
const contactSubmit = document.getElementById('contactSubmit');
if (contactSubmit) {
  contactSubmit.addEventListener('click', function () {
    this.textContent = 'Message Sent ✓';
    this.style.background = 'var(--gold)';
    this.style.color = 'var(--navy)';
    setTimeout(() => {
      this.textContent = 'Send Message →';
      this.style.background = '';
      this.style.color = '';
    }, 3000);
  });
}
