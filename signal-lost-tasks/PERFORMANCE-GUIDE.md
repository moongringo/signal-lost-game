# R&D Performance Optimization Guide
## High-Fidelity Web Effects — Best Practices

Based on analysis of 200 award-winning websites and WebGL/animation performance research.

---

## 1. Animation Performance (60fps Target)

### Properties to Animate (GPU-Accelerated)
- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ✅ `filter` (use sparingly)

### Properties to Avoid Animating
- ❌ `width`, `height`, `top`, `left` — triggers layout recalculation
- ❌ `margin`, `padding` — triggers layout
- ❌ `border-width` — triggers paint

### CSS Best Practices
```css
.animated-element {
  will-change: transform, opacity; /* Add before animation */
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
}

/* Remove will-change after animation completes */
.animated-element.done {
  will-change: auto;
}
```

---

## 2. WebGL Optimization

### Shader Complexity
- Keep fragment shaders simple — avoid complex branching
- Use `precision mediump float` instead of `highp` when possible
- Minimize texture lookups

### Canvas Size
```javascript
// Scale canvas down for performance, let CSS upscale
const dpr = Math.min(window.devicePixelRatio, 2); // Cap at 2x
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
```

### Frame Rate Management
```javascript
let lastTime = 0;
const targetFPS = 30; // For background effects

function render(time) {
  requestAnimationFrame(render);
  
  if (time - lastTime < 1000 / targetFPS) return;
  lastTime = time;
  
  // Render here
}
```

### Offscreen Canvas (Web Workers)
```javascript
// For complex shaders, use OffscreenCanvas in worker
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('shader-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

---

## 3. Scroll Animation Optimization

### Intersection Observer (Recommended)
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  rootMargin: '0px 0px -100px 0px',
  threshold: 0.1
});
```

### Throttled Scroll Events
```javascript
// Bad: Direct scroll listener
window.addEventListener('scroll', () => { /* heavy work */ });

// Good: Throttled with requestAnimationFrame
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      // Do scroll work here
      ticking = false;
    });
    ticking = true;
  }
});
```

---

## 4. Image & Asset Loading

### Lazy Loading
```html
<img loading="lazy" src="image.jpg" alt="Description">
```

### Responsive Images
```html
<picture>
  <source srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1200w.jpg 1200w"
          sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px">
  <img src="image-800w.jpg" alt="Description">
</picture>
```

### Preload Critical Assets
```html
<link rel="preload" href="critical-font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="hero-shader.js" as="script">
```

---

## 5. Font Loading Strategy

### Font Display
```css
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
}
```

### Subset Fonts
```bash
# Create subset with only needed characters
pyftsubset font.ttf --text="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" --output-file=font-subset.woff2
```

### Variable Fonts (One File, Many Weights)
```css
@font-face {
  font-family: 'Inter';
  src: url('Inter.var.woff2') format('woff2-variations');
  font-weight: 100 900; /* Full range */
  font-display: swap;
}
```

---

## 6. Reduced Motion Support

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .parallax-element {
    transform: none !important;
  }
}
```

### JavaScript Check
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Initialize animations
}
```

---

## 7. Mobile Performance

### Touch Optimization
```css
.touch-element {
  touch-action: manipulation; /* Remove double-tap delay */
  -webkit-tap-highlight-color: transparent;
}
```

### Viewport Units Fix
```css
/* Fix for mobile viewport height issues */
.full-height {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}
```

### GPU Layer Management
```javascript
// Promote to GPU layer only when needed
element.style.willChange = 'transform';

// Remove after animation to free memory
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

---

## 8. Bundle Size Budgets

### Recommended Limits
- **Total JS**: < 200KB (gzipped)
- **Total CSS**: < 50KB (gzipped)
- **Images**: < 500KB per page
- **Fonts**: < 100KB total
- **WebGL Shaders**: < 20KB

### Code Splitting
```javascript
// Dynamic import for heavy components
const ShaderComponent = await import('./shader-component.js');
```

---

## 9. Monitoring & Debugging

### Performance Marks
```javascript
performance.mark('animation-start');
// Run animation
performance.mark('animation-end');
performance.measure('animation', 'animation-start', 'animation-end');
```

### Chrome DevTools
1. **Performance Tab**: Record and analyze frame drops
2. **Layers Panel**: Check GPU layer composition
3. **Rendering Tab**: Enable "Paint flashing" and "Layer borders"
4. **Memory Tab**: Detect memory leaks from unremoved listeners

### Lighthouse Targets
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## 10. Morgan's Signal Lost Specific

### Current Effect Stack Performance Rating
| Effect | Performance Cost | Optimization |
|--------|-----------------|--------------|
| Glassmorphism | Medium | Limit `backdrop-filter` to 5 elements max |
| Cursor Spotlight | Low | Use `transform` only, throttle to 60fps |
| Magnetic Buttons | Low | Use CSS `transform`, not JS layout |
| Radar Scan | Medium | Canvas-based, not CSS animation |
| Liquid Fill Buttons | Low | Pure CSS, no JS |
| Scroll Animations | Medium | Intersection Observer + CSS transitions |
| WebGL Shaders | High | Cap DPR at 2, throttle to 30fps for backgrounds |
| Chat Slide-in | Low | CSS animation |

### Recommended Limits for Signal Lost
- Max 3 `backdrop-filter` elements visible simultaneously
- Max 1 WebGL canvas per page
- Use CSS animations for UI, reserve WebGL for hero sections only
- Lazy-load enhanced effects below the fold

---

*R&D Team — Generated 2026-05-04*
