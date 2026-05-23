# Phase 10 — GameStore IndexedDB Implementation Plan

> **Signal Lost v2** — Replace scattered `localStorage` with unified `GameStore`  
> **Status:** Design Complete → Implementation Ready  
> **Source Design:** `rd-phase10-storage-design.md` (838 lines)

---

## 1. Architecture Summary

```
┌─────────────────────────────────────────────┐
│  Game Modules (FriendSystem, Settings, etc) │
│         ↓ await GameStore.get/set()         │
├─────────────────────────────────────────────┤
│           GameStore Module                  │
│  ┌─────────┐  ┌──────────────────────┐     │
│  │  API    │  │  Schema Registry     │     │
│  │get/set/ │  │  + Migration Runners │     │
│  │delete/  │  │  + Default Values    │     │
│  │clear/   │  └──────────────────────┘     │
│  │keys/    │                                 │
│  │getMany/ │  ┌──────────────────────┐     │
│  │setMany  │  │  IndexedDB (primary) │     │
│  └────┬────┘  │  'SignalLostV2' v1   │     │
│       │       │  objectStore: gameData│     │
│       │       └──────────────────────┘     │
│       │       ↓ fallback on any failure     │
│       │       ┌──────────────────────┐     │
│       └──────►│  localStorage        │     │
│               │  prefix: slv2_store_ │     │
│               └──────────────────────┘     │
└─────────────────────────────────────────────┘
```

**Key principle:** All existing modules keep their object-style structure. Only their `_load()` and `_save()` methods change from `localStorage.getItem/setItem` to `GameStore.get/set`.

---

## 2. GameStore Module Structure

### 2.1 File Location

`GameStore` lives **inside `game-v2.js`** (not a separate file) because:
- It's a core dependency for ~20 modules in the same file
- Avoids circular dependency issues
- Keeps the single-file architecture intact

**Insertion point:** After the `state` object definition (~line 634), before `ParticleSystem` (~line 1041).

### 2.2 Full Module Implementation (~350 lines)

```javascript
/* ========================== UNIFIED STORAGE (Phase 10) ========================== */

const GameStore = {
  // ── Configuration ──
  DB_NAME: 'SignalLostV2',
  DB_VERSION: 1,
  STORE_NAME: 'gameData',
  FALLBACK_PREFIX: 'slv2_store_',

  // ── Internal State ──
  _db: null,
  _ready: false,
  _fallback: false,
  _queue: [],

  // ── Schema Registry: keys + defaults + validators ──
  SCHEMA: {
    'profile':                  { default: { name: 'Morgan', callsign: 'Raven', skin: 'skin_default' } },
    'settings.audio':           { default: { masterVolume: 80, musicEnabled: true, sfxEnabled: true } },
    'settings.graphics':        { default: { quality: 'high', theme: 'classic', fpsCap: 30, showFPS: false, reducedMotion: false, highContrast: false } },
    'settings.controls':        { default: { sensitivity: 5, keybinds: {} } },
    'settings.accessibility':   { default: { reducedMotion: false, highContrast: false } },
    'locations.default':        { default: null },
    'locations.favorites':      { default: [] },
    'loadouts.presets':         { default: [] },
    'loadouts.active':          { default: null },
    'achievements.progress':    { default: {} },
    'achievements.unlocks':     { default: [] },
    'stats.history':            { default: [] },
    'stats.aggregates':         { default: { missions: 0, wins: 0, avgScore: 0, totalKills: 0, totalDeaths: 0, totalXP: 0 } },
    'friends.list':             { default: [] },
    'friends.pending':          { default: [] },
    'cosmetics.inventory':      { default: {} },
    'cosmetics.equipped':       { default: { trail: 'trail_classic', skin: 'skin_default' } },
    'currency':                 { default: { credits: 0, tokens: 0 } },
    'progression.roles':        { default: { xp: {}, tier: {} } },
    'progression.battlepass':   { default: { season: 1, tier: 1, xp: 0, premium: false, claimed: [] } },
    'progression.daily':        { default: { missions: [], date: '' } },
    'tutorial':                 { default: { completed: false, step: 0 } },
    'customMaps':               { default: [] },
    'hud.layout':               { default: {} },
    'hud.panels':               { default: {} },
    'tournaments':              { default: { active: [], myRegistrations: [] } },
    'clan':                     { default: null },
    'voice.settings':           { default: { enabled: false, muted: false, pushToTalk: true, pttKey: 'v' } },
    'debug.enabled':            { default: false },
    'net.lastSocketId':         { default: null },
    'net.joinCode':             { default: '' },
    '_schemaVersion':           { default: 1 },
    '_migratedAt':              { default: 0 }
  },

  // ── Lifecycle ──
  async init() {
    if (this._ready) return;
    try {
      this._db = await this._openDB();
      this._ready = true;
      const migrated = await this.get('_migratedAt');
      if (!migrated) {
        await this.migrateFromLocalStorage();
      }
    } catch (e) {
      console.warn('[GameStore] IndexedDB failed, using localStorage fallback:', e);
      this._fallback = true;
      this._ready = true;
    }
    this._drainQueue();
  },

  _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const oldVersion = e.oldVersion;
        this._onUpgrade(db, oldVersion, this.DB_VERSION);
      };
    });
  },

  _onUpgrade(db, oldVersion, newVersion) {
    if (oldVersion < 1) {
      db.createObjectStore(this.STORE_NAME);
    }
    // Future migrations:
    // if (oldVersion < 2) { ... }
  },

  _drainQueue() {
    while (this._queue.length) {
      const { fn, resolve, reject } = this._queue.shift();
      fn().then(resolve).catch(reject);
    }
  },

  _enqueue(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
    });
  },

  // ── Core API ──
  async get(key, defaultValue) {
    // Use schema default if no explicit default provided
    if (defaultValue === undefined && this.SCHEMA[key]) {
      defaultValue = this.SCHEMA[key].default;
    }

    if (!this._ready) {
      await new Promise(r => setTimeout(r, 50));
      return this.get(key, defaultValue);
    }

    if (this._fallback) {
      return this._fallbackGet(key, defaultValue);
    }

    try {
      return await new Promise((resolve, reject) => {
        const tx = this._db.transaction([this.STORE_NAME], 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : defaultValue);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[GameStore] get failed:', key, e);
      return defaultValue;
    }
  },

  async set(key, value) {
    if (!this._ready) {
      return this._enqueue(() => this.set(key, value));
    }

    if (this._fallback) {
      return this._fallbackSet(key, value);
    }

    try {
      return await new Promise((resolve, reject) => {
        const tx = this._db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          // Quota exceeded → switch to fallback
          if (req.error && req.error.name === 'QuotaExceededError') {
            console.warn('[GameStore] Quota exceeded, switching to fallback');
            this._fallback = true;
            this._fallbackSet(key, value).then(resolve).catch(reject);
          } else {
            reject(req.error);
          }
        };
      });
    } catch (e) {
      console.warn('[GameStore] set failed:', key, e);
      // Last resort: try fallback
      return this._fallbackSet(key, value);
    }
  },

  async delete(key) {
    if (!this._ready) {
      return this._enqueue(() => this.delete(key));
    }
    if (this._fallback) {
      return this._fallbackDelete(key);
    }
    try {
      await new Promise((resolve, reject) => {
        const tx = this._db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[GameStore] delete failed:', key, e);
    }
    // Also clean fallback
    try { localStorage.removeItem(this.FALLBACK_PREFIX + key); } catch {}
  },

  async clear() {
    if (!this._ready) {
      return this._enqueue(() => this.clear());
    }
    if (this._fallback) {
      return this._fallbackClear();
    }
    try {
      await new Promise((resolve, reject) => {
        const tx = this._db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[GameStore] clear failed:', e);
    }
  },

  async keys(prefix = '') {
    if (!this._ready) {
      await new Promise(r => setTimeout(r, 50));
      return this.keys(prefix);
    }
    if (this._fallback) {
      return this._fallbackKeys(prefix);
    }
    try {
      return await new Promise((resolve, reject) => {
        const tx = this._db.transaction([this.STORE_NAME], 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => {
          const keys = req.result || [];
          resolve(prefix ? keys.filter(k => k.startsWith(prefix)) : keys);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[GameStore] keys failed:', e);
      return [];
    }
  },

  async getMany(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    return result;
  },

  async setMany(entries) {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value);
    }
  },

  // ── Fallback Methods (localStorage) ──
  _fallbackGet(key, defaultValue) {
    try {
      const raw = localStorage.getItem(this.FALLBACK_PREFIX + key);
      if (raw === null) return defaultValue;
      return this._deserialize(raw);
    } catch (e) {
      return defaultValue;
    }
  },

  _fallbackSet(key, value) {
    try {
      localStorage.setItem(this.FALLBACK_PREFIX + key, this._serialize(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('[GameStore] localStorage quota exceeded');
      }
    }
  },

  _fallbackDelete(key) {
    try {
      localStorage.removeItem(this.FALLBACK_PREFIX + key);
    } catch {}
  },

  _fallbackClear() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.FALLBACK_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  _fallbackKeys(prefix) {
    const keys = [];
    const fullPrefix = this.FALLBACK_PREFIX + prefix;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) {
          keys.push(k.slice(this.FALLBACK_PREFIX.length));
        }
      }
    } catch {}
    return keys;
  },

  // ── Serialization ──
  _serialize(value) {
    return JSON.stringify(value);
  },

  _deserialize(raw) {
    return JSON.parse(raw);
  },

  // ── Migration from localStorage ──
  async migrateFromLocalStorage() {
    const migrations = [
      { old: 'slv2_profile', new: 'profile', transform: v => v },
      { old: 'slv2_friends', new: 'friends.list', transform: v => v },
      { old: 'slv2_inventory', new: 'cosmetics.inventory', transform: v => v },
      { old: 'slv2_currency', new: 'currency', transform: v => v },
      { old: 'slv2_match_history', new: 'stats.history', transform: v => v },
      { old: 'slv2_role_progression', new: 'progression.roles', transform: v => v },
      { old: 'slv2_battlepass', new: 'progression.battlepass', transform: v => v },
      { old: 'slv2_tutorial', new: 'tutorial', transform: v => v },
      { old: 'slv2_custom_maps', new: 'customMaps', transform: v => v },
      { old: 'slv2_defaultLocation', new: 'locations.default', transform: v => v },
      { old: 'slv2_favoriteLocations', new: 'locations.favorites', transform: v => v },
      { old: 'slv2_tournaments', new: 'tournaments', transform: v => v },
      { old: 'slv2_lastSocketId', new: 'net.lastSocketId', transform: v => v },
      { old: 'slv2_joinCode', new: 'net.joinCode', transform: v => v },
      { old: 'slv2_debug', new: 'debug.enabled', transform: v => v === '1' || v === true },
      {
        old: 'slv2_achievements',
        new: null,
        transform: v => {
          if (!v || typeof v !== 'object') return null;
          const progress = {};
          const unlocks = [];
          Object.entries(v).forEach(([id, data]) => {
            if (data && data.unlockedAt) unlocks.push(id);
            progress[id] = {
              current: data && data.unlockedAt ? 1 : 0,
              target: 1,
              unlockedAt: data ? data.unlockedAt : undefined,
              notified: data ? data.notified : false
            };
          });
          return { 'achievements.progress': progress, 'achievements.unlocks': unlocks };
        }
      },
      {
        old: 'slv2_daily_missions',
        new: null,
        transform: v => ({
          'progression.daily': { missions: v || [], date: new Date().toISOString().slice(0, 10) }
        })
      },
      {
        old: 'slv2_hud_customize',
        new: null,
        transform: v => ({
          'hud.layout': v && v.layout ? v.layout : (v || {}),
          'hud.panels': v && v.panels ? v.panels : {}
        })
      },
      {
        old: 'slv2_settings',
        new: null,
        transform: v => {
          if (!v || typeof v !== 'object') return null;
          return {
            'settings.controls': {
              sensitivity: v.sensitivity || 5,
              keybinds: v.keybinds || {}
            },
            'settings.graphics': {
              quality: v.graphics || 'high',
              theme: 'classic',
              fpsCap: 30,
              showFPS: false,
              reducedMotion: false,
              highContrast: false
            }
          };
        }
      },
      {
        old: 'slv2_settings_menu',
        new: null,
        transform: v => {
          if (!v || typeof v !== 'object') return null;
          const reducedMotion = !!v.reducedMotion;
          const highContrast = !!v.highContrast;
          return {
            'settings.audio': {
              masterVolume: v.masterVolume !== undefined ? v.masterVolume : 80,
              musicEnabled: v.musicEnabled !== false,
              sfxEnabled: v.sfxEnabled !== false
            },
            'settings.graphics': {
              quality: 'high',
              theme: v.theme || 'classic',
              fpsCap: v.fpsCap || 30,
              showFPS: !!v.showFPS,
              reducedMotion,
              highContrast
            },
            'settings.accessibility': { reducedMotion, highContrast }
          };
        }
      }
    ];

    let migratedCount = 0;
    for (const m of migrations) {
      try {
        const raw = localStorage.getItem(m.old);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const result = m.transform(parsed);
        if (result === null) continue;

        if (m.new) {
          await this.set(m.new, result);
        } else {
          // Multi-key result
          for (const [k, v] of Object.entries(result)) {
            await this.set(k, v);
          }
        }
        migratedCount++;
      } catch (e) {
        console.warn(`[GameStore] Migration failed for ${m.old}:`, e);
      }
    }

    await this.set('_migratedAt', Date.now());
    await this.set('_schemaVersion', this.DB_VERSION);
    console.log(`[GameStore] Migration complete: ${migratedCount} keys migrated`);
  }
};

// Auto-init on module load (non-blocking)
GameStore.init().catch(() => {});
```

---

## 3. Schema Registry Design

### 3.1 Why a Registry?

The `SCHEMA` object serves three purposes:
1. **Documentation** — all storage keys in one place
2. **Defaults** — `GameStore.get('profile')` returns the default if key missing
3. **Validation hook** — future: add `validate()` function per key

### 3.2 Key Naming Convention

```
domain.subkey          →  settings.audio, settings.graphics
module.collection      →  friends.list, stats.history
module.state           →  tutorial, currency
module.sub.state       →  progression.roles, progression.battlepass
_internal              →  _schemaVersion, _migratedAt
```

### 3.3 Adding a New Key (Developer Guide)

```javascript
// 1. Add to GameStore.SCHEMA:
'myModule.myKey': {
  default: { foo: 'bar' }
},

// 2. Use in module:
const data = await GameStore.get('myModule.myKey');

// 3. Save in module:
await GameStore.set('myModule.myKey', data);
```

---

## 4. Module-by-Module Migration

### 4.1 Migration Pattern

**Before:**
```javascript
const FriendSystem = {
  STORAGE_KEY: 'slv2_friends',
  _friends: [],
  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) this._friends = JSON.parse(raw);
    } catch { this._friends = []; }
  },
  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._friends));
    } catch { /* ignore */ }
  },
};
```

**After:**
```javascript
const FriendSystem = {
  STORE_KEY: 'friends.list',
  _friends: [],
  async init() {
    this._friends = await GameStore.get(this.STORE_KEY, []);
  },
  _save() {
    // Fire-and-forget; non-critical
    GameStore.set(this.STORE_KEY, this._friends).catch(() => {});
  },
};
```

### 4.2 Priority Order & Risk Assessment

| Priority | Module | GameStore Key | Lines Changed | Risk | Notes |
|----------|--------|---------------|---------------|------|-------|
| 1 | `SettingsModule` | `settings.*` | ~10 | Low | Non-critical; easy to reset |
| 2 | `SettingsMenu` | `settings.*` | ~6 | Low | UI only |
| 3 | `FriendSystem` | `friends.list`, `friends.pending` | ~6 | Low | Non-critical |
| 4 | `AchievementSystem` | `achievements.*` | ~6 | Low | Progress can be recomputed |
| 5 | `CosmeticShop` | `cosmetics.*` | ~8 | Medium | Player purchases — test carefully |
| 6 | `CurrencySystem` | `currency` | ~4 | Medium | Player economy — test carefully |
| 7 | `StatsTracker` | `stats.aggregates` | ~4 | Low | Derived data |
| 8 | `MatchHistory` | `stats.history` | ~6 | Low | Append-only |
| 9 | `RoleProgression` | `progression.roles` | ~4 | Medium | Player progress |
| 10 | `BattlePass` | `progression.battlepass` | ~6 | Medium | Player progress |
| 11 | `DailyMissions` | `progression.daily` | ~4 | Low | Resets daily anyway |
| 12 | `MapEditor` | `customMaps` | ~4 | Low | User content |
| 13 | `HUDCustomizer` | `hud.*` | ~6 | Low | UI layout |
| 14 | `TutorialSystem` | `tutorial` | ~4 | Low | One-time |
| 15 | `TournamentSystem` | `tournaments` | ~4 | Low | Infrequent use |
| 16 | `ClanSystem` | `clan` | ~4 | Low | Infrequent use |
| 17 | `VoiceChatSystem` | `voice.settings` | ~4 | Low | Settings only |
| 18 | `PerfMonitor` | `debug.enabled` | ~2 | Low | Debug flag |
| 19 | `SignalNet` | `net.lastSocketId` | ~2 | Low | Reconnect hint |
| 20 | `loadProfile/saveProfile` | `profile` | ~4 | Low | Identity |
| 21 | Location favorites/default | `locations.*` | ~8 | Low | Setup data |
| 22 | Join code persistence | `net.joinCode` | ~2 | Low | Convenience |
| **23** | **`loadState/saveState`** | **`session.setup`** | **~12** | **HIGH** | **See section 5** |

### 4.3 Insertion Points in `game-v2.js`

| Module | Approx Line | Action |
|--------|-------------|--------|
| `GameStore` module | ~636 | Insert entire module after `state` object |
| `FriendSystem._load/_save` | ~1738 | Replace `localStorage` with `GameStore` |
| `SignalNet` socket ID | ~1862 | Replace `localStorage` with `GameStore` |
| `SettingsModule.load/save` | ~16955 | Replace `localStorage` with `GameStore` |
| `SettingsMenu.save` | ~16731 | Replace `localStorage` with `GameStore` |
| `HUDCustomizer._storeLayout/_loadLayout` | ~3835 | Replace `localStorage` with `GameStore` |
| `PerfMonitor` debug flag | ~3292 | Replace `localStorage` with `GameStore` |
| `AchievementSystem._load/_save` | ~15412 | Replace `localStorage` with `GameStore` |
| `CosmeticShop._loadInventory/_saveInventory` | ~13021 | Replace `localStorage` with `GameStore` |
| `CurrencySystem._load/_save` | ~13310 | Replace `localStorage` with `GameStore` |
| `StatsTracker.init/save` | ~15009 | Replace `localStorage` with `GameStore` |
| `MatchHistory.record/load/clear` | ~14675 | Replace `localStorage` with `GameStore` |
| `RoleProgression._load/_save` | ~15101 | Replace `localStorage` with `GameStore` |
| `BattlePass._loadProgress/_saveProgress` | ~15585 | Replace `localStorage` with `GameStore` |
| `DailyMissions._load/_save` | ~13839 | Replace `localStorage` with `GameStore` |
| `TutorialSystem._load/_save` | ~16592 | Replace `localStorage` with `GameStore` |
| `MapEditor._loadCustomMaps/_saveCustomMaps` | ~17254 | Replace `localStorage` with `GameStore` |
| `TournamentSystem._load/_save` | ~16358 | Replace `localStorage` with `GameStore` |
| `VoiceChatSystem` settings | ~16296 | Replace `localStorage` with `GameStore` |
| `ClanSystem` | ~1833 | Replace `localStorage` with `GameStore` |
| Location favorites | ~7247 | Replace `localStorage` with `GameStore` |
| Default location | ~7202 | Replace `localStorage` with `GameStore` |
| Join code | ~6828 | Replace `localStorage` with `GameStore` |
| `loadProfile/saveProfile` | ~6576 | Replace `localStorage` with `GameStore` |
| `loadState/saveState` | ~6585 | **Refactor to `savePersistentState`** |

---

## 5. `loadState` / `saveState` Refactor (High Risk)

### 5.1 Problem

Current `saveState()` dumps the entire `state` object to `localStorage`:
- **Bloated** — includes transient runtime data (`agents`, `threats`, `chat`, etc.)
- **Dangerous** — can exceed ~5MB localStorage quota
- **Wrong** — mission runtime state should NOT persist across sessions

### 5.2 Solution

```javascript
// BEFORE (in game-v2.js ~line 6585):
function saveState() {
  try {
    localStorage.setItem('slv2_state', JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem('slv2_state');
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch { /* ignore */ }
}

// AFTER:
async function savePersistentState() {
  const persistent = {
    city: state.city,
    country: state.country,
    currentMap: state.currentMap,
    enabledModules: state.enabledModules,
    customMarkers: state.customMarkers,
    customLocation: state.customLocation,
    hostName: state.hostName,
    hostCallsign: state.hostCallsign,
    // Add other setup-level choices as needed
  };
  await GameStore.set('session.setup', persistent);
}

async function loadPersistentState() {
  const saved = await GameStore.get('session.setup');
  if (saved) {
    Object.assign(state, saved);
  }
}
```

### 5.3 What Gets Persisted vs. Not

| Persisted (`session.setup`) | NOT Persisted (runtime only) |
|-----------------------------|------------------------------|
| Selected city/map | Agent positions & states |
| Player name/callsign | Threat positions & alerts |
| Enabled modules | Chat messages |
| Custom markers | Current scores |
| Custom location | Mission timer |
| | Objective found status |
| | GPS tracking state |

**Rule:** If a player refreshes mid-mission, they return to the lobby. Only **setup preferences** survive.

---

## 6. Implementation Order

### Phase 1: Core GameStore Module (~2 hours)
- [ ] Insert `GameStore` module into `game-v2.js` at ~line 636
- [ ] Verify `GameStore.init()` runs without errors
- [ ] Test fallback path: disable IndexedDB, verify localStorage works
- [ ] Run `node --check game-v2.js` for syntax validation

### Phase 2: Low-Risk Module Migrations (~2 hours)
- [ ] `SettingsModule` + `SettingsMenu`
- [ ] `FriendSystem`
- [ ] `AchievementSystem`
- [ ] `StatsTracker` + `MatchHistory`
- [ ] `TutorialSystem`
- [ ] `MapEditor`
- [ ] `HUDCustomizer`
- [ ] `PerfMonitor`
- [ ] `VoiceChatSystem`

### Phase 3: Medium-Risk Module Migrations (~2 hours)
- [ ] `CosmeticShop` + `CurrencySystem`
- [ ] `RoleProgression`
- [ ] `BattlePass`
- [ ] `DailyMissions`
- [ ] `TournamentSystem`
- [ ] `ClanSystem`

### Phase 4: High-Risk `loadState/saveState` Refactor (~1.5 hours)
- [ ] Implement `savePersistentState()` / `loadPersistentState()`
- [ ] Replace all `saveState()` / `loadState()` calls
- [ ] Add `session.setup` to GameStore.SCHEMA
- [ ] Test: refresh during setup → preferences preserved
- [ ] Test: refresh during mission → returns to lobby

### Phase 5: Migration Testing (~1.5 hours)
- [ ] Fresh browser (no data) → game initializes with defaults
- [ ] Existing player with `slv2_*` keys → migration runs, data preserved
- [ ] Verify old localStorage keys are NOT deleted (backup)
- [ ] IndexedDB disabled (private mode) → falls back to localStorage
- [ ] Mobile Safari / Chrome → verify IndexedDB works

### Phase 6: Cleanup & Validation (~1 hour)
- [ ] Remove dead `localStorage` code paths (comment out, don't delete)
- [ ] Verify no `localStorage.getItem('slv2_')` calls remain
- [ ] Run full manual test checklist (see section 7)
- [ ] Commit with message: "Phase 10: Unified GameStore (IndexedDB + fallback)"

### Total Estimated Effort: ~10 hours (6 phases)

---

## 7. Testing Checklist

### 7.1 Automated / Syntax
```bash
node --check game-v2.js
```

### 7.2 Manual Test Matrix

| Test | Steps | Expected |
|------|-------|----------|
| Fresh start | Clear all storage, reload | Game initializes with defaults, no errors |
| Migration | Pre-populate old `slv2_*` keys, reload | Data appears in new locations, `_migratedAt` set |
| Settings persistence | Change theme, reload | Theme persists |
| Friends persistence | Add friend, reload | Friend list persists |
| Achievements persistence | Unlock achievement, reload | Achievement stays unlocked |
| Currency persistence | Earn tokens, reload | Balance persists |
| Match history | Complete mission, reload | History entry added |
| Custom maps | Save map in editor, reload | Map appears in browser |
| HUD layout | Drag HUD element, reload | Position persists |
| Battle pass | Gain XP, reload | Tier/XP persists |
| Profile | Change callsign, reload | Callsign persists |
| Mission state | Start mission, refresh | Returns to lobby (not mid-mission) |
| Fallback | Block IndexedDB, reload | Uses localStorage, all features work |
| Quota | Fill storage, attempt save | Graceful fallback, no crash |
| Clear data | Use "Clear All Data" | All game data wiped, defaults restored |

### 7.3 Browser Matrix

| Browser | IndexedDB | Fallback | Notes |
|---------|-----------|----------|-------|
| Chrome Desktop | ✓ | ✓ | Primary dev target |
| Firefox Desktop | ✓ | ✓ | Test migration |
| Safari Desktop | ✓ | ✓ | Test private mode |
| Chrome Android | ✓ | ✓ | Primary mobile target |
| Safari iOS | ✓ | ✓ | Often uses fallback in private mode |

---

## 8. Rollback Strategy

If critical bugs are found post-deployment:

1. **Immediate (hotfix):** Modules read from `GameStore`, but if key not found, fall back to reading old `localStorage` key. This is already built into the migration design.

2. **Short-term:** Revert module `_save()` methods to write to **both** `GameStore` AND `localStorage` (dual-write mode). Old keys act as backup.

3. **Long-term:** If IndexedDB proves unstable, set `GameStore._fallback = true` globally to force localStorage mode for all users.

---

## 9. Future Schema Evolution

### Version 2 (Planned)
- Add `updatedAt` index for data pruning
- Add `syncQueue` object store for offline→online sync
- Compress large arrays with `lz-string`

### Version 3 (Planned)
- Split `gameData` into domain-specific object stores
- Add `metadata` store for app version, lastPlayed, totalPlayTime

---

## 10. Summary

| Aspect | Decision |
|--------|----------|
| **Primary storage** | IndexedDB (`SignalLostV2` database, v1) |
| **Fallback** | localStorage with `slv2_store_` prefix |
| **API** | Async `get/set/delete/clear/keys/getMany/setMany` |
| **Schema** | Central `SCHEMA` registry with defaults |
| **Migration** | One-shot lazy migration from old `slv2_*` keys |
| **State persistence** | Only `session.setup`; runtime state NOT saved |
| **Error handling** | `try/catch` everywhere; fallback on any failure |
| **Quota handling** | Detect `QuotaExceededError`, auto-switch to fallback |
| **Size** | Core module ~350 lines; module adapters ~150 lines |
| **Effort** | ~10 hours across 6 phases |

---

*Document version: 1.0*  
*Author: SWARM R&D*  
*Date: 2026-05-18*
