# Signal Lost v2 — Phase 10: Unified Client-Side Storage System

> **SWARM R&D — Storage Architecture Design Document**  
> Status: Design Complete | Ready for Implementation  
> Target: Replace scattered `localStorage` calls with a single `GameStore` module

---

## 1. Architecture Overview

### 1.1 Problem Statement

The current codebase uses **18+ independent `localStorage` keys** managed by separate modules (`FriendSystem`, `AchievementSystem`, `SettingsModule`, `CosmeticShop`, `MapEditor`, etc.). Each module handles its own serialization, error recovery, and quota handling. This is:

- **Fragile** — no centralized error handling or schema validation
- **Unversioned** — no migration path when data shapes change
- **Quota-blind** — each module silently ignores `QuotaExceededError`
- **Inconsistent** — some use `JSON.stringify`, some don't; some have defaults, some don't
- **Hard to debug** — scattered keys with ad-hoc naming (`slv2_*`)

### 1.2 Design Goals

| Goal | How |
|------|-----|
| **Primary: IndexedDB** | One object store per data domain, async API |
| **Fallback: localStorage** | Transparent fallback if IndexedDB fails or is unavailable |
| **Simple API** | `store.get(key)`, `store.set(key, value)`, `store.delete(key)`, `store.clear()` |
| **Versioned schema** | `DB_VERSION` constant; migration runners per version bump |
| **Error-tolerant** | All operations wrap in `try/catch`; fallback on any failure |
| **Same patterns** | Module-style object (like `FriendSystem`, `AchievementSystem`) |
| **Non-breaking** | Existing `localStorage` data migrates automatically on first run |

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────┐
│           Game Modules                  │
│  FriendSystem, SettingsModule, etc.     │
│         ↓ use GameStore API             │
├─────────────────────────────────────────┤
│           GameStore                     │
│  ┌─────────┐  ┌─────────────────────┐  │
│  │  API    │  │   Schema Registry   │  │
│  │ get/set │  │  (keys + defaults)  │  │
│  │ delete  │  │  + Migration Runners│  │
│  │ clear   │  │                     │  │
│  └────┬────┘  └─────────────────────┘  │
│       ↓                                 │
│  ┌─────────────────────────────────┐   │
│  │      IndexedDB (primary)        │   │
│  │  One object store: "gameData"   │   │
│  │  key → structured clone value   │   │
│  └─────────────────────────────────┘   │
│       ↓ fallback on failure             │
│  ┌─────────────────────────────────┐   │
│  │      localStorage (fallback)    │   │
│  │  key → JSON.stringify(value)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 1.4 Key Design Decisions

1. **Single object store** (`gameData`) rather than multiple stores. Simpler schema evolution; keys are namespaced by domain (e.g., `settings.audio`, `profile.name`).
2. **Structured clone** via IndexedDB means we can store Maps, Sets, Dates, and typed arrays without manual serialization.
3. **Async-first API** — all methods return `Promise` so modules can `await` or `.then()`.
4. **Synchronous fallback** — localStorage fallback methods return resolved promises so callers don't need branching logic.
5. **Lazy initialization** — DB opens on first `get`/`set`, not at module load time.
6. **Migration on open** — `onupgradeneeded` runs migration chain from old version to current.

---

## 2. Schema Definitions

### 2.1 Storage Key Registry

All data lives under the `gameData` object store with these keys:

| Key | Data Type | Default | Module Owner |
|-----|-----------|---------|--------------|
| `profile` | `ProfileSchema` | `{ name: "Morgan", callsign: "Raven", skin: "skin_default" }` | Identity |
| `settings.audio` | `AudioSettingsSchema` | `{ masterVolume: 80, musicEnabled: true, sfxEnabled: true }` | SettingsModule |
| `settings.graphics` | `GraphicsSettingsSchema` | `{ quality: 'high', theme: 'classic', fpsCap: 30, showFPS: false, reducedMotion: false, highContrast: false }` | SettingsModule |
| `settings.controls` | `ControlsSettingsSchema` | `{ sensitivity: 5, keybinds: {...} }` | SettingsModule |
| `settings.accessibility` | `AccessibilitySchema` | `{ reducedMotion: false, highContrast: false }` | SettingsModule |
| `locations.default` | `LocationSchema\|null` | `null` | SetupScreen |
| `locations.favorites` | `LocationSchema[]` | `[]` | SetupScreen |
| `loadouts.presets` | `LoadoutPresetSchema[]` | `[]` | LoadoutSystem |
| `loadouts.active` | `string\|null` | `null` | LoadoutSystem |
| `achievements.progress` | `AchievementProgressSchema` | `{}` | AchievementSystem |
| `achievements.unlocks` | `string[]` | `[]` | AchievementSystem |
| `stats.history` | `MatchHistoryEntry[]` | `[]` | StatsTracker |
| `stats.aggregates` | `SessionStatsSchema` | `{ missions:0, wins:0, avgScore:0, ... }` | StatsTracker |
| `friends.list` | `FriendSchema[]` | `[]` | FriendSystem |
| `friends.pending` | `FriendSchema[]` | `[]` | FriendSystem |
| `cosmetics.inventory` | `InventorySchema` | `{}` | CosmeticShop |
| `cosmetics.equipped` | `EquippedCosmeticsSchema` | `{ trail: 'trail_classic', skin: 'skin_default' }` | CosmeticShop |
| `currency` | `CurrencySchema` | `{ credits: 0, tokens: 0 }` | CurrencySystem |
| `progression.roles` | `RoleProgressionSchema` | `{ xp: {}, tier: {} }` | RoleProgression |
| `progression.battlepass` | `BattlePassSchema` | `{ season:1, tier:1, xp:0, premium:false, claimed:[] }` | BattlePass |
| `progression.daily` | `DailyMissionsSchema` | `{ missions: [], date: '' }` | DailyMissions |
| `tutorial` | `TutorialSchema` | `{ completed: false, step: 0 }` | TutorialSystem |
| `customMaps` | `CustomMapSchema[]` | `[]` | MapEditor |
| `hud.layout` | `HUDLayoutSchema` | `{}` | HUDCustomizer |
| `hud.panels` | `HUDPanelsSchema` | `{ ...defaults }` | HUDCustomizer |
| `tournaments` | `TournamentSchema` | `{ active: [], myRegistrations: [] }` | TournamentSystem |
| `clan` | `ClanSchema\|null` | `null` | ClanSystem |
| `voice.settings` | `VoiceSettingsSchema` | `{ enabled: false, muted: false, pushToTalk: true, pttKey: 'v' }` | VoiceChat |
| `debug.enabled` | `boolean` | `false` | PerfMonitor |
| `net.lastSocketId` | `string\|null` | `null` | SignalNet |
| `net.joinCode` | `string` | `""` | JoinFlow |
| `_schemaVersion` | `number` | `1` | GameStore (internal) |
| `_migratedAt` | `number` | `0` | GameStore (internal) |

### 2.2 Detailed Schemas

```typescript
// ProfileSchema
interface ProfileSchema {
  name: string;        // max 22 chars, sanitized
  callsign: string;    // max 14 chars, sanitized
  skin: string;        // itemKey of equipped skin
  banner?: string;     // itemKey of equipped banner
  title?: string;      // itemKey of equipped title
}

// AudioSettingsSchema
interface AudioSettingsSchema {
  masterVolume: number;   // 0-100
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume?: number;   // 0-1
  currentTrack?: string;  // 'ambient' | 'tension' | 'combat'
}

// GraphicsSettingsSchema
interface GraphicsSettingsSchema {
  quality: 'low' | 'medium' | 'high';
  theme: 'classic' | 'sunset' | 'signal' | 'night';
  fpsCap: 15 | 30 | 60;
  showFPS: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

// ControlsSettingsSchema
interface ControlsSettingsSchema {
  sensitivity: number;  // 1-10
  keybinds: {
    commandWheel: string;
    waypointPing: string;
    trapSelector: string;
    ultimate: string;
    ability1: string;
    ability2: string;
    ability3: string;
    revive: string;
    ready: string;
  };
}

// LocationSchema
interface LocationSchema {
  lat: number;
  lng: number;
  label: string;
  createdAt?: number;  // timestamp
}

// LoadoutPresetSchema
interface LoadoutPresetSchema {
  id: string;
  name: string;
  role: string;
  gear: string[];           // gear item keys
  consumables: string[];    // consumable item keys
  cosmetics: {
    trail: string;
    skin: string;
    ping: string;
    emote: string;
  };
  createdAt: number;
  updatedAt: number;
}

// AchievementProgressSchema
interface AchievementProgressSchema {
  [achievementId: string]: {
    current: number;
    target: number;
    unlockedAt?: number;
    notified?: boolean;
  };
}

// MatchHistoryEntry
interface MatchHistoryEntry {
  id: string;
  date: string;           // ISO 8601
  result: 'win' | 'loss' | 'abandoned';
  score: number;
  role: string;
  team: string;
  objectivesFound: number;
  totalObjectives: number;
  duration: number;       // seconds
  weather: string;
  threatsEncountered: number;
  xpGained: number;
  city: string;
  grade: string;
}

// FriendSchema
interface FriendSchema {
  name: string;
  callsign: string;
  online: boolean;
  addedAt: number;
  lastSeen?: number;
}

// InventorySchema
interface InventorySchema {
  [itemKey: string]: {
    acquiredAt: number;
    equipped: boolean;
  };
}

// RoleProgressionSchema
interface RoleProgressionSchema {
  xp: { [role: string]: number };
  tier: { [role: string]: number };
}

// BattlePassSchema
interface BattlePassSchema {
  season: number;
  seasonName: string;
  seasonEnd: number;      // timestamp
  tier: number;           // 1-100
  xp: number;
  premium: boolean;
  claimed: number[];      // tier numbers
}

// CustomMapSchema
interface CustomMapSchema {
  id: string;
  name: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  center: { lat: number; lng: number };
  weather: string;
  objectives: any[];
  threats: any[];
  supplyCaches: any[];
  extraction: any;
  terrainZones: any[];
  ratings: { up: number; down: number };
  version: number;
}

// HUDLayoutSchema
interface HUDLayoutSchema {
  [panelId: string]: {
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
  };
}
```

---

## 3. Full API Specification

### 3.1 GameStore Module

```javascript
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

  // ── Lifecycle ──
  init() { /* opens DB, runs migrations, drains queue */ },
  _openDB() { /* returns Promise<IDBDatabase> */ },
  _onUpgrade(db, oldVersion, newVersion) { /* migration chain */ },

  // ── Core API ──
  async get(key, defaultValue = undefined) { /* returns value or defaultValue */ },
  async set(key, value) { /* stores value, returns Promise<void> */ },
  async delete(key) { /* removes key, returns Promise<void> */ },
  async clear() { /* wipes all data, returns Promise<void> */ },
  async keys(prefix = '') { /* returns array of keys matching prefix */ },
  async getMany(keys) { /* batch get: { key1: val1, key2: val2 } */ },
  async setMany(entries) { /* batch set: { key1: val1, key2: val2 } */ },

  // ── Migration ──
  async migrateFromLocalStorage() { /* one-time migration on v1 */ },
  _migrateV0toV1(db) { /* creates object store */ },

  // ── Fallback ──
  _fallbackGet(key, defaultValue) { /* localStorage.getItem */ },
  _fallbackSet(key, value) { /* localStorage.setItem */ },
  _fallbackDelete(key) { /* localStorage.removeItem */ },
  _fallbackClear() { /* localStorage.clear with prefix filter */ },
  _fallbackKeys(prefix) { /* localStorage key enumeration */ },

  // ── Utilities ──
  _toStoreKey(key) { /* adds FALLBACK_PREFIX */ },
  _fromStoreKey(key) { /* strips FALLBACK_PREFIX */ },
  _serialize(value) { /* JSON.stringify with Date handling */ },
  _deserialize(raw) { /* JSON.parse with Date revival */ },
};
```

### 3.2 API Behavior Specification

#### `GameStore.get(key, defaultValue)`

```javascript
// Returns: Promise<value | defaultValue | undefined>
// Behavior:
//   1. If DB is ready and not in fallback mode:
//      - Open read transaction on 'gameData'
//      - Return objectStore.get(key).result or defaultValue
//   2. If DB not ready:
//      - Queue the request, return promise that resolves when DB ready
//   3. If fallback mode:
//      - Read from localStorage with FALLBACK_PREFIX + key
//      - Deserialize JSON, return defaultValue if missing
//   4. On any error: log to console, return defaultValue

// Example:
const profile = await GameStore.get('profile', { name: 'Morgan', callsign: 'Raven' });
```

#### `GameStore.set(key, value)`

```javascript
// Returns: Promise<void>
// Behavior:
//   1. If DB is ready and not in fallback mode:
//      - Open readwrite transaction on 'gameData'
//      - objectStore.put(value, key)
//   2. If DB not ready: queue request
//   3. If fallback mode: serialize to JSON, localStorage.setItem
//   4. On QuotaExceededError: switch to fallback mode, retry

// Example:
await GameStore.set('settings.audio', { masterVolume: 90, musicEnabled: true });
```

#### `GameStore.delete(key)`

```javascript
// Returns: Promise<void>
// Deletes the key from both IndexedDB and localStorage fallback.
```

#### `GameStore.clear()`

```javascript
// Returns: Promise<void>
// Clears ALL game data. Shows confirmation dialog in UI layer.
// Does NOT clear non-game localStorage keys (e.g., 'slv2_debug').
```

#### `GameStore.keys(prefix = '')`

```javascript
// Returns: Promise<string[]>
// Returns all keys in the store, optionally filtered by prefix.
// Useful for debugging and export functionality.
```

#### `GameStore.getMany(keys)` / `GameStore.setMany(entries)`

```javascript
// Batch operations for atomic reads/writes.
// getMany(['profile', 'settings.audio']) → { profile: {...}, 'settings.audio': {...} }
// setMany({ 'profile.name': 'Alex', 'profile.callsign': 'Falcon' })
```

### 3.3 Module Integration Pattern

Each existing module gets a thin adapter. Here's the migration pattern:

**Before (FriendSystem):**
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

**After (FriendSystem with GameStore):**
```javascript
const FriendSystem = {
  STORE_KEY: 'friends.list',
  _friends: [],

  async init() {
    this._friends = await GameStore.get(this.STORE_KEY, []);
  },

  async _save() {
    await GameStore.set(this.STORE_KEY, this._friends);
  },

  // All mutating methods become async or fire-and-forget:
  async addFriend(name, callsign) {
    // ... validation ...
    this._friends.push({ name, callsign, online: false, addedAt: Date.now() });
    await this._save();
    this.render();
    return true;
  },
};
```

**Fire-and-forget convenience wrapper for non-critical saves:**
```javascript
// In modules that don't need to await saves:
_save() {
  GameStore.set(this.STORE_KEY, this._friends).catch(() => {});
}
```

---

## 4. Migration Path from Current localStorage

### 4.1 Migration Strategy: Lazy + One-Shot

On `GameStore.init()`, check if `_migratedAt` exists in the store:
- **If no** → run `migrateFromLocalStorage()` once, then set `_migratedAt = Date.now()`
- **If yes** → skip migration, proceed normally

This means:
- Existing players migrate transparently on their next session
- New players start fresh with IndexedDB
- Old `localStorage` keys are **preserved** (not deleted) as backup

### 4.2 Migration Map: Old Keys → New Keys

| Old localStorage Key | New GameStore Key | Notes |
|----------------------|-------------------|-------|
| `slv2_profile` | `profile` | Direct map |
| `slv2_state` | **DEPRECATED** | Was dumping entire `state` object; modules now own their slices |
| `slv2_settings` | `settings.controls` + `settings.graphics` | Split into sub-keys |
| `slv2_settings_menu` | `settings.audio` + `settings.graphics` + `settings.accessibility` | Merge and split |
| `slv2_friends` | `friends.list` | Direct map |
| `slv2_inventory` | `cosmetics.inventory` | Direct map |
| `slv2_currency` | `currency` | Direct map |
| `slv2_match_history` | `stats.history` | Direct map |
| `slv2_role_progression` | `progression.roles` | Direct map |
| `slv2_achievements` | `achievements.progress` + `achievements.unlocks` | Split: unlocks array + progress object |
| `slv2_battlepass` | `progression.battlepass` | Direct map |
| `slv2_daily_missions` | `progression.daily` | Direct map |
| `slv2_tutorial` | `tutorial` | Direct map |
| `slv2_custom_maps` | `customMaps` | Direct map |
| `slv2_hud_customize` | `hud.layout` + `hud.panels` | Split |
| `slv2_defaultLocation` | `locations.default` | Direct map |
| `slv2_favoriteLocations` | `locations.favorites` | Direct map |
| `slv2_tournaments` | `tournaments` | Direct map |
| `slv2_lastSocketId` | `net.lastSocketId` | Direct map |
| `slv2_joinCode` | `net.joinCode` | Direct map |
| `slv2_debug` | `debug.enabled` | Direct map |

### 4.3 Migration Code Sketch

```javascript
async migrateFromLocalStorage() {
  const migrations = [
    { old: 'slv2_profile', new: 'profile', transform: v => v },
    { old: 'slv2_friends', new: 'friends.list', transform: v => v },
    { old: 'slv2_inventory', new: 'cosmetics.inventory', transform: v => v },
    { old: 'slv2_currency', new: 'currency', transform: v => v },
    { old: 'slv2_match_history', new: 'stats.history', transform: v => v },
    { old: 'slv2_role_progression', new: 'progression.roles', transform: v => v },
    { old: 'slv2_achievements', new: 'achievements.progress', 
      transform: v => {
        // Convert flat unlocks object to progress schema
        const progress = {};
        const unlocks = [];
        Object.entries(v || {}).forEach(([id, data]) => {
          if (data.unlockedAt) unlocks.push(id);
          progress[id] = { current: data.unlockedAt ? 1 : 0, target: 1, unlockedAt: data.unlockedAt, notified: data.notified };
        });
        return { progress, unlocks };
      }
    },
    { old: 'slv2_battlepass', new: 'progression.battlepass', transform: v => v },
    { old: 'slv2_daily_missions', new: 'progression.daily', 
      transform: v => ({ missions: v || [], date: new Date().toISOString().slice(0,10) }) 
    },
    { old: 'slv2_tutorial', new: 'tutorial', transform: v => v },
    { old: 'slv2_custom_maps', new: 'customMaps', transform: v => v },
    { old: 'slv2_hud_customize', new: 'hud.layout', 
      transform: v => v?.layout || v || {} 
    },
    { old: 'slv2_defaultLocation', new: 'locations.default', transform: v => v },
    { old: 'slv2_favoriteLocations', new: 'locations.favorites', transform: v => v },
    { old: 'slv2_tournaments', new: 'tournaments', transform: v => v },
    { old: 'slv2_lastSocketId', new: 'net.lastSocketId', transform: v => v },
    { old: 'slv2_joinCode', new: 'net.joinCode', transform: v => v },
    { old: 'slv2_debug', new: 'debug.enabled', transform: v => v === '1' || v === true },
    // Settings merge from two keys
    { old: 'slv2_settings', new: null, 
      transform: v => {
        if (!v) return null;
        return {
          'settings.controls': {
            sensitivity: v.sensitivity,
            keybinds: v.keybinds
          },
          'settings.graphics': {
            quality: v.graphics,
            theme: 'classic',
            fpsCap: 30,
            showFPS: false,
            reducedMotion: false,
            highContrast: false
          }
        };
      }
    },
    { old: 'slv2_settings_menu', new: null,
      transform: v => {
        if (!v) return null;
        return {
          'settings.audio': {
            masterVolume: v.masterVolume,
            musicEnabled: v.musicEnabled,
            sfxEnabled: v.sfxEnabled
          },
          'settings.graphics': {
            quality: 'high',
            theme: v.theme || 'classic',
            fpsCap: v.fpsCap || 30,
            showFPS: v.showFPS,
            reducedMotion: v.reducedMotion,
            highContrast: v.highContrast
          },
          'settings.accessibility': {
            reducedMotion: v.reducedMotion,
            highContrast: v.highContrast
          }
        };
      }
    },
  ];

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
        // Multi-key result (settings merge)
        for (const [k, v] of Object.entries(result)) {
          await this.set(k, v);
        }
      }
    } catch (e) {
      console.warn(`[GameStore] Migration failed for ${m.old}:`, e);
    }
  }

  await this.set('_migratedAt', Date.now());
  console.log('[GameStore] Migration from localStorage complete');
}
```

### 4.4 Post-Migration Cleanup (Optional Phase 2)

After migration has been live for several releases, a cleanup function can remove old `slv2_*` keys:

```javascript
async cleanupLegacyLocalStorage() {
  const legacyKeys = Object.keys(localStorage).filter(k => k.startsWith('slv2_'));
  for (const key of legacyKeys) {
    try { localStorage.removeItem(key); } catch {}
  }
}
```

**This should only run after confirming migration success across all users.**

---

## 5. Implementation Plan with File Insertion Points

### 5.1 Phase 1: Core GameStore Module (Estimated: ~350 lines)

**File:** `game-v2.js`  
**Insert after:** The `state` object definition (after line ~634, before `ParticleSystem`)

```javascript
/* ========================== UNIFIED STORAGE (Phase 10) ========================== */

const GameStore = {
  DB_NAME: 'SignalLostV2',
  DB_VERSION: 1,
  STORE_NAME: 'gameData',
  FALLBACK_PREFIX: 'slv2_store_',

  _db: null,
  _ready: false,
  _fallback: false,
  _queue: [],

  async init() {
    if (this._ready) return;
    try {
      this._db = await this._openDB();
      this._ready = true;
      // Run migration if needed
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
    // Future: if (oldVersion < 2) { ... }
  },

  // ... get, set, delete, clear, keys, getMany, setMany ...
  // ... fallback methods ...
  // ... migrateFromLocalStorage ...
};
```

### 5.2 Phase 2: Module-by-Module Migration (Estimated: ~20 modules × 3 lines each)

Migrate each module's `_load()` and `_save()` methods to use `GameStore`. Priority order:

| Priority | Module | Lines Changed | Risk |
|----------|--------|---------------|------|
| 1 | `SettingsModule` + `SettingsMenu` | ~10 | Low — settings are non-critical |
| 2 | `FriendSystem` | ~6 | Low — friends are non-critical |
| 3 | `AchievementSystem` | ~6 | Low |
| 4 | `CosmeticShop` + `CurrencySystem` | ~10 | Medium — player purchases |
| 5 | `StatsTracker` + `MatchHistory` | ~10 | Low |
| 6 | `RoleProgression` | ~6 | Medium — player progress |
| 7 | `BattlePass` | ~6 | Medium |
| 8 | `MapEditor` | ~6 | Low |
| 9 | `HUDCustomizer` | ~6 | Low |
| 10 | `TutorialSystem` | ~4 | Low |
| 11 | `DailyMissions` | ~6 | Low |
| 12 | `TournamentSystem` | ~6 | Low |
| 13 | `ClanSystem` | ~6 | Low |
| 14 | `VoiceChat` | ~4 | Low |
| 15 | `PerfMonitor` | ~4 | Low |
| 16 | `SignalNet` (lastSocketId) | ~4 | Low |
| 17 | `loadProfile` / `saveProfile` | ~4 | Low |
| 18 | `loadState` / `saveState` | ~8 | **High** — used for session restore |
| 19 | Location favorites / default | ~8 | Low |
| 20 | Join code persistence | ~4 | Low |

### 5.3 Phase 3: `loadState` / `saveState` Refactor (High Risk)

The current `saveState()` dumps the entire `state` object to `localStorage`. This is:
- **Bloated** — includes transient data (`agents`, `objectives`, `chat`, etc.)
- **Dangerous** — can exceed localStorage quota (~5MB)
- **Wrong** — mission runtime state should NOT persist across sessions

**New approach:**
```javascript
// saveState → save only PERSISTENT slices of state
async function savePersistentState() {
  const persistent = {
    city: state.city,
    country: state.country,
    currentMap: state.currentMap,
    enabledModules: state.enabledModules,
    customMarkers: state.customMarkers,
    customLocation: state.customLocation,
    // ... other setup-level choices
  };
  await GameStore.set('session.setup', persistent);
}

// loadState → restore only persistent setup choices
async function loadPersistentState() {
  const saved = await GameStore.get('session.setup');
  if (saved) Object.assign(state, saved);
}
```

**Runtime state** (`agents`, `objectives`, `threats`, `chat`, `scores`, etc.) is **NOT persisted**. If a player refreshes mid-mission, they return to the lobby.

### 5.4 Phase 4: Testing & Validation

```bash
# 1. Syntax check
node --check game-v2.js

# 2. Manual test checklist:
# [ ] Fresh browser (no localStorage, no IndexedDB) → game initializes
# [ ] Existing player with localStorage data → migration runs, data preserved
# [ ] IndexedDB disabled (private mode) → falls back to localStorage
# [ ] Settings save/load across reloads
# [ ] Friends add/remove across reloads
# [ ] Achievements persist across reloads
# [ ] Match history accumulates
# [ ] Custom maps save/load
# [ ] Battle pass progress persists
# [ ] Currency balance persists
# [ ] Profile name/callsign persist
# [ ] HUD layout persists
# [ ] Join code auto-fills on reconnect
```

### 5.5 Insertion Points in game-v2.js

| Module | Approx Line | Insertion Context |
|--------|-------------|-------------------|
| `GameStore` | ~636 | After `state` object, before `ParticleSystem` |
| `loadProfile` / `saveProfile` | ~6576 | Replace `localStorage` calls |
| `loadState` / `saveState` | ~6585 | Replace with `savePersistentState` |
| `FriendSystem._load/_save` | ~1738 | Replace `localStorage` with `GameStore` |
| `SettingsModule.load/save` | ~16955 | Replace `localStorage` with `GameStore` |
| `SettingsMenu.save` | ~16731 | Replace `localStorage` with `GameStore` |
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
| `HUDCustomizer._storeLayout/_loadLayout` | ~3835 | Replace `localStorage` with `GameStore` |
| `TournamentSystem._load/_save` | ~16358 | Replace `localStorage` with `GameStore` |
| Location favorites | ~7247 | Replace `localStorage` with `GameStore` |
| Default location | ~7202 | Replace `localStorage` with `GameStore` |
| Join code | ~6828 | Replace `localStorage` with `GameStore` |
| `PerfMonitor` debug flag | ~3292 | Replace `localStorage` with `GameStore` |
| `SignalNet` socket ID | ~1862 | Replace `localStorage` with `GameStore` |

### 5.6 Rollback Strategy

If critical bugs are found post-deployment:

1. **Immediate:** Modules still read from `GameStore`, but if key not found, fall back to reading old `localStorage` key (one-release grace period).
2. **Short-term:** Revert module `_save()` methods to write to BOTH `GameStore` and `localStorage` (dual-write mode).
3. **Long-term:** If IndexedDB proves unstable across browsers, switch `GameStore._fallback = true` globally to force localStorage mode.

---

## 6. Future Schema Evolution

### Version 2 (Planned)
- Add `gameData` index on `updatedAt` for pruning old data
- Add `syncQueue` object store for offline→online sync (if server backend added)
- Compress large arrays (match history, custom maps) with JSON + LZ-string

### Version 3 (Planned)
- Split `gameData` into domain-specific object stores for better query performance
- Add `metadata` store for app version, lastPlayed, totalPlayTime

---

## 7. Summary

| Aspect | Decision |
|--------|----------|
| **Primary storage** | IndexedDB (`indexedDB.open('SignalLostV2', 1)`)
| **Fallback** | localStorage with `slv2_store_` prefix |
| **API style** | Async `get/set/delete/clear/keys/getMany/setMany` |
| **Schema versioning** | `DB_VERSION` constant + `onupgradeneeded` chain |
| **Migration** | One-shot lazy migration from old `slv2_*` keys |
| **Module pattern** | Same object-style modules as existing code |
| **State persistence** | Only persistent setup data; runtime state NOT saved |
| **Error handling** | `try/catch` everywhere; fallback on any DB failure |
| **Quota handling** | Detect `QuotaExceededError`, auto-switch to fallback |
| **Size estimate** | Core module ~350 lines; module adapters ~150 lines total |

---

*Document version: 1.0*  
*Author: SWARM R&D*  
*Date: 2026-05-17*
