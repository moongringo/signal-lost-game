# Phase 6 — Content Expansion, Progression Systems, UI Polish & Quality of Life

**Signal Lost v2** — 9,742-line monolithic game-v2.js, 776-line index.html, 4,418-line styles-v2.css  
**Current state:** Phase 5 complete (Server State Sync, 4 New Roles, Tutorial, Dynamic Music, Settings, Ping Wheel, Match History, Admin Panel, Chat Improvements, Reconnection). 11 roles, authoritative server simulation, 8-direction ping wheel, settings menu, match history, admin panel, reconnection.
**Server:** server-v2.js — authoritative tick loop, dynamic events, admin actions, reconnection window.

---

## Priority Ranking

| # | Feature | Effort | Impact | Lines |
|---|---------|--------|--------|-------|
| 1 | Loadout Customization (Unlockables via Role XP) | Large | 5/5 | ~350-400 |
| 2 | Achievement System | Medium | 5/5 | ~250-300 |
| 3 | Daily Missions & Challenge System | Medium | 4/5 | ~200-250 |
| 4 | New Objective Types (Escort, Sabotage, Recon) | Medium | 4/5 | ~200-250 |
| 5 | New Map Biomes (Desert, Arctic, Jungle, Urban) | Medium | 4/5 | ~180-220 |
| 6 | Cosmetic Items & Customization | Medium | 4/5 | ~180-220 |
| 7 | Minimap Zoom & HUD Customization | Small | 3/5 | ~100-130 |
| 8 | Friend System & Recent Players | Medium | 3/5 | ~150-180 |
| 9 | Report System & Vote Kick | Small | 3/5 | ~80-100 |
| 10 | Particle Effect Presets Per Zone | Small | 3/5 | ~80-100 |

**Rationale:** Loadout customization is the ultimate progression hook — it gives every hour of play tangible rewards. Achievements provide long-term goals and social sharing. Daily missions drive retention. New objective types and biomes keep the game fresh for veterans. Cosmetics let players express identity. HUD customization and friends are quality-of-life multipliers. Reports/votes are necessary for community health.

---

## Task 1 — Loadout Customization (Unlockables via Role XP)

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~350-400

### Design

Each role has a loadout slot with 3 categories: **Primary Ability Modifier**, **Passive Trait**, and **Tactical Gear**. Items are unlocked by reaching role XP tiers (from Phase 4 progression). Loadouts are configured pre-mission on the loadout screen and persist per role. Items provide meaningful but balanced gameplay modifiers — never pay-to-win.

### Loadout Catalog

```js
// In data section (~line 21) or new const
const loadoutCatalog = {
  // Primary Ability Modifiers (change how your active ability works)
  abilityMods: {
    'extended_scan': { name: 'Extended Scan', desc: '+50% scan range', unlockTier: 2, roles: ['Drone', 'Spotter'], icon: '🔭' },
    'rapid_repair': { name: 'Rapid Repair', desc: '-30% repair cooldown', unlockTier: 2, roles: ['Mechanic', 'Engineer'], icon: '🔧' },
    'combat_medic': { name: 'Combat Medic', desc: 'Revive while moving', unlockTier: 2, roles: ['Medic'], icon: '🏃' },
    'deep_decrypt': { name: 'Deep Decrypt', desc: 'Decode 2 objectives at once', unlockTier: 2, roles: ['Decoder', 'Hacker'], icon: '🔐' },
    'stealth_courier': { name: 'Stealth Courier', desc: 'Courier deliveries don\'t reveal position', unlockTier: 2, roles: ['Courier'], icon: '🥷' },
    'overclock': { name: 'Overclock', desc: 'Abilities recharge 20% faster', unlockTier: 3, roles: ['Mission Control', 'Hacker'], icon: '⚡' },
    'saboteur_charge': { name: 'Heavy Charge', desc: 'Charges affect 2 objectives', unlockTier: 2, roles: ['Saboteur'], icon: '💣' },
    'spotter_precision': { name: 'Precision Marks', desc: 'Marked targets take +1 turret damage', unlockTier: 3, roles: ['Spotter'], icon: '🎯' }
  },
  // Passive Traits (always-on small bonuses)
  passives: {
    'endurance': { name: 'Endurance', desc: '+10 max stamina', unlockTier: 2, roles: 'all', icon: '💪' },
    'signal_boost': { name: 'Signal Boost', desc: '+5% base signal', unlockTier: 2, roles: 'all', icon: '📶' },
    'threat_sense': { name: 'Threat Sense', desc: 'Threats appear 1s earlier on radar', unlockTier: 3, roles: 'all', icon: '👁️' },
    'scavenger': { name: 'Scavenger', desc: 'Caches give +25% effect', unlockTier: 3, roles: 'all', icon: '🔍' },
    'team_player': { name: 'Team Player', desc: '+15% XP when squad completes objective', unlockTier: 2, roles: 'all', icon: '🤝' },
    'lonewolf': { name: 'Lone Wolf', desc: '+10% signal when alone (>100m from squad)', unlockTier: 3, roles: 'all', icon: '🐺' }
  },
  // Tactical Gear (consumable-like, 1 use per mission)
  gear: {
    'extra_trap': { name: 'Extra Trap', desc: '+1 trap charge', unlockTier: 2, roles: 'all', icon: '🕸️' },
    'smoke_pack': { name: 'Smoke Pack', desc: 'Start with smoke grenade', unlockTier: 2, roles: 'all', icon: '💨' },
    'emp_grenade': { name: 'EMP Grenade', desc: 'Disable all threats 50m for 5s', unlockTier: 3, roles: 'all', icon: '⚡' },
    'respawn_beacon': { name: 'Respawn Beacon', desc: 'Self-revive once if downed', unlockTier: 4, roles: 'all', icon: '📡' },
    'drone_swarm': { name: 'Drone Swarm', desc: 'Start with 2 scout drones', unlockTier: 3, roles: ['Drone', 'Engineer'], icon: '🛸' }
  }
};
```

### Loadout State & Module

```js
// In state object (~line 176)
loadouts: {}, // role -> { abilityMod: string, passive: string, gear: string }
loadoutLocked: false,

// New module (insert before RoleProgression at ~line 9460)
const LoadoutSystem = {
  STORAGE_KEY: 'slv2_loadouts',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.loadouts = JSON.parse(saved); } catch(e) {}
    }
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.loadouts));
  },

  getAvailableItems(category, role) {
    const cat = loadoutCatalog[category];
    if (!cat) return [];
    const tier = RoleProgression.getTier(role);
    return Object.entries(cat).filter(([id, item]) => {
      if (item.unlockTier > tier) return false;
      if (item.roles === 'all') return true;
      return item.roles.includes(role);
    }).map(([id, item]) => ({ id, ...item }));
  },

  isUnlocked(itemId, category, role) {
    const item = loadoutCatalog[category]?.[itemId];
    if (!item) return false;
    if (item.unlockTier > RoleProgression.getTier(role)) return false;
    if (item.roles === 'all') return true;
    return item.roles.includes(role);
  },

  equip(role, category, itemId) {
    if (!this.isUnlocked(itemId, category, role)) return false;
    if (!state.loadouts[role]) state.loadouts[role] = {};
    state.loadouts[role][category] = itemId;
    this.save();
    return true;
  },

  getEquipped(role, category) {
    return state.loadouts[role]?.[category] || null;
  },

  getEquippedItem(role, category) {
    const id = this.getEquipped(role, category);
    return id ? loadoutCatalog[category]?.[id] : null;
  },

  // Apply loadout effects at mission start
  applyLoadoutEffects(role) {
    const loadout = state.loadouts[role] || {};
    const effects = [];
    
    // Passive trait
    if (loadout.passive) {
      const passive = loadoutCatalog.passives[loadout.passive];
      if (passive) {
        switch (loadout.passive) {
          case 'endurance': effects.push({ type: 'maxStamina', value: 10 }); break;
          case 'signal_boost': effects.push({ type: 'baseSignal', value: 5 }); break;
          case 'threat_sense': effects.push({ type: 'threatEarlyWarning', value: 1000 }); break;
          case 'scavenger': effects.push({ type: 'cacheMultiplier', value: 1.25 }); break;
          case 'team_player': effects.push({ type: 'squadXPMult', value: 1.15 }); break;
          case 'lonewolf': effects.push({ type: 'loneSignalBoost', value: 10 }); break;
        }
      }
    }
    
    // Gear
    if (loadout.gear) {
      const gear = loadoutCatalog.gear[loadout.gear];
      if (gear) {
        switch (loadout.gear) {
          case 'extra_trap':
            if (!state.trapCharges) state.trapCharges = {};
            state.trapCharges[state.localAgentId] = (state.trapCharges[state.localAgentId] || 2) + 1;
            break;
          case 'drone_swarm':
            state.dronesDeployed = (state.dronesDeployed || 0) + 2;
            break;
        }
      }
    }
    
    return effects;
  },

  // Modify ability behavior based on equipped mod
  getAbilityModifier(role, abilityName) {
    const modId = state.loadouts[role]?.abilityMod;
    if (!modId) return null;
    const mod = loadoutCatalog.abilityMods[modId];
    if (!mod) return null;
    switch (modId) {
      case 'extended_scan': return { rangeMult: 1.5 };
      case 'rapid_repair': return { cooldownMult: 0.7 };
      case 'combat_medic': return { mobileRevive: true };
      case 'deep_decrypt': return { multiDecode: 2 };
      case 'stealth_courier': return { silentDelivery: true };
      case 'overclock': return { cooldownMult: 0.8 };
      case 'saboteur_charge': return { chargeTargets: 2 };
      case 'spotter_precision': return { markDamageBonus: 1 };
    }
    return null;
  },

  renderLoadoutScreen(role) {
    const container = document.getElementById('loadoutPanel');
    if (!container) return;
    const tier = RoleProgression.getTier(role);
    
    const renderCategory = (cat, label) => {
      const items = this.getAvailableItems(cat, role);
      const equipped = this.getEquipped(role, cat);
      return `
        <div class="loadout-category">
          <h4>${label}</h4>
          <div class="loadout-grid">
            ${items.map(item => `
              <div class="loadout-item ${equipped === item.id ? 'equipped' : ''} ${item.unlockTier > tier ? 'locked' : ''}"
                   onclick="LoadoutSystem.equip('${role}', '${cat}', '${item.id}'); LoadoutSystem.renderLoadoutScreen('${role}');">
                <span class="loadout-icon">${item.icon}</span>
                <span class="loadout-name">${item.name}</span>
                <span class="loadout-desc">${item.desc}</span>
                ${item.unlockTier > 1 ? `<span class="loadout-tier">T${item.unlockTier}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };
    
    container.innerHTML = `
      <div class="loadout-header">
        <span class="loadout-role">${roleEmojis[role] || ''} ${role}</span>
        <span class="loadout-tier-badge">Tier ${tier}</span>
      </div>
      ${renderCategory('abilityMods', 'Ability Modifier')}
      ${renderCategory('passives', 'Passive Trait')}
      ${renderCategory('gear', 'Tactical Gear')}
    `;
  }
};
```

### Integration Points

- **Data section** (~line 21): Add `loadoutCatalog`
- **state object** (~line 176): Add `loadouts` and `loadoutLocked`
- **init()** (~line 9709): Add `LoadoutSystem.init()`
- **startMissionClock()** (~line 5861): Call `LoadoutSystem.applyLoadoutEffects(role)` for local agent
- **executeTool()** (~line 7396): Check `LoadoutSystem.getAbilityModifier(role, abilityName)` for modifiers
- **renderLoadoutScreen()** (~line 4878): Replace existing loadout with new system
- **RoleProgression** (~line 9460): Ensure tier data is available for unlock checks

### HTML Additions

```html
<!-- In loadout screen (already exists, replace content) -->
<div id="loadoutPanel" class="loadout-panel"></div>
```

### CSS Additions

```css
.loadout-panel { padding: 16px; }
.loadout-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.loadout-role { font-size: 16px; font-weight: 700; }
.loadout-tier-badge { background: var(--accent); color: #000; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
.loadout-category { margin-bottom: 20px; }
.loadout-category h4 { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.loadout-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.loadout-item { background: var(--chip); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; cursor: pointer; transition: all 0.15s; position: relative; }
.loadout-item:hover { border-color: var(--accent); }
.loadout-item.equipped { border-color: var(--accent); background: rgba(255,139,31,0.1); }
.loadout-item.locked { opacity: 0.4; pointer-events: none; }
.loadout-icon { font-size: 20px; display: block; margin-bottom: 6px; }
.loadout-name { font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px; }
.loadout-desc { font-size: 10px; color: var(--text-dim); display: block; line-height: 1.3; }
.loadout-tier { position: absolute; top: 4px; right: 4px; font-size: 9px; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px; }
```

---

## Task 2 — Achievement System

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design

40+ achievements across categories: Combat, Exploration, Teamwork, Mastery, and Secrets. Each achievement has a name, description, icon, rarity (Bronze/Silver/Gold/Platinum), and unlock condition. Unlocks are checked at mission end and during key moments. A notification toast appears on unlock. Achievements persist to localStorage and display in a dedicated screen.

### Achievement Catalog

```js
// New const (insert after loadoutCatalog)
const achievementCatalog = {
  // Combat
  'first_blood': { name: 'First Blood', desc: 'Eliminate your first threat', icon: '💀', rarity: 'bronze', category: 'combat' },
  'threat_hunter': { name: 'Threat Hunter', desc: 'Eliminate 10 threats in one mission', icon: '🏹', rarity: 'silver', category: 'combat' },
  'mine_expert': { name: 'Mine Expert', desc: 'Eliminate 3 threats with traps in one mission', icon: '💥', rarity: 'silver', category: 'combat' },
  'ghost_killer': { name: 'Ghost Killer', desc: 'Eliminate 50 threats total', icon: '👻', rarity: 'gold', category: 'combat' },
  'untouchable': { name: 'Untouchable', desc: 'Complete a mission without being downed', icon: '🛡️', rarity: 'gold', category: 'combat' },
  
  // Exploration
  'world_traveler': { name: 'World Traveler', desc: 'Play in 5 different cities', icon: '🌍', rarity: 'silver', category: 'exploration' },
  'weather_vane': { name: 'Weather Vane', desc: 'Experience all 4 weather types', icon: '🌦️', rarity: 'bronze', category: 'exploration' },
  'terrain_master': { name: 'Terrain Master', desc: 'Complete objectives in all 5 terrain types', icon: '⛰️', rarity: 'silver', category: 'exploration' },
  'night_ops': { name: 'Night Ops', desc: 'Complete 5 missions during night cycle', icon: '🌙', rarity: 'bronze', category: 'exploration' },
  
  // Teamwork
  'medic': { name: 'Field Medic', desc: 'Revive 5 squadmates', icon: '🩹', rarity: 'bronze', category: 'teamwork' },
  'guardian_angel': { name: 'Guardian Angel', desc: 'Revive 20 squadmates', icon: '👼', rarity: 'silver', category: 'teamwork' },
  'squad_leader': { name: 'Squad Leader', desc: 'Win 10 missions as Mission Control', icon: '🎖️', rarity: 'gold', category: 'teamwork' },
  'team_player': { name: 'Team Player', desc: 'Complete 50 objectives with squadmates nearby', icon: '🤝', rarity: 'silver', category: 'teamwork' },
  'last_stand': { name: 'Last Stand', desc: 'Win a mission as the last surviving agent', icon: '⚔️', rarity: 'gold', category: 'teamwork' },
  
  // Mastery
  'jack_of_all': { name: 'Jack of All Trades', desc: 'Reach Tier 2 with all roles', icon: '🔷', rarity: 'silver', category: 'mastery' },
  'master_of_one': { name: 'Master of One', desc: 'Reach Tier 4 with any role', icon: '👑', rarity: 'gold', category: 'mastery' },
  'legend': { name: 'Signal Legend', desc: 'Reach Tier 4 with 5 different roles', icon: '⭐', rarity: 'platinum', category: 'mastery' },
  'completionist': { name: 'Completionist', desc: 'Unlock all loadout items', icon: '🏆', rarity: 'platinum', category: 'mastery' },
  'veteran': { name: 'Veteran', desc: 'Complete 100 missions', icon: '🎗️', rarity: 'gold', category: 'mastery' },
  
  // Secrets
  'pacifist': { name: 'Pacifist', desc: 'Complete a mission without eliminating any threats', icon: '🕊️', rarity: 'gold', category: 'secrets' },
  'speed_runner': { name: 'Speed Runner', desc: 'Complete a mission in under 50% of allotted time', icon: '⚡', rarity: 'silver', category: 'secrets' },
  'perfect_score': { name: 'Perfect Score', desc: 'Get an S grade on any mission', icon: '💯', rarity: 'gold', category: 'secrets' },
  'lone_wolf': { name: 'Lone Wolf', desc: 'Win a solo mission (1 player)', icon: '🐺', rarity: 'silver', category: 'secrets' },
  'easter_egg': { name: 'Signal Found', desc: 'Find the hidden signal', icon: '📻', rarity: 'platinum', category: 'secrets' }
};
```

### Achievement Module

```js
// New module (insert before RoleProgression at ~line 9460)
const AchievementSystem = {
  STORAGE_KEY: 'slv2_achievements',
  
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.achievements = JSON.parse(saved); } catch(e) { state.achievements = {}; }
    } else {
      state.achievements = {};
    }
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.achievements));
  },

  unlock(id) {
    if (state.achievements[id]) return false; // already unlocked
    const ach = achievementCatalog[id];
    if (!ach) return false;
    state.achievements[id] = { unlockedAt: Date.now() };
    this.save();
    this._showToast(ach);
    EventLog.add('system', ach.icon, `<strong>Achievement Unlocked</strong> ${ach.name}`);
    SoundFX.play(880, 0.1, 'sine', 0.15);
    setTimeout(() => SoundFX.play(1100, 0.1, 'sine', 0.15), 150);
    setTimeout(() => SoundFX.play(1320, 0.1, 'sine', 0.15), 300);
    return true;
  },

  isUnlocked(id) {
    return !!state.achievements[id];
  },

  getProgress(id) {
    // Returns current progress toward achievement (for progressive ones)
    const counters = state.achievementCounters || {};
    return counters[id] || 0;
  },

  incrementCounter(id, amount = 1) {
    if (!state.achievementCounters) state.achievementCounters = {};
    state.achievementCounters[id] = (state.achievementCounters[id] || 0) + amount;
    // Check thresholds
    const thresholds = {
      'ghost_killer': 50, 'guardian_angel': 20, 'veteran': 100,
      'team_player': 50, 'night_ops': 5, 'world_traveler': 5
    };
    if (thresholds[id] && state.achievementCounters[id] >= thresholds[id]) {
      this.unlock(id);
    }
  },

  checkMissionAchievements(result) {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local) return;
    
    // First blood
    if (state.threatsEliminated > 0) this.unlock('first_blood');
    if (state.threatsEliminated >= 10) this.unlock('threat_hunter');
    if (state.trapKills >= 3) this.unlock('mine_expert');
    if (!state.wasDowned) this.unlock('untouchable');
    if (state.threatsEliminated === 0 && result === 'win') this.unlock('pacifist');
    if (result === 'win' && state.remaining > state.duration * 30) this.unlock('speed_runner');
    if (scoreGrade(missionScore()) === 'S') this.unlock('perfect_score');
    if (result === 'win' && state.agents.length === 1) this.unlock('lone_wolf');
    if (result === 'win' && state.agents.filter(a => !a.bot).length === 1 && state.agents.every(a => a.id === state.localAgentId || (ReviveSystem?.isEliminated?.(a.id)))) {
      this.unlock('last_stand');
    }
    
    // Progressive counters
    this.incrementCounter('ghost_killer', state.threatsEliminated || 0);
    this.incrementCounter('veteran', 1);
    if (result === 'win') this.incrementCounter('team_player', state.objectives.filter(o => o.found).length);
    
    // Role mastery checks
    const allRoles = Object.keys(roleCatalog);
    const allTier2 = allRoles.every(r => RoleProgression.getTier(r) >= 2);
    if (allTier2) this.unlock('jack_of_all');
    const anyTier4 = allRoles.some(r => RoleProgression.getTier(r) >= 4);
    if (anyTier4) this.unlock('master_of_one');
    const tier4Count = allRoles.filter(r => RoleProgression.getTier(r) >= 4).length;
    if (tier4Count >= 5) this.unlock('legend');
  },

  _showToast(ach) {
    const rarityColors = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2' };
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-toast-icon">${ach.icon}</div>
      <div class="achievement-toast-body">
        <div class="achievement-toast-title">Achievement Unlocked</div>
        <div class="achievement-toast-name" style="color:${rarityColors[ach.rarity]}">${ach.name}</div>
        <div class="achievement-toast-desc">${ach.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
  },

  renderAchievementScreen() {
    const container = document.getElementById('achievementScreen');
    if (!container) return;
    const categories = ['combat', 'exploration', 'teamwork', 'mastery', 'secrets'];
    const catLabels = { combat: 'Combat', exploration: 'Exploration', teamwork: 'Teamwork', mastery: 'Mastery', secrets: 'Secrets' };
    
    container.innerHTML = categories.map(cat => {
      const achs = Object.entries(achievementCatalog).filter(([_, a]) => a.category === cat);
      const unlocked = achs.filter(([id, _]) => this.isUnlocked(id));
      return `
        <div class="achievement-category">
          <h3>${catLabels[cat]} <span class="achievement-count">${unlocked.length}/${achs.length}</span></h3>
          <div class="achievement-grid">
            ${achs.map(([id, ach]) => {
              const isUnlocked = this.isUnlocked(id);
              return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                  <span class="achievement-icon">${isUnlocked ? ach.icon : '🔒'}</span>
                  <span class="achievement-name">${ach.name}</span>
                  <span class="achievement-desc">${isUnlocked ? ach.desc : '???'}</span>
                  <span class="achievement-rarity rarity-${ach.rarity}">${ach.rarity}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }
};
```

### Integration Points

- **Data section** (~line 21): Add `achievementCatalog`
- **state object** (~line 176): Add `achievements` and `achievementCounters`
- **init()** (~line 9709): Add `AchievementSystem.init()`
- **renderResults()** (~line 9103): Add `AchievementSystem.checkMissionAchievements(result)`
- **TrapSystem** (~line 7642): Increment `state.trapKills` on mine kill
- **ReviveSystem** (~line 8537): Increment counter on revive, check `guardian_angel`
- **Lobby**: Add achievements button

### HTML Additions

```html
<!-- In lobby header -->
<button id="achievementsBtn" class="icon-button" title="Achievements">🏆</button>

<!-- Achievement screen (hidden by default) -->
<div id="achievementScreen" class="screen achievement-screen hidden"></div>
```

### CSS Additions

```css
.achievement-toast {
  position: fixed; top: 80px; right: 16px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 18px;
  display: flex; align-items: center; gap: 12px;
  z-index: 200; transform: translateX(120%);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 300px;
}
.achievement-toast.show { transform: translateX(0); }
.achievement-toast-icon { font-size: 32px; }
.achievement-toast-title { font-size: 10px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.5px; }
.achievement-toast-name { font-size: 15px; font-weight: 700; }
.achievement-toast-desc { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
.achievement-screen { padding: 20px; overflow-y: auto; }
.achievement-category { margin-bottom: 24px; }
.achievement-category h3 { font-size: 14px; margin-bottom: 12px; display: flex; justify-content: space-between; }
.achievement-count { color: var(--text-dim); font-weight: 400; }
.achievement-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.achievement-card { background: var(--chip); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; text-align: center; }
.achievement-card.locked { opacity: 0.4; }
.achievement-icon { font-size: 24px; display: block; margin-bottom: 6px; }
.achievement-name { font-size: 12px; font-weight: 600; display: block; }
.achievement-desc { font-size: 10px; color: var(--text-dim); display: block; margin-top: 4px; }
.achievement-rarity { font-size: 9px; text-transform: uppercase; padding: 1px 6px; border-radius: 3px; margin-top: 6px; display: inline-block; }
.rarity-bronze { background: rgba(205,127,50,0.2); color: #cd7f32; }
.rarity-silver { background: rgba(192,192,192,0.2); color: #c0c0c0; }
.rarity-gold { background: rgba(255,215,0,0.2); color: #ffd700; }
.rarity-platinum { background: rgba(229,228,226,0.2); color: #e5e4e2; }
```

---

## Task 3 — Daily Missions & Challenge System

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

3 daily missions rotate at midnight UTC. Each has a specific objective (e.g., "Eliminate 3 threats," "Complete 2 objectives as Medic," "Win 1 mission"). Completing daily missions awards bonus XP. Weekly challenges provide larger goals. A streak system rewards consecutive days of completion.

### Daily Mission Catalog

```js
// New const
const dailyMissionPool = [
  { id: 'daily_kills', text: 'Eliminate {n} threats', target: 'threatsEliminated', amount: 3, xp: 50 },
  { id: 'daily_objectives', text: 'Complete {n} objectives', target: 'objectivesCompleted', amount: 2, xp: 40 },
  { id: 'daily_role', text: 'Complete 1 mission as {role}', target: 'roleMissions', amount: 1, xp: 60 },
  { id: 'daily_revive', text: 'Revive {n} squadmates', target: 'revives', amount: 2, xp: 45 },
  { id: 'daily_cache', text: 'Collect {n} supply caches', target: 'cachesCollected', amount: 3, xp: 35 },
  { id: 'daily_stealth', text: 'Spend {n}s in stealth mode', target: 'stealthTime', amount: 60, xp: 30 },
  { id: 'daily_trap', text: 'Trigger {n} traps', target: 'trapsTriggered', amount: 2, xp: 40 },
  { id: 'daily_weather', text: 'Complete a mission in {weather}', target: 'weatherMissions', amount: 1, xp: 50 }
];
```

### Daily Mission Module

```js
// New module (insert before RoleProgression at ~line 9460)
const DailyMissions = {
  STORAGE_KEY: 'slv2_daily_missions',
  
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.dailyMissions = JSON.parse(saved); } catch(e) {}
    }
    this._ensureFreshMissions();
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.dailyMissions));
  },

  _ensureFreshMissions() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (!state.dailyMissions || state.dailyMissions.date !== today) {
      // New day — generate missions
      const shuffled = [...dailyMissionPool].sort(() => Math.random() - 0.5);
      const missions = shuffled.slice(0, 3).map(m => {
        const mission = { ...m, progress: 0, completed: false };
        if (m.id === 'daily_role') {
          const roles = Object.keys(roleCatalog);
          mission.role = roles[Math.floor(Math.random() * roles.length)];
          mission.text = mission.text.replace('{role}', mission.role);
        }
        if (m.id === 'daily_weather') {
          const weathers = ['rain', 'fog', 'wind'];
          mission.weather = weathers[Math.floor(Math.random() * weathers.length)];
          mission.text = mission.text.replace('{weather}', mission.weather);
        }
        mission.text = mission.text.replace('{n}', mission.amount);
        return mission;
      });
      
      // Streak logic
      let streak = state.dailyMissions?.streak || 0;
      const lastDate = state.dailyMissions?.date;
      if (lastDate) {
        const last = new Date(lastDate);
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          // Consecutive day — streak continues if all completed
          if (state.dailyMissions.missions?.every(m => m.completed)) streak++;
          else streak = 0;
        } else if (diffDays > 1) {
          streak = 0;
        }
      }
      
      state.dailyMissions = { date: today, missions, streak, claimed: false };
      this.save();
    }
  },

  updateProgress(target, amount = 1, context = {}) {
    if (!state.dailyMissions?.missions) return;
    state.dailyMissions.missions.forEach(m => {
      if (m.completed) return;
      let shouldIncrement = false;
      switch (m.target) {
        case 'threatsEliminated': if (target === 'kill') shouldIncrement = true; break;
        case 'objectivesCompleted': if (target === 'objective') shouldIncrement = true; break;
        case 'roleMissions': if (target === 'mission' && context.role === m.role) shouldIncrement = true; break;
        case 'revives': if (target === 'revive') shouldIncrement = true; break;
        case 'cachesCollected': if (target === 'cache') shouldIncrement = true; break;
        case 'stealthTime': if (target === 'stealth') shouldIncrement = true; break;
        case 'trapsTriggered': if (target === 'trap') shouldIncrement = true; break;
        case 'weatherMissions': if (target === 'mission' && context.weather === m.weather) shouldIncrement = true; break;
      }
      if (shouldIncrement) {
        m.progress = Math.min(m.amount, m.progress + amount);
        if (m.progress >= m.amount) {
          m.completed = true;
          this._onComplete(m);
        }
      }
    });
    this.save();
  },

  _onComplete(mission) {
    const streakBonus = Math.floor(state.dailyMissions.streak * 5);
    const totalXP = mission.xp + streakBonus;
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (local?.role) {
      RoleProgression.addXP(local.role, totalXP, `Daily: ${mission.text}`);
    }
    EventLog.add('system', '📅', `<strong>Daily Complete</strong> ${mission.text} (+${totalXP} XP)`);
    ScreenJuice.addKillFeed(`DAILY COMPLETE: +${totalXP} XP`, '#4caf50');
  },

  claimAll() {
    const dm = state.dailyMissions;
    if (!dm || dm.claimed) return;
    if (!dm.missions.every(m => m.completed)) return;
    dm.claimed = true;
    const bonusXP = 100 + (dm.streak * 10);
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (local?.role) RoleProgression.addXP(local.role, bonusXP, 'Daily bonus');
    EventLog.add('system', '🎁', `<strong>Daily Bonus</strong> All missions complete! +${bonusXP} XP`);
    this.save();
  },

  renderHUD() {
    const el = document.getElementById('dailyMissionsHUD');
    if (!el || !state.dailyMissions?.missions) return;
    const allComplete = state.dailyMissions.missions.every(m => m.completed);
    el.innerHTML = state.dailyMissions.missions.map(m => `
      <div class="daily-mission ${m.completed ? 'complete' : ''}">
        <span class="daily-icon">${m.completed ? '✅' : '📋'}</span>
        <span class="daily-text">${m.text}</span>
        <span class="daily-progress">${m.progress}/${m.amount}</span>
      </div>
    `).join('') + `
      <div class="daily-streak">🔥 ${state.dailyMissions.streak} day streak</div>
      ${allComplete && !state.dailyMissions.claimed ? '<button class="daily-claim" onclick="DailyMissions.claimAll()">Claim Bonus</button>' : ''}
    `;
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `DailyMissions.init()`
- **simulateWorld() / TrapSystem / ReviveSystem**: Call `DailyMissions.updateProgress(target, amount, context)`
- **renderResults()** (~line 9103): Call `DailyMissions.updateProgress('mission', 1, { role, weather })`
- **renderHUD()** (~line 6792): Add `DailyMissions.renderHUD()` call
- **Lobby / Mission HUD**: Add daily missions panel

### HTML Additions

```html
<!-- In mission HUD or lobby -->
<div id="dailyMissionsHUD" class="daily-missions-hud"></div>
```

### CSS Additions

```css
.daily-missions-hud { position: fixed; top: 50px; right: 12px; background: rgba(11,15,20,0.9); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; z-index: 20; min-width: 180px; }
.daily-mission { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 11px; }
.daily-mission.complete { opacity: 0.5; }
.daily-text { flex: 1; }
.daily-progress { color: var(--text-dim); font-size: 10px; }
.daily-streak { font-size: 11px; color: var(--accent); margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); }
.daily-claim { width: 100%; margin-top: 8px; background: var(--accent); color: #000; border: none; padding: 6px; border-radius: 4px; font-weight: 700; font-size: 11px; cursor: pointer; }
```

---

## Task 4 — New Objective Types (Escort, Sabotage, Recon)

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design

3 new objective types that change how squads approach missions:
- **Escort:** A friendly NPC ("Asset") must be guided from point A to B. Asset moves slowly toward the nearest agent. If left alone too long, it stops. Threats target the asset.
- **Sabotage:** Players must plant charges at 2-3 enemy relay points within a time limit. Charges have a 10s fuse. Completing all relays wins the objective.
- **Recon:** Players must visit 3-5 recon points in any order and "scan" each (stand within 15m for 5s). Scanning reveals nearby threats.

### State Additions

```js
// In state object (~line 176)
escortAssets: [], // { id, lat, lng, targetLat, targetLng, moving, health }
sabotageRelays: [], // { id, lat, lng, charged, chargeTimer, points }
reconPoints: [], // { id, lat, lng, scanned, scanProgress }
```

### Objective Implementations

```js
// In server-v2.js _generateObjectives() or client objective generation
// Escort
function generateEscortObjective(center) {
  const start = jitter(center, 0.003);
  const end = jitter(center, 0.008);
  return {
    id: 'escort-' + Date.now(),
    type: 'escort',
    startLat: start[0], startLng: start[1],
    endLat: end[0], endLng: end[1],
    assetLat: start[0], assetLng: start[1],
    health: 100,
    moving: false,
    found: false,
    points: 40
  };
}

// Sabotage
function generateSabotageObjectives(center) {
  return Array.from({ length: 3 }, (_, i) => ({
    id: 'sabotage-' + i,
    type: 'sabotage',
    lat: center[0] + (Math.random() - 0.5) * 0.01,
    lng: center[1] + (Math.random() - 0.5) * 0.01,
    charged: false,
    chargeTimer: 0,
    found: false,
    points: 20
  }));
}

// Recon
function generateReconPoints(center) {
  return Array.from({ length: 4 }, (_, i) => ({
    id: 'recon-' + i,
    type: 'recon',
    lat: center[0] + (Math.random() - 0.5) * 0.012,
    lng: center[1] + (Math.random() - 0.5) * 0.012,
    scanned: false,
    scanProgress: 0,
    found: false,
    points: 15
  }));
}
```

### Tick Logic (in simulateWorld)

```js
// In simulateWorld() (~line 5921)
// Escort tick
state.escortAssets?.forEach(asset => {
  if (asset.found) return;
  const nearest = state.agents.reduce((best, a) => {
    const d = haversine(a, asset);
    return d < best.d ? { a, d } : best;
  }, { d: Infinity });
  
  if (nearest.d < 30) {
    asset.moving = true;
    // Move toward end point
    const dLat = asset.endLat - asset.assetLat;
    const dLng = asset.endLng - asset.assetLng;
    const dist = Math.sqrt(dLat*dLat + dLng*dLng) || 1;
    asset.assetLat += (dLat / dist) * 0.00015;
    asset.assetLng += (dLng / dist) * 0.00015;
    
    if (haversine({ lat: asset.assetLat, lng: asset.assetLng }, { lat: asset.endLat, lng: asset.endLng }) < 20) {
      asset.found = true;
      state.scores[nearest.a.team] += asset.points;
      EventLog.add('objective', '🛡️', '<strong>Asset Escorted</strong> Objective complete');
    }
  } else {
    asset.moving = false;
  }
  
  // Threats target asset
  state.threats.forEach(t => {
    if (haversine(t, asset) < 50) {
      asset.health -= 5;
      if (asset.health <= 0) {
        EventLog.add('alert', '💥', '<strong>Asset Destroyed</strong> Escort failed');
        asset.found = true; // mark as done (failed)
      }
    }
  });
});

// Sabotage tick
state.sabotageRelays?.forEach(relay => {
  if (relay.found) return;
  if (relay.charged && Date.now() > relay.chargeTimer) {
    relay.found = true;
    EventLog.add('objective', '💣', '<strong>Relay Destroyed</strong>');
    ParticleSystem.burst(relay.lat, relay.lng, ['#ff4444', '#ff8800'], 10);
  }
  // Check if all sabotaged
  if (state.sabotageRelays.every(r => r.found)) {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (local) state.scores[local.team] += 30;
  }
});

// Recon tick
state.reconPoints?.forEach(point => {
  if (point.scanned) return;
  const near = state.agents.filter(a => haversine(a, point) < 15);
  if (near.length > 0) {
    point.scanProgress = Math.min(100, (point.scanProgress || 0) + (near.length * 4));
    if (point.scanProgress >= 100) {
      point.scanned = true;
      point.found = true;
      // Reveal nearby threats
      state.threats.forEach(t => {
        if (haversine(t, point) < 200) t._revealedUntil = Date.now() + 30000;
      });
      EventLog.add('objective', '👁️', '<strong>Recon Complete</strong> Threats revealed');
    }
  }
});
```

### Integration Points

- **server-v2.js _generateObjectives()**: Add new objective types
- **moduleCatalog** (~line 46): Add `escort`, `sabotage`, `recon` modules
- **simulateWorld()** (~line 5921): Add tick logic for 3 new types
- **renderMissionMap()** (~line 6895): Add markers for asset, relays, recon points
- **renderObjectivesList()** (~line 6940): Add list entries for new types

---

## Task 5 — New Map Biomes (Desert, Arctic, Jungle, Urban)

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~180-220

### Design

Add 4 new city/biome entries to the cities catalog. Each biome has unique terrain weights, weather biases, and threat behaviors. Biomes are purely data-driven — no new rendering code needed beyond city selection.

### City/Biome Additions

```js
// In cities (~line 11)
const cities = {
  // ... existing cities ...
  cairo:     { name: "Cairo",     country: "egypt",     center: [30.0444, 31.2357], biome: 'desert' },
  reykjavik: { name: "Reykjavik", country: "iceland",   center: [64.1466, -21.9426], biome: 'arctic' },
  manaus:    { name: "Manaus",    country: "brazil",    center: [-3.1190, -60.0217], biome: 'jungle' },
  chicago:   { name: "Chicago",   country: "usa",       center: [41.8781, -87.6298], biome: 'urban' }
};

const countries = {
  // ... existing ...
  egypt: "Egypt", iceland: "Iceland", brazil: "Brazil"
};
```

### Biome Configurations

```js
// New const
const biomeConfigs = {
  desert: {
    terrainWeights: [0.6, 0.05, 0.15, 0.05, 0.15], // more open, more water (oases)
    weatherWeights: [0.5, 0.05, 0.05, 0.40], // more wind (sandstorms)
    threatSpeedMult: 1.2, // threats move faster in open terrain
    threatDetectMult: 1.15, // better visibility
    signalModifier: 0.95, // heat interference
    colorTint: 'rgba(194, 178, 128, 0.04)'
  },
  arctic: {
    terrainWeights: [0.3, 0.10, 0.10, 0.05, 0.45], // lots of water (ice)
    weatherWeights: [0.3, 0.10, 0.40, 0.20], // more fog
    threatSpeedMult: 0.7, // slower in snow
    threatDetectMult: 0.8, // reduced visibility
    signalModifier: 1.1, // cold air = better propagation
    colorTint: 'rgba(200, 220, 255, 0.05)'
  },
  jungle: {
    terrainWeights: [0.1, 0.05, 0.10, 0.65, 0.10], // mostly woods
    weatherWeights: [0.2, 0.50, 0.15, 0.15], // lots of rain
    threatSpeedMult: 1.1, // agile in dense terrain
    threatDetectMult: 0.7, // hard to see through canopy
    signalModifier: 0.85, // dense vegetation blocks signal
    colorTint: 'rgba(80, 140, 80, 0.05)'
  },
  urban: {
    terrainWeights: [0.1, 0.05, 0.70, 0.10, 0.05], // mostly urban
    weatherWeights: [0.4, 0.30, 0.20, 0.10], // rain from pollution
    threatSpeedMult: 0.9, // navigate around buildings
    threatDetectMult: 0.75, // buildings block LOS
    signalModifier: 0.9, // interference from buildings
    colorTint: 'rgba(100, 120, 140, 0.06)'
  }
};
```

### Integration Points

- **cities** (~line 11): Add 4 new entries with biome field
- **countries** (~line 21): Add new countries
- **TerrainSystem** (~line 8234): Use `biomeConfigs[biome].terrainWeights` instead of hardcoded weights
- **WeatherSystem** (~line 7879): Use `biomeConfigs[biome].weatherWeights`
- **simulateWorld()** (~line 5921): Apply biome threat speed/detect modifiers
- **renderMissionMap()** (~line 6895): Apply `colorTint` as CSS filter on map container
- **renderCityOptions()** (~line 4594): Add new cities to selection

---

## Task 6 — Cosmetic Items & Customization

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~180-220

### Design

Cosmetics are purely visual — player card borders, agent marker styles, ping icons, and kill feed nameplates. Unlocked via achievements, role tier milestones, and mission completions. No gameplay advantage.

### Cosmetic Catalog

```js
// New const
const cosmeticCatalog = {
  // Agent marker styles
  markers: {
    'default': { name: 'Standard', icon: '●', unlock: 'default' },
    'crosshair': { name: 'Crosshair', icon: '✚', unlock: { type: 'tier', role: 'any', tier: 2 } },
    'diamond': { name: 'Diamond', icon: '◆', unlock: { type: 'achievement', id: 'perfect_score' } },
    'star': { name: 'Star', icon: '★', unlock: { type: 'tier', role: 'any', tier: 4 } },
    'skull': { name: 'Ghost', icon: '💀', unlock: { type: 'achievement', id: 'ghost_killer' } }
  },
  // Card borders
  borders: {
    'default': { name: 'Standard', style: '1px solid var(--border)', unlock: 'default' },
    'gold': { name: 'Gold Trim', style: '2px solid #ffd700', unlock: { type: 'tier', role: 'any', tier: 3 } },
    'platinum': { name: 'Platinum', style: '2px solid #e5e4e2', unlock: { type: 'achievement', id: 'legend' } },
    'red': { name: 'Crimson', style: '2px solid #ff4444', unlock: { type: 'achievement', id: 'last_stand' } }
  },
  // Ping icons
  pings: {
    'default': { name: 'Standard', icon: '📍', unlock: 'default' },
    'flare': { name: 'Flare', icon: '🔦', unlock: { type: 'missions', count: 10 } },
    'radar': { name: 'Radar', icon: '📡', unlock: { type: 'role', role: 'Drone', missions: 5 } }
  }
};
```

### Cosmetic Module

```js
// New module (insert before RoleProgression at ~line 9460)
const CosmeticSystem = {
  STORAGE_KEY: 'slv2_cosmetics',
  
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.cosmetics = JSON.parse(saved); } catch(e) {}
    } else {
      state.cosmetics = { marker: 'default', border: 'default', ping: 'default', unlocked: ['default'] };
    }
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.cosmetics));
  },

  isUnlocked(itemId, category) {
    if (state.cosmetics.unlocked?.includes(`${category}:${itemId}`)) return true;
    const item = cosmeticCatalog[category]?.[itemId];
    if (!item || item.unlock === 'default') return true;
    const unlock = item.unlock;
    switch (unlock.type) {
      case 'tier':
        const roles = unlock.role === 'any' ? Object.keys(roleCatalog) : [unlock.role];
        return roles.some(r => RoleProgression.getTier(r) >= unlock.tier);
      case 'achievement':
        return AchievementSystem.isUnlocked(unlock.id);
      case 'missions':
        return (state.sessionStats?.missions || 0) >= unlock.count;
      case 'role':
        return StatsTracker.getRoleMissionCount?.(unlock.role) >= unlock.missions;
    }
    return false;
  },

  unlock(itemId, category) {
    const key = `${category}:${itemId}`;
    if (!state.cosmetics.unlocked) state.cosmetics.unlocked = [];
    if (!state.cosmetics.unlocked.includes(key)) {
      state.cosmetics.unlocked.push(key);
      this.save();
      EventLog.add('system', '🎨', `<strong>Unlocked</strong> ${cosmeticCatalog[category][itemId].name}`);
    }
  },

  equip(itemId, category) {
    if (!this.isUnlocked(itemId, category)) return false;
    state.cosmetics[category] = itemId;
    this.save();
    return true;
  },

  getEquipped(category) {
    return state.cosmetics[category] || 'default';
  },

  getMarkerStyle() {
    const id = this.getEquipped('marker');
    return cosmeticCatalog.markers[id] || cosmeticCatalog.markers.default;
  },

  getBorderStyle() {
    const id = this.getEquipped('border');
    return cosmeticCatalog.borders[id] || cosmeticCatalog.borders.default;
  },

  renderCosmeticScreen() {
    const container = document.getElementById('cosmeticScreen');
    if (!container) return;
    container.innerHTML = Object.entries(cosmeticCatalog).map(([cat, items]) => `
      <div class="cosmetic-category">
        <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
        <div class="cosmetic-grid">
          ${Object.entries(items).map(([id, item]) => {
            const unlocked = this.isUnlocked(id, cat);
            const equipped = this.getEquipped(cat) === id;
            return `
              <div class="cosmetic-item ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}"
                   onclick="CosmeticSystem.equip('${id}', '${cat}'); CosmeticSystem.renderCosmeticScreen();">
                <span class="cosmetic-preview">${unlocked ? item.icon : '🔒'}</span>
                <span class="cosmetic-name">${item.name}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }
};
```

### Integration Points

- **Data section** (~line 21): Add `cosmeticCatalog`
- **state object** (~line 176): Add `cosmetics`
- **init()** (~line 9709): Add `CosmeticSystem.init()`
- **renderMissionMap()** (~line 6895): Use `CosmeticSystem.getMarkerStyle()` for local agent marker
- **renderRoleCards()** (~line 5171): Use `CosmeticSystem.getBorderStyle()` for card borders
- **PingSystem** (~line 1336): Use `CosmeticSystem.getEquipped('ping')` for ping icon

---

## Task 7 — Minimap Zoom & HUD Customization

**Effort:** Small | **Impact:** 3/5 | **Lines:** ~100-130

### Design

Add zoom in/out buttons to the radar/minimap. Allow players to toggle HUD elements (signal bar, stamina bar, event log, ability hotbar) via the settings menu. HUD layout presets: "Minimal" (timer + radar only), "Standard" (default), "Tactical" (everything + enlarged radar).

### Radar Zoom

```js
// In RadarModule (~line 2009)
zoomLevel: 1.0,
ZOOM_MIN: 0.5,
ZOOM_MAX: 2.5,
ZOOM_STEP: 0.25,

zoomIn() {
  this.zoomLevel = Math.min(this.ZOOM_MAX, this.zoomLevel + this.ZOOM_STEP);
},
zoomOut() {
  this.zoomLevel = Math.max(this.ZOOM_MIN, this.zoomLevel - this.ZOOM_STEP);
},
resetZoom() {
  this.zoomLevel = 1.0;
},

// In draw(), scale range by zoomLevel
const rangeMeters = (state.radarRange || 300) * this.zoomLevel;
```

### HUD Layout Presets

```js
// In state.settings (from Phase 5 Task 5)
hudLayout: 'standard', // 'minimal' | 'standard' | 'tactical'
hudElements: {
  signalBar: true,
  staminaBar: true,
  eventLog: true,
  abilityHotbar: true,
  weatherHUD: true,
  terrainHUD: true,
  progressionHUD: true,
  dailyMissions: false
}
```

### Integration Points

- **RadarModule** (~line 2009): Add zoom methods and buttons
- **SettingsMenu** (Phase 5): Add HUD layout tab with toggles
- **renderHUD()** (~line 6792): Respect `state.settings.hudElements` visibility
- **index.html**: Add radar zoom buttons near radar canvas

### HTML Additions

```html
<!-- Near radar canvas -->
<div class="radar-controls">
  <button class="radar-zoom" onclick="RadarModule.zoomIn()" title="Zoom In">+</button>
  <button class="radar-zoom" onclick="RadarModule.zoomOut()" title="Zoom Out">−</button>
  <button class="radar-zoom" onclick="RadarModule.resetZoom()" title="Reset">⟲</button>
</div>
```

### CSS Additions

```css
.radar-controls { position: fixed; bottom: 180px; right: 12px; display: flex; flex-direction: column; gap: 4px; z-index: 20; }
.radar-zoom { width: 28px; height: 28px; background: rgba(11,15,20,0.8); border: 1px solid var(--border); color: var(--text); border-radius: 4px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.radar-zoom:hover { border-color: var(--accent); }
```

---

## Task 8 — Friend System & Recent Players

**Effort:** Medium | **Impact:** 3/5 | **Lines:** ~150-180

### Design

Track recently played-with agents. Allow adding friends by callsign. Friends show as online in lobby (if on same server). Friend list persists to localStorage. Quick-invite button to send join code to friends.

### Friend Module

```js
// New module (insert before RoleProgression at ~line 9460)
const FriendSystem = {
  STORAGE_KEY: 'slv2_friends',
  RECENT_KEY: 'slv2_recent_players',
  
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try { state.friends = JSON.parse(saved); } catch(e) { state.friends = []; }
    } else {
      state.friends = [];
    }
    const recent = localStorage.getItem(this.RECENT_KEY);
    if (recent) {
      try { state.recentPlayers = JSON.parse(recent); } catch(e) { state.recentPlayers = []; }
    } else {
      state.recentPlayers = [];
    }
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.friends));
    localStorage.setItem(this.RECENT_KEY, JSON.stringify(state.recentPlayers.slice(-20)));
  },

  addFriend(callsign, name) {
    if (state.friends.find(f => f.callsign === callsign)) return false;
    state.friends.push({ callsign, name, addedAt: Date.now() });
    this.save();
    return true;
  },

  removeFriend(callsign) {
    state.friends = state.friends.filter(f => f.callsign !== callsign);
    this.save();
  },

  recordRecent(player) {
    if (!player || player.id === state.localAgentId) return;
    const existing = state.recentPlayers.findIndex(p => p.callsign === player.callsign);
    if (existing >= 0) state.recentPlayers.splice(existing, 1);
    state.recentPlayers.push({
      callsign: player.callsign,
      name: player.name,
      role: player.role,
      playedAt: Date.now()
    });
    this.save();
  },

  inviteFriend(callsign) {
    const friend = state.friends.find(f => f.callsign === callsign);
    if (!friend) return;
    // In a real system, this would send a push notification or socket message
    // For now, copy join code to clipboard
    navigator.clipboard?.writeText(state.code).then(() => {
      addChat('System', `Invite link copied for ${friend.name}. Share it!`);
    });
  },

  renderFriendList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="friend-section">
        <h4>Friends (${state.friends.length})</h4>
        ${state.friends.length ? state.friends.map(f => `
          <div class="friend-row">
            <span class="friend-name">${f.name} <code>${f.callsign}</code></span>
            <button onclick="FriendSystem.inviteFriend('${f.callsign}')">Invite</button>
            <button onclick="FriendSystem.removeFriend('${f.callsign}')">Remove</button>
          </div>
        `).join('') : '<p class="empty">No friends yet. Play missions to meet agents!</p>'}
      </div>
      <div class="friend-section">
        <h4>Recent Players</h4>
        ${state.recentPlayers.slice().reverse().slice(0, 10).map(p => `
          <div class="friend-row">
            <span class="friend-name">${p.name} <code>${p.callsign}</code> ${roleEmojis[p.role] || ''}</span>
            <button onclick="FriendSystem.addFriend('${p.callsign}', '${p.name}')">Add Friend</button>
          </div>
        `).join('')}
      </div>
    `;
  }
};
```

### Integration Points

- **init()** (~line 9709): Add `FriendSystem.init()`
- **SignalNet players-update** (~line 1040): Call `FriendSystem.recordRecent()` for new players
- **Lobby**: Add friends button and panel
- **renderResults()** (~line 9103): Record all squadmates as recent

### HTML Additions

```html
<!-- In lobby header -->
<button id="friendsBtn" class="icon-button" title="Friends">👥</button>

<!-- Friends panel -->
<div id="friendsPanel" class="friends-panel hidden"></div>
```

### CSS Additions

```css
.friends-panel { position: fixed; top: 60px; right: 12px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; z-index: 100; min-width: 240px; max-height: 400px; overflow-y: auto; }
.friend-section { margin-bottom: 16px; }
.friend-section h4 { font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px; }
.friend-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
.friend-name { flex: 1; }
.friend-name code { color: var(--accent); font-size: 10px; }
.friend-row button { font-size: 10px; padding: 2px 8px; }
```

---

## Task 9 — Report System & Vote Kick

**Effort:** Small | **Impact:** 3/5 | **Lines:** ~80-100

### Design

Players can report others for: Cheating, Toxicity, AFK, or Griefing. Reports are stored server-side with timestamps. Vote kick allows the squad to remove a disruptive player — requires 50% of non-target players to vote yes.

### Server Changes

```js
// In server-v2.js, add to top (~line 22)
const reports = new Map(); // targetId -> [{ reporterId, reason, timestamp }]
const voteKicks = new Map(); // gameCode -> { targetId, votes: Set(), startedAt }

// Add handlers (~line 215)
socket.on('report-player', ({ targetId, reason }) => {
  if (!currentGame || !currentPlayer) return;
  if (!reports.has(targetId)) reports.set(targetId, []);
  reports.get(targetId).push({ reporterId: socket.id, reason, timestamp: Date.now() });
  socket.emit('report-ack', { success: true });
});

socket.on('vote-kick', ({ targetId }) => {
  if (!currentGame || !currentPlayer) return;
  const game = games.get(currentGame);
  if (!game) return;
  
  const playerCount = Object.keys(game.players).length;
  const requiredVotes = Math.ceil((playerCount - 1) / 2);
  
  if (!voteKicks.has(currentGame)) {
    voteKicks.set(currentGame, { targetId, votes: new Set(), startedAt: Date.now() });
  }
  const vk = voteKicks.get(currentGame);
  if (vk.targetId !== targetId) return; // different vote in progress
  vk.votes.add(socket.id);
  
  io.to(currentGame).emit('vote-kick-update', {
    targetId, votes: vk.votes.size, required: requiredVotes
  });
  
  if (vk.votes.size >= requiredVotes) {
    // Execute kick
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) {
      targetSocket.emit('kicked', { reason: 'Vote kicked by squad' });
      targetSocket.leave(currentGame);
    }
    delete game.players[targetId];
    io.to(currentGame).emit('players-update', game.players);
    io.to(currentGame).emit('chat', { sender: 'System', text: 'Vote kick passed. Player removed.' });
    voteKicks.delete(currentGame);
  }
});
```

### Client Integration

```js
// Add to player context menu or admin panel
function reportPlayer(targetId, reason) {
  SignalNet.socket?.emit('report-player', { targetId, reason });
  addChat('System', 'Report submitted. Thank you.');
}

function startVoteKick(targetId) {
  SignalNet.socket?.emit('vote-kick', { targetId });
}

// Add listener
SignalNet.socket?.on('vote-kick-update', ({ targetId, votes, required }) => {
  addChat('System', `Vote kick: ${votes}/${required} votes`);
});
```

### Integration Points

- **server-v2.js**: Add `reports` and `voteKicks` Maps, add handlers
- **game-v2.js**: Add report/vote UI in player list or context menu
- **AdminPanel** (Phase 5): Add "View Reports" button for host

---

## Task 10 — Particle Effect Presets Per Zone

**Effort:** Small | **Impact:** 3/5 | **Lines:** ~80-100

### Design

Different terrain types and weather conditions trigger different particle effects: rain streaks in rain, dust motes in desert, snow in arctic, leaves in jungle, sparks in urban. Uses existing ParticleSystem with new presets.

### Particle Presets

```js
// In ParticleSystem (~line 306) or new module
const particlePresets = {
  rain: { colors: ['#8aa3bf', '#6b8fa8'], count: 3, speed: 8, life: 600, type: 'streak' },
  fog: { colors: ['#c8d0d8', '#b0b8c0'], count: 1, speed: 0.5, life: 3000, type: 'drift' },
  wind: { colors: ['#a0b0a0', '#c0d0c0'], count: 2, speed: 4, life: 1200, type: 'leaf' },
  desert: { colors: ['#c2b280', '#d4c4a0'], count: 2, speed: 2, life: 2000, type: 'dust' },
  arctic: { colors: ['#e0e8f0', '#f0f4f8'], count: 2, speed: 1, life: 2500, type: 'snow' },
  jungle: { colors: ['#6b8f3e', '#8fb050'], count: 1, speed: 1.5, life: 2000, type: 'leaf' },
  urban: { colors: ['#ffaa00', '#ffdd44'], count: 1, speed: 0.3, life: 800, type: 'spark' }
};

// In ParticleSystem.spawn(), check preset
spawnPreset(presetName, lat, lng, count = 1) {
  const preset = particlePresets[presetName];
  if (!preset) return;
  for (let i = 0; i < count * preset.count; i++) {
    this.spawn(lat, lng, preset.colors[Math.floor(Math.random() * preset.colors.length)], preset.speed, preset.life, preset.type);
  }
}
```

### Integration Points

- **ParticleSystem** (~line 306): Add `particlePresets` and `spawnPreset()`
- **WeatherSystem.tick()** (~line 7879): Call `ParticleSystem.spawnPreset(weatherType, center...)`
- **TerrainSystem.renderHUD()** (~line 8234): Call `ParticleSystem.spawnPreset(terrainType, local.lat, local.lng, 1)` occasionally
- **simulateWorld()** (~line 5921): Ambient particle spawning based on conditions

---

## File Map

| Feature | Primary File | Insert Area |
|---------|-------------|-------------|
| Loadout Customization | game-v2.js | Data + new module before RoleProgression (~line 9460) |
| Achievement System | game-v2.js | Data + new module before RoleProgression (~line 9460) |
| Daily Missions | game-v2.js | Data + new module before RoleProgression (~line 9460) |
| New Objective Types | server-v2.js + game-v2.js | Objective generation + tick logic |
| New Map Biomes | game-v2.js | cities data + TerrainSystem/WeatherSystem (~line 11-8234) |
| Cosmetic Items | game-v2.js | Data + new module before RoleProgression (~line 9460) |
| Minimap Zoom | game-v2.js | RadarModule modifications (~line 2009) |
| Friend System | game-v2.js | New module before RoleProgression (~line 9460) |
| Report/Vote Kick | server-v2.js + game-v2.js | Server handlers + client UI |
| Particle Presets | game-v2.js | ParticleSystem additions (~line 306) |

### game-v2.js Insertion Points

| Feature | Function / Location | Approx Line |
|---------|--------------------|-------------|
| Loadout catalog | Data section | ~21 |
| Achievement catalog | Data section | ~21 |
| Daily mission pool | Data section | ~21 |
| Cosmetic catalog | Data section | ~21 |
| Biome configs | Data section | ~21 |
| City additions | cities | ~11 |
| Loadout init | `init()` | ~9709 |
| Achievement init | `init()` | ~9709 |
| Daily init | `init()` | ~9709 |
| Cosmetic init | `init()` | ~9709 |
| Friend init | `init()` | ~9709 |
| Loadout apply | `startMissionClock()` | ~5861 |
| Achievement check | `renderResults()` | ~9103 |
| Daily progress | Various systems | ~5921-7642 |
| Radar zoom | `RadarModule` | ~2009 |
| Particle presets | `ParticleSystem` | ~306 |

### index.html Insertion Points

| Feature | Insert After | Approx Line |
|---------|-------------|-------------|
| Achievement screen | Body end | ~776 |
| Cosmetic screen | Body end | ~776 |
| Friends panel | Lobby header | ~109 |
| Daily missions HUD | Mission HUD | ~446 |
| Radar zoom controls | Near radar canvas | ~380 |
| Loadout panel | Loadout screen | ~272 |

### styles-v2.css Insertion Points

| Feature | Approx Location |
|---------|----------------|
| Loadout styles | End of file |
| Achievement styles | End of file |
| Daily mission styles | End of file |
| Cosmetic styles | End of file |
| Friend panel styles | End of file |
| Radar zoom controls | End of file |

---

## Execution Order

Build in priority order. After each task:
1. `node --check game-v2.js`
2. `node --check server-v2.js`
3. `git add -A && git commit -m "feat: [feature name]"`
4. Move to next task

**Task 1 (Loadout)** should be first — it's the biggest progression system. **Task 2 (Achievements)** follows since loadout unlocks reference achievements. **Task 4 (New Objectives)** and **Task 5 (Biomes)** add content diversity. The rest are polish and can be done in any order.

---

*Research conducted May 2026. All estimates based on existing codebase patterns and architectural constraints.*
