// ============================================================
// GOLDEN PUSHERS PRODUCTION — Background Scroll Animation
// Minimal, organic, cinematic parallax backdrop.
// 
// 1. Ambient Light Blooms & Organic Bokeh (Warm Gold / Terracotta / Sage)
// 2. Kinetic Story Flow Thread with traveling golden star cursor (✦)
// 3. Cinematic Viewfinder Reticles & Crop Corners (⌜ ⌝ ⌞ ⌟)
// 4. Floating Studio Annotations with multi-plane parallax drift
// 5. Cellulose & Golden Dust Particles with inertia
// 6. Smooth Lerp Physics for Scroll & Mouse Parallax
// ============================================================

(function () {
  'use strict';

  const CONFIG = {
    particleCount: 42,
    colors: {
      amber: 'rgba(214, 168, 67, ',
      gold: 'rgba(228, 184, 95, ',
      terracotta: 'rgba(201, 104, 75, ',
      sage: 'rgba(142, 184, 173, ',
      ink: 'rgba(32, 40, 32, ',
      paperLight: 'rgba(255, 249, 234, '
    },
    lerpFactor: 0.09,
    mouseLerpFactor: 0.05
  };

  let canvas, ctx;
  let width = 0, height = 0, dpr = 1;
  let isRunning = false;
  let rafId = null;
  let lastTime = 0;

  // Scroll physics
  let targetScrollY = 0;
  let currentScrollY = 0;
  let scrollVelocity = 0;
  let smoothVelocity = 0;
  let lastScrollY = 0;
  let lastScrollTimestamp = 0;
  let scrollProgress = 0;

  // Mouse physics
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  // Accessibility
  let prefersReducedMotion = false;

  // Particles
  let particles = [];

  // Floating Viewfinder Studio Marks
  const RETICLES = [
    { text: '✦ 35MM FILM EXP // 24FPS', xPct: 0.07, yPct: 0.16, parallax: 0.14, align: 'left' },
    { text: 'KERALA • 10.8505° N / 76.2711° E', xPct: 0.93, yPct: 0.30, parallax: -0.16, align: 'right' },
    { text: 'ISO 400 • 1/250s • f/1.8', xPct: 0.08, yPct: 0.54, parallax: 0.20, align: 'left' },
    { text: '[ REC ● ACTIVE ]', xPct: 0.92, yPct: 0.72, parallax: -0.12, align: 'right', isRec: true },
    { text: 'STORIES ENGINEERED TO LAST', xPct: 0.50, yPct: 0.88, parallax: 0.09, align: 'center', isItalic: true }
  ];

  // Initialize Particles
  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const type = Math.random();
      let colorPrefix;
      if (type < 0.45) colorPrefix = CONFIG.colors.gold;
      else if (type < 0.75) colorPrefix = CONFIG.colors.terracotta;
      else if (type < 0.90) colorPrefix = CONFIG.colors.sage;
      else colorPrefix = CONFIG.colors.amber;

      particles.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.9 + Math.random() * 2.2,
        baseAlpha: 0.22 + Math.random() * 0.45,
        colorPrefix: colorPrefix,
        parallax: 0.08 + Math.random() * 0.35,
        driftSpeedX: (Math.random() - 0.5) * 0.0002,
        driftFreq: 0.0007 + Math.random() * 0.0016,
        driftPhase: Math.random() * Math.PI * 2,
        pulseFreq: 0.001 + Math.random() * 0.002,
        hasHalo: Math.random() > 0.5
      });
    }
  }

  // Setup Canvas
  function setupCanvas() {
    canvas = document.getElementById('studio-bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'studio-bg-canvas';
      canvas.className = 'studio-bg-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }

    ctx = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    initParticles();
  }

  // Resize Canvas
  function resizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  // Scroll Tracking
  function onScroll() {
    targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const now = performance.now();
    const dt = Math.max(now - lastScrollTimestamp, 8);
    const dy = targetScrollY - lastScrollY;
    scrollVelocity = dy / dt;
    lastScrollY = targetScrollY;
    lastScrollTimestamp = now;

    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - height;
    scrollProgress = docHeight > 0 ? Math.min(Math.max(targetScrollY / docHeight, 0), 1) : 0;
  }

  // Mouse Move Tracking
  function onMouseMove(e) {
    targetMouseX = (e.clientX / width - 0.5) * 36;
    targetMouseY = (e.clientY / height - 0.5) * 36;
  }

  // 1. Draw Ambient Light Blooms & Bokeh
  function drawAmbientBlooms(t) {
    const vMag = Math.min(Math.abs(smoothVelocity) * 1.5, 3.0);
    const stretchY = 1 + vMag * 0.2;
    const stretchX = 1 - vMag * 0.06;

    // Orb 1: Warm Amber Sunbeam (Top Left / Mid)
    const x1 = width * 0.16 + currentMouseX * 0.6 + Math.sin(t * 0.0006) * 50;
    const y1 = height * 0.25 + currentMouseY * 0.6 + Math.cos(t * 0.0005) * 35 - (currentScrollY * 0.14) % (height * 1.5) + height * 0.2;
    const r1 = Math.min(width, height) * (0.42 + Math.sin(t * 0.0008) * 0.05);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.scale(stretchX, stretchY);
    const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
    grad1.addColorStop(0, CONFIG.colors.gold + (0.20 + vMag * 0.05) + ')');
    grad1.addColorStop(0.45, CONFIG.colors.amber + (0.10 + vMag * 0.03) + ')');
    grad1.addColorStop(1, CONFIG.colors.gold + '0)');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Orb 2: Terracotta Studio Glow (Mid Right)
    const x2 = width * 0.84 - currentMouseX * 0.7 + Math.cos(t * 0.0007) * 45;
    const y2 = height * 0.58 - currentMouseY * 0.7 + Math.sin(t * 0.0006) * 40 - (currentScrollY * 0.20) % (height * 1.6) + height * 0.3;
    const r2 = Math.min(width, height) * (0.38 + Math.cos(t * 0.0007) * 0.04);

    ctx.save();
    ctx.translate(x2, y2);
    ctx.scale(stretchX, stretchY);
    const grad2 = ctx.createRadialGradient(0, 0, 0, 0, 0, r2);
    grad2.addColorStop(0, CONFIG.colors.terracotta + (0.18 + vMag * 0.04) + ')');
    grad2.addColorStop(0.5, CONFIG.colors.terracotta + (0.08 + vMag * 0.02) + ')');
    grad2.addColorStop(1, CONFIG.colors.terracotta + '0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Orb 3: Sage Forest Mist (Lower Center-Left)
    const x3 = width * 0.32 + Math.sin(t * 0.0005 + 1.5) * 60;
    const y3 = height * 0.80 + Math.cos(t * 0.0006 + 1.2) * 45 - (currentScrollY * 0.16) % (height * 1.4) + height * 0.2;
    const r3 = Math.min(width, height) * 0.36;

    ctx.save();
    ctx.translate(x3, y3);
    const grad3 = ctx.createRadialGradient(0, 0, 0, 0, 0, r3);
    grad3.addColorStop(0, CONFIG.colors.sage + (0.15 + vMag * 0.03) + ')');
    grad3.addColorStop(0.55, CONFIG.colors.sage + (0.06 + vMag * 0.02) + ')');
    grad3.addColorStop(1, CONFIG.colors.sage + '0)');
    ctx.fillStyle = grad3;
    ctx.beginPath();
    ctx.arc(0, 0, r3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw Kinetic Story Flow Thread Wave with Travelling Golden Star
  function drawStoryThread(t) {
    const waveYBase = height * 0.46;
    const waveParallax = -(currentScrollY * 0.10) % height;
    const scrollEffect = Math.sin(scrollProgress * Math.PI * 2) * 26;

    ctx.save();

    // Primary Terracotta Dashed Narrative Wave
    ctx.beginPath();
    const points = 7;
    const step = width / (points - 1);

    for (let i = 0; i < points; i++) {
      const px = i * step;
      const waveOffset = Math.sin(t * 0.0008 + i * 0.85 + scrollProgress * 4) * 34 +
                         Math.cos(t * 0.0005 + i * 0.5) * 18;
      const py = waveYBase + waveParallax + waveOffset + scrollEffect + currentMouseY * 0.3;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        const prevX = (i - 1) * step;
        const prevWave = Math.sin(t * 0.0008 + (i - 1) * 0.85 + scrollProgress * 4) * 34 +
                         Math.cos(t * 0.0005 + (i - 1) * 0.5) * 18;
        const prevY = waveYBase + waveParallax + prevWave + scrollEffect + currentMouseY * 0.3;
        ctx.quadraticCurveTo(prevX, prevY, (prevX + px) / 2, (prevY + py) / 2);
      }
    }

    ctx.strokeStyle = CONFIG.colors.terracotta + '0.36)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([10, 14]);
    ctx.stroke();

    // Secondary Gold Echo Wave
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const px = i * step;
      const waveOffset = Math.sin(t * 0.0007 + i * 0.7 + 1.2) * 26;
      const py = waveYBase + 48 + waveParallax * 1.12 + waveOffset + currentMouseY * 0.2;
      if (i === 0) ctx.moveTo(px, py);
      else {
        const prevX = (i - 1) * step;
        const prevWave = Math.sin(t * 0.0007 + (i - 1) * 0.7 + 1.2) * 26;
        const prevY = waveYBase + 48 + waveParallax * 1.12 + prevWave + currentMouseY * 0.2;
        ctx.quadraticCurveTo(prevX, prevY, (prevX + px) / 2, (prevY + py) / 2);
      }
    }
    ctx.strokeStyle = CONFIG.colors.gold + '0.38)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 18]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Travelling Story Star Cursor (✦) along scroll progress
    const cursorX = width * (0.06 + scrollProgress * 0.88);
    const cursorWave = Math.sin(t * 0.0008 + scrollProgress * 6) * 34;
    const cursorY = waveYBase + waveParallax + cursorWave + scrollEffect;

    // Outer glow for cursor
    ctx.fillStyle = CONFIG.colors.terracotta + '0.22)';
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CONFIG.colors.terracotta + '0.88)';
    ctx.font = '16px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cursorX, cursorY);

    ctx.restore();
  }

  // 3. Draw Viewfinder Corner Guides & Focus Crosshairs
  function drawViewfinderCorners(t) {
    const cornerSize = 22;
    const margin = 26;
    const alpha = 0.28 + Math.sin(t * 0.001) * 0.06;
    ctx.strokeStyle = CONFIG.colors.ink + alpha + ')';
    ctx.lineWidth = 1.2;

    // Top-Left ⌜
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();

    // Top-Right ⌝
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + cornerSize);
    ctx.stroke();

    // Bottom-Left ⌞
    ctx.beginPath();
    ctx.moveTo(margin, height - margin - cornerSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + cornerSize, height - margin);
    ctx.stroke();

    // Bottom-Right ⌟
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - cornerSize);
    ctx.stroke();

    // Center Viewfinder Crosshairs (+)
    const cx = width * 0.5 + currentMouseX * 0.2;
    const cy = height * 0.5 + currentMouseY * 0.2;
    const crossSize = 8;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.strokeStyle = CONFIG.colors.terracotta + '0.35)';
    ctx.stroke();
  }

  // 4. Draw Floating Editorial Studio Marks with Parallax
  function drawStudioReticles(t) {
    if (width < 600) return;

    ctx.save();
    ctx.font = '10.5px "Inter", monospace, sans-serif';
    ctx.letterSpacing = '0.18em';

    RETICLES.forEach((item) => {
      const baseY = item.yPct * height;
      const parallaxOffset = (currentScrollY * item.parallax) % (height * 1.3);
      let y = (baseY - parallaxOffset);
      if (y < -50) y += height + 100;
      if (y > height + 50) y -= (height + 100);

      const x = item.xPct * width + currentMouseX * (item.parallax * 1.2);

      ctx.textAlign = item.align;
      ctx.textBaseline = 'middle';

      if (item.isRec) {
        const recPulse = 0.5 + Math.sin(t * 0.0035) * 0.5;
        ctx.fillStyle = 'rgba(201, 104, 75, ' + (0.75 * recPulse) + ')';
        ctx.fillText(item.text, x, y);
      } else if (item.isItalic) {
        ctx.font = 'italic 12px "Cormorant Garamond", serif';
        ctx.fillStyle = CONFIG.colors.ink + '0.38)';
        ctx.fillText('— ' + item.text + ' —', x, y);
        ctx.font = '10.5px "Inter", monospace, sans-serif';
      } else {
        ctx.fillStyle = CONFIG.colors.ink + '0.34)';
        ctx.fillText(item.text, x, y);
      }

      if (item.align === 'left') {
        ctx.strokeStyle = CONFIG.colors.gold + '0.45)';
        ctx.beginPath();
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x - 6, y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // 5. Draw Floating Cellulose & Golden Dust Particles with Inertia
  function drawDustParticles(t) {
    ctx.save();
    const vMag = smoothVelocity * 1.2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.driftSpeedX;
      if (p.x < 0) p.x += 1;
      if (p.x > 1) p.x -= 1;

      const px = p.x * width + Math.sin(t * p.driftFreq + p.driftPhase) * 16 + currentMouseX * (p.parallax * 0.8);
      const parallaxY = (currentScrollY * p.parallax + vMag * 14);
      let py = ((p.y * height - parallaxY) % height);
      if (py < 0) py += height;

      const alpha = p.baseAlpha * (0.85 + Math.sin(t * p.pulseFreq + p.driftPhase) * 0.25);

      if (p.hasHalo) {
        ctx.fillStyle = p.colorPrefix + (alpha * 0.35) + ')';
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = p.colorPrefix + alpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Update Dynamic CSS Variables
  function updateCSSVariables() {
    const shift = (currentScrollY * 0.25).toFixed(2);
    const tilt = (smoothVelocity * 0.5).toFixed(3);
    const hue = (scrollProgress * 30).toFixed(1);

    document.documentElement.style.setProperty('--scroll-bg-shift', `${shift}px`);
    document.documentElement.style.setProperty('--scroll-bg-tilt', `${tilt}deg`);
    document.documentElement.style.setProperty('--scroll-bg-hue', `${hue}deg`);
    document.documentElement.style.setProperty('--scroll-progress', scrollProgress.toFixed(4));
    document.documentElement.style.setProperty('--scroll-velocity', smoothVelocity.toFixed(4));
  }

  // Continuous High-Performance Animation Loop
  function renderLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(timestamp - lastTime, 32);
    lastTime = timestamp;

    // Physics Lerp
    const prevScrollY = currentScrollY;
    currentScrollY += (targetScrollY - currentScrollY) * CONFIG.lerpFactor;
    currentMouseX += (targetMouseX - currentMouseX) * CONFIG.mouseLerpFactor;
    currentMouseY += (targetMouseY - currentMouseY) * CONFIG.mouseLerpFactor;

    const instantVelocity = (currentScrollY - prevScrollY) / (dt || 16);
    smoothVelocity += (instantVelocity - smoothVelocity) * 0.14;

    updateCSSVariables();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!prefersReducedMotion) {
      drawAmbientBlooms(timestamp);
      drawStoryThread(timestamp);
      drawViewfinderCorners(timestamp);
      drawStudioReticles(timestamp);
      drawDustParticles(timestamp);
    } else {
      drawAmbientBlooms(0);
      drawViewfinderCorners(0);
    }

    ctx.restore();

    rafId = requestAnimationFrame(renderLoop);
  }

  // Start Animation
  function init() {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setupCanvas();
    targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    currentScrollY = targetScrollY;
    lastScrollY = targetScrollY;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isRunning = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(renderLoop);
      }
    });

    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(renderLoop);
    }
  }

  window.initBackgroundAnimation = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
