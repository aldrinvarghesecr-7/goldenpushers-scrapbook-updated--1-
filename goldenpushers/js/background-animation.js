// ============================================================
// GOLDEN PUSHERS PRODUCTION — Background Scroll Animation
// Minimal, organic, cinematic parallax backdrop.
// 
// Features:
// 1. Fluid Ambient Bokeh & Light Blooms (Golden hour / Terracotta / Sage)
// 2. Cinematic Film Registration & Viewfinder Reticles (Micro Parallax Marks)
// 3. Generative "Story Thread" Golden Flow Wave with scroll-traveling star cursor
// 4. Floating Studio Cellulose / Golden Light Particles with inertia
// 5. Scroll Velocity & Progress Physics with Lerp Smoothing
// 6. Interactive Cursor Parallax Shift
// 7. Auto-sleep / Wakeup for 60+ FPS zero-waste performance
// 8. Prefers-Reduced-Motion accessibility compliance
// ============================================================

(function () {
  'use strict';

  // Config
  const CONFIG = {
    particleCount: 32,
    colors: {
      amber: 'rgba(214, 168, 67, ',
      gold: 'rgba(228, 184, 95, ',
      terracotta: 'rgba(201, 104, 75, ',
      sage: 'rgba(142, 184, 173, ',
      ink: 'rgba(32, 40, 32, ',
      paperLight: 'rgba(255, 249, 234, '
    },
    lerpFactor: 0.08,
    mouseLerpFactor: 0.05
  };

  // State
  let canvas, ctx;
  let width = 0, height = 0, dpr = 1;
  let isRunning = false;
  let rafId = null;
  let lastTime = 0;
  let idleTimer = null;
  let isIdle = false;

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

  // Reduced motion preference
  let prefersReducedMotion = false;

  // Particles
  let particles = [];

  // Viewfinder annotations
  const RETICLES = [
    { text: '✦ 35MM FILM EXP // 24FPS', xPct: 0.07, yPct: 0.18, parallax: 0.12, align: 'left' },
    { text: 'KERALA • 10.8505° N / 76.2711° E', xPct: 0.93, yPct: 0.32, parallax: -0.15, align: 'right' },
    { text: 'ISO 400 • 1/250s • f/1.8', xPct: 0.08, yPct: 0.58, parallax: 0.18, align: 'left' },
    { text: '[ REC ● ACTIVE ]', xPct: 0.92, yPct: 0.74, parallax: -0.10, align: 'right', isRec: true },
    { text: 'STORIES ENGINEERED TO LAST', xPct: 0.50, yPct: 0.88, parallax: 0.08, align: 'center', isItalic: true }
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
        radius: 0.6 + Math.random() * 1.8,
        baseAlpha: 0.12 + Math.random() * 0.32,
        colorPrefix: colorPrefix,
        parallax: 0.06 + Math.random() * 0.28,
        driftSpeedX: (Math.random() - 0.5) * 0.00015,
        driftFreq: 0.0008 + Math.random() * 0.0015,
        driftPhase: Math.random() * Math.PI * 2,
        pulseFreq: 0.001 + Math.random() * 0.002,
        hasHalo: Math.random() > 0.6
      });
    }
  }

  // Create or retrieve canvas
  function setupCanvas() {
    canvas = document.getElementById('studio-bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'studio-bg-canvas';
      canvas.className = 'studio-bg-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    ctx = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    initParticles();
  }

  // Handle resizing
  function resizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    wakeUp();
  }

  // Wake loop on interaction
  function wakeUp() {
    isIdle = false;
    clearTimeout(idleTimer);
    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(renderLoop);
    }
    // Idle after 3 seconds of stillness
    idleTimer = setTimeout(() => {
      if (Math.abs(scrollVelocity) < 0.05 && Math.abs(currentScrollY - targetScrollY) < 0.5) {
        isIdle = true;
      }
    }, 3000);
  }

  // Event Listeners
  function onScroll() {
    targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const now = performance.now();
    const dt = Math.max(now - lastScrollTimestamp, 8);
    const dy = targetScrollY - lastScrollY;
    scrollVelocity = dy / dt; // px per ms
    lastScrollY = targetScrollY;
    lastScrollTimestamp = now;

    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - height;
    scrollProgress = docHeight > 0 ? Math.min(Math.max(targetScrollY / docHeight, 0), 1) : 0;

    wakeUp();
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / width - 0.5) * 30;
    targetMouseY = (e.clientY / height - 0.5) * 30;
    wakeUp();
  }

  // Draw 1: Ambient Light Blooms & Organic Bokeh
  function drawAmbientBlooms(t) {
    const vMag = Math.min(Math.abs(smoothVelocity) * 1.2, 2.5);
    const stretchY = 1 + vMag * 0.15;
    const stretchX = 1 - vMag * 0.05;

    // Orb 1: Warm Amber Sunlight (Top Left)
    const x1 = width * 0.18 + currentMouseX * 0.6 + Math.sin(t * 0.0006) * 40;
    const y1 = height * 0.22 + currentMouseY * 0.6 + Math.cos(t * 0.0005) * 30 - (currentScrollY * 0.12) % (height * 1.5) + height * 0.2;
    const r1 = Math.min(width, height) * (0.38 + Math.sin(t * 0.0008) * 0.04);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.scale(stretchX, stretchY);
    const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
    grad1.addColorStop(0, CONFIG.colors.gold + (0.09 + vMag * 0.03) + ')');
    grad1.addColorStop(0.5, CONFIG.colors.amber + (0.04 + vMag * 0.02) + ')');
    grad1.addColorStop(1, CONFIG.colors.gold + '0)');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Orb 2: Terracotta Studio Glow (Mid-Right)
    const x2 = width * 0.82 - currentMouseX * 0.7 + Math.cos(t * 0.0007) * 35;
    const y2 = height * 0.55 - currentMouseY * 0.7 + Math.sin(t * 0.0006) * 35 - (currentScrollY * 0.18) % (height * 1.6) + height * 0.3;
    const r2 = Math.min(width, height) * (0.34 + Math.cos(t * 0.0007) * 0.03);

    ctx.save();
    ctx.translate(x2, y2);
    ctx.scale(stretchX, stretchY);
    const grad2 = ctx.createRadialGradient(0, 0, 0, 0, 0, r2);
    grad2.addColorStop(0, CONFIG.colors.terracotta + (0.075 + vMag * 0.025) + ')');
    grad2.addColorStop(0.55, CONFIG.colors.terracotta + (0.03 + vMag * 0.015) + ')');
    grad2.addColorStop(1, CONFIG.colors.terracotta + '0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Orb 3: Sage Forest Mist (Bottom-Left)
    const x3 = width * 0.35 + Math.sin(t * 0.0005 + 1.5) * 50;
    const y3 = height * 0.78 + Math.cos(t * 0.0006 + 1.2) * 40 - (currentScrollY * 0.15) % (height * 1.4) + height * 0.2;
    const r3 = Math.min(width, height) * 0.32;

    ctx.save();
    ctx.translate(x3, y3);
    const grad3 = ctx.createRadialGradient(0, 0, 0, 0, 0, r3);
    grad3.addColorStop(0, CONFIG.colors.sage + (0.065 + vMag * 0.02) + ')');
    grad3.addColorStop(0.6, CONFIG.colors.sage + (0.02 + vMag * 0.01) + ')');
    grad3.addColorStop(1, CONFIG.colors.sage + '0)');
    ctx.fillStyle = grad3;
    ctx.beginPath();
    ctx.arc(0, 0, r3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw 2: Generative "Visual Story Thread" (The Golden Flow Wave)
  function drawStoryThread(t) {
    const waveYBase = height * 0.48;
    const waveParallax = -(currentScrollY * 0.09) % height;
    const scrollEffect = Math.sin(scrollProgress * Math.PI * 2) * 20;

    ctx.save();
    ctx.beginPath();

    const points = 7;
    const step = width / (points - 1);

    for (let i = 0; i < points; i++) {
      const px = i * step;
      const waveOffset = Math.sin(t * 0.0007 + i * 0.85 + scrollProgress * 4) * 28 +
                         Math.cos(t * 0.0004 + i * 0.5) * 16;
      const py = waveYBase + waveParallax + waveOffset + scrollEffect + currentMouseY * 0.3;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        const prevX = (i - 1) * step;
        const prevWave = Math.sin(t * 0.0007 + (i - 1) * 0.85 + scrollProgress * 4) * 28 +
                         Math.cos(t * 0.0004 + (i - 1) * 0.5) * 16;
        const prevY = waveYBase + waveParallax + prevWave + scrollEffect + currentMouseY * 0.3;
        const cx = (prevX + px) / 2;
        const cy = (prevY + py) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      }
    }

    ctx.strokeStyle = CONFIG.colors.terracotta + '0.12)';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([8, 12]);
    ctx.stroke();

    // Secondary subtle echo thread
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const px = i * step;
      const waveOffset = Math.sin(t * 0.0006 + i * 0.7 + 1) * 22;
      const py = waveYBase + 45 + waveParallax * 1.15 + waveOffset + currentMouseY * 0.2;
      if (i === 0) ctx.moveTo(px, py);
      else {
        const prevX = (i - 1) * step;
        const prevWave = Math.sin(t * 0.0006 + (i - 1) * 0.7 + 1) * 22;
        const prevY = waveYBase + 45 + waveParallax * 1.15 + prevWave + currentMouseY * 0.2;
        ctx.quadraticCurveTo(prevX, prevY, (prevX + px) / 2, (prevY + py) / 2);
      }
    }
    ctx.strokeStyle = CONFIG.colors.gold + '0.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 16]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw Traveling Story Cursor (Star ✦ moving along scroll progress)
    const cursorX = width * (0.05 + scrollProgress * 0.9);
    const cursorWave = Math.sin(t * 0.0007 + scrollProgress * 6) * 28;
    const cursorY = waveYBase + waveParallax + cursorWave + scrollEffect;

    ctx.fillStyle = CONFIG.colors.terracotta + '0.65)';
    ctx.font = '13px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cursorX, cursorY);

    ctx.restore();
  }

  // Draw 3: Viewfinder Crop Corners & Micro Film Marks
  function drawViewfinderCorners(t) {
    const cornerSize = 18;
    const margin = 28;
    const alpha = 0.16 + Math.sin(t * 0.001) * 0.04;
    ctx.strokeStyle = CONFIG.colors.ink + alpha + ')';
    ctx.lineWidth = 1;

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

    // Subtle center crosshairs (+)
    const cx = width * 0.5 + currentMouseX * 0.2;
    const cy = height * 0.5 + currentMouseY * 0.2;
    const crossSize = 7;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.strokeStyle = CONFIG.colors.terracotta + '0.18)';
    ctx.stroke();
  }

  // Draw 4: Editorial Film Reticles & Studio Notation Badges
  function drawStudioReticles(t) {
    if (width < 640) return; // Hide micro-type on very small mobile screens for clean minimalism

    ctx.save();
    ctx.font = '10px "Inter", monospace, sans-serif';
    ctx.letterSpacing = '0.18em';

    RETICLES.forEach((item) => {
      const baseY = item.yPct * height;
      const parallaxOffset = (currentScrollY * item.parallax) % (height * 1.3);
      let y = (baseY - parallaxOffset);
      if (y < -40) y += height + 80;
      if (y > height + 40) y -= (height + 80);

      const x = item.xPct * width + currentMouseX * (item.parallax * 1.2);

      ctx.textAlign = item.align;
      ctx.textBaseline = 'middle';

      if (item.isRec) {
        // Red recording pulse indicator
        const recPulse = 0.4 + Math.sin(t * 0.003) * 0.4;
        ctx.fillStyle = 'rgba(201, 104, 75, ' + (0.55 * recPulse) + ')';
        ctx.fillText(item.text, x, y);
      } else if (item.isItalic) {
        ctx.font = 'italic 11px "Cormorant Garamond", serif';
        ctx.fillStyle = CONFIG.colors.ink + '0.22)';
        ctx.fillText('— ' + item.text + ' —', x, y);
        ctx.font = '10px "Inter", monospace, sans-serif';
      } else {
        ctx.fillStyle = CONFIG.colors.ink + '0.2)';
        ctx.fillText(item.text, x, y);
      }

      // Micro frame tick line next to text
      if (item.align === 'left') {
        ctx.strokeStyle = CONFIG.colors.gold + '0.25)';
        ctx.beginPath();
        ctx.moveTo(x - 14, y);
        ctx.lineTo(x - 6, y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Draw 5: Floating Cellulose & Golden Dust Particles
  function drawDustParticles(t) {
    ctx.save();
    const vMag = smoothVelocity * 0.8;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update horizontal subtle drift
      p.x += p.driftSpeedX;
      if (p.x < 0) p.x += 1;
      if (p.x > 1) p.x -= 1;

      const px = p.x * width + Math.sin(t * p.driftFreq + p.driftPhase) * 12 + currentMouseX * (p.parallax * 0.8);

      // Parallax vertical movement with seamless loop
      const parallaxY = (currentScrollY * p.parallax + vMag * 10);
      let py = ((p.y * height - parallaxY) % height);
      if (py < 0) py += height;

      // Pulsating alpha
      const alpha = p.baseAlpha * (0.8 + Math.sin(t * p.pulseFreq + p.driftPhase) * 0.25);

      // Draw particle
      ctx.fillStyle = p.colorPrefix + alpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Soft halo for select particles
      if (p.hasHalo) {
        ctx.fillStyle = p.colorPrefix + (alpha * 0.25) + ')';
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Update Dynamic CSS Variables
  function updateCSSVariables() {
    const shift = (currentScrollY * 0.2).toFixed(2);
    const tilt = (smoothVelocity * 0.4).toFixed(3);
    const hue = (scrollProgress * 25).toFixed(1);

    document.documentElement.style.setProperty('--scroll-bg-shift', `${shift}px`);
    document.documentElement.style.setProperty('--scroll-bg-tilt', `${tilt}deg`);
    document.documentElement.style.setProperty('--scroll-bg-hue', `${hue}deg`);
    document.documentElement.style.setProperty('--scroll-progress', scrollProgress.toFixed(4));
    document.documentElement.style.setProperty('--scroll-velocity', smoothVelocity.toFixed(4));
  }

  // Main Render Loop
  function renderLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(timestamp - lastTime, 32);
    lastTime = timestamp;

    // Physics Lerp
    const prevScrollY = currentScrollY;
    currentScrollY += (targetScrollY - currentScrollY) * CONFIG.lerpFactor;
    currentMouseX += (targetMouseX - currentMouseX) * CONFIG.mouseLerpFactor;
    currentMouseY += (targetMouseY - currentMouseY) * CONFIG.mouseLerpFactor;

    // Smooth velocity decay
    const instantVelocity = (currentScrollY - prevScrollY) / (dt || 16);
    smoothVelocity += (instantVelocity - smoothVelocity) * 0.12;

    // Update CSS variables
    updateCSSVariables();

    // Render Canvas Frame
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
      // Reduced motion: static subtle ambient glow only
      drawAmbientBlooms(0);
      drawViewfinderCorners(0);
    }

    ctx.restore();

    // Keep running unless idle
    if (!isIdle || Math.abs(currentScrollY - targetScrollY) > 0.5) {
      rafId = requestAnimationFrame(renderLoop);
    } else {
      isRunning = false;
    }
  }

  // Main Initializer
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
      } else {
        wakeUp();
      }
    });

    wakeUp();
  }

  // Export to window
  window.initBackgroundAnimation = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
