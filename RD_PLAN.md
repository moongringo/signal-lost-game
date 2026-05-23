# Signal Lost v2 - R&D + Development Sprint Plan

## CODEBASE STATUS
- game-v2.js: 6,179 lines, single monolithic file
- 7 roles: Drone, Mechanic, Medic, Decoder, Navigator, Courier, Mission Control
- AI threats: Jammer Kestrel, Hunter Relay (+ unnamed patrol types) — flanking, retreat, pinch maneuvers
- Ally AI: role-specific behavior (Drone scouts perimeters, Mechanic boosts signal, Medic heals, Decoder decodes ciphers, Navigator shepherds player, Courier carries to extraction)
- Radar: Canvas 2D fullscreen with scan animation, Leaflet.js OSM map underneath
- HTML: mission screen with panels (objectives/comms/role/GPS/radar), HUD bar (signal/stamina), ability hotbar, buffs display, event log, threat indicators, extraction overlay
- No external animation libraries — all vanilla Canvas 2D + CSS
- No PixiJS, no GSAP, no particles library

## RESEARCH FINDINGS (from ~/.hermes/workspace/signal-lost-v2-web-game-research.md)

### What top web tactical games use:
1. **PixiJS** (47K stars) — hardware-accelerated sprites + particles, surviv.io/zombs.io use it
2. **GSAP** (24.7K stars, 11.6M npm) — HUD transitions, health bar smoothing, kill feed animations
3. **tsParticles** (8.8K stars) — GPU-accelerated particle effects
4. **AnimeJS** (48K stars) — lightweight alternative to GSAP
5. **Aseprite + TexturePacker** — sprite creation pipeline

### Differentiating features (from research):
1. Polished HUD with context-sensitive layout (health lerp, damage numbers, kill feed)
2. Dynamic minimap + fog of war + ping system
3. Screen juice: shake, hit markers, damage vignettes, role-specific particles
4. Role-specific animations (different walk cycles, ability casts, status effects)
5. Command wheel + role-specific quick actions

### AI trends for web games:
- FSM (baseline) — already have this
- Yuka (1.3K stars) — behavior trees + FSM + pathfinding for JS
- Utility AI (rising trend at GDC 2024) — scoring functions for natural behavior
- Hybrid FSM + Utility + BT recommended

## THIS SPRINT: R&D Meeting Decision

**R&D Team** (research analysis): recommends these priority features for Signal Lost v2:
Priority 1: **GSAP-powered HUD polish** — health bar smoothing, damage numbers float-up, kill feed slide-in/out, ability cooldown radials, status effect pulses
Priority 2: **Canvas 2D particles** — role-specific ability VFX (Mechanic gear particles, Medic green crosses, Drone ring pulses, Decoder hex streams)
Priority 3: **Screen juice** — shake on hit, hit markers (V-shape), damage vignette, role-specific on-ability effects
Priority 4: **Role-specific sprites/animations** — basic CSS+Canvas hybrid approach (no sprite sheet files needed yet): rotating gear icons, pulsing crosses, streaming hex codes
Priority 5: **Command wheel** — right-click radial wheel for universal + role-specific pings

**Coding Team** (implementation): All of the above with these constraints:
- NO external library imports — everything must be pure vanilla JS
- NO new files — all code goes into game-v2.js (or if CSS-heavy, add to styles-v2.css and index.html as needed)
- Each feature must be ~100-250 lines max (we stay lean)
- Must use Canvas 2D since that's what we already have
- Must test via node --check syntax verification

## IMPLEMENTATION PLAN

### Feature 1: GSAP-style HUD Animations (pure vanilla)
- Health bar lerp: CSS transition on width change instead of instant set
- Damage numbers: Canvas float-up + fade — spawn DOM or Canvas text element, animate position + alpha, destroy
- Kill feed: DOM elements with slide-in (translateX), fade after delay, slide-out
- Ability cooldown radial: SVG circle stroke-dashoffset animation or Canvas donut arc
- Status effect pulses: CSS keyframe animations for pulsing/rotate on buff icons

### Feature 2: Canvas Particles System
- Create lightweight `ParticleSystem` class: pool of particles, emit(x,y,count,config)
- Each particle: position, velocity, alpha, size, color, lifetime
- Config: burst direction, spread, gravity, fade rate, color palette
- Role-specific presets:
  - Mechanic: orange gear chips, radial burst 360°
  - Medic: green cross particles, upward drift
  - Decoder: purple hex code chars, zoom-out
  - Drone: blue expanding ring + static
  - Courier: yellow speed lines
  - Navigator: teal waypoint arrows
  - Mission Control: gold grid dots

### Feature 3: Screen Juice
- Camera shake: random offset on Canvas transform, decays over 200ms
- Hit markers: V-shape drawn on canvas at hit position, fades over 300ms
- Damage vignette: CSS border overlay with red pulse animation
- On-ability cast: emit role-specific particles + 100ms camera micro-shake

### Feature 4: Command Wheel
- Right-click opens 8-segment wheel drawn on Canvas overlay
- Top 4: universal pings (Enemy, Danger, Move Here, Defend)
- Bottom 4: role-specific pings (Drone: Scout Area, Medic: Need Healing, etc.)
- Mouse angle selection via atan2
- GSAP-style animation: scale 0→1 with easeOutBack
- Click emits ping event to radar + map

### Feature 5: Role-Specific Visual Indicators
- Canvas marker customization per role on minimap:
  - Drone: spinning triangle
  - Medic: cross overlay
  - Mechanic: gear overlay
  - Decoder: diamond with dot
  - Navigator: compass arrow
  - Courier: circle with dot
  - Mission Control: star
- Agent dot pulses with role color on ability use
- Status effect icons: CSS-animated buffs bar with timer countdown fill

## TECHNICAL CONSTRAINTS
- All new code must pass `node --check game-v2.js`
- Each feature has a 250-line budget
- Must work in single-file arch (no breaking existing)
- Test each feature: navigate to mission in Webbridge, verify visuals
- Commit after each working feature with message format: `feat: concise description`

## EXECUTION ORDER
1. Canvas ParticleSystem class + role presets (most visual impact, reusable for everything)
2. Screen juice: camera shake + hit markers + damage vignette (instant visual polish)
3. HUD animations: health bar smooth, damage numbers, kill feed, cooldown radials (polish)
4. Command wheel: radial ping selector (gameplay feature)
5. Role-specific markers (visual distinction)

START WITH FEATURE 1: ParticleSystem. Run Kimi CLI with:
```
kimi -w "." -p "Read RD_PLAN.md. Implement Feature 1: Canvas ParticleSystem class. Add it to game-v2.js. Create a ParticleSystem object with emit() method and render loop. Add role-specific presets. All pure vanilla canvas. Then run node --check game-v2.js. Commit with 'feat: canvas particle system with role presets'" --yolo
```
Then verify in Webbridge, then move to Feature 2.
