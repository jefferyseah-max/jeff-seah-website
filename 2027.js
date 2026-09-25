// 2027.js : shared behaviour for /2027, /2027-next and /power-calendar.
// Nav scroll state, mobile menu, FAQ accordion, scroll reveal, the price
// step and the Stripe link injection. The homepage keeps its own inline script.

// [STRIPE LINK PENDING] Paste the Stripe Payment Link for the 2027 Annual
// Outlook here (success URL: https://www.jeffseah.rocks/2027-next?paid=1).
// While empty, every order button scrolls to the order block instead.
const STRIPE_PAYMENT_LINK = '';

// Price step (Jeff, 2026-09-25): USD 88 until 31 Dec 2026, USD 138 from 1 Jan 2027 SGT.
// The HTML is written for the 88 window; this only flips the copy once the date passes.
const PRICE_STEP_AT = Date.UTC(2026, 11, 31, 16, 0, 0); // 2027-01-01 00:00 Asia/Singapore
const PRICE_NOW = 88;
const PRICE_LATER = 138;

document.documentElement.classList.add('js');

// -- Nav scroll state --
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// -- Mobile menu --
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  const setMenu = (open) => {
    navMenu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  };
  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !nav.contains(e.target) && !navMenu.contains(e.target)) setMenu(false);
  });
}

// -- FAQ accordion (one open at a time, with disclosure semantics) --
document.querySelectorAll('.faq-card').forEach((card, i) => {
  const btn = card.querySelector('.faq-q');
  const panel = card.querySelector('.faq-a');
  if (!btn || !panel) return;
  const id = panel.id || `faq-panel-${i + 1}`;
  panel.id = id;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', id);
  btn.addEventListener('click', () => {
    const isOpen = card.classList.contains('open');
    document.querySelectorAll('.faq-card.open').forEach(c => {
      c.classList.remove('open');
      c.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      card.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// -- Scroll reveal (content is visible without JS; the js class enables the hidden state) --
const revealEls = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('visible'));
} else if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach(el => observer.observe(el));
}

// -- Price step --
if (Date.now() >= PRICE_STEP_AT) {
  document.querySelectorAll('[data-price]').forEach(el => { el.textContent = String(PRICE_LATER); });
  document.querySelectorAll('[data-price-copy]').forEach(el => {
    el.textContent = `USD ${PRICE_LATER} from 1 January 2027. The USD ${PRICE_NOW} launch price closed on 31 December 2026.`;
  });
  document.querySelectorAll('.price-step div').forEach(d => d.classList.toggle('is-now'));
}

// -- Stripe link --
document.querySelectorAll('[data-stripe]').forEach(a => {
  if (STRIPE_PAYMENT_LINK) {
    a.href = STRIPE_PAYMENT_LINK;
    a.removeAttribute('data-stripe-placeholder');
  } else {
    a.dataset.stripePlaceholder = 'true';
    if (a.getAttribute('href') === '#') a.href = '#order';
  }
});
