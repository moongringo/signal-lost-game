# Phase 4 — Weather, Terrain, Revive, Traps, Supply Caches & Role Progression

**Signal Lost v2** — 8,151-line monolithic game-v2.js  
**Current state:** Phase 3 complete (AI Threat Behavior, Team Score Tracking, Full-Screen Radar, Sound Effects, Mobile Panel Drawers, Deployable Drones, Dynamic Mission Events). StealthMode exists as a basic toggle.
**Existing modules:** ParticleSystem, ScreenJuice, CommandWheel, DamageNumbers, KillFeed, FogOfWar, Threat AI + Ally AI, Compass, Countdown, Role ambients, AbilityHotbar, ActiveBuffs, EventLog, RadarModule, StealthMode, DayNightCycle, DynamicEvents, DroneSystem, MapModule  
**7 roles:** Drone, Mechanic, Medic, Decoder, Navigator, Courier, Mission Control

---

## Priority Ranking

| # | Feature | Effort | Impact | Lines |
|---|---------|--------|--------|-------|
| 1 | Weather System | Medium | 5/5 | ~250-300 |
| 2 | Downed & Revive System | Medium | 5/5 | ~200-250 |
| 3 | Terrain System (High Ground / Buildings / Zones) | Medium | 4/5 | ~200-250 |
| 4 | Proximity Trap System | Medium | 4/5 | ~180-220 |
| 5 | Supply Cache Drops | Small | 4/5 | ~120-150 |
| 6 | Role Progression (XP & Abilities) | Large | 5/5 | ~300-350 |

**Rationale:** Weather is the biggest atmospheric upgrade — it touches signal, vision, and threat behavior all at once. Revive creates team dependency and raises stakes. Terrain adds strategic positioning. Traps give players agency against threats. Supply caches extend DynamicEvents with player-initiated risk/reward. Role progression is the long-term retention hook.

---

## Task 1 — Weather System

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design

A `WeatherSystem` module that rolls a random weather condition at mission start and can shift once mid-mission. Weather affects signal strength, vision radius, threat behavior, and drone effectiveness. Visual feedback via CSS overlay + HUD indicator.

### Weather Types (4)

| Type | Signal | Vision | Threats | Drones | Visual |
|------|--------|--------|---------|--------|--------|
| **Clear** | +5% | Normal | Normal | Normal | None (default) |
| **Rain** | -15% | Normal | Slower patrol | Battery drain 2x | Blue-grey overlay, rain streaks CSS |
| **Fog** | -5% | 60% range | Harder to detect (×0.7 range) | Scout vision 40% | Grey-white overlay, low opacity |
| **Wind** | Normal | Normal | Unpredictable paths | Drift off course 20% | Subtle screen shake + leaf particles |

### State Additions

```js
// In state object (after dynamicEvents, ~line 260)
weather: {
  type: 'clear',        // 'clear' | 'rain' | 'fog' | 'wind'
  startedAt: 0,         // timestamp
  shiftAt: 0,           // timestamp when weather may shift (mid-mission)
  intensity: 1.0,       // 0.5 - 1.5 multiplier
},
```

### JS Implementation

```js
// New module (insert after DynamicEvents at ~line 7420)
const WeatherSystem = {
  TYPES: ['clear', 'rain', 'fog', 'wind'],
  WEIGHTS: [0.45, 0.25, 0.20, 0.10], // weighted random
  SHIFT_CHANCE: 0.35, // 35% chance to shift mid-mission

  init() {
    const type = this._roll();
    state.weather = { type, startedAt: Date.now(), intensity: 0.8 + Math.random() * 0.7, shiftAt: 0 };
    // Schedule potential mid-mission shift at 40-60% of mission duration
    const shiftDelay = (state.duration * 0.4 + Math.random() * state.duration * 0.2) * 1000;
    state.weather.shiftAt = Date.now() + shiftDelay;
    this._applyVisuals();
    addChat('System', `Weather: ${this._label(type)} — ${this._desc(type)}`);
  },

  _roll() {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < this.TYPES.length; i++) {
      cum += this.WEIGHTS[i];
      if (r <= cum) return this.TYPES[i];
    }
    return 'clear';
  },

  _label(t) { return { clear: 'Clear', rain: 'Rain', fog: 'Fog', wind: 'Wind' }[t]; },
  _desc(t) {
    return {
      clear: 'Optimal conditions.',
      rain: 'Signal dampened. Drone batteries drain faster.',
      fog: 'Visibility reduced. Threats harder to spot.',
      wind: 'Unstable air. Drones may drift off course.'
    }[t];
  },

  tick() {
    // Check for mid-mission shift
    if (state.weather.shiftAt && Date.now() > state.weather.shiftAt) {
      state.weather.shiftAt = 0;
      if (Math.random() < this.SHIFT_CHANCE) {
        const newType = this._roll();
        if (newType !== state.weather.type) {
          state.weather.type = newType;
          state.weather.startedAt = Date.now();
          this._applyVisuals();
          addChat('System', `Weather shift: ${this._label(newType)}!`);
          EventLog.add('event', '🌦️', `<strong>Weather Shift</strong> ${this._label(newType)}`);
          ScreenJuice.addKillFeed('WEATHER SHIFT: ' + this._label(newType).toUpperCase(), '#8aa3bf');
        }
      }
    }
  },

  // Modifiers called by other systems
  signalMultiplier() {
    const m = { clear: 1.05, rain: 0.85, fog: 0.95, wind: 1.0 };
    return (m[state.weather.type] || 1.0) * state.weather.intensity;
  },

  visionMultiplier() {
    const m = { clear: 1.0, rain: 1.0, fog: 0.6, wind: 1.0 };
    return m[state.weather.type] || 1.0;
  },

  threatDetectMultiplier() {
    const m = { clear: 1.0, rain: 1.0, fog: 0.7, wind: 1.0 };
    return m[state.weather.type] || 1.0;
  },

  droneBatteryDrain() {
    return state.weather.type === 'rain' ? 2.0 : 1.0;
  },

  _applyVisuals() {
    const body = document.body;
    body.dataset.weather = state.weather.type;
    // Remove old overlay if any
    let overlay = document.getElementById('weatherOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'weatherOverlay';
      overlay.className = 'weather-overlay';
      document.body.appendChild(overlay);
    }
    overlay.className = 'weather-overlay weather-' + state.weather.type;
    if (state.weather.type === 'clear') {
      overlay.style.opacity = '0';
    } else {
      overlay.style.opacity = String(0.15 + (state.weather.intensity - 0.8) * 0.2);
    }
  },

  renderHUD() {
    const el = document.getElementById('weatherHUD');
    if (!el) return;
    const icons = { clear: '☀️', rain: '🌧️', fog: '🌫️', wind: '💨' };
    el.textContent = `${icons[state.weather.type] || '☀️'} ${this._label(state.weather.type)}`;
  }
};
```

### Integration Points

- **startMissionClock()** (~line 5612): Add `WeatherSystem.init()` after `DynamicEvents.start()`
- **simulateWorld()** (~line 5626): Add `WeatherSystem.tick()` in main tick loop
- **renderHUD()** (~line 6419): Add `WeatherSystem.renderHUD()` call + ensure `#weatherHUD` exists
- **simulateWorld() threat detection** (~line 5656): Multiply `baseDetectRange` by `WeatherSystem.threatDetectMultiplier()`
- **RadarModule** (~line 1974): In `draw()`, scale radar range by `WeatherSystem.visionMultiplier()` when in fog
- **DroneSystem.tick()** (if exists): Multiply battery drain by `WeatherSystem.droneBatteryDrain()`
- **Any signal calculation** (e.g., ability effects, threat jamming): Multiply by `WeatherSystem.signalMultiplier()`

### HTML Additions (index.html)

```html
<!-- In mission HUD header area, after missionStatus or inside hudTop -->
<div id="weatherHUD" class="weather-hud" title="Current weather conditions">☀️ Clear</div>
```

### CSS Additions (styles-v2.css)

```css
.weather-hud {
  position: fixed;
  top: 12px;
  right: 140px; /* left of timer */
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  background: rgba(11,15,20,0.7);
  padding: 3px 8px;
  border-radius: 6px;
  z-index: 20;
  pointer-events: none;
  transition: opacity 0.5s;
}
.weather-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 2s ease;
}
.weather-rain { background: linear-gradient(180deg, rgba(100,140,180,0.15) 0%, rgba(80,100,130,0.08) 100%); }
.weather-fog { background: radial-gradient(circle at 50% 50%, rgba(200,210,220,0.08) 0%, rgba(180,190,200,0.18) 100%); }
.weather-wind { background: linear-gradient(90deg, rgba(140,160,140,0.03) 0%, rgba(160,180,160,0.08) 50%, rgba(140,160,140,0.03) 100%); }
```

---

## Task 2 — Downed & Revive System

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~200-250

### Design

When an agent's stamina drops to 0, they are **downed** (not eliminated). Downed agents cannot move, use abilities, or collect objectives. They have 60 seconds to be revived by a Medic (or any agent within 5m using a consumable). If not revived in time, they are **eliminated** and become spectators.

### State Additions

```js
// In state object (~line 262)
downedAgents: {}, // agentId -> { downedAt: timestamp, revivedBy: null, eliminated: false }
```

### JS Implementation

```js
// New module (insert after WeatherSystem at ~line 7700)
const ReviveSystem = {
  DOWN_TIME: 60000,      // 60s to revive
  REVIVE_RANGE: 5,       // meters
  MEDIC_REVIVE_TIME: 3000, // 3s channel for Medic
  STANDARD_REVIVE_TIME: 8000, // 8s channel for non-Medic

  down(agentId, reason = 'Stamina depleted') {
    if (state.downedAgents[agentId]) return; // already downed
    const agent = state.agents.find(a => a.id === agentId);
    if (!agent) return;
    state.downedAgents[agentId] = {
      downedAt: Date.now(),
      lat: agent.lat,
      lng: agent.lng,
      revivedBy: null,
      eliminated: false,
      reason
    };
    agent.stamina = 0;
    agent._downed = true;
    addChat('System', `🚨 ${agent.name} (${agent.callsign}) is DOWN! ${this.DOWN_TIME/1000}s to revive.`);
    EventLog.add('alert', '🚨', `<strong>Agent Down</strong> ${agent.callsign} needs extraction!`);
    ScreenJuice.addKillFeed(`${agent.callsign} IS DOWN`, '#e45b4d');
    SoundFX.play(200, 0.15, 'sawtooth', 0.3);
    saveState();
  },

  canRevive(reviverId, targetId) {
    const reviver = state.agents.find(a => a.id === reviverId);
    const target = state.downedAgents[targetId];
    if (!reviver || !target || target.eliminated || target.revivedBy) return false;
    const dist = haversine(reviver, { lat: target.lat, lng: target.lng });
    return dist <= this.REVIVE_RANGE;
  },

  startRevive(reviverId, targetId) {
    if (!this.canRevive(reviverId, targetId)) return false;
    const reviver = state.agents.find(a => a.id === reviverId);
    const isMedic = reviver && reviver.role === 'Medic';
    const duration = isMedic ? this.MEDIC_REVIVE_TIME : this.STANDARD_REVIVE_TIME;
    state.downedAgents[targetId].reviveChannel = {
      reviverId,
      startedAt: Date.now(),
      duration
    };
    addChat('System', `${reviver.name} is reviving ${targetId}…`);
    return true;
  },

  tick() {
    const now = Date.now();
    Object.entries(state.downedAgents).forEach(([agentId, data]) => {
      if (data.eliminated) return;
      // Check revive channel completion
      if (data.reviveChannel) {
        if (now - data.reviveChannel.startedAt >= data.reviveChannel.duration) {
          this._completeRevive(agentId, data.reviveChannel.reviverId);
        } else {
          // Check if reviver moved out of range
          if (!this.canRevive(data.reviveChannel.reviverId, agentId)) {
            data.reviveChannel = null;
            addChat('System', 'Revive interrupted — target moved out of range.');
          }
        }
      }
      // Check elimination timeout
      if (now - data.downedAt > this.DOWN_TIME && !data.revivedBy) {
        this._eliminate(agentId);
      }
    });
  },

  _completeRevive(agentId, reviverId) {
    const agent = state.agents.find(a => a.id === agentId);
    const reviver = state.agents.find(a => a.id === reviverId);
    if (!agent) return;
    agent.stamina = 40; // revive with partial stamina
    agent._downed = false;
    state.downedAgents[agentId].revivedBy = reviverId;
    state.downedAgents[agentId].reviveChannel = null;
    addChat('System', `✅ ${agent.name} revived by ${reviver ? reviver.name : 'Unknown'}!`);
    EventLog.add('ability', '✅', `<strong>Revived</strong> ${agent.callsign} is back in the fight`);
    ScreenJuice.addKillFeed(`${agent.callsign} REVIVED`, '#4caf50');
    SoundFX.play(523, 0.1, 'sine', 0.15);
    saveState();
  },

  _eliminate(agentId) {
    const agent = state.agents.find(a => a.id === agentId);
    if (!agent) return;
    state.downedAgents[agentId].eliminated = true;
    agent._eliminated = true;
    addChat('System', `💀 ${agent.name} (${agent.callsign}) has been ELIMINATED.`);
    EventLog.add('alert', '💀', `<strong>Eliminated</strong> ${agent.callsign} is KIA`);
    ScreenJuice.addKillFeed(`${agent.callsign} ELIMINATED`, '#ff0000');
    SoundFX.play(150, 0.2, 'sawtooth', 0.4);
    saveState();
  },

  isDowned(agentId) {
    const d = state.downedAgents[agentId];
    return d && !d.eliminated && !d.revivedBy;
  },

  isEliminated(agentId) {
    const d = state.downedAgents[agentId];
    return d && d.eliminated;
  },

  renderOnMap() {
    // Add downed markers to map
    Object.entries(state.downedAgents).forEach(([agentId, data]) => {
      if (data.eliminated || data.revivedBy) return;
      const remaining = Math.max(0, this.DOWN_TIME - (Date.now() - data.downedAt));
      MapModule.addBeacon('downed-' + agentId, data.lat, data.lng, `🚨 DOWN ${Math.ceil(remaining/1000)}s`);
    });
  },

  renderHUD() {
    // Show downed squadmates in objective panel
    const downed = Object.entries(state.downedAgents)
      .filter(([_, d]) => !d.eliminated && !d.revivedBy)
      .map(([id, d]) => {
        const agent = state.agents.find(a => a.id === id);
        const remaining = Math.max(0, this.DOWN_TIME - (Date.now() - d.downedAt));
        return { name: agent ? agent.callsign : id, remaining, lat: d.lat, lng: d.lng };
      });
    if (!downed.length) return;
    // Injected into renderObjectivesList or as a separate panel section
  }
};
```

### Integration Points

- **simulateWorld() stamina drain** (~line 5626): When stamina hits 0, call `ReviveSystem.down(agent.id)` instead of just capping at 0
- **simulateWorld() main tick** (~line 5626): Add `ReviveSystem.tick()` call
- **renderMissionMap()** (~line 6504): Add `ReviveSystem.renderOnMap()` call
- **Ability usage** (~line 6680+): Block abilities if `ReviveSystem.isDowned(state.localAgentId)`
- **Objective collection** (~line 6050+): Block if downed
- **Movement/GPS updates** (~line 1000+): Freeze lat/lng for downed agents
- **renderHUD()** (~line 6419): Add downed indicator + revive progress bar

### HTML Additions (index.html)

```html
<!-- In mission screen, as a floating alert panel -->
<div id="downedAlert" class="downed-alert hidden">
  <div class="downed-title">🚨 YOU ARE DOWNED</div>
  <div class="downed-timer">Revive in <span id="downedCountdown">60</span>s</div>
  <div class="downed-hint">A Medic can revive you faster. Stay close to squad.</div>
</div>
```

### CSS Additions (styles-v2.css)

```css
.downed-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(228, 91, 77, 0.92);
  color: #fff;
  padding: 24px 32px;
  border-radius: var(--radius);
  text-align: center;
  z-index: 200;
  box-shadow: 0 0 40px rgba(228,91,77,0.4);
  animation: downedPulse 1.5s ease-in-out infinite;
}
.downed-title { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
.downed-timer { font-size: 32px; font-weight: 700; margin: 8px 0; }
.downed-hint { font-size: 12px; opacity: 0.9; }
@keyframes downedPulse {
  0%, 100% { box-shadow: 0 0 40px rgba(228,91,77,0.4); }
  50% { box-shadow: 0 0 60px rgba(228,91,77,0.7); }
}
.agent-downed { filter: grayscale(0.8) brightness(0.6); }
```

---

## Task 3 — Terrain System

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

Mission zones are divided into terrain cells (200m grid). Each cell has a terrain type that affects signal, movement, and threat line-of-sight. Terrain is procedurally generated at mission start based on city + random seed.

### Terrain Types

| Type | Signal | Threat LOS | Visual |
|------|--------|-----------|--------|
| **Open** | Normal | Full | Default |
| **High Ground** | +20% | Full | Slightly brighter map tint |
| **Urban** | -10% | Blocked beyond 80m | Building icons on map |
| **Woods** | -5% | Reduced to 60% | Green tint, tree icons |
| **Water** | -30% | Full | Blue tint, impassable for threats |

### State Additions

```js
// In state object (~line 264)
terrainGrid: [], // array of { lat, lng, type, radius }
```

### JS Implementation

```js
// New module (insert after ReviveSystem at ~line 7950)
const TerrainSystem = {
  CELL_SIZE: 0.0018, // ~200m in degrees
  TYPES: ['open', 'high_ground', 'urban', 'woods', 'water'],
  WEIGHTS: [0.35, 0.15, 0.25, 0.20, 0.05],

  generate(center) {
    const grid = [];
    const rows = 7, cols = 7;
    const startLat = center[0] - (rows * this.CELL_SIZE) / 2;
    const startLng = center[1] - (cols * this.CELL_SIZE) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = this._rollType();
        grid.push({
          lat: startLat + r * this.CELL_SIZE + this.CELL_SIZE / 2,
          lng: startLng + c * this.CELL_SIZE + this.CELL_SIZE / 2,
          type,
          radius: this.CELL_SIZE * 0.55 // slight overlap for smooth blending
        });
      }
    }
    state.terrainGrid = grid;
    return grid;
  },

  _rollType() {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < this.TYPES.length; i++) {
      cum += this.WEIGHTS[i];
      if (r <= cum) return this.TYPES[i];
    }
    return 'open';
  },

  getTerrainAt(lat, lng) {
    if (!state.terrainGrid.length) return 'open';
    let nearest = state.terrainGrid[0];
    let minD = Infinity;
    for (const cell of state.terrainGrid) {
      const d = haversine({ lat, lng }, cell);
      if (d < minD) { minD = d; nearest = cell; }
    }
    return nearest.type;
  },

  signalModifier(lat, lng) {
    const t = this.getTerrainAt(lat, lng);
    const mods = { open: 1.0, high_ground: 1.2, urban: 0.9, woods: 0.95, water: 0.7 };
    return mods[t] || 1.0;
  },

  threatDetectModifier(lat, lng) {
    const t = this.getTerrainAt(lat, lng);
    const mods = { open: 1.0, high_ground: 1.0, urban: 0.8, woods: 0.6, water: 1.0 };
    return mods[t] || 1.0;
  },

  isPassableForThreat(lat, lng) {
    return this.getTerrainAt(lat, lng) !== 'water';
  },

  label(type) {
    return { open: 'Open', high_ground: 'High Ground', urban: 'Urban', woods: 'Woods', water: 'Water' }[type] || type;
  },

  icon(type) {
    return { open: '', high_ground: '⛰️', urban: '🏢', woods: '🌲', water: '💧' }[type] || '';
  },

  renderOnMap() {
    state.terrainGrid.forEach(cell => {
      const color = {
        open: null,
        high_ground: 'rgba(255,255,200,0.06)',
        urban: 'rgba(100,120,140,0.08)',
        woods: 'rgba(80,140,80,0.06)',
        water: 'rgba(80,140,200,0.10)'
      }[cell.type];
      if (color) {
        MapModule.drawZone(cell.lat, cell.lng, this.CELL_SIZE * 5550, color); // approximate meters
      }
      // Add terrain icon for urban/woods/high_ground
      if (cell.type !== 'open') {
        MapModule.addBeacon('terrain-' + cell.lat + '-' + cell.lng, cell.lat, cell.lng, this.icon(cell.type));
      }
    });
  },

  renderHUD() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local) return;
    const t = this.getTerrainAt(local.lat, local.lng);
    const el = document.getElementById('terrainHUD');
    if (el) el.textContent = `${this.icon(t)} ${this.label(t)}`;
  }
};
```

### Integration Points

- **startMissionClock()** (~line 5612): Add `TerrainSystem.generate(getMissionCenter())` after `WeatherSystem.init()`
- **renderMissionMap()** (~line 6504): Add `TerrainSystem.renderOnMap()` call
- **renderHUD()** (~line 6419): Add `TerrainSystem.renderHUD()` call
- **simulateWorld() signal calculations** (~line 5626): Multiply agent signal by `TerrainSystem.signalModifier(agent.lat, agent.lng)`
- **simulateWorld() threat detection** (~line 5656): Multiply detect range by `TerrainSystem.threatDetectModifier(agent.lat, agent.lng)`
- **simulateWorld() threat movement** (~line 5680): Skip water cells: `if (!TerrainSystem.isPassableForThreat(newLat, newLng)) return;`

### HTML Additions (index.html)

```html
<!-- In HUD header, near weatherHUD -->
<div id="terrainHUD" class="terrain-hud" title="Current terrain">Open</div>
```

### CSS Additions (styles-v2.css)

```css
.terrain-hud {
  position: fixed;
  top: 12px;
  right: 220px; /* left of weatherHUD */
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  background: rgba(11,15,20,0.7);
  padding: 3px 8px;
  border-radius: 6px;
  z-index: 20;
  pointer-events: none;
}
```

---

## Task 4 — Proximity Trap System

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~180-220

### Design

Players can deploy 3 types of traps via the ability hotbar (new trap ability, key `T`). Traps are placed at current GPS position and trigger when threats (or in some cases, agents) enter their radius. Each player gets 2 trap charges per mission.

### Trap Types

| Type | Trigger | Effect | Duration |
|------|---------|--------|----------|
| **Proximity Mine** | Threat within 15m | Eliminates threat instantly, -15 stamina to nearby agents | One use |
| **Trip Flare** | Threat within 10m | Reveals threat on all maps for 20s, no damage | One use |
| **Decoy Signal** | Threat within 25m | Draws all threats within 100m to trap location for 12s | One use |

### State Additions

```js
// In state object (~line 266)
traps: [], // { id, type, lat, lng, ownerId, triggered, triggeredAt, placedAt }
```

### JS Implementation

```js
// New module (insert after TerrainSystem at ~line 8200)
const TrapSystem = {
  CHARGES_PER_PLAYER: 2,
  CONFIG: {
    mine:   { radius: 15, damage: 999, agentStaminaDrain: 15, icon: '💥', color: '#e45b4d', label: 'Proximity Mine' },
    flare:  { radius: 10, revealDuration: 20000, icon: '🔦', color: '#ffd700', label: 'Trip Flare' },
    decoy:  { radius: 25, attractRadius: 100, attractDuration: 12000, icon: '📡', color: '#f0883e', label: 'Decoy Signal' }
  },

  place(type, lat, lng, ownerId) {
    const charges = this._getCharges(ownerId);
    if (charges <= 0) {
      addChat('System', 'No trap charges remaining.');
      return false;
    }
    const trap = {
      id: 'trap-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type,
      lat, lng, ownerId,
      triggered: false,
      triggeredAt: 0,
      placedAt: Date.now()
    };
    state.traps.push(trap);
    this._setCharges(ownerId, charges - 1);
    addChat('System', `${this.CONFIG[type].icon} ${this.CONFIG[type].label} placed.`);
    EventLog.add('ability', this.CONFIG[type].icon, `<strong>${this.CONFIG[type].label}</strong> Deployed`);
    SoundFX.play(600, 0.06, 'sine', 0.08);
    saveState();
    return true;
  },

  tick() {
    state.traps.forEach(trap => {
      if (trap.triggered) return;
      const cfg = this.CONFIG[trap.type];
      // Check threats
      state.threats.forEach(t => {
        const d = haversine(t, trap);
        if (d <= cfg.radius) {
          this._trigger(trap, t);
        }
      });
    });
    // Clean up old triggered traps after 30s
    state.traps = state.traps.filter(t => {
      if (!t.triggered) return true;
      return Date.now() - t.triggeredAt < 30000;
    });
  },

  _trigger(trap, threat) {
    trap.triggered = true;
    trap.triggeredAt = Date.now();
    const cfg = this.CONFIG[trap.type];
    switch (trap.type) {
      case 'mine':
        // Remove threat
        state.threats = state.threats.filter(t => t.id !== threat.id);
        // Drain nearby agents
        state.agents.forEach(a => {
          if (haversine(a, trap) <= cfg.radius * 1.5) {
            a.stamina = Math.max(0, a.stamina - cfg.agentStaminaDrain);
          }
        });
        addChat('System', `💥 Mine detonated! ${threat.name} eliminated.`);
        ScreenJuice.addKillFeed('MINE DETONATED', '#e45b4d');
        SoundFX.play(150, 0.2, 'square', 0.3);
        ParticleSystem.burst(trap.lat, trap.lng, ['#ff4444', '#ff8800'], 12);
        break;
      case 'flare':
        trap.revealedThreatId = threat.id;
        trap.revealUntil = Date.now() + cfg.revealDuration;
        addChat('System', `🔦 Flare triggered! ${threat.name} revealed for ${cfg.revealDuration/1000}s.`);
        ScreenJuice.addKillFeed('FLARE TRIGGERED', '#ffd700');
        SoundFX.play(880, 0.1, 'sine', 0.15);
        break;
      case 'decoy':
        trap.attractUntil = Date.now() + cfg.attractDuration;
        addChat('System', `📡 Decoy active! Threats drawn to location for ${cfg.attractDuration/1000}s.`);
        ScreenJuice.addKillFeed('DECOY SIGNAL ACTIVE', '#f0883e');
        SoundFX.play(440, 0.08, 'sine', 0.2);
        break;
    }
    saveState();
  },

  // Called from threat AI to check if a decoy is active
  getActiveDecoy() {
    return state.traps.find(t => t.type === 'decoy' && t.triggered && Date.now() < (t.attractUntil || 0));
  },

  _getCharges(ownerId) {
    if (!state.trapCharges) state.trapCharges = {};
    if (state.trapCharges[ownerId] === undefined) state.trapCharges[ownerId] = this.CHARGES_PER_PLAYER;
    return state.trapCharges[ownerId];
  },

  _setCharges(ownerId, n) {
    if (!state.trapCharges) state.trapCharges = {};
    state.trapCharges[ownerId] = n;
  },

  renderOnMap() {
    state.traps.forEach(trap => {
      const cfg = this.CONFIG[trap.type];
      const label = trap.triggered ? `${cfg.icon} TRIGGERED` : `${cfg.icon} ${cfg.label}`;
      const color = trap.triggered ? '#ff0000' : cfg.color;
      MapModule.addBeacon(trap.id, trap.lat, trap.lng, label);
      if (!trap.triggered) {
        MapModule.drawZone(trap.lat, trap.lng, cfg.radius, color + '40'); // transparent fill
      }
    });
  },

  renderHUD() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local) return;
    const charges = this._getCharges(state.localAgentId);
    const el = document.getElementById('trapCharges');
    if (el) el.textContent = charges;
  }
};
```

### Integration Points

- **simulateWorld() main tick** (~line 5626): Add `TrapSystem.tick()` call
- **renderMissionMap()** (~line 6504): Add `TrapSystem.renderOnMap()` call
- **renderHUD()** (~line 6419): Add `TrapSystem.renderHUD()` call
- **AbilityHotbar** (~line 6680): Add trap ability (key `T`) — opens trap selector or cycles types
- **Threat AI hunt logic** (~line 5650): If `TrapSystem.getActiveDecoy()` exists, redirect threats toward decoy instead of agents

### HTML Additions (index.html)

```html
<!-- Trap selector panel (appears when trap ability active) -->
<div id="trapSelector" class="trap-selector hidden">
  <button class="trap-btn" data-trap="mine" title="Proximity Mine">💥 Mine</button>
  <button class="trap-btn" data-trap="flare" title="Trip Flare">🔦 Flare</button>
  <button class="trap-btn" data-trap="decoy" title="Decoy Signal">📡 Decoy</button>
  <span class="trap-charges">Charges: <span id="trapCharges">2</span></span>
</div>
```

### CSS Additions (styles-v2.css)

```css
.trap-selector {
  position: fixed;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(11,15,20,0.9);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  z-index: 50;
}
.trap-btn {
  background: var(--chip);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.trap-btn:hover { border-color: var(--accent); }
.trap-btn.selected { border-color: var(--accent); background: rgba(255,139,31,0.15); }
.trap-charges { font-size: 11px; color: var(--text-dim); margin-left: 6px; }
```

---

## Task 5 — Supply Cache Drops

**Effort:** Small | **Impact:** 4/5 | **Lines:** ~120-150

### Design

Extends DynamicEvents with a player-triggered supply cache system. When a "Supply Drop" dynamic event fires, instead of just one crate, 2-3 small caches spawn at random locations. Players must physically reach them (within 10m) to collect. Caches contain random consumables or temporary buffs. Collecting is optional — risk/reward decision.

### Cache Types (random on open)

| Type | Effect | Rarity |
|------|--------|--------|
| **Stim Pack** | +25 stamina instantly | Common |
| **Signal Amp** | +15% signal for 30s | Common |
| **Threat Intel** | Reveals nearest 2 threats for 20s | Uncommon |
| **Drone Battery** | Recharges active drone +30s | Uncommon |
| **Adrenaline** | +20% movement speed (simulated as reduced GPS jitter), 15s | Rare |
| **Tactical Shield** | Immune to jamming for 10s | Rare |

### State Additions

```js
// In state.dynamicEvents.eventData (already exists)
// Add: caches: [{ id, lat, lng, type, collected, spawnedAt }]
```

### JS Implementation

Extend `DynamicEvents._supplyDrop()`:

```js
_supplyDrop() {
  const center = getMissionCenter();
  const caches = [];
  const count = 2 + Math.floor(Math.random() * 2);
  const types = [
    { id: 'stim', name: 'Stim Pack', effect: 'stamina', value: 25, icon: '💉', weight: 0.30 },
    { id: 'amp', name: 'Signal Amp', effect: 'signal', value: 15, duration: 30000, icon: '📶', weight: 0.25 },
    { id: 'intel', name: 'Threat Intel', effect: 'reveal', value: 2, duration: 20000, icon: '📡', weight: 0.20 },
    { id: 'battery', name: 'Drone Battery', effect: 'drone', value: 30, icon: '🔋', weight: 0.15 },
    { id: 'adrenaline', name: 'Adrenaline', effect: 'speed', value: 0.2, duration: 15000, icon: '⚡', weight: 0.07 },
    { id: 'shield', name: 'Tactical Shield', effect: 'immune', value: 10, duration: 10000, icon: '🛡️', weight: 0.03 }
  ];
  for (let i = 0; i < count; i++) {
    const lat = center[0] + (Math.random() - 0.5) * 0.008;
    const lng = center[1] + (Math.random() - 0.5) * 0.008;
    const cacheType = this._weightedRandom(types);
    caches.push({
      id: 'cache-' + Date.now() + '-' + i,
      lat, lng,
      type: cacheType,
      collected: false,
      spawnedAt: Date.now()
    });
  }
  state.dynamicEvents.eventData = {
    markerType: 'supply_drop',
    caches,
    spawnedAt: Date.now()
  };
  addChat('System', `📦 ${count} supply caches detected in the AO!`);
  EventLog.add('event', '📦', `<strong>Supply Caches</strong> ${count} crates detected`);
  ScreenJuice.addKillFeed('SUPPLY CACHES DETECTED', '#ffd700');
  SoundFX.play(880, 0.08, 'sine', 0.15);
},

_weightedRandom(items) {
  const r = Math.random();
  let cum = 0;
  for (const item of items) {
    cum += item.weight;
    if (r <= cum) return item;
  }
  return items[0];
}
```

Add collection logic in `simulateWorld()`:

```js
// In simulateWorld() tick loop (~line 5626)
function checkCacheCollection() {
  const data = state.dynamicEvents.eventData || {};
  if (data.markerType !== 'supply_drop' || !data.caches) return;
  const local = state.agents.find(a => a.id === state.localAgentId);
  if (!local) return;
  data.caches.forEach(cache => {
    if (cache.collected) return;
    const dist = haversine(local, cache);
    if (dist <= 10) {
      cache.collected = true;
      _applyCacheEffect(cache.type, local);
      addChat('System', `${cache.type.icon} Collected: ${cache.type.name}!`);
      EventLog.add('event', cache.type.icon, `<strong>${cache.type.name}</strong> Collected`);
      SoundFX.play(660, 0.1, 'sine', 0.12);
      ParticleSystem.burst(local.lat, local.lng, ['#ffd700', '#ffeb3b'], 8);
    }
  });
}

function _applyCacheEffect(type, agent) {
  switch (type.effect) {
    case 'stamina': agent.stamina = Math.min(100, agent.stamina + type.value); break;
    case 'signal': ActiveBuffs.add('signal_amp', type.duration, { signalBoost: type.value }); break;
    case 'reveal':
      // Reveal nearest N threats
      const sorted = [...state.threats].sort((a, b) => haversine(agent, a) - haversine(agent, b));
      sorted.slice(0, type.value).forEach(t => { t._revealedUntil = Date.now() + type.duration; });
      break;
    case 'drone': /* handled by DroneSystem if exists */ break;
    case 'speed': ActiveBuffs.add('adrenaline', type.duration, { speedMult: 1 + type.value }); break;
    case 'immune': ActiveBuffs.add('tactical_shield', type.duration, { immune: true }); break;
  }
}
```

### Integration Points

- **DynamicEvents._supplyDrop()** (~line 7299): Replace existing simple supply drop with cache system
- **simulateWorld()** (~line 5626): Add `checkCacheCollection()` call
- **renderMissionMap()** (~line 6504): Update supply drop rendering to show individual cache markers
- **DynamicEvents.tick()** (~line 7386): Caches expire after 120s if uncollected

### HTML Additions

None — reuses existing event data structure and map markers.

### CSS Additions

```css
.cache-marker { animation: cachePulse 1.5s ease-in-out infinite; }
@keyframes cachePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
```

---

## Task 6 — Role Progression (XP & Abilities)

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~300-350

### Design

Each role earns XP per mission based on role-specific actions. XP accumulates across sessions (stored in localStorage). At certain thresholds, roles unlock **tiered abilities** that replace or enhance the base ability.

### XP Sources (per role)

| Role | XP Source | Amount |
|------|-----------|--------|
| Drone | Scout drone reveals objective | +15 |
| Mechanic | Boost squad signal above 80% | +20 |
| Medic | Revive downed agent | +30 |
| Decoder | Decode objective | +25 |
| Navigator | Guide squad to objective (within 30m) | +15 |
| Courier | Deliver package / complete objective | +20 |
| Mission Control | Squad completes objective while alive | +10 |

### Tier Thresholds

| Tier | XP Required | Unlock |
|------|-------------|--------|
| Tier 1 (Rookie) | 0 | Base ability |
| Tier 2 (Veteran) | 100 | Enhanced ability (shorter cooldown / stronger effect) |
| Tier 3 (Elite) | 300 | Passive bonus always active |
| Tier 4 (Master) | 600 | Ultimate ability (long cooldown, powerful effect) |

### Tier Abilities per Role

| Role | Tier 2 | Tier 3 Passive | Tier 4 Ultimate |
|------|--------|---------------|-----------------|
| Drone | Scan cooldown -30% | +10% radar range always | **Orbital Scan**: Reveal all objectives for 10s |
| Mechanic | Boost strength +25% | +5% squad signal always | **Grid Overcharge**: Full squad signal to 100% for 15s |
| Medic | Revive time -50% | +5 stamina regen / tick | **Field Hospital**: Revive ALL downed agents instantly |
| Decoder | Decode speed +30% | 1 free pre-decoded per mission | **Master Key**: Instantly complete nearest objective |
| Navigator | Waypoint range +50% | -10% threat detect range | **Exfil Call**: Move extraction point 200m closer |
| Courier | Delivery speed +20% | +10 stamina cap | **Emergency Drop**: Spawn supply cache at location |
| Mission Control | Intel refresh -20s | See all threats on radar always | **Airstrike**: Eliminate nearest threat |

### State Additions

```js
// In state object (~line 268)
roleXP: {},       // role -> total XP (loaded from localStorage)
roleTier: {},     // role -> current tier (1-4)

// In localStorage key: 'slv2_role_progression'
```

### JS Implementation

```js
// New module (insert after TrapSystem at ~line 8450)
const RoleProgression = {
  STORAGE_KEY: 'slv2_role_progression',
  TIERS: [0, 100, 300, 600],

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.roleXP = data.xp || {};
      state.roleTier = data.tier || {};
    } else {
      state.roleXP = {};
      state.roleTier = {};
    }
    // Ensure all roles have at least tier 1
    Object.keys(roleCatalog).forEach(role => {
      if (!state.roleXP[role]) state.roleXP[role] = 0;
      if (!state.roleTier[role]) state.roleTier[role] = 1;
    });
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      xp: state.roleXP,
      tier: state.roleTier
    }));
  },

  getTier(role) {
    const xp = state.roleXP[role] || 0;
    let tier = 1;
    for (let i = 0; i < this.TIERS.length; i++) {
      if (xp >= this.TIERS[i]) tier = i + 1;
    }
    return Math.min(tier, 4);
  },

  addXP(role, amount, reason) {
    if (!state.roleXP[role]) state.roleXP[role] = 0;
    const oldTier = this.getTier(role);
    state.roleXP[role] += amount;
    const newTier = this.getTier(role);
    this.save();
    if (newTier > oldTier) {
      addChat('System', `🎖️ ${role} promoted to Tier ${newTier}!`);
      EventLog.add('event', '🎖️', `<strong>Promotion</strong> ${role} reached Tier ${newTier}`);
      ScreenJuice.addKillFeed(`${role.toUpperCase()} PROMOTED TO TIER ${newTier}`, '#ffd700');
      SoundFX.play(880, 0.1, 'sine', 0.15);
      setTimeout(() => SoundFX.play(1100, 0.1, 'sine', 0.15), 150);
    }
    return { oldTier, newTier, xpGained: amount };
  },

  // Called at end of mission
  awardMissionXP() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local || !local.role) return;
    const role = local.role;
    let xp = 0;
    // Base completion XP
    const completed = state.objectives.filter(o => o.found).length;
    xp += completed * 10;
    // Role-specific XP
    switch (role) {
      case 'Drone': xp += (state.dronesDeployed || 0) * 15; break;
      case 'Mechanic': xp += (state.squadBoosts || 0) * 20; break;
      case 'Medic': xp += (state.revivesPerformed || 0) * 30; break;
      case 'Decoder': xp += (state.objectivesDecoded || 0) * 25; break;
      case 'Navigator': xp += (state.waypointsGuided || 0) * 15; break;
      case 'Courier': xp += (state.deliveries || 0) * 20; break;
      case 'Mission Control': xp += completed * 10; break;
    }
    // Survival bonus
    if (!ReviveSystem.isEliminated(state.localAgentId)) xp += 25;
    this.addXP(role, xp, 'Mission complete');
    return xp;
  },

  // Ability modifiers based on tier
  getAbilityModifier(role, abilityType) {
    const tier = this.getTier(role);
    const mods = {
      Drone: { cooldownMult: tier >= 2 ? 0.7 : 1.0, radarBonus: tier >= 3 ? 1.1 : 1.0 },
      Mechanic: { boostStrength: tier >= 2 ? 1.25 : 1.0, passiveSignal: tier >= 3 ? 1.05 : 1.0 },
      Medic: { reviveTimeMult: tier >= 2 ? 0.5 : 1.0, staminaRegen: tier >= 3 ? 0.5 : 0 },
      Decoder: { decodeSpeed: tier >= 2 ? 1.3 : 1.0, freeDecode: tier >= 3 ? 1 : 0 },
      Navigator: { waypointRange: tier >= 2 ? 1.5 : 1.0, stealthBonus: tier >= 3 ? 0.9 : 1.0 },
      Courier: { deliverySpeed: tier >= 2 ? 1.2 : 1.0, staminaCap: tier >= 3 ? 10 : 0 },
      'Mission Control': { intelRefresh: tier >= 2 ? 0.8 : 1.0, threatVision: tier >= 3 ? true : false }
    };
    return mods[role] || {};
  },

  // Ultimate abilities (Tier 4)
  canUseUltimate(role) {
    return this.getTier(role) >= 4;
  },

  ultimates: {
    Drone: { name: 'Orbital Scan', cooldown: 120000, icon: '🛰️', use() { /* reveal all objectives 10s */ } },
    Mechanic: { name: 'Grid Overcharge', cooldown: 120000, icon: '⚡', use() { /* squad signal = 100% 15s */ } },
    Medic: { name: 'Field Hospital', cooldown: 120000, icon: '🏥', use() { /* revive all downed */ } },
    Decoder: { name: 'Master Key', cooldown: 120000, icon: '🗝️', use() { /* complete nearest objective */ } },
    Navigator: { name: 'Exfil Call', cooldown: 120000, icon: '🚁', use() { /* move extraction closer */ } },
    Courier: { name: 'Emergency Drop', cooldown: 120000, icon: '📦', use() { /* spawn cache */ } },
    'Mission Control': { name: 'Airstrike', cooldown: 120000, icon: '💥', use() { /* eliminate nearest threat */ } }
  },

  renderHUD() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local || !local.role) return;
    const tier = this.getTier(local.role);
    const xp = state.roleXP[local.role] || 0;
    const nextThreshold = this.TIERS[tier] || this.TIERS[this.TIERS.length - 1];
    const prevThreshold = tier > 1 ? this.TIERS[tier - 2] : 0;
    const progress = Math.min(1, (xp - prevThreshold) / (nextThreshold - prevThreshold));
    const el = document.getElementById('progressionHUD');
    if (el) {
      el.innerHTML = `
        <span class="tier-badge tier-${tier}">T${tier}</span>
        <span class="xp-bar"><span class="xp-fill" style="width:${progress * 100}%"></span></span>
        <span class="xp-text">${xp} XP</span>
      `;
    }
  },

  renderRoleSelect() {
    // Add tier badges to role cards in role selection screen
    Object.keys(roleCatalog).forEach(role => {
      const tier = this.getTier(role);
      const card = document.querySelector(`[data-role="${role}"] .role-tier`);
      if (card) card.textContent = `T${tier}`;
    });
  }
};
```

### Integration Points

- **App init** (~line 100+): Add `RoleProgression.init()` call
- **Mission end / renderResults()** (~line 7781): Add `RoleProgression.awardMissionXP()` call
- **Ability usage** (~line 6680+): Apply `RoleProgression.getAbilityModifier(role, type)` to cooldowns and effects
- **AbilityHotbar** (~line 6680): Add ultimate ability slot (key `U`) if `RoleProgression.canUseUltimate(role)`
- **renderHUD()** (~line 6419): Add `RoleProgression.renderHUD()` call
- **Role selection screen** (~line 4600+): Add `RoleProgression.renderRoleSelect()` call

### HTML Additions (index.html)

```html
<!-- In mission HUD, near top-right -->
<div id="progressionHUD" class="progression-hud" title="Role progression">
  <span class="tier-badge tier-1">T1</span>
  <span class="xp-bar"><span class="xp-fill" style="width:0%"></span></span>
  <span class="xp-text">0 XP</span>
</div>

<!-- In role selection cards, add tier badge -->
<!-- Inside each .role-card in renderRolesScreen(): -->
<span class="role-tier">T1</span>
```

### CSS Additions (styles-v2.css)

```css
.progression-hud {
  position: fixed;
  top: 12px;
  right: 300px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(11,15,20,0.7);
  padding: 3px 10px;
  border-radius: 6px;
  z-index: 20;
  font-size: 11px;
}
.tier-badge {
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
}
.tier-1 { background: #4a5568; color: #fff; }
.tier-2 { background: #3182ce; color: #fff; }
.tier-3 { background: #805ad5; color: #fff; }
.tier-4 { background: #d69e2e; color: #000; }
.xp-bar {
  width: 40px;
  height: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.xp-text { color: var(--text-dim); font-size: 10px; }
.role-tier {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(0,0,0,0.5);
  color: var(--accent);
}
```

---

## File Map

| Feature | Primary File | Insert Area |
|---------|-------------|-------------|
| Weather System | game-v2.js | New module after DynamicEvents (~line 7420) |
| Revive System | game-v2.js | New module after WeatherSystem (~line 7700) |
| Terrain System | game-v2.js | New module after ReviveSystem (~line 7950) |
| Trap System | game-v2.js | New module after TerrainSystem (~line 8200) |
| Supply Caches | game-v2.js | Extend DynamicEvents._supplyDrop() (~line 7299) |
| Role Progression | game-v2.js | New module after TrapSystem (~line 8450) |

### game-v2.js Insertion Points

| Feature | Function / Location | Approx Line |
|---------|--------------------|-------------|
| Weather init | `startMissionClock()` | ~5612 |
| Weather tick | `simulateWorld()` | ~5626 |
| Weather HUD | `renderHUD()` | ~6419 |
| Weather signal | Threat detection / abilities | ~5656, ~6050 |
| Revive down | Stamina drain in `simulateWorld()` | ~5626 |
| Revive tick | `simulateWorld()` | ~5626 |
| Revive map | `renderMissionMap()` | ~6504 |
| Revive block | Ability/objective/movement | ~6680, ~6050, ~1000 |
| Terrain generate | `startMissionClock()` | ~5612 |
| Terrain tick | `simulateWorld()` signal/threat | ~5626, ~5656 |
| Terrain map | `renderMissionMap()` | ~6504 |
| Trap tick | `simulateWorld()` | ~5626 |
| Trap map | `renderMissionMap()` | ~6504 |
| Trap ability | `AbilityHotbar` | ~6680 |
| Cache collect | `simulateWorld()` | ~5626 |
| Cache map | `renderMissionMap()` | ~6504 |
| Progression init | App initialization | ~100+ |
| Progression award | `renderResults()` / mission end | ~7781 |
| Progression HUD | `renderHUD()` | ~6419 |
| Progression ability | `AbilityHotbar` + ability use | ~6680 |

### index.html Insertion Points

| Feature | Insert After | Approx Line |
|---------|-------------|-------------|
| weatherHUD | Inside `#hudTop` or near `#missionTimer` | ~375 |
| downedAlert | Inside `#missionScreen` | ~373 |
| terrainHUD | Near weatherHUD | ~375 |
| trapSelector | After `#abilityHotbar` | ~475 |
| progressionHUD | Inside `#hudTop` | ~375 |

### styles-v2.css Insertion Points

| Feature | Approx Location |
|---------|----------------|
| Weather styles | End of file (~line 4062) |
| Downed alert styles | End of file |
| Terrain HUD styles | End of file |
| Trap selector styles | End of file |
| Progression styles | End of file |

---

## Execution Order

Build in priority order. After each task:
1. `node --check game-v2.js`
2. `git add -A && git commit -m "feat: [feature name]"`
3. Move to next task

**Task 1 (Weather)** should be done first — it establishes the environmental modifier pattern that Terrain and Traps build on. **Task 2 (Revive)** adds the most dramatic team-play moment. **Task 6 (Progression)** should be last because it depends on hooks from all other systems.

---

*Research conducted May 2026. All estimates based on existing codebase patterns and architectural constraints.*
