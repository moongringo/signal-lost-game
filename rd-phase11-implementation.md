# Phase 11 — Three.js Enhancement Layer Implementation Plan

> **Signal Lost v2** — Augments the 2D canvas game with optional Three.js overlays  
> **Status:** Design Complete → Implementation Ready  
> **Constraint:** 2D game stays primary. Three.js is additive only.

---

## 1. Design Decisions (from test-pages review)

### 1.1 What the Test Pages Prove

| Test Page | Key Technique | Reusability for v2 |
|-----------|--------------|-------------------|
| `test-threejs-radar.html` | Isometric camera, procedural buildings, player markers as `Group` (sphere + ring + sprite label), `OrbitControls`, edge glow via `EdgesGeometry` | **High** — directly becomes 3D Radar overlay |
| `test-threejs-loading.html` | Particle system (`Points` + `BufferGeometry`), animated signal rings (`RingGeometry` with scale/opacity pulse), camera drift, additive blending | **Medium** — becomes loading screen + ambient menu background |
| `test-threejs-chat.html` | Pure CSS/HTML tactical chat UI (no Three.js) | **N/A** — already implemented in `game-v2.js` as `ChatSystem` |

### 1.2 Integration Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│  index.html  (no Three.js in <head>)                        │
│  ├── game-v2.js  (18K lines, 2D canvas core)                │
│  │   ├── RadarModule.draw()        ← 2D radar (primary)     │
│   │   ├── WebGLRadar.renderBlips() ← WebGL point blips     │
│   │   └── ParticleSystem._loop()   ← 2D particles          │
│   │                                                         │
│   └── ThreeEnhancement (lazy-loaded module)                │
│       ├── 3D Radar overlay      ← replaces 2D radar view   │
│       ├── Elevation Map         ← full-screen toggle       │
│       ├── Spectator Mode        ← free-fly camera          │
│       └── AR-style overlays     ← 3D markers on 2D map    │
│                                                             │
│   Three.js loaded via dynamic import() from CDN            │
│   Only fetched when user toggles 3D mode                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. `three-enhancement-layer.js` Module Structure

### 2.1 File Location & Loading Strategy

```
project-root/
├── index.html              (adds importmap in <head>)
├── game-v2.js              (minimal hooks, ~20 lines)
├── three-enhancement-layer.js   (standalone module, ~600 lines)
└── test-pages/
    ├── test-threejs-radar.html
    ├── test-threejs-loading.html
    └── test-threejs-chat.html
```

### 2.2 CDN Import Strategy via Import Map

**In `index.html` `<head>` (after existing `<script>` tags, before `game-v2.js`):**

```html
<!-- Three.js enhancement layer — loaded on-demand only -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```

**Why importmap + dynamic import:**
- Three.js is **not bundled** — keeps `game-v2.js` single-file, no build step
- Browser caches the CDN module; subsequent loads are instant
- `import()` is called only when user first toggles 3D mode
- If CDN fails, Three.js layer gracefully disables itself

### 2.3 Module Architecture

```javascript
// three-enhancement-layer.js
// Self-contained, imports Three.js via importmap

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ThreeEnhancement = {
  // ── Configuration ──
  ENABLED: false,           // master switch
  MODE: 'off',              // 'off' | 'radar' | 'elevation' | 'spectator' | 'overlay'
  TARGET_FPS: 30,           // 3D runs at 30fps, 2D at 60fps
  MAX_TRIANGLES: 5000,      // mobile GPU budget
  PIXEL_RATIO_CAP: 2,       // don't over-render on high-DPI

  // ── Three.js Core ──
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  clock: new THREE.Clock(),

  // ── Layer State ──
  container: null,          // DOM element for 3D canvas
  animationId: null,
  lastFrameTime: 0,
  frameInterval: 1000 / 30, // throttle to 30fps

  // ── Scene Objects (pooled/reused) ──
  _markerPool: [],          // recycled player marker meshes
  _buildingMeshes: [],      // static map geometry
  _terrainMesh: null,       // elevation plane
  _objectiveMarkers: [],    // pulsing objective indicators

  // ── Game State Mirror ──
  _gameState: {
    players: [],      // { id, x, z, team, role, name }
    objectives: [],   // { id, x, z, type, found }
    threats: [],      // { id, x, z, alert, mode }
    buildings: [],    // { x, z, w, d, h }
    extraction: null, // { x, z }
    mapBounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 }
  },

  // ── Lifecycle ──
  async init(containerId) { /* lazy-load Three.js, setup renderer */ },
  destroy() { /* dispose all geometry, stop loop */ },
  setMode(mode) { /* switch between radar/elevation/spectator/overlay */ },

  // ── Render Loop ──
  startLoop() { /* RAF at 30fps */ },
  stopLoop() { /* cancel RAF */ },
  _renderLoop(time) { /* throttled render */ },

  // ── State Sync (called from game-v2.js) ──
  sync(state) { /* mirror relevant game state */ },
  syncPlayers(players) { /* update marker positions */ },
  syncObjectives(objectives) { /* update objective markers */ },

  // ── Layer Implementations ──
  _initRadarScene() { /* isometric camera, grid, buildings, markers */ },
  _initElevationScene() { /* terrain mesh, height coloring, orbit controls */ },
  _initSpectatorScene() { /* free-fly camera, trails, markers */ },
  _initOverlayScene() { /* transparent renderer, sprite markers */ },

  // ── Object Builders ──
  _createPlayerMarker(type, label) { /* sphere + ring + sprite */ },
  _createBuildingMesh(x, z, w, d, h) { /* BoxGeometry + edge glow */ },
  _createTerrainMesh(heightmap) { /* PlaneGeometry + vertex colors */ },
  _createObjectiveMarker(type) { /* pulsing sphere */ },

  // ── Performance ──
  _checkGPU() { /* detect low-end, auto-disable */ },
  _disposeScene() { /* cleanup geometry/materials */ },
  _setPixelRatio() { /* respect PIXEL_RATIO_CAP */ },

  // ── Utilities ──
  _hexToThree(color) { /* '#00ff88' → 0x00ff88 */ },
  _worldToMap(x, z) { /* game coords → Three.js coords */ },
};

export default ThreeEnhancement;
```

### 2.4 Internal Module Breakdown (~600 lines total)

| Section | Lines | Description |
|---------|-------|-------------|
| Imports + Config | 20 | Import map resolution, constants |
| Core Three.js Setup | 80 | Renderer, scene, camera, resize handler |
| Lifecycle (init/destroy/mode) | 60 | Lazy loading, cleanup, mode switching |
| Render Loop | 50 | 30fps throttling, visibility culling |
| State Sync API | 60 | `sync()`, `syncPlayers()`, `syncObjectives()` |
| 3D Radar Layer | 120 | Isometric view, markers, buildings, grid |
| Elevation Map Layer | 80 | Terrain generation, height colors, orbit |
| Spectator Mode | 80 | Free camera, trails, replay support |
| AR Overlay Layer | 40 | Transparent canvas, sprite markers |
| Performance & Disposal | 40 | GPU detection, memory cleanup |
| Utilities | 30 | Color conversion, coordinate mapping |

---

## 3. Integration Hooks into `game-v2.js`

### 3.1 Minimal Hook Points (~20 lines added to game-v2.js)

**Hook 1: Lazy module import (after `state` definition, ~line 636)**

```javascript
/* ========================== THREE.JS ENHANCEMENT (Phase 11) ========================== */

// Lazy-loaded Three.js enhancement layer — only fetched if user enables 3D mode
let ThreeEnhancement = null;

async function loadThreeEnhancement() {
  if (ThreeEnhancement) return ThreeEnhancement;
  try {
    const mod = await import('./three-enhancement-layer.js');
    ThreeEnhancement = mod.default;
    return ThreeEnhancement;
  } catch (e) {
    console.warn('[Three.js] Failed to load enhancement layer:', e);
    return null;
  }
}
```

**Hook 2: State sync in RadarModule.draw() (~line 4692)**

```javascript
// Inside RadarModule.draw() — after computing player/objective positions:
// Sync to Three.js layer if active
if (ThreeEnhancement && ThreeEnhancement.ENABLED) {
  ThreeEnhancement.sync({
    players: state.agents.map(a => ({ id: a.id, x: a.x, z: a.y, team: a.team, role: a.role })),
    objectives: state.objectives.map(o => ({ id: o.id, x: o.x, z: o.y, found: o.found })),
    threats: state.threats.map(t => ({ id: t.id, x: t.x, z: t.y, alert: t.alert, mode: t.mode })),
    playerPos: state.playerPos,
    mapBounds: state.mapBounds
  });
}
```

**Hook 3: Toggle wiring in HUD event setup (~line 9295)**

```javascript
// Add to existing radar toggle area in initMissionEvents():
// 3D Radar toggle (new button in HUD overflow or radar panel)
const toggle3DBtn = document.getElementById('toggle3DRadar');
if (toggle3DBtn) {
  toggle3DBtn.addEventListener('click', async () => {
    const three = await loadThreeEnhancement();
    if (!three) { showToast('3D mode unavailable'); return; }
    if (three.MODE === 'radar') {
      three.setMode('off');
      toggle3DBtn.textContent = '3D Radar';
    } else {
      await three.init('threeRadarContainer');
      three.setMode('radar');
      toggle3DBtn.textContent = '2D Radar';
    }
  });
}
```

**Hook 4: Cleanup on mission end (~line 7206)**

```javascript
// In showScreen() when leaving mission:
if (ThreeEnhancement) {
  ThreeEnhancement.destroy();
  ThreeEnhancement = null;
}
```

**Hook 5: Settings integration (~line 16955 area)**

```javascript
// Add to SettingsModule / SettingsMenu:
// "Enable 3D Enhancements" toggle (default: false on mobile, true on desktop)
// "3D Quality" dropdown: low / medium / high
// Stored under GameStore key `settings.graphics.threeEnabled`
```

### 3.2 DOM Container for 3D Canvas

**Add to `index.html` inside `#missionScreen` (after `#missionRadarWrap`):**

```html
<!-- Three.js 3D Radar Container (overlays 2D radar when active) -->
<div id="threeRadarContainer" class="three-radar-container hidden"
     style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;">
</div>
```

The container is `pointer-events:none` by default; Three.js renderer canvas gets `pointer-events:auto` when `OrbitControls` are active.

---

## 4. Performance Budget for Mobile

### 4.1 Hard Limits

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| Total triangles | ≤ 5,000 | Count on init, warn if exceeded |
| Draw calls / frame | ≤ 20 | Batch geometries into groups |
| Texture memory | ≤ 16MB | Procedural textures only (no image loading) |
| Render rate | 30 fps | Throttled RAF (skip every other frame) |
| Pixel ratio | ≤ 2 | `renderer.setPixelRatio(Math.min(dpr, 2))` |
| Concurrent layers | 1 | Only one 3D mode active at a time |

### 4.2 Auto-Disable Triggers

```javascript
// Inside ThreeEnhancement._checkGPU()
_autoDisable() {
  // 1. Low-end GPU detection
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return false; // no WebGL at all
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const lowEnd = /(Mali-4|Mali-G31|Adreno 3|Adreno 4|PowerVR)/i.test(renderer);
    if (lowEnd) return false;
  }
  
  // 2. Battery saver
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      if (b.level < 0.15 || b.charging === false && b.level < 0.3) {
        this.setMode('off');
        showToast('3D mode disabled to save battery');
      }
    });
  }
  
  // 3. Memory pressure (heuristic)
  if (performance.memory && performance.memory.usedJSHeapSize > 200 * 1024 * 1024) {
    return false;
  }
  
  return true;
}
```

### 4.3 Mobile-First Defaults

| Setting | Desktop Default | Mobile Default |
|---------|----------------|----------------|
| 3D enabled | `true` | `false` |
| Antialias | `true` | `false` |
| Shadows | `false` | `false` |
| Building detail | Full | Simplified (no edge glow) |
| Particle count | 800 | 200 |
| Terrain resolution | 64×64 | 32×32 |

---

## 5. Toggle System: 2D ↔ 3D Views

### 5.1 Toggle UI

```
┌────────────────────────────────────────┐
│  [📡 Radar] [🔄 Full] [3D] [⚙️]  │  ← HUD overflow menu
└────────────────────────────────────────┘
                              ↑
                    New "3D" button toggles between:
                    • 2D canvas radar (default)
                    • 3D Three.js radar overlay
```

### 5.2 State Machine

```
                    ┌─────────────┐
         ┌─────────►│   2D Only   │◄────────┐
         │          │  (default)  │         │
         │          └─────────────┘         │
    toggle 3D OFF              toggle 3D ON │
         │                                  │
         │          ┌─────────────┐         │
         └──────────┤  3D Radar   ├─────────┘
                    │   Overlay   │
                    └──────┬──────┘
                           │ toggle mode
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌──────────┐  ┌──────────┐
        │Elevation│  │Spectator │  │  AR HUD  │
        │  Map    │  │  Mode    │  │ Overlay  │
        └─────────┘  └──────────┘  └──────────┘
```

### 5.3 Mode Descriptions

| Mode | What It Shows | Interaction | When to Use |
|------|--------------|-------------|-------------|
| `off` | 2D canvas radar only | Normal gameplay | Default, mobile |
| `radar` | 3D isometric minimap | OrbitControls (drag to rotate) | Better spatial awareness |
| `elevation` | Full-screen 3D terrain | Orbit + zoom | Route planning before moving |
| `spectator` | Free-fly 3D camera | WASD + mouse look | Post-game replay, live spectating |
| `overlay` | 3D markers on 2D game | None (passive) | AR-style objective arrows |

---

## 6. Step-by-Step Implementation Order

### Task 1: Foundation — `three-enhancement-layer.js` skeleton (~2 hours)
- [ ] Create file with module structure, imports, config
- [ ] Implement `init()` / `destroy()` lifecycle
- [ ] Add dynamic `import()` wrapper in `game-v2.js`
- [ ] Add `#threeRadarContainer` to `index.html`
- [ ] Add importmap to `index.html`
- [ ] Test: module loads without errors, Three.js fetched from CDN

### Task 2: 3D Radar Layer (~2 hours)
- [ ] Port `test-threejs-radar.html` scene setup into module
- [ ] Implement `_initRadarScene()` with isometric camera preset
- [ ] Add procedural building generation from `state.buildings`
- [ ] Add player/enemy/objective markers with color coding
- [ ] Wire `syncPlayers()` / `syncObjectives()` from `RadarModule.draw()`
- [ ] Add toggle button to HUD overflow menu
- [ ] Test: 3D radar shows same data as 2D radar, orbit controls work

### Task 3: Elevation Map Layer (~1.5 hours)
- [ ] Implement `_initElevationScene()` with `PlaneGeometry`
- [ ] Generate heightmap from `TerrainSystem` data or simple noise
- [ ] Apply vertex color gradient (green low → brown high)
- [ ] Project player positions onto terrain surface
- [ ] Add toggle from radar panel or keybind
- [ ] Test: terrain renders, player dots sit on surface

### Task 4: Performance & Mobile Hardening (~1.5 hours)
- [ ] Implement 30fps throttling in render loop
- [ ] Add `_checkGPU()` auto-disable logic
- [ ] Add battery-aware disable
- [ ] Implement `_disposeScene()` for memory cleanup
- [ ] Test on mobile: verify auto-disable on low battery, no crashes

### Task 5: Spectator Mode (~2 hours)
- [ ] Implement `_initSpectatorScene()` with free-fly camera
- [ ] WASD + mouse look controls (custom, not OrbitControls)
- [ ] Player trail rendering (buffered positions)
- [ ] Objective markers in 3D space
- [ ] Toggle from spectator screen or post-game results
- [ ] Test: camera moves freely, trails fade over time

### Task 6: AR Overlay Layer (~1 hour)
- [ ] Implement `_initOverlayScene()` with transparent renderer
- [ ] 3D pulsing arrows above objective positions
- [ ] Render on top of 2D game canvas (higher z-index)
- [ ] Test: arrows visible but don't block clicks

### Task 7: Settings Integration & Polish (~1 hour)
- [ ] Add "3D Enhancements" toggle to SettingsMenu
- [ ] Add quality preset (low/medium/high)
- [ ] Persist setting via `GameStore` (`settings.graphics.threeEnabled`)
- [ ] Add loading state while Three.js fetches from CDN
- [ ] Final integration test: all modes switch cleanly

### Total Estimated Effort: ~11 hours (7 tasks)

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Three.js CDN unavailable | Fallback: 2D mode always works; show "3D unavailable" toast |
| Mobile GPU crashes | Auto-detect low-end, disable before init; graceful fallback |
| Memory leaks on mode switch | `_disposeScene()` destroys all geometry/materials between modes |
| Frame rate drops | 3D capped at 30fps; 2D game stays at 60fps; independent loops |
| Touch conflicts with Leaflet | Three.js canvas has `pointer-events:none` except when controls active |
| Large file size from CDN | Browser caches module; only ~150KB gzipped; loaded once |

---

## 8. Success Criteria

- [ ] 3D radar displays identical information to 2D radar
- [ ] Toggle between 2D/3D is instant (< 200ms after first load)
- [ ] Mobile defaults to 2D, desktop defaults to 3D available
- [ ] No frame rate drop in 2D game when 3D is off
- [ ] Memory returns to baseline after `destroy()`
- [ ] All test-pages techniques are incorporated into the module

---

*Document version: 1.0*  
*Author: SWARM R&D*  
*Date: 2026-05-18*
