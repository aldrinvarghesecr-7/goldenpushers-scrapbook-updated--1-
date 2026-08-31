// ============================================================
// MAIN.JS — shared across every page
// Navbar behavior, mobile drawer, scroll-reveal, active section
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initBackgroundAnimation === 'function') initBackgroundAnimation();
  initNavbar();
  initMobileDrawer();
  initScrollReveal();
  initScrollProgress();
  initPageTransitions();
  initSmoothScroll();
  initScrapbook();
});

// ---------- Navbar: hide on scroll down, show on scroll up, active link ----------
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  let lastY = 0;

  const sectionIds = ['hero', 'ethos', 'process', 'services', 'work', 'team', 'contact'];
  const navLinks = document.querySelectorAll('.navbar-links a, .side-dots a');

  function trackActive() {
    const scrollPos = window.scrollY + window.innerHeight / 3;
    let active = 'hero';
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) { active = id; break; }
      }
    }
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('is-active', href === `#${active}`);
    });
  }

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 80);
    if (y > 300) {
      nav.classList.toggle('is-hidden', y > lastY && y - lastY > 5);
    } else {
      nav.classList.remove('is-hidden');
    }
    lastY = y;
    trackActive();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- Mobile drawer ----------
function initMobileDrawer() {
  const toggle = document.querySelector('.navbar-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggle || !drawer) return;

  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    toggle.focus();
  }
  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    document.body.classList.add('drawer-open');
    const firstLink = drawer.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    isOpen ? close() : open();
  });

  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  // basic focus trap
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = drawer.querySelectorAll('a, button');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
}

// ---------- Scroll reveal (IntersectionObserver) ----------
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(t => io.observe(t));
}

// ---------- Scroll progress bar ----------
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    bar.style.width = height > 0 ? `${(scrolled / height) * 100}%` : '0%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Modal helper (used by team modals) ----------
function openModal(overlay, triggerEl) {
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  overlay._trigger = triggerEl;
  const closeBtn = overlay.querySelector('.modal-close');
  if (closeBtn) closeBtn.focus();

  function onKey(e) {
    if (e.key === 'Escape') closeModal(overlay);
  }
  overlay._onKey = onKey;
  document.addEventListener('keydown', onKey);
}

function closeModal(overlay) {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  if (overlay._onKey) document.removeEventListener('keydown', overlay._onKey);
  if (overlay._trigger) overlay._trigger.focus();
}

document.addEventListener('click', (e) => {
  const overlay = e.target.closest('.modal-overlay');
  if (overlay && e.target === overlay) closeModal(overlay);
  const closeBtn = e.target.closest('.modal-close');
  if (closeBtn) closeModal(closeBtn.closest('.modal-overlay'));
});

// ---------- Page-to-Page Smooth Transitions ----------
function initPageTransitions() {
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-is-leaving');
  });

  const links = document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) return;

      e.preventDefault();
      document.body.classList.add('page-is-leaving');
      setTimeout(() => {
        window.location.href = href;
      }, 350);
    });
  });
}

// ---------- Smooth Anchor Scrolling with Flow Easing ----------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ---------- Team "Character Select" carousel (index.html + team.html) ----------
function initScrapbook() {
  // Flip-card scrapbook: click/tap a polaroid to flip it and read the
  // note on the back. No scroll physics, no drag handling needed — a
  // tap is a tap, on any device.
  const polaroids = document.querySelectorAll('.polaroid');
  if (!polaroids.length) return;

  polaroids.forEach(card => {
    const front = card.querySelector('.polaroid-front');
    const back = card.querySelector('.polaroid-back');
    back.setAttribute('tabindex', '-1');
    back.setAttribute('aria-hidden', 'true');

    function toggle() {
      const flipped = card.classList.toggle('is-flipped');
      front.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      front.setAttribute('tabindex', flipped ? '-1' : '0');
      front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
      back.setAttribute('tabindex', flipped ? '0' : '-1');
      back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    }

    front.addEventListener('click', toggle);
    back.addEventListener('click', toggle);
  });
}
