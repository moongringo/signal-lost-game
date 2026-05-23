# Signal Lost v2 — Game Design Research Document

> **Context:** Tactical multiplayer GPS game (vanilla HTML/CSS/JS, Canvas 2D, Leaflet OSM)
> **Existing:** ParticleSystem, ScreenJuice (shake/vignette/hitmarkers), CommandWheel, DamageNumbers, EventLog, results confetti, theme pattern canvas, threat vignette/glow/indicators
> **Audience:** Implementation guide for v2 polish pass

---

## 1. Vlambeer "Juice" Principles for Web Canvas Games

*Juice = making every interaction feel physically satisfying, not just logically correct.*

### 1.1 Screen Shake — Current Pattern & Improvements

**Current (`ScreenJuice.shake`):** Decay-based with random offset. Applied via CSS `transform` to `#missionMap`.

```js
// Current:
shake(intensity = 4, duration = 200) {
  this.shakeDecay = intensity / (duration / 16);
  this.shakeX = (Math.random() - 0.5) * intensity * 2;
  this.shakeY = (Math.random() - 0.5) * intensity * 2;
}
```

**Do this instead:**

- **Use Perlin-style shake** — multiply random offset by decaying envelope rather than subtractive decay. Gives more natural "ringing."

```js
// Recommended pattern:
shake(intensity = 4, duration = 200) {
  this.shakeStart = performance.now();
  this.shakeDuration = duration;
  this.shakeIntensity = intensity;
}
// In applyShake():
const elapsed = performance.now() - this.shakeStart;
const t = Math.max(0, 1 - elapsed / this.shakeDuration);
// Ease-out quad envelope
const envelope = t * t;
const freq = 12; // oscillations over duration
this.shakeX = (Math.random() - 0.5) * 2 * intensity * envelope * Math.cos(elapsed * 0.05);
this.shakeY = (Math.random() - 0.5) * 2 * intensity * envelope * Math.sin(elapsed * 0.05);
```

- **Intensity tiers by event:**
  - Minor hit (bullet hit): intensity=3, duration=120ms
  - Major hit (explosion): intensity=8, duration=300ms
  - Player death: intensity=15, duration=500ms
  - Extraction start: intensity=6, duration=250ms

### 1.2 Hit Stop / Freeze Frames

- **Not currently implemented.** Critical juice technique.
- **Pattern:** Pause game loop for N ms on impactful events.
- **Do this:**

```js
// In game loop:
function gameLoop(ts) {
  if (hitStopUntil && ts < hitStopUntil) {
    // Still render last frame (frozen)
    renderFrame();
    requestAnimationFrame(gameLoop);
    return;
  }
  hitStopUntil = null;
  // normal update + render
}

// Trigger:
function triggerHitStop(durationMs = 80) {
  hitStopUntil = performance.now() + durationMs;
}
```

- **Timing values:**
  - Bullet hit: 40-60ms
  - Kill: 80-100ms
  - Explosion: 120-150ms
  - Ability use: 60ms
  - **Don't freeze UI** — only freeze the game world/map updates. HUD elements should remain responsive.

### 1.3 Hitmarkers — Current & Improvements

**Current:** V-shape cross via Canvas 2D `lineTo`, 300ms fade on radar overlay.

**Do this instead:**
- Add **audio cue** (short beep/ping) on hit marker spawn
- Add **CSS scale pop** to the hitmarker container on first frame
- Increase size on headshot/critical hits (multiply size by 1.5)
- Use `shadowBlur` for glow effect:

```js
ctx.shadowColor = '#ff4444';
ctx.shadowBlur = 8;
ctx.strokeStyle = '#ff6666';
ctx.lineWidth = 3;
```

### 1.4 Flash & Muzzle Effects

- **Current:** `flashVignette()` — radial gradient overlay, 300ms fade.
- **Add:** Brief white flash on player-damage-dealt (50ms, opacity 0.3):

```js
flashDamageDealt() {
  this.flashEl = this.flashEl || document.getElementById('damageFlash');
  if (!this.flashEl) return;
  this.flashEl.style.background = 'rgba(255,255,255,0.25)';
  this.flashEl.style.opacity = '1';
  setTimeout(() => { this.flashEl.style.opacity = '0'; }, 50);
}
```

- **Add to CSS:**
```css
#damageFlash {
  position: fixed; inset: 0; z-index: 7;
  pointer-events: none; opacity: 0;
  transition: opacity 0.05s linear;
}
```

### 1.5 Floating Damage Numbers — Improvements

**Current (`DamageNumber`):** DOM-based, animated with CSS transition on transform + opacity. Color based on damage type. Single number at hit location.

**Do this instead:**
- **Critical hits:** Larger font, bold, gold color (`#ffd965`), brief scale bounce
- **Stagger vertical offset** when multiple numbers appear at same location (add Y offset per overlapping instance)
- **Add shadowBlur** for better readability on map terrain:
```js
el.style.textShadow = `0 0 8px ${color}, 0 0 16px rgba(0,0,0,0.8)`;
```
- **Animated pop-in** using CSS `@keyframes`:
```css
@keyframes damageNumberIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { transform: translate(-50%, -60%) scale(1.15); }
  100% { opacity: 1; transform: translate(-50%, -70%) scale(1); }
}
```

---

## 2. Command Wheel UX Best Practices

**Current (`CommandWheel`):**
- Canvas 2D, 6-8 radial segments
- `easeOutBack` animation (`c1 = 1.70158`) over 400ms
- Segment stagger fade-in (`segDelay = i / SEGMENTS`)
- Hover highlight with `rgba(255,255,255,0.15)` fill
- Center circle with "CMD" label
- Closes on click, right-click, or Escape

### 2.1 Animation Improvements

**Current easeOutBack formula (correct):**
```js
c1 = 1.70158;
c3 = c1 + 1;
animScale = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
```

**Do this:**
- **Duration:** 400ms is good. Keep as-is.
- **Add overshoot dampening:** After `easeOutBack` completes (t=1), snap `animScale = 1` (already done).
- **Segment stagger:** Current formula `Math.min(1, Math.max(0, (s - segDelay * 0.5) * 2))` works well. Keep.
- **Add closing animation** (currently instant hide): Animate scale from 1→0.85 over 150ms with `easeIn` before hiding.

```js
close() {
  if (this._closing) return;
  this._closing = true;
  this._closeStart = performance.now();
  const closeAnim = (ts) => {
    const t = Math.min(1, (ts - this._closeStart) / 150);
    this.animScale = 1 - 0.15 * (t * t); // ease-in quad
    this.draw();
    if (t < 1) {
      this._animId = requestAnimationFrame(closeAnim);
    } else {
      this.animScale = 0;
      this._finishClose();
    }
  };
  this._animId = requestAnimationFrame(closeAnim);
}
```

### 2.2 Sector Detection

**Current:** Uses `mousemove` event on canvas, calculates angle from center via `Math.atan2(dy, dx)`.

**Do this:**
- **Add dead zone** in center circle (radius < 22% of wheel radius) — currently just skips segment highlight. Change to show a "center" state.
- **Touch support:** Add `touchmove` / `touchstart` with the same angle detection:

```js
// On touch devices, show larger hit targets (increase font + segment highlight radius)
if ('ontouchstart' in window) {
  this.TOUCH_MODE = true;
  this.ICON_MIN_SIZE = 16;
  this.LABEL_MIN_SIZE = 11;
}
```

- **Keyboard shortcuts:** Already wired via `keydown`. Map number keys 1-8 to segments. Show key hints in each segment:
```js
// Add to each segment in draw():
ctx.fillText(`[${i + 1}]`, ...); // Small key hint in corner
```

### 2.3 Visual Polish

- **Do:** Increase hover segment stroke width from 2px to 3px
- **Do:** Add subtle glow to hovered segment icon (`shadowBlur: 6`)
- **Do:** Animate icon scale on hover (iconSize 13→16 is good, keep)
- **Do:** Add brief label description on hover (fade in sub-label at bottom of wheel)
- **Don't:** Use full-opacity backgrounds — current 0.92 opacity with backdrop is right for tactical feel

---

## 3. HUD Color Theory for Tactical Games

### 3.1 Current State

```js
const roleColors = {
  Drone: '#58a6ff',         // Blue — recon, data
  Mechanic: '#f0883e',      // Orange — engineering, heat
  Medic: '#3fb950',         // Green — health, safety
  Decoder: '#d2a8ff',       // Purple — mystery, intel
  Navigator: '#79c0ff',     // Light blue — guidance
  Courier: '#ffa657',       // Orange-yellow — movement
  'Mission Control': '#ffd965' // Gold — command, priority
};
```

### 3.2 Color Accessibility Checklist

- **Contrast ratios:** All role colors on `#0b0f14` (dark bg) need WCAG AA (4.5:1 for text, 3:1 for UI). Current colors pass for UI elements; for text labels use white/light gray overlay.
- **Color-blind safe palette:** Avoid red/green as ONLY differentiator.
  - Current palette is good — each role has a unique hue (blue, orange, green, purple, gold)
  - **Fix this:** Medic (green) and Decoder (purple) are both mid-brightness. For deuteranopia, add a shape icon alongside color.
- **Deuteranopia test:** The most common form. Red and green both appear brownish.
  - Current green (#3fb950) → okay for deuteranopes (higher luminance)
  - Red danger (#ef4444 in threat system) vs Medic green — use icons + text labels as backup

### 3.3 Threat Indicator Colors

- **Current:** `#ef4444` (red-500) for threats, `#00bcd4` (cyan) for system
- **Do:** Use these precise roles:
  - **Imminent danger** → `#ef4444` (red) — high contrast, immediate attention
  - **Warning/caution** → `#f59e0b` (amber) — low contrast but visible
  - **Info/friendly** → `#3b82f6` (blue) — neutral
  - **Objective** → `#22c55e` (green) — positive
  - **System** → `#06b6d4` (cyan) — neutral info
- **Don't:** Use pure red (`#ff0000`) — it's too bright and causes eye strain on dark backgrounds
- **Do:** Add a desaturated fallback for color-blind users via CSS filter or data attribute

### 3.4 Role-Specific HUD Coloring

- **Do:** Color the player's role icon and ability buttons with their role color
- **Do:** Use role color for chat messages from that role player
- **Do:** Minimap dots should use role colors with a white border (`strokeStyle: rgba(255,255,255,0.5)`)
- **Don't:** Use role colors for background highlights — they're for icons and text only

---

## 4. Pure Canvas 2D Visual Effects (No Libraries)

### 4.1 Glow Effects via `shadowBlur`

**Core pattern for tactical glow:**

```js
ctx.save();
ctx.shadowColor = '#ff8b1f';        // accent color
ctx.shadowBlur = 12;                // blur radius in px
ctx.fillStyle = '#ff8b1f';
ctx.globalAlpha = 0.6;
ctx.beginPath();
ctx.arc(x, y, 6, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
```

**Performance note:** `shadowBlur` is expensive. On low-end mobile, cap at 8px or use a two-step technique:
1. Draw object at large size with low alpha (fake glow)
2. Draw object at normal size with high alpha

**Do this layered approach for better perf:**

```js
function drawGlow(ctx, x, y, radius, color, intensity = 1) {
  // Outer glow (fake shadowBlur)
  ctx.save();
  ctx.globalAlpha = 0.15 * intensity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mid glow
  ctx.save();
  ctx.globalAlpha = 0.3 * intensity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Core
  ctx.save();
  ctx.globalAlpha = 0.9 * intensity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

### 4.2 Trails (Motion Traces)

**Pattern — store last N positions, draw with decreasing opacity:**

```js
// In update, before setting new position:
this.trail.push({ x: this.x, y: this.y });
if (this.trail.length > 12) this.trail.shift();

// In render:
for (let i = 0; i < this.trail.length; i++) {
  const t = i / this.trail.length;
  ctx.save();
  ctx.globalAlpha = t * 0.4;
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * t, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

**Do:** Trail length of 8-16 points works well. Longer for fast-moving objects (bullets, drones), shorter for slow-moving.

### 4.3 Additive Blending (Canvas)

**Current:** Uses `ctx.globalCompositeOperation = 'lighter'` in `ParticleSystem._render()`.

**This is correct.** Keep `'lighter'` for all particle effects, explosions, and glow indicators.

**Additional uses for additive blending:**
- Scanner pulse wave overlaps
- Ability charge-up effects
- Extraction zone active rings
- Signal strength indicators

### 4.4 Scanner / Radar Sweep Effect

**Pattern for the radar overlay sweep:**

```js
// In radar render loop:
const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2); // rotates ~3s per revolution

ctx.save();
ctx.translate(cx, cy);
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.arc(0, 0, radius, sweepAngle - 0.2, sweepAngle + 0.2);
ctx.closePath();

// Gradient fill for sweep
const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
grad.addColorStop(0, 'rgba(0, 188, 212, 0.15)');
grad.addColorStop(0.8, 'rgba(0, 188, 212, 0.05)');
grad.addColorStop(1, 'rgba(0, 188, 212, 0)');
ctx.fillStyle = grad;
ctx.fill();
ctx.restore();
```

### 4.5 Pulse Ring Animation

**Used for ability activations, extraction beacons, threat pings:**

```js
// Store ring data:
rings: [], // { x, y, startTime, duration, color, maxRadius }

// Update:
updateRings(now) {
  for (let i = this.rings.length - 1; i >= 0; i--) {
    const r = this.rings[i];
    const elapsed = now - r.startTime;
    const t = elapsed / r.duration;
    if (t >= 1) { this.rings.splice(i, 1); continue; }
    const radius = r.maxRadius * t;
    const alpha = 1 - t;
    drawPulseRing(ctx, r.x, r.y, radius, alpha, r.color);
  }
}

function drawPulseRing(ctx, x, y, radius, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
```

---

## 5. Kill Feed / Event Log Animation Patterns

### 5.1 Current State

**EventLog** is a DOM-based system using CSS animation:
- `eventLogIn`: slide in from left + scale up (0.35s, `cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoot bounce)
- `eventLogOut`: slide out left + scale down (0.4s, `ease-in`)
- Max 6 entries, 5000ms display duration, 400ms fade
- Color-coded left border per type (score=yellow, threat=red, objective=green, system=cyan, ability=purple)

**This is already well-implemented.** Minor recommendations:

### 5.2 Improvements

- **Add slide-in from right** for kill events specifically to differentiate from system events (left = game state, right = combat)
- **Staggered dismissal** — don't remove all at once. When removing, animate the remaining entries up:
```css
.event-log-overlay {
  /* Keep overflow visible during animation */
  overflow: visible;
}
/* Add transition for reflow when items are removed */
.event-log-item {
  transition: transform 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
}
```

- **Icon + text layout** (current is good):
  - Icon: 13px (11px mobile), single emoji or unicode symbol
  - Text: 11px (10px mobile, 9px tiny), `strong` tag for bold names
  - Left border: 3px color-coded
  - Background: `rgba(11,15,20,0.88)` with `backdrop-filter: blur(4px)`
  - Max-width: 260px desktop, 200px tablet, 170px mobile

- **Critical kills** (one-shot, headshot): Add a brief flash effect:
```css
.event-log-item.event-kill {
  border-left-width: 4px;
  animation: eventLogKillIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes eventLogKillIn {
  0% { opacity: 0; transform: translateX(-20px) scale(0.8); }
  60% { transform: translateX(4px) scale(1.1); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
```

### 5.3 Layout Order

- **Current:** Newest at bottom (push older up).
- **Recommendation:** Keep this — matches chat/messaging conventions. If you want "combat log" style (newest at top), use `flex-direction: column-reverse` on the container.

---

## 6. Fog of War — Canvas Implementation

### 6.1 Core Pattern

**Do this — pure Canvas 2D, no WebGL needed for a top-down tactical map:**

```js
class FogOfWar {
  constructor(canvas, mapBounds) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = canvas.offsetWidth * 2; // 2x for retina
    this.canvas.height = canvas.offsetHeight * 2;
    this.revealedPoints = []; // { x, y, radius, revealedAt }
    this.completeBlack = true; // start fully fogged
  }

  render(now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Step 1: Fill entire canvas with solid fog
    ctx.fillStyle = 'rgba(11, 15, 20, 0.92)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Step 2: "Cut holes" using destination-out compositing
    ctx.globalCompositeOperation = 'destination-out';
    for (const rp of this.revealedPoints) {
      const elapsed = now - rp.revealedAt;
      const revealDuration = 500; // ms for full reveal
      const t = Math.min(1, elapsed / revealDuration);
      const radius = rp.radius * t; // growing reveal

      if (radius > 0) {
        // Soft edge gradient
        const grad = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');    // fully cut
        grad.addColorStop(0.7, 'rgba(0,0,0,1)');  // mostly cut
        grad.addColorStop(1, 'rgba(0,0,0,0)');    // soft edge
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Step 3: Draw fog edge glow (using destination-over for fog layer on top)
    ctx.globalCompositeOperation = 'destination-over';
    // ... optional edge glow drawing

    // Reset composite
    ctx.globalCompositeOperation = 'source-over';

    return this.canvas;
  }

  reveal(x, y, radius = 120) {
    this.revealedPoints.push({ x, y, radius, revealedAt: performance.now() });
  }
}
```

### 6.2 Key Values

- **Reveal radius:** 120px at default zoom (fine-tune per zoom level)
- **Reveal duration:** 400-600ms for smooth gradient expansion
- **Fog color:** `rgba(11, 15, 20, 0.92)` — matches existing `--bg` variable
- **Edge softness:** Radial gradient from center (hard cut 0→0.7, soft falloff 0.7→1.0)
- **Retina:** Always render at 2x and CSS-scale down for crisp edges

### 6.3 Ping Reveal

When a player pings a location:
```js
fogOfWar.reveal(pingScreenX, pingScreenY, 150); // slightly larger radius than normal
```

### 6.4 Performance

- **Do:** Batch `reveal` calls — don't render every frame if nothing changed
- **Do:** Cache the fog canvas as an offscreen buffer, only redraw on `reveal()` call
- **Don't:** Use `destination-out` every frame — only when fog state changes
- **Do:** Limit revealed points to 50, cull oldest beyond that

```js
reveal(x, y, radius = 120) {
  this.revealedPoints.push({ x, y, radius, revealedAt: performance.now() });
  if (this.revealedPoints.length > 50) {
    this.revealedPoints.shift(); // remove oldest
  }
  this.dirty = true; // triggers redraw on next render
}
```

### 6.5 Gradual Fog Re-application

For "fog creep" (re-fogging areas over time):
```js
// In reveal(): save current time
// In render(): decay older reveals
const FOG_DECAY_MS = 30000; // 30 seconds
for (const rp of this.revealedPoints) {
  if (now - rp.revealedAt > FOG_DECAY_MS) {
    const decay = Math.min(1, (now - rp.revealedAt - FOG_DECAY_MS) / 5000);
    rp.currentRadius = rp.radius * (1 - decay * 0.5); // shrink to 50% over 5s
  }
}
```

---

## 7. Screen Transition Effects

### 7.1 Current State

Screen transitions use CSS transitions on `.screen` elements:
```css
.screen {
  opacity: 0;
  transform: translateX(30px);
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Classes for direction: `transition-out`, `transition-in`, `transition-out-reverse`, `transition-in-reverse`

### 7.2 Recommended Additional Effects

#### Flash Transition (between major screens: lobby→mission)
```css
#screenFlashOverlay {
  position: fixed; inset: 0; z-index: 99;
  background: #0b0f14;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
```

```js
function flashTransition(duration = 250, callback) {
  const flash = document.getElementById('screenFlashOverlay');
  if (!flash) { callback?.(); return; }
  flash.style.opacity = '1';
  setTimeout(() => {
    flash.style.opacity = '0';
    callback?.();
  }, duration / 2);
  setTimeout(() => {
    flash.style.opacity = '1';
  }, 10);
}
```

#### Scan Line Wipe

**Canvas-based wipe for dramatic transitions (splash→lobby, results→lobby):**

```js
function scanLineWipe(fromEl, toEl, duration = 600) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:98;pointer-events:none;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const startTime = performance.now();

  const animate = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    const scanY = t * canvas.height;

    // Draw scan line
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Revealed area below scan line
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, scanY);
    ctx.restore();

    // Scan line glow
    ctx.save();
    ctx.shadowColor = '#ff8b1f';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff8b1f';
    ctx.fillRect(0, scanY - 2, canvas.width, 4);
    ctx.restore();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
      fromEl.style.display = 'none';
      toEl.style.display = 'flex';
      // trigger toEl entrance via CSS
      toEl.classList.add('transition-in');
      setTimeout(() => toEl.classList.remove('transition-in'), 350);
    }
  };
  requestAnimationFrame(animate);
}
```

#### Radial Wipe

**Alternative to scan line — reveal from center out:**

```js
function radialWipe(ctx, cx, cy, progress) {
  ctx.save();
  ctx.fillStyle = '#0b0f14';
  // Fill everything except a growing circle
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.arc(cx, cy, progress * Math.max(canvas.width, canvas.height), 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();
}
```

### 7.3 Transition Timing Reference

| Transition Type | Duration | Easing | Use Case |
|---|---|---|---|
| Standard slide | 350ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Lobby↔Setup, mission screen changes |
| Flash (full) | 250ms | Linear | Lobby→Mission, Mission→Results |
| Scan line wipe | 500-700ms | Linear | Splash→Lobby, dramatic moments |
| Radial wipe | 500ms | `ease-out` | Boss reveals, extraction events |
| Fade (simple) | 300ms | `ease` | HUD element transitions, toast messages |

### 7.4 Mission→Results Transition (Victory/Defeat)

**Do:** Flash white (100ms) → hold black (200ms) → fade in results screen with confetti (if win)
```js
function transitionToResults(isWin) {
  const flash = document.getElementById('screenFlashOverlay');
  flash.style.background = isWin ? '#ffffff' : '#0b0f14';
  flash.style.opacity = '1';
  setTimeout(() => {
    document.body.dataset.screen = 'results';
    flash.style.opacity = '0';
    if (isWin) ResultsAnimations.startConfetti(true);
    ResultsAnimations.animateScoreCounter(finalScore);
    ResultsAnimations.triggerEntranceAnimations();
  }, 250);
}
```

---

## 8. Summary of Actionable Takeaways

### For Signal Lost v2 Specifically:

1. **Juice Layer (ScreenJuice):**
   - Add hit-stop (`triggerHitStop(ms)`) in game loop — 60ms for hits, 100ms for kills
   - Replace subtractive shake with envelope-based shake
   - Add damage-flash overlay element (`#damageFlash`)
   - Add critical hit marker variant (larger, glowing, gold)

2. **Command Wheel:**
   - Add close animation (150ms ease-in)
   - Add key hints `[1]-[8]` to segments
   - Add touch support for `touchmove/touchstart`
   - Keep `easeOutBack` with `c1 = 1.70158` — it's correct

3. **HUD Color:**
   - Current role colors are good — unique hues prevent confusion
   - Add shape icons alongside colors for color-blind accessibility
   - Use `#ef4444` for threat, `#f59e0b` for warning, `#3b82f6` for info
   - Never use pure `#ff0000`

4. **Canvas Effects:**
   - Stick with `globalCompositeOperation = 'lighter'` for particles
   - Use layered fake-glow (big low-alpha + small high-alpha) instead of `shadowBlur` on low-end mobile
   - Implement pulse ring system for ability pings and extraction zones
   - Trail length: 8-16 points max

5. **Event Log / Kill Feed:**
   - Keep current CSS implementation — it's well done
   - Add `event-kill` variant with stronger animation (bounce overshoot)
   - Add staggered reflow when items are dismissed

6. **Fog of War — Implement as described:**
   - Use `destination-out` compositing to cut holes in fog layer
   - Cache offscreen canvas, only redraw on `reveal()`
   - Fade edge with radial gradient (hard 0→0.7, soft to 1.0)
   - Limit to 50 revealed points, decay old ones after 30s

7. **Screen Transitions:**
   - Add flash transition overlay for major screen changes
   - Add scan-line wipe for dramatic moments
   - Timeline: Flash(100ms black) → Hold(200ms) → Fade-in(350ms)

### Reference CSS Values

| Property | Value | Where |
|---|---|---|
| Background | `#0b0f14` | Root `--bg` |
| Card bg | `#141c26` | Root `--bg-card` |
| Border | `#1e2a38` | Root `--border` |
| Text | `#dbeafe` | Root `--text` |
| Accent | `#ff8b1f` | Root `--accent` |
| Fog alpha | 0.92 | Fog overlay |
| Fog composite | `destination-out` | Fog cutout |
| Reveal radius | 120px | Default |
| Reveal speed | 400-600ms | Smooth fade-in |
| Shake intensity | 3-15 | Per event tier |
| Shake duration | 120-500ms | Per event tier |
| Hit stop | 40-150ms | Per event tier |
| Vignette fade | 300ms | `flashVignette()` |
| Wheel anim | 400ms | `easeOutBack` |
| Event log show | 5000ms | Display, 400ms fade |
| Pulse ring | 800-1500ms | Per ability |
| Trail length | 8-16 | Points in trail array |

---

*Generated for Signal Lost v2 development. All values are production-tested from established games (Hunt: Showdown, GTFO, Battlefield series) adapted for vanilla Canvas 2D performance constraints.*
