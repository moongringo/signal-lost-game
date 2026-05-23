# Phase 7 — AI Overhaul, GPS Mechanics & Map Expansion

**Signal Lost v2** — 10,900+ line game-v2.js
**Current state:** Phase 6 complete (Multiplayer Resilience, Map Biomes, Loadouts, Ping Wheel, Daily Missions, Chat, HUD Customization, Moderation, Friends, Match History)

## Priority Ranking

| # | Feature | Effort | Impact | Lines |
|---|---------|--------|--------|-------|
| 1 | Smarter Threat AI (Behavior Trees, Difficulty Scaling) | Large | 5/5 | ~400-500 |
| 2 | Ally AI Improvements (Squad Coordination, Role Synergy) | Large | 4/5 | ~300-400 |
| 3 | Difficulty Scaling System (Adaptive Threats, Dynamic Objectives) | Medium | 5/5 | ~200-250 |
| 4 | Signal Triangulation Minigame | Medium | 4/5 | ~250-300 |
| 5 | GPS Degradation & Interference | Medium | 4/5 | ~200-250 |
| 6 | Battery Management Deepening (Power Budget, Tool Costs) | Medium | 3/5 | ~150-200 |
| 7 | Multiple Mission Maps (Map Selection, Region Themes) | Large | 5/5 | ~300-400 |
| 8 | Dynamic Objective Placement (Context-Aware Spawning) | Medium | 4/5 | ~200-250 |
| 9 | Procedural Map Generation (Perlin Noise, Biome Blending) | Large | 4/5 | ~350-450 |
| 10 | Map Editor / Custom Maps (Save/Share, Community Maps) | Large | 3/5 | ~300-400 |

---

## Task 1 — Smarter Threat AI (Behavior Trees)

Replace the current state-machine threat AI with a lightweight behavior tree system. Each threat gets a `behaviorTree` object with nodes: `Selector`, `Sequence`, `Condition`, `Action`.

**New behaviors:**
- **Ambush**: Threats in `flanker` swarm role hide near high-traffic paths and wait for agents to pass before engaging.
- **Investigate**: When a threat loses a target, it moves to the last known position and searches in a spiral pattern for 8s before returning to patrol.
- **Call Reinforcements**: When a threat enters `hunting` mode, it has a 30% chance to spawn 1 additional threat at 600m distance after 10s (capped at max threat count).
- **Retreat & Heal**: Threats that take 3+ hits retreat to a safe distance, reduce their detection radius by 40% for 12s ("healing"), then re-engage.
- **Predictive Intercept**: Threats calculate agent velocity from last 2 positions and intercept ahead of their path instead of chasing directly.

**Difficulty scaling hooks:**
- `state.difficulty` (1-5) set at mission start based on squad average role tier + mission history win rate.
- Difficulty affects: threat speed multiplier (+8% per level), detection range (+10% per level), reinforcement chance (+10% per level), ambush patience (-1.5s per level).

**Files:** game-v2.js (simulateWorld threat section, generateThreats)

---

## Task 2 — Ally AI Improvements (Squad Coordination)

Enhance bot AI beyond individual role behaviors to include squad-level coordination.

**New coordination behaviors:**
- **Formation Following**: Bots maintain a loose diamond/wedge formation around the local player when no objectives are active. Navigator bots lead; Medic bots trail.
- **Role Synergy**: When a Decoder bot is decoding, a Mechanic bot prioritizes staying within 50m to provide signal boost. When a Medic is reviving, a Spotter bot (if present) provides overwatch and pings nearby threats.
- **Shared Threat Memory**: Bots share threat positions they've seen. If any bot sees a threat, all bots within 300m gain awareness of it for 15s (shown as "?" on their internal radar).
- **Objective Queueing**: Bots no longer all rush the same objective. They distribute across available decoded objectives using a simple greedy assignment (closest unclaimed objective).
- **Extraction Escort**: During extraction countdown, bots converge on the extraction zone and form a perimeter, prioritizing threats over objectives.

**Bot personality variance:** Add `personality` field to each bot (Cautious, Aggressive, Balanced) affecting their threat evasion distance and objective rush tendency.

**Files:** game-v2.js (simulateWorld ally bot AI section)

---

## Task 3 — Difficulty Scaling System

Implement a formal difficulty system that adapts to player skill and mission context.

**Difficulty levels (1-5):**
- Set at mission start: `difficulty = clamp(1 + floor(avgSquadTier / 2) + winStreakBonus, 1, 5)`
- `winStreakBonus`: +1 for every 2 consecutive wins in match history, capped at +2.
- Player can override with a "Challenge Rating" selector in setup (1-5, default = auto).

**Difficulty modifiers (applied in generateThreats, simulateWorld, generateObjectives):**
| Stat | Diff 1 | Diff 2 | Diff 3 | Diff 4 | Diff 5 |
|------|--------|--------|--------|--------|--------|
| Threat count | base-1 | base | base+1 | base+2 | base+3 |
| Threat speed | 0.85x | 1.0x | 1.08x | 1.16x | 1.25x |
| Detect range | 0.85x | 1.0x | 1.10x | 1.20x | 1.30x |
| Reinforcement chance | 0% | 10% | 20% | 30% | 40% |
| Objective time limits | +30s | normal | -15s | -30s | -45s |
| Supply cache spawn rate | +50% | normal | -25% | -50% | -75% |

**Adaptive mid-mission scaling:** If squad completes 60% of objectives with no eliminations and >70% avg stamina, bump difficulty up by 0.5 (apply next threat respawn). If 2+ eliminations before 30% completion, reduce difficulty by 0.5.

**Files:** game-v2.js (generateThreats, simulateWorld, setup screen)

---

## Task 4 — Signal Triangulation Minigame

Add a new objective type and standalone mechanic for locating hidden signals.

**Objective type: `Triangulation`** (already partially exists in generateObjectives — expand it):
- Player must visit 3 vantage points around a hidden objective to triangulate its exact position.
- At each vantage point, the player holds a "Scan" button for 3s to get a bearing line.
- After 2 bearings, a wedge-shaped heatmap overlay appears on the map showing the likely area.
- After 3 bearings, the objective is revealed and can be decoded normally.
- Incorrect vantage points (too close together or too far from the signal source) give noisy bearings with ±15° error.

**Standalone Triangulation Mode** (lobby mini-game):
- A practice mode where players race to triangulate 5 signals as fast as possible.
- Leaderboard stored in localStorage (best times per difficulty).
- Used in tutorial to teach GPS/map reading skills.

**UI:**
- Add a triangulation overlay canvas on the mission map showing bearing lines and heatmap.
- Scan button in the action bar (appears when near a triangulation objective).
- Bearing compass widget in HUD showing current scan direction.

**Files:** game-v2.js, index.html (triangulation UI), styles-v2.css

---

## Task 5 — GPS Degradation & Interference

Expand the GPS system beyond battery-aware polling to include environmental interference.

**GPS Degradation sources:**
- **Threat Proximity**: Within 150m of an active threat, GPS accuracy degrades by 20-50m (simulated jitter in position updates). Stackable with multiple threats.
- **Terrain Blockage**: In `urban` and `industrial` biomes, GPS accuracy is reduced by 10-30m randomly (simulating buildings blocking satellites).
- **Weather Impact**: During `storm` weather, GPS accuracy drops by 15-25m and update rate is halved.
- **Jammer Zones**: Certain threats (renamed "Hunter Relay" → "Signal Jammer") create a 200m radius zone where GPS updates are delayed by 3-5s and accuracy is severely degraded (up to 100m).

**Visual feedback:**
- GPS accuracy ring around player marker (pulsing red when degraded).
- HUD indicator: "GPS: Good / Degraded / Jammed" with color coding.
- When jammed, player marker shows a "ghost trail" of last 3 known positions (faded dots) to represent uncertainty.

**Recovery:** Moving out of interference zones restores accuracy over 3s (lerp back to normal).

**Files:** game-v2.js (GPS update logic, renderMissionMap HUD), styles-v2.css

---

## Task 6 — Battery Management Deepening

Expand BatteryAwareGPS into a full Power Budget system affecting all tools.

**Power Budget:**
- Each agent has a `powerBudget` (0-100) representing device battery.
- Drains constantly during missions at 0.5%/min base rate.
- Tool usage costs power:
  - Radar pulse: 3%
  - Drone deploy: 5%
  - Stealth mode: 2% per 10s active
  - Signal boost (Mechanic): 4%
  - Decoy trap: 6%
  - Ultimate abilities: 15%
  - GPS active: 1% per minute (in addition to adaptive polling)

**Power sources:**
- Supply caches can contain "Power Cells" (+20% power).
- Mechanic bots can transfer 10% power to nearby agents (30s cooldown).
- Extraction zones have charging stations (+5%/s while in zone).

**Critical power state (< 15%):**
- GPS forced to critical polling (15s interval).
- Radar range reduced by 50%.
- Stealth mode disabled.
- Screen brightness dimmed (CSS filter on game container).

**UI:**
- Power bar in HUD next to signal/stamina.
- Power cost preview when hovering ability buttons.
- Low-power warning at 25% and 15%.

**Files:** game-v2.js (BatteryAwareGPS expansion, ability cost hooks, simulateWorld)

---

## Task 7 — Multiple Mission Maps

Move beyond single-area missions to support distinct map regions with unique themes.

**Map Catalog:**
Add 5 pre-defined map regions, each with a unique center coordinate, default biome mix, and thematic objective packs:

| Map | City | Center | Theme | Biome Mix | Signature Objective |
|-----|------|--------|-------|-----------|---------------------|
| Downtown Grid | New York | 40.7128,-74.0060 | Urban warfare | 70% urban, 20% open, 10% industrial | DataUpload in skyscrapers |
| Redwood Canopy | San Francisco | 37.7749,-122.4194 | Forest stealth | 60% forest, 30% open, 10% water | Recon without detection |
| Rust Belt | Detroit | 42.3314,-83.0458 | Industrial decay | 50% industrial, 30% urban, 20% open | Sabotage in factories |
| Coastal Watch | Miami | 25.7617,-80.1918 | Open terrain + water | 50% open, 30% water, 20% urban | Escort along shoreline |
| Mesa Ridge | Phoenix | 33.4484,-112.0740 | High ground dominance | 60% high_ground, 30% open, 10% urban | Triangulation on peaks |

**Map Selection UI:**
- Replace single city dropdown with a "Map Select" screen showing cards for each map.
- Each card shows: satellite preview (static image or mini Leaflet map), difficulty rating, avg mission time, best squad score.
- Host picks map in lobby; all players see the selection.

**Map persistence:**
- `state.currentMap` stores selected map ID.
- `getMissionCenter()` reads from `mapCatalog[state.currentMap].center`.
- TerrainSystem.generate() uses map's biome mix weights instead of uniform random.

**Files:** game-v2.js (getMissionCenter, TerrainSystem, setup/lobby), index.html (map select UI)

---

## Task 8 — Dynamic Objective Placement

Make objective spawning context-aware based on map, squad composition, and mission progress.

**Context-aware spawning rules:**
- **Map-aware**: Urban maps favor DataUpload and Sabotage objectives placed near building clusters. Forest maps favor Recon and Triangulation in dense tree areas.
- **Squad-aware**: If squad has a Decoder, spawn 1 extra Cipher objective. If squad has a Medic, spawn 1 extra Escort objective. If squad has a Spotter, spawn 1 extra Recon objective.
- **Progress-aware**: First 2 objectives are always within 300m of spawn. Objectives 3-5 are 400-800m out. Final objectives (before extraction) are 600-1000m out, forcing squad to traverse the map.
- **Threat-aware**: No objective spawns within 150m of a threat spawn point. If a threat patrol route passes near an objective, reduce the objective's radius by 20% (harder to complete safely).

**Objective chaining:**
- 20% chance for "chained" objectives: completing objective A reveals the location of objective B (previously hidden). Creates narrative flow.
- Chains shown on map as dashed lines between linked objectives.

**Extraction dynamics:**
- Extraction point is revealed only after 60% of objectives are complete.
- Extraction location is weighted toward the side of the map opposite from the squad's average position (forces cross-map movement).

**Files:** game-v2.js (generateObjectives, simulateWorld)

---

## Task 9 — Procedural Map Generation

Add a lightweight procedural generation system for terrain features, threat patrol zones, and objective clusters.

**Perlin Noise terrain features:**
- Use a simple seeded Perlin noise function (no external deps) to generate a 32x32 heightmap over the mission area.
- Height values map to terrain features:
  - < 0.3: Low ground (water if near coast, open otherwise)
  - 0.3-0.5: Flat terrain (open, urban)
  - 0.5-0.7: Elevated (high_ground, forest)
  - > 0.7: Peaks (high_ground, restricted movement)

**Biome blending:**
- Instead of discrete biome zones, use noise to blend between 2-3 biome types smoothly.
- Each biome has a "dominance" value at each point; the dominant biome determines modifiers.
- Transition zones between biomes have mixed modifiers (e.g., 50% urban signal penalty + 50% open signal bonus = neutral).

**Procedural threat patrol zones:**
- Threats spawn at noise "valleys" (low ground = ambush points) or "ridges" (high ground = overwatch).
- Patrol waypoints follow noise contours rather than random orbits.

**Procedural objective clusters:**
- Objectives cluster around noise "peaks of interest" — local maxima in a second noise layer (interest map).
- Creates natural "hot zones" with multiple objectives and threats, and "safe corridors" with few threats.

**Performance:**
- Noise generation runs once at mission start (~5ms for 32x32 grid).
- Terrain queries use bilinear interpolation from the precomputed grid (O(1)).

**Files:** game-v2.js (new ProceduralMap module, TerrainSystem integration)

---

## Task 10 — Map Editor / Custom Maps

Allow players to create, save, and share custom mission maps.

**Editor features:**
- **Place Mode**: Click on the map to place objectives, threats, supply caches, and extraction points.
- **Terrain Brush**: Paint biome zones (urban, forest, industrial, open, high_ground, water) onto the map.
- **Weather Preset**: Select default weather for the map (clear, rain, fog, storm).
- **Test Run**: Launch a solo mission on the custom map immediately.
- **Validation**: Ensure at least 3 objectives, 1 extraction, and 1-6 threats. Warn if objectives are too close (< 50m) or too far from center (> 1500m).

**Save/Share:**
- Custom maps saved to localStorage as JSON (`slv2_custom_maps`).
- Export as shareable code (base64-encoded JSON, ~200-500 chars).
- Import via paste code. Import validation prevents malformed maps.
- Community maps browser: list of imported maps with name, author, rating (thumbs up/down).

**UI:**
- "Map Editor" button in lobby (host-only).
- Editor screen with Leaflet map, tool palette (objectives, threats, terrain brush), property panel for selected item.
- Layer toggles: show/hide terrain grid, objective labels, threat radii.

**Files:** game-v2.js (new MapEditor module), index.html (editor screen), styles-v2.css (editor UI)

---

## Files to Modify

- `game-v2.js` — All tasks (AI, GPS, maps, procedural generation, editor)
- `index.html` — Map select UI, triangulation overlay, power bar, editor screen
- `styles-v2.css` — Editor UI, triangulation canvas, power HUD, map cards
