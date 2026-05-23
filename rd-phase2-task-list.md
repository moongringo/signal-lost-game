# Phase 2 — Feature Research & Ranked Task List

**Signal Lost v2** — 7470-line monolithic game-v2.js  
**Existing modules:** ParticleSystem, ScreenJuice, CommandWheel, DamageNumbers, KillFeed, FogOfWar, Threat AI + Ally AI, Compass, Countdown, Role ambients, AbilityHotbar, ActiveBuffs, EventLog, RadarModule, StealthMode, DayNightCycle, MapModule  
**7 roles:** Drone, Mechanic, Medic, Decoder, Navigator, Courier, Mission Control  
**5 current objective types:** Default reach-location, DataUpload, Triangulation, AssetRecovery, Extraction

---

## Priority Ranking Summary

| # | Feature | Effort | Impact | File Changes |
|---|---------|--------|--------|-------------|
|| 1 | ✅ Team Loadout Screen | Small | 5/5 | index.html, game-v2.js, styles-v2.css |
| 2 | 3 New Objective Types (HVT, Intercept, Relay) | Medium | 5/5 | game-v2.js (+~300 lines) |
| 3 | Dynamic Mission Events | Medium | 4/5 | game-v2.js, styles-v2.css |
| 4 | Deployable Drones (3 types, any role) | Large | 5/5 | game-v2.js (+~350 lines), index.html, styles-v2.css |

**Rationale:** Loadout is quickest win (pure UI wiring into existing flow), objectives add replayability where the game is thinnest, events make the world feel alive, and deployable drones are the most complex but highest long-term value.

---

## Task 1 — Team Loadout Screen (BETWEEN ROLES AND BRIEFING)

**Effort:** Small | **Impact:** 5/5 | **Lines:** ~150-200

### Design

A new screen inserted between roles selection (`rolesScreen`) and mission briefing (`briefingScreen`). Shows a panel where each player picks:

- **Starting gear slot** (1 choice): `medkit` (instantly +30 stamina when used in mission), `flare` (marks a location visible to all squad for 30s), `decoy` (deploys a fake signal that confuses threats within 50m for 20s)
- **Consumable slots** (2 per player): Pick any 2 from `[extra_battery, signal_booster, smoke_grenade, motion_sensor, emp_charge]`
- **Role-specific starting bonus** (auto-assigned based on role, shown as read-only):
  - Drone: Starts with 1 free Scout Drone deployed
  - Mechanic: Starts with global +15% signal boost for 60s
  - Medic: Starts with a free Medkit auto-applied
  - Decoder: Starts with 1 objective pre-decoded
  - Navigator: Starts with 3 waypoints revealed on map
  - Courier: Starts with 20% objective progress on next target
  - Mission Control: Starts with all agents initially revealed on radar

### UI/Screen Flow

```
rolesScreen → [NEW] loadoutScreen → briefingScreen
```

The loadout screen is a full-page screen with:
- Header: "Equip Your Kit — [Player Name] · [Role]"
- 3 card sections: Gear, Consumables, Role Bonus
- "Confirm Loadout" button
- All players must confirm before host can proceed

### HTML IDs to Add (in `index.html`)

```
loadoutScreen          — full-screen div
loadoutPlayerInfo      — "Agent Raven · Drone"
loadoutGearCards       — gear pick grid
loadoutConsumableSlots — two consumable slots
loadoutRoleBonus       — role bonus card (read-only display)
loadoutConfirmBtn      — "Confirm Loadout" primary button
loadoutReadyList       — shows which players have confirmed
loadoutBackBtn         — ← back to roles
```

### CSS Classes to Add (in `styles-v2.css`)

```
.loadout-screen       — full-screen layout (same pattern as .roles-main)
.loadout-player-info  — agent identity header
.loadout-grid         — 3-column card grid on desktop, scroll on mobile
.loadout-card         — card for gear/consumables
.loadout-card.selected — selected state with accent border
.loadout-role-bonus   — read-only effect card
.loadout-ready-list   — confirmation tick list
.loadout-ready-tick   — green checkmark for confirmed players
```

### JS Function Patterns (in `game-v2.js`)

```js
// State additions (in state object, around line 220)
state.loadouts: {}, // agentId -> { gear, consumables:[slot1,slot2], confirmed:false }
state.loadoutLocked: false, // host locks when all confirmed

// New functions (insert before renderBriefingScreen at ~line 4004)
function renderLoadoutScreen() — builds the loadout HTML
function initLoadoutScreen() — wires click handlers, gear selection, confirm
function processLoadout(agentId, loadout) — stores loadout, checks all-confirmed
function applyLoadoutBonuses() — called at mission start, applies role bonuses
function loadoutAllConfirmed() — returns true when all non-spectator players confirmed
```

### Gear Definitions

```js
const gearCatalog = {
  medkit:  { name: 'Field Medkit',     desc: 'Restore +30 stamina instantly',       icon: '🩹', type: 'gear' },
  flare:   { name: 'Signal Flare',     desc: 'Mark a location for 30s (all squad)', icon: '🔦', type: 'gear' },
  decoy:   { name: 'Decoy Beacon',     desc: 'Fake signal, distracts threats 20s',  icon: '📡', type: 'gear' },
};
const consumableCatalog = {
  extra_battery:  { name: 'Extra Battery',    desc: 'GPS lasts 25% longer',          icon: '🔋' },
  signal_booster: { name: 'Signal Booster',   desc: 'TEMP +20% signal, 45s',          icon: '📶' },
  smoke_grenade:  { name: 'Smoke Grenade',    desc: 'Obscure area on radar, 15s',    icon: '💨' },
  motion_sensor:  { name: 'Motion Sensor',    desc: 'Alerts when threat within 60m',  icon: '📳' },
  emp_charge:     { name: 'EMP Charge',       desc: 'Disable nearest threat, 8s',     icon: '⚡' },
};
const roleStartingBonuses = { ... }; // as described above
```

### Mission Application

In `startMissionClock()` (line 5251), after the countdown animation, call:

```js
applyLoadoutBonuses(); // at line ~5285, before renderHUD()
```

In `simulateWorld()` (line 5303), add consumable usage tracking. Flare creates a temporary marker visible on all maps. Decoy creates a false threat waypoint that threats patrol toward.

---

## Task 2 — Three New Objective Types (HVT, Intercept, Relay)

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### 2A — HVT Elimination (High-Value Target)

**Gameplay Flow:**
1. Objective appears as "Eliminate [HVT Name]" — a moving threat target marked with a special icon
2. HVT spawns at mission center edges and moves along a pre-calculated patrol route (4 waypoints)
3. HVT speed: ~1.3x normal threat speed; radius: 60m (smaller detection zone)
4. To eliminate: player must be within 15m of HVT and use a "Mark for Extraction" action (or the Courier's Deliver ability within 15m)
5. HVT shows on radar as a diamond icon (not red circle), visible even in Fog of War
6. **Fail condition:** HVT reaches its final waypoint (edge of map) — objective is lost
7. **Reward:** 45 points + reveals all undecoded objectives on map for 20s

**UI Indicators:**
- Diamond marker on map (`#hvtIcon`) with pulsing animation
- Objective panel shows "HVT escaping in Xs" timer (initial: 120s)
- Direction arrow on HUD pointing to HVT when within 200m
- HVT health bar when within 50m

**JS Implementation:**

```js
// In generateObjectives() — add new type handler
if (type === 'HVT') {
  base.hvtLat = lat; base.hvtLng = lng;
  base.hvtWaypoints = generateHVTPatrol(base.lat, base.lng);
  base.hvtIndex = 0;
  base.hvtEliminated = false;
  base.hvtTimeout = 120; // seconds before HVT escapes
  base.hvtHealth = 1; // one-hit elimination
  base.hvtSpeed = 0.0005; // ~1.3x normal threat
}

// In simulateWorld() objective loop — add HVT movement logic
// In renderMissionMap() — add HVT diamond marker rendering
// In MapModule — add addHVT() method (separate icon style)
```

### 2B — Data Intercept (Stand in Zone, Signal Fluctuates)

**Gameplay Flow:**
1. A circular zone appears (radius: 40m) at a fixed location
2. Player must stand within zone for a cumulative **15 seconds** total
3. **Signal fluctuation mechanic:** Every 3 seconds while inside, roll `Math.random()`:
   - 60% chance: +1s progress (normal)
   - 25% chance: +0s (interference — no progress)
   - 10% chance: +2s progress (clear signal — double tick)
   - 5% chance: -1s progress (surge — rollback!)
4. A wave visual on the zone edge pulses faster/slower based on signal quality
5. **Fail condition:** None — player can re-enter anytime. But progress resets to 0 if player moves >100m from zone for >10s
6. **Reward:** 30 points + decodes the next locked objective

**UI Indicators:**
- Zone circle on map with animated pulsing edge
- Progress ring around intercept zone
- "Signal Strength" indicator: green/amber/red with current rate
- Floating text: "+1s" / "Interference" / "SURGE -1s" when ticking
- Cumulative timer: "7.5s / 15s"

**JS Implementation:**

```js
// New objective type in generateObjectives()
if (type === 'DataIntercept') {
  base.interceptProgress = 0; // in seconds (0-15)
  base.interceptTarget = 15;
  base.interceptState = 'idle'; // idle|active|surge|interference
  base.signalQuality = 'normal'; // clear|normal|interference|surge
  base.lastInteractTime = Date.now();
  base.interceptVisual = null; // for ring animation
}

// In simulateWorld() — handle intercept tick
// Each tick (2.5s), if player is inside zone:
//   Roll signal quality, apply progress delta
//   Show floating text feedback
//   If progress >= 15s -> complete
// In renderMissionMap() — draw animated intercept ring
// In MapModule — add addInterceptZone() method
```

### 2C — Relay Activation (3 Relays in Order, Timed)

**Gameplay Flow:**
1. Three relay points spawn in a line/arc across the map, marked A → B → C
2. Player must activate them **in order** — attempting B before A shows "Locked — activate Relay A first"
3. Each relay takes 5s to activate (stand within 20m radius for 5 continuous seconds)
4. **Time limit:** 90 seconds total from first relay activation
5. Timer bar shows remaining time (top center of screen, red when <30s)
6. After activating all three, a bonus cache spawns at the triangle centroid with additional 15 points
7. **Fail condition:** Timer expires before Relay C activated
8. **Reward:** 25 points per relay + 15 bonus = 90 total

**UI Indicators:**
- Relay A/B/C labels on map markers with distinct colors (A=#58a6ff, B=#f0883e, C=#3fb950)
- Connected by dotted line on map
- Activation progress bar per relay (shown when inside radius)
- Global countdown timer "Relay Window: XXs" in objective panel
- Lock icon on locked relays

**JS Implementation:**

```js
// In generateObjectives()
if (type === 'RelayActivation') {
  base.relayPoints = generateRelayPoints(base.lat, base.lng, 3);
  base.relayIndex = 0; // which relay to activate next (0=A, 1=B, 2=C)
  base.relayActivated = [false, false, false];
  base.relayTimer = 90; // seconds
  base.relayTimerStarted = false;
  base.relayProgress = 0; // 0-100% for current relay
  base.relayActivating = false;
}

// In simulateWorld() — handle relay progress
// If player within 20m of current relay point:
//   progress += (2500/5000)*100 = 50% per tick -> 2 ticks = 5s
//   On 100% -> mark relay activated, advance relayIndex
//   Start global timer on first relay activation
// If timer expires -> fail objective
// If all 3 activated -> spawn bonus cache, complete
// In renderMissionMap() — draw relay markers with order labels
// In MapModule — add addRelayPoint() method
```

### Add to Objective Catalog

In `missionPacks` object (line 43), add:

```js
hvt:      [["Neutralize Ghost Signal", "HVT", 15, "Track and eliminate the moving high-value target before it escapes."]],
intercept:[["Intercept Enemy Broadcast", "DataIntercept", 40, "Stand in the zone for 15s while signal fluctuates. Don't lose progress."]],
relay:    [["Activate Emergency Relays", "RelayActivation", 20, "Activate all 3 relays in order within 90 seconds."]],
```

Also update `enabledModules` default state (line 159) to include `hvt: true, intercept: true, relay: true`.

---

## Task 3 — Dynamic Mission Events (Every 60-90s)

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

A `DynamicEvents` module that triggers a random event every 60-90 seconds during a live mission. Events interrupt the static gameplay loop and require a quick team response.

### Event Types (5)

#### 3A — Supply Drop
- **Trigger:** Random location within 300m of player centroid
- **Visual:** Aircraft flyover sound + parachute marker on map (crate icon)
- **Timer:** 60 seconds to reach it
- **Reward:** +15% signal to whole squad, +20 stamina to pickup agent
- **Fail:** Nothing (supply is lost)
- **UI:** "📦 Supply Drop incoming!" event log + map marker pulsing gold

#### 3B — Threat Reinforcements
- **Trigger:** 2-3 extra threats spawn at edge of mission zone
- **Visual:** Red warning "⚠️ AI reinforcements detected" → threats fade in at map edge
- **Duration:** These threats are temporary — they despawn after 120s or when destroyed
- **Mechanics:** Added to `state.threats` with a `temp: true, expiresAt: Date.now()+120000` flag
- **Failure penalty:** If a temp threat downs an agent, penalty applies as usual
- **UI:** Kill feed: "🔴 3 new threats entering AO" + threat count briefly flashes red

#### 3C — Signal Flare
- **Trigger:** Random enemy position is pinged on all players' maps
- **Visual:** Bright yellow pillar marker visible for 15s
- **Effect:** All players see exact position of 1 random threat for 15s (even in fog)
- **UI:** "📡 Signal flare — threat position revealed" + yellow marker on map

#### 3D — Jammer Surge
- **Trigger:** Global electromagnetic pulse
- **Visual:** Screen flash + static overlay for 0.5s
- **Effect:** All abilities get +50% cooldown for 20 seconds
- **Mechanics:** Multiply all `abilityCooldowns` values by 1.5 temporarily via a `state.events.jammerSurge` flag
- **UI:** "⚡ Jammer surge — abilities slowed 20s" + red border on ability hotbar

#### 3E — Extraction Zone Shift
- **Trigger:** Only triggers if extraction objective exists and >70% objectives complete
- **Effect:** EVA point moves to a new random location 200-400m from current
- **Visual:** Alert "✈️ Extraction zone relocated!" + old marker fades, new one appears
- **Timer:** 90 seconds to reach new location (or extraction fails)
- **UI:** Large warning banner "EXTRACTION RELOCATED — 90s" + compass arrow

### JS Implementation

```js
// New module (insert after ActiveBuffs at ~line 6400)
const DynamicEvents = {
  nextEventAt: 0,
  minInterval: 60000, // 60s
  maxInterval: 90000, // 90s
  activeEvent: null,
  eventTimers: [],
  
  start() {
    this._scheduleNext();
  },
  
  stop() {
    this.activeEvent = null;
    this.eventTimers.forEach(t => clearTimeout(t));
    this.eventTimers = [];
  },
  
  _scheduleNext() {
    const delay = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    const timer = setTimeout(() => this._triggerRandom(), delay);
    this.eventTimers.push(timer);
  },
  
  _triggerRandom() {
    const events = ['supply_drop', 'threat_reinforcements', 'signal_flare', 'jammer_surge'];
    // Add extraction_shift conditionally
    if (state.objectives.some(o => o.type === 'Extraction') && 
        state.objectives.filter(o => o.found).length / state.objectives.length > 0.7) {
      events.push('extraction_shift');
    }
    const event = events[Math.floor(Math.random() * events.length)];
    this.activate(event);
    this._scheduleNext();
  },
  
  activate(type) {
    this.activeEvent = type;
    switch(type) {
      case 'supply_drop': this._supplyDrop(); break;
      case 'threat_reinforcements': this._threatReinforcements(); break;
      case 'signal_flare': this._signalFlare(); break;
      case 'jammer_surge': this._jammerSurge(); break;
      case 'extraction_shift': this._extractionShift(); break;
    }
  },
  
  // Each event handler:
  _supplyDrop() { ... },
  _threatReinforcements() { ... },
  _signalFlare() { ... },
  _jammerSurge() { ... },
  _extractionShift() { ... },
  
  tick() { /* called from simulateWorld to check active event timers/expiry */ }
};
```

### State Additions

```js
// In state object
state.dynamicEvents: {
  lastEventTime: 0,
  activeEvent: null, // string or null
  eventData: {}, // type-specific data
  supplyDropLooted: false,
  flareMarkerId: null,
  jammerSurgeUntil: 0,
  extraThreatIds: [],
  extractionShifted: false,
  extractionShiftDeadline: 0,
}
```

### Hooks into Existing Systems

- **startMissionClock()** (line 5251): Add `DynamicEvents.start()` after timer starts
- **simulateWorld()** (line 5303): Add `DynamicEvents.tick()` in the main tick
- **stopMissionClock()** (line 5294): Add `DynamicEvents.stop()`
- **renderMissionMap()** (line 6019): Add event-specific map markers (supply crate, flare, shifted extraction)
- **renderHUD()** (line 5949): Add event status indicators (jammer surge banner, extraction shift timer)

---

## Task 4 — Deployable Drones (3 Types, Any Role)

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~300-400

### Core Design Shift

Remove "Drone" as a role. The Drone role stays in the game but its abilities are repurposed. Drones become **deployable tools** that any role can use via a new UI. This is a significant architectural change but dramatically increases strategic depth.

### The 3 Drone Types

#### 4A — Scout Drone
- **Purpose:** Auto-reveals Fog of War along its path for 120s
- **Deploy:** Click on map to set a patrol route (2-4 waypoints) or just click once for hover
- **Battery:** 120 seconds
- **Speed:** Moves at 1.5x player speed along waypoints
- **Vision:** Reveals 60m radius fog around it continuously
- **If destroyed by threat:** Camera static effect on deployer's screen + "Scout drone lost" message
- **Visual:** Small blue dot on map with a line showing its path, camera feed overlay

#### 4B — Decoy Drone
- **Purpose:** Attracts nearby threats for 15s
- **Deploy:** Click on map position (or use ability to deploy at current location)
- **Effect:** Emits a strong signal pulse that draws threats within 120m toward it instead of agents
- **Duration:** 15 seconds active, then self-destructs
- **Threat reaction:** Threats change target to decoy position for duration
- **Visual:** Orange/yellow beacon icon pulsing on map, with an attractor ring

#### 4C — Shield Drone
- **Purpose:** Creates a projectile shield around the player for 30s
- **Deploy:** Auto-deploys at player's current position, follows player at 20m offset
- **Effect:** Reduces threat jamming damage by 60% while active
- **Duration:** 30 seconds
- **If player leaves 40m range:** Drone moves to catch up
- **Visual:** Green shield ring around player on map, hex grid overlay on screen

### Drone State Machine

Each drone follows: `idle → deploying → patrolling/active → recalling → cooldown` or `idle → deploying → active → destroyed → cooldown`

```js
// State
state.drones: [], // { id, type, state, lat, lng, waypoints, battery, maxBattery, 
                  //   deployedAt, ownerId, targetId, shieldRadius, ... }

const DRONE_CONFIG = {
  scout:  { maxBattery: 120, speed: 0.0006, revealRadius: 60, icon: '🛸', color: '#58a6ff' },
  decoy:  { duration: 15, attractRadius: 120, icon: '🎯', color: '#f0883e' },
  shield: { duration: 30, shieldRadius: 20, damageReduction: 0.6, followOffset: 20, icon: '🛡️', color: '#3fb950' },
};
```

### Deploy UI

- New **"Deploy Drone"** button in the ability hotbar (4th slot, key `R`)
- Clicking opens a crosshair overlay on the map: "Click on map to deploy [drone type]"
- A drone selection bar appears below the hotbar (3 small icons: Scout/Decoy/Shield) — **only visible if player has drones available**
- Each player gets **1 drone charge per mission** by default (could be increased via loadout consumable)

### HTML/CSS Additions

```html
<!-- In mission screen, after abilityHotbar -->
<div id="droneBar" class="drone-bar hidden">
  <button class="drone-btn" data-drone="scout" title="Scout Drone (120s)">🛸 Scout</button>
  <button class="drone-btn" data-drone="decoy" title="Decoy Drone (15s)">🎯 Decoy</button>
  <button class="drone-btn" data-drone="shield" title="Shield Drone (30s)">🛡️ Shield</button>
  <span class="drone-charge">Charges: <span id="droneCharges">1</span></span>
</div>

<!-- Drone HUD indicators -->
<div id="droneHUD" class="drone-hud hidden">
  <div id="droneStatus" class="drone-status">Scout Drone — 87s remaining</div>
  <div id="droneBatteryBar" class="drone-battery-bar"><div class="drone-battery-fill" style="width:100%"></div></div>
</div>
```

```css
.drone-bar { ... }     /* flex row, bottom of screen, above ability hotbar */
.drone-btn { ... }      /* compact button with drone type */
.drone-btn.active { ... } /* selected state */
.drone-btn.cooldown { ... } /* used state */
.drone-hud { ... }      /* small indicator panel showing drone status */
.drone-battery-bar { ... }
.drone-battery-fill { ... }
.deploy-crosshair { ... } /* full-screen crosshair overlay when placing drone */
```

### JS Module

```js
// New module (insert after ActiveBuffs at ~line 6400)
const DroneSystem = {
  drones: [],
  maxDronesPerPlayer: 1,
  deployMode: false, // true = waiting for map click
  
  // Init
  init() {
    // Wire drone bar buttons
    // Add click-to-deploy on map when in deploy mode
    // Setup HUD refresh interval
  },
  
  // API
  canDeploy(playerId) {
    const active = this.drones.filter(d => d.ownerId === playerId && d.state !== 'recalling' && d.state !== 'destroyed');
    return active.length < this.maxDronesPerPlayer;
  },
  
  deploy(type, lat, lng, ownerId) {
    // Create drone object
    // Run deployment animation
    // Add to state.drones
  },
  
  recall(droneId) {
    // Set state to 'recalling'
    // Animate return to player
    // Remove after animation
  },
  
  tick() { 
    // Called from simulateWorld every 2.5s
    // Update battery, position, check threats
    // Scout: auto-reveal fog
    // Decoy: attract nearby threats
    // Shield: apply damage reduction to owner
  },
  
  // Rendering
  renderOnMap() { ... }, // Called from renderMissionMap
  renderHUD() { ... },   // Called from renderHUD
};
```

### Integration Points

- **AbilityHotbar** (line 6182): Add a 4th slot for "Deploy Drone" key `R`
- **simulateWorld()** (line 5303): Call `DroneSystem.tick()` each cycle
- **renderMissionMap()** (line 6019): Call `DroneSystem.renderOnMap()`
- **renderHUD()** (line 5949): Call `DroneSystem.renderHUD()`
- **FogOfWar** (line 543): Scout drone positions should also reveal fog — add drone positions to `lastPositions` in `FogOfWar.update()`
- **Threat AI** (line 5307): Decoy drone should be treated as a target for threats — add to `state.agents` as a pseudo-agent or reference in hunt target resolution
- **Ability cooldown system**: Drone deployment gets a cooldown separate from regular abilities
- **MapModule**: Add `addDrone()` / `removeDrone()` methods for map rendering

### Threat-Drone Interaction

In the threat hunt targeting loop (`simulateWorld` ~line 5453), add:

```js
// Check if any decoy drone is active and nearby
const activeDecoy = DroneSystem.drones.find(d => d.type === 'decoy' && d.state === 'active');
if (activeDecoy && haversine(t, activeDecoy) < DRONE_CONFIG.decoy.attractRadius) {
  // Decoy overrides hunt target
  t.targetId = activeDecoy.id; // use a special prefix like 'drone-'+id
  t.lat += (activeDecoy.lat - t.lat) * 0.3; // move toward decoy
  t.lng += (activeDecoy.lng - t.lng) * 0.3;
  return;
}
```

---

## Appendix: File Map

| File | Path | Size |
|------|------|------|
| Main JS | `game-v2.js` | 7470 lines / 284KB |
| HTML | `index.html` | 697 lines / 32KB |
| CSS | `styles-v2.css` | 3687 lines / 92KB |

### Where to Insert Code

**game-v2.js insertion points:**

| Feature | Insert After | Approx Line |
|---------|-------------|-------------|
| Loadout screen | After `initRolesScreen()` (~line 4600) | ~4600 |
| Loadout bonuses | In `startMissionClock()` (~line 5285) | ~5285 |
| HVT objective type | In `generateObjectives()` + `simulateWorld()` | ~4830, ~5710 |
| DataIntercept type | Same sections as HVT | ~4830, ~5710 |
| RelayActivation type | Same sections as HVT | ~4830, ~5710 |
| DynamicEvents module | After `ActiveBuffs` (~line 6400) | ~6400 |
| DroneSystem module | After `DynamicEvents` | ~6500 |
| Drone fog reveal | In `FogOfWar.update()` (~line 591) | ~591 |

**index.html insertion points:**

| Feature | Insert After | Approx Line |
|---------|-------------|-------------|
| Loadout screen div | After `briefingScreen` div (line 330) | ~331 |
| Drone bar HTML | After `activeBuffs` div (line 437) | ~437 |
| Drone HUD | After drone bar | ~437 |

**styles-v2.css insertion points:**

| Feature | Approx Location |
|---------|----------------|
| Loadout styles | End of file (~line 3687) |
| Drone bar/HUD styles | End of file |
| Dynamic event styles (supply crate, flare marker) | End of file |

---

## Appendix: Game Design Patterns Reference

### State Machine Pattern (used by drones)
```
idle → deploying → active → recalling → cooldown
                    ↓
                destroyed → cooldown
```

### Timer Pattern (used by events, objectives)
```js
// Each timer: { startAt, duration, callback, label }
// Polled in simulateWorld() or a dedicated interval
```

### Observer Pattern (used by events -> HUD)
```js
// Events emit to EventLog, ScreenJuice, and directly modify state
// renderHUD() picks up state changes passively
```

### Queue Pattern (used by event scheduling)
```js
// DynamicEvents maintains a queue of pending events
// Each event has weight-based probability
// Events can't repeat until all have fired at least once
```

### Cooldown/Lifespan Pattern (used by drones, buffs)
```js
// { deployedAt: Date.now(), lifespan: 120000 }
// tick() checks: Date.now() - deployedAt > lifespan → expire
```

---

## Task 5 — Radar + Canvas Z-Index Layer Fix (BUG FIX — HIGH PRIORITY)

**Effort:** Tiny | **Impact:** 5/5 | **Lines:** ~20-30

### Problem
When the radar is toggled to fullscreen mode (`.radar-fullscreen` at z-index:10), the FogOfWar canvas (z-index:2) draws a solid `#111820` fill over the map area. Since the fullscreen radar has `background: rgba(11,15,20,0.65)`, the user sees fog dark through the radar instead of the actual map tiles. The map is rendered correctly underneath — it's just covered by the fog layer.

### Fix already applied
- `.fog-canvas` CSS class added to styles-v2.css (was missing)
- FogOfWar skips its dark fill when `RadarModule.fullscreen === true`
- FogOfWar inline z-index removed (CSS handles it now)

### Remaining tasks (for Kimi to handle):
1. Verify the fix works — navigate to mission screen, toggle radar fullscreen, check that map tiles are visible behind the 65% semi-transparent radar circle
2. Add logic to resize fogCanvas and particleCanvas to full viewport when radar enters fullscreen (they currently size to missionMap which may not match viewport dimensions)
3. Add F key toggle for fog of war (currently only toggleable via JS)
4. Test the interaction between all 3 canvases: particle (z:1), fog (z:2), radar (z:3 compact / z:10 fullscreen)

### Where to insert
- **game-v2.js**: FogOfWar._resize() — add fullscreen-aware sizing, FogOfWar._render() — already patched
- **styles-v2.css**: Already has .fog-canvas definition
- **index.html**: Already has `<canvas id="fogCanvas" class="fog-canvas">`

---

*Research conducted May 2026. All estimates based on existing codebase patterns and architectural constraints.*
