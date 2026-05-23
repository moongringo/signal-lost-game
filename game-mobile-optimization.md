# Signal Lost v2 — Mobile Optimization & Performance Tuning

**Target:** Vanilla JS PWA with Canvas 2D radar, Leaflet OSM tiles, particle system (7 role presets), CSS transitions/animations, DOM-based HUD.

**Current architecture:** 7170-line single-file engine (`game-v2.js`), 3687-line CSS (`styles-v2.css`). Three simultaneous `requestAnimationFrame` loops (theme canvas, radar, particle system) plus confetti and command wheel loops. No object pooling, no off-screen canvases, no FPS capping beyond basic visibility/throttle checks.

---

## 1. Canvas 2D Performance for Mobile

### 1.1 Off-Screen Canvas Double-Buffering

**Problem:** Particle system (`ParticleSystem._render()` at line 303) clears by reassigning `canvas.width`:
```js
this.canvas.width = this.canvas.width; // clear
```
This forces a full backbuffer flush + synchronous reallocation on every frame. Combined with `globalCompositeOperation = 'lighter'` this is GPU-expensive on mobile.

**Fix:** Off-screen canvas double-buffering.

```js
// In ParticleSystem.init():
this.offCanvas = document.createElement('canvas');
this.offCtx = this.offCanvas.getContext('2d');

// Sync size with visible canvas on resize
this.offCanvas.width = this.canvas.width;
this.offCanvas.height = this.canvas.height;

// In _render():
this.offCtx.clearRect(0, 0, this.offCanvas.width, this.offCanvas.height);
this.offCtx.globalCompositeOperation = 'lighter';
// ... draw all particles to offCtx ...
this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
this.ctx.drawImage(this.offCanvas, 0, 0);
```

**Same pattern applies to** `RadarModule.draw()` (line 1737) and `ThemeCanvas.drawTheme()` (line 3669).

### 1.2 RequestAnimationFrame Throttle — Background Tab 30fps

**Current:** `RadarModule.startLoop()` (line 1711) already has throttle logic:
```js
_shouldThrottle() {
  return !this.isVisible || !this.isTabVisible || !this.open;
}
```
When throttled, uses `setTimeout(loop, 33)` for ~30fps.

**Missing:** Particle system (`ParticleSystem._loop()` line 254) and theme canvas (`drawTheme()` line 3669) run at full speed regardless of tab visibility. The theme canvas respects `prefers-reduced-motion` but not `document.hidden`.

**Add to ParticleSystem:**
```js
// In _loop():
if (document.hidden) {
  // Background tab: 4fps (just enough to avoid stale state)
  this.animationId = setTimeout(() => requestAnimationFrame(() => this._loop()), 250);
  return;
}
```

**Add to drawTheme:**
```js
// At top of drawTheme():
if (document.hidden) {
  tId = setTimeout(() => requestAnimationFrame(drawTheme), 250);
  return;
}
```

**Use Page Visibility API consistently:**
```js
document.addEventListener('visibilitychange', () => {
  const hidden = document.hidden;
  // ParticleSystem, drawTheme, confetti should all check this
});
```

### 1.3 Reduce Particle Count on Small Screens

**Current:** 7 role presets have hard-coded `count` values (4–8 per burst). No detection of screen size.

**Add device class detection:**
```js
const DeviceClass = {
  SMALL: 'small',   // < 480px width
  MEDIUM: 'medium', // 480-768px
  LARGE: 'large'    // > 768px
};

function getDeviceClass() {
  const w = window.innerWidth;
  if (w < 480) return DeviceClass.SMALL;
  if (w < 768) return DeviceClass.MEDIUM;
  return DeviceClass.LARGE;
}
```

**Particle count multipliers:**
```js
const PARTICLE_MULTIPLIERS = {
  small: 0.33,  // reduce to 1/3
  medium: 0.66,
  large: 1.0
};
```

**Modify `ParticleSystem.emitRole()` (line 353):**
```js
emitRole(lat, lng, roleName) {
  const preset = this.rolePresets[roleName] || this.rolePresets.Drone;
  const pos = this._screenPos(lat, lng);
  if (!pos) return;
  const mult = PARTICLE_MULTIPLIERS[getDeviceClass()] || 1;
  const count = Math.max(1, Math.round(preset.count * mult));
  for (let i = 0; i < count; i++) {
    // ...
  }
}
```

**Scale also applies to confetti** (`ResultsAnimations.startConfetti()` line 2402):
```js
count = isWinner ? 180 : 60;
// Mobile-small → 60 / 20
```

### 1.4 Canvas Size Scaling — Half-Resolution Render + CSS Scale

**Current:** Theme canvas (`resizeTheme()` line 3617) uses:
```js
const r = Math.min(window.devicePixelRatio || 1, 2);
tCanvas.width = Math.floor(tW * r);
tCanvas.height = Math.floor(tH * r);
tCanvas.style.width = tW + 'px';
tCanvas.style.height = tH + 'px';
tCtx.setTransform(r, 0, 0, r, 0, 0);
```
This already caps DPR at 2, which is good. But on high-DPR phones (3×), this still renders at 2× native resolution = ~750×1334 logical → 1500×2668 actual pixels.

**For low-tier mobile:**
```js
function getCanvasScale() {
  const deviceClass = getDeviceClass();
  const dpr = window.devicePixelRatio || 1;
  if (deviceClass === DeviceClass.SMALL) return Math.min(dpr, 1.5); // Max 1.5×
  if (deviceClass === DeviceClass.MEDIUM) return Math.min(dpr, 2);
  return dpr;
}
```

**Radar canvas** (`RadarModule.enterFullscreen()` line 1686):
```js
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
```
This doesn't account for DPR at all on fullscreen — renders at 375×667 on iPhone SE instead of the native 750×1334. **Fix:**
```js
enterFullscreen() {
  this.fullscreen = true;
  const canvas = this.canvas;
  if (!canvas) return;
  canvas.classList.add('radar-fullscreen');
  const dpr = getCanvasScale(); // capped scale
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.range = 500;
}
```

Similarly for `exitFullscreen()` (line 1696) — 160×160 is fine but should still apply scale:
```js
const dpr = getCanvasScale();
canvas.width = Math.floor(160 * dpr);
canvas.height = Math.floor(160 * dpr);
```

### 1.5 Disable Particle Trails and shadowBlur on Mobile

**Current:** `ParticleSystem._render()` draws trails (lines 309–323) and applies `shadowBlur` (lines 326–339) for every particle. On mobile, these are the most expensive operations.

**Detection:**
```js
// Module-level
const isMobileDevice = () => window.innerWidth < 768 || ('ontouchstart' in window);

// In _render():
const mobile = isMobileDevice();
ctx.save();
ctx.globalCompositeOperation = 'lighter';
for (const p of this.particles) {
  ctx.globalAlpha = p.alpha;
  
  // Skip trails on mobile
  if (!mobile && p.trail && p.trail.length > 1) {
    // ... existing trail code ...
  }
  
  // Skip shadowBlur on mobile
  if (!mobile) {
    ctx.shadowBlur = p.currentSize * 3;
    ctx.shadowColor = p.color;
  }
  
  ctx.fillStyle = p.color;
  // ... fill ...
  
  if (!mobile) ctx.shadowBlur = 0;
}
ctx.restore();
```

Also disable `globalCompositeOperation = 'lighter'` on mobile — it forces GPU render-target blending which can be slow on old mobile GPUs. Simply use normal compositing.

---

## 2. Leaflet Tile Optimization

### 2.1 Pre-Load Tiles Within 2-Tile Radius

**Current:** MapModule init (line 3070) creates a standard `L.tileLayer` with default loading. No proactive pre-fetch.

**Fix — use Leaflet's `updateWhenIdle` + `updateInterval`:**
```js
L.tileLayer(tileUrl, {
  maxZoom: CFG.maxZoom,
  subdomains: CFG.tileSubdomains,
  attribution: CFG.tileAttribution,
  updateWhenIdle: true,     // Only load tiles when user stops panning
  updateInterval: 200,       // 200ms debounce on pan
  keepBuffer: 4,             // Keep 4 tile buffers (default is 2)
  maxNativeZoom: 18          // Don't request tiles beyond this
}).addTo(m);
```

**Pre-load adjacent tiles:** Use `L.TileLayer` extension or `map.on('moveend')` to manually trigger loading of tiles in a 2-tile ring around the visible bounds:
```js
map.on('moveend', () => {
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  // Leaflet's tile layer already manages a 2-tile buffer internally
  // via its `tolerance` option. The key config is `keepBuffer: 4`
  // which keeps tiles within a 4-tile extend of the viewport.
});
```

### 2.2 Reduce Tile Opacity During Particle Bursts

**Purpose:** When particles render above the map, reduce tile layer opacity to free GPU fill-rate.

```js
// In ParticleSystem.emitRole():
// After emitting particles
const tileLayer = MapModule.getTileLayer();
if (tileLayer && isMobileDevice()) {
  tileLayer.setOpacity(0.3);
  // Restore after particles fade (longest lifetime ~1500ms)
  clearTimeout(this._tileOpacityTimer);
  this._tileOpacityTimer = setTimeout(() => {
    tileLayer.setOpacity(1);
  }, 1600);
}
```

Add `getTileLayer()` to MapModule:
```js
function getTileLayer() {
  if (map) {
    let tl = null;
    map.eachLayer(l => { if (l instanceof L.TileLayer) tl = l; });
    return tl;
  }
  return null;
}
```

### 2.3 Lazy Load Tiles Outside Viewport

**Already handled** by Leaflet's tile layer — it only loads tiles intersecting the visible viewport plus buffer. The default `keepBuffer` is 2. Set to `4` on desktop, `2` on mobile to reduce memory.

Also consider `unloadInvisibleTiles: true` (default) — tiles off-screen are removed from DOM. This is already the default.

**Additional optimization:** Set `maxZoom: map.getZoom() + 1` at mission start — don't allow zooming beyond what's useful for the current display:
```js
// In ensureMissionMap():
map.options.maxZoom = 19; // Keep at 19 for detail
// But add zoomend listener to limit tile requests
map.on('zoomend', () => {
  // TileLayer internally manages this; no action needed
});
```

---

## 3. DOM Optimization

### 3.1 CSS `will-change` Usage

**Current:** No `will-change` attributes in the CSS. CSS transitions on `.screen` elements and various HUD elements.

**Where to apply sparingly (on mobile only via JS):**
```js
function applyWillChange(el, property) {
  if (isMobileDevice()) return; // Don't on mobile — GPU memory cost
  el.style.willChange = property;
  // Auto-cleanup after 500ms to avoid memory bloat
  setTimeout(() => { el.style.willChange = 'auto'; }, 500);
}
```

**Targets (desktop only):**
- `.screen` transitions (`opacity`, `transform`) — currently CSS-transitioned
- `.panel-drawer` slide-up animation
- `.hud-button` hover states (irrelevant on mobile)
- Command wheel segments (already visibility toggled)
- `#threatVignette` and `#damageNumbersContainer` elements

**Mobile:** Do NOT use `will-change` on mobile — it commits GPU layer memory for every element, which is worse than the transform cost.

### 3.2 Batch DOM Reads/Writes — Avoid Layout Thrash

**Problem areas identified:**

**a) `ParticleSystem._screenPos()`** (line 344) — calls `getBoundingClientRect()` (a forced layout read) every time particles are emitted:
```js
const rect = mapEl.getBoundingClientRect();
```

**Fix — cache the rect and update only on scroll/resize:**
```js
// Module-level cache
let cachedMapRect = null;
let rectDirty = true;

// Call on scroll/resize events (throttled)
function invalidateMapRect() { rectDirty = true; }

// In _screenPos():
if (rectDirty || !cachedMapRect) {
  const mapEl = document.getElementById('missionMap');
  cachedMapRect = mapEl ? mapEl.getBoundingClientRect() : null;
  rectDirty = false;
}
```

**b) `ScreenJuice.applyShakeToMap()`** (line 541) — reads `missionMap` every frame via `getElementById`:
```js
const mapEl = document.getElementById('missionMap');
```

**Fix — cache reference at init:**
```js
// In ScreenJuice.init():
this.mapElement = document.getElementById('missionMap');

// In applyShakeToMap():
if (this.mapElement) {
  this.mapElement.style.transform = offset ? `translate(${offset.x}px, ${offset.y}px)` : '';
}
```

**c) `DamageNumbers.show()`** (line 559) — creates DOM elements dynamically. Move to object pooling (see §4.1).

**d) General rule — batch pattern:**
```js
function batchDOM(fn) {
  // All DOM reads first
  const reads = [];
  // Then all DOM writes
  requestAnimationFrame(() => {
    fn();
  });
}
```

### 3.3 requestAnimationFrame for All Visual Updates

**Current:** Most visual loops already use rAF. However:
- `ScreenJuice.updateCriticalPulse()` (line 462) uses `requestAnimationFrame()` recursively — **good**
- `DamageNumbers.show()` (line 573) uses `requestAnimationFrame()` for the float-up — **good**
- `BatteryAwareGPS.tick()` is called from `setInterval` (line 5305) — this is fine, it's non-visual

**Fix:** The theme canvas and particle system already use rAF. The confetti loop (`ResultsAnimations.confettiLoop()` line 2463) also uses rAF. **No additional fixes needed here — all visual loops are rAF-bound.**

### 3.4 Throttle Event Listeners (mousemove, touchmove) to 16ms

**Current:** `window.addEventListener('pointermove', ...)` on line 3613:
```js
window.addEventListener('pointermove', e => {
  tPx = e.clientX / Math.max(1, tW);
  tPy = e.clientY / Math.max(1, tH);
});
```
This fires at touchscreen rate (~60–120Hz) and updates two variables. It's cheap but can trigger layout if those vars are read in a layout-sensitive way.

**Add rAF throttle:**
```js
let pointerPending = false;
window.addEventListener('pointermove', e => {
  if (pointerPending) return;
  pointerPending = true;
  requestAnimationFrame(() => {
    tPx = e.clientX / Math.max(1, tW);
    tPy = e.clientY / Math.max(1, tH);
    pointerPending = false;
  });
}, { passive: true });
```

**Drawer drag handler** (line 4841 area):
```js
handle.addEventListener('touchmove', (e) => {
  // Already throttled? Check for rAF
  if (drawerDragPending) return;
  drawerDragPending = true;
  requestAnimationFrame(() => {
    const y = e.touches[0].clientY;
    updateDrawerPosition(startY - y);
    drawerDragPending = false;
  });
}, { passive: true });
```

---

## 4. Memory Management

### 4.1 Object Pooling for Particles

**Current:** `ParticleSystem._update()` splices dead particles from the array:
```js
if (p.life <= 0) { this.particles.splice(i, 1); continue; }
```
And `emitRole()` creates new particle objects via `push({...})`. This causes GC churn.

**Object pool implementation:**
```js
const ParticlePool = {
  pool: [],
  MAX_POOL: 500, // Upper limit

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null; // Caller must create new if null
  },

  release(particle) {
    if (this.pool.length < this.MAX_POOL) {
      // Reset particle state
      particle.x = 0; particle.y = 0;
      particle.vx = 0; particle.vy = 0;
      particle.life = 0; particle.maxLife = 0;
      particle.size = 0; particle.currentSize = 0;
      particle.color = ''; particle.alpha = 0;
      particle.gravity = 0; particle.char = '';
      particle.colors = null;
      particle.trail = null;
      this.pool.push(particle);
    }
  }
};
```

**Modify `ParticleSystem.emitRole()`:**
```js
for (let i = 0; i < count; i++) {
  let p = ParticlePool.acquire();
  if (!p) {
    p = {}; // new particle object
  }
  p.x = pos.x; p.y = pos.y;
  // ... set all other properties ...
  p.trail = []; // fresh trail
  this.particles.push(p);
}
```

**Modify `_update()`:**
```js
if (p.life <= 0) {
  ParticlePool.release(p);
  this.particles.splice(i, 1);
  continue;
}
```

**Same pattern for confetti particles** (`ResultsAnimations.particles`).

### 4.2 Max Particles by Device Class

| Device Class | Max Particles | Confetti (winner) | Confetti (loser) |
|---|---|---|---|
| Large (>768px) | 300 | 180 | 60 |
| Medium (480-768px) | 150 | 90 | 30 |
| Small (<480px) | 60 | 40 | 15 |

```js
function getMaxParticles() {
  const dc = getDeviceClass();
  return dc === DeviceClass.SMALL ? 60 : dc === DeviceClass.MEDIUM ? 150 : 300;
}
```

**In `ParticleSystem._update()` or `emitRole()`:**
```js
const MAX = getMaxParticles();
if (this.particles.length > MAX) {
  // Drop oldest particles
  const excess = this.particles.length - MAX;
  for (let i = 0; i < excess; i++) {
    const dead = this.particles.shift();
    ParticlePool.release(dead);
  }
}
```

### 4.3 Clear Canvas Context Between Frames

**Current:**
- `RadarModule.draw()` — uses `ctx.clearRect(0, 0, canvas.width, canvas.height)` (line 1747) ✅
- `ParticleSystem._render()` — uses `this.canvas.width = this.canvas.width` (line 303) ⚠️ (full reset, expensive)
- `drawTheme()` — uses `ctx.clearRect(0, 0, tW, tH)` (line 3629) ✅
- `CommandWheel.draw()` — uses `ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)` (line 2216) ✅

**Fix ParticleSystem:**
Replace `canvas.width = canvas.width` with `ctx.clearRect(0, 0, canvas.width, canvas.height)` + off-screen canvas approach (see §1.1). The `canvas.width = canvas.width` approach clears the entire canvas but also resets the context state (transform, globalAlpha, etc.) and forces a synchronous reallocation which stalls on mobile GPUs.

### 4.4 Ghosting Prevention

Already handled via `clearRect` before every draw in radar and command wheel. However, since the particle system uses `globalCompositeOperation = 'lighter'`, there can be additive blending artifacts if not properly cleared. The `canvas.width = canvas.width` approach clears these, but switching to `clearRect` achieves the same.

---

## 5. Mobile-Specific UI

### 5.1 Larger Touch Targets (44px Minimum)

**Current CSS audit:**
| Element | Current size | Needs fix? |
|---|---|---|
| `.panel-tab` | 8px 4px padding | ❌ ~24px height |
| `.compact-button` | 8px 10px padding | ❌ ~36px height |
| GPS input fields | 8px padding, 13px font | ❌ ~29px height |
| `.hud-button` | Varies | Check min-height |
| Drawer handle | Thin bar | Need wider grip |
| Radar toggle tap area | 160×160 canvas | ✅ |
| Fullscreen radar close btn | ~30×30 | ❌ Should be 44×44 |

**CSS fixes (add to `styles-v2.css`):**
```css
/* Mobile touch target upgrade */
@media (max-width: 480px) {
  .panel-tab {
    padding: 12px 8px !important;
    min-height: 44px;
  }
  .compact-button,
  .hud-button {
    min-height: 44px;
    min-width: 44px;
    padding: 10px 14px !important;
  }
  #gpsLatInput, #gpsLngInput,
  .gps-input-field {
    padding: 12px 10px !important;
    font-size: 16px !important; /* prevents iOS zoom on focus */
    min-height: 44px;
  }
  .drawer-handle {
    height: 8px !important;
    width: 60px !important;
    margin: 8px auto !important;
  }
  .radar-fullscreen .radar-close-btn {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  #toggleRadar, #fullscreenRadar {
    min-width: 48px;
    min-height: 48px;
  }
  /* Also set -webkit-tap-highlight-color for feedback */
  -webkit-tap-highlight-color: rgba(255,139,31,0.3);
}
```

**Prevent iOS zoom on input focus** (already partially handled by `user-scalable=no` in viewport meta, but `font-size: 16px` is the definitive fix for inputs).

### 5.2 Bottom Drawer Panels for Non-Map UI

**Current:** Panel drawer slides from bottom (from `MOBILE_POLISH.md` — already designed).

**Implementation notes:**
```js
// Panel drawer touch drag handling (existing code line ~4841)
// Add snap points: 40% height (collapsed), 80% height (expanded)
const SNAP_POINTS = { collapsed: 0.4, expanded: 0.8 };

function onDrawerEnd(clientY) {
  const delta = drawerStartY - clientY;
  const maxHeight = window.innerHeight;
  if (delta > 50) {
    // Snap to expanded
    drawerEl.style.height = `${maxHeight * SNAP_POINTS.expanded}px`;
  } else {
    // Snap to collapsed
    drawerEl.style.height = `${maxHeight * SNAP_POINTS.collapsed}px`;
  }
}
```

**Auto-hide radar when drawer opens (from MOBILE_POLISH.md):**
```js
function onDrawerOpen() {
  if (isMobileDevice() && RadarModule.open) {
    RadarModule.canvas.style.display = 'none';
  }
}
function onDrawerClose() {
  if (isMobileDevice() && !RadarModule.open) {
    RadarModule.canvas.style.display = 'block';
  }
}
```

### 5.3 Hold-to-Activate Command Wheel (Long Press)

**Current:** Command wheel (`CommandWheel` line 1995) opens via dedicated canvas element. Right-click triggers move-here ping on map.

**Mobile adaptation — long press handler:**
```js
let longPressTimer = null;
let longPressTriggered = false;

function setupLongPress(element, callback) {
  element.addEventListener('touchstart', (e) => {
    longPressTriggered = false;
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      const touch = e.touches[0];
      callback(touch.clientX, touch.clientY);
    }, 500); // 500ms hold
  }, { passive: true });

  element.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    if (!longPressTriggered) {
      // It was a quick tap — handle as normal click
    }
  }, { passive: true });

  element.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer); // Cancel if finger moves
  }, { passive: true });
}

// Wire up on mission map
setupLongPress(document.getElementById('missionMap'), (x, y) => {
  // Convert touch to latlng and open command wheel
  const point = map.containerPointToLatLng([x, y]);
  CommandWheel.openAt(point.lat, point.lng);
});
```

### 5.4 Swipe Gestures

**Gesture map for mobile:**
| Gesture | Action | Implementation |
|---|---|---|
| Swipe left on radar | Minimize radar | `touchstart→touchmove` deltaX > 80px |
| Swipe down on drawer | Close panels | Existing handler (deltaY > 50px) |
| Swipe up on map | Open command wheel | Alternative to long-press |
| Two-finger pinch | Map zoom | Already handled by Leaflet |

**Radar toggle swipe:**
```js
let radarTouchStartX = 0, radarTouchStartY = 0;
const radarEl = document.getElementById('missionRadar');

radarEl.addEventListener('touchstart', (e) => {
  radarTouchStartX = e.touches[0].clientX;
  radarTouchStartY = e.touches[0].clientY;
}, { passive: true });

radarEl.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - radarTouchStartX;
  const dy = e.touches[0].clientY - radarTouchStartY;
  if (Math.abs(dx) > Math.abs(dy) && dx < -80) {
    // Swipe left → minimize
    RadarModule.toggle();
  }
}, { passive: true });
```

**Panels open/close via swipe-up on HUD area:**
```js
let panelSwipeStartY = 0;
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('#panelsButton')) {
    panelSwipeStartY = e.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (panelSwipeStartY > 0 && panelSwipeStartY - e.changedTouches[0].clientY > 80) {
    // Swipe up → open panels
    togglePanels(true);
  }
  panelSwipeStartY = 0;
}, { passive: true });
```

---

## 6. Implementation Priority

| # | Task | Effort | Impact | Dependencies |
|---|---|---|---|---|
| P0 | Canvas half-resolution + DPR capping (§1.4) | 1h | Very High — biggest single win | None |
| P0 | Object pooling for particles (§4.1) | 2h | Very High — eliminates GC stalls | None |
| P0 | Max particles by device class (§4.2) | 0.5h | High — prevents OOM on low-end | DeviceClass util |
| P0 | Disable shadowBlur + trails on mobile (§1.5) | 0.5h | High — reduces fill-rate ~60% | None |
| P1 | Off-screen canvas double-buffering (§1.1) | 1.5h | High — eliminates backbuffer flush | Canvas size fix |
| P1 | rAF throttle when backgrounded (§1.2) | 1h | High — saves battery on tab switch | None |
| P1 | Touch targets 44px (§5.1) | 1h | High — usability blocker | CSS media query |
| P1 | Bottom drawer snap points (§5.2) | 1.5h | High — UX quality | Existing drawer code |
| P1 | Event listener throttle (§3.4) | 0.5h | Medium — reduces jank | None |
| P2 | Batch DOM reads (§3.2) | 1h | Medium — layout thrash fix | None |
| P2 | Long-press command wheel (§5.3) | 2h | Medium — mobile gameplay parity | CommandWheel |
| P2 | Pre-load tiles + keepBuffer (§2.1) | 0.5h | Medium — smoother map browsing | None |
| P2 | Leaflet tile opacity on burst (§2.2) | 0.5h | Low-Medium — mobile fill-rate | ParticleSystem hook |
| P3 | Swipe gestures for radar/panels (§5.4) | 1h | Medium — nice to have | Existing toggle functions |
| P3 | CSS will-change sparingly (§3.1) | 0.5h | Low | None |
| P3 | Confetti particle pool (§4.1) | 0.5h | Low | ResultsAnimations |

---

## 7. Performance Budget Targets

| Metric | Current (est.) | Target | Measurement |
|---|---|---|---|
| Particle system frame time | ~8-12ms (desktop with 50 particles) | <4ms on mobile | `performance.now()` in loop |
| Radar draw frame time | ~3-5ms | <2ms | PerfMonitor |
| Theme canvas frame time | ~6-10ms | <3ms (skip on mobile?) | PerfMonitor |
| Total rAF loop time | ~20-30ms | <10ms (mobile) | Sum of all loop times |
| Memory alloc rate | Unknown — GC pauses visible | <10MB/s new allocation | Chrome DevTools Performance |
| FPS on iPhone SE (750×1334) | ~30-45fps (estimated) | 60fps consistent | PerfMonitor debug overlay |
| GPU fill rate | High (shadows, compositing) | Medium (no shadows, 0.5× scale) | Chrome DevTools GPU raster |
| Tile memory | ~50-100MB at zoom 18 | <40MB | Chrome DevTools Memory |

---

## 8. Testing Matrix

| Device | Screen | DPR | Expected FPS After Optimization |
|---|---|---|---|
| iPhone SE (2020) | 375×667 | 2× | 60fps |
| iPhone 14 Pro | 393×852 | 3× (capped 1.5×) | 60fps |
| Samsung Galaxy S21 | 412×915 | 2.5× (capped 2×) | 60fps |
| Pixel 4a | 393×851 | 2× | 60fps |
| iPad Mini (6th gen) | 744×1133 | 2× | 60fps |
| iPad Pro 12.9" | 1024×1366 | 2× | 60fps |
| Low-end Android (Moto G) | 480×854 | 1.5× | 30-60fps (may need further reduction) |

---

## 9. Key Code Hooks

### 9.1 New Utility File: `mobile-optimize.js`

New file at `/media/quemello/Back up2/signal-lost-game-dev/signal-lost-game-v2/mobile-optimize.js` containing:

```
DeviceClass detection
ParticlePool (shared between ParticleSystem + ResultsAnimations)
Canvas scale helper (getCanvasScale)
DOM cache helpers (cachedMapRect)
Event throttle wrappers
Long-press/setup helper
```

### 9.2 Modifications to Existing Files

| File | Changes |
|---|---|
| `game-v2.js` | ParticleSystem: pool, mobile checks, rAF throttle. RadarModule: DPR fix, tile opacity. Theme canvas: rAF throttle. ResultsAnimations: pool. MapModule: tile config. ScreenJuice: cache refs. All loops: visibility check. |
| `styles-v2.css` | @media (max-width: 480px) touch target overrides, font-size: 16px on inputs, drawer handle sizing. |
| `index.html` | Add `<script src="mobile-optimize.js">` before `game-v2.js`. |

---

## 10. Appendix: Existing Battery-Aware GPS (Already Done)

The `BatteryAwareGPS` module (line 1156) already handles:
- Adaptive GPS polling based on battery level (normal: 5000ms, low: 15000ms, critical: 30000ms)
- Manual battery saver toggle
- Charging detection via Battery API
- UI indicator with icon/color/mode label

This is a good pattern to follow for the rendering-side battery awareness — can add a `BatteryAwareRenderer` that reduces quality settings when battery ≤ 20%.

---

*Document generated for Signal Lost v2 — mobile optimization phase.*
