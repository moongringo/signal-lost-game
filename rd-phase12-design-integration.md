# Signal Lost v2 — Phase 12: Design Integration Plan

> **Status**: Draft v1.0  
> **Scope**: Integrate 120 design concepts from `test-pages/` into the production engine  
> **Target Files**: `game-v2.js` (18,557 lines), `styles-v2.css` (7,947 lines), `index.html` (1,082 lines)  
> **Performance Budget**: 60fps mid-range Android, radar <100 draw calls, loading <50ms frame time, chat <30 DOM nodes visible  
> **Philosophy**: *Tactical clarity, not visual noise* — from `modern-tactical-design.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Philosophy & Constraints](#2-design-philosophy--constraints)
3. [Dependency Order & Implementation Strategy](#3-dependency-order--implementation-strategy)
4. [Category 1: Radar Overhaul](#4-category-1-radar-overhaul)
5. [Category 2: Loading / Splash Overhaul](#5-category-2-loading--splash-overhaul)
6. [Category 3: Chat / Comms Overhaul](#6-category-3-chat--comms-overhaul)
7. [Category 4: Loadout Screen](#7-category-4-loadout-screen)
8. [Category 5: Scoreboards + Results](#8-category-5-scoreboards--results)
9. [Category 6: Settings Screen](#9-category-6-settings-screen)
10. [Category 7: Menu Screens](#10-category-7-menu-screens)
11. [Category 8: Minigames](#11-category-8-minigames)
12. [Category 9: Data Screens](#12-category-9-data-screens)
13. [Category 10: Era Themes + Wildcards](#13-category-10-era-themes--wildcards)
14. [File Separation Decision](#14-file-separation-decision)
15. [Testing Criteria](#15-testing-criteria)
16. [Appendix: Design Page Inventory](#16-appendix-design-page-inventory)

---

## 1. Executive Summary

This plan defines the integration of 120+ design page variants from `test-pages/` into the Signal Lost v2 production engine. The designs span 10 categories and represent 6+ months of iterative visual exploration. Rather than copying designs wholesale, we extract **proven patterns** from the best variants and integrate them as **progressive enhancements** to existing systems.

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| **No new dependencies** | Keep vanilla JS stack; no frameworks |
| **Single-file engine preserved** | `game-v2.js` stays monolithic; new code appended at end |
| **CSS modular additions** | New styles appended to `styles-v2.css` in category blocks |
| **Feature flags for all changes** | Every enhancement gated by `state.designFlags.{feature}` |
| **Mobile-first implementation** | All changes tested at 320px width first |
| **Performance budget enforced** | Radar draw calls counted; DOM node limits enforced |

### Risk Assessment

| Risk | Mitigation |
|------|------------|
| 18,557-line file becomes unmaintainable | Document exact line ranges; use feature flags; plan Phase 13 modularization |
| Performance regression on mid-tier phones | Profile every change; fallback to simpler rendering |
| Theme system breakage | Extend existing `themePalette`/`themePatternPalettes`; preserve 4 base themes |
| Chat DOM explosion | Virtual scrolling for >30 messages; message pooling |
| Radar WebGL context loss | Graceful fallback to Canvas 2D already implemented |

---

## 2. Design Philosophy & Constraints

### Core Principles (from `modern-tactical-design.md`)

1. **Information Hierarchy** — Most important data must be scannable in <200ms
2. **Dark Military Palette** — `#0d1117` base, `#ff8b1f` accent, semantic colors for ally/enemy/objective
3. **Glow with Purpose** — Every glow effect must convey status or threat level
4. **Touch-First** — Minimum 44px touch targets; no hover dependencies
5. **Device Agnostic** — Works at 320px–2560px widths

### Color System

```css
/* Existing — DO NOT CHANGE */
--bg: #0d1117;
--bg-elevated: #161b22;
--bg-card: #1a2332;
--border: #30363d;
--text: #e6edf3;
--text-dim: #8b949e;
--accent: #ff8b1f;
--accent-glow: rgba(255,139,31,0.35);
--danger: #ef4444;
--success: #4caf50;
--info: #58a6ff;

/* New additions for design integration */
--ally: #00ff88;
--enemy: #ff3344;
--objective: #4488ff;
--extraction: #ffaa00;
--terrain: #0d1a10;
--grid: #1a2a1a;
```

### Performance Budget

| System | Budget | Measurement |
|--------|--------|-------------|
| Radar render | <100 draw calls/frame | Canvas path begin/end counts |
| Loading screen | <50ms frame time | `performance.now()` delta |
| Chat visible | <30 DOM nodes | `chatLog.children.length` |
| Mission HUD | 60fps sustained | `requestAnimationFrame` loop timing |
| Memory | <150MB heap | Chrome DevTools Memory tab |

---

## 3. Dependency Order & Implementation Strategy

### Implementation Sequence

```
Phase 12.1 → Radar (foundational HUD element)
Phase 12.2 → Chat (mission-critical communication)
Phase 12.3 → Loading (first user experience)
Phase 12.4 → Loadout (pre-mission preparation)
Phase 12.5 → Results (post-mission feedback)
Phase 12.6 → Menus (navigation screens)
Phase 12.7 → Minigames (mission events)
Phase 12.8 → Data screens (intel displays)
Phase 12.9 → Themes (visual polish)
Phase 12.10 → Wildcards (experimental features)
```

### Feature Flag System

Add to `state` object (after L319 `themePalette`):

```javascript
// L319 area — add after themePalette
designFlags: {
  // Phase 12.1 Radar
  radar3DView: false,        // Isometric radar mode
  radarHealthRings: true,    // Health rings on squad dots
  radarMovementTrails: true, // Squad trail visualization
  radarTerrainContours: false, // Terrain contour overlay
  radarMinimalMode: false,   // Minimal radar (compass only)
  
  // Phase 12.2 Chat
  chatSquadTab: false,       // Squad tab in chat
  chatSystemTab: true,       // System messages tab
  chatQuickCommands12: true, // 12 quick commands (vs 6)
  chatEncryptionIndicator: true,
  chatAudioVisualizer: false, // Mic input visualizer
  
  // Phase 12.3 Loading
  loadingMilitaryBriefing: true, // 5-phase loading sequence
  loadingSquadAssembly: true,    // Squad roster during load
  loadingMapGenPreview: true,    // Procedural map preview
  
  // Phase 12.4 Loadout
  loadout3DPreview: false,   // 3D gear preview (future)
  loadoutStatComparison: true, // Side-by-side stat bars
  loadoutPresetSlots: true,  // 3 saveable presets
  
  // Phase 12.5 Results
  resultsStatsBreakdown: true, // Detailed stat cards
  resultsReplayButton: true,   // Save replay CTA
  resultsProgressionPreview: true, // Next unlock preview
  
  // Phase 12.6 Menus
  menuAnimatedBackground: true, // Animated hex/grid bg
  menuParallaxCards: false,     // Parallax hover on cards
  
  // Phase 12.7 Minigames
  minigameTriangulation: true,  // Existing: bearing scanner
  minigameLockpicking: false,   // Timing-based lockpick
  minigameDecryption: false,    // Pattern-matching hack
  minigameDronePilot: false,    // Drone obstacle course
  minigameSignalAlign: false,   // Frequency alignment
  
  // Phase 12.8 Data
  dataIntelMap: true,         // Interactive intel map
  dataThreatAnalysis: false,  // Threat pattern analysis
  dataSquadTelemetry: true,   // Squad performance charts
  
  // Phase 12.9 Themes
  themeEraUnlocks: true,      // Era themes via battle pass
  themeWildcardEffects: true, // Special visual effects
  
  // Phase 12.10 Wildcards
  wildcardRandomEvents: false, // Random mid-mission events
  wildcardMutators: false,     // Gameplay mutators
}
```

### State Integration Points

| New State Key | Location | Existing Nearby Keys |
|---------------|----------|---------------------|
| `designFlags` | After L319 | `themePalette`, `weather` |
| `radarViewMode` | After L492 | `minimapZoom`, `hudLayout` |
| `chatActiveTab` | Replace L476 | `chatTab` → rename to `chatActiveTab` |
| `quickCommands` | After L480 | `quickChat` array |
| `loadoutPresets` | After L559 | `battlePass` |
| `themeUnlocks` | After L568 | `battlePass.claimed` |

---

## 4. Category 1: Radar Overhaul

### 4.1 Current State Analysis

**Existing Radar** (`RadarModule`, L4542–4999):
- Canvas 2D with optional WebGL blip batching (`WebGLRadar`, L4357–4541)
- 2D top-down view only
- Range rings, scan line, crosshairs
- Filters: beacons, threats, squad, objectives
- Fullscreen toggle
- IntersectionObserver throttling (~30fps when offscreen)
- 2048 max blips in WebGL batch

**Draw call count** (estimated from `draw()` at L4692–4981):
- Background clear: 1
- Range rings (4): 4
- Crosshairs: 2
- Scan line: 1
- Per-element (squad, threats, beacons, etc.): ~15–30 depending on mission
- **Total: ~25–40 draw calls** (well under 100 budget)

### 4.2 Design Integration: 3 View Modes

From `modern-tactical-design.md` radar winner: *Blend of isometric 3D + AR overlay + command view*

#### 4.2.1 View Mode: 2D Top-Down (Existing — Default)

No changes. This remains the default and fallback mode.

#### 4.2.2 View Mode: Isometric 3D (New — Flagged)

**Implementation**: Add `radarViewMode` state key (`'2d' | 'isometric' | 'minimal'`).

**Rendering approach** (Canvas 2D, no WebGL needed):
```javascript
// In RadarModule.draw() — after clear, before range rings
if (state.radarViewMode === 'isometric') {
  // Apply isometric projection to all world coordinates
  // X' = (x - y) * cos(30°)
  // Y' = (x + y) * sin(30°) - z
  ctx.save();
  ctx.translate(centerX, centerY * 0.7); // Shift up for pseudo-3D
  ctx.scale(1, 0.5); // Compress Y for isometric look
  // ... draw all elements with iso projection
  ctx.restore();
}
```

**Mobile performance**: Isometric mode adds ~5 draw calls (projection setup). Total still <50.

**Toggle**: Long-press radar (500ms) or pinch gesture to cycle modes.

#### 4.2.3 View Mode: Minimal (New — Flagged)

**Rendering**: Compass rose only + nearest threat direction arrow. No blips, no scan line.

**Use case**: When player is sprinting or in high-stress combat. Auto-activates when stamina <20%.

### 4.3 Design Integration: Health Rings

**Current**: Squad dots are solid circles with color coding.

**Enhancement**: Add health ring around each squad dot.

```javascript
// In RadarModule.draw() — squad rendering section
if (state.designFlags.radarHealthRings && agent.health !== undefined) {
  const healthPct = agent.health / 100;
  ctx.beginPath();
  ctx.arc(x, y, dotRadius + 3, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * healthPct));
  ctx.strokeStyle = healthPct > 0.5 ? '#4caf50' : healthPct > 0.25 ? '#ff9800' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.stroke();
}
```

**Performance**: +1 arc per squad member (max 4). Negligible.

### 4.4 Design Integration: Movement Trails

**Current**: No trail visualization.

**Enhancement**: Store last 20 positions per agent, draw fading trail line.

```javascript
// Add to state (after L492 hudLayout)
radarTrails: new Map(), // agentId → [{x,y,time}, ...]

// In RadarModule.update() — called each frame
updateTrails() {
  state.squad.forEach(agent => {
    const trail = state.radarTrails.get(agent.id) || [];
    trail.push({ x: agent.x, y: agent.y, time: performance.now() });
    // Keep last 20 positions, remove older than 3s
    const cutoff = performance.now() - 3000;
    const filtered = trail.filter(p => p.time > cutoff).slice(-20);
    state.radarTrails.set(agent.id, filtered);
  });
}

// In RadarModule.draw() — after range rings, before blips
if (state.designFlags.radarMovementTrails) {
  state.squad.forEach(agent => {
    const trail = state.radarTrails.get(agent.id);
    if (!trail || trail.length < 2) return;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const pos = worldToRadar(p.x, p.y);
      const alpha = i / trail.length * 0.4;
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.strokeStyle = `rgba(0,255,136,${0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
```

**Performance**: +1 path per squad member. Still well under budget.

### 4.5 Design Integration: Terrain Contours

**Current**: No terrain visualization on radar.

**Enhancement**: Draw elevation contour rings from `state.terrainZones`.

**Implementation**: Sample terrain height at radar edge points, draw contour lines.

**Flag**: `radarTerrainContours` — default `false` (expensive on mobile).

### 4.6 CSS Additions for Radar

Append to `styles-v2.css` (after L3341, end of mobile radar styles):

```css
/* ===== PHASE 12: RADAR ENHANCEMENTS ===== */

/* Radar view mode indicator */
.radar-mode-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 9px;
  font-weight: 700;
  color: var(--text-dim);
  background: rgba(11,15,20,0.8);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Isometric mode transition */
#missionRadar {
  transition: transform 0.3s ease;
}
#missionRadar.radar-isometric {
  transform: scaleY(0.5) perspective(500px) rotateX(45deg);
}

/* Minimal mode: hide everything except compass */
#missionRadar.radar-minimal .radar-blips,
#missionRadar.radar-minimal .radar-scan-line {
  opacity: 0;
}

/* Health ring legend */
.radar-legend-health {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--success);
  margin-right: 4px;
}

/* Trail opacity control */
.radar-trail {
  pointer-events: none;
}

@media (max-width: 480px) {
  .radar-mode-indicator { font-size: 8px; padding: 1px 4px; }
}
```

### 4.7 HTML Additions

In `index.html`, after radar canvas (around L~850):

```html
<!-- Radar view mode indicator -->
<div id="radarModeIndicator" class="radar-mode-indicator">2D</div>
```

### 4.8 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| 2D mode unchanged | Visual comparison | Identical to pre-change |
| Isometric mode | Toggle via long-press | All blips visible, readable at 320px |
| Minimal mode | Auto-trigger at low stamina | Only compass + threat arrow visible |
| Health rings | Damage squad member | Ring color changes green→amber→red |
| Trails | Move squad member | 3s fading trail visible |
| Performance | Chrome DevTools Performance | <100 draw calls, 60fps sustained |
| WebGL fallback | Force context loss | Graceful fallback to Canvas 2D |

---

## 5. Category 2: Loading / Splash Overhaul

### 5.1 Current State Analysis

**Existing Splash** (`SplashScreen`, L15407–15528):
- Phased loading bar with 5 timed stages
- Auto-dismiss after load completes
- Tutorial routing for first-time players
- Simple CSS animations (logo in, icon pulse, ring expand, bar fill)

**Current stages**: CONNECTING → AUTHENTICATING → BRIEFING → LOADING → READY

### 5.2 Design Integration: Military Briefing Sequence

From `modern-tactical-design.md` loading winner: *Military briefing + squad assembly + map generation*

#### 5.2.1 Enhanced Phase Display

**Current**: Simple progress bar with stage label.

**Enhancement**: Each phase gets distinct visual treatment:

```javascript
// In SplashScreen — extend phase definitions (L15420 area)
const PHASES = [
  { 
    id: 'connecting', 
    label: 'CONNECTING', 
    icon: '📡', 
    duration: 800,
    animation: 'pulse' // Satellite dish pulsing
  },
  { 
    id: 'authenticating', 
    label: 'AUTHENTICATING', 
    icon: '🔐', 
    duration: 600,
    animation: 'scan' // ID card scanning effect
  },
  { 
    id: 'briefing', 
    label: 'BRIEFING', 
    icon: '📋', 
    duration: 1200,
    animation: 'typewriter' // Text typing effect
  },
  { 
    id: 'loading', 
    label: 'LOADING ASSETS', 
    icon: '⚙️', 
    duration: 2000,
    animation: 'gear' // Spinning gear
  },
  { 
    id: 'ready', 
    label: 'READY', 
    icon: '✓', 
    duration: 400,
    animation: 'flash' // Screen flash green
  }
];
```

#### 5.2.2 Squad Assembly Panel

**New**: During "BRIEFING" phase, show squad roster assembling.

```javascript
// Add to SplashScreen.render()
if (currentPhase.id === 'briefing' && state.squad) {
  const squadEl = document.getElementById('splashSquad');
  squadEl.innerHTML = state.squad.map((agent, i) => `
    <div class="splash-squad-member" style="animation-delay: ${i * 0.2}s">
      <span class="ssm-role">${agent.roleEmoji}</span>
      <span class="ssm-name">${agent.name}</span>
      <span class="ssm-status">${agent.ready ? '✓ READY' : '...'}</span>
    </div>
  `).join('');
}
```

#### 5.2.3 Map Generation Preview

**New**: During "LOADING ASSETS" phase, show procedural map preview.

```javascript
// Add to SplashScreen
renderMapPreview() {
  const canvas = document.getElementById('splashMapPreview');
  const ctx = canvas.getContext('2d');
  // Draw simplified terrain zones from state.terrainZones
  // Animate zones appearing one by one
}
```

### 5.3 CSS Additions for Loading

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: LOADING ENHANCEMENTS ===== */

/* Splash screen phase animations */
.splash-phase-icon {
  font-size: 32px;
  line-height: 1;
  display: inline-block;
}
.splash-phase-icon.anim-pulse {
  animation: splashIconPulse 1s ease-in-out infinite;
}
.splash-phase-icon.anim-scan {
  animation: splashIconScan 1.5s ease-in-out infinite;
}
.splash-phase-icon.anim-gear {
  animation: splashIconGear 1s linear infinite;
}

@keyframes splashIconPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes splashIconScan {
  0% { transform: translateX(-4px); opacity: 0.6; }
  50% { transform: translateX(4px); opacity: 1; }
  100% { transform: translateX(-4px); opacity: 0.6; }
}
@keyframes splashIconGear {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Squad assembly panel */
.splash-squad-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  max-height: 160px;
  overflow-y: auto;
}
.splash-squad-member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(11,15,20,0.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  animation: squadMemberIn 0.4s ease-out forwards;
  opacity: 0;
  transform: translateX(-20px);
}
@keyframes squadMemberIn {
  to { opacity: 1; transform: translateX(0); }
}
.ssm-role { font-size: 18px; }
.ssm-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; }
.ssm-status { font-size: 11px; color: var(--success); font-weight: 700; }

/* Map preview canvas */
.splash-map-preview {
  width: 200px;
  height: 120px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  margin-top: 12px;
  background: var(--bg-elevated);
}

/* Ready flash */
.splash-ready-flash {
  animation: splashReadyFlash 0.4s ease-out;
}
@keyframes splashReadyFlash {
  0% { background: rgba(76,175,80,0.3); }
  100% { background: transparent; }
}
```

### 5.4 HTML Additions

In `index.html`, within `#splashScreen`:

```html
<!-- Squad assembly panel (shown during briefing phase) -->
<div id="splashSquad" class="splash-squad-panel hidden"></div>

<!-- Map generation preview (shown during loading phase) -->
<canvas id="splashMapPreview" class="splash-map-preview hidden" width="200" height="120"></canvas>
```

### 5.5 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Phase timing | Stopwatch | Each phase within ±100ms of target |
| Squad panel | Create 4-player squad | All members visible with correct roles |
| Map preview | Generate procedural map | Terrain zones match final map |
| Mobile layout | 320px viewport | No overflow, all text readable |
| Reduced motion | `prefers-reduced-motion` | All animations disabled |

---

## 6. Category 3: Chat / Comms Overhaul

### 6.1 Current State Analysis

**Existing Chat** (`ChatSystem`, L13850–14027):
- 2 tabs: ALL / TEAM
- 6 quick-chat presets
- Emoji support, timestamps, mute, auto-scroll
- Team filtering
- DOM-based rendering (full rebuild on message)

**Lobby Chat** (`LobbyChat`, L2953–3057):
- Separate system with unread badges
- Bot simulation for testing

### 6.2 Design Integration: 4-Tab Chat

From `modern-tactical-design.md` chat winner: *Command center terminal + radio comms + modern bubbles*

#### 6.2.1 Tab Expansion

**Current tabs**: ALL, TEAM
**New tabs**: ALL, TEAM, SQUAD, SYSTEM

```javascript
// In state — change L476-480
// FROM:
chatTab: 'all',
// TO:
chatActiveTab: 'all', // Renamed for clarity
chatTabs: ['all', 'team', 'squad', 'system'],
chatTabBadges: { all: 0, team: 0, squad: 0, system: 0 },
```

**HTML changes** (in `index.html`):
```html
<!-- FROM -->
<div class="chat-tabs">
  <button id="chatTabAll" class="chat-tab active">🌐 All</button>
  <button id="chatTabTeam" class="chat-tab">👥 Team</button>
</div>

<!-- TO -->
<div class="chat-tabs">
  <button id="chatTabAll" class="chat-tab active" data-tab="all">
    🌐 All <span class="chat-badge" id="badgeAll"></span>
  </button>
  <button id="chatTabTeam" class="chat-tab" data-tab="team">
    👥 Team <span class="chat-badge" id="badgeTeam"></span>
  </button>
  <button id="chatTabSquad" class="chat-tab" data-tab="squad">
    🎯 Squad <span class="chat-badge" id="badgeSquad"></span>
  </button>
  <button id="chatTabSystem" class="chat-tab" data-tab="system">
    ⚙️ System <span class="chat-badge" id="badgeSystem"></span>
  </button>
</div>
```

#### 6.2.2 Quick Commands Expansion

**Current**: 6 presets (hardcoded in state L480).
**New**: 12 presets with categories.

```javascript
// In state — replace quickChat array (L480)
quickChat: [
  // Combat (4)
  { cmd: 'ENEMY SPOTTED', emoji: '👁️', cat: 'combat' },
  { cmd: 'NEED BACKUP', emoji: '🆘', cat: 'combat' },
  { cmd: 'ENEMY DOWN', emoji: '💀', cat: 'combat' },
  { cmd: 'SUPPRESSING', emoji: '🔫', cat: 'combat' },
  // Movement (4)
  { cmd: 'MOVING TO OBJ', emoji: '📍', cat: 'movement' },
  { cmd: 'COVER ME', emoji: '🛡️', cat: 'movement' },
  { cmd: 'REGROUP', emoji: '👥', cat: 'movement' },
  { cmd: 'FALL BACK', emoji: '🏃', cat: 'movement' },
  // Status (4)
  { cmd: 'AMMO LOW', emoji: '🔋', cat: 'status' },
  { cmd: 'RELOADING', emoji: '⏳', cat: 'status' },
  { cmd: "I'M HIT", emoji: '🩸', cat: 'status' },
  { cmd: 'REVIVE ME', emoji: '❤️', cat: 'status' }
],
```

**UI**: Grid layout 3×4 instead of single row.

#### 6.2.3 Encryption Indicator

**New**: Show encryption status for team/squad messages.

```javascript
// In ChatSystem.render()
const isEncrypted = tab === 'team' || tab === 'squad';
if (isEncrypted && state.designFlags.chatEncryptionIndicator) {
  headerHtml += `<span class="chat-encrypted" title="End-to-end encrypted">🔒</span>`;
}
```

#### 6.2.4 Audio Visualizer (Future / Flagged)

**Flag**: `chatAudioVisualizer: false` (requires microphone access, deferred to Phase 13).

### 6.3 DOM Optimization

**Problem**: `ChatSystem.render()` rebuilds entire DOM on every message.

**Solution**: Implement message pooling + append-only rendering.

```javascript
// In ChatSystem — replace render() with incremental update
addMessage(msg) {
  const log = document.getElementById('chatLog');
  
  // Pool check: if >30 messages, remove oldest
  while (log.children.length >= 30) {
    log.removeChild(log.firstChild);
  }
  
  // Create single message element
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = this.formatMessage(msg);
  log.appendChild(el);
  
  // Auto-scroll if at bottom
  if (state.chatAutoFollow) {
    log.scrollTop = log.scrollHeight;
  }
  
  // Update badge for non-active tabs
  if (msg.tab !== state.chatActiveTab) {
    state.chatTabBadges[msg.tab] = (state.chatTabBadges[msg.tab] || 0) + 1;
    this.updateBadges();
  }
}
```

### 6.4 CSS Additions for Chat

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: CHAT ENHANCEMENTS ===== */

/* 4-tab layout */
.chat-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.chat-tabs::-webkit-scrollbar { display: none; }

.chat-tab {
  position: relative;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tab badges */
.chat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  margin-left: 4px;
}
.chat-badge:empty { display: none; }

/* Encryption indicator */
.chat-encrypted {
  font-size: 12px;
  margin-left: auto;
  color: var(--success);
}

/* Quick commands grid */
.quick-chat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px;
}
.quick-chat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 10px;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s ease;
}
.quick-chat-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}
.quick-chat-btn .qcb-emoji {
  font-size: 16px;
  line-height: 1;
}
.quick-chat-btn .qcb-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Category headers in quick chat */
.quick-chat-category {
  grid-column: 1 / -1;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2px;
}

/* System messages styling */
.chat-msg.system {
  background: rgba(0,188,212,0.08);
  border-left: 2px solid var(--info);
}
.chat-msg.system .msg-sender {
  color: var(--info);
}

/* Squad messages styling */
.chat-msg.squad {
  background: rgba(255,217,101,0.06);
  border-left: 2px solid #ffd965;
}
.chat-msg.squad .msg-sender {
  color: #ffd965;
}

/* Mobile: 2-column quick chat */
@media (max-width: 480px) {
  .quick-chat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chat-tab {
    font-size: 11px;
    padding: 8px 6px;
  }
}
```

### 6.5 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Tab switching | Click each tab | Correct messages shown per tab |
| Badge increment | Receive message in non-active tab | Badge shows correct count |
| Badge clear | Switch to tab with badge | Badge clears, shows correct messages |
| Quick commands | Click each of 12 commands | Correct message sent |
| DOM limit | Send 50 messages | Only last 30 visible, no memory growth |
| System messages | Trigger objective event | Appears in SYSTEM tab |
| Squad messages | Send from squad member | Appears in SQUAD tab only |
| Mobile layout | 320px viewport | All 4 tabs accessible via scroll |

---

## 7. Category 4: Loadout Screen

### 7.1 Current State Analysis

**Existing Loadout** (`LoadoutScreen`, L7832–8103):
- Gear / consumable / cosmetic selection
- Role-based unlocks
- Grid layout with cards
- Selected state with blue border
- Preset buttons (3 slots)

### 7.2 Design Integration: Stat Comparison

**Current**: Cards show icon, name, description.

**Enhancement**: Side-by-side stat bars when comparing gear.

```javascript
// In LoadoutScreen — add to card rendering
renderStatBars(gear) {
  const stats = ['damage', 'range', 'rate', 'weight'];
  const maxVal = 100;
  return stats.map(stat => {
    const val = gear.stats?.[stat] || 0;
    const pct = (val / maxVal) * 100;
    return `
      <div class="stat-bar-row">
        <span class="stat-bar-label">${stat}</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="stat-bar-value">${val}</span>
      </div>
    `;
  }).join('');
}
```

### 7.3 Design Integration: Preset System

**Current**: 3 preset buttons, no save/load functionality.

**Enhancement**: Full save/load with validation.

```javascript
// Add to state (after L559 battlePass)
loadoutPresets: [
  { name: 'Assault', gear: null, consumables: [], cosmetic: null },
  { name: 'Stealth', gear: null, consumables: [], cosmetic: null },
  { name: 'Support', gear: null, consumables: [], cosmetic: null }
],

// In LoadoutScreen
savePreset(slotIndex) {
  state.loadoutPresets[slotIndex] = {
    name: state.loadoutPresets[slotIndex].name,
    gear: state.selectedGear,
    consumables: [...state.selectedConsumables],
    cosmetic: state.selectedCosmetic
  };
  this.showToast(`Preset "${state.loadoutPresets[slotIndex].name}" saved`);
}

loadPreset(slotIndex) {
  const preset = state.loadoutPresets[slotIndex];
  if (!preset.gear) {
    this.showToast('Preset is empty');
    return;
  }
  state.selectedGear = preset.gear;
  state.selectedConsumables = [...preset.consumables];
  state.selectedCosmetic = preset.cosmetic;
  this.render();
}
```

### 7.4 CSS Additions for Loadout

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: LOADOUT ENHANCEMENTS ===== */

/* Stat comparison bars */
.stat-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}
.stat-bar-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  width: 50px;
  flex-shrink: 0;
}
.stat-bar-track {
  flex: 1;
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #c75b00);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.stat-bar-value {
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  width: 24px;
  text-align: right;
}

/* Preset system */
.preset-panel {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 16px;
}
.preset-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}
.preset-slot:hover {
  border-color: var(--accent);
}
.preset-slot.active {
  border-color: var(--accent);
  background: rgba(255,139,31,0.08);
}
.preset-slot.empty {
  opacity: 0.5;
}
.preset-slot-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
.preset-slot-actions {
  display: flex;
  gap: 4px;
}
.preset-action-btn {
  font-size: 10px;
  padding: 4px 8px;
  background: var(--chip);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-dim);
  cursor: pointer;
}
.preset-action-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}

/* Loadout comparison mode */
.loadout-compare-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
}
.compare-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compare-column.current {
  border-right: 1px solid var(--border);
  padding-right: 12px;
}
.compare-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

### 7.5 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Stat bars | Select gear with stats | Bars render with correct widths |
| Preset save | Configure loadout → Save to slot | Toast confirmation, slot shows name |
| Preset load | Click saved slot | Loadout updates correctly |
| Preset overwrite | Save to occupied slot | Confirmation dialog, then overwrite |
| Mobile layout | 320px viewport | Cards stack, stat bars readable |
| Role restrictions | Select locked gear | Card shows lock, cannot select |

---

## 8. Category 5: Scoreboards + Results

### 8.1 Current State Analysis

**Existing Results** (`Results`, L14991–15195):
- Score display with grade (S/A/B/C/D)
- Team standings
- XP bar with animation
- Confetti canvas animation
- CSS-triggered entrance animations

**Match History** (`MatchHistory`, L15196–15282):
- LocalStorage-based recording
- Filtering by result type

### 8.2 Design Integration: Stats Breakdown

**Current**: Single score number + grade.

**Enhancement**: Detailed stat cards with category breakdowns.

```javascript
// In Results.render() — add after score display
renderStatBreakdown() {
  const stats = [
    { label: 'Combat', icon: '⚔️', value: state.results.combatScore, max: 1000 },
    { label: 'Objective', icon: '📍', value: state.results.objectiveScore, max: 1000 },
    { label: 'Support', icon: '🛡️', value: state.results.supportScore, max: 1000 },
    { label: 'Survival', icon: '❤️', value: state.results.survivalScore, max: 1000 }
  ];
  
  return `
    <div class="results-stats-grid">
      ${stats.map(s => `
        <div class="results-stat-card">
          <span class="rsc-icon">${s.icon}</span>
          <span class="rsc-label">${s.label}</span>
          <span class="rsc-value">${s.value}</span>
          <div class="rsc-bar">
            <div class="rsc-bar-fill" style="width: ${(s.value/s.max)*100}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

### 8.3 Design Integration: Replay Button

**New**: Save replay CTA for notable matches (grade A or higher).

```javascript
// In Results.render()
const showReplay = state.results.grade <= 'B' && state.designFlags.resultsReplayButton;
if (showReplay) {
  footerHtml += `
    <button id="saveReplayBtn" class="primary-button large">
      📹 Save Replay
    </button>
  `;
}
```

### 8.4 Design Integration: Progression Preview

**New**: Show next unlock in battle pass / role progression.

```javascript
// In Results.render() — add before footer
renderProgressionPreview() {
  const nextTier = state.battlePass.tier + 1;
  const nextReward = getBattlePassReward(nextTier);
  if (!nextReward) return '';
  
  return `
    <div class="results-progression-preview">
      <span class="rpp-label">Next Unlock</span>
      <div class="rpp-reward">
        <span class="rpp-icon">${nextReward.icon}</span>
        <span class="rpp-name">${nextReward.name}</span>
        <span class="rpp-tier">Tier ${nextTier}</span>
      </div>
      <div class="rpp-bar">
        <div class="rpp-bar-fill" style="width: ${(state.battlePass.xp % 1000)/10}%"></div>
      </div>
    </div>
  `;
}
```

### 8.5 CSS Additions for Results

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: RESULTS ENHANCEMENTS ===== */

/* Stats breakdown grid */
.results-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 16px 0;
}
.results-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s ease;
}
.results-stat-card:hover {
  border-color: var(--accent);
}
.rsc-icon { font-size: 24px; line-height: 1; }
.rsc-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rsc-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
}
.rsc-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}
.rsc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #c75b00);
  border-radius: 3px;
  transition: width 1s ease 0.5s;
}

/* Progression preview */
.results-progression-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: rgba(255,217,101,0.06);
  border: 1px solid rgba(255,217,101,0.2);
  border-radius: var(--radius);
  margin: 12px 0;
}
.rpp-label {
  font-size: 10px;
  font-weight: 700;
  color: #ffd965;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.rpp-reward {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rpp-icon { font-size: 24px; }
.rpp-name { font-size: 14px; font-weight: 600; color: var(--text); }
.rpp-tier { font-size: 11px; color: var(--text-dim); }
.rpp-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-card);
  border-radius: 2px;
  overflow: hidden;
}
.rpp-bar-fill {
  height: 100%;
  background: #ffd965;
  border-radius: 2px;
}

/* Replay button */
#saveReplayBtn {
  background: linear-gradient(135deg, #58a6ff, #3b82f6);
  border-color: #58a6ff;
}
#saveReplayBtn:hover {
  box-shadow: 0 0 16px rgba(88,166,255,0.3);
}

/* Mobile */
@media (max-width: 480px) {
  .results-stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .results-stat-card {
    padding: 10px;
    flex-direction: row;
    justify-content: space-between;
  }
  .rsc-icon { font-size: 20px; }
  .rsc-value { font-size: 18px; }
}
```

### 8.6 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Stat cards | Complete match | 4 cards with correct values |
| Bar animations | Watch results screen | Bars animate from 0 to value |
| Progression preview | Check battle pass tier | Shows correct next reward |
| Replay button | Get grade A | Button appears, saves replay |
| Mobile layout | 320px viewport | Stats stack vertically |
| Confetti | Win match | Confetti renders, no performance drop |

---

## 9. Category 6: Settings Screen

### 9.1 Current State Analysis

**Existing Settings** (`SettingsMenu`, L17245–17461 + `SettingsModule`, L17461–17698):
- Modal with tabs: Audio, Graphics, Performance, Controls
- Key rebind system with live listening
- Graphics quality presets
- HUD customizer (Phase 6 Task 7)

### 9.2 Design Integration: Design Flags Panel

**New**: Add "Interface" tab with all Phase 12 feature flags.

```javascript
// In SettingsMenu.renderTabs() — add after Controls
{ id: 'interface', label: 'Interface', icon: '🎨' }

// In SettingsMenu.renderPanel()
renderInterfacePanel() {
  const flags = state.designFlags;
  return `
    <div class="settings-section">
      <h3>Radar Display</h3>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.radarHealthRings ? 'checked' : ''} 
               onchange="SettingsModule.toggleFlag('radarHealthRings')">
        <span>Health rings on squad</span>
      </label>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.radarMovementTrails ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('radarMovementTrails')">
        <span>Movement trails</span>
      </label>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.radarTerrainContours ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('radarTerrainContours')">
        <span>Terrain contours (performance impact)</span>
      </label>
    </div>
    
    <div class="settings-section">
      <h3>Chat</h3>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.chatEncryptionIndicator ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('chatEncryptionIndicator')">
        <span>Encryption indicator</span>
      </label>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.chatQuickCommands12 ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('chatQuickCommands12')">
        <span>Extended quick commands (12)</span>
      </label>
    </div>
    
    <div class="settings-section">
      <h3>Visual Effects</h3>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.loadingMilitaryBriefing ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('loadingMilitaryBriefing')">
        <span>Military briefing loading</span>
      </label>
      <label class="setting-toggle">
        <input type="checkbox" ${flags.resultsStatsBreakdown ? 'checked' : ''}
               onchange="SettingsModule.toggleFlag('resultsStatsBreakdown')">
        <span>Detailed results breakdown</span>
      </label>
    </div>
  `;
}
```

### 9.3 CSS Additions for Settings

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: SETTINGS ENHANCEMENTS ===== */

/* Toggle switches */
.setting-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.setting-toggle:last-child {
  border-bottom: none;
}
.setting-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  flex-shrink: 0;
}
.setting-toggle span {
  font-size: 13px;
  color: var(--text);
}

/* Settings section */
.settings-section {
  margin-bottom: 16px;
}
.settings-section h3 {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px;
}

/* Performance warning */
.setting-warning {
  font-size: 11px;
  color: #ffd965;
  margin-left: auto;
  font-style: italic;
}
```

### 9.4 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Interface tab | Open settings | Tab visible, clickable |
| Toggle flag | Check/uncheck | State updates, effect applies immediately |
| Persistence | Reload page | Flags restored from localStorage |
| Mobile layout | 320px viewport | All toggles accessible |

---

## 10. Category 7: Menu Screens

### 10.1 Current State Analysis

**Existing Menus**:
- Lobby, Setup, Roles, Briefing screens
- Screen routing via `setScreen()` (L7184–7294)
- Body `[data-screen]` attribute for CSS targeting

### 10.2 Design Integration: Animated Backgrounds

**New**: Subtle animated background for menu screens.

```css
/* Append to styles-v2.css */

/* ===== PHASE 12: MENU ENHANCEMENTS ===== */

/* Animated grid background */
.menu-bg-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: 
    linear-gradient(rgba(255,139,31,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,139,31,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: menuGridMove 20s linear infinite;
}
@keyframes menuGridMove {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

/* Floating hex particles */
.menu-bg-hex {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.menu-hex-particle {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(255,139,31,0.08);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: hexFloat 15s ease-in-out infinite;
}
@keyframes hexFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .menu-bg-grid,
  .menu-hex-particle {
    animation: none;
  }
}
```

### 10.3 HTML Additions

Add to each menu screen container in `index.html`:

```html
<!-- Animated background (menus only) -->
<div class="menu-bg-grid"></div>
<div class="menu-bg-hex" id="menuHexContainer"></div>
```

### 10.4 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Grid animation | Open lobby | Subtle grid movement visible |
| Hex particles | Count particles | 8–12 particles, no overlap with UI |
| Reduced motion | Enable OS setting | All animations stop |
| Performance | Chrome DevTools | <1ms paint time for background |

---

## 11. Category 8: Minigames

### 11.1 Current State Analysis

**Existing Minigame** (`TriangulationMinigame`, L1353–1552):
- Bearing scanner for objective location
- Scan button with progress
- Bearing compass display
- Already integrated as mission event

### 11.2 Design Integration: Minigame Framework

**Goal**: Make minigames pluggable mission events.

```javascript
// Add to state (after designFlags)
activeMinigame: null, // { type, data, startTime, duration }
minigameResults: [],

// Minigame registry
const MINIGAMES = {
  triangulation: {
    name: 'Signal Triangulation',
    duration: 30000,
    init: TriangulationMinigame.init,
    update: TriangulationMinigame.update,
    render: TriangulationMinigame.render,
    cleanup: TriangulationMinigame.cleanup
  },
  lockpicking: {
    name: 'Electronic Lockpick',
    duration: 20000,
    init: LockpickingMinigame.init,
    // ... etc
  },
  decryption: {
    name: 'Data Decryption',
    duration: 25000,
    // ...
  },
  dronePilot: {
    name: 'Drone Navigation',
    duration: 45000,
    // ...
  },
  signalAlign: {
    name: 'Frequency Alignment',
    duration: 20000,
    // ...
  }
};

// Mission system integration
startMinigame(type, data) {
  const game = MINIGAMES[type];
  if (!game) return;
  
  state.activeMinigame = {
    type,
    data,
    startTime: performance.now(),
    duration: game.duration
  };
  
  game.init(data);
  this.showMinigameOverlay(type);
}

updateMinigame(dt) {
  const game = state.activeMinigame;
  if (!game) return;
  
  const elapsed = performance.now() - game.startTime;
  if (elapsed > game.duration) {
    this.failMinigame('TIMEOUT');
    return;
  }
  
  const def = MINIGAMES[game.type];
  def.update(dt, elapsed);
}
```

### 11.3 New Minigame: Lockpicking

```javascript
// New module (append to game-v2.js)
const LockpickingMinigame = {
  init(data) {
    this.targetZone = Math.random() * 0.6 + 0.2; // 20%–80%
    this.currentPos = 0;
    this.speed = 0.3; // % per second
    this.direction = 1;
    this.attempts = 3;
    this.state = 'active'; // active, success, fail
  },
  
  update(dt, elapsed) {
    this.currentPos += this.speed * this.direction * (dt / 1000);
    if (this.currentPos >= 1 || this.currentPos <= 0) {
      this.direction *= -1;
    }
  },
  
  attempt() {
    const inZone = Math.abs(this.currentPos - this.targetZone) < 0.08;
    if (inZone) {
      this.state = 'success';
      return true;
    }
    this.attempts--;
    if (this.attempts <= 0) {
      this.state = 'fail';
    }
    return false;
  },
  
  render(ctx) {
    // Draw lockpick UI: moving cursor, target zone, attempts left
  }
};
```

### 11.4 CSS Additions for Minigames

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: MINIGAME ENHANCEMENTS ===== */

/* Minigame overlay */
.minigame-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(11,15,20,0.92);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  animation: minigameIn 0.3s ease-out;
}
@keyframes minigameIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Lockpicking minigame */
.lockpick-container {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lockpick-track {
  height: 40px;
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}
.lockpick-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(76,175,80,0.2);
  border-left: 2px solid var(--success);
  border-right: 2px solid var(--success);
}
.lockpick-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}
.lockpick-attempts {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.lockpick-attempt {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--success);
}
.lockpick-attempt.used {
  background: var(--danger);
}

/* Minigame timer */
.minigame-timer {
  font-size: 24px;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.minigame-timer.warning {
  color: var(--danger);
  animation: timerPulse 0.5s ease-in-out infinite;
}
@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 11.5 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Triangulation | Trigger objective scan | Existing functionality preserved |
| Lockpicking | Trigger locked door | Minigame starts, cursor moves |
| Lockpick success | Hit target zone | Door unlocks, success feedback |
| Lockpick fail | Miss 3 times | Door stays locked, fail feedback |
| Timeout | Wait 20s | Auto-fail, mission continues |
| Mobile | 320px viewport | Minigame UI fits, touch targets 44px+ |

---

## 12. Category 9: Data Screens

### 12.1 Current State Analysis

**Existing Data Displays**:
- Leaderboard (`Leaderboard`, L~7036–7170)
- Match history (`MatchHistory`, L15196–15282)
- Stats grid in results
- Clan dashboard

### 12.2 Design Integration: Intel Map

**New**: Interactive map showing mission intel (threat locations, objective history).

```javascript
// New module (append to game-v2.js)
const IntelMap = {
  init() {
    this.map = L.map('intelMap').setView([0, 0], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
    this.markers = [];
  },
  
  loadMissionData(missionId) {
    const data = state.matchHistory.find(m => m.id === missionId);
    if (!data) return;
    
    // Add threat markers
    data.threats.forEach(t => {
      this.addThreatMarker(t);
    });
    
    // Add objective path
    this.addObjectivePath(data.objectives);
    
    // Add player trail
    this.addPlayerTrail(data.playerPath);
  }
};
```

### 12.3 Design Integration: Threat Analysis

**New**: Post-mission threat pattern analysis.

```javascript
// In Results or new Data screen
renderThreatAnalysis() {
  const threats = state.mission.threats;
  const zones = {};
  
  threats.forEach(t => {
    const zone = this.getZone(t.x, t.y);
    zones[zone] = (zones[zone] || 0) + 1;
  });
  
  return `
    <div class="threat-analysis">
      <h3>Threat Distribution</h3>
      ${Object.entries(zones).map(([zone, count]) => `
        <div class="threat-zone-bar">
          <span class="tzb-label">${zone}</span>
          <div class="tzb-track">
            <div class="tzb-fill" style="width: ${(count/threats.length)*100}%"></div>
          </div>
          <span class="tzb-count">${count}</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

### 12.4 CSS Additions for Data Screens

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: DATA SCREEN ENHANCEMENTS ===== */

/* Intel map */
#intelMap {
  width: 100%;
  height: 400px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

/* Threat analysis */
.threat-analysis {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
}
.threat-zone-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tzb-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  width: 80px;
  flex-shrink: 0;
}
.tzb-track {
  flex: 1;
  height: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.tzb-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--danger), #ff6b6b);
  border-radius: var(--radius-sm);
  transition: width 0.6s ease;
}
.tzb-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  width: 30px;
  text-align: right;
}

/* Squad telemetry */
.telemetry-chart {
  width: 100%;
  height: 200px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}
.telemetry-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
}
.telemetry-area {
  fill: rgba(255,139,31,0.1);
}
```

### 12.5 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Intel map | Open after mission | Map loads with correct markers |
| Threat analysis | Complete mission with threats | Bars show correct distribution |
| Squad telemetry | View match history | Charts render with correct data |
| Mobile | 320px viewport | Scrollable, readable |

---

## 13. Category 10: Era Themes + Wildcards

### 13.1 Current State Analysis

**Existing Themes** (`themePalette`, L319 + CSS overrides):
- 4 themes: `classic`, `sunset`, `signal`, `night`
- CSS variable overrides via `body[data-theme]`
- `themePatternPalettes` for pattern colors

### 13.2 Design Integration: Era Theme Expansion

**Goal**: Extend to 15 unlockable themes via battle pass.

```javascript
// In state — expand themePalette options
// L319 area
themePalette: 'classic',
themeUnlocks: {
  classic: true,
  sunset: true,
  signal: true,
  night: true,
  // New era themes (unlockable)
  coldwar: false,
  cyberpunk: false,
  steampunk: false,
  ww2: false,
  modern: false,
  scifi: false,
  apocalyptic: false,
  neon: false,
  woodland: false,
  desert: false,
  arctic: false,
  urban: false
},

// Theme definitions
const THEMES = {
  coldwar: {
    '--bg': '#1a1a2e',
    '--bg-elevated': '#16213e',
    '--accent': '#e94560',
    '--accent-glow': 'rgba(233,69,96,0.35)',
    '--text': '#eee',
    '--grid': '#0f3460'
  },
  cyberpunk: {
    '--bg': '#0a0a0f',
    '--bg-elevated': '#1a0b2e',
    '--accent': '#00ff9f',
    '--accent-glow': 'rgba(0,255,159,0.4)',
    '--text': '#e0e0e0',
    '--grid': '#2d1b4e'
  },
  // ... etc for all 15 themes
};
```

### 13.3 Design Integration: Wildcard Effects

**New**: Special visual effects that can be applied on top of any theme.

```javascript
// In state
themeWildcard: null, // 'matrix', 'rain', 'snow', 'glitch', 'scanlines'

// Wildcard effect rendering
const WILDCARDS = {
  matrix: {
    render(ctx) {
      // Green character rain overlay
    }
  },
  rain: {
    render(ctx) {
      // Rain particle overlay on all screens
    }
  },
  snow: {
    render(ctx) {
      // Snow particle overlay
    }
  },
  glitch: {
    render(ctx) {
      // Random horizontal glitch lines
    }
  },
  scanlines: {
    render(ctx) {
      // CRT scanline overlay
    }
  }
};
```

### 13.4 CSS Additions for Themes

Append to `styles-v2.css`:

```css
/* ===== PHASE 12: THEME EXPANSIONS ===== */

/* Era themes */
body[data-theme="coldwar"] {
  --bg: #1a1a2e;
  --bg-elevated: #16213e;
  --bg-card: #1a1a3e;
  --accent: #e94560;
  --accent-glow: rgba(233,69,96,0.35);
  --grid: #0f3460;
}
body[data-theme="cyberpunk"] {
  --bg: #0a0a0f;
  --bg-elevated: #1a0b2e;
  --bg-card: #1a1a3e;
  --accent: #00ff9f;
  --accent-glow: rgba(0,255,159,0.4);
  --grid: #2d1b4e;
}
/* ... etc for all themes */

/* Wildcard effects */
.wildcard-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
}
.wildcard-matrix {
  background: linear-gradient(180deg, rgba(0,255,0,0.02) 0%, transparent 100%);
}
.wildcard-scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.1) 2px,
    rgba(0,0,0,0.1) 4px
  );
}

/* Theme unlock notification */
.theme-unlock-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: var(--bg-card);
  border: 2px solid var(--accent);
  border-radius: var(--radius);
  padding: 16px 20px;
  box-shadow: 0 0 30px var(--accent-glow);
  animation: themeUnlockIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes themeUnlockIn {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### 13.5 Battle Pass Integration

```javascript
// In BattlePass.claimReward()
claimReward(tier) {
  const reward = getTierReward(tier);
  if (reward.type === 'theme') {
    state.themeUnlocks[reward.themeId] = true;
    showThemeUnlockToast(reward.themeId);
  }
  // ... existing reward handling
}
```

### 13.6 Testing Criteria

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Theme switching | Select each theme | All UI elements update color |
| Theme unlock | Claim battle pass reward | Toast shows, theme available |
| Theme persistence | Reload page | Selected theme restored |
| Wildcard matrix | Enable matrix wildcard | Green rain visible on all screens |
| Wildcard scanlines | Enable scanlines | CRT effect visible |
| Performance | Enable all effects | Still 60fps on mid-tier phone |
| Mobile | 320px viewport | Theme colors readable |

---

## 14. File Separation Decision

### 14.1 Current Architecture

| File | Lines | Role |
|------|-------|------|
| `game-v2.js` | 18,557 | Single-file engine |
| `styles-v2.css` | 7,947 | All styles |
| `index.html` | 1,082 | Single-page shell |

### 14.2 Decision: Keep Monolithic for Phase 12

**Rationale**:
- Phase 12 is about **integration**, not refactoring
- Feature flags allow safe incremental rollout
- Single file reduces HTTP requests (critical for mobile)
- Existing module pattern within file works well

### 14.3 Code Organization Within game-v2.js

Append all new code at end of file (after L18557 `MapEditor`):

```javascript
// ========================== PHASE 12: DESIGN INTEGRATION ==========================
// Appended at end of game-v2.js
// Each category in its own section with clear comments

// 12.1 Radar Enhancements
// 12.2 Loading Enhancements
// 12.3 Chat Enhancements
// 12.4 Loadout Enhancements
// 12.5 Results Enhancements
// 12.6 Menu Enhancements
// 12.7 Minigame Framework
// 12.8 Data Screen Enhancements
// 12.9 Theme System Expansion
// 12.10 Wildcard Effects
// 12.11 Feature Flag Utilities
```

### 14.4 CSS Organization Within styles-v2.css

Append all new styles at end of file (after L7947):

```css
/* ========================== PHASE 12: DESIGN INTEGRATION ========================== */
/* Appended at end of styles-v2.css */

/* 12.1 Radar Enhancements */
/* 12.2 Loading Enhancements */
/* 12.3 Chat Enhancements */
/* 12.4 Loadout Enhancements */
/* 12.5 Results Enhancements */
/* 12.6 Menu Enhancements */
/* 12.7 Minigame Enhancements */
/* 12.8 Data Screen Enhancements */
/* 12.9 Theme Expansions */
/* 12.10 Wildcard Effects */
```

### 14.5 Future Modularization (Phase 13)

After Phase 12 stabilizes, consider splitting:

```
src/
  engine/
    core.js          # State, routing, init
    radar.js         # RadarModule + WebGLRadar
    map.js           # MapModule
    chat.js          # ChatSystem + LobbyChat
    mission.js       # Mission loop, objectives
    ui.js            # All screen renderers
    minigames.js     # Minigame framework + definitions
    themes.js        # Theme system + wildcards
  styles/
    core.css
    radar.css
    chat.css
    screens.css
    themes.css
```

---

## 15. Testing Criteria

### 15.1 Automated Tests

```javascript
// Add to test suite (new file: tests/phase12.test.js)
describe('Phase 12 Design Integration', () => {
  describe('Feature Flags', () => {
    test('all flags default to safe values', () => {
      expect(state.designFlags.radar3DView).toBe(false);
      expect(state.designFlags.radarHealthRings).toBe(true);
    });
    test('toggleFlag updates state', () => {
      SettingsModule.toggleFlag('radarHealthRings');
      expect(state.designFlags.radarHealthRings).toBe(false);
    });
  });
  
  describe('Radar', () => {
    test('2D mode renders without errors', () => {
      state.radarViewMode = '2d';
      expect(() => RadarModule.draw()).not.toThrow();
    });
    test('health rings render when enabled', () => {
      state.designFlags.radarHealthRings = true;
      const drawCalls = countDrawCalls(() => RadarModule.draw());
      expect(drawCalls).toBeGreaterThan(baselineDrawCalls);
    });
  });
  
  describe('Chat', () => {
    test('4 tabs render correctly', () => {
      ChatSystem.render();
      expect(document.querySelectorAll('.chat-tab').length).toBe(4);
    });
    test('DOM limit enforced at 30 messages', () => {
      for (let i = 0; i < 50; i++) ChatSystem.addMessage({ text: 'test' });
      expect(document.getElementById('chatLog').children.length).toBe(30);
    });
  });
  
  describe('Performance', () => {
    test('radar draw calls under 100', () => {
      const calls = countDrawCalls(() => RadarModule.draw());
      expect(calls).toBeLessThan(100);
    });
    test('loading frame time under 50ms', () => {
      const t0 = performance.now();
      SplashScreen.render();
      const dt = performance.now() - t0;
      expect(dt).toBeLessThan(50);
    });
  });
});
```

### 15.2 Manual Testing Checklist

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1 | Fresh load | Clear cache, load app | Splash → lobby, no errors |
| 2 | Full match | Create match, play through | All screens render correctly |
| 3 | Mobile radar | 320px width, mission screen | Radar visible, readable |
| 4 | Chat stress | Send 100 messages rapidly | No lag, DOM stays at 30 |
| 5 | Theme cycle | Switch through all 15 themes | No visual glitches |
| 6 | Battery test | 30min continuous play | No excessive battery drain |
| 7 | Offline | Disconnect during mission | Graceful degradation |
| 8 | Reduced motion | Enable OS setting | All animations disabled |

### 15.3 Performance Benchmarks

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| First paint | 1.2s | <1.5s | Lighthouse |
| Time to interactive | 2.5s | <3s | Lighthouse |
| Radar fps | 60 | 60 | Chrome DevTools |
| Mission fps | 55 | 55+ | Chrome DevTools |
| Memory heap | 80MB | <150MB | Chrome DevTools |
| JS bundle size | 580KB | <700KB | `ls -la game-v2.js` |
| CSS size | 180KB | <220KB | `ls -la styles-v2.css` |

---

## 16. Appendix: Design Page Inventory

### 16.1 Complete File List

```
test-pages/
  modern-tactical-design.md      # Design philosophy document
  modern-radar.html              # Production-ready radar reference
  modern-loading.html            # Production-ready loading reference
  modern-chat.html               # Production-ready chat reference
  
  # Radar variants (15)
  radar-v1.html through radar-v15.html
  radar-threejs-v1-saved.html
  radar-threejs-v2-refined.html
  
  # Loading variants (15)
  loading-v1.html through loading-v15.html
  
  # Chat variants (15)
  chat-v1.html through chat-v15.html
  
  # Loadout variants (5)
  loadout-v1.html through loadout-v5.html
  
  # Scoreboard variants (5)
  scoreboard-v1.html through scoreboard-v5.html
  
  # Settings variants (3)
  settings-v1.html through settings-v3.html
  
  # Menu variants (5)
  menu-v1.html through menu-v5.html
  
  # Minigame variants (5)
  minigame-v1.html through minigame-v5.html
  
  # Data screen variants (5)
  data-v1.html through data-v5.html
  
  # Era theme variants (5)
  era-v1.html through era-v5.html
  
  # Wildcard variants (10)
  wildcard-v1.html through wildcard-v10.html
  
  # Map layer variants (10)
  maplayer-v1.html through maplayer-v10.html
  
  # Marker variants (10)
  marker-v1.html through marker-v10.html
  
  # Weather radar variants (5)
  weather-radar-v1.html through weather-radar-v5.html
  
  # Map variants (2)
  map-v1.html, map-v2.html
  
  # Three.js tests
  test-threejs-chat.html
  test-threejs-loading.html
```

### 16.2 Reference Documents

| Document | Purpose | Key Takeaways |
|----------|---------|---------------|
| `modern-tactical-design.md` | Design philosophy | 3 winners: radar/loading/chat |
| `hud-layout-guide.md` | HUD positioning | Safe zones, touch targets |
| `game-mobile-optimization.md` | Performance | 60fps targets, draw call budgets |
| `MOBILE_POLISH.md` | Mobile UX | Bottom sheet, floating buttons |
| `RADAR_MOBILE_PLAN.md` | Radar specifics | Size breakpoints, opacity rules |

### 16.3 Design-to-Code Mapping

| Design Concept | Source File | Integration Target | Status |
|---------------|-------------|-------------------|--------|
| Isometric radar | `modern-radar.html` | `RadarModule` | Planned |
| Health rings | `radar-v8.html` | `RadarModule.draw()` | Planned |
| Movement trails | `radar-v12.html` | `RadarModule` | Planned |
| Military briefing loading | `modern-loading.html` | `SplashScreen` | Planned |
| Squad assembly | `loading-v5.html` | `SplashScreen` | Planned |
| 4-tab chat | `modern-chat.html` | `ChatSystem` | Planned |
| 12 quick commands | `chat-v8.html` | `ChatSystem` | Planned |
| Stat comparison | `loadout-v3.html` | `LoadoutScreen` | Planned |
| Preset system | `loadout-v4.html` | `LoadoutScreen` | Planned |
| Results breakdown | `scoreboard-v3.html` | `Results` | Planned |
| Progression preview | `scoreboard-v5.html` | `Results` | Planned |
| Interface settings | `settings-v2.html` | `SettingsMenu` | Planned |
| Animated menu bg | `menu-v3.html` | Menu screens | Planned |
| Minigame framework | `minigame-v2.html` | New module | Planned |
| Lockpicking | `minigame-v4.html` | `MINIGAMES` | Planned |
| Intel map | `data-v2.html` | `IntelMap` | Planned |
| Threat analysis | `data-v4.html` | `Results` | Planned |
| Era themes | `era-v3.html` | `themePalette` | Planned |
| Wildcard effects | `wildcard-v5.html` | `WILDCARDS` | Planned |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-18 | Kimi Code CLI | Initial comprehensive plan |

---

## Next Steps

1. **Review & Approve**: Stakeholder review of this plan
2. **Phase 12.1 Kickoff**: Begin Radar Overhaul implementation
3. **Profiling Baseline**: Record current performance metrics
4. **Feature Flag Scaffold**: Add `designFlags` to state object
5. **Incremental Delivery**: One category per week, with testing

> **Note**: This plan is a living document. As implementation progresses, update line ranges, add discovered dependencies, and adjust priorities based on testing feedback.
