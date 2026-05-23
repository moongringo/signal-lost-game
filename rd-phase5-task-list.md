# Phase 5 — Multiplayer Foundation, New Roles, Tutorial & Audio

**Signal Lost v2** — 9,742-line monolithic game-v2.js, 776-line index.html, 4,418-line styles-v2.css  
**Current state:** Phase 4 complete (Weather, Revive, Terrain, Traps, Supply Caches, Role Progression). 7 roles, spectator mode, Socket.IO lobby, 7 mission modules, threat AI with alert states, day/night cycle, deployable drones, ping wheel, command wheel, full-screen radar, mobile panel drawers.
**Server:** server-v2.js (267 lines) — basic Socket.IO with host/join/launch/chat/position/spectate.

---

## Priority Ranking

| # | Feature | Effort | Impact | Lines |
|---|---------|--------|--------|-------|
| 1 | Server-Side Game State Sync | Large | 5/5 | ~400-500 |
| 2 | 4 New Roles (Saboteur, Spotter, Engineer, Hacker) | Large | 5/5 | ~350-400 |
| 3 | Tutorial & Onboarding System | Medium | 5/5 | ~250-300 |
| 4 | Dynamic Music & Ambient Audio | Medium | 4/5 | ~200-250 |
| 5 | Settings Menu (Audio, Graphics, Controls) | Medium | 4/5 | ~200-250 |
| 6 | Ping Wheel Enhancement (8-direction + contextual) | Small | 4/5 | ~120-150 |
| 7 | Match History & Stats Tracking | Medium | 4/5 | ~180-220 |
| 8 | Admin Panel (Host-only kick, pause, force-end) | Small | 3/5 | ~100-130 |
| 9 | In-Game Chat Improvements (team-only, quick-chat) | Small | 3/5 | ~80-100 |
| 10 | Reconnection & Recovery | Medium | 4/5 | ~150-180 |

**Rationale:** Server-side state sync is the foundation for everything multiplayer — without it, competitive play is impossible. New roles expand the tactical space and give progression more meaning. Tutorial is critical for retention. Dynamic audio is the biggest atmospheric upgrade after weather. Settings is table stakes for any polished game. The rest are quality-of-life multipliers.

---

## Task 1 — Server-Side Game State Sync

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~400-500

### Design

Currently the server is a thin relay — it forwards positions and chat but all game logic (threats, objectives, scoring) runs client-side with the host as the "source of truth." This creates desync, cheating vulnerability, and inconsistent experiences. We move the authoritative simulation to the server: the host client still runs the visual simulation, but the server validates and broadcasts the canonical game state every tick.

### Server Architecture Changes (server-v2.js)

```js
// Add to top of server-v2.js (~line 22)
const gameLoops = new Map(); // code -> { intervalId, lastTick, stateSnapshot }
const TICK_RATE = 2500; // ms, matches client simulateWorld

// Replace launch-mission handler (~line 170) with authoritative init
socket.on('launch-mission', () => {
  if (!currentGame || !currentPlayer) return;
  const game = games.get(currentGame);
  if (!game || game.host !== socket.id) return;

  game.state = 'mission';
  game.missionStartTime = Date.now();
  game.missionDuration = game.settings.duration * 60 * 1000;
  
  // Authoritative state
  game.authoritative = {
    threats: _generateThreats(game.settings.city),
    objectives: _generateObjectives(game.settings.city, game.settings.enabledModules),
    scores: { North: 0, South: 0 },
    weather: _rollWeather(),
    terrain: _generateTerrain(game.settings.city),
    dynamicEvents: { active: null, lastEventTime: Date.now() },
    supplyCaches: [],
    traps: [],
    downedAgents: {},
    elapsed: 0
  };

  // Assign roles/teams (existing logic)
  // ... existing role assignment ...

  // Start authoritative tick loop
  if (gameLoops.has(currentGame)) clearInterval(gameLoops.get(currentGame).intervalId);
  const loop = setInterval(() => _serverTick(currentGame), TICK_RATE);
  gameLoops.set(currentGame, { intervalId: loop, lastTick: Date.now() });

  io.to(currentGame).emit('mission-launched', {
    players: game.players,
    duration: game.settings.duration,
    authoritative: game.authoritative // send initial state
  });
});

// New server functions (append to server-v2.js)
function _serverTick(code) {
  const game = games.get(code);
  if (!game || game.state !== 'mission') return;
  const auth = game.authoritative;
  auth.elapsed += TICK_RATE;
  
  // Threat AI (simplified server-side)
  auth.threats.forEach(t => {
    const activePlayers = Object.values(game.players).filter(p => !p.bot && p.lat && p.lng);
    if (!activePlayers.length) return;
    const nearest = activePlayers.reduce((best, p) => {
      const d = _haversine(p.lat, p.lng, t.lat, t.lng);
      return d < best.d ? { p, d } : best;
    }, { d: Infinity });
    if (nearest.d < 400) {
      t.mode = 'hunt';
      t.targetId = nearest.p.id;
    } else {
      t.mode = 'patrol';
      t.lat += Math.cos(t.angle || 0) * (t.speed || 0.00038);
      t.lng += Math.sin(t.angle || 0) * (t.speed || 0.00038);
    }
  });

  // Objective completion validation
  auth.objectives.forEach(obj => {
    if (obj.found) return;
    const near = Object.values(game.players).filter(p => p.lat && p.lng && _haversine(p.lat, p.lng, obj.lat, obj.lng) < obj.radius);
    if (near.length > 0) {
      obj.progress = Math.min(100, (obj.progress || 0) + (near.length * 8));
      if (obj.progress >= 100) {
        obj.found = true;
        obj.foundBy = near[0].id;
        auth.scores[near[0].team] += obj.points || 25;
      }
    }
  });

  // Dynamic events
  if (Date.now() - auth.dynamicEvents.lastEventTime > 45000 + Math.random() * 30000) {
    auth.dynamicEvents.lastEventTime = Date.now();
    _triggerDynamicEvent(auth, game.settings.city);
  }

  // Mission timeout
  if (auth.elapsed >= game.missionDuration) {
    _endMission(code, 'timeout');
    return;
  }

  // Broadcast authoritative state
  io.to(code).emit('auth-state', {
    threats: auth.threats,
    objectives: auth.objectives,
    scores: auth.scores,
    weather: auth.weather,
    dynamicEvents: auth.dynamicEvents,
    supplyCaches: auth.supplyCaches,
    traps: auth.traps,
    downedAgents: auth.downedAgents,
    elapsed: auth.elapsed
  });
}

function _endMission(code, reason) {
  const game = games.get(code);
  if (!game) return;
  game.state = 'ended';
  if (gameLoops.has(code)) {
    clearInterval(gameLoops.get(code).intervalId);
    gameLoops.delete(code);
  }
  io.to(code).emit('mission-ended', {
    reason,
    scores: game.authoritative.scores,
    objectives: game.authoritative.objectives,
    elapsed: game.authoritative.elapsed
  });
}

function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function _generateThreats(cityKey) {
  const city = cities[cityKey];
  const threats = [];
  const count = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    threats.push({
      id: 'threat-' + i,
      lat: city.center[0] + (Math.random() - 0.5) * 0.012,
      lng: city.center[1] + (Math.random() - 0.5) * 0.012,
      name: ['Ghost Signal', 'AI Watch', 'Phantom Relay', 'Signal Hunter'][i % 4],
      mode: 'patrol',
      speed: 0.0003 + Math.random() * 0.0002,
      angle: Math.random() * Math.PI * 2
    });
  }
  return threats;
}

function _generateObjectives(cityKey, modules) {
  const city = cities[cityKey];
  const objs = [];
  const types = Object.keys(modules).filter(k => modules[k]);
  types.forEach((type, i) => {
    objs.push({
      id: 'obj-' + i,
      lat: city.center[0] + (Math.random() - 0.5) * 0.008,
      lng: city.center[1] + (Math.random() - 0.5) * 0.008,
      type,
      found: false,
      progress: 0,
      radius: 15,
      points: 25
    });
  });
  return objs;
}

function _rollWeather() {
  const types = ['clear', 'rain', 'fog', 'wind'];
  const weights = [0.45, 0.25, 0.20, 0.10];
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < types.length; i++) {
    cum += weights[i];
    if (r <= cum) return { type: types[i], startedAt: Date.now(), intensity: 0.8 + Math.random() * 0.7 };
  }
  return { type: 'clear', startedAt: Date.now(), intensity: 1.0 };
}

function _generateTerrain(cityKey) {
  const city = cities[cityKey];
  const grid = [];
  const CELL_SIZE = 0.0018;
  const types = ['open', 'high_ground', 'urban', 'woods', 'water'];
  const weights = [0.35, 0.15, 0.25, 0.20, 0.05];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const roll = Math.random();
      let cum = 0, type = 'open';
      for (let i = 0; i < types.length; i++) { cum += weights[i]; if (roll <= cum) { type = types[i]; break; } }
      grid.push({
        lat: city.center[0] - (7*CELL_SIZE)/2 + r*CELL_SIZE + CELL_SIZE/2,
        lng: city.center[1] - (7*CELL_SIZE)/2 + c*CELL_SIZE + CELL_SIZE/2,
        type,
        radius: CELL_SIZE * 0.55
      });
    }
  }
  return grid;
}

function _triggerDynamicEvent(auth, cityKey) {
  const events = ['supply_drop', 'jammer_surge', 'extraction_shift', 'threat_reinforcement'];
  const type = events[Math.floor(Math.random() * events.length)];
  auth.dynamicEvents.active = { type, startedAt: Date.now() };
  if (type === 'supply_drop') {
    const city = cities[cityKey];
    auth.supplyCaches = Array.from({ length: 2 + Math.floor(Math.random()*2) }, (_, i) => ({
      id: 'cache-' + Date.now() + '-' + i,
      lat: city.center[0] + (Math.random() - 0.5) * 0.008,
      lng: city.center[1] + (Math.random() - 0.5) * 0.008,
      type: ['stim','amp','intel','battery','adrenaline','shield'][Math.floor(Math.random()*6)],
      collected: false
    }));
  }
}
```

### Client Changes (game-v2.js)

```js
// In SignalNet socket listeners (~line 1000)
this.socket.on('auth-state', (auth) => {
  // Merge authoritative state (server wins on conflicts)
  state.threats = auth.threats;
  state.objectives = auth.objectives;
  state.scores = auth.scores;
  state.weather = auth.weather;
  state.dynamicEvents = { ...state.dynamicEvents, ...auth.dynamicEvents };
  state.supplyCaches = auth.supplyCaches;
  state.traps = auth.traps;
  state.downedAgents = auth.downedAgents;
  // Don't overwrite local agent position — that's client-authoritative
});

this.socket.on('mission-ended', ({ reason, scores, objectives, elapsed }) => {
  state.scores = scores;
  state.objectives = objectives;
  state.remaining = Math.max(0, state.duration * 60 - Math.floor(elapsed / 1000));
  stopMissionClock();
  setScreen('results');
  renderResults();
});
```

### Integration Points

- **server-v2.js**: Add `cities` data (copy from game-v2.js or require shared data file)
- **server-v2.js**: Add `spectators` Map declaration (currently used but never declared — bug!)
- **game-v2.js SignalNet.init()** (~line 988): Add `auth-state` listener
- **game-v2.js simulateWorld()** (~line 5921): Remove client-side threat generation; threats now come from server. Keep local prediction for smoothness.
- **game-v2.js startMissionClock()** (~line 5861): Accept `authoritative` payload from `mission-launched` and populate state
- **game-v2.js renderResults()** (~line 9103): Use server-finalized scores instead of local calculation

### File Map

| Feature | Primary File | Insert Area |
|---------|-------------|-------------|
| Server tick loop | server-v2.js | New functions after existing handlers (~line 215) |
| Server helpers | server-v2.js | Append to end of file |
| Client auth-state | game-v2.js | SignalNet socket listeners (~line 1000) |
| Client mission-ended | game-v2.js | SignalNet socket listeners (~line 1000) |

---

## Task 2 — 4 New Roles (Saboteur, Spotter, Engineer, Hacker)

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~350-400

### Design

Expand from 7 to 11 roles. Each new role fills a tactical gap not covered by existing roles. They get full ability sets, starting bonuses, colors, emojis, descriptions, and progression paths.

### Role Catalog Additions

```js
// In roleCatalog (~line 26)
Saboteur: ["Plant charge", "Jam enemy relay", "Sabotage extraction"],
Spotter: ["Mark target", "Range find", "Call coordinates"],
Engineer: ["Build turret", "Repair barrier", "Deploy shield"],
Hacker: ["Hack threat", "Decrypt fast", "Override signal"]
```

### Full Role Definitions

```js
// In roleDescriptions (~line 106)
Saboteur: 'Demolitions expert. Plants charges, jams relays, and sabotages enemy extraction points.',
Spotter: 'Recon sniper. Marks high-value targets, measures ranges, and calls in coordinates for squad strikes.',
Engineer: 'Field fortifier. Builds automated turrets, repairs barriers, and deploys protective shields.',
Hacker: 'Cyber warfare specialist. Hacks threats to turn them friendly, decrypts at speed, overrides signals.'

// In roleColors (~line 86)
Saboteur: '#ff4444',
Spotter: '#a0c4ff',
Engineer: '#90be6d',
Hacker: '#c77dff'

// In roleEmojis (~line 96)
Saboteur: '\u{1F4A3}',
Spotter: '\u{1F52D}',
Engineer: '\u{1F6E0}',
Hacker: '\u{1F4BB}'

// In roleStartingBonuses (~line 76)
Saboteur: { text: 'Starts with 1 free charge planted at nearest objective', icon: '\u{1F4A3}' },
Spotter: { text: 'Starts with nearest threat revealed for 30s', icon: '\u{1F52D}' },
Engineer: { text: 'Starts with a temporary shield around spawn', icon: '\u{1F6E1}' },
Hacker: { text: 'Starts with 1 threat hacked to patrol away from squad', icon: '\u{1F4BB}' }
```

### Ability Cooldowns

```js
// In abilityCooldowns (~line 117)
'Saboteur:Plant charge': 20000,
'Saboteur:Jam enemy relay': 15000,
'Saboteur:Sabotage extraction': 30000,
'Spotter:Mark target': 12000,
'Spotter:Range find': 8000,
'Spotter:Call coordinates': 25000,
'Engineer:Build turret': 25000,
'Engineer:Repair barrier': 15000,
'Engineer:Deploy shield': 20000,
'Hacker:Hack threat': 30000,
'Hacker:Decrypt fast': 12000,
'Hacker:Override signal': 20000
```

### Ability Implementations

```js
// In executeTool() (~line 7396) or new executeToolExtended()
// Saboteur
'Saboteur:Plant charge': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  if (!local) return;
  const nearestObj = state.objectives.reduce((best, o) => {
    const d = haversine(local, o);
    return d < best.d ? { o, d } : best;
  }, { d: Infinity }).o;
  if (!nearestObj || haversine(local, nearestObj) > 50) {
    addChat('System', 'No objective within 50m to plant charge.');
    return;
  }
  nearestObj._chargePlanted = true;
  nearestObj._chargeTimer = Date.now() + 10000; // 10s fuse
  addChat('System', '💣 Charge planted! 10s until detonation.');
  EventLog.add('ability', '💣', '<strong>Charge Planted</strong> Objective will be destroyed');
  SoundFX.play(300, 0.1, 'sawtooth', 0.2);
},
'Saboteur:Jam enemy relay': () => {
  ActiveBuffs.add('jam_relay', 15000, { jamRadius: 100, icon: '📵' });
  addChat('System', '📵 Enemy relay jammed for 15s.');
  SoundFX.play(200, 0.08, 'square', 0.15);
},
'Saboteur:Sabotage extraction': () => {
  state.extractionShifted = true;
  const center = getMissionCenter();
  state.extractionPoint = jitter(center, 0.005);
  addChat('System', '🎯 Extraction point sabotaged! New coordinates broadcast.');
  EventLog.add('ability', '🎯', '<strong>Extraction Sabotaged</strong> New location set');
  SoundFX.play(440, 0.1, 'sine', 0.2);
},

// Spotter
'Spotter:Mark target': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  const nearest = state.threats.reduce((best, t) => {
    const d = haversine(local, t);
    return d < best.d ? { t, d } : best;
  }, { d: Infinity }).t;
  if (!nearest || haversine(local, nearest) > 300) {
    addChat('System', 'No threat within 300m to mark.');
    return;
  }
  nearest._markedUntil = Date.now() + 20000;
  nearest._markedBy = state.localAgentId;
  addChat('System', '🎯 Target marked! All squad sees it for 20s.');
  EventLog.add('ability', '🎯', `<strong>Target Marked</strong> ${nearest.name}`);
  SoundFX.play(880, 0.08, 'sine', 0.12);
  // Broadcast to all players
  SignalNet.socket?.emit('ability-effect', { type: 'mark', targetId: nearest.id, duration: 20000 });
},
'Spotter:Range find': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  const targets = state.threats.map(t => ({ name: t.name, dist: Math.round(haversine(local, t)) })).sort((a,b) => a.dist - b.dist);
  const msg = targets.slice(0, 3).map(t => `${t.name}: ${t.dist}m`).join(' | ');
  addChat('System', `📏 Range find: ${msg}`);
  SoundFX.play(660, 0.06, 'sine', 0.08);
},
'Spotter:Call coordinates': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  PingSystem.add(local.lat, local.lng, 'danger', 'Strike coordinates');
  // All threats within 150m take "damage" (retreat)
  state.threats.forEach(t => {
    if (haversine(local, t) < 150) {
      t.mode = 'retreat';
      t.retreatUntil = Date.now() + 8000;
    }
  });
  addChat('System', '💥 Coordinates called! Threats in 150m are retreating.');
  EventLog.add('ability', '💥', '<strong>Strike Called</strong> Area suppressed');
  SoundFX.play(200, 0.15, 'sawtooth', 0.3);
  ParticleSystem.burst(local.lat, local.lng, ['#ff4444', '#ff8800'], 15);
},

// Engineer
'Engineer:Build turret': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  if (!local) return;
  state.turrets = state.turrets || [];
  state.turrets.push({
    id: 'turret-' + Date.now(),
    lat: local.lat, lng: local.lng,
    ownerId: state.localAgentId,
    placedAt: Date.now(),
    range: 80,
    damage: 1 // hits per tick
  });
  addChat('System', '🤖 Turret deployed! Will fire on threats within 80m.');
  EventLog.add('ability', '🤖', '<strong>Turret Deployed</strong> Auto-defence active');
  SoundFX.play(600, 0.08, 'sine', 0.1);
},
'Engineer:Repair barrier': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  state.agents.forEach(a => {
    if (a.id !== state.localAgentId && haversine(local, a) < 30) {
      a.stamina = Math.min(100, a.stamina + 20);
    }
  });
  addChat('System', '🛡️ Barrier repaired! Nearby squad +20 stamina.');
  SoundFX.play(523, 0.08, 'sine', 0.1);
},
'Engineer:Deploy shield': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  ActiveBuffs.add('engineer_shield', 20000, { shieldRadius: 25, icon: '🛡️' });
  addChat('System', '🛡️ Protective shield deployed for 20s.');
  SoundFX.play(440, 0.1, 'sine', 0.15);
},

// Hacker
'Hacker:Hack threat': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  const nearest = state.threats.reduce((best, t) => {
    const d = haversine(local, t);
    return d < best.d ? { t, d } : best;
  }, { d: Infinity }).t;
  if (!nearest || haversine(local, nearest) > 200) {
    addChat('System', 'No threat within 200m to hack.');
    return;
  }
  nearest._hackedUntil = Date.now() + 15000;
  nearest._hackedBy = state.localAgentId;
  nearest.mode = 'patrol'; // stop hunting
  addChat('System', '💻 Threat hacked! It will patrol neutrally for 15s.');
  EventLog.add('ability', '💻', `<strong>Hacked</strong> ${nearest.name} neutralized`);
  SoundFX.play(880, 0.1, 'sine', 0.15);
},
'Hacker:Decrypt fast': () => {
  const local = state.agents.find(a => a.id === state.localAgentId);
  const nearestObj = state.objectives.reduce((best, o) => {
    const d = haversine(local, o);
    return d < best.d ? { o, d } : best;
  }, { d: Infinity }).o;
  if (nearestObj && haversine(local, nearestObj) < 30) {
    nearestObj.progress = Math.min(100, (nearestObj.progress || 0) + 40);
    addChat('System', '🔓 Fast decrypt! Objective progress +40%.');
    SoundFX.play(1100, 0.08, 'sine', 0.1);
  } else {
    addChat('System', 'No objective within 30m to decrypt.');
  }
},
'Hacker:Override signal': () => {
  state.threats.forEach(t => {
    t._overridden = true;
    t._overrideUntil = Date.now() + 10000;
  });
  addChat('System', '📡 All threats overridden for 10s! They cannot detect agents.');
  EventLog.add('ability', '📡', '<strong>Signal Override</strong> Threats blinded');
  SoundFX.play(660, 0.12, 'sine', 0.2);
}
```

### Turret System Tick (in simulateWorld)

```js
// In simulateWorld() (~line 5921)
// Turret logic
if (state.turrets) {
  state.turrets.forEach(turret => {
    if (Date.now() - turret.placedAt > 60000) return; // 60s lifetime
    state.threats.forEach(t => {
      if (haversine(turret, t) < turret.range && !t._hackedUntil) {
        t.hits = (t.hits || 0) + turret.damage;
        if (t.hits > 5) {
          t.mode = 'retreat';
          t.retreatUntil = Date.now() + 5000;
        }
      }
    });
  });
  state.turrets = state.turrets.filter(t => Date.now() - t.placedAt < 60000);
}
```

### Integration Points

- **roleCatalog** (~line 26): Add 4 new roles
- **roleDescriptions, roleColors, roleEmojis, roleStartingBonuses** (~line 76-116): Add entries
- **abilityCooldowns** (~line 117): Add 12 new cooldown entries
- **executeTool()** (~line 7396): Add 12 new case handlers
- **RoleProgression** (~line 9460): Add XP sources and tier abilities for 4 new roles
- **renderRoleCards()** (~line 5171): Cards will auto-populate from roleCatalog
- **simulateWorld()** (~line 5921): Add turret tick logic
- **renderMissionMap()** (~line 6895): Add turret markers, marked threat indicators, hacked threat indicators
- **server-v2.js**: Add new roles to auto-assignment list

---

## Task 3 — Tutorial & Onboarding System

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design

First-time players see a guided tutorial overlay that walks through: movement, radar, abilities, threats, objectives, and extraction. Tutorial uses spotlight highlighting + tooltip bubbles. Progress is saved to localStorage. A "Training Ground" mode lets players practice without stakes.

### State Additions

```js
// In state object (~line 176)
tutorial: {
  completed: false,
  step: 0,
  inProgress: false,
  trainingMode: false
},
```

### Tutorial Module

```js
// New module (insert before SplashScreen at ~line 9348)
const TutorialSystem = {
  STEPS: [
    { id: 'welcome', text: 'Welcome to Signal Lost. Tap anywhere to begin your training.', target: null, action: 'tap' },
    { id: 'move', text: 'Your position is the blue dot. Move in real life to navigate the map.', target: '#missionMap', action: 'move' },
    { id: 'radar', text: 'This radar shows nearby threats (red) and objectives (green).', target: '#missionRadar', action: 'none' },
    { id: 'signal', text: 'Keep your signal strength high. Low signal makes you vulnerable.', target: '#hudSignalBar', action: 'none' },
    { id: 'stamina', text: 'Stamina drains over time and from threat contact. Find caches to recover.', target: '#hudStaminaBar', action: 'none' },
    { id: 'abilities', text: 'Your role gives you unique abilities. Tap the hotbar to use them.', target: '#abilityHotbar', action: 'tap' },
    { id: 'objectives', text: 'Reach the green circles to complete objectives. Work with your squad.', target: null, action: 'reach' },
    { id: 'threats', text: 'Red markers are threats. Avoid them or use abilities to escape.', target: null, action: 'avoid' },
    { id: 'extraction', text: 'When all objectives are complete, head to the extraction point.', target: null, action: 'none' },
    { id: 'complete', text: 'Training complete! You are ready for your first mission.', target: null, action: 'done' }
  ],

  init() {
    const saved = localStorage.getItem('slv2_tutorial');
    if (saved) {
      try { state.tutorial = JSON.parse(saved); } catch(e) {}
    }
  },

  save() {
    localStorage.setItem('slv2_tutorial', JSON.stringify(state.tutorial));
  },

  start(training = false) {
    state.tutorial.inProgress = true;
    state.tutorial.step = 0;
    state.tutorial.trainingMode = training;
    this._showStep();
    if (training) {
      // Launch a solo training mission
      state.isHost = true;
      state.maxPlayers = 1;
      state.duration = 10; // 10 min training
      state.city = 'oslo';
      startMissionClock();
    }
  },

  _showStep() {
    const step = this.STEPS[state.tutorial.step];
    if (!step) { this.complete(); return; }
    
    let overlay = document.getElementById('tutorialOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tutorialOverlay';
      overlay.className = 'tutorial-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');

    // Spotlight target
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        overlay.innerHTML = `
          <div class="tutorial-spotlight" style="top:${rect.top-8}px;left:${rect.left-8}px;width:${rect.width+16}px;height:${rect.height+16}px"></div>
          <div class="tutorial-bubble" style="top:${rect.bottom+16}px;left:${rect.left}px">
            <div class="tutorial-text">${step.text}</div>
            <button class="tutorial-next" onclick="TutorialSystem.next()">${state.tutorial.step === 0 ? 'Start' : 'Next'}</button>
          </div>
        `;
      } else {
        overlay.innerHTML = `<div class="tutorial-bubble center"><div class="tutorial-text">${step.text}</div><button class="tutorial-next" onclick="TutorialSystem.next()">Next</button></div>`;
      }
    } else {
      overlay.innerHTML = `<div class="tutorial-bubble center"><div class="tutorial-text">${step.text}</div><button class="tutorial-next" onclick="TutorialSystem.next()">Next</button></div>`;
    }
  },

  next() {
    state.tutorial.step++;
    this.save();
    if (state.tutorial.step >= this.STEPS.length) {
      this.complete();
    } else {
      this._showStep();
    }
  },

  complete() {
    state.tutorial.completed = true;
    state.tutorial.inProgress = false;
    this.save();
    const overlay = document.getElementById('tutorialOverlay');
    if (overlay) overlay.classList.add('hidden');
    if (state.tutorial.trainingMode) {
      stopMissionClock();
      setScreen('lobby');
    }
    EventLog.add('system', '🎓', '<strong>Tutorial Complete</strong> Welcome to Signal Lost');
  },

  skip() {
    state.tutorial.completed = true;
    state.tutorial.inProgress = false;
    this.save();
    const overlay = document.getElementById('tutorialOverlay');
    if (overlay) overlay.classList.add('hidden');
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `TutorialSystem.init()`
- **SplashScreen** (~line 9348): Add "Training Ground" button alongside "Play"
- **lobbyScreen** (index.html ~line 109): Add "Training" button
- **simulateWorld()** (~line 5921): If tutorial in progress and step requires action, auto-advance on condition

### HTML Additions (index.html)

```html
<!-- In splash screen, after play button -->
<button id="trainingBtn" class="ghost-button large">Training Ground</button>

<!-- In lobby screen footer -->
<button id="lobbyTrainingBtn" class="ghost-button">Training Ground</button>
```

### CSS Additions (styles-v2.css)

```css
.tutorial-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.6);
  pointer-events: auto;
}
.tutorial-spotlight {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
  pointer-events: none;
}
.tutorial-bubble {
  position: absolute;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  max-width: 280px;
  z-index: 301;
}
.tutorial-bubble.center {
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
.tutorial-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: var(--text);
}
.tutorial-next {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
}
```

---

## Task 4 — Dynamic Music & Ambient Audio

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

A `MusicSystem` module that manages layered audio tracks: ambient base layer + combat layer + tension layer. Uses Web Audio API with crossfading between states. No external files — generates procedural ambient drones and combat stingers using oscillators + noise buffers.

### State Additions

```js
// In state object (~line 176)
audio: {
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.7,
  musicVolume: 0.5,
  currentTrack: 'ambient' // 'ambient' | 'tension' | 'combat'
}
```

### JS Implementation

```js
// New module (insert before SoundFX at ~line 3493)
const MusicSystem = {
  ctx: null,
  gainNodes: {},
  currentState: 'ambient',
  
  init() {
    if (!state.audio.musicEnabled) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNodes.ambient = this.ctx.createGain();
      this.gainNodes.tension = this.ctx.createGain();
      this.gainNodes.combat = this.ctx.createGain();
      Object.values(this.gainNodes).forEach(g => {
        g.gain.value = 0;
        g.connect(this.ctx.destination);
      });
      this._startAmbient();
      this._startTension();
      this._startCombat();
      this.gainNodes.ambient.gain.value = state.audio.musicVolume;
    } catch(e) { console.warn('[MusicSystem] AudioContext failed', e); }
  },

  _startAmbient() {
    if (!this.ctx) return;
    // Procedural drone: low sine + subtle noise
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55; // A1 drone
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(this.gainNodes.ambient);
    osc.start();
    // LFO for subtle movement
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  },

  _startTension() {
    if (!this.ctx) return;
    // Pulsing low tones
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 82; // E2
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.gainNodes.tension);
    osc.start();
    // Pulse LFO
    const pulse = this.ctx.createOscillator();
    pulse.type = 'square';
    pulse.frequency.value = 0.5;
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.value = 0.08;
    pulse.connect(pulseGain);
    pulseGain.connect(gain.gain);
    pulse.start();
  },

  _startCombat() {
    if (!this.ctx) return;
    // Rhythmic sawtooth stabs
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 110; // A2
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNodes.combat);
    osc.start();
    // Rhythmic gate
    const gate = this.ctx.createOscillator();
    gate.type = 'square';
    gate.frequency.value = 4; // 4Hz stutter
    const gateGain = this.ctx.createGain();
    gateGain.gain.value = 0.12;
    gate.connect(gateGain);
    gateGain.connect(gain.gain);
    gate.start();
  },

  setState(newState) {
    if (!this.ctx || this.currentState === newState) return;
    this.currentState = newState;
    const fadeTime = 2.0;
    const now = this.ctx.currentTime;
    Object.entries(this.gainNodes).forEach(([name, node]) => {
      const target = name === newState ? state.audio.musicVolume : 0;
      node.gain.setTargetAtTime(target, now, fadeTime);
    });
  },

  tick() {
    if (!this.ctx) return;
    // Determine state from game conditions
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local) return;
    const nearestThreat = state.threats.reduce((best, t) => {
      const d = haversine(local, t);
      return d < best.d ? { t, d } : best;
    }, { d: Infinity });
    
    if (nearestThreat.d < 150) {
      this.setState('combat');
    } else if (nearestThreat.d < 400 || state.objectives.some(o => !o.found && haversine(local, o) < 100)) {
      this.setState('tension');
    } else {
      this.setState('ambient');
    }
  },

  setVolume(vol) {
    state.audio.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.gainNodes[this.currentState]) {
      this.gainNodes[this.currentState].gain.value = state.audio.musicVolume;
    }
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `MusicSystem.init()` (must be after user gesture; call from first tap)
- **simulateWorld()** (~line 5921): Add `MusicSystem.tick()`
- **Settings menu** (Task 5): Wire music/sfx toggles and volume sliders

---

## Task 5 — Settings Menu (Audio, Graphics, Controls)

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

A modal settings panel accessible from lobby and mission HUD overflow menu. Tabs: Audio, Graphics, Controls. Settings persist to localStorage. Includes master volume, music toggle, SFX toggle, theme selector, FPS cap toggle, GPS interval override, and keybind display.

### State Additions

```js
// In state object (~line 176)
settings: {
  masterVolume: 0.7,
  musicEnabled: true,
  sfxEnabled: true,
  theme: 'classic',
  fpsCap: 30,
  gpsInterval: null, // null = auto
  showFPS: false,
  reducedMotion: false,
  highContrast: false
}
```

### Settings Module

```js
// New module (insert before SplashScreen at ~line 9348)
const SettingsMenu = {
  STORAGE_KEY: 'slv2_settings',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { Object.assign(state.settings, JSON.parse(saved)); } catch(e) {}
    }
    this._applySettings();
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.settings));
    this._applySettings();
  },

  _applySettings() {
    // Audio
    if (MusicSystem) MusicSystem.setVolume(state.settings.musicEnabled ? state.settings.masterVolume * 0.7 : 0);
    // Theme
    setTheme(state.settings.theme);
    // FPS cap
    if (PerfMonitor) PerfMonitor.targetFPS = state.settings.fpsCap;
    // GPS
    if (state.settings.gpsInterval && MapModule) {
      MapModule.restartGPSWithInterval(state.settings.gpsInterval);
    }
    // Reduced motion
    document.body.dataset.reducedMotion = state.settings.reducedMotion ? 'true' : 'false';
    // High contrast
    document.body.dataset.highContrast = state.settings.highContrast ? 'true' : 'false';
  },

  open() {
    let modal = document.getElementById('settingsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settingsModal';
      modal.className = 'modal settings-modal';
      modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-panel">
          <header class="modal-header">
            <h2>Settings</h2>
            <button class="modal-close" onclick="SettingsMenu.close()">&times;</button>
          </header>
          <div class="modal-tabs">
            <button class="modal-tab active" data-tab="audio">Audio</button>
            <button class="modal-tab" data-tab="graphics">Graphics</button>
            <button class="modal-tab" data-tab="controls">Controls</button>
          </div>
          <div class="modal-body">
            <div class="tab-panel active" data-tab="audio">
              <label class="setting-row">
                <span>Master Volume</span>
                <input type="range" id="setMasterVol" min="0" max="100" value="70">
              </label>
              <label class="setting-row">
                <span>Music</span>
                <input type="checkbox" id="setMusic" checked>
              </label>
              <label class="setting-row">
                <span>Sound Effects</span>
                <input type="checkbox" id="setSFX" checked>
              </label>
            </div>
            <div class="tab-panel" data-tab="graphics">
              <label class="setting-row">
                <span>Theme</span>
                <select id="setTheme">
                  <option value="classic">Classic Signal</option>
                  <option value="sunset">Tangerine Static</option>
                  <option value="signal">Signal Candy</option>
                  <option value="night">Night Static</option>
                </select>
              </label>
              <label class="setting-row">
                <span>FPS Cap</span>
                <select id="setFPS">
                  <option value="60">60 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="15">15 FPS (battery save)</option>
                </select>
              </label>
              <label class="setting-row">
                <span>Show FPS</span>
                <input type="checkbox" id="setShowFPS">
              </label>
              <label class="setting-row">
                <span>Reduced Motion</span>
                <input type="checkbox" id="setReducedMotion">
              </label>
              <label class="setting-row">
                <span>High Contrast</span>
                <input type="checkbox" id="setHighContrast">
              </label>
            </div>
            <div class="tab-panel" data-tab="controls">
              <div class="keybind-list">
                <div class="keybind-row"><kbd>1-3</kbd><span>Abilities</span></div>
                <div class="keybind-row"><kbd>T</kbd><span>Place Trap</span></div>
                <div class="keybind-row"><kbd>U</kbd><span>Ultimate</span></div>
                <div class="keybind-row"><kbd>S</kbd><span>Stealth Toggle</span></div>
                <div class="keybind-row"><kbd>R</kbd><span>Radar Toggle</span></div>
                <div class="keybind-row"><kbd>M</kbd><span>Map Focus</span></div>
                <div class="keybind-row"><kbd>C</kbd><span>Command Wheel</span></div>
                <div class="keybind-row"><kbd>Tab</kbd><span>Panels Toggle</span></div>
              </div>
              <p class="setting-hint">Key rebinding coming in a future update.</p>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="primary-button" onclick="SettingsMenu.saveAndClose()">Save</button>
            <button class="ghost-button" onclick="SettingsMenu.reset()">Reset Defaults</button>
          </footer>
        </div>
      `;
      document.body.appendChild(modal);
      this._wireListeners();
    }
    modal.classList.remove('hidden');
    this._loadValues();
  },

  _wireListeners() {
    const modal = document.getElementById('settingsModal');
    modal.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        modal.querySelector(`.tab-panel[data-tab="${tab.dataset.tab}"]`).classList.add('active');
      });
    });
  },

  _loadValues() {
    const s = state.settings;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
    setVal('setMasterVol', Math.round(s.masterVolume * 100));
    setChecked('setMusic', s.musicEnabled);
    setChecked('setSFX', s.sfxEnabled);
    setVal('setTheme', s.theme);
    setVal('setFPS', s.fpsCap);
    setChecked('setShowFPS', s.showFPS);
    setChecked('setReducedMotion', s.reducedMotion);
    setChecked('setHighContrast', s.highContrast);
  },

  saveAndClose() {
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    const getChecked = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    state.settings.masterVolume = parseInt(getVal('setMasterVol')) / 100;
    state.settings.musicEnabled = getChecked('setMusic');
    state.settings.sfxEnabled = getChecked('setSFX');
    state.settings.theme = getVal('setTheme');
    state.settings.fpsCap = parseInt(getVal('setFPS'));
    state.settings.showFPS = getChecked('setShowFPS');
    state.settings.reducedMotion = getChecked('setReducedMotion');
    state.settings.highContrast = getChecked('setHighContrast');
    this.save();
    this.close();
  },

  reset() {
    state.settings = { masterVolume: 0.7, musicEnabled: true, sfxEnabled: true, theme: 'classic', fpsCap: 30, gpsInterval: null, showFPS: false, reducedMotion: false, highContrast: false };
    this.save();
    this._loadValues();
  },

  close() {
    document.getElementById('settingsModal')?.classList.add('hidden');
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `SettingsMenu.init()`
- **Lobby header** (index.html): Add settings button (gear icon)
- **HUD overflow menu** (index.html ~line 470): Add settings button
- **SoundFX module** (~line 3493): Respect `state.settings.sfxEnabled` and `state.settings.masterVolume`

### HTML Additions (index.html)

```html
<!-- In lobby header -->
<button id="lobbySettingsBtn" class="icon-button" title="Settings">⚙️</button>

<!-- In HUD overflow menu -->
<button id="hudSettingsBtn" class="icon-button" title="Settings">⚙️</button>
```

### CSS Additions (styles-v2.css)

```css
.settings-modal .modal-panel { max-width: 420px; width: 90%; }
.modal-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); padding: 0 16px; }
.modal-tab { background: none; border: none; color: var(--text-dim); padding: 10px 14px; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; }
.modal-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-panel { display: none; padding: 16px; }
.tab-panel.active { display: block; }
.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
.setting-row span { font-size: 13px; color: var(--text); }
.setting-row input[type="range"] { width: 120px; }
.setting-row select { background: var(--chip); color: var(--text); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; }
.keybind-list { display: flex; flex-direction: column; gap: 8px; }
.keybind-row { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.keybind-row kbd { background: var(--chip); border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; }
.setting-hint { font-size: 12px; color: var(--text-dim); margin-top: 12px; }
```

---

## Task 6 — Ping Wheel Enhancement

**Effort:** Small | **Impact:** 4/5 | **Lines:** ~120-150

### Design

Expand the 4-direction command wheel to 8 directions with contextual pings based on what's under the cursor (threat, objective, agent, empty ground). Add quick-chat radial with preset messages.

### JS Implementation

```js
// In CommandWheel (~line 2631)
// Replace existing SEGMENTS with 8-direction
SEGMENTS: [
  { angle: 0,   label: 'Move Here', icon: '📍', type: 'move' },
  { angle: 45,  label: 'Enemy Here', icon: '⚠️', type: 'danger' },
  { angle: 90,  label: 'Need Help', icon: '🆘', type: 'help' },
  { angle: 135, label: 'Regroup', icon: '👥', type: 'regroup' },
  { angle: 180, label: 'Objective', icon: '🎯', type: 'objective' },
  { angle: 225, label: 'All Clear', icon: '✅', type: 'clear' },
  { angle: 270, label: 'Watch Out', icon: '👁️', type: 'watch' },
  { angle: 315, label: 'On My Way', icon: '🏃', type: 'omw' }
],

// Add contextual detection in _getSegment()
_getSegment(angle) {
  const segments = this.SEGMENTS;
  const segAngle = 360 / segments.length; // 45 degrees
  const idx = Math.round(((angle % 360) + 360) % 360 / segAngle) % segments.length;
  return segments[idx];
},

// Contextual override based on cursor target
_getContextualSegment(baseSeg, lat, lng) {
  const local = state.agents.find(a => a.id === state.localAgentId);
  if (!local) return baseSeg;
  
  // Check for nearby threat
  const nearThreat = state.threats.find(t => haversine({lat,lng}, t) < 50);
  if (nearThreat && baseSeg.type === 'danger') {
    return { ...baseSeg, label: `${nearThreat.name} Here!`, threatId: nearThreat.id };
  }
  
  // Check for nearby objective
  const nearObj = state.objectives.find(o => !o.found && haversine({lat,lng}, o) < 30);
  if (nearObj && baseSeg.type === 'objective') {
    return { ...baseSeg, label: `Objective: ${o.type}`, objectiveId: nearObj.id };
  }
  
  // Check for downed agent
  const nearDowned = Object.entries(state.downedAgents || {}).find(([id, d]) => 
    !d.eliminated && !d.revivedBy && haversine({lat,lng}, d) < 20
  );
  if (nearDowned && baseSeg.type === 'help') {
    return { ...baseSeg, label: 'Revive Needed!', downedId: nearDowned[0] };
  }
  
  return baseSeg;
}
```

### Integration Points

- **CommandWheel** (~line 2631): Update SEGMENTS array, modify `_getSegment()` and `_onSelect()`
- **game-v2.js key handler** (~line 4700): Ensure `C` key still opens wheel
- **styles-v2.css**: Update command wheel CSS for 8 segments (smaller slice angles)

### CSS Additions

```css
.command-wheel-segment { --slice: 45deg; }
.command-wheel-label { font-size: 11px; }
```

---

## Task 7 — Match History & Stats Tracking

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~180-220

### Design

Track every mission outcome to localStorage with: date, result, score, objectives, role, team, duration, threats encountered, weather, and notable events. Display a scrollable match history on the results screen and a stats dashboard accessible from lobby.

### State Additions

```js
// In state object (~line 176)
matchHistory: [], // loaded from localStorage
sessionStats: { missions: 0, wins: 0, avgScore: 0, favoriteRole: null }
```

### Stats Module

```js
// New module (insert before RoleProgression at ~line 9460)
const StatsTracker = {
  STORAGE_KEY: 'slv2_match_history',
  MAX_ENTRIES: 50,

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.matchHistory = JSON.parse(saved); } catch(e) {}
    }
    this._computeSessionStats();
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.matchHistory.slice(-this.MAX_ENTRIES)));
  },

  recordMission(result) {
    const local = state.agents.find(a => a.id === state.localAgentId);
    const entry = {
      id: 'match-' + Date.now(),
      date: new Date().toISOString(),
      result, // 'win' | 'loss' | 'abandoned'
      score: missionScore(),
      role: local?.role || 'Unknown',
      team: local?.team || 'Unknown',
      objectivesFound: state.objectives.filter(o => o.found).length,
      totalObjectives: state.objectives.length,
      duration: state.duration * 60 - state.remaining,
      weather: state.weather?.type || 'clear',
      threatsEncountered: state.threats?.length || 0,
      xpGained: RoleProgression?.awardMissionXP?.() || 0,
      city: state.city,
      grade: scoreGrade(missionScore())
    };
    state.matchHistory.push(entry);
    this.save();
    this._computeSessionStats();
    return entry;
  },

  _computeSessionStats() {
    const history = state.matchHistory;
    if (!history.length) return;
    const missions = history.length;
    const wins = history.filter(h => h.result === 'win').length;
    const avgScore = Math.round(history.reduce((s, h) => s + h.score, 0) / missions);
    const roleCounts = {};
    history.forEach(h => { roleCounts[h.role] = (roleCounts[h.role] || 0) + 1; });
    const favoriteRole = Object.entries(roleCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || null;
    state.sessionStats = { missions, wins, avgScore, favoriteRole, winRate: Math.round(wins/missions*100) };
  },

  renderHistoryList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const history = state.matchHistory.slice().reverse();
    if (!history.length) {
      container.innerHTML = '<p class="empty-history">No missions yet. Complete your first mission to see history.</p>';
      return;
    }
    container.innerHTML = history.map(h => `
      <div class="history-entry">
        <div class="history-main">
          <span class="history-grade grade-${h.grade.toLowerCase()}">${h.grade}</span>
          <span class="history-role">${roleEmojis[h.role] || ''} ${h.role}</span>
          <span class="history-result result-${h.result}">${h.result}</span>
        </div>
        <div class="history-detail">
          <span>${h.objectivesFound}/${h.totalObjectives} objs</span>
          <span>${h.score} pts</span>
          <span>${h.weather} ${h.city}</span>
          <span>${new Date(h.date).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  },

  renderStatsDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const s = state.sessionStats;
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${s.missions}</div><div class="stat-label">Missions</div></div>
        <div class="stat-card"><div class="stat-value">${s.winRate || 0}%</div><div class="stat-label">Win Rate</div></div>
        <div class="stat-card"><div class="stat-value">${s.avgScore || 0}</div><div class="stat-label">Avg Score</div></div>
        <div class="stat-card"><div class="stat-value">${s.favoriteRole ? (roleEmojis[s.favoriteRole] || '') + ' ' + s.favoriteRole : '-'}</div><div class="stat-label">Favorite Role</div></div>
      </div>
    `;
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `StatsTracker.init()`
- **renderResults()** (~line 9103): Add `StatsTracker.recordMission(result)` call
- **resultsScreen** (index.html ~line 734): Add match history panel
- **lobbyScreen** (index.html ~line 109): Add stats dashboard button

### HTML Additions

```html
<!-- In results screen, after main content -->
<div class="card">
  <h3>Match History</h3>
  <div id="matchHistoryList" class="scroll-list"></div>
</div>

<!-- In lobby header -->
<button id="statsBtn" class="icon-button" title="Stats">📊</button>
```

### CSS Additions

```css
.history-entry { padding: 10px 12px; border-bottom: 1px solid var(--border); }
.history-main { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.history-grade { font-weight: 800; font-size: 16px; width: 28px; text-align: center; }
.grade-s { color: #ffd700; } .grade-a { color: #4caf50; } .grade-b { color: #8bc34a; }
.grade-c { color: #ff9800; } .grade-d { color: #f44336; }
.history-result { font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 700; }
.result-win { background: rgba(76,175,80,0.2); color: #4caf50; }
.result-loss { background: rgba(244,67,54,0.2); color: #f44336; }
.result-abandoned { background: rgba(158,158,158,0.2); color: #9e9e9e; }
.history-detail { display: flex; gap: 12px; font-size: 11px; color: var(--text-dim); }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-card { background: var(--chip); padding: 14px; border-radius: var(--radius-sm); text-align: center; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--accent); }
.stat-label { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
```

---

## Task 8 — Admin Panel (Host-only)

**Effort:** Small | **Impact:** 3/5 | **Lines:** ~100-130

### Design

Host players get an admin panel accessible from the HUD overflow menu. Actions: kick player, pause mission, force-end mission, broadcast message, reset objectives. Server validates host identity on every admin action.

### Server Changes

```js
// In server-v2.js, add to socket handlers (~line 215)
socket.on('admin-action', ({ action, targetId, message }) => {
  if (!currentGame || !currentPlayer) return;
  const game = games.get(currentGame);
  if (!game || game.host !== socket.id) return; // only host

  switch (action) {
    case 'kick':
      if (game.players[targetId] && targetId !== socket.id) {
        const targetSocket = io.sockets.sockets.get(targetId);
        if (targetSocket) {
          targetSocket.emit('kicked', { reason: message || 'Kicked by host' });
          targetSocket.leave(currentGame);
        }
        delete game.players[targetId];
        io.to(currentGame).emit('players-update', game.players);
        io.to(currentGame).emit('chat', { sender: 'System', text: `${game.players[targetId]?.name || 'Player'} was kicked.` });
      }
      break;
    case 'pause':
      game.paused = !game.paused;
      io.to(currentGame).emit('mission-paused', { paused: game.paused });
      break;
    case 'end':
      _endMission(currentGame, 'host-ended');
      break;
    case 'broadcast':
      io.to(currentGame).emit('chat', { sender: 'Host', text: message, highlight: true });
      break;
  }
});
```

### Client Admin Panel

```js
// New module (insert before SplashScreen at ~line 9348)
const AdminPanel = {
  open() {
    if (!state.isHost) return;
    let panel = document.getElementById('adminPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'adminPanel';
      panel.className = 'modal admin-modal';
      panel.innerHTML = `
        <div class="modal-backdrop" onclick="AdminPanel.close()"></div>
        <div class="modal-panel">
          <header class="modal-header"><h2>Admin</h2><button class="modal-close" onclick="AdminPanel.close()">&times;</button></header>
          <div class="admin-actions">
            <button class="admin-btn" onclick="AdminPanel.pause()">⏸ Pause/Resume</button>
            <button class="admin-btn danger" onclick="AdminPanel.endMission()">⏹ Force End</button>
            <div class="admin-divider"></div>
            <input type="text" id="adminBroadcast" placeholder="Broadcast message…" maxlength="140">
            <button class="admin-btn" onclick="AdminPanel.broadcast()">📢 Broadcast</button>
            <div class="admin-divider"></div>
            <div id="adminPlayerList" class="admin-player-list"></div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }
    panel.classList.remove('hidden');
    this._renderPlayerList();
  },

  _renderPlayerList() {
    const list = document.getElementById('adminPlayerList');
    if (!list) return;
    list.innerHTML = state.agents.filter(a => a.id !== state.localAgentId).map(a => `
      <div class="admin-player-row">
        <span>${a.callsign} (${a.name})</span>
        <button class="admin-kick" onclick="AdminPanel.kick('${a.id}')">Kick</button>
      </div>
    `).join('');
  },

  kick(targetId) {
    SignalNet.socket?.emit('admin-action', { action: 'kick', targetId });
  },
  pause() {
    SignalNet.socket?.emit('admin-action', { action: 'pause' });
  },
  endMission() {
    if (!confirm('Force end the mission for all players?')) return;
    SignalNet.socket?.emit('admin-action', { action: 'end' });
  },
  broadcast() {
    const msg = document.getElementById('adminBroadcast')?.value;
    if (!msg) return;
    SignalNet.socket?.emit('admin-action', { action: 'broadcast', message: msg });
    document.getElementById('adminBroadcast').value = '';
  },
  close() {
    document.getElementById('adminPanel')?.classList.add('hidden');
  }
};
```

### Integration Points

- **server-v2.js**: Add `admin-action` handler
- **game-v2.js SignalNet**: Add `mission-paused` and `kicked` listeners
- **HUD overflow menu** (index.html): Add admin button (only visible to host)
- **simulateWorld()** (~line 5921): Skip tick if `state.missionPaused`

---

## Task 9 — In-Game Chat Improvements

**Effort:** Small | **Impact:** 3/5 | **Lines:** ~80-100

### Design

Add team-only chat toggle, quick-chat presets (radial menu on mobile, keybinds on desktop), and chat message timestamps. Preserve chat history across mission phases.

### Quick Chat Presets

```js
// In state object (~line 176)
quickChat: [
  { key: 'F1', label: 'Enemy spotted!', icon: '⚠️' },
  { key: 'F2', label: 'Need backup!', icon: '🆘' },
  { key: 'F3', label: 'Objective found', icon: '🎯' },
  { key: 'F4', label: 'Regroup on me', icon: '👥' },
  { key: 'F5', label: 'All clear', icon: '✅' },
  { key: 'F6', label: 'Good game', icon: '🤝' }
]
```

### Integration Points

- **LobbyChat module** (~line 1230): Add team-only toggle, timestamps
- **CommandWheel** (~line 2631): Add quick-chat sub-wheel (hold C longer for chat)
- **game-v2.js key handler**: Add F1-F6 quick-chat bindings
- **renderChat()** (~line 8521): Show timestamps, team badges

### CSS Additions

```css
.chat-timestamp { font-size: 10px; color: var(--text-dim); margin-right: 6px; }
.chat-team-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
.team-north { background: rgba(88,166,255,0.2); color: #58a6ff; }
.team-south { background: rgba(255,139,31,0.2); color: #ff8b1f; }
```

---

## Task 10 — Reconnection & Recovery

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~150-180

### Design

When a player disconnects (network drop, browser crash, tab close), they have 60 seconds to reconnect and resume their mission with the same role, position, and progress. Server keeps a "ghost" player entry. On reconnect, client requests `reconnect` with their old socket ID; server validates and restores state.

### Server Changes

```js
// In server-v2.js, add at top (~line 22)
const disconnectedPlayers = new Map(); // socket.id -> { gameCode, player, disconnectTime, timeoutId }
const RECONNECT_WINDOW = 60000; // 60s

// In disconnect handler (~line 236), replace with:
socket.on('disconnect', () => {
  console.log(`[disconnect] ${socket.id}`);
  if (currentGame) {
    const specSet = spectators.get(currentGame);
    if (specSet && specSet.has(socket.id)) {
      specSet.delete(socket.id);
      if (specSet.size === 0) spectators.delete(currentGame);
      io.to(currentGame).emit('spectator-count', specSet?.size || 0);
    }
    const game = games.get(currentGame);
    if (game) {
      // Don't delete immediately — allow reconnect
      const dp = { gameCode: currentGame, player: { ...currentPlayer }, disconnectTime: Date.now() };
      const timeoutId = setTimeout(() => {
        // Reconnect window expired — actually remove
        disconnectedPlayers.delete(socket.id);
        if (game.players[socket.id]) {
          delete game.players[socket.id];
          if (Object.keys(game.players).length === 0) {
            games.delete(currentGame);
            spectators.delete(currentGame);
            if (gameLoops.has(currentGame)) {
              clearInterval(gameLoops.get(currentGame).intervalId);
              gameLoops.delete(currentGame);
            }
          } else {
            io.to(currentGame).emit('players-update', game.players);
            io.to(currentGame).emit('chat', { sender: 'System', text: `${currentPlayer?.name || 'A player'} disconnected.` });
          }
        }
      }, RECONNECT_WINDOW);
      dp.timeoutId = timeoutId;
      disconnectedPlayers.set(socket.id, dp);
      io.to(currentGame).emit('player-disconnected', { id: socket.id, name: currentPlayer?.name, reconnectWindow: RECONNECT_WINDOW });
    }
  }
});

// Add reconnect handler (~line 215)
socket.on('reconnect-request', ({ oldSocketId, profile }) => {
  const dp = disconnectedPlayers.get(oldSocketId);
  if (!dp) return socket.emit('error-msg', 'Reconnect window expired. Join as new player.');
  
  const game = games.get(dp.gameCode);
  if (!game) return socket.emit('error-msg', 'Game no longer exists.');
  
  clearTimeout(dp.timeoutId);
  disconnectedPlayers.delete(oldSocketId);
  
  // Restore player with new socket id
  const restoredPlayer = { ...dp.player, id: socket.id };
  game.players[socket.id] = restoredPlayer;
  currentGame = dp.gameCode;
  currentPlayer = restoredPlayer;
  socket.join(dp.gameCode);
  
  socket.emit('reconnect-success', {
    code: dp.gameCode,
    players: game.players,
    settings: game.settings,
    state: game.state,
    authoritative: game.authoritative
  });
  io.to(dp.gameCode).emit('players-update', game.players);
  io.to(dp.gameCode).emit('chat', { sender: 'System', text: `${restoredPlayer.name} reconnected!` });
});
```

### Client Changes

```js
// In SignalNet (~line 983)
reconnect(oldSocketId) {
  if (!this.socket) this.init();
  this.socket.emit('reconnect-request', { oldSocketId, profile: state.localProfile });
},

// Add listeners
this.socket.on('reconnect-success', ({ code, players, settings, state: gameState, authoritative }) => {
  state.code = code;
  state.agents = Object.values(players).filter(p => !p.bot).map(p => ({
    id: p.id, name: p.name, callsign: p.callsign, role: p.role, team: p.team,
    lat: p.lat, lng: p.lng, signal: p.signal || 85, stamina: p.stamina || 90
  }));
  state.settings = { ...state.settings, ...settings };
  if (authoritative) {
    state.threats = authoritative.threats;
    state.objectives = authoritative.objectives;
    state.scores = authoritative.scores;
  }
  if (gameState === 'mission') {
    setScreen('mission');
    startMissionClock();
  } else {
    setScreen('lobby');
  }
  addChat('System', 'Reconnected successfully!');
});

this.socket.on('player-disconnected', ({ id, name, reconnectWindow }) => {
  addChat('System', `⚠️ ${name} disconnected. Reconnect window: ${reconnectWindow/1000}s`);
});

this.socket.on('kicked', ({ reason }) => {
  alert(`You were kicked from the mission. Reason: ${reason}`);
  setScreen('lobby');
});
```

### Integration Points

- **server-v2.js**: Add `disconnectedPlayers` Map, modify disconnect handler, add `reconnect-request` handler
- **game-v2.js SignalNet**: Add reconnect method and listeners
- **init()** (~line 9709): On load, check `localStorage.getItem('slv2_lastSocketId')` and offer reconnect if applicable
- **SplashScreen / Lobby**: Show reconnect banner if previous session detected

---

## File Map

| Feature | Primary File | Insert Area |
|---------|-------------|-------------|
| Server State Sync | server-v2.js | New functions after launch-mission (~line 215) |
| 4 New Roles | game-v2.js | roleCatalog, executeTool, simulateWorld (~line 26-7400) |
| Tutorial System | game-v2.js | New module before SplashScreen (~line 9348) |
| Dynamic Music | game-v2.js | New module before SoundFX (~line 3493) |
| Settings Menu | game-v2.js | New module before SplashScreen (~line 9348) |
| Ping Wheel | game-v2.js | CommandWheel modifications (~line 2631) |
| Match History | game-v2.js | New module before RoleProgression (~line 9460) |
| Admin Panel | server-v2.js + game-v2.js | Admin handlers + client panel |
| Chat Improvements | game-v2.js | LobbyChat module (~line 1230) |
| Reconnection | server-v2.js + game-v2.js | Disconnect handler + reconnect flow |

### game-v2.js Insertion Points

| Feature | Function / Location | Approx Line |
|---------|--------------------|-------------|
| Role catalog additions | Data section | ~26-140 |
| Role ability handlers | `executeTool()` | ~7396 |
| Role progression XP | `RoleProgression` | ~9460 |
| Turret tick | `simulateWorld()` | ~5921 |
| Music tick | `simulateWorld()` | ~5921 |
| Tutorial init | `init()` | ~9709 |
| Settings init | `init()` | ~9709 |
| Stats init | `init()` | ~9709 |
| Reconnect listeners | `SignalNet.init()` | ~1000 |
| Admin panel | HUD overflow menu | ~470 |

### index.html Insertion Points

| Feature | Insert After | Approx Line |
|---------|-------------|-------------|
| Training button | Splash play button | ~88 |
| Lobby training button | Lobby footer | ~109 |
| Settings button | Lobby header | ~109 |
| Stats button | Lobby header | ~109 |
| Admin button | HUD overflow menu | ~470 |
| Match history | Results screen | ~734 |
| Settings modal | Body end | ~776 |
| Admin modal | Body end | ~776 |

### styles-v2.css Insertion Points

| Feature | Approx Location |
|---------|----------------|
| Tutorial styles | End of file |
| Settings modal styles | End of file |
| Admin panel styles | End of file |
| Match history styles | End of file |
| Chat improvements | End of file |

---

## Execution Order

Build in priority order. After each task:
1. `node --check game-v2.js`
2. `node --check server-v2.js`
3. `git add -A && git commit -m "feat: [feature name]"`
4. Move to next task

**Task 1 (Server Sync)** must be first — it changes the foundation. **Task 2 (New Roles)** should follow since it expands the data model. **Task 10 (Reconnection)** should be done before any public testing. The rest can be done in any order.

---

*Research conducted May 2026. All estimates based on existing codebase patterns and architectural constraints.*
