/* ─── QUEMELLO EFFECTS ─── */
(function() {
  'use strict';

  // ─── MOUSE PARALLAX ───
  function initParallax() {
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      document.querySelectorAll('.particle').forEach((p, i) => {
        const factor = (i + 1) * 0.3;
        p.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });
  }

  // ─── SPARKLE SYSTEM ───
  function addSparkles(container, count = 6) {
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.top = `${Math.random() * 100}%`;
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(s);
    }
  }

  // ─── CLOCK ───
  function initClock() {
    const el = document.getElementById('q-clock');
    if (!el) return;
    function tick() {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      el.textContent = `${h}:${m}:${s} UTC`;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── RADAR BLIPS ───
  function initRadar(radarId, blipsData) {
    const radar = document.getElementById(radarId);
    if (!radar || !blipsData) return;
    blipsData.forEach(b => {
      const rad = (b.angle * Math.PI) / 180;
      const x = 50 + Math.cos(rad) * b.dist * 50;
      const y = 50 + Math.sin(rad) * b.dist * 50;

      const el = document.createElement('div');
      el.className = `q-blip ${b.type}`;
      el.style.left = x + '%';
      el.style.top = y + '%';
      radar.appendChild(el);

      const label = document.createElement('div');
      label.className = 'q-blip-label';
      label.textContent = b.label;
      label.style.left = (x + 2) + '%';
      label.style.top = (y - 4) + '%';
      if (b.type === 'enemy') label.style.color = 'var(--coral)';
      else if (b.type === 'friendly') label.style.color = 'var(--teal)';
      else label.style.color = 'var(--gold)';
      radar.appendChild(label);
    });
  }

  // ─── STAGGERED ENTRANCE ───
  function initEntrance() {
    const els = document.querySelectorAll('.enter-stagger');
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 100);
    });
  }

  // ─── GLITCH EFFECT ───
  function glitchText(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    setInterval(() => {
      el.style.transform = 'translate(2px, -1px)';
      setTimeout(() => {
        el.style.transform = 'translate(-1px, 1px)';
        setTimeout(() => {
          el.style.transform = 'translate(0)';
        }, 50);
      }, 50);
    }, 5000);
  }

  // ─── TYPEWRITER ───
  function typewriter(el, text, speed = 50) {
    if (!el) return;
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

  // ─── INIT ALL ───
  document.addEventListener('DOMContentLoaded', () => {
    initParallax();
    initClock();
    initEntrance();
    document.querySelectorAll('[data-sparkles]').forEach(el => {
      addSparkles(el, parseInt(el.dataset.sparkles) || 6);
    });
  });

  // Expose API
  window.QuemelloFX = {
    initRadar,
    addSparkles,
    glitchText,
    typewriter,
    initParallax,
    initClock,
    initEntrance
  };
})();
