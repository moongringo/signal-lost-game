# Signal Lost v2 - Kimi Swarm: 20-Minute Sprint

## CURRENT STATE
Signal Lost v2 is a tactical multiplayer GPS game in a single HTML/JS/CSS file (game-v2.js 260KB, index.html 32KB, styles-v2.css 87KB). Already implemented:
- ParticleSystem with 7 role presets (Drone, Mechanic, Medic, Decoder, Navigator, Courier, Mission Control)
- ScreenJuice (camera shake, hit markers, damage vignette)
- CommandWheel (8-sector radial ping menu with role-specific pings)
- DamageNumbers (floating DOM elements for damage/heal/objective feedback)
- Advanced AI: enemy threat swarm/flanking/pinch maneuvers + ally role-specific AI
- Radar fullscreen overlay with scan animation, Leaflet OSM underneath
- HUD: bar (signal/stamina), ability hotbar, buffs, event log, threat indicators, extraction overlay
- 7 player roles with unique abilities and objectives

## YOUR TASK (20 minutes max)
Execute these phases in order. Each phase builds on the previous. Be fast, be visual, and make the game LOOK and FEEL like a polished tactical game.

---

### PHASE 1: GAME DESIGN & LAYOUT (5 min)
**Goal:** Establish visual design system — HUD schemes, color palettes, typography, screen layouts

1. **Read styles-v2.css, index.html, game-v2.js** — understand current visual state
2. **Define a HUD color palette:**
   - Primary UI: dark slate (#1a1a2e or similar)
   - Accent for each role (already exists in roles[])
   - Threat colors: danger red, caution amber, safe green
   - Text: off-white (#e0e0e0) on dark, with role-colored highlights
3. **Design screen layout scheme:**
   - Lobby/Setup/Roles screens: dark glass-morphism panels (backdrop-filter: blur), subtle gradients
   - Mission screen: minimal chrome, more map, HUD elements semi-transparent
   - Results screen: clean data display with role-colored stats
4. **Typography system:**
   - Primary font: system sans-serif with monospace for tactical data
   - Headers: uppercase, letter-spacing, role-colored
   - Numbers/coordinates: monospace with glow
5. **Create a `hud-layout-guide.md`** in the project root with your design decisions

### PHASE 2: VISUAL EFFECTS & GRAPHICS (7 min)
**Goal:** Upgrade all visual effects — make particles pop, screens juice, and the game look premium

1. **Enhance ParticleSystem (game-v2.js):**
   - Add particle trails (trace a fading line behind each particle)
   - Add particle glow (shadowBlur on the canvas context)
   - Add particle scaling (start big, shrink as lifetime decreases)
   - Add color cycling (particles shift through a role's color palette over lifetime)
   - Add burst impulse (particles emit with a small explosion force on first frame)
   - Presets already exist for all 7 roles — enhance each one with the above

2. **Enhance ScreenJuice:**
   - Add screen flash on player damage (white/red overlay that fades 200ms)
   - Add critical health pulse (screen border pulses red when stamina < 25%)
   - Add kill feed (slide-in/slide-out DOM elements for kills and objective completions)
   - Add ability ready glow (ability icons pulse when cooldown finishes)

3. **Add Role-specific HUD effects:**
   - Decoder: hex code rain in background (subtle, 10% opacity, only at mission screen)
   - Navigator: compass widget that pulses when near objective
   - Courier: speed lines on edges when moving fast
   - Mechanic: gear rotation animation on ability icons
   - Medic: cross pulse on heal
   - Drone: ring expansion on scout abilities
   - Mission Control: scan line effect on HUD

4. **Add ambient background effects:**
   - Subtle scan lines overlay (like night vision or HUD screen)
   - Edge vignette (dark corners, center bright — creates depth)
   - Data screen flicker (occasional 100ms flicker on the HUD panels, like an old terminal)

### PHASE 3: GAME LOGIC & FEATURES (5 min)
**Goal:** Fix gaps, polish AI, add missing features

1. **AI improvements:**
   - Threat drones should visually flash red when they detect the player
   - Ally drones should ping "Enemy Spotted" text when they detect a threat
   - Add patrol routes: threats move between predefined waypoints instead of random
   - Add "alert state" system: threats go from idle → suspicious → alerted → hunting

2. **Game flow:**
   - Fix screen transitions (ensure data-screen attribute updates properly on all transitions)
   - Add "press SPACE to ready" indicator on Ready screen
   - Add countdown animation (3, 2, 1, GO!) when mission starts

3. **HUD polish:**
   - Signal bar should animate smoothly (CSS transition) instead of instant
   - Stamina bar should change color based on level: green > 50%, amber 25-50%, red < 25%
   - Ability cooldowns should show a radial fill animation
   - Add floating notification for "Mission Objective Updated"

### PHASE 4: TEST & VERIFY (3 min)
**Goal:** Make sure everything works, fix syntax, commit

1. Run `node --check game-v2.js` — fix any syntax errors
2. Run `node --check index.html` (or just verify it's valid)
3. Test with `http-server` if possible (start_python_http):
   ```bash
   cd /media/quemello/Back\ up2/signal-lost-game-dev/signal-lost-game-v2 && python3 -m http.server 8081
   ```
4. Commit all changes:
   ```bash
   git add -A
   git commit -m "feat: 20min swarm sprint - design system + VFX polish + AI logic"
   ```

## CONSTRAINTS
- All code goes into existing files (game-v2.js, index.html, styles-v2.css)
- No external libraries (vanilla Canvas 2D only)
- Each effect should add < 50 lines unless it's complex
- Syntax-check (`node --check`) after every major change
- Work from `/media/quemello/Back up2/signal-lost-game-dev/signal-lost-game-v2/`
