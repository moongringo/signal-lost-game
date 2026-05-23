/**
 * Signal Lost — Design System JavaScript
 * Drop this + design-system.css into any page for instant high-fidelity
 */

class SignalLostDesign {
  constructor(options = {}) {
    this.options = {
      spotlight: options.spotlight ?? true,
      magneticButtons: options.magneticButtons ?? true,
      scrollReveal: options.scrollReveal ?? true,
      reducedMotion: options.reducedMotion ?? true,
      ...options
    };
    
    this.init();
  }

  init() {
    if (this.options.spotlight) this.initSpotlight();
    if (this.options.magneticButtons) this.initMagneticButtons();
    if (this.options.scrollReveal) this.initScrollReveal();
    if (this.options.reducedMotion) this.initReducedMotion();
  }

  // Cursor spotlight effect
  initSpotlight() {
    const spotlight = document.querySelector('.cursor-spotlight');
    if (!spotlight) return;
    
    document.addEventListener('mousemove', (e) => {
      spotlight.style.setProperty('--mx', e.clientX + 'px');
      spotlight.style.setProperty('--my', e.clientY + 'px');
    });
  }

  // Magnetic button pull
  initMagneticButtons() {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // Scroll reveal with IntersectionObserver
  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Optional: unobserve after reveal
          // observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal, .reveal-scale').forEach(el => {
      observer.observe(el);
    });
  }

  // Reduced motion support
  initReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      document.documentElement.classList.toggle('reduced-motion', mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    handleChange();
  }

  // Animate a number counting up
  static animateNumber(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      element.textContent = Math.round(start + (target - start) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  // Trigger glitch effect on element
  static glitch(element, duration = 500) {
    element.style.animation = `glitch ${duration}ms`;
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }

  // Create ripple effect (material design style)
  static ripple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${event.clientX - rect.left - size / 2}px;
      top: ${event.clientY - rect.top - size / 2}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-expand 0.6s linear;
      pointer-events: none;
    `;
    
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
}

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-signal-lost]')) {
    new SignalLostDesign();
  }
});

// Add ripple keyframe if not present
if (!document.querySelector('#signal-lost-ripple-style')) {
  const style = document.createElement('style');
  style.id = 'signal-lost-ripple-style';
  style.textContent = `
    @keyframes ripple-expand {
      to { transform: scale(2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}