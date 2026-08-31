// ============================================================
// HOME.JS — services accordion, team modal, contact form
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initCraftAccordion();
  initTeamModal();
  initContactForm();
});

// ---------- Craft / services accordion (click a service → detail pane updates) ----------
function initCraftAccordion() {
  const buttons = document.querySelectorAll('.craft-list button');
  const detailImage = document.querySelector('.craft-detail-image img');
  const detailSub = document.querySelector('.craft-detail-content .sub');
  const detailTitle = document.querySelector('.craft-detail-content h3');
  const detailDesc = document.querySelector('.craft-detail-content .desc');
  const detailItems = document.querySelector('.craft-items');
  const progressFill = document.querySelector('.craft-progress .fill');
  const progressLabel = document.querySelector('.craft-progress span');
  if (!buttons.length || !detailTitle) return;

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const data = JSON.parse(btn.dataset.service);
      detailImage.src = data.image;
      detailImage.alt = data.title;
      detailSub.textContent = data.sub;
      detailTitle.textContent = data.title;
      detailDesc.textContent = data.description;
      detailItems.innerHTML = data.items.map(item => `<div>${item}</div>`).join('');
      progressFill.style.width = `${((i + 1) / buttons.length) * 100}%`;
      progressLabel.textContent = `0${i + 1} / 0${buttons.length}`;
    });
  });
}

// ---------- Team modal ----------
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

// ---------- Contact form (posts to /api/send-email — see README for backend setup) ----------
function initContactForm() {
  const form = document.querySelector('.enquire-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.querySelector('.form-error');
  const successPanel = document.querySelector('.enquire-success');
  const formPanel = document.querySelector('.enquire-form-panel');
  const resetBtn = document.querySelector('.enquire-success button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.remove('is-visible');

    // Honeypot check — bots fill every field, humans never see this one
    const honeypot = form.querySelector('input[name="company_website"]');
    if (honeypot && honeypot.value.trim() !== '') {
      return; // silently drop — looks successful to the bot, sends nothing
    }

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      type: form.type.value,
      message: form.message.value.trim(),
    };

    if (!data.name || !data.email || !data.message || !data.type) {
      errorBox.textContent = 'Please fill in all required fields.';
      errorBox.classList.add('is-visible');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      errorBox.textContent = 'Please enter a valid email address.';
      errorBox.classList.add('is-visible');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Sending...';

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Request failed');

      formPanel.style.display = 'none';
      successPanel.classList.add('is-visible');
    } catch (err) {
      // Static hosting fallback (e.g. GoDaddy static host): show success panel & direct mailto
      formPanel.style.display = 'none';
      successPanel.classList.add('is-visible');
      window.location.href = `mailto:goldenpushers@gmail.com?subject=${encodeURIComponent(data.type + ' Enquiry from ' + data.name)}&body=${encodeURIComponent('Name: ' + data.name + '\nEmail: ' + data.email + '\nPhone: ' + data.phone + '\n\nMessage:\n' + data.message)}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send Enquiry';
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      successPanel.classList.remove('is-visible');
      formPanel.style.display = '';
    });
  }
}
