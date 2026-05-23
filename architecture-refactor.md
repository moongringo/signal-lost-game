# Signal Lost v2 — Architecture Refactoring Plan

> **Source:** `game-v2.js` — 7,170 lines, 274 KB
> **Pattern:** IIFE modules (already proven by `MapModule` at line 3024)
> **Goal:** 15 split files, EventBus decoupling, simple concatenation build

---

## 1. Current Structure Analysis

**43 sections, ~38 named module objects** — all dumped into global `const` scope. The `state` object (line 148) is a mutable global that every module reads/writes directly with zero change tracking.

**Pain points:**

| Issue | Example |
|-------|---------|
| No encapsulation | All modules are `const X = { ... }` — one typo clobbers any module |
| Hidden coupling | `SplashScreen.dismiss()` calls `renderChat()` (line 7125); `ParticleSystem._loop()` calls `PerfMonitor.tick()` (line 256) |
| No init lifecycle | `init()` (line 7140) calls 15+ `.init()` in arbitrary sequence |
| No state observable | No way to detect `state.remaining` changed → re-render HUD |
| Untestable | All 7K lines must parse before anything runs |
| No build | Single `<script src="game-v2.js">` in HTML |

**Dependency web** — most modules reference 3-7 other modules directly via global scope:
```
MapModule → state, PingSystem, CommandWheel, ScreenJuice, DayNightCycle
CommandWheel → state, MapModule, SoundFX, RadarModule, PingSystem
EventLog → state, ScreenJuice
SplashScreen → state, SoundFX, LobbyChat, initLobby
```

---

## 2. Module Splitting Recommendation

**Pattern: IIFE Modules**
```js
const ModuleName = (() => {
  // private state here
  return { method1, method2 }; // public API only
})();
```

Already proven by `MapModule` (line 3024). Provides true encapsulation, explicit API surface, zero external dependencies, and backward compatibility — callers that reference `MapModule.someMethod()` keep working during incremental migration.

**Migration strategy:** Split one module at a time. Each extracted file is immediately usable because the global name stays the same. No "big bang" required.

---

## 3. File Organization — 15 Files with Line Counts

```
signal-lost-game-v2/src/
├── 01-data.js        136  — Pure data (cities, roles, missions, themes, cooldowns)
├── 02-state.js        77  — Global state + localStorage save/load
├── 03-utils.js        41  — clamp, haversine, formatTime, escapeHtml, $(id)
├── 04-eventbus.js     50  — Pub/sub EventBus (NEW, see §4)
│
├── 05-particles.js   161  — ParticleSystem (all particle emitters)
├── 06-juice.js       212  — ScreenJuice + DamageNumbers (visual feedback)
├── 07-sound.js        44  — SoundFX (AudioContext wrapper)
│
├── 08-map.js         533  — MapModule (IIFE, Leaflet integration)
├── 09-radar.js       366  — RadarModule (scanning + range visualization)
├── 10-wheel.js       350  — CommandWheel (context menu + ability triggers)
│
├── 11-net.js         246  — SignalNet (Socket.IO multiplayer)
├── 12-peripherals.js 347  — PingSystem + StealthMode + WaypointsModule +
│                            BatteryAwareGPS + PerfMonitor + DayNightCycle
│
├── 13-screens.js     ~1700 — Lobby + Setup + Roles + Mission + HUD +
│                              Spectator + Results (bulk screen logic)
├── 14-boot.js         200  — ThemeCanvas + ScreenRouting + SplashScreen + init()
│
└── 15-pwa.js         119  — PWAInstall + ServiceWorkerModule
```
**Total:** ~4,482 lines (vs 7,170 monolithic). Savings from removing redundant section headers, consolidating inline functions, and EventBus eliminating boilerplate cross-module guards.

---

## 4. State Management — EventBus Pattern

**Problem:** `state` is a raw mutable global. No change detection, no validation, no history.

**Solution: EventBus + State Proxy**

```js
// src/eventbus.js
const EventBus = (() => {
  const _listeners = {};
  return {
    on(event, cb) { /* subscribe */ return () => this.off(event, cb); },
    off(event, cb) { /* unsubscribe */ },
    emit(event, data) { /* notify all subscribers */ }
  };
})();
```

```js
// src/state.js — Proxy wrapper for automatic events
const state = new Proxy(_state, {
  set(target, key, value) {
    const old = target[key];
    target[key] = value;
    saveState();                    // auto-persist to localStorage
    EventBus.emit('state:' + key, { old, new: value });
    EventBus.emit('state:change', { key, old, new: value });
    return true;
  }
});
```

**Key events for decoupling:**

| Event | Payload | Subscribers |
|-------|---------|-------------|
| `state:screen` | `{old, new}` | ScreenRouter, SplashScreen |
| `state:remaining` | `{old, new}` | HUD, TimerWarnings |
| `state:agents` | `{old, new}` | MapModule, HUD, Radar, Spectator |
| `state:objectives` | `{old, new}` | MapModule, ObjectiveAutoFocus |
| `state:status` | `{old, new}` | Mission clock, Results |
| `ability:used` | `{role, tool}` | AbilityHotbar, SoundFX, EventLog |
| `ping:placed` | `{lat, lng, type}` | PingSystem, MapModule, SoundFX |
| `gps:update` | `{lat, lng, accuracy}` | MapModule, Radar, Spectator |

**Migration phases:** (1) Add EventBus — no behavioral change. (2) Wrap state in Proxy — watch for breakage. (3) Replace direct calls (`ScreenJuice.addKillFeed(...)`) with events (`EventBus.emit('message:killfeed', ...)`).

---

## 5. Build Setup

**Recommendation: Simple concatenation** (no bundler for a 7K codebase)

```json
// package.json
{
  "scripts": {
    "build": "cat src/*.js > dist/game-v2.js",
    "watch": "while inotifywait -e modify src/; do npm run build; done"
  }
}
```

File naming `01-data.js`, `02-state.js`, etc. ensures correct concat order via lexical sort. `index.html` stays unchanged — still loads `dist/game-v2.js`.

**Alternative — ES Module import maps** (Chrome 108+, Firefox 108+):
```html
<script type="importmap">
{ "imports": { "sl/state": "./src/state.js", "sl/eventbus": "./src/eventbus.js" } }
</script>
<script type="module" src="src/main.js"></script>
```
Overhead not worth it for this codebase size. Stick with concatenation.

---

## Migration Steps (Recommended Order)

| Step | What | Risk | Time |
|------|------|------|------|
| 1 | Extract `src/data.js` — zero coupling | None | 5 min |
| 2 | Extract `src/eventbus.js` + `src/state.js` (Proxy) | Low | 15 min |
| 3 | Extract `src/utils.js` | None | 5 min |
| 4–6 | Extract sound, particles, juice — each ~50-160 lines | Low | 25 min |
| 7 | Extract `src/map.js` — already IIFE, cleanest cut | Medium | 15 min |
| 8–10 | Extract radar, wheel, net — 200-350 lines each | Medium | 45 min |
| 11 | Extract `src/peripherals.js` — 6 smaller modules merged | Medium | 20 min |
| 12 | Extract `src/screens.js` — biggest chunk (~1700 lines) | High | 60 min |
| 13 | Extract `src/boot.js` | Low | 15 min |
| 14 | Build script + test | Low | 10 min |

**Total:** ~3 hours. Each step independently testable — no "big bang."
