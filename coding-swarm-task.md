# Signal Lost v2 — Coding Swarm: Feature Build Session

## Current Status
- game-v2.js: 7,170 lines, single file
- All phases 1-5 done, all phase 6 features done
- 7 roles working: Drone, Mechanic, Medic, Decoder, Navigator, Courier, Mission Control
- ParticleSystem enhanced (trails, glow, color cycling, burst)
- ScreenJuice full (shake, flash, kill feed, critical pulse, hitmarkers)
- CommandWheel (8-sector radial pings), DamageNumbers floating
- AI: threat patrol/hunt/swarm/flank + ally role-specific AI
- Radar fullscreen canvas with scan animation
- CSS: 3,687 lines with ambient overlays, role effects, animations

## Missing Features (your targets)
Pick features from THIS list. Each is ~100-300 lines. Target 3-5 features per run.

### FEATURE A: Fog of War System
Currently all map tiles are visible. Add a fog of war Canvas layer that:
- Covers entire map with dark overlay (#111820)
- Reveals a circle around each allied agent (radius: 80m for agents, 120m for player)
- Uses Canvas `destination-out` compositing for smooth reveal edges
- Fades revealed areas back after 30s of no agent presence
- Add a `FogOfWar` module object (like ParticleSystem pattern)
- On the `#fogCanvas` (<canvas id="fogCanvas"> added to index.html)
- Performance: cache fog canvas, only update when agents move >5m
- Toggle: F key toggles fog of war on/off for testing

### FEATURE B: Terrain Signal Heat Map
A translucent overlay showing signal strength across the map:
- `TerrainHeatMap` module with canvas overlay
- Uses gradient circles at objective locations (green = strong signal near objective, red = weak)
- Updates every 3 seconds, not every frame
- Toggle via H key
- Opacity: 0.25, blend mode: screen

### FEATURE C: Role-Specific Ability Animations
- Drone scan pulse: expanding blue ring on radar canvas when scout ability used
- Medic heal beam: green line drawn from Medic to target, fades over 500ms
- Mechanic repair: orange spark particles burst at target location
- Decoder decode: purple hex code characters scramble then resolve at objective marker
- Navigator waypoint: teal arrow that points to nearest objective (on HUD, not map)
- Courier speed: yellow speed lines on edges of screen (already has CSS for this)
- Mission Control: gold grid flash overlay when using ability

### FEATURE D: Ambient Audio System (Web Audio API)
No audio library needed — pure Web Audio API oscillators:
- Radio static: noise buffer looping at low volume, with crackle
- Wind ambient: filtered noise with LFO modulation
- Threat proximity hum: oscillator tone that rises in pitch as threats get closer
- Objective ping: short frequency sweep every 10s when near objective
- Footsteps: noise burst loop with speed-dependent frequency
- All controlled by a `SoundAmbient` module with global volume control
- AudioContext.init() called on first user click

### FEATURE E: Tutorial / Onboarding System
- Step-by-step overlay prompts for new players
- 5 steps: 1) Welcome + movement hint, 2) Radar explanation, 3) Role abilities, 4) Objectives, 5) Extraction
- Each step has a highlight box around the relevant UI element
- Skip button in corner
- Shows only on first play (localStorage flag)
- Triggered from splash screen

### FEATURE F: Compass Rose Widget
- Already has a compass widget at top of mission screen
- Enhance it: always shows North, cardinal direction labels (N/S/E/W)
- Needle rotates based on player heading
- Objective marker: small triangle on compass ring pointing to nearest objective (gold)
- Threat warning: red zone on compass when threats within 200m
- Uses CSS transforms, no canvas

### FEATURE G: After-Action Report
Screen after extraction/game over with:
- Mission duration, distance traveled
- Objectives found / total
- Threats evaded / eliminated
- Score breakdown by category
- Role-specific achievements (Drone: area scanned, Medic: heals done, etc.)
- Grade: S/A/B/C/D based on objectives + score
- "Play Again" button

### FEATURE H: Score / Leaderboard Integration
- Session score tracking in localStorage (per-player, last 10 games)
- Score formula: base 100 per objective + bonus for speed + role-specific bonus
- Leaderboard shown on Results screen below the after-action report
- Best score highlighted in gold

## Implementation Rules
1. Never rewrite game-v2.js — always targeted edits (patch or insert)
2. Use the same patterns as existing code (module objects like ParticleSystem, etc.)
3. Run `node --check game-v2.js` after every change
4. Add `<canvas>` or `<div>` elements to index.html if needed
5. Add CSS to styles-v2.css for new UI elements
6. Prioritize visual-impact features (Fog → Animations → Tutorial → After-Action)
7. Commit with `git add -A && git commit -m "feat: [feature name]"`

## Your Task
Pick the HIGHEST priority unbuilt features from the list above. Implement them one at a time. Start with Feature A (Fog of War) since it has the biggest visual impact. Then Feature C (Role-specific animations). Then Feature D (Ambient audio). Each feature must pass `node --check` before moving on. When all selected features are done, commit everything.
