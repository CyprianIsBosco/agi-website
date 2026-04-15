// Custom cursor
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
if (cursor && cursorRing) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });
  // Smooth ring follow
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();
  // Scale on hover over interactive elements
  document.querySelectorAll('a,button,.svc-opt,.pricing-btn,.portfolio-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursorRing.style.width = '52px';
      cursorRing.style.height = '52px';
      cursorRing.style.borderColor = 'rgba(192,24,26,0.6)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '';
      cursor.style.height = '';
      cursorRing.style.width = '';
      cursorRing.style.height = '';
      cursorRing.style.borderColor = '';
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
          const suf = t >= 500 ? '+' : '';
          animCount(el, t, suf);
        });
        statObs.disconnect();
      }
    });
  }, { threshold: 0.5 });
  statObs.observe(heroStats);
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

// Nav shrink
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.padding = window.scrollY > 50 ? '.8rem 5%' : '1.2rem 5%';
});

// Contact form
const contactSubmit = document.getElementById('contactSubmit');
if (contactSubmit) {
  contactSubmit.addEventListener('click', function () {
    this.textContent = 'Message Sent ✓';
    this.style.background = '#EF9F27';
    setTimeout(() => {
      this.textContent = 'Send Message';
      this.style.background = '';
    }, 3000);
  });
}

// Order page service picker
document.querySelectorAll('.svc-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.svc-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    const svcInput = document.getElementById('selectedService');
    if (svcInput) svcInput.value = opt.dataset.service;
    const summaryService = document.getElementById('summaryService');
    if (summaryService) summaryService.textContent = opt.dataset.service;
  });
});

// Pre-select from URL
const params = new URLSearchParams(window.location.search);
const prePkg = params.get('package');
const serviceMap = { starter: 'Printing, Branding & Imaging', business: 'Printing, Branding & Imaging', enterprise: 'County Government Tender' };
if (prePkg && serviceMap[prePkg]) {
  document.querySelectorAll('.svc-opt').forEach(opt => {
    if (opt.dataset.service === serviceMap[prePkg]) {
      opt.classList.add('selected');
      const svcInput = document.getElementById('selectedService');
      if (svcInput) svcInput.value = opt.dataset.service;
    }
  });
}

// Live summary
const qtyEl = document.getElementById('clientQty');
const deadlineEl = document.getElementById('clientDeadline');
if (qtyEl) qtyEl.addEventListener('change', function () {
  const el = document.getElementById('summaryQty');
  if (el) el.textContent = this.value || '—';
});
if (deadlineEl) deadlineEl.addEventListener('change', function () {
  const el = document.getElementById('summaryDeadline');
  if (el) el.textContent = this.value || '—';
});

// Submit order
const submitOrderBtn = document.getElementById('submitOrderBtn');
if (submitOrderBtn) {
  submitOrderBtn.addEventListener('click', async () => {
    const name = document.getElementById('clientName')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const company = document.getElementById('clientCompany')?.value.trim();
    const service = document.getElementById('selectedService')?.value;
    const brief = document.getElementById('clientBrief')?.value.trim();
    const deadline = document.getElementById('clientDeadline')?.value;
    if (!name || !phone || !company || !service || !brief || !deadline) {
      alert('Please fill in all required fields and select a service.');
      return;
    }
    submitOrderBtn.textContent = 'Submitting...';
    submitOrderBtn.disabled = true;
    try {
      await fetch('https://agi-backend-8cdh.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, company,
          email: document.getElementById('clientEmail')?.value || '',
          package: service,
          brief: `Service: ${service}\nDeadline: ${deadline}\nQty: ${document.getElementById('clientQty')?.value || 'N/A'}\nLocation: ${document.getElementById('clientLocation')?.value || 'N/A'}\n\n${brief}`
        })
      });
    } catch (e) {}
    document.getElementById('successOverlay')?.classList.add('show');
    submitOrderBtn.textContent = 'Submit Order';
    submitOrderBtn.disabled = false;
  });
}
