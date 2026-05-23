# Phase 11 — Three.js Enhancement Layer

**Signal Lost v2** — 18,000+ line game-v2.js  
**Goal:** Augment the 2D canvas game with lightweight Three.js overlays for enhanced tactical visualization without sacrificing mobile performance or core gameplay.

## Design Philosophy

The 2D canvas tactical map is the core gameplay view — fast, lightweight, works everywhere. Three.js adds supplementary layers that overlay or coexist with the 2D view:

1. **The 2D game stays primary** — movement, combat, radar, all interaction remains on canvas
2. **Three.js is additive** — elevation maps, 3D spectator, enhanced radar — optional enhancements
3. **Performance first** — Three.js layers can be disabled on low-end devices
4. **Procedural geometry** — no Blender assets needed. Buildings = BoxGeometry, terrain = PlaneGeometry + heightmap

## Proposed Three.js Overlays

### 1. 3D Minimap/Radar (Alternative to canvas radar)
- Isometric or top-down 3D view of the map
- Player dots rendered as 3D spheres/cylinders
- Terrain height shown with color gradient (green=low, brown=high)
- Buildings rendered as 3D boxes with transparency
- Toggle: 2D radar ↔ 3D radar
- **Kimi-friendly:** All procedural Three.js code

### 2. 3D Elevation Map
- Full-screen toggle from game view
- Terrain wireframe or solid with height coloring
- Player and enemy positions projected onto 3D terrain
- Useful for planning routes (see elevation before moving)
- **Kimi-friendly:** Heightmap generated from noise functions in JS

### 3. 3D Spectator Mode
- Free-camera 3D view of the battlefield
- Follows a player or orbits the map center
- Shows building positions, player movements, objective markers in 3D
- Used for post-game replay or live spectating
- **Kimi-friendly:** All camera math is Three.js built-in

### 4. 3D Overlay (AR-style)
- Semi-transparent 3D elements overlaid on the 2D game
- 3D objective markers (pulsing arrows floating above points)
- 3D line-of-sight cones
- 3D danger zone indicators
- **Kimi-friendly:** Sprite-based overlay, no complex geometry

## Implementation Strategy

### Phase A — Foundation (1 Kimi worker, ~400 lines)
1. Create `three-enhancement-layer.js` — standalone module
2. Three.js CDN import (from unpkg/CDN, no bundler needed)
3. Scene, camera, renderer setup with transparent background option
4. Event system to receive game state updates from main loop

### Phase B — 3D Radar (1 Kimi worker, ~300 lines)
1. Isometric camera above map
2. Player/ally/enemy dots as 3D objects
3. Terrain height display (colored grid)
4. Toggle switch between 2D and 3D radar

### Phase C — Elevation Map (1 Kimi worker, ~250 lines)
1. Full-screen 3D terrain view
2. OrbitControls for camera rotation
3. Player position marker on 3D terrain
4. Height color legend

### Phase D — Spectator Mode (1 Kimi worker, ~350 lines)
1. Free-fly camera with WASD controls
2. Player trail rendering
3. Objective markers in 3D space
4. Toggle during match or post-match replay

## Performance Considerations

| Concern | Solution |
|---------|----------|
| GPU memory | Low-poly geometry (under 5000 tris total) |
| Mobile battery | Three.js layer auto-disables on low battery / poor GPU |
| Frame rate | Independent render loop at 30fps for 3D, 60fps for 2D game |
| Memory | Dispose geometry on layer toggle-off; lazy-init Three.js |
| Loading time | Dynamic import of Three.js from CDN (not bundled) |

## Blender Assets (Human Required)

The following are NOT feasible with Kimi — would require a human with Blender:

- **Custom weapon models** — if we ever want 3D player models instead of dots
- **Building textures** — realistic wall/building materials
- **Character animations** — walk/run/shoot cycles
- **Terrain textures** — grass, sand, water materials
- **Particle textures** — custom smoke/fire/explosion sprites

**Alternative:** Use free .glb assets from Poly Pizza / Sketchfab for placeholder models. Kimi can write the loader code.

## Test Design Pages (See separate test-pages/)

For immediate user testing:
1. `test-threejs-radar.html` — 3D radar minimap demo with player dots and buildings
2. `test-threejs-chat.html` — Chat interface styled for the game (2D, no Three.js needed)
3. `test-threejs-loading.html` — Loading screen with animated 3D elements

Each page is standalone, loads Three.js from CDN, runs on phone via HTTPS tunnel.

---

**Document version: 1.0**
**Author: SWARM R&D**
**Date: 2026-05-17**
