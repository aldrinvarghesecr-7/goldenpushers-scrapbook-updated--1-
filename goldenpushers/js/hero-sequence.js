// ============================================================
// HERO IMAGE SEQUENCE — full-page dolly-through scroll scrub
// Canvas is fixed behind the entire page. Frame playback is
// mapped to the full document scroll range so every section
// reveals a new part of the studio footage (wide → mic → camera).
// Hero text fades IN on initial scroll, then fades back out.
// ============================================================
(function () {
  const SEQUENCE_CONFIG = {
    totalFrames: 240,
    pathPrefix: 'assets/sequence/frame_',
    extension: '.webp',
    padDigits: 4,
  };

  function frameUrl(index) {
    const n = String(index + 1).padStart(SEQUENCE_CONFIG.padDigits, '0');
    return `${SEQUENCE_CONFIG.pathPrefix}${n}${SEQUENCE_CONFIG.extension}`;
  }

  const heroSection = document.querySelector('.hero');
  const canvas = document.getElementById('hero-canvas');
  if (!heroSection || !canvas) return;

  // Move the canvas to be the first child of <body> so it sits behind all content
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  const images = new Array(SEQUENCE_CONFIG.totalFrames).fill(null);
  let currentFrame = 0;
  let loadedCount = 0;
  let rafId = null;
  let needsDraw = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsDraw = true;
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let dw, dh, dx, dy;
    if (cr > ir) {
      dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2;
    } else {
      dh = ch; dw = ch * ir; dy = 0; dx = (cw - dw) / 2;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function loadImage(index) {
    if (images[index]) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedCount++;
      if (index === currentFrame) needsDraw = true;
    };
    img.onerror = () => { /* fail silently, keep last good frame */ };
    img.src = frameUrl(index);
    images[index] = img;
  }

  // Load first 20 frames eagerly, then trickle-load the rest
  function loadSequence() {
    const priority = Math.min(20, SEQUENCE_CONFIG.totalFrames);
    for (let i = 0; i < priority; i++) loadImage(i);

    let next = priority;
    function loadChunk() {
      if (next >= SEQUENCE_CONFIG.totalFrames) return;
      const end = Math.min(next + 6, SEQUENCE_CONFIG.totalFrames);
      for (let i = next; i < end; i++) loadImage(i);
      next = end;
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadChunk, { timeout: 500 });
      } else {
        setTimeout(loadChunk, 80);
      }
    }
    loadChunk();
  }

  function renderLoop() {
    if (needsDraw) {
      drawFrame(currentFrame);
      needsDraw = false;
    }
    rafId = requestAnimationFrame(renderLoop);
  }

  // ---------- Scroll handler ----------
  // Scrub 240 frames across the sections, finishing right before the contact form
  function onScroll() {
    const docEl = document.documentElement;
    const scrollTop = window.scrollY || docEl.scrollTop || document.body.scrollTop || 0;
    
    // Find the contact section so the sequence reaches the final frame before contact begins
    const contactSection = document.getElementById('contact');
    let maxScrubHeight;
    if (contactSection) {
      maxScrubHeight = contactSection.offsetTop - window.innerHeight * 0.4;
    } else {
      maxScrubHeight = docEl.scrollHeight - docEl.clientHeight;
    }

    let progress = maxScrubHeight > 0 ? scrollTop / maxScrubHeight : 0;
    progress = Math.max(0, Math.min(1, progress));

    // --- Frame scrub (reaches frame 240 right before the contact section) ---
    const frame = Math.min(
      SEQUENCE_CONFIG.totalFrames - 1,
      Math.floor(progress * SEQUENCE_CONFIG.totalFrames)
    );
    if (frame !== currentFrame) {
      currentFrame = frame;
      needsDraw = true;
      if (!images[frame]) loadImage(frame);
    }

    // --- Hero overlay: fades IN on scroll (starts 0 at top, peaks between 2%-10%, fades out by 18%) ---
    const overlay = heroSection.querySelector('.hero-overlay');
    if (overlay) {
      let opacity = 0;
      if (progress <= 0.005) {
        opacity = 0;
      } else if (progress < 0.04) {
        opacity = (progress - 0.005) / 0.035; // Fades in 0 -> 1 as user starts scrolling
      } else if (progress <= 0.10) {
        opacity = 1; // Full opacity
      } else if (progress < 0.18) {
        opacity = 1 - (progress - 0.10) / 0.08; // Fades out into proof section
      } else {
        opacity = 0;
      }
      overlay.style.opacity = Math.max(0, Math.min(1, opacity));
    }

    // --- Scroll cue: visible at top, hides immediately on scroll ---
    const cue = heroSection.querySelector('.hero-scroll-cue');
    if (cue) {
      cue.style.opacity = progress > 0.008 ? '0' : '1';
      cue.style.transition = 'opacity 0.4s ease-out';
    }
  }

  // Pause rendering when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      renderLoop();
    }
  });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', onScroll, { passive: true });

  resizeCanvas();
  loadSequence();

  if (reducedMotion) {
    // Show a static first frame, skip continuous animation
    const img = new Image();
    img.onload = () => { images[0] = img; drawFrame(0); };
    img.src = frameUrl(0);
  } else {
    renderLoop();
    onScroll();
  }
})();
