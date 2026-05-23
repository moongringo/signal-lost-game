# Phase 8 — Social, Monetization & Performance

**Signal Lost v2** — 9,984-line game-v2.js + 322-line server.js  
**Current state:** Phase 5-6 complete (Multiplayer, Spectator, New Roles, New Objectives, Tutorial, Settings, Achievements, Dynamic Music, Admin Panel, Reconnection, Biomes, Loadout, Ping Wheel, Daily Missions, Chat, Minimap, Friends, Match History, Weather, Terrain, Revive, Traps, Supply Caches, Role Progression, Particle System, Screen Juice, Fog of War, Command Wheel)

---

## Phase 8 Focus Areas

| Area | Features | Goal |
|------|----------|------|
| **Social** | Clans/Guilds, Leaderboards, Tournaments, Voice Chat | Player retention, community building, competitive depth |
| **Monetization-ready** | Cosmetic Shop, Battle Pass, Premium Currency | Revenue foundation without pay-to-win |
| **Performance** | WebGL Rendering, Asset Lazy-Loading, Memory Optimization, Mobile Battery Optimization | 60fps on mid-tier devices, longer play sessions |

---

## Priority Ranking

| # | Feature | Effort | Impact | Area | Lines |
|---|---------|--------|--------|------|-------|
| 1 | **Clans / Guilds System** | Large | 5/5 | Social | ~400-500 |
| 2 | **Global Leaderboards** | Medium | 5/5 | Social | ~250-300 |
| 3 | **Tournament Brackets** | Large | 4/5 | Social | ~350-450 |
| 4 | **Voice Chat Integration (WebRTC)** | Large | 4/5 | Social | ~300-400 |
| 5 | **Cosmetic Shop** | Medium | 5/5 | Monetization | ~250-300 |
| 6 | **Battle Pass System** | Large | 5/5 | Monetization | ~350-450 |
| 7 | **Premium Currency (Credits)** | Small | 4/5 | Monetization | ~150-200 |
| 8 | **WebGL Radar Renderer** | Large | 5/5 | Performance | ~400-500 |
| 9 | **Asset Lazy-Loading & Memory Pool** | Medium | 5/5 | Performance | ~250-300 |
| 10 | **Mobile Battery Optimization v2** | Medium | 4/5 | Performance | ~200-250 |

---

## Task 1 — Clans / Guilds System

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~400-500

### Design
A `ClanSystem` module that lets players create, join, and manage clans/guilds. Clans have names, tags, emblems, member roles (Leader, Officer, Member), a clan chat, and shared clan XP. Clans appear on leaderboards and can enter tournaments.

### State Additions
```js
// In state object
clan: null, // { id, name, tag, emblem, role: 'leader'|'officer'|'member', joinedAt }
clanInvites: [], // { clanId, clanName, from, expiresAt }
clanCache: {}, // clanId -> { name, tag, emblem, members: [], xp, level }
```

### Server Additions (server.js)
- `clan-create` / `clan-join` / `clan-leave` / `clan-invite` / `clan-kick` events
- In-memory clan store (Map) with persistence to JSON file
- Clan chat room (`io.to('clan:' + clanId)`)

### JS Implementation
```js
const ClanSystem = {
  MAX_CLAN_NAME: 24,
  MAX_CLAN_TAG: 5,
  MAX_MEMBERS: 50,

  init() { this._loadLocalClan(); },

  create(name, tag, emblem) {
    // Validate name/tag uniqueness, emit to server
    // Auto-assign leader role
  },

  join(clanId) { /* emit join, handle accept */ },
  leave() { /* clear state.clan, emit leave */ },
  invite(playerName) { /* officer+ only */ },
  kick(playerId) { /* leader/officer only */ },

  // UI: render clan panel in lobby with member list, clan chat, emblem picker
  renderClanPanel() { /* DOM builder for clan screen */ },
  renderClanChat() { /* reuse LobbyChat pattern */ },
  renderEmblemPicker() { /* 16 preset SVG emblems */ },

  // Clan XP: shared pool from all members' mission XP
  addClanXP(amount) {
    if (!state.clan) return;
    // Emit to server, update local cache
  },

  _loadLocalClan() {
    try {
      const saved = localStorage.getItem('slv2_clan');
      if (saved) state.clan = JSON.parse(saved);
    } catch(e) {}
  },
  _saveLocalClan() {
    if (state.clan) localStorage.setItem('slv2_clan', JSON.stringify(state.clan));
    else localStorage.removeItem('slv2_clan');
  }
};
```

### UI Requirements
- New screen: `clanScreen` (HTML) — create/join/browse clans
- Clan panel in lobby: member list (online indicator), clan tag prefix in chat `[TAG] Name`
- Emblem picker: 16 SVG presets (shield, raven, wolf, tower, etc.)
- Clan chat tab in lobby chat

---

## Task 2 — Global Leaderboards

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design
A `LeaderboardSystem` module that fetches and displays ranked lists from the server. Categories: Overall XP, Role Mastery (per role), Clan XP, Weekly Wins. Player's own rank always visible. Top 100 cached locally.

### State Additions
```js
leaderboards: {
  overall: [], // { rank, name, callsign, xp, role }
  role: {},    // roleName -> []
  clan: [],    // { rank, clanName, tag, emblem, xp }
  weekly: [],  // { rank, name, wins, score }
  lastFetch: 0,
  myRanks: {}, // category -> rank
},
```

### Server Additions
- `leaderboard-fetch` event with category param
- Server maintains sorted leaderboards in memory, updates on mission end
- Persistence to `leaderboards.json`

### JS Implementation
```js
const LeaderboardSystem = {
  CATEGORIES: ['overall', 'role', 'clan', 'weekly'],
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  init() { /* wire fetch on leaderboard screen open */ },

  fetch(category, roleName) {
    if (Date.now() - state.leaderboards.lastFetch < this.CACHE_TTL && state.leaderboards[category]?.length) {
      this.render(category);
      return;
    }
    SignalNet.socket?.emit('leaderboard-fetch', { category, role: roleName });
  },

  render(category) {
    // Build DOM table with rank badges (🥇🥈🥉 for top 3)
    // Highlight own row
    // Tabs for switching categories
  },

  // Called when server sends leaderboard data
  onData({ category, data, myRank }) {
    state.leaderboards[category] = data;
    state.leaderboards.myRanks[category] = myRank;
    state.leaderboards.lastFetch = Date.now();
    this.render(category);
  }
};
```

### UI Requirements
- New screen: `leaderboardScreen` (HTML)
- Rank badges: gold/silver/bronze medals for top 3
- Own rank sticky footer
- Filter tabs: Overall | Role Mastery | Clans | Weekly

---

## Task 3 — Tournament Brackets

**Effort:** Large | **Impact:** 4/5 | **Lines:** ~350-450

### Design
A `TournamentSystem` module for scheduled competitive events. Host creates a tournament with format (single/double elimination, round-robin), max teams, start time. Players register as clans or solo. Bracket rendered as interactive tree.

### State Additions
```js
tournaments: {
  active: [], // { id, name, format, startTime, status, registered, bracket }
  myRegistrations: [], // tournamentIds
  currentMatch: null, // { opponent, round, scheduledAt }
},
```

### Server Additions
- `tournament-create`, `tournament-join`, `tournament-start`, `tournament-report-match` events
- Bracket generation (single elimination tree)
- Match scheduling with auto-advance on win report

### JS Implementation
```js
const TournamentSystem = {
  FORMATS: { single: 'Single Elimination', double: 'Double Elimination', roundrobin: 'Round Robin' },

  create(name, format, maxTeams, startTime) { /* host only, emit to server */ },
  join(tournamentId) { /* solo or clan registration */ },
  reportWin(tournamentId, matchId) { /* both players report, server validates */ },

  renderBracket(bracketData) {
    // Canvas or DOM-based bracket tree
    // Each match: team A vs team B, winner highlighted, clickable for details
  },

  renderTournamentList() {
    // List of active/upcoming tournaments with register button
  },

  // Auto-join tournament lobby when match starts
  onMatchReady({ tournamentId, matchId, opponent }) {
    addChat('System', `Tournament match vs ${opponent.name} starting...`);
    // Auto-navigate to game lobby with pre-filled code
  }
};
```

### UI Requirements
- New screen: `tournamentScreen` (HTML)
- Bracket renderer: CSS Grid or Canvas tree layout
- Tournament cards: name, format, teams registered, countdown timer
- Registration button with clan/solo toggle

---

## Task 4 — Voice Chat Integration (WebRTC)

**Effort:** Large | **Impact:** 4/5 | **Lines:** ~300-400

### Design
A `VoiceChatSystem` module using WebRTC (RTCPeerConnection) with Socket.IO signaling. Squad-only voice (same team). Push-to-talk or voice-activated. Mute/unmute per player. Visual indicators: speaking glow on player markers.

### State Additions
```js
voiceChat: {
  enabled: false,
  muted: false,
  pushToTalk: true, // false = voice activation
  pttKey: 'v',
  peers: {}, // playerId -> RTCPeerConnection
  localStream: null,
  speaking: {}, // playerId -> boolean
  volumes: {},  // playerId -> 0-1
},
```

### Server Additions
- WebRTC signaling: `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate` relay
- Room-based relay: only forward to same team in same game

### JS Implementation
```js
const VoiceChatSystem = {
  async init() {
    // Request mic permission
    // Create local stream
    // Setup Socket.IO signaling listeners
  },

  async connectToPeer(playerId) {
    // Create RTCPeerConnection
    // Add local stream tracks
    // Create offer -> emit via SignalNet
  },

  onOffer({ from, offer }) {
    // Create answer -> emit back
  },

  onAnswer({ from, answer }) {
    // Set remote description
  },

  onIceCandidate({ from, candidate }) {
    // Add ICE candidate
  },

  // Push-to-talk
  startTalking() { if (state.voiceChat.localStream) { /* unmute tracks */ } },
  stopTalking() { /* mute tracks */ },

  // Voice activity detection (simple volume threshold)
  detectSpeaking() {
    // AnalyserNode on local stream
    // Emit speaking-start / speaking-stop events
  },

  // Visual indicators
  updateSpeakingIndicators() {
    // Add/remove 'speaking' class on player markers in HUD
  },

  toggleMute() { state.voiceChat.muted = !state.voiceChat.muted; },
  togglePTT() { state.voiceChat.pushToTalk = !state.voiceChat.pushToTalk; },

  renderVoicePanel() {
    // Small panel in mission HUD: mute toggle, PTT toggle, volume sliders per peer
  }
};
```

### UI Requirements
- Voice panel in mission HUD (collapsible)
- Speaking indicator: pulsing green border on agent markers
- Mute icon overlay on muted players
- Settings: PTT key bind, input sensitivity slider

---

## Task 5 — Cosmetic Shop

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design
A `CosmeticShop` module for browsing and purchasing cosmetic items. Uses premium currency (Credits) + free currency (Tokens from missions). Items: trails, skins, emotes, map themes, ping effects, kill feed badges. No gameplay advantage.

### Catalog Expansion
```js
const shopCatalog = {
  // Trails (existing + new)
  trail_phoenix: { name: 'Phoenix Trail', icon: '✨', type: 'trail', costCredits: 200, color: '#ff6b35' },
  trail_void:    { name: 'Void Trail',    icon: '✨', type: 'trail', costCredits: 300, color: '#6c5ce7' },
  // Skins (existing + new)
  skin_cyber:    { name: 'Cyber Agent',   icon: '🤖', type: 'skin',  costCredits: 500 },
  skin_ghost:    { name: 'Ghost Agent',   icon: '👻', type: 'skin',  costCredits: 600 },
  // Emotes (new category)
  emote_salute:  { name: 'Salute',        icon: '🫡', type: 'emote', costCredits: 100 },
  emote_laugh:   { name: 'Laugh',         icon: '😂', type: 'emote', costCredits: 100 },
  // Map themes (new)
  theme_neon:    { name: 'Neon City',     icon: '🌃', type: 'theme', costCredits: 400 },
  // Ping effects (new)
  ping_pulse:    { name: 'Pulse Ping',    icon: '💓', type: 'ping',  costCredits: 150 },
};
```

### State Additions
```js
inventory: {}, // itemKey -> { acquiredAt, equipped }
credits: 0,    // premium currency
tokens: 0,     // free currency from missions
shopRotation: [], // daily rotation of 6 items
shopRotationDate: '',
```

### JS Implementation
```js
const CosmeticShop = {
  DAILY_ROTATION_SIZE: 6,
  ROTATION_HOUR: 0, // midnight UTC

  init() {
    this._loadInventory();
    this._generateDailyRotation();
  },

  purchase(itemKey) {
    const item = shopCatalog[itemKey];
    if (!item || state.inventory[itemKey]) return false;
    const currency = item.costTokens ? 'tokens' : 'credits';
    const cost = item.costTokens || item.costCredits || 0;
    if (state[currency] < cost) return false;
    state[currency] -= cost;
    state.inventory[itemKey] = { acquiredAt: Date.now(), equipped: false };
    this._saveInventory();
    ScreenJuice.addKillFeed(`Acquired: ${item.name}`, '#ffd965');
    return true;
  },

  equip(itemKey) {
    const item = shopCatalog[itemKey];
    if (!item || !state.inventory[itemKey]) return;
    // Unequip same-type items
    Object.entries(state.inventory).forEach(([k, v]) => {
      if (shopCatalog[k]?.type === item.type) v.equipped = false;
    });
    state.inventory[itemKey].equipped = true;
    // Apply to selectedCosmetics
    if (item.type === 'trail') state.selectedCosmetics[state.localAgentId].trail = itemKey;
    if (item.type === 'skin') state.selectedCosmetics[state.localAgentId].skin = itemKey;
    this._saveInventory();
  },

  _generateDailyRotation() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.shopRotationDate === today) return;
    // Deterministic random based on date string
    const seed = this._hashString(today);
    const items = Object.keys(shopCatalog);
    state.shopRotation = this._shuffleWithSeed(items, seed).slice(0, this.DAILY_ROTATION_SIZE);
    state.shopRotationDate = today;
  },

  renderShop() { /* DOM builder with item cards, cost, buy/own badges */ },
  renderInventory() { /* equipped items + unequip */ },

  _loadInventory() { /* localStorage slv2_inventory */ },
  _saveInventory() { /* localStorage */ },
  _hashString(s) { /* simple string hash for seed */ },
  _shuffleWithSeed(arr, seed) { /* Fisher-Yates with seeded RNG */ }
};
```

### UI Requirements
- New screen: `shopScreen` (HTML)
- Currency display: 💎 Credits + 🪙 Tokens in header
- Item cards: icon, name, cost, rarity border color, "Own" / "Buy" / "Equip" buttons
- Tabs: Daily Deals | Trails | Skins | Emotes | Themes | Inventory

---

## Task 6 — Battle Pass System

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~350-450

### Design
A `BattlePass` module with seasonal progression (8 weeks). 100 tiers. Free track + Premium track. XP from missions advances tiers. Rewards: cosmetics, credits, tokens, emotes, titles. Season timer visible.

### State Additions
```js
battlePass: {
  season: 1,
  seasonName: 'Signal Surge',
  seasonEnd: 0, // timestamp
  tier: 1,      // current tier 1-100
  xp: 0,        // XP within current tier
  premium: false,
  claimed: [],  // tier numbers claimed
},
```

### Reward Table (excerpt)
```js
const battlePassRewards = {
  // tier -> { free: itemKey|null, premium: itemKey|null }
  1:  { free: 'trail_phoenix', premium: 'skin_cyber' },
  5:  { free: 'emote_salute',  premium: null },
  10: { free: null,            premium: 'credits_200' },
  // ... up to 100
  100: { free: 'title_veteran', premium: 'skin_legendary' },
};
```

### JS Implementation
```js
const BattlePass = {
  TIERS: 100,
  XP_PER_TIER: 1000,
  SEASON_WEEKS: 8,

  init() {
    this._loadProgress();
    this._checkSeasonReset();
  },

  addXP(amount) {
    let bp = state.battlePass;
    bp.xp += amount;
    while (bp.xp >= this.XP_PER_TIER && bp.tier < this.TIERS) {
      bp.xp -= this.XP_PER_TIER;
      bp.tier++;
      ScreenJuice.addKillFeed(`Battle Pass Tier ${bp.tier} reached!`, '#ffd965');
    }
    this._saveProgress();
  },

  claim(tier) {
    if (tier > state.battlePass.tier) return false;
    if (state.battlePass.claimed.includes(tier)) return false;
    const reward = battlePassRewards[tier];
    if (!reward) return false;
    const track = state.battlePass.premium ? 'premium' : 'free';
    const item = reward[track] || reward.free;
    if (item) {
      if (item.startsWith('credits_')) state.credits += parseInt(item.split('_')[1]);
      else if (item.startsWith('tokens_')) state.tokens += parseInt(item.split('_')[1]);
      else state.inventory[item] = { acquiredAt: Date.now(), equipped: false };
    }
    state.battlePass.claimed.push(tier);
    this._saveProgress();
    return true;
  },

  upgradeToPremium() {
    // In real app: payment integration
    state.battlePass.premium = true;
    ScreenJuice.addKillFeed('Battle Pass Premium activated!', '#ffd965');
    this._saveProgress();
  },

  render() {
    // Vertical tier list with free/premium tracks side by side
    // Current tier highlighted
    // Claim buttons for unclaimed reached tiers
    // Season countdown timer
  },

  _loadProgress() { /* localStorage slv2_battlepass */ },
  _saveProgress() { /* localStorage */ },
  _checkSeasonReset() {
    if (Date.now() > state.battlePass.seasonEnd) {
      // Reset for new season
      state.battlePass.season++;
      state.battlePass.tier = 1;
      state.battlePass.xp = 0;
      state.battlePass.claimed = [];
      state.battlePass.premium = false;
      // Set new season end
      state.battlePass.seasonEnd = Date.now() + this.SEASON_WEEKS * 7 * 24 * 60 * 60 * 1000;
    }
  }
};
```

### UI Requirements
- New screen: `battlePassScreen` (HTML)
- Two-column layout: Free track | Premium track
- Tier nodes connected by progress line
- Current tier pulsing, claimed tiers checkmarked
- Season countdown in header
- "Upgrade to Premium" button (placeholder for payment)

---

## Task 7 — Premium Currency (Credits)

**Effort:** Small | **Impact:** 4/5 | **Lines:** ~150-200

### Design
A `CurrencySystem` module managing two currencies: Credits (premium, buy with real money) and Tokens (earned in-game). Credits used for shop purchases and Battle Pass premium. Tokens earned from missions, daily missions, and achievements.

### State Additions
```js
credits: 0,  // premium
_tokens: 0,  // earned (use getter/setter to sync)
```

### JS Implementation
```js
const CurrencySystem = {
  // Conversion rates (display only)
  TOKENS_PER_MISSION_XP: 0.1, // 10 XP = 1 token
  CREDIT_PACKS: [
    { amount: 500,  price: '$4.99',  bonus: 0 },
    { amount: 1100, price: '$9.99',  bonus: 100 },
    { amount: 2500, price: '$19.99', bonus: 500 },
    { amount: 6500, price: '$49.99', bonus: 2000 },
  ],

  init() { this._load(); },

  earnTokens(amount, reason) {
    state.tokens = (state.tokens || 0) + amount;
    this._save();
    ScreenJuice.addKillFeed(`+${amount} 🪙 ${reason}`, '#a0aec0');
  },

  earnCredits(amount, reason) {
    state.credits = (state.credits || 0) + amount;
    this._save();
    ScreenJuice.addKillFeed(`+${amount} 💎 ${reason}`, '#ffd965');
  },

  spend(currency, amount) {
    if ((state[currency] || 0) < amount) return false;
    state[currency] -= amount;
    this._save();
    return true;
  },

  // Called at mission end
  onMissionEnd(xpEarned, score) {
    const tokens = Math.floor(xpEarned * this.TOKENS_PER_MISSION_XP);
    this.earnTokens(tokens, 'Mission Complete');
    // Small chance of credit drop from high score
    if (score > 80 && Math.random() < 0.1) {
      this.earnCredits(10, 'High Score Bonus');
    }
  },

  renderCurrencyBar() {
    // Small bar in lobby/header: 🪙 X  |  💎 Y
  },

  renderBuyCredits() {
    // Credit pack selection UI (placeholder)
  },

  _load() {
    try {
      const saved = JSON.parse(localStorage.getItem('slv2_currency') || '{}');
      state.credits = saved.credits || 0;
      state.tokens = saved.tokens || 0;
    } catch(e) {}
  },
  _save() {
    localStorage.setItem('slv2_currency', JSON.stringify({ credits: state.credits, tokens: state.tokens }));
  }
};
```

### UI Requirements
- Currency bar in lobby header (persistent)
- "Buy Credits" modal with pack options (UI placeholder, no real payment)
- Earned currency fly-in animation on mission results

---

## Task 8 — WebGL Radar Renderer

**Effort:** Large | **Impact:** 5/5 | **Lines:** ~400-500

### Design
A `WebGLRadar` module that replaces the Canvas 2D radar with WebGL for better performance. Handles 1000+ blips at 60fps. Uses instanced rendering for blips. Falls back to Canvas 2D if WebGL unavailable.

### Implementation
```js
const WebGLRadar = {
  canvas: null,
  gl: null,
  program: null,
  buffers: {},
  fallback: false,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return false;
    this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!this.gl) { this.fallback = true; return false; }
    this._initShaders();
    this._initBuffers();
    this._resize();
    return true;
  },

  _initShaders() {
    // Vertex shader: position + color attributes, uniform for transform
    // Fragment shader: simple circle SDF for round blips
    const vs = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      attribute float a_size;
      uniform vec2 u_resolution;
      uniform vec2 u_offset;
      uniform float u_scale;
      varying vec3 v_color;
      void main() {
        vec2 pos = (a_position - u_offset) * u_scale;
        pos = (pos / u_resolution) * 2.0 - 1.0;
        pos.y = -pos.y;
        gl_Position = vec4(pos, 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;
    const fs = `
      precision mediump float;
      varying vec3 v_color;
      void main() {
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
        gl_FragColor = vec4(v_color, alpha);
      }
    `;
    // Compile, link, use program
  },

  _initBuffers() {
    // Create instanced arrays for blip positions, colors, sizes
    // Dynamic buffer updates each frame
  },

  render(blips) {
    if (this.fallback) return RadarModule.render(blips); // fallback
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.04, 0.06, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Upload blip data to buffers
    // DrawArrays with POINTS primitive
    // Batch by color to minimize state changes
  },

  _resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  },

  destroy() {
    if (this.gl) { /* cleanup buffers, program */ }
  }
};
```

### Integration Points
- Replace `RadarModule._drawBlips()` with WebGL path when available
- Keep Canvas 2D for scan lines, rings, and text overlays (hybrid approach)
- Feature-detect: `if (WebGLRadar.init('radarCanvas')) RadarModule.useWebGL = true;`

---

## Task 9 — Asset Lazy-Loading & Memory Pool

**Effort:** Medium | **Impact:** 5/5 | **Lines:** ~250-300

### Design
An `AssetLoader` module that defers loading of non-critical assets (map tiles, sound sprites, cosmetic previews) until needed. A `MemoryPool` for reusing DOM elements, canvas contexts, and particle arrays to reduce GC pressure.

### State Additions
```js
assets: {
  loaded: new Set(),
  loading: new Map(), // url -> Promise
  cache: new Map(),   // url -> Blob|Image|AudioBuffer
},
memoryPool: {
  domElements: [],    // recycled divs/spans
  particles: [],      // pre-allocated particle objects
  markers: [],        // recycled Leaflet marker instances
  maxPoolSize: 200,
},
```

### JS Implementation
```js
const AssetLoader = {
  async loadImage(url) {
    if (this._cache.has(url)) return this._cache.get(url);
    if (this._loading.has(url)) return this._loading.get(url);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this._cache.set(url, img); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
    this._loading.set(url, promise);
    return promise;
  },

  async loadJSON(url) {
    if (this._cache.has(url)) return this._cache.get(url);
    const res = await fetch(url);
    const data = await res.json();
    this._cache.set(url, data);
    return data;
  },

  // Lazy-load on viewport intersection
  observeLazy(elements, callback) {
    if (!('IntersectionObserver' in window)) {
      elements.forEach(callback);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { callback(e.target); obs.unobserve(e.target); } });
    }, { rootMargin: '200px' });
    elements.forEach(el => obs.observe(el));
  },

  // Memory pressure handler
  onMemoryPressure() {
    this._cache.clear();
    MemoryPool.clear();
    console.warn('[AssetLoader] Memory pressure — cleared caches');
  },

  _cache: new Map(),
  _loading: new Map(),
};

const MemoryPool = {
  pools: { div: [], span: [], particle: [], marker: [] },

  acquire(type) {
    const pool = this.pools[type];
    if (pool && pool.length > 0) return pool.pop();
    // Create new
    if (type === 'div') return document.createElement('div');
    if (type === 'span') return document.createElement('span');
    if (type === 'particle') return { x:0, y:0, vx:0, vy:0, life:0, maxLife:0, size:0, color:'', alpha:0 };
    return null;
  },

  release(type, obj) {
    const pool = this.pools[type];
    if (!pool) return;
    if (pool.length >= 200) return; // max pool size
    // Reset object state
    if (type === 'div' || type === 'span') { obj.innerHTML = ''; obj.style.cssText = ''; }
    pool.push(obj);
  },

  clear() {
    Object.keys(this.pools).forEach(k => this.pools[k] = []);
  },

  // Pre-warm pool on splash screen
  prewarm(counts = { div: 50, span: 50, particle: 100 }) {
    Object.entries(counts).forEach(([type, n]) => {
      for (let i = 0; i < n; i++) {
        const obj = this.acquire(type);
        if (obj) this.release(type, obj);
      }
    });
  }
};
```

### Integration Points
- Replace `document.createElement` in hot paths (kill feed, damage numbers, chat) with `MemoryPool.acquire/release`
- Lazy-load cosmetic preview images in shop when scrolling into view
- Pre-warm memory pool during splash screen
- Listen for `pagehide` / `freeze` events to release pools

---

## Task 10 — Mobile Battery Optimization v2

**Effort:** Medium | **Impact:** 4/5 | **Lines:** ~200-250

### Design
Extends existing `BatteryAwareGPS` with game-loop-level optimizations: adaptive frame rate, reduced particle counts, simplified radar rendering, and thermal throttling detection. Adds a "Power Saver" game mode that trades visuals for battery life.

### State Additions
```js
performanceProfile: 'balanced', // 'performance' | 'balanced' | 'powersave'
thermalState: 'nominal',        // 'nominal' | 'fair' | 'serious' | 'critical'
frameSkip: 0,                   // 0 = every frame, 1 = every 2nd, 2 = every 3rd
lastFrameTime: 0,
```

### JS Implementation
```js
const PerformanceProfile = {
  PROFILES: {
    performance: { fps: 60, particles: 1.0, radarDetail: 'full',   shadows: true,  effects: true,  gpsInterval: 3000 },
    balanced:    { fps: 30, particles: 0.6, radarDetail: 'medium', shadows: false, effects: true,  gpsInterval: 5000 },
    powersave:   { fps: 20, particles: 0.3, radarDetail: 'low',    shadows: false, effects: false, gpsInterval: 10000 },
  },

  init() {
    this._detectDeviceClass();
    this._setupThermalDetection();
    this._applyProfile(state.performanceProfile);
  },

  _detectDeviceClass() {
    // Heuristic: low-end if memory < 4GB or cores <= 4
    const mem = navigator.deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;
    if (mem <= 4 && cores <= 4) {
      state.performanceProfile = 'balanced';
    }
    // Check for low-power mode (iOS)
    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        if (!b.charging && b.level <= 0.15) {
          this.setProfile('powersave');
        }
      });
    }
  },

  _setupThermalDetection() {
    // Use frame time as thermal proxy
    let slowFrames = 0;
    const check = (frameTime) => {
      if (frameTime > 33) slowFrames++; // >33ms = <30fps
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 30) {
        state.thermalState = 'serious';
        this._autoThrottle();
        slowFrames = 0;
      }
    };
    // Hook into PerfMonitor
    const origTick = PerfMonitor.tick;
    PerfMonitor.tick = (ts) => {
      if (state.lastFrameTime) check(ts - state.lastFrameTime);
      state.lastFrameTime = ts;
      origTick.call(PerfMonitor, ts);
    };
  },

  setProfile(name) {
    state.performanceProfile = name;
    this._applyProfile(name);
    BatteryAwareGPS.onGpsStart(); // restart GPS with new interval
    addChat('System', `Performance: ${name} mode`);
  },

  _applyProfile(name) {
    const cfg = this.PROFILES[name];
    if (!cfg) return;
    // Apply particle multiplier
    ParticleSystem._multiplier = cfg.particles;
    // Apply radar detail
    RadarModule.detailLevel = cfg.radarDetail;
    // Apply frame skip
    state.frameSkip = Math.max(0, Math.round(60 / cfg.fps) - 1);
    // Apply GPS interval
    BatteryAwareGPS.INTERVAL_NORMAL = cfg.gpsInterval;
  },

  _autoThrottle() {
    const profiles = ['performance', 'balanced', 'powersave'];
    const idx = profiles.indexOf(state.performanceProfile);
    if (idx < profiles.length - 1) {
      this.setProfile(profiles[idx + 1]);
      ScreenJuice.addKillFeed('Thermal throttling — reduced visuals', '#ff9800');
    }
  },

  // Reduce background tab load
  onVisibilityChange() {
    if (document.hidden) {
      // Pause non-essential loops
      ParticleSystem.running = false;
      if (RadarModule._animationId) cancelAnimationFrame(RadarModule._animationId);
    } else {
      ParticleSystem.running = true;
      ParticleSystem._loop();
      RadarModule._startLoop();
    }
  },

  renderProfileSelector() {
    // Small toggle in settings: Performance | Balanced | Power Saver
  }
};
```

### Integration Points
- Call `PerformanceProfile.init()` in `init()` after `PerfMonitor.init()`
- Add `document.addEventListener('visibilitychange', ...)` in `init()`
- Wire profile selector into Settings menu
- Reduce `ParticleSystem.emitRole()` count based on `ParticleSystem._multiplier`
- Simplify radar ring count in `RadarModule` based on `detailLevel`

---

## Files to Modify

| Feature | Primary File | Secondary Files |
|---------|-------------|-----------------|
| Clans/Guilds | game-v2.js, server.js | index.html, styles-v2.css |
| Leaderboards | game-v2.js, server.js | index.html, styles-v2.css |
| Tournaments | game-v2.js, server.js | index.html, styles-v2.css |
| Voice Chat | game-v2.js, server.js | index.html, styles-v2.css |
| Cosmetic Shop | game-v2.js | index.html, styles-v2.css |
| Battle Pass | game-v2.js | index.html, styles-v2.css |
| Premium Currency | game-v2.js | index.html |
| WebGL Radar | game-v2.js | — |
| Asset Lazy-Loading | game-v2.js | — |
| Battery Optimization v2 | game-v2.js | — |

---

## Execution Order

1. **Premium Currency** (Task 7) — Foundation for shop and battle pass
2. **Cosmetic Shop** (Task 5) — Uses currency system
3. **Battle Pass** (Task 6) — Uses currency + shop infrastructure
4. **Clans/Guilds** (Task 1) — Largest social feature, independent
5. **Leaderboards** (Task 2) — Builds on clan + XP data
6. **Tournaments** (Task 3) — Builds on clans + leaderboards
7. **Voice Chat** (Task 4) — Complex, do after other social features
8. **Asset Lazy-Loading** (Task 9) — Performance foundation
9. **WebGL Radar** (Task 8) — Biggest rendering upgrade
10. **Battery Optimization v2** (Task 10) — Final polish, integrates with all above

After each task: `node --check game-v2.js` → `git add -A && git commit -m "feat: [feature name]"`

---

## Technical Constraints

- All new code must pass `node --check game-v2.js`
- Each feature has a 500-line budget (larger features allowed for Phase 8)
- Must work in single-file arch (no breaking existing)
- WebGL must fallback gracefully to Canvas 2D
- Voice chat must be opt-in (mic permission required)
- All monetization features are UI-ready only (no real payment processing)
- Mobile battery optimizations must not break desktop experience
