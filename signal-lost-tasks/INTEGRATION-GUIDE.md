# 🚀 Production Integration Guide
## How to Apply the High-Fidelity Design System

### Quick Start (2 Steps)

#### Step 1: Link the CSS
Add this to the `<head>` of any page:
```html
<link rel="stylesheet" href="design-system.css">
```

#### Step 2: Initialize the JS
Add this before `</body>`:
```html
<script src="design-system.js"></script>
<script>
  new SignalLostDesign({
    spotlight: true,       // Cursor spotlight effect
    magneticButtons: true, // Button magnetic pull
    scrollReveal: true,    // Scroll animations
    reducedMotion: true    // Respect prefers-reduced-motion
  });
</script>
```

That's it. Every element with `.glass-panel`, `.btn-*`, `.reveal`, `[data-magnetic]`, `.cursor-spotlight` will now have high-fidelity effects.

---

### Element Upgrades

#### Panels → Glassmorphism
```html
<!-- Before -->
<div class="panel" style="background: #fff8dc; border: 1px solid #ccc;">

<!-- After -->
<div class="glass-panel">
  <!-- Content -->
</div>
```

#### Buttons → Enhanced Styles
```html
<!-- Before -->
<button class="btn">Action</button>

<!-- After (pick one) -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-glass">Glass</button>
<button class="btn btn-liquid">Liquid Fill</button>
<button class="btn btn-gold">Gold</button>
<button class="btn btn-pink">Danger</button>
```

#### Add Magnetic Effect
```html
<button class="btn btn-primary" data-magnetic>Magnetic</button>
```

#### Add Scroll Reveal
```html
<div class="reveal">
  <!-- This will fade in on scroll -->
</div>

<div class="reveal-scale">
  <!-- This will scale in on scroll -->
</div>
```

#### Add Cursor Spotlight
```html
<!-- Add empty div at top of body -->
<div class="cursor-spotlight"></div>
```

---

### Font Upgrade
Replace existing font links with:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
```

Use the font utilities:
```html
<h1 class="font-display">Title</h1>
<p class="font-body">Body text</p>
<code class="font-mono">Code</code>
```

---

### Animation Utilities
```html
<div class="animate-fade-in">Fade in on load</div>
<div class="animate-pulse">Pulsing element</div>
<div class="animate-float">Floating element</div>
<div class="animate-glow">Glowing element</div>
```

### Status Indicators
```html
<span class="status-dot active"></span> Online
<span class="status-dot warning"></span> Warning
<span class="status-dot danger"></span> Danger
```

### Progress Bars
```html
<div class="progress-bar">
  <div class="fill" style="width: 60%"></div>
</div>
```

---

### Pages Ready for Integration

| Page | Status | Link Design System |
|------|--------|-------------------|
| design-flow.html | ⏳ Needs integration | Add `<link>` + `<script>` |
| design-flow-setup.html | ⏳ Needs integration | Add `<link>` + `<script>` |
| design-flow-roles.html | ⏳ Needs integration | Add `<link>` + `<script>` |
| action-center.html | ⏳ Needs integration | Add `<link>` + `<script>` |
| *-enhanced.html | ✅ Already enhanced | Can also link for shared updates |

### Integration Checklist

- [ ] Add `design-system.css` to `<head>`
- [ ] Add `design-system.js` before `</body>`
- [ ] Initialize `SignalLostDesign()`
- [ ] Replace panel classes with `.glass-panel`
- [ ] Upgrade buttons with `.btn-*` classes
- [ ] Add `[data-magnetic]` to hero buttons
- [ ] Add `.reveal` to sections below fold
- [ ] Add `.cursor-spotlight` div
- [ ] Upgrade fonts (Inter + Space Grotesk + JetBrains Mono)
- [ ] Test `prefers-reduced-motion`
- [ ] Test on mobile (320px+)
- [ ] Verify no console errors

---

### Performance Notes

- `design-system.css` is ~6KB gzipped
- `design-system.js` is ~4KB gzipped
- WebGL shaders load lazily (only when container present)
- IntersectionObserver used for scroll effects (no scroll listeners)
- `prefers-reduced-motion` respected automatically
- Cap DPR at 2x for Canvas/WebGL

---

*Integration Guide — R&D Team*
*Updated: 2026-05-04 07:40 CST*
