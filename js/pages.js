// ============================================================
// PAGES.JS — About accordion, Team modal, Work filters
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initAboutAccordion();
  initTeamModal();
  initWorkFilters();
});

// ---------- About page accordion ----------
function initAboutAccordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panel = trigger.nextElementSibling;
      const isOpen = trigger.classList.contains('is-open');

      // close all
      triggers.forEach(t => {
        t.classList.remove('is-open');
        t.nextElementSibling.classList.remove('is-open');
      });

      if (!isOpen) {
        trigger.classList.add('is-open');
        panel.classList.add('is-open');
      }
    });
  });
}

// ---------- Team modal (used on team.html; index.html has its own copy in home.js) ----------
function initTeamModal() {
  const cards = document.querySelectorAll('[data-team-trigger]');
  const overlay = document.getElementById('team-modal');
  if (!cards.length || !overlay) return;

  const img = overlay.querySelector('.modal-portrait img');
  const focusEl = overlay.querySelector('.modal-content .focus');
  const nameEl = overlay.querySelector('.modal-content h3');
  const roleEl = overlay.querySelector('.modal-content .role');
  const bioEl = overlay.querySelector('.modal-content .bio');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const data = JSON.parse(card.dataset.teamTrigger);
      img.src = data.image;
      img.alt = data.name;
      focusEl.textContent = data.focus;
      nameEl.textContent = data.name;
      roleEl.textContent = data.role;
      bioEl.textContent = data.bio;
      openModal(overlay, card);
    });
  });
}

// ---------- Work page category filters ----------
function initWorkFilters() {
  const buttons = document.querySelectorAll('#work-filters button');
  const items = document.querySelectorAll('.masonry-item');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;

      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.style.display = match ? '' : 'none';
      });
    });
  });
}
