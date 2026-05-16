/**
 * Signal Lost v2 — Single-file game engine
 * Lobby → Setup → Mission → Results
 * Leaflet + CartoDB dark tiles + real GPS
 */

'use strict';

/* ========================== DATA ========================== */

const cities = {
  oslo:      { name: "Oslo",      country: "norway",    center: [59.9139, 10.7522] },
  bergen:    { name: "Bergen",    country: "norway",    center: [60.3913, 5.3221] },
  trondheim: { name: "Trondheim", country: "norway",    center: [63.4305, 10.3951] },
  london:    { name: "London",    country: "uk",        center: [51.5072, -0.1276] },
  newyork:   { name: "New York",  country: "usa",       center: [40.7128, -74.006] },
  paris:     { name: "Paris",     country: "france",    center: [48.8566, 2.3522] },
  tokyo:     { name: "Tokyo",     country: "japan",     center: [35.6762, 139.6503] },
  sydney:    { name: "Sydney",    country: "australia", center: [-33.8688, 151.2093] }
};
const countries = {
  norway: "Norway", uk: "United Kingdom", usa: "United States",
  france: "France", japan: "Japan", australia: "Australia"
};

const roleCatalog = {
  Drone: ["Scan routes", "Mark safe corridor", "Ping AI scout"],
  Mechanic: ["Boost GPS mesh", "Repair relay", "Stabilize signal"],
  Medic: ["Find nearest agent", "Call regroup", "Protect low-signal players"],
  Decoder: ["Decode cipher", "Reveal clue", "Validate intercepted signal"],
  Navigator: ["Set waypoint", "Measure proximity", "Guide squad"],
  Courier: ["Carry key shard", "Deliver objective", "Trigger checkpoint"],
  "Mission Control": ["Track all agents", "Deploy objectives", "Monitor signal strength"]
};

const moduleCatalog = [
  ["ciphers",   "Cipher Tasks",  "Decode encrypted packets to reveal location data.", true],
  ["treasure",  "Treasure Hunt", "Recover GPS shards and physical clue rewards.", true],
  ["waypoints", "Waypoints",     "Route teams through relays before extraction.", true],
  ["voice",     "Voice Relay",   "Read new comms aloud when the browser allows it.", false]
];

const missionPacks = {
  ciphers:   [["Decode relay A17", "Cipher", 25, "Break the first packet and reveal the signal route."],
              ["Bypass false beacon", "Puzzle", 22, "Compare beacon timing and reject the decoy pulse."]],
  treasure:  [["Recover GPS shard", "Treasure", 18, "Find the dropped shard before AI Watch triangulates it."],
              ["Claim cache marker", "Treasure", 20, "Secure the field cache and carry its key phrase forward."]],
  waypoints: [["Restore north uplink", "Waypoint", 30, "Stand inside the relay zone until the uplink stabilizes."],
              ["Trace safe corridor", "Waypoint", 32, "Move through the corridor to open the extraction vector."]],
  extraction:[["Extract final signal", "Extraction", 35, "Bring the decoded route, shard, and relay lock to final extraction."]]
};

const roleColors = {
  Drone: '#58a6ff',
  Mechanic: '#f0883e',
  Medic: '#3fb950',
  Decoder: '#d2a8ff',
  Navigator: '#79c0ff',
  Courier: '#ffa657',
  'Mission Control': '#ffd965'
};

const roleEmojis = {
  Drone: '\u{1F6F8}',
  Mechanic: '\u{1F527}',
  Medic: '\u{1FA7A}',
  Decoder: '\u{1F3AF}',
  Navigator: '\u{1F9ED}',
  Courier: '\u{1F4E6}',
  'Mission Control': '\u{1F3AE}'
};

const customMarkerTypeBehaviors = {
  Clue:       { label: "Decode clue",      detail: "Reveals story text or a code word.",      radiusOffset: 0,  objective: true },
  Cache:      { label: "Recover cache",    detail: "Rewards signal and stamina.",             radiusOffset: 8,  objective: true },
  Waypoint:   { label: "Route checkpoint", detail: "Movement checkpoint.",                    radiusOffset: 12, objective: true },
  Danger:     { label: "Hazard zone",      detail: "Jams nearby agents.",                     radiusOffset: 20, objective: false },
  Extraction: { label: "Final extraction", detail: "High-priority objective.",                radiusOffset: 15, objective: true }
};

const themePalettes = {
  classic: "Classic Signal",
  sunset:  "Tangerine Static",
  signal:  "Signal Candy",
  night:   "Night Static"
};

const themePatternPalettes = {
  sunset: {
    base: "#fff2c4",
    colors: ["#e82663", "#ff4f69", "#ff8b1f", "#ffd14d", "#efeccf", "#f06a20"],
    line: "#fff6d8", speed: 0.58, glow: 0.64, drift: 0.46
  },
  signal: {
    base: "#ffe8b3",
    colors: ["#ff2d55", "#ff7a1a", "#ffc53d", "#fff0c7", "#00a9c7", "#f14170"],
    line: "#fff8df", speed: 0.62, glow: 0.7, drift: 0.5
  },
  night: {
    base: "#26151c",
    colors: ["#ff4f69", "#ff8b1f", "#ffd14d", "#682c84", "#006c71", "#efebcf"],
    line: "#ffd14d", speed: 0.48, glow: 0.72, drift: 0.36
  }
};

/* ========================== STATE ========================== */

const state = {
  screen: "splash",
  code: "AQUA-RADAR-42",
  isHost: false,
  localProfile: { name: "Morgan", callsign: "Raven" },

  city: "oslo",
  country: "norway",
  duration: 60,
  maxPlayers: 6,
  isPublic: false,
  enabledModules: {},
  customMarkers: [],

  status: "Lobby",
  remaining: 3600,
  agents: [],
  objectives: [],
  threats: [],
  localAgentId: "",
  chat: [
    ["Mission Control", "Create a game, join a role, then start the mission."],
    ["System", "GPS ready. Waiting for mission start."]
  ],

  scores: { North: 0, South: 0 },

  cooldowns: {},
  extracting: false,
  extractCountdown: 0,
  extractionIntervalId: null,

  themePalette: "classic",
  mapZoom: 1,
  panelsOpen: true,
  joinCode: "",
  joinName: "",
  joinCallsign: "",

  // 4.2 Lobby Chat
  lobbyChat: [], // { sender, text, timestamp }
  lobbyChatUnread: 0,
  lobbyChatLastRead: 0,

  playerHeading: 0, // compass heading in degrees (0 = North, clockwise)

  // 3.1 Ping System
  pings: [], // { id, lat, lng, dist, createdAt, sender }

  // 3.2 Custom Waypoints
  waypoints: [], // { id, lat, lng, title, color }

  // 3.3 Stealth Mode
  stealth: false, // crouch/sneak active
  stealthCooldowns: {}, // per-agent stealth state tracking

  // 3.5 Post-Mission Replay
  playerPath: [], // array of {lat, lng, timestamp}
  missionStartTime: 0,
  missionEndTime: 0,

  // 5.3 Battery-Aware GPS
  batteryLevel: null,        // 0.0 - 1.0
  batteryCharging: null,     // boolean
  batterySaver: false,        // user override

  // Custom location (click-to-set on setup map)
  customLocation: null,       // { lat, lng, label } or null
  locMapMode: false,          // true = clicking map sets location instead of marker coords
};

let timerId = null;
let simId = null;
let gpsWatchId = null;
let replayMap = null; // separate Leaflet instance for replay screen

/* ========================== MULTIPLAYER NETWORK (Socket.IO) ========================== */

const SignalNet = {
  socket: null,
  connected: false,
  gameCode: null,
  isHost: false,
  _pendingJoin: false,

  init() {
    if (this.socket) return;
    try {
      this.socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    } catch (e) {
      console.warn('[SignalNet] Socket.IO not available — running offline');
      return;
    }

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[SignalNet] Connected —', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[SignalNet] Disconnected');
    });

    this.socket.on('game-created', ({ code, players, settings }) => {
      state.code = code;
      this.gameCode = code;
      this.isHost = true;
      if (this._pendingJoin) {
        this._pendingJoin = false;
        state.isHost = true;
        state.status = 'Lobby';
        state.remaining = state.duration * 60;
        state.lobbyChat = [{ sender: 'System', text: `Mission ${code} created. Waiting for squad…`, timestamp: Date.now() }];
        LobbyChat.render();
        populateSetup();
        setScreen('setup');
      }
    });

    this.socket.on('game-joined', ({ code, players, settings }) => {
      state.code = code;
      this.gameCode = code;
      if (this._pendingJoin) {
        this._pendingJoin = false;
        state.code = code;
        joinAgentFromLobby();
        populateRoles();
        setScreen('roles');
        state.lobbyChat = [{ sender: 'System', text: `Linked to mission ${code}. Choose your role.`, timestamp: Date.now() }];
        LobbyChat.render();
      }
    });

    this.socket.on('players-update', (players) => {
      state.agents = Object.values(players).filter(p => !p.bot).map(p => ({
        id: p.id, name: p.name, callsign: p.callsign || '',
        role: p.role || 'Unknown', team: p.team || 'North',
        lat: p.lat || 59.9139, lng: p.lng || 10.7522,
        signal: p.signal || 78, stamina: p.stamina || 85,
        bot: false, lastSeen: Date.now()
      }));
      // Also add bot agents from host's game
      const bots = Object.values(players).filter(p => p.bot);
      bots.forEach(b => {
        if (!state.agents.find(a => a.id === b.id)) {
          state.agents.push({
            id: b.id, name: b.name, callsign: b.callsign || '',
            role: b.role, team: b.team, bot: true,
            lat: b.lat || 59.9139, lng: b.lng || 10.7522,
            signal: b.signal || 70, stamina: b.stamina || 80,
            lastSeen: Date.now()
          });
        }
      });
    });

    this.socket.on('chat', ({ sender, callsign, role, text }) => {
      addChat(sender, text);
    });

    this.socket.on('mission-launched', ({ players, duration }) => {
      state.remaining = duration * 60;
      state.status = 'Live';
      state.agents = Object.values(players).map(p => ({
        id: p.id, name: p.name, callsign: p.callsign || '',
        role: p.role || 'Unknown', team: p.team || 'North',
        lat: p.lat || 59.9139, lng: p.lng || 10.7522,
        signal: p.signal || 78, stamina: p.stamina || 85,
        bot: p.bot || false, lastSeen: Date.now()
      }));
      const localPlayer = Object.values(players).find(p => p.id === this.socket.id);
      if (localPlayer) {
        state.localRole = localPlayer.role;
        state.localAgentId = localPlayer.id;
      }
      if (!state.objectives?.length) {
        generateObjectives();
        generateThreats();
      }
      setScreen('mission');
      startMissionClock();
    });

    this.socket.on('error-msg', (msg) => {
      addChat('System', msg);
      console.warn('[SignalNet]', msg);
    });
  },

  hostGame(name, callsign) {
    this.init();
    this._pendingJoin = true;
    this.socket.emit('host-game', { name, callsign });
  },

  joinGame(code, name, callsign) {
    this.init();
    this._pendingJoin = true;
    this.socket.emit('join-game', { code, profile: { name, callsign } });
  },

  sendChat(text) {
    if (!this.connected || !this.gameCode) return;
    this.socket.emit('chat-message', text);
  },

  updatePosition(lat, lng, heading) {
    if (!this.connected) return;
    this.socket.emit('update-position', { lat, lng, heading });
  },

  launchMission() {
    if (!this.connected || !this.isHost) return;
    this.socket.emit('launch-mission');
  }
};

/* ========================== LOBBY CHAT MODULE (4.2) ========================== */

const LobbyChat = {
  MAX_MESSAGES: 50,
  MAX_DISPLAY: 12,

  init() {
    const form = document.getElementById('lobbyChatForm');
    const input = document.getElementById('lobbyChatInput');
    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const sender = `${state.localProfile.name} (${state.localProfile.callsign})`;
      this.addMessage(sender, text);
      input.value = '';
      input.focus();
      // Play subtle send sound
      SoundFX.play(660, 0.06, 'sine', 0.08);
    });

    // Mark as read when user interacts with chat input
    input.addEventListener('focus', () => this.markRead());
  },

  addMessage(sender, text) {
    const msg = {
      sender: escapeHtml(sender || 'Unknown'),
      text: escapeHtml(text || ''),
      timestamp: Date.now()
    };
    state.lobbyChat.push(msg);
    if (state.lobbyChat.length > this.MAX_MESSAGES) {
      state.lobbyChat = state.lobbyChat.slice(-this.MAX_MESSAGES);
    }
    // Increment unread if not currently focused on chat input
    const input = document.getElementById('lobbyChatInput');
    if (document.activeElement !== input) {
      state.lobbyChatUnread++;
    }
    this.render();
    saveState();
  },

  addSystem(text) {
    this.addMessage('System', text);
  },

  markRead() {
    state.lobbyChatUnread = 0;
    state.lobbyChatLastRead = Date.now();
    this.renderBadge();
  },

  render() {
    const log = document.getElementById('lobbyChatLog');
    if (!log) return;

    const messages = state.lobbyChat.slice(-this.MAX_DISPLAY);
    if (!messages.length) {
      log.innerHTML = '<div class="lobby-chat-empty">No messages yet. Say hello to your squad.</div>';
    } else {
      log.innerHTML = messages.map(m => {
        const isSystem = m.sender === 'System';
        const timeStr = this.formatTime(m.timestamp);
        return `<p><span class="chat-sender ${isSystem ? 'system' : ''}">${m.sender}</span>${m.text}<span class="chat-time">${timeStr}</span></p>`;
      }).join('');
    }
    log.scrollTop = log.scrollHeight;
    this.renderBadge();
  },

  renderBadge() {
    const badge = document.getElementById('lobbyChatBadge');
    if (!badge) return;
    if (state.lobbyChatUnread > 0) {
      badge.textContent = Math.min(state.lobbyChatUnread, 99);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  formatTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },

  // Simulate incoming bot messages for atmosphere
  simulateBotMessage() {
    const botMessages = [
      ['Ada (ADA)', 'Link established. Standing by.'],
      ['Mika (MIKA)', 'Comms check — loud and clear.'],
      ['Rune (RUNE)', 'Ready when you are.'],
      ['Liv (LIV)', 'Signal strong on my end.'],
      ['Echo (ECHO)', 'Watching the perimeter.'],
      ['Kai (KAI)', 'All systems green.']
    ];
    const pick = botMessages[Math.floor(Math.random() * botMessages.length)];
    this.addMessage(pick[0], pick[1]);
  }
};

/* ========================== PING SYSTEM MODULE (3.1) ========================== */

const PingSystem = {
  PING_DURATION: 5000, // 5 seconds
  mapLayers: [], // array of { id, marker, circle, label }

  // Called when user clicks on the mission map
  placePing(lat, lng) {
    const m = MapModule.ensureMissionMap();
    if (!m || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const local = state.agents.find(a => a.id === state.localAgentId);
    const sender = local ? `${local.name} (${local.callsign})` : 'Unknown';
    const dist = local && Number.isFinite(local.lat) ? haversine(local, { lat, lng }) : null;

    const id = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const ping = { id, lat, lng, dist, createdAt: Date.now(), sender };
    state.pings.push(ping);

    this._renderOne(ping, m);
    this._addChat(ping, dist);
    this._playSound();

    // Auto-remove after 5s
    setTimeout(() => this.remove(id), this.PING_DURATION);
    return ping;
  },

  remove(id) {
    const idx = state.pings.findIndex(p => p.id === id);
    if (idx === -1) return;
    state.pings.splice(idx, 1);
    this._removeLayer(id);
  },

  _renderOne(ping, m) {
    // Purple pulsing ping marker
    const iconHtml = `<div class="sl-ping-marker"><div class="sl-ping-ring"></div><div class="sl-ping-dot"></div></div>`;
    const marker = L.marker([ping.lat, ping.lng], {
      icon: L.divIcon({ className: 'sl-map-icon', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] })
    }).addTo(m);

    const distStr = Number.isFinite(ping.dist) ? formatDistance(ping.dist) : '--';
    marker.bindPopup(`<div class="sl-popup"><strong style="color:#7c3aed">📍 Ping</strong><br>${escapeHtml(ping.sender)}<br><span class="sl-coords">${distStr} · ${ping.lat.toFixed(5)}, ${ping.lng.toFixed(5)}</span></div>`);

    // Distance label tooltip (always visible while ping is active)
    const labelHtml = `<div class="sl-ping-label">${distStr}</div>`;
    const label = L.marker([ping.lat, ping.lng], {
      icon: L.divIcon({ className: 'sl-map-icon', html: labelHtml, iconSize: [80, 20], iconAnchor: [40, 36] }),
      interactive: false,
      zIndexOffset: 500
    }).addTo(m);

    // Expanding ring circle
    const circle = L.circle([ping.lat, ping.lng], {
      color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.08, weight: 2, radius: 20, dashArray: '4,4', interactive: false
    }).addTo(m);

    // Animate circle expansion
    let ringRadius = 20;
    let ringDir = 1;
    circle._pingInterval = setInterval(() => {
      if (!circle._map) { clearInterval(circle._pingInterval); return; }
      ringRadius += 2 * ringDir;
      if (ringRadius > 60) { ringRadius = 20; }
      circle.setRadius(ringRadius);
      const fade = 1 - (ringRadius - 20) / 40;
      circle.setStyle({ opacity: Math.max(0.2, fade), fillOpacity: Math.max(0.02, fade * 0.08) });
    }, 80);

    this.mapLayers.push({ id: ping.id, marker, label, circle });
  },

  _removeLayer(id) {
    const idx = this.mapLayers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const layer = this.mapLayers[idx];
    const m = MapModule.ensureMissionMap();
    if (m) {
      if (layer.marker) { try { m.removeLayer(layer.marker); } catch(e) {} }
      if (layer.label) { try { m.removeLayer(layer.label); } catch(e) {} }
      if (layer.circle) {
        if (layer.circle._pingInterval) clearInterval(layer.circle._pingInterval);
        try { m.removeLayer(layer.circle); } catch(e) {}
      }
    }
    this.mapLayers.splice(idx, 1);
  },

  // Re-render all active pings (e.g. after map clear)
  renderOnMap() {
    const m = MapModule.ensureMissionMap();
    if (!m) return;
    // Remove expired pings from state first
    const now = Date.now();
    state.pings = state.pings.filter(p => now - p.createdAt < this.PING_DURATION);
    // Clear existing layers
    this.mapLayers.forEach(l => this._removeLayer(l.id));
    this.mapLayers = [];
    // Re-render
    state.pings.forEach(p => this._renderOne(p, m));
  },

  _addChat(ping, dist) {
    const distStr = Number.isFinite(dist) ? formatDistance(dist) : '--';
    addChat('Ping', `${ping.sender} pinged ${distStr} away.`);
  },

  _playSound() {
    SoundFX.play(880, 0.08, 'sine', 0.12);
    setTimeout(() => SoundFX.play(1100, 0.06, 'sine', 0.08), 120);
  }
};

/* ========================== BATTERY-AWARE GPS MODULE (5.3) ========================== */

const BatteryAwareGPS = {
  // Battery thresholds
  LOW_BATTERY: 0.20,        // 20% — reduce polling
  CRITICAL_BATTERY: 0.10,   // 10% — minimal polling

  // Polling intervals (ms)
  INTERVAL_NORMAL: 3000,    // 3s — standard watchPosition
  INTERVAL_LOW: 8000,       // 8s — low battery
  INTERVAL_CRITICAL: 15000, // 15s — critical battery

  batteryApi: null,
  currentInterval: null,
  fallbackIntervalId: null,

  init() {
    this._setupBatteryListener();
  },

  async _setupBatteryListener() {
    if ('getBattery' in navigator) {
      try {
        this.batteryApi = await navigator.getBattery();
        this._updateBatteryState();
        this.batteryApi.addEventListener('levelchange', () => this._updateBatteryState());
        this.batteryApi.addEventListener('chargingchange', () => this._updateBatteryState());
      } catch (e) {
        // Silent fail — battery API not available
        this.batteryApi = null;
      }
    }
  },

  _updateBatteryState() {
    if (!this.batteryApi) return;
    state.batteryLevel = this.batteryApi.level;
    state.batteryCharging = this.batteryApi.charging;
    this._applyAdaptivePolling();
    this._updateUI();
  },

  // Determine current polling interval based on battery + user override
  getInterval() {
    if (state.batterySaver) return this.INTERVAL_CRITICAL;
    if (state.batteryCharging) return this.INTERVAL_NORMAL;
    if (state.batteryLevel === null) return this.INTERVAL_NORMAL;
    if (state.batteryLevel <= this.CRITICAL_BATTERY) return this.INTERVAL_CRITICAL;
    if (state.batteryLevel <= this.LOW_BATTERY) return this.INTERVAL_LOW;
    return this.INTERVAL_NORMAL;
  },

  getModeLabel() {
    if (state.batterySaver) return 'Saver';
    if (state.batteryCharging) return 'Charging';
    if (state.batteryLevel === null) return 'Normal';
    if (state.batteryLevel <= this.CRITICAL_BATTERY) return 'Critical';
    if (state.batteryLevel <= this.LOW_BATTERY) return 'Low Battery';
    return 'Normal';
  },

  // Apply adaptive polling by restarting GPS with new interval
  _applyAdaptivePolling() {
    const newInterval = this.getInterval();
    if (newInterval === this.currentInterval) return;
    this.currentInterval = newInterval;

    // Only restart GPS if it's currently active
    const gpsData = MapModule.getGPSData();
    if (gpsData && gpsData.active) {
      MapModule.restartGPSWithInterval(newInterval);
    }
  },

  toggleSaver() {
    state.batterySaver = !state.batterySaver;
    this._applyAdaptivePolling();
    this._updateUI();
    saveState();
    // Feedback
    const label = state.batterySaver ? 'Battery saver ON — GPS throttled.' : 'Battery saver OFF — normal GPS.';
    addChat('System', label);
  },

  _updateUI() {
    const el = document.getElementById('batteryGpsStatus');
    if (!el) return;
    const level = state.batteryLevel !== null ? Math.round(state.batteryLevel * 100) : null;
    const charging = state.batteryCharging;
    const mode = this.getModeLabel();

    let icon = '🔋';
    let color = '#4caf50';
    if (charging) { icon = '⚡'; color = '#00bcd4'; }
    else if (level !== null && level <= 10) { icon = '🪫'; color = '#ef4444'; }
    else if (level !== null && level <= 20) { icon = '🔋'; color = '#ff9800'; }

    const pctText = level !== null ? `${level}%` : '--';
    el.innerHTML = `<span style="color:${color}">${icon}</span> ${pctText} · ${mode}`;
    el.style.color = color;

    // Update saver toggle button state
    const saverBtn = document.getElementById('toggleBatterySaver');
    if (saverBtn) {
      saverBtn.classList.toggle('saver-active', state.batterySaver);
      saverBtn.textContent = state.batterySaver ? 'Saver: ON' : 'Saver: OFF';
    }
  },

  // Called when GPS starts — ensures correct interval is applied
  onGpsStart() {
    this.currentInterval = this.getInterval();
  },

  // Called when GPS stops
  onGpsStop() {
    this.currentInterval = null;
  },

  // Periodic check (called from simulateWorld or timer) to adapt if battery changed
  tick() {
    if (this.batteryApi) {
      // Battery API events should handle this, but polling is a fallback
      const level = this.batteryApi.level;
      const charging = this.batteryApi.charging;
      if (level !== state.batteryLevel || charging !== state.batteryCharging) {
        state.batteryLevel = level;
        state.batteryCharging = charging;
        this._applyAdaptivePolling();
        this._updateUI();
      }
    }
  }
};

/* ========================== STEALTH MODE MODULE (3.3) ========================== */

const StealthMode = {
  // Visibility reduction: threats detect player at 50% normal range when stealth is on
  DETECT_RANGE_MULT: 0.5,
  // Movement speed multiplier when stealth is on (simulated via reduced bot jitter / GPS drift)
  SPEED_MULT: 0.5,
  // Stamina drain per tick while stealth is active (small cost)
  STAMINA_COST_PER_TICK: 0.3,

  toggle() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local) return;
    state.stealth = !state.stealth;
    this._applyStealthState(local);
    this._playSound();
    this._updateUI();
    this._addChat();
    saveState();
  },

  setActive(active) {
    if (state.stealth === active) return;
    state.stealth = active;
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (local) this._applyStealthState(local);
    this._updateUI();
    saveState();
  },

  _applyStealthState(local) {
    if (!local) return;
    // Visual indicator on player marker handled by renderMissionMap
    // Stamina cost applied in simulateWorld tick
    local._stealthSince = state.stealth ? Date.now() : null;
  },

  _playSound() {
    if (state.stealth) {
      SoundFX.play(440, 0.08, 'sine', 0.1);
      setTimeout(() => SoundFX.play(330, 0.1, 'sine', 0.08), 120);
    } else {
      SoundFX.play(330, 0.08, 'sine', 0.1);
      setTimeout(() => SoundFX.play(440, 0.1, 'sine', 0.08), 120);
    }
  },

  _addChat() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    const name = local ? `${local.name} (${local.callsign})` : 'You';
    if (state.stealth) {
      addChat('Stealth', `${name} entered stealth mode — detection range reduced.`);
    } else {
      addChat('Stealth', `${name} exited stealth mode — normal movement restored.`);
    }
  },

  _updateUI() {
    const btn = document.getElementById('toggleStealth');
    if (btn) {
      btn.classList.toggle('stealth-active', state.stealth);
      btn.title = state.stealth ? 'Exit Stealth' : 'Enter Stealth';
    }
    // Update body attribute for CSS styling
    document.body.dataset.stealth = state.stealth ? 'on' : 'off';
  },

  // Called every simulateWorld tick to apply stamina cost
  tick() {
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local || !state.stealth) return;
    local.stamina = clamp(local.stamina - this.STAMINA_COST_PER_TICK, 20, 100);
  },

  // Returns effective detection range for a threat against the local player
  getEffectiveDetectRange(threatRange) {
    return state.stealth ? threatRange * this.DETECT_RANGE_MULT : threatRange;
  },

  // Returns movement speed multiplier for the local player
  getSpeedMultiplier() {
    return state.stealth ? this.SPEED_MULT : 1.0;
  }
};

/* ========================== CUSTOM WAYPOINTS MODULE (3.2) ========================== */

const WaypointsModule = {
  mapLayers: [], // array of { id, marker, circle }

  colors: ['#7c3aed', '#00bcd4', '#4caf50', '#ff9800', '#e45b4d', '#ffd965'],

  add(lat, lng, title) {
    const m = MapModule.ensureMissionMap();
    if (!m || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const id = `wp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const color = this.colors[state.waypoints.length % this.colors.length];
    const label = (title || `Waypoint ${state.waypoints.length + 1}`).trim();
    const wp = { id, lat, lng, title: label, color };
    state.waypoints.push(wp);
    this._renderOne(wp, m);
    this._renderList();
    saveState();
    SoundFX.play(660, 0.1, 'sine', 0.1);
    return wp;
  },

  remove(id) {
    const idx = state.waypoints.findIndex(w => w.id === id);
    if (idx === -1) return;
    state.waypoints.splice(idx, 1);
    this._syncLayers();
    this._renderList();
    saveState();
  },

  clear() {
    if (!state.waypoints.length) return;
    state.waypoints = [];
    this._syncLayers();
    this._renderList();
    saveState();
  },

  updateTitle(id, newTitle) {
    const wp = state.waypoints.find(w => w.id === id);
    if (!wp) return;
    wp.title = (newTitle || wp.title).trim() || wp.title;
    this._syncLayers();
    this._renderList();
    saveState();
  },

  // Render all waypoints onto the mission map
  renderOnMap() {
    this._syncLayers();
  },

  _renderOne(wp, m) {
    const iconHtml = `<div style="width:26px;height:26px;background:${wp.color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;box-shadow:0 0 10px ${wp.color}80;">W</div>`;
    const marker = L.marker([wp.lat, wp.lng], {
      icon: L.divIcon({ className: 'sl-map-icon', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -13] })
    }).addTo(m);
    marker.bindPopup(`<div class="sl-popup"><strong>${escapeHtml(wp.title)}</strong><br><span class="sl-coords">${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}</span></div>`);
    const circle = L.circle([wp.lat, wp.lng], {
      color: wp.color, fillColor: wp.color, fillOpacity: 0.06, weight: 1, radius: 40
    }).addTo(m);
    this.mapLayers.push({ id: wp.id, marker, circle });
  },

  _syncLayers() {
    const m = MapModule.ensureMissionMap();
    // Remove old
    this.mapLayers.forEach(l => {
      if (l.marker) { try { m?.removeLayer(l.marker); } catch(e) {} }
      if (l.circle) { try { m?.removeLayer(l.circle); } catch(e) {} }
    });
    this.mapLayers = [];
    // Re-render current
    if (m) state.waypoints.forEach(wp => this._renderOne(wp, m));
  },

  _renderList() {
    const el = document.getElementById('waypointList');
    if (!el) return;
    if (!state.waypoints.length) {
      el.innerHTML = '<div class="waypoint-empty">No waypoints yet. Tap the map or use GPS panel to add one.</div>';
      return;
    }
    const local = state.agents.find(a => a.id === state.localAgentId);
    el.innerHTML = state.waypoints.map(wp => {
      const dist = local && Number.isFinite(local.lat) ? formatDistance(haversine(local, wp)) : '--';
      return `
        <div class="waypoint-item" data-wp-id="${wp.id}">
          <span class="waypoint-dot" style="background:${wp.color}"></span>
          <div class="waypoint-info">
            <strong>${escapeHtml(wp.title)}</strong>
            <small>${dist} · ${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</small>
          </div>
          <div class="waypoint-actions">
            <button class="compact-button" data-wp-focus="${wp.id}" title="Focus">🎯</button>
            <button class="compact-button danger-button" data-wp-remove="${wp.id}" title="Remove">×</button>
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('[data-wp-focus]').forEach(b => {
      b.addEventListener('click', () => {
        const wp = state.waypoints.find(w => w.id === b.dataset.wpFocus);
        if (wp) MapModule.setCenter(wp.lat, wp.lng, 16);
      });
    });
    el.querySelectorAll('[data-wp-remove]').forEach(b => {
      b.addEventListener('click', () => this.remove(b.dataset.wpRemove));
    });
  }
};

/* ========================== DOM HELPERS ========================== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

/* ========================== RADAR MODULE ========================== */

const RadarModule = {
  canvas: null,
  ctx: null,
  animationId: null,
  timeoutId: null,
  range: 500,
  open: true,
  fullscreen: true,
  filters: { objectives: true, agents: true, threats: true, pings: true, waypoints: true },

  // 5.4 Performance Profiling — visibility state
  isVisible: true,
  isTabVisible: true,
  observer: null,
  THROTTLE_MS: 33, // ~30fps

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this._initVisibility();
    this.enterFullscreen();
    this.startLoop();
  },

  _initVisibility() {
    // IntersectionObserver: throttle when canvas is not intersecting viewport
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
      }, { threshold: 0 });
      if (this.canvas) this.observer.observe(this.canvas);
    }
    // Page Visibility API: throttle when tab is hidden
    this._visHandler = () => {
      this.isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', this._visHandler);
  },

  _destroyVisibility() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    document.removeEventListener('visibilitychange', this._visHandler);
  },

  _shouldThrottle() {
    // Throttle when canvas not in viewport OR tab hidden OR radar closed
    return !this.isVisible || !this.isTabVisible || !this.open;
  },

  enterFullscreen() {
    this.fullscreen = true;
    const canvas = this.canvas;
    if (!canvas) return;
    canvas.classList.add('radar-fullscreen');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.range = 500;
  },

  exitFullscreen() {
    this.fullscreen = false;
    const canvas = this.canvas;
    if (!canvas) return;
    canvas.classList.remove('radar-fullscreen');
    canvas.width = 160;
    canvas.height = 160;
    this.range = 200;
  },

  toggleFullscreen() {
    if (this.fullscreen) this.exitFullscreen();
    else this.enterFullscreen();
  },

  startLoop() {
    if (this.animationId || this.timeoutId) return;
    const loop = () => {
      this.draw();
      if (this._shouldThrottle()) {
        // Throttled: use setTimeout for ~30fps
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          if (this.animationId !== null || this.open) {
            this.animationId = requestAnimationFrame(loop);
          }
        }, this.THROTTLE_MS);
      } else {
        // Full speed: use requestAnimationFrame
        this.animationId = requestAnimationFrame(loop);
      }
    };
    this.animationId = requestAnimationFrame(loop);
  },

  stopLoop() {
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
  },

  draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2, radius = Math.min(cx, cy) - 6;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background circle
    ctx.fillStyle = 'rgba(11,15,20,0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Range rings (4 rings)
    for (let r = 1; r <= 4; r++) {
      ctx.strokeStyle = r === 4 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, (radius / 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Scan line (rotates clockwise)
    const angle = (Date.now() / 2000) % (Math.PI * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Scan wedge gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(0,188,212,0.15)');
    gradient.addColorStop(1, 'rgba(0,188,212,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -0.3, 0.3);
    ctx.closePath();
    ctx.fill();
    // Scan line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 1.2, 0);
    ctx.strokeStyle = 'rgba(0,188,212,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Get player position
    const player = state.agents.find(a => a.id === state.localAgentId);
    if (!player || !Number.isFinite(player.lat) || !Number.isFinite(player.lng)) {
      // No signal text
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO SIGNAL', cx, cy);
      return;
    }

    // Player dot at center
    ctx.fillStyle = '#00bcd4';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00bcd460';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Helper: convert world lat/lng to radar position
    const worldToRadar = (lat, lng) => {
      const dx = (lng - player.lng) * 111320 * Math.cos(player.lat * Math.PI / 180);
      const dy = (lat - player.lat) * 111320;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > this.range) return null;
      const scale = radius / this.range;
      return { x: cx + dx * scale, y: cy - dy * scale };
    };

    // Draw beacons (orange dots)
    if (this.filters.objectives !== false) {
    (state.objectives || []).filter(o => o.type !== 'Extraction').forEach(o => {
      const pos = worldToRadar(o.lat, o.lng);
      if (!pos) return;
      const color = o.found ? '#4caf50' : '#ff9800';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    }

    // Draw pings on radar (purple triangles)
    if (this.filters.pings !== false) {
    (state.pings || []).forEach(ping => {
      const pos = worldToRadar(ping.lat, ping.lng);
      if (!pos) return;
      const age = Date.now() - (ping.createdAt || 0);
      const life = Math.max(0, 1 - age / PingSystem.PING_DURATION);
      const s = 3 + (1 - life) * 3;
      ctx.fillStyle = `rgba(124,58,237,${0.4 + life * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - s);
      ctx.lineTo(pos.x + s, pos.y + s);
      ctx.lineTo(pos.x - s, pos.y + s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${life * 0.6})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
    }

    // Draw custom waypoints on radar (small diamonds)
    if (this.filters.waypoints !== false) {
    (state.waypoints || []).forEach(wp => {
      const pos = worldToRadar(wp.lat, wp.lng);
      if (!pos) return;
      ctx.fillStyle = wp.color || '#7c3aed';
      ctx.beginPath();
      const s = 3;
      ctx.moveTo(pos.x, pos.y - s);
      ctx.lineTo(pos.x + s, pos.y);
      ctx.lineTo(pos.x, pos.y + s);
      ctx.lineTo(pos.x - s, pos.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
    }

    // Draw extraction (pulsing green diamond)
    (state.objectives || []).filter(o => o.type === 'Extraction').forEach(o => {
      const pos = worldToRadar(o.lat, o.lng);
      if (!pos) return;
      const extractPulse = 0.7 + Math.sin(Date.now() / 400) * 0.3;
      ctx.fillStyle = `rgba(0,230,118,${extractPulse})`;
      const eSize = 5 + Math.sin(Date.now() / 300) * 1.5;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - eSize);
      ctx.lineTo(pos.x + eSize, pos.y);
      ctx.lineTo(pos.x, pos.y + eSize);
      ctx.lineTo(pos.x - eSize, pos.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw threats (red dots, pulsing)
    if (this.filters.threats !== false) {
    (state.threats || []).forEach(t => {
      const pos = worldToRadar(t.lat, t.lng);
      if (!pos) return;
      const pulse = 0.6 + Math.sin(Date.now() / 300 + (t.id || '').length) * 0.4;
      const isHunt = t.mode === 'hunt';
      const dotRadius = isHunt ? 6 : (t.alert ? 5 : 3);
      ctx.fillStyle = `rgba(239,68,68,${pulse})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      // Hunt mode: ! indicator
      if (isHunt) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', pos.x, pos.y);
        // Label
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 6px system-ui';
        ctx.fillText('HUNT', pos.x, pos.y - dotRadius - 5);
      }
    });
    }

    // Draw squad (team-colored dots)
    if (this.filters.agents !== false) {
    (state.agents || []).filter(a => a.id !== state.localAgentId).forEach(a => {
      const pos = worldToRadar(a.lat, a.lng);
      if (!pos) return;
      ctx.fillStyle = a.team === 'North' ? '#4fc3f7' : '#ff8a65';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    } // end agents filter

    // Range label
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${this.range}m`, cx, cy - radius + 10);
  },

  toggle() {
    this.open = !this.open;
    if (this.canvas) this.canvas.style.display = this.open ? 'block' : 'none';
  }, // end toggle()

  destroy() {
    this.stopLoop();
    this._destroyVisibility();
    this.canvas = null;
    this.ctx = null;
  }

}; // end RadarModule

/* ========================== RESULTS ANIMATIONS ========================== */

const ResultsAnimations = {
  confettiCanvas: null,
  confettiCtx: null,
  confettiId: null,
  particles: [],
  active: false,

  // Animated count-up for score display
  animateScoreCounter(targetValue, durationMs = 1200) {
    const el = document.getElementById('scoreValue');
    if (!el) return;
    const startTime = performance.now();
    const startValue = 0;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Final pop effect
        el.style.transform = 'scale(1.08)';
        setTimeout(() => { el.style.transform = ''; }, 200);
      }
    };
    requestAnimationFrame(tick);
  },

  // Trigger CSS animations on results elements
  triggerEntranceAnimations() {
    const trophy = document.getElementById('resultsTrophy');
    const grade = document.getElementById('scoreGrade');
    const score = document.getElementById('scoreValue');
    const summary = document.getElementById('scoreSummary');
    const cards = document.querySelectorAll('.results-main .card');

    // Reset animations by removing classes first
    [trophy, grade, score, summary].forEach(el => {
      if (el) { el.classList.remove('animate'); void el.offsetWidth; }
    });
    cards.forEach(card => { card.classList.remove('animate'); void card.offsetWidth; });

    // Add animate classes with staggered delays handled by CSS
    if (trophy) trophy.classList.add('animate');
    if (grade) grade.classList.add('animate');
    if (score) score.classList.add('animate');
    if (summary) summary.classList.add('animate');
    cards.forEach(card => card.classList.add('animate'));
  },

  // Confetti effect for winners
  startConfetti(isWinner) {
    this.stopConfetti();
    this.confettiCanvas = document.getElementById('resultsConfetti');
    if (!this.confettiCanvas) return;
    this.confettiCtx = this.confettiCanvas.getContext('2d');
    this.resizeConfetti();
    window.addEventListener('resize', this._resizeHandler);

    // Create particles
    const count = isWinner ? 180 : 60;
    this.particles = [];
    const colors = ['#7c3aed', '#a78bfa', '#ff8b1f', '#00bcd4', '#4caf50', '#ffd965', '#ef4444', '#fff'];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(colors));
    }
    this.active = true;
    this.confettiLoop();
  },

  stopConfetti() {
    this.active = false;
    if (this.confettiId) {
      cancelAnimationFrame(this.confettiId);
      this.confettiId = null;
    }
    if (this.confettiCtx && this.confettiCanvas) {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    this.particles = [];
  },

  createParticle(colors) {
    const w = this.confettiCanvas ? this.confettiCanvas.width / (window.devicePixelRatio || 1) : window.innerWidth;
    const h = this.confettiCanvas ? this.confettiCanvas.height / (window.devicePixelRatio || 1) : window.innerHeight;
    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.5 - h * 0.3,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 2.5 + 1.2,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      opacity: Math.random() * 0.4 + 0.6,
      sway: Math.random() * 0.02 + 0.01,
      swayOffset: Math.random() * Math.PI * 2
    };
  },

  resizeConfetti() {
    const canvas = document.getElementById('resultsConfetti');
    if (!canvas) return;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * r);
    canvas.height = Math.floor(h * r);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (this.confettiCtx) this.confettiCtx.setTransform(r, 0, 0, r, 0, 0);
  },

  get _resizeHandler() {
    return this.__resizeHandler ||= () => this.resizeConfetti();
  },

  confettiLoop() {
    if (!this.active) return;
    const ctx = this.confettiCtx;
    const canvas = this.confettiCanvas;
    if (!ctx || !canvas) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    const now = Date.now();
    let alive = 0;
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(now * p.sway + p.swayOffset) * 0.8;
      p.rotation += p.rotationSpeed;

      if (p.y < h + 20) alive++;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      // Draw rectangular confetti piece
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (alive > 0) {
      this.confettiId = requestAnimationFrame(() => this.confettiLoop());
    } else {
      this.active = false;
      this.confettiId = null;
    }
  },

  // Play mission complete sound with winner flourish
  playCompleteSound(isWinner) {
    if (isWinner) {
      SoundFX.missionComplete();
      setTimeout(() => SoundFX.scoreEvent(), 500);
    } else {
      SoundFX.missionComplete();
    }
  }
};

/* ========================== TIMER WARNINGS ========================== */

const TimerWarnings = {
  triggered: new Set(),
  active: false,

  thresholds: [
    { seconds: 300, label: '5 MIN', msg: '5 minutes remaining.', color: '#ff8b1f', type: 'caution' },
    { seconds: 60,  label: '1 MIN', msg: '1 minute remaining.', color: '#ef4444', type: 'warning' },
    { seconds: 30,  label: '30 SEC', msg: '30 seconds remaining.', color: '#ef4444', type: 'critical' }
  ],

  start() {
    this.active = true;
    this.triggered.clear();
    this.hideOverlay();
  },

  stop() {
    this.active = false;
    this.triggered.clear();
    this.hideOverlay();
  },

  check(remaining) {
    if (!this.active || remaining <= 0) return;
    for (const t of this.thresholds) {
      if (remaining <= t.seconds && !this.triggered.has(t.seconds)) {
        this.triggered.add(t.seconds);
        this.trigger(t, remaining);
      }
    }
  },

  trigger(threshold, remaining) {
    // Visual overlay
    this.showOverlay(threshold);
    // Audio warning
    this.playAudio(threshold.type);
    // Chat message
    addChat('System', threshold.msg);
    // Auto-hide after 3.5s (4s for critical)
    const hideDelay = threshold.type === 'critical' ? 4500 : 3500;
    setTimeout(() => this.hideOverlay(), hideDelay);
  },

  showOverlay(threshold) {
    let el = document.getElementById('timerWarningOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'timerWarningOverlay';
      el.className = 'timer-warning-overlay hidden';
      el.innerHTML = `
        <div class="timer-warning-content">
          <div class="timer-warning-icon">⏱</div>
          <div class="timer-warning-label" id="timerWarningLabel">TIME WARNING</div>
          <div class="timer-warning-text" id="timerWarningText">--</div>
        </div>
      `;
      document.getElementById('missionScreen')?.appendChild(el);
    }
    const label = el.querySelector('#timerWarningLabel');
    const text = el.querySelector('#timerWarningText');
    if (label) label.textContent = threshold.label + ' REMAINING';
    if (text) text.textContent = threshold.msg;
    el.style.setProperty('--tw-color', threshold.color);
    el.classList.remove('hidden');
    // Re-trigger animation
    el.classList.remove('tw-anim');
    void el.offsetWidth;
    el.classList.add('tw-anim');
  },

  hideOverlay() {
    const el = document.getElementById('timerWarningOverlay');
    if (el) el.classList.add('hidden');
  },

  playAudio(type) {
    if (type === 'caution') {
      SoundFX.play(440, 0.18, 'sine', 0.12);
      setTimeout(() => SoundFX.play(554, 0.18, 'sine', 0.12), 180);
      setTimeout(() => SoundFX.play(659, 0.25, 'sine', 0.1), 360);
    } else if (type === 'warning') {
      SoundFX.play(523, 0.15, 'square', 0.1);
      setTimeout(() => SoundFX.play(523, 0.15, 'square', 0.1), 200);
      setTimeout(() => SoundFX.play(659, 0.25, 'square', 0.1), 400);
    } else if (type === 'critical') {
      SoundFX.play(698, 0.12, 'sawtooth', 0.12);
      setTimeout(() => SoundFX.play(698, 0.12, 'sawtooth', 0.12), 150);
      setTimeout(() => SoundFX.play(880, 0.15, 'sawtooth', 0.12), 300);
      setTimeout(() => SoundFX.play(880, 0.3, 'sawtooth', 0.1), 450);
    }
  }
};

/* ========================== THREAT PROXIMITY WARNING ========================== */

const ThreatProximity = {
  vignette: null,
  glow: null,
  indicators: {},
  lastAudioTime: 0,
  warnDistance: 200,
  criticalDistance: 100,
  // Audio pulse interval ranges (ms): slowest at warn edge, fastest at critical
  minPulseInterval: 600,
  maxPulseInterval: 2200,
  // Stealth reduces these distances by 50%
  getWarnDistance() { return state.stealth ? this.warnDistance * StealthMode.DETECT_RANGE_MULT : this.warnDistance; },
  getCriticalDistance() { return state.stealth ? this.criticalDistance * StealthMode.DETECT_RANGE_MULT : this.criticalDistance; },
  active: false,

  init() {
    this.vignette = document.getElementById('threatVignette');
    this.glow = document.getElementById('threatGlow');
    this.indicators = {
      top: document.getElementById('threatIndicatorTop'),
      bottom: document.getElementById('threatIndicatorBottom'),
      left: document.getElementById('threatIndicatorLeft'),
      right: document.getElementById('threatIndicatorRight')
    };
  },

  update() {
    if (!this.active) {
      this.hideAll();
      return;
    }
    const local = state.agents.find(a => a.id === state.localAgentId);
    if (!local || !state.threats || !state.threats.length) {
      this.hideAll();
      return;
    }

    let nearestDist = Infinity;
    let nearestThreat = null;
    state.threats.forEach(t => {
      const d = haversine(local, t);
      if (d < nearestDist) { nearestDist = d; nearestThreat = t; }
    });

    if (nearestDist <= this.getCriticalDistance()) {
      this.showVignette(true);
      this.showGlow(local, nearestThreat, true);
      this.showDirection(local, nearestThreat);
      this.playAudioBeacon(true, nearestDist);
    } else if (nearestDist <= this.getWarnDistance()) {
      this.showVignette(true);
      this.showGlow(local, nearestThreat, false);
      this.showDirection(local, nearestThreat);
      this.playAudioBeacon(false, nearestDist);
    } else {
      this.hideAll();
    }
  },

  showVignette(on) {
    if (this.vignette) this.vignette.classList.toggle('active', on);
  },

  showGlow(local, threat, critical) {
    if (!this.glow || !threat) return;
    const dLat = threat.lat - local.lat;
    const dLng = threat.lng - local.lng;
    const absLat = Math.abs(dLat);
    const absLng = Math.abs(dLng);
    let dir = '';
    if (absLat > absLng) {
      dir = dLat > 0 ? 'glow-bottom' : 'glow-top';
    } else {
      dir = dLng > 0 ? 'glow-right' : 'glow-left';
    }
    this.glow.className = 'threat-glow active ' + dir;
    // Speed up glow pulse animation when critical
    const animDuration = critical ? '0.7s' : '1.2s';
    this.glow.style.animationDuration = animDuration;
  },

  hideGlow() {
    if (this.glow) {
      this.glow.className = 'threat-glow';
      this.glow.style.animationDuration = '';
    }
  },

  showDirection(local, threat) {
    if (!threat) return;
    const dLat = threat.lat - local.lat;
    const dLng = threat.lng - local.lng;
    const absLat = Math.abs(dLat);
    const absLng = Math.abs(dLng);
    const dirs = { top: false, bottom: false, left: false, right: false };

    if (absLat > absLng) {
      dirs[dLat > 0 ? 'bottom' : 'top'] = true;
    } else {
      dirs[dLng > 0 ? 'right' : 'left'] = true;
    }

    Object.keys(this.indicators).forEach(key => {
      const el = this.indicators[key];
      if (el) el.classList.toggle('active', dirs[key] || false);
    });
  },

  hideAll() {
    this.showVignette(false);
    this.hideGlow();
    Object.values(this.indicators).forEach(el => {
      if (el) el.classList.remove('active');
    });
  },

  // Compute dynamic audio cooldown based on proximity: closer = faster pulses
  getPulseInterval(dist, critical) {
    if (critical) return this.minPulseInterval;
    const warn = this.getWarnDistance();
    const crit = this.getCriticalDistance();
    const range = Math.max(1, warn - crit);
    const t = Math.max(0, Math.min(1, (dist - crit) / range));
    return this.minPulseInterval + t * (this.maxPulseInterval - this.minPulseInterval);
  },

  playAudioBeacon(critical, dist) {
    const now = Date.now();
    const interval = this.getPulseInterval(dist, critical);
    if (now - this.lastAudioTime < interval) return;
    this.lastAudioTime = now;
    if (critical) {
      SoundFX.play(280, 0.18, 'sawtooth', 0.12);
      setTimeout(() => SoundFX.play(220, 0.22, 'sawtooth', 0.1), 180);
    } else {
      SoundFX.play(320, 0.12, 'sine', 0.08);
      setTimeout(() => SoundFX.play(280, 0.14, 'sine', 0.08), 200);
    }
  },

  start() {
    this.active = true;
    if (!this.vignette) this.init();
  },

  stop() {
    this.active = false;
    this.hideAll();
  }
};

/* ========================== OBJECTIVE AUTO-FOCUS ========================== */

const ObjectiveAutoFocus = {
  panDuration: 1.2, // seconds
  zoomLevel: 16,
  panning: false,

  focusNext() {
    const m = MapModule.ensureMissionMap();
    if (!m) return;
    // Find next objective: first decoded but not found, else first undecoded
    let next = state.objectives.find(o => o.decoded && !o.found);
    if (!next) next = state.objectives.find(o => !o.decoded);
    if (!next) return;
    this.panTo(next.lat, next.lng);
    // Flash the objective panel tab to draw attention
    this.flashPanelTab();
  },

  panTo(lat, lng) {
    const m = MapModule.ensureMissionMap();
    if (!m || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    this.panning = true;
    m.flyTo([lat, lng], this.zoomLevel, {
      animate: true,
      duration: this.panDuration,
      easeLinearity: 0.25
    });
    // Clear panning flag after animation completes
    setTimeout(() => { this.panning = false; }, this.panDuration * 1000 + 100);
  },

  flashPanelTab() {
    const tab = document.querySelector('[data-panel-tab="objectives"]');
    if (!tab) return;
    tab.classList.add('obj-flash');
    setTimeout(() => tab.classList.remove('obj-flash'), 1200);
  }
};

/* ========================== SOUND FX ========================== */

const SoundFX = {
  ctx: null,
  inited: false,
  init() {
    if (this.inited) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.inited = true;
    } catch(e) { console.warn('AudioContext not available', e); }
  },
  play(freq, duration, type = 'sine', vol = 0.15) {
    if (!this.ctx || !this.inited) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) { /* silent fail */ }
  },
  beaconCollected() { this.play(523, 0.1); setTimeout(() => this.play(659, 0.1), 100); },
  threatDetected() { this.play(200, 0.2, 'sawtooth', 0.12); },
  missionStart() {
    this.play(523, 0.15);
    setTimeout(() => this.play(659, 0.15), 150);
    setTimeout(() => this.play(784, 0.2), 300);
  },
  extractionReady() { this.play(440, 0.3, 'triangle', 0.1); },
  timerTick() { this.play(1000, 0.05, 'square', 0.06); },
  missionComplete() {
    this.play(523, 0.1);
    setTimeout(() => this.play(659, 0.1), 100);
    setTimeout(() => this.play(784, 0.1), 200);
    setTimeout(() => this.play(1047, 0.3), 350);
  },
  scoreEvent() { this.play(880, 0.12); setTimeout(() => this.play(1100, 0.12), 80); }
};

/* ========================== DAY/NIGHT CYCLE MODULE (2.5) ========================== */

const DayNightCycle = {
  // CartoDB tile variants: dark for night, light for day
  tileUrls: {
    night: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    day:   'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  },
  tileAttribution: '&copy; OSM &copy; CARTO',
  tileSubdomains: 'abcd',

  // Approximate sunrise/sunset hours by latitude band (simplified model)
  // Returns { sunrise, sunset } in local hours (0-24)
  getSunTimes(lat) {
    const absLat = Math.min(Math.abs(lat), 66.5); // cap at Arctic/Antarctic circle
    // Base: equinox ~12h day everywhere
    // Summer solstice: +2.5h at 45°, +5h at 66.5°
    // Winter solstice: -2.5h at 45°, -5h at 66.5°
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    // Approximate declination of sun (-23.5° to +23.5°)
    const declination = 23.45 * Math.sin((360 * (dayOfYear - 81) / 365) * Math.PI / 180);
    // Hour angle at sunrise/sunset: cos(H) = -tan(lat)*tan(decl)
    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    let cosH = -Math.tan(latRad) * Math.tan(decRad);
    cosH = Math.max(-1, Math.min(1, cosH));
    const hourAngle = Math.acos(cosH) * 180 / Math.PI; // degrees
    const dayLengthHours = (hourAngle / 15) * 2; // 15° per hour, both sides
    const noon = 12;
    // Adjust for longitude vs timezone (simplified: use local system time as proxy)
    return {
      sunrise: noon - dayLengthHours / 2,
      sunset:  noon + dayLengthHours / 2
    };
  },

  isDaytime(lat) {
    if (!Number.isFinite(lat)) return true; // default to day if unknown
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const times = this.getSunTimes(lat);
    return hour >= times.sunrise && hour < times.sunset;
  },

  getPhase(lat) {
    return this.isDaytime(lat) ? 'day' : 'night';
  },

  // Format sunrise/sunset for display
  formatTime(decimalHours) {
    const h = Math.floor(decimalHours);
    const m = Math.floor((decimalHours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },

  // Get current tile URL based on city
  getCurrentTileUrl() {
    const city = cities[state.city];
    const lat = city?.center?.[0] || 59.9;
    return this.tileUrls[this.getPhase(lat)];
  },

  // Update the HUD indicator
  updateIndicator() {
    const el = document.getElementById('dayNightIndicator');
    if (!el) return;
    const city = cities[state.city];
    const lat = city?.center?.[0] || 59.9;
    const isDay = this.isDaytime(lat);
    const times = this.getSunTimes(lat);
    el.dataset.phase = isDay ? 'day' : 'night';
    el.title = isDay
      ? `Daytime — Sunset at ${this.formatTime(times.sunset)}`
      : `Nighttime — Sunrise at ${this.formatTime(times.sunrise)}`;
    el.querySelector('.dn-icon').textContent = isDay ? '☀' : '🌙';
    el.querySelector('.dn-label').textContent = isDay ? 'DAY' : 'NIGHT';
  },

  // Swap tile layer on a map instance
  applyToMap(mapInstance) {
    if (!mapInstance) return;
    const newUrl = this.getCurrentTileUrl();
    // Find existing tile layer and swap if different
    mapInstance.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        const currentUrl = layer._url;
        if (currentUrl !== newUrl) {
          mapInstance.removeLayer(layer);
          L.tileLayer(newUrl, {
            maxZoom: 19,
            subdomains: this.tileSubdomains,
            attribution: this.tileAttribution
          }).addTo(mapInstance);
        }
      }
    });
  },

  // Apply to both maps
  apply() {
    if (typeof window.L === 'undefined') return;
    // Access internal map references via MapModule
    const missionMap = MapModule.ensureMissionMap();
    const setupMapInst = MapModule.ensureSetupMap();
    this.applyToMap(missionMap);
    this.applyToMap(setupMapInst);
    this.updateIndicator();
  },

  // Start periodic check (every 60s)
  intervalId: null,
  start() {
    this.stop();
    this.apply();
    this.intervalId = setInterval(() => this.apply(), 60000);
  },
  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }
};

/* ========================== MAP MODULE ========================== */

const MapModule = (() => {
  const CFG = {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttribution: '&copy; OSM &copy; CARTO',
    tileSubdomains: 'abcd',
    maxZoom: 19,
    defaultZoom: 13,
    beaconRadius: 100,
    extractionRadius: 50
  };

  let map = null, setupMap = null;
  let gpsActive = false;
  let currentPos = null;
  let beacons = [], extractions = [], squad = {}, zones = [], routes = [];
  let playerMarker = null, accuracyCircle = null;
  let threatCircles = [];
  let objectiveMarkers = [];
  let onMapClickCb = null;
  let squadTrails = {}; // id -> { positions: [{lat,lng}], polylines: [L.polyline] }

  function createIcon(html, size) {
    return L.divIcon({ className: 'sl-map-icon', html, iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -size/2] });
  }

  function getPlayerIcon(color, pulse) {
    const fx = pulse ? 'animation: slPulse 1.5s ease-in-out infinite;' : '';
    return createIcon(`<div style="width:20px;height:20px;background:${color};border:3px solid #ffd965;border-radius:50%;box-shadow:0 0 12px ${color}80;${fx}"></div>`, 20);
  }

  function getBeaconIcon(idx, collected) {
    if (collected) return createIcon(`<div style="width:22px;height:22px;background:#4caf50;border:2px solid #81c784;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;box-shadow:0 0 8px #4caf5080;">✓</div>`, 22);
    const colors = ['#ff5722','#ff9800','#ffc107','#e91e63','#9c27b0'];
    const c = colors[idx % colors.length];
    return createIcon(`<div style="width:24px;height:24px;background:${c};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;box-shadow:0 0 16px ${c}99;">${idx+1}</div>`, 24);
  }

  function getExtractionIcon() {
    return createIcon(`<div class="sl-extract-icon" style="width:32px;height:32px;background:linear-gradient(135deg,#00e676,#00c853);border:3px solid #fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;box-shadow:0 0 20px #00e67680;transform:rotate(45deg);">✈</div>`, 32);
  }

  function initMap(containerId, opts = {}) {
    const el = $(containerId);
    if (!el || !window.L) return null;
    const center = opts.center || getMissionCenter();
    const zoom = opts.zoom || CFG.defaultZoom;
    const m = L.map(el, { zoomControl: false, attributionControl: false }).setView(center, zoom);
    // Use DayNightCycle tile URL if available, fallback to dark
    const tileUrl = (typeof DayNightCycle !== 'undefined') ? DayNightCycle.getCurrentTileUrl() : CFG.tileUrl;
    L.tileLayer(tileUrl, { maxZoom: CFG.maxZoom, subdomains: CFG.tileSubdomains, attribution: CFG.tileAttribution }).addTo(m);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    if (opts.onClick) m.on('click', e => opts.onClick(e.latlng.lat, e.latlng.lng));
    return m;
  }

  function ensureMissionMap() {
    if (!map && window.L) {
      map = initMap('#missionMap', {
        onClick: (lat, lng) => {
          if (state.screen === 'mission' && state.status === 'Live') {
            PingSystem.placePing(lat, lng);
          }
        }
      });
      if (map) setTimeout(() => map.invalidateSize(), 80);
    }
    return map;
  }

  function ensureSetupMap() {
    if (!setupMap && window.L) {
      setupMap = initMap('#setupMap', {
        zoom: 11,
        onClick: (lat, lng) => {
          if (state.locMapMode) {
            // Location pick mode — set custom location
            state.customLocation = { lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
            state.locMapMode = false;
            updateLocationUI();
            renderSetupMarkersOnMap();
            $('#locMapMode').textContent = '📍 Pick on map';
            return;
          }
          // Default: marker placement mode
          $('#markerLat').value = lat.toFixed(6);
          $('#markerLng').value = lng.toFixed(6);
          renderMarkerList();
        }
      });
      if (setupMap) setTimeout(() => setupMap.invalidateSize(), 80);
    }
    return setupMap;
  }

  function destroyMaps() {
    if (map) { map.remove(); map = null; }
    if (setupMap) { setupMap.remove(); setupMap = null; }
  }

  function setCenter(lat, lng, zoom) {
    if (map) map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
    if (setupMap) setupMap.setView([lat, lng], zoom || setupMap.getZoom(), { animate: true });
  }

  function startGPS() {
    if (!navigator.geolocation) { updateGpsUi('unavailable', 'GPS unavailable'); return false; }
    if (gpsActive) return true;
    BatteryAwareGPS.onGpsStart();
    const interval = BatteryAwareGPS.getInterval();
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: interval };
    navigator.geolocation.getCurrentPosition(p => handlePos(p), e => console.warn('GPS init error', e.message), opts);
    gpsWatchId = navigator.geolocation.watchPosition(handlePos, e => console.warn('GPS watch error', e.message), opts);
    gpsActive = true;
    const modeLabel = BatteryAwareGPS.getModeLabel();
    updateGpsUi('granted', `Live GPS · ${modeLabel}`);
    BatteryAwareGPS._updateUI();
    return true;
  }

  function stopGPS() {
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId = null; }
    gpsActive = false;
    if (playerMarker && playerMarker._pulseInterval) {
      clearInterval(playerMarker._pulseInterval);
      playerMarker._pulseInterval = null;
    }
    BatteryAwareGPS.onGpsStop();
    updateGpsUi('manual', 'GPS stopped');
  }

  function restartGPSWithInterval(interval) {
    if (!gpsActive) return;
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId = null; }
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: interval };
    gpsWatchId = navigator.geolocation.watchPosition(handlePos, e => console.warn('GPS watch error', e.message), opts);
    const modeLabel = BatteryAwareGPS.getModeLabel();
    updateGpsUi('granted', `Live GPS · ${modeLabel}`);
    BatteryAwareGPS._updateUI();
  }

  function handlePos(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    currentPos = [latitude, longitude];
    updatePlayerMarker(latitude, longitude, accuracy);
    updateLocalAgentPosition(latitude, longitude, accuracy);
  }

  function setPlayerPosition(lat, lng) {
    currentPos = [lat, lng];
    updatePlayerMarker(lat, lng, null);
  }

  function updatePlayerMarker(lat, lng, accuracy) {
    const m = ensureMissionMap();
    if (!m) return;
    if (!playerMarker) {
      // Use circleMarker with pulsing animation for GPS player dot
      playerMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#00bcd4',
        fillColor: '#00bcd4',
        fillOpacity: 0.9,
        weight: 3,
        opacity: 1,
        className: 'gps-player-dot',
        zIndexOffset: 1000
      }).addTo(m);
      playerMarker.bindPopup('<div class=\"sl-popup\"><strong>⭐ You</strong></div>');
      // Add pulsing ring using a second circle
      const pulseCircle = L.circleMarker([lat, lng], {
        radius: 14,
        color: '#00bcd4',
        fillColor: '#00bcd4',
        fillOpacity: 0.2,
        weight: 1,
        opacity: 0.6,
        className: 'gps-pulse-ring',
        zIndexOffset: 999
      }).addTo(m);
      playerMarker.pulseRing = pulseCircle;
      // Pulsing effect via opacity cycling
      let pulseDir = 1;
      playerMarker._pulseInterval = setInterval(() => {
        if (!pulseCircle._map) { clearInterval(playerMarker._pulseInterval); return; }
        const cur = parseFloat(pulseCircle.options.fillOpacity) || 0.2;
        let next = cur + 0.03 * pulseDir;
        if (next > 0.4) { next = 0.4; pulseDir = -1; }
        if (next < 0.08) { next = 0.08; pulseDir = 1; }
        pulseCircle.setStyle({ fillOpacity: next, opacity: 0.3 + next * 0.75 });
      }, 100);
    } else {
      playerMarker.setLatLng([lat, lng]);
      if (playerMarker.pulseRing) {
        playerMarker.pulseRing.setLatLng([lat, lng]);
      }
    }
    if (accuracy) {
      if (!accuracyCircle) {
        accuracyCircle = L.circle([lat, lng], { color: '#00bcd4', fillColor: '#00bcd4', fillOpacity: 0.06, weight: 1, radius: accuracy }).addTo(m);
      } else {
        accuracyCircle.setLatLng([lat, lng]);
        accuracyCircle.setRadius(accuracy);
      }
    }
  }

  function addBeacon(id, lat, lng, label) {
    const m = ensureMissionMap(); if (!m) return;
    const idx = beacons.length;
    const icon = getBeaconIcon(idx, false);
    const marker = L.marker([lat, lng], { icon }).addTo(m);
    marker.bindPopup(`<div class="sl-popup"><strong>Beacon ${idx+1}</strong><br>${escapeHtml(label||'')}</div>`);
    const circle = L.circle([lat, lng], { color: '#ff5722', fillColor: '#ff5722', fillOpacity: 0.08, radius: CFG.beaconRadius }).addTo(m);
    const b = { id: id||`b_${Date.now()}`, lat, lng, label: label||`Beacon ${idx+1}`, marker, circle, collected: false };
    beacons.push(b);
    return b;
  }

  function collectBeacon(bid) {
    const b = beacons.find(x => x.id === bid);
    if (!b || b.collected) return false;
    b.collected = true;
    b.marker.setIcon(getBeaconIcon(beacons.indexOf(b), true));
    b.circle.setStyle({ color: '#4caf50', fillColor: '#4caf50' });
    return true;
  }

  function addExtraction(lat, lng, label) {
    const m = ensureMissionMap(); if (!m) return;
    const marker = L.marker([lat, lng], { icon: getExtractionIcon() }).addTo(m);
    marker.bindPopup(`<div class="sl-popup"><strong>Extraction</strong><br>${escapeHtml(label||'')}</div>`);
    // Pulsing circle with interval-based animation
    const circle = L.circle([lat, lng], { color: '#00e676', fillColor: '#00e676', fillOpacity: 0.1, weight: 2, radius: CFG.extractionRadius }).addTo(m);
    circle._pulseDir = 1;
    circle._pulseInterval = setInterval(() => {
      if (!circle._map) { clearInterval(circle._pulseInterval); return; }
      const cur = parseFloat(circle.options.fillOpacity) || 0.1;
      let next = cur + 0.03 * circle._pulseDir;
      if (next > 0.25) { next = 0.25; circle._pulseDir = -1; }
      if (next < 0.05) { next = 0.05; circle._pulseDir = 1; }
      circle.setStyle({ fillOpacity: next, opacity: 0.4 + next });
    }, 200);
    const e = { lat, lng, label: label||'Extraction', marker, circle };
    extractions.push(e);
    return e;
  }

  function addSquadMember(id, name, lat, lng, role, isSelf, team) {
    const m = ensureMissionMap(); if (!m) return;
    // Color by team: North=#4fc3f7, South=#ff8a65, Alpha=role-based
    let color;
    if (isSelf) color = '#ffd965';
    else if (team === 'North') color = '#4fc3f7';
    else if (team === 'South') color = '#ff8a65';
    else color = getRoleColor(role) || '#9e9e9e';
    if (squad[id]) {
      squad[id].marker.setLatLng([lat, lng]);
      squad[id].lat = lat; squad[id].lng = lng;
      updateSquadTrail(id, lat, lng, color);
    } else {
      const marker = L.marker([lat, lng], { icon: getPlayerIcon(color, isSelf) }).addTo(m);
      marker.bindPopup('<div class="sl-popup"><strong>'+(isSelf?'⭐ ':'')+escapeHtml(name)+'</strong><br>'+escapeHtml(role)+(team?' · '+escapeHtml(team):'')+'</div>');
      squad[id] = { id, name, lat, lng, role, isSelf, team, marker };
      initSquadTrail(id, lat, lng, color);
    }
  }

  function initSquadTrail(id, lat, lng, color) {
    if (!squadTrails[id]) {
      squadTrails[id] = { positions: [{ lat, lng }], polylines: [], color };
    }
  }

  function updateSquadTrail(id, lat, lng, color) {
    const trail = squadTrails[id];
    if (!trail) return;
    trail.positions.push({ lat, lng });
    if (trail.positions.length > 21) trail.positions.shift(); // keep last 20 segments (21 points)
    trail.color = color;
    drawSquadTrail(id);
  }

  function drawSquadTrail(id) {
    const m = ensureMissionMap(); if (!m) return;
    const trail = squadTrails[id];
    if (!trail || trail.positions.length < 2) return;
    // Remove old polylines
    trail.polylines.forEach(p => { try { m.removeLayer(p); } catch(e) {} });
    trail.polylines = [];
    const color = trail.color || '#9e9e9e';
    const positions = trail.positions;
    // Draw each segment with fading opacity: latest opaque, oldest transparent
    const maxSegments = 20;
    const baseWidth = 3;
    for (let i = 0; i < positions.length - 1; i++) {
      const segmentIndex = i; // 0 = oldest
      const opacity = Math.max(0.05, (segmentIndex + 1) / maxSegments);
      const poly = L.polyline([ [positions[i].lat, positions[i].lng], [positions[i+1].lat, positions[i+1].lng] ], {
        color: color,
        weight: baseWidth,
        opacity: opacity,
        interactive: false,
        className: 'sl-squad-trail'
      }).addTo(m);
      // Send trail to back so markers stay on top
      if (poly.bringToBack) poly.bringToBack();
      trail.polylines.push(poly);
    }
  }

  function clearSquadTrails() {
    const m = ensureMissionMap();
    Object.values(squadTrails).forEach(trail => {
      trail.polylines.forEach(p => { try { m?.removeLayer(p); } catch(e) {} });
    });
    squadTrails = {};
  }

  function removeSquadMember(id) {
    if (squad[id]) { map?.removeLayer(squad[id].marker); delete squad[id]; }
    if (squadTrails[id]) {
      squadTrails[id].polylines.forEach(p => { try { map?.removeLayer(p); } catch(e) {} });
      delete squadTrails[id];
    }
  }

  function drawZone(centerLat, centerLng, radiusMeters, color) {
    const m = ensureMissionMap(); if (!m) return;
    zones.forEach(z => map.removeLayer(z));
    zones = [];
    const c = L.circle([centerLat, centerLng], { color: color||'#ff5722', fillColor: color||'#ff5722', fillOpacity: 0.05, weight: 2, dashArray: '8,8', radius: radiusMeters||1000 }).addTo(m);
    zones.push(c);
    return c;
  }

  function clearGameObjects() {
    beacons.forEach(b => { map?.removeLayer(b.marker); map?.removeLayer(b.circle); });
    beacons = [];
    extractions.forEach(e => { map?.removeLayer(e.marker); map?.removeLayer(e.circle); if (e.circle && e.circle._pulseInterval) clearInterval(e.circle._pulseInterval); });
    extractions = [];
    Object.values(squad).forEach(s => map?.removeLayer(s.marker));
    squad = {};
    clearSquadTrails();
    zones.forEach(z => map?.removeLayer(z)); zones = [];
    routes.forEach(r => map?.removeLayer(r)); routes = [];
    threatCircles.forEach(t => map?.removeLayer(t)); threatCircles = [];
    objectiveMarkers.forEach(o => map?.removeLayer(o)); objectiveMarkers = [];
    if (playerMarker) {
      if (playerMarker._pulseInterval) clearInterval(playerMarker._pulseInterval);
      if (playerMarker.pulseRing) map?.removeLayer(playerMarker.pulseRing);
      map?.removeLayer(playerMarker); playerMarker = null;
    }
    if (accuracyCircle) { map?.removeLayer(accuracyCircle); accuracyCircle = null; }
  }

  function drawThreats(threats) {
    const m = ensureMissionMap(); if (!m) return;
    threatCircles.forEach(t => {
      map.removeLayer(t);
      if (t._pulseInterval) clearInterval(t._pulseInterval);
    });
    threatCircles = [];
    threats.forEach(t => {
      const c = L.circleMarker([t.lat, t.lng], {
        radius: Math.max(8, t.radius / 15),
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: t.alert ? 0.3 : 0.15,
        weight: t.alert ? 3 : 2,
        opacity: 0.8
      }).addTo(m);
      c.bindPopup(`<strong>${escapeHtml(t.name)}</strong><br>${t.mode === 'hunt' ? 'HUNT' : t.alert ? 'Jamming' : 'Patrolling'} / ${t.radius}m`);
      // Pulse animation via opacity cycling
      let dir = 1;
      c._pulseInterval = setInterval(() => {
        if (!c._map) { clearInterval(c._pulseInterval); return; }
        const cur = parseFloat(c.options.fillOpacity) || 0.15;
        let next = cur + 0.03 * dir;
        if (next > 0.45) { next = 0.45; dir = -1; }
        if (next < 0.1) { next = 0.1; dir = 1; }
        c.setStyle({ fillOpacity: next, opacity: 0.5 + next });
      }, 150);
      threatCircles.push(c);
    });
  }

  function drawObjectives(objectives) {
    const m = ensureMissionMap(); if (!m) return;
    objectiveMarkers.forEach(o => map.removeLayer(o));
    objectiveMarkers = [];
    const local = state.agents.find(a=>a.id===state.localAgentId);
    objectives.filter(o => o.decoded).forEach(o => {
      // Find nearest undecoded for "current" highlight
      const nearestUndecoded = objectives.find(ox => !ox.decoded);
      const isNearestCurrent = !o.found && !nearestUndecoded;
      let iconHtml;
      if (o.found) {
        // Found: green checkmark
        iconHtml = `<span style="width:28px;height:28px;background:#4caf50;border:2px solid #81c784;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;box-shadow:0 0 12px #4caf5080;">✓</span>`;
      } else if (isNearestCurrent) {
        // Current (nearest undecoded): yellow glow
        iconHtml = `<span style="width:28px;height:28px;background:#ffd965;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#000;font-weight:700;box-shadow:0 0 16px #ffd965cc;">+</span>`;
      } else {
        // Decoded but not nearest: orange
        iconHtml = `<span style="width:28px;height:28px;background:#ff8b1f;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;box-shadow:0 0 8px #ff8b1f80;">+</span>`;
      }
      const mk = L.marker([o.lat, o.lng], {
        icon: createIcon(iconHtml, 28)
      }).addTo(m);
      mk.bindPopup(`<strong>${escapeHtml(o.title)}</strong><br>${escapeHtml(o.type)}<br>${o.radius}m${o.found?' ✅ Found':' '}`);
      objectiveMarkers.push(mk);
    });
    // Locked objectives: gray overlay with lock
    objectives.filter(o => !o.decoded).forEach(o => {
      const mk = L.marker([o.lat, o.lng], {
        icon: createIcon(`<span style="width:28px;height:28px;background:#555;border:2px solid #777;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999;opacity:0.7;">🔒</span>`, 28)
      }).addTo(m);
      mk.bindPopup(`<strong>${escapeHtml(o.title)}</strong><br>Encrypted`);
      objectiveMarkers.push(mk);
    });
  }

  function drawRoute(objectives) {
    const m = ensureMissionMap(); if (!m) return;
    routes.forEach(r => map.removeLayer(r)); routes = [];
    const pts = objectives.filter(o => o.decoded && !o.found).map(o => [o.lat, o.lng]);
    if (pts.length < 2) return;
    const glow = L.polyline(pts, { color: '#ffffff', opacity: 0.35, weight: 10, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(m);
    const line = L.polyline(pts, { color: '#ff8b1f', opacity: 0.85, weight: 4, dashArray: '10 10', lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(m);
    routes.push(glow, line);
  }

  function fitToObjects() {
    const m = ensureMissionMap(); if (!m) return;
    const pts = [];
    if (currentPos) pts.push(currentPos);
    beacons.forEach(b => pts.push([b.lat, b.lng]));
    extractions.forEach(e => pts.push([e.lat, e.lng]));
    Object.values(squad).forEach(s => pts.push([s.lat, s.lng]));
    if (!pts.length) return;
    if (pts.length === 1) m.setView(pts[0], CFG.defaultZoom);
    else m.fitBounds(pts, { padding: [50,50] });
  }

  function getRoleColor(role) {
    const colors = { 'Mission Control':'#ffd965','Navigator':'#00bcd4','Decoder':'#7c4dff','Drone':'#ff9800','Medic':'#4caf50','Mechanic':'#ff5722','Courier':'#e91e63' };
    return colors[role] || '#9e9e9e';
  }

  function updateGpsUi(mode, text) {
    const node = $('#gpsStatus');
    if (node) node.textContent = text;
  }

  return {
    initMap, ensureMissionMap, ensureSetupMap, destroyMaps, setCenter,
    startGPS, stopGPS, setPlayerPosition,
    addBeacon, collectBeacon, addExtraction, addSquadMember, removeSquadMember,
    drawZone, clearGameObjects, drawThreats, drawObjectives, drawRoute, fitToObjects,
    getGPSData: () => ({ position: currentPos, active: gpsActive }),
    restartGPSWithInterval
  };
})();

/* ========================== UTILS ========================== */

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function jitter(center, amount) { return [center[0]+(Math.random()-0.5)*amount, center[1]+(Math.random()-0.5)*amount*1.5]; }
function haversine(a, b) {
  const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function formatTime(s) { const m=Math.floor(s/60).toString().padStart(2,'0'), sec=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function formatDistance(m) { return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`; }
function generateCode() { const w=["AQUA","RADAR","SIGNAL","ECHO","ORBIT","TOWER","NOVA","FIELD"]; const p=()=>w[Math.floor(Math.random()*w.length)]; return `${p()}-${p()}-${Math.floor(10+Math.random()*89)}`; }
function cityKeysForCountry(c) { return Object.keys(cities).filter(k=>cities[k].country===c); }
function normalizeModules() { moduleCatalog.forEach(([k,,,def])=>{ if (typeof state.enabledModules[k]!=='boolean') state.enabledModules[k]=def; }); }
function moduleEnabled(k) { normalizeModules(); return state.enabledModules[k]!==false; }
function enabledPack(k) { return moduleEnabled(k)?(missionPacks[k]||[]):[]; }
// Get mission center: custom location if set, otherwise selected city
function getMissionCenter() {
  if (state.customLocation && Number.isFinite(state.customLocation.lat) && Number.isFinite(state.customLocation.lng)) {
    return [state.customLocation.lat, state.customLocation.lng];
  }
  return cities[state.city].center;
}

/* ========================== IDENTITY / STORAGE ========================== */

function loadProfile() {
  try {
    const s = JSON.parse(localStorage.getItem('slv2_profile')||'null');
    if (s && typeof s==='object') state.localProfile = { name: cleanText(s.name,'Morgan',22), callsign: cleanText(s.callsign,'Raven',14) };
  } catch { localStorage.removeItem('slv2_profile'); }
}
function saveProfile() { localStorage.setItem('slv2_profile', JSON.stringify(state.localProfile)); }
function cleanText(v, fb, max) { return String(v||fb).replace(/[^\w \-.]/g,'').trim().slice(0,max)||fb; }

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('slv2_state')||'null');
    if (s) Object.assign(state, s, { localProfile: state.localProfile });
  } catch { localStorage.removeItem('slv2_state'); }
}
function saveState() { localStorage.setItem('slv2_state', JSON.stringify(state)); }

/* ========================== THEME CANVAS ========================== */

let tCanvas, tCtx, tW, tH, tTime=0, tId=0, tReduced=false, tPx=0.5, tPy=0.5;

function initTheme() {
  tCanvas = $('#themePatternCanvas');
  if (!tCanvas) return;
  tCtx = tCanvas.getContext('2d');
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  tReduced = mq.matches;
  mq.addEventListener?.('change', e=>{ tReduced=e.matches; ensureThemeLoop(); });
  resizeTheme();
  window.addEventListener('resize', resizeTheme);
  window.addEventListener('pointermove', e=>{ tPx=e.clientX/Math.max(1,tW); tPy=e.clientY/Math.max(1,tH); });
  ensureThemeLoop();
}

function resizeTheme() {
  if (!tCanvas || !tCtx) return;
  const r = Math.min(window.devicePixelRatio||1, 2);
  tW = window.innerWidth; tH = window.innerHeight;
  tCanvas.width = Math.floor(tW*r); tCanvas.height = Math.floor(tH*r);
  tCanvas.style.width = tW+'px'; tCanvas.style.height = tH+'px';
  tCtx.setTransform(r,0,0,r,0,0);
}

function ensureThemeLoop() {
  if (!tCtx) return;
  if (!themePatternPalettes[state.themePalette]) {
    tCtx.clearRect(0,0,tW,tH);
    if (tId) { cancelAnimationFrame(tId); tId=0; }
    return;
  }
  if (!tId) tId = requestAnimationFrame(drawTheme);
}

function roundedRect(ctx, x, y, s, rad) {
  const r = Math.min(rad, s/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+s-r, y); ctx.quadraticCurveTo(x+s, y, x+s, y+r);
  ctx.lineTo(x+s, y+s-r); ctx.quadraticCurveTo(x+s, y+s, x+s-r, y+s);
  ctx.lineTo(x+r, y+s); ctx.quadraticCurveTo(x, y+s, x, y+s-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
}

function drawTile(x, y, size, idx, pal, pulse, glow) {
  const cs = pal.colors;
  const w = Math.sin(tTime*0.0016+idx*0.7)*7*pulse;
  const o = Math.cos(tTime*0.0012+idx*0.4)*5*pulse;
  const inset = size*0.09;
  tCtx.save();
  tCtx.translate(x+w, y+o);
  tCtx.shadowBlur = glow*18;
  tCtx.shadowColor = cs[(idx+1)%cs.length];
  tCtx.fillStyle = cs[idx%cs.length];
  roundedRect(tCtx, 0, 0, size, size*0.18); tCtx.fill();
  tCtx.shadowBlur = 0;
  tCtx.strokeStyle = cs[(idx+2)%cs.length]; tCtx.lineWidth = Math.max(3, size*0.035);
  roundedRect(tCtx, inset, inset, size-inset*2, size*0.15); tCtx.stroke();
  tCtx.strokeStyle = pal.line; tCtx.globalAlpha = 0.72; tCtx.lineWidth = Math.max(2, size*0.022);
  roundedRect(tCtx, inset*1.85, inset*1.85, size-inset*3.7, size*0.12); tCtx.stroke();
  tCtx.globalAlpha = 1;
  tCtx.fillStyle = cs[(idx+3)%cs.length];
  tCtx.beginPath();
  tCtx.ellipse(size*0.52+Math.sin(tTime*0.002+idx)*size*0.06*pulse, size*0.52+Math.cos(tTime*0.0018+idx)*size*0.05*pulse, size*0.23, size*0.25, Math.sin(tTime*0.0008+idx)*0.2, 0, Math.PI*2);
  tCtx.fill();
  tCtx.restore();
}

function drawTheme(ts) {
  tId = 0;
  const pal = themePatternPalettes[state.themePalette];
  if (!pal || !tCtx) return;
  tTime = tReduced ? 0 : ts;
  const speed=pal.speed, glow=pal.glow, drift=pal.drift;
  const pulse = 0.45+speed*1.15;
  const tile = Math.max(118, Math.min(178, tW/7));
  const sp = tile*0.96;
  const dx = Math.sin(tTime*0.00018*(1+speed*2))*sp*drift;
  const dy = Math.cos(tTime*0.00014*(1+speed*2))*sp*drift;
  const pdx = (tPx-0.5)*32*drift;
  const pdy = (tPy-0.5)*32*drift;
  tCtx.fillStyle = pal.base;
  tCtx.fillRect(0,0,tW,tH);
  let idx=0;
  for (let y=-sp*1.5; y<tH+sp; y+=sp) {
    for (let x=-sp*1.5; x<tW+sp; x+=sp) {
      const ro = Math.round(y/sp)%2===0 ? sp*0.12 : -sp*0.06;
      drawTile(x+ro+dx+pdx, y+dy+pdy, tile, idx, pal, pulse, glow);
      idx++;
    }
  }
  tCtx.save();
  tCtx.globalCompositeOperation = 'overlay';
  const grad = tCtx.createRadialGradient(tW*tPx, tH*tPy, 0, tW*tPx, tH*tPy, Math.max(tW,tH)*0.75);
  grad.addColorStop(0, 'rgba(255,255,255,0.32)');
  grad.addColorStop(0.5, 'rgba(255,139,31,0.1)');
  grad.addColorStop(1, 'rgba(232,38,99,0.18)');
  tCtx.fillStyle = grad; tCtx.fillRect(0,0,tW,tH);
  tCtx.restore();
  if (!tReduced) tId = requestAnimationFrame(drawTheme);
}

/* ========================== SCREEN ROUTING ========================== */

function setScreen(name) {
  if (state.screen === name && document.body.dataset.screen === name) return;
  const flow = ['lobby', 'setup', 'roles', 'mission', 'results', 'replay', 'spectator'];
  const prev = state.screen;

  // Pre-render content before showing
  if (name === 'roles') { renderRolesScreen(); }
  if (name === 'replay') { renderReplay(); }

  // Stop mission systems when leaving mission
  if (prev === 'mission' && name !== 'mission') {
    RadarModule.destroy();
    ThreatProximity.stop();
    TimerWarnings.stop();
    DayNightCycle.stop();
  }

  // Stop GPS when leaving mission
  if (prev === 'mission') { MapModule.stopGPS(); }

  // Update state and body routing (CSS does the display: flex via [data-screen])
  state.screen = name;
  document.body.dataset.screen = name;

  // Post-switch setup
  if (name === 'setup') {
    setTimeout(() => {
      MapModule.ensureSetupMap();
      MapModule.setCenter(...getMissionCenter(), 11);
      DayNightCycle.apply();
    }, 50);
  }
  if (name === 'mission') {
    setTimeout(() => {
      MapModule.ensureMissionMap();
      MapModule.setCenter(...getMissionCenter(), 14);
      renderMissionMap();
      RadarModule.init('missionRadar');
      ThreatProximity.start();
      TimerWarnings.start();
      DayNightCycle.start();
    }, 50);
  }
  saveState();
}

/* ========================== LOBBY ========================== */

function initLobby() {
  if (window._lobbyInitialized) return; // Prevent double-init from failsafe race
  window._lobbyInitialized = true;
  if (!window.isSecureContext && !['localhost','127.0.0.1','::1'].includes(location.hostname)) {
    $('#httpWarning')?.classList.remove('hidden');
  }
  $('#hostName').value = state.localProfile.name;
  $('#hostCallsign').value = state.localProfile.callsign;
  $('#joinName').value = state.localProfile.name;
  $('#joinCallsign').value = state.localProfile.callsign;
  // Restore last join code from localStorage
  try {
    const lastCode = localStorage.getItem('slv2_joinCode');
    if (lastCode) $('#joinCode').value = lastCode;
  } catch {}

  $('#hostGame').addEventListener('click', () => {
    const name = cleanText($('#hostName').value, 'Morgan', 22);
    const callsign = cleanText($('#hostCallsign').value, 'Raven', 14);
    state.localProfile.name = name;
    state.localProfile.callsign = callsign;
    saveProfile();
    // Try multiplayer first, fall back to offline
    SignalNet.hostGame(name, callsign);
    // Also set up locally in case server isn't reachable
    state.isHost = true;
    if (!SignalNet.connected) {
      state.code = generateCode();
      state.status = 'Lobby';
      state.remaining = state.duration * 60;
      state.lobbyChat = [
        { sender: 'System', text: `Mission ${state.code} created. Waiting for squad…`, timestamp: Date.now() }
      ];
      state.lobbyChatUnread = 0;
      LobbyChat.render();
      populateSetup();
      setScreen('setup');
    }
  });

  $('#joinGame').addEventListener('click', () => {
    const codeInput = $('#joinCode').value.trim().toUpperCase();
    const nameInput = cleanText($('#joinName').value, '', 22);
    const callsignInput = cleanText($('#joinCallsign').value, '', 14);
    // Validate code: WORD-WORD-XX or alphanumeric 4-20 chars
    const codeValid = /^[A-Z0-9]{2,}(?:-[A-Z0-9]{2,}){0,3}(?:-[0-9]{1,4})?$/.test(codeInput) || (codeInput.length >= 4 && codeInput.length <= 20 && /^[A-Za-z0-9-]+$/.test(codeInput));
    if (!codeValid || !codeInput) {
      addChat('System', 'Invalid join code. Use format like FIELD-RADAR-46 or 4-20 alphanumeric chars.');
      return;
    }
    if (!nameInput || !callsignInput) {
      addChat('System', 'Please enter your name and callsign.');
      return;
    }
    state.localProfile.name = nameInput;
    state.localProfile.callsign = callsignInput;
    state.joinCode = codeInput;
    state.joinName = nameInput;
    state.joinCallsign = callsignInput;
    try { localStorage.setItem('slv2_joinCode', codeInput); } catch {}
    saveProfile();
    // Try multiplayer first
    SignalNet.joinGame(codeInput, nameInput, callsignInput);
    // Fall back to offline
    if (!SignalNet.connected) {
      state.code = codeInput;
      state.isHost = false;
      state.lobbyChat = [
        { sender: 'System', text: `Linked to mission ${state.code}. Choose your role.`, timestamp: Date.now() }
      ];
      state.lobbyChatUnread = 0;
      LobbyChat.render();
      joinAgentFromLobby();
      populateRoles();
      setScreen('roles');
    }
  });

  $$('[data-theme-palette]').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themePalette));
  });
}

function setTheme(t) {
  state.themePalette = themePalettes[t] ? t : 'classic';
  document.body.dataset.theme = state.themePalette;
  $$('[data-theme-palette]').forEach(b => b.classList.toggle('selected', b.dataset.themePalette === state.themePalette));
  ensureThemeLoop();
  saveState();
}

/* ========================== SETUP ========================== */

function populateSetup() {
  const countrySel = $('#setupCountry');
  countrySel.innerHTML = Object.entries(countries).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  countrySel.value = state.country;
  renderCityOptions();
  $('#setupCity').value = state.city;
  $('#setupDuration').value = state.duration;
  $('#setupDurationValue').textContent = `${state.duration} min`;
  $('#setupPlayers').value = state.maxPlayers;
  $('#setupPlayersValue').textContent = `${state.maxPlayers} players`;
  $('#setupPublic').checked = state.isPublic;
  $('#setupCode').textContent = state.code;
  renderModuleList();
  renderMarkerList();

  // Load default location if no custom location set
  if (!state.customLocation) {
    const def = getDefaultLocation();
    if (def && Number.isFinite(def.lat) && Number.isFinite(def.lng)) {
      state.customLocation = { lat: def.lat, lng: def.lng, label: def.label };
    }
  }
  updateLocationUI();
}

function renderCityOptions() {
  $('#setupCity').innerHTML = cityKeysForCountry(state.country).map(k=>`<option value="${k}">${cities[k].name}, ${countries[cities[k].country]}</option>`).join('');
}

function renderModuleList() {
  const el = $('#moduleList');
  el.innerHTML = moduleCatalog.map(([key,name,detail])=>{
    const on = moduleEnabled(key);
    return `<button class="module-chip ${on?'enabled':''}" data-module="${key}"><strong>${name}</strong><span>${detail}</span><b>${on?'On':'Off'}</b></button>`;
  }).join('');
  el.querySelectorAll('[data-module]').forEach(b=>{
    b.addEventListener('click', ()=>{ toggleModule(b.dataset.module); });
  });
}

function toggleModule(key) {
  if (!moduleCatalog.some(([k])=>k===key)) return;
  state.enabledModules[key] = !moduleEnabled(key);
  renderModuleList();
  saveState();
}

function renderMarkerList() {
  const el = $('#markerList');
  if (!el) return;
  el.innerHTML = state.customMarkers.length
    ? state.customMarkers.map(m=>`
      <div class="marker-item">
        <div>
          <strong>${escapeHtml(m.title)}</strong>
          <div class="marker-meta">${escapeHtml(m.type)} · ${Number(m.lat).toFixed(4)}, ${Number(m.lng).toFixed(4)}</div>
        </div>
        <div class="marker-actions">
          <button class="compact-button danger-button" data-remove-marker="${m.id}">×</button>
        </div>
      </div>`).join('')
    : '<div class="marker-item" style="opacity:.6">No markers yet. Click the map to add one.</div>';
  el.querySelectorAll('[data-remove-marker]').forEach(b=>{
    b.addEventListener('click', ()=>{ state.customMarkers = state.customMarkers.filter(m=>m.id!==b.dataset.removeMarker); renderMarkerList(); saveState(); });
  });
}

function initSetup() {
  $('#setupCountry').addEventListener('change', e=>{
    state.country = e.target.value;
    const next = cityKeysForCountry(state.country)[0];
    if (next) { state.city = next; renderCityOptions(); $('#setupCity').value = next; MapModule.setCenter(...cities[next].center, 11); }
    saveState();
  });
  $('#setupCity').addEventListener('change', e=>{
    state.city = e.target.value; state.country = cities[state.city].country;
    MapModule.setCenter(...getMissionCenter(), 11);
    saveState();
  });
  $('#setupDuration').addEventListener('input', e=>{ state.duration = Number(e.target.value); $('#setupDurationValue').textContent = `${state.duration} min`; state.remaining = state.duration*60; saveState(); });
  $('#setupPlayers').addEventListener('input', e=>{ state.maxPlayers = Number(e.target.value); $('#setupPlayersValue').textContent = `${state.maxPlayers} players`; saveState(); });
  $('#setupPublic').addEventListener('change', e=>{ state.isPublic = e.target.checked; saveState(); });

  $('#addMarker').addEventListener('click', ()=>{
    const lat = parseFloat($('#markerLat')?.value);
    const lng = parseFloat($('#markerLng')?.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const title = ($('#markerTitle').value || `Marker ${state.customMarkers.length+1}`).trim();
    const type = $('#markerType').value;
    state.customMarkers.push({ id: `cm_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, title, type, lat, lng, taskState:'armed' });
    $('#markerTitle').value = '';
    renderMarkerList();
    renderSetupMarkersOnMap();
    saveState();
  });

  $('#clearMarkers').addEventListener('click', ()=>{
    if (!state.customMarkers.length) return;
    if (!confirm('Clear all custom markers?')) return;
    state.customMarkers = [];
    renderMarkerList();
    renderSetupMarkersOnMap();
    saveState();
  });

  $('#launchMission').addEventListener('click', ()=>{
    generateObjectives();
    generateThreats();
    state.localRole = null;
    SignalNet.launchMission();
    // Fall back to local if not connected
    if (!SignalNet.connected || !SignalNet.isHost) {
      setScreen('roles');
    }
  });

  $('#backToLobby').addEventListener('click', ()=> setScreen('lobby'));
  $('#backToSetup').addEventListener('click', ()=> setScreen('setup'));

  // === Location pick mode toggle ===
  $('#locMapMode').addEventListener('click', ()=>{
    state.locMapMode = !state.locMapMode;
    $('#locMapMode').textContent = state.locMapMode ? '📍 Click map → Set location' : '📍 Pick on map';
    if (state.locMapMode) {
      // Enter pick mode — clear custom marker coords so user doesn't confuse
      $('#markerLat').value = '';
      $('#markerLng').value = '';
    }
  });

  // === Clear custom location ===
  $('#clearCustomLocation').addEventListener('click', ()=>{
    state.customLocation = null;
    updateLocationUI();
    renderSetupMarkersOnMap();
    saveState();
  });

  // === Save favorite location ===
  $('#saveFavoriteLocation').addEventListener('click', ()=>{
    const loc = state.customLocation;
    if (loc) {
      saveFavoriteLocation(loc.lat, loc.lng, 'Custom');
      return;
    }
    // Use current city selection
    const city = cities[state.city];
    if (city) {
      const name = prompt('Name this favorite location:', city.name);
      if (name && name.trim()) {
        saveFavoriteLocation(city.center[0], city.center[1], name.trim());
      }
    }
  });

  // === Load favorite location ===
  $('#loadFavoriteLocation').addEventListener('change', (e)=>{
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('|');
    if (parts.length >= 3) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      const name = parts[2];
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        state.customLocation = { lat, lng, label: name };
        updateLocationUI();
        renderSetupMarkersOnMap();
        MapModule.setCenter(lat, lng, 12);
        saveState();
      }
    }
    e.target.value = ''; // reset
  });

  // === Set default location ===
  $('#setDefaultLocation').addEventListener('click', ()=>{
    let lat, lng, label;
    if (state.customLocation) {
      lat = state.customLocation.lat;
      lng = state.customLocation.lng;
      label = state.customLocation.label;
    } else {
      const city = cities[state.city];
      if (!city) return;
      lat = city.center[0];
      lng = city.center[1];
      label = city.name;
    }
    try {
      localStorage.setItem('slv2_defaultLocation', JSON.stringify({ lat, lng, label }));
      updateLocationUI();
    } catch(e) {}
  });

  // === Clear default location ===
  $('#clearDefaultLocation').addEventListener('click', ()=>{
    try { localStorage.removeItem('slv2_defaultLocation'); } catch(e) {}
    updateLocationUI();
  });

  // === Populate favorites dropdown ===
  populateFavorites();
}

/* ========================== LOCATION FAVORITES ========================== */

function updateLocationUI() {
  const info = $('#customLocationInfo');
  const coords = $('#customLocationCoords');
  const defBtn = $('#setDefaultLocation');
  if (state.customLocation) {
    info.style.display = 'flex';
    coords.textContent = `${state.customLocation.label} · ${state.customLocation.lat.toFixed(4)}, ${state.customLocation.lng.toFixed(4)}`;
    MapModule.setCenter(state.customLocation.lat, state.customLocation.lng, 12);
  } else {
    info.style.display = 'none';
  }
  // Check if default is set
  try {
    const def = JSON.parse(localStorage.getItem('slv2_defaultLocation') || 'null');
    if (def) {
      defBtn.title = `Default: ${def.label}`;
    } else {
      defBtn.title = 'Set as default for new games';
    }
  } catch(e) {}
}

function getDefaultLocation() {
  try {
    return JSON.parse(localStorage.getItem('slv2_defaultLocation') || 'null');
  } catch(e) { return null; }
}

function saveFavoriteLocation(lat, lng, name) {
  try {
    let favs = JSON.parse(localStorage.getItem('slv2_favoriteLocations') || '[]');
    if (!Array.isArray(favs)) favs = [];
    // Avoid duplicates (same coords)
    favs = favs.filter(f => !(Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lng - lng) < 0.001));
    favs.push({ lat, lng, name, createdAt: Date.now() });
    if (favs.length > 20) favs = favs.slice(-20); // max 20
    localStorage.setItem('slv2_favoriteLocations', JSON.stringify(favs));
    populateFavorites();
  } catch(e) {}
}

function populateFavorites() {
  const sel = $('#loadFavoriteLocation');
  if (!sel) return;
  try {
    let favs = JSON.parse(localStorage.getItem('slv2_favoriteLocations') || '[]');
    if (!Array.isArray(favs)) favs = [];
    sel.innerHTML = '<option value="">— Favorites —</option>';
    // Also show default as first option if set
    const def = getDefaultLocation();
    if (def) {
      const opt = document.createElement('option');
      opt.value = `${def.lat}|${def.lng}|${def.label} ⭐`;
      opt.textContent = `⭐ Default: ${def.label}`;
      sel.appendChild(opt);
    }
    favs.forEach(f => {
      const opt = document.createElement('option');
      opt.value = `${f.lat}|${f.lng}|${f.name}`;
      opt.textContent = `${f.name} (${f.lat.toFixed(3)}, ${f.lng.toFixed(3)})`;
      sel.appendChild(opt);
    });
  } catch(e) {}
}

function renderSetupMarkersOnMap() {
  const m = MapModule.ensureSetupMap(); if (!m) return;
  // Track custom marker layers to remove only those
  if (!m._setupMarkerLayers) m._setupMarkerLayers = [];
  m._setupMarkerLayers.forEach(l => m.removeLayer(l));
  m._setupMarkerLayers = [];
  const center = getMissionCenter();
  const hq = L.marker(center, { icon: L.divIcon({className:'', html:'<span style="background:#ffd965;color:#000;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">HQ</span>', iconSize:[40,20], iconAnchor:[20,10]}) }).addTo(m);
  m._setupMarkerLayers.push(hq);

  // Custom location pin (from map pick or default)
  const cl = state.customLocation;
  if (cl && Number.isFinite(cl.lat) && Number.isFinite(cl.lng)) {
    const clPin = L.marker([cl.lat, cl.lng], {
      icon: L.divIcon({className:'', html:'<span style="width:32px;height:32px;background:#ffd965;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 20px #ffd96580;">📍</span>', iconSize:[32,32], iconAnchor:[16,16]})
    }).bindPopup('<strong>📍 Mission Location</strong><br>'+escapeHtml(cl.label)+(getDefaultLocation() && Math.abs(getDefaultLocation().lat-cl.lat)<0.001 && Math.abs(getDefaultLocation().lng-cl.lng)<0.001 ? ' ⭐ Default' : '')).addTo(m);
    m._setupMarkerLayers.push(clPin);
  }
  state.customMarkers.forEach(cm => {
    const color = {Clue:'#ff9800',Cache:'#4caf50',Waypoint:'#00bcd4',Danger:'#e45b4d',Extraction:'#00e676'}[cm.type] || '#9e9e9e';
    const mk = L.marker([cm.lat, cm.lng], {
      icon: L.divIcon({className:'', html:'<span style="width:26px;height:26px;background:'+color+';border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;">'+cm.type[0]+'</span>', iconSize:[26,26], iconAnchor:[13,13]})
    }).bindPopup('<strong>'+escapeHtml(cm.title)+'</strong><br>'+escapeHtml(cm.type)).addTo(m);
    m._setupMarkerLayers.push(mk);
  });
}

/* ========================== ROLES SCREEN ========================== */

function renderRolesScreen() {
  $('#rolesCode').textContent = state.code;
  renderRoleCards();
  renderRoster();
}

function renderRoleCards() {
  const grid = $('#roleGrid');
  const roles = Object.keys(roleCatalog);
  grid.innerHTML = roles.map(role => {
    const color = roleColors[role] || '#9e9e9e';
    const duties = roleCatalog[role] || [];
    const emoji = roleEmojis[role] || '';
    const selected = state.localRole === role ? 'selected' : '';
    return `<div class="role-card ${selected}" data-role="${role}" style="--role-color:${color};--role-glow:${color}40;">
      <span class="role-emoji">${emoji}</span>
      <h4>${role}</h4>
      <div class="role-duties">${duties.map(d => '• ' + d).join('<br>')}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      const role = card.dataset.role;
      state.localRole = role;
      renderRoleCards();
      renderRoster();
      saveState();
    });
  });
}

function renderRoster() {
  const list = $('#rosterList');
  // Determine local team
  const localTeam = state.isHost ? 'North' : 'South';
  // Show team badge
  const badge = $('#rosterTeamBadge');
  if (badge) {
    badge.textContent = `TEAM ${localTeam}`;
    badge.className = `team-badge ${localTeam.toLowerCase()}`;
    badge.classList.remove('hidden');
  }
  // Build roster: local player + bot agents
  const roster = [];
  // Local player
  roster.push({
    id: 'local',
    name: state.localProfile.name + ' ' + state.localProfile.callsign,
    role: state.localRole || '—',
    isLocal: true,
    team: localTeam
  });
  // Bot agents
  const roleKeys = Object.keys(roleCatalog);
  const availableRoles = roleKeys.filter(r => r !== state.localRole);
  for (let i = 0; i < Math.min(state.maxPlayers - 1, 6); i++) {
    const role = availableRoles[i % availableRoles.length];
    const botNames = ['Ada', 'Mika', 'Rune', 'Liv', 'Echo', 'Kai'];
    roster.push({
      id: `bot-${i}`,
      name: botNames[i % botNames.length],
      role: role,
      isLocal: false,
      team: i % 2 === 0 ? 'North' : 'South'
    });
  }
  list.innerHTML = roster.map(item => {
    const color = roleColors[item.role] || '#9e9e9e';
    const localClass = item.isLocal ? 'local-agent' : '';
    const teamStr = item.team ? ` · ${item.team}` : '';
    return `<div class="roster-item ${localClass}">
      <span class="roster-dot" style="background:${color}"></span>
      <strong>${escapeHtml(item.name)}</strong>
      <span class="roster-role" style="color:${color}">${item.isLocal ? '🧑 ' : '🤖 '}${item.role}${teamStr}</span>
    </div>`;
  }).join('');
}

function initRolesScreen() {
  $('#readyToMission').addEventListener('click', () => {
    if (!state.localRole) {
      addChat('System', 'Please select a role before launching.');
      return;
    }
    // Create all agents (local + bots)
    state.agents = [];
    state.scores = { North: 0, South: 0 };
    // Local player — assign team based on host/join
    const localTeam = state.isHost ? 'North' : 'South';
    const [lat, lng] = jitter(getMissionCenter(), 0.004);
    const localAgent = {
      id: `agent-${Math.random().toString(36).slice(2,9)}`,
      name: state.localProfile.name,
      callsign: state.localProfile.callsign,
      role: state.localRole,
      team: localTeam,
      lat, lng,
      signal: 78,
      stamina: 92,
      lastSeen: Date.now()
    };
    state.localAgentId = localAgent.id;
    state.agents.push(localAgent);
    // Bot agents
    const roleKeys = Object.keys(roleCatalog);
    const availableRoles = roleKeys.filter(r => r !== state.localRole);
    const botNames = ['Ada', 'Mika', 'Rune', 'Liv', 'Echo', 'Kai'];
    for (let i = 0; i < Math.min(state.maxPlayers - 1, 6); i++) {
      const role = availableRoles[i % availableRoles.length];
      const [ba, bn] = jitter(getMissionCenter(), 0.009);
      const team = i % 2 === 0 ? 'North' : 'South';
      state.agents.push({
        id: `bot-${i}-${Date.now()}`,
        name: botNames[i % botNames.length],
        callsign: botNames[i % botNames.length].toUpperCase(),
        role: role,
        team: team,
        lat: ba, lng: bn,
        signal: 62 + Math.round(Math.random() * 30),
        stamina: 70 + Math.round(Math.random() * 25),
        bot: true,
        lastSeen: Date.now()
      });
    }
    saveState();
    setScreen('mission');
    startMissionClock();
  });
}

/* ========================== AGENTS / OBJECTIVES / THREATS ========================== */

function joinAgentFromLobby() {
  const role = Object.keys(roleCatalog)[0];
  const [lat, lng] = jitter(getMissionCenter(), 0.004);
  const agent = {
    id: `agent-${Math.random().toString(36).slice(2,9)}`,
    name: state.localProfile.name,
    callsign: state.localProfile.callsign,
    role,
    team: 'South',
    lat, lng,
    signal: 78,
    stamina: 92,
    lastSeen: Date.now()
  };
  state.localAgentId = agent.id;
  state.agents.push(agent);
  // Add bots
  while (state.agents.length < Math.min(4, state.maxPlayers)) {
    const r = Object.keys(roleCatalog)[state.agents.length % Object.keys(roleCatalog).length];
    const [la, ln] = jitter(getMissionCenter(), 0.009);
    state.agents.push({
      id: `bot-${state.agents.length}`,
      name: ['Ada','Mika','Rune','Liv'][state.agents.length-1] || `Bot ${state.agents.length}`,
      role: r, team: state.agents.length%2?'North':'South',
      lat: la, lng: ln, signal: 62+Math.round(Math.random()*30), stamina: 70+Math.round(Math.random()*25),
      bot: true, lastSeen: Date.now()
    });
  }
  // Generate objectives so they exist when entering mission
  if (!state.objectives.length) generateObjectives();
  if (!state.threats.length) generateThreats();
  saveState();
}

function populateRoles() {
  // Set up role screen data when joining via code
  state.scores = { North: 0, South: 0 };
  state.localRole = null;
  state.status = 'Lobby';
  state.remaining = state.duration * 60;
  // Store join info for localStorage recall
  try { localStorage.setItem('slv2_joinCode', state.joinCode); } catch {}
}

function generateObjectives() {
  const center = getMissionCenter();
  const types = [
    ...enabledPack('ciphers'), ...enabledPack('treasure'), ...enabledPack('waypoints'),
    ...customMarkerObjectives(),
    ...missionPacks.extraction
  ];
  state.objectives = types.map(([title, type, radius, brief, meta={}], i) => {
    const marker = meta.source==='custom' ? state.customMarkers.find(m=>m.id===meta.markerId && markerInArea(m)) : null;
    const [lat, lng] = marker ? [marker.lat, marker.lng] : jitter(center, 0.006 + i*0.0018);
    return { id:`obj-${i}`, title, type, brief, radius, lat, lng, decoded: i===0, found: false, progress: i===0?22:0, source: meta.source||'pack', markerId: meta.markerId||'' };
  });
}

function customMarkerObjectives() {
  return state.customMarkers.filter(markerInArea).filter(m=>customMarkerTypeBehaviors[m.type]?.objective).map(m=>[
    m.title, m.type, (m.radius||25)+(customMarkerTypeBehaviors[m.type]?.radiusOffset||0),
    customMarkerTypeBehaviors[m.type]?.detail || m.title,
    { source:'custom', markerId: m.id, behavior: m.type, behaviorLabel: customMarkerTypeBehaviors[m.type]?.label }
  ]);
}

function markerInArea(m) {
  if (!m || !Number.isFinite(Number(m.lat)) || !Number.isFinite(Number(m.lng))) return false;
  return haversine({lat:m.lat, lng:m.lng}, {lat:getMissionCenter()[0], lng:getMissionCenter()[1]}) <= 1800;
}

function generateThreats() {
  const center = getMissionCenter();
  const seeds = [['Jammer Kestrel',135,0.008,0.00042],['Hunter Relay',115,0.011,0.00034],['False Beacon',95,0.0065,0.0005]];
  state.threats = seeds.map(([name, radius, spread, speed], i)=>{
    const [lat, lng] = jitter(center, spread);
    return { id:`threat-${i}`, name, radius, lat, lng, angle: Math.random()*Math.PI*2, speed, alert: false, lastHit: 0, mode: 'patrol', huntCooldown: 0, targetId: null };
  });
}

function updateLocalAgentPosition(lat, lng, accuracy) {
  const local = state.agents.find(a=>a.id===state.localAgentId);
  if (!local) return;
  local.lat = lat; local.lng = lng; local.lastSeen = Date.now();
  if (Number.isFinite(accuracy)) local.gpsAccuracy = Math.round(accuracy);
  // Track player path for replay
  if (state.status === 'Live') {
    state.playerPath.push({ lat, lng, timestamp: Date.now() });
    // Limit path size to avoid memory bloat
    if (state.playerPath.length > 2000) state.playerPath = state.playerPath.slice(-1500);
  }
  $('#manualLat').value = lat.toFixed(6);
  $('#manualLng').value = lng.toFixed(6);
  renderMissionMap();
  renderHUD();
  saveState();
}

/* ========================== MISSION ========================== */

function initMission() {
  // Sound init on first user interaction
  const initSound = () => {
    if (!SoundFX.inited) {
      SoundFX.init();
      document.removeEventListener('click', initSound);
      document.removeEventListener('touchstart', initSound);
    }
  };
  document.addEventListener('click', initSound);
  document.addEventListener('touchstart', initSound);

  // Stealth toggle
  $('#toggleStealth').addEventListener('click', ()=>{
    StealthMode.toggle();
  });

  // Radar toggle
  $('#toggleRadar').addEventListener('click', ()=>{
    RadarModule.toggle();
  });

  // Fullscreen radar toggle
  $('#fullscreenRadar').addEventListener('click', ()=>{
    RadarModule.toggleFullscreen();
    const btn = $('#fullscreenRadar');
    btn.textContent = RadarModule.fullscreen ? '🔲' : '🔄';
    btn.title = RadarModule.fullscreen ? 'Minimize Radar' : 'Full Radar';
  });
  // Escape key exits fullscreen radar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && RadarModule.fullscreen) {
      RadarModule.toggleFullscreen();
      const btn = $('#fullscreenRadar');
      btn.textContent = '🔄';
      btn.title = 'Full Radar';
    }
  });

  // Radar filter UI in panels drawer
  (function initRadarFilters() {
    // Range slider
    const rangeSlider = $('#radarRangeSlider');
    const rangeLabel = $('#radarRangeLabel');
    if (rangeSlider && rangeLabel) {
      rangeSlider.value = RadarModule.range;
      rangeLabel.textContent = RadarModule.range + 'm';
      rangeSlider.addEventListener('input', () => {
        RadarModule.range = parseInt(rangeSlider.value);
        rangeLabel.textContent = RadarModule.range + 'm';
      });
    }
    // Filter chips
    $$('.radar-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        if (!filter || !(filter in RadarModule.filters)) return;
        RadarModule.filters[filter] = !RadarModule.filters[filter];
        chip.classList.toggle('active');
      });
    });
    // Toggle radar button
    const toggleBtn = $('#radarToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        RadarModule.toggle();
        toggleBtn.textContent = RadarModule.open ? 'Toggle Radar' : 'Enable Radar';
      });
    }
    // Fullscreen button
    const fsBtn = $('#radarFullscreenBtn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        RadarModule.toggleFullscreen();
        fsBtn.textContent = RadarModule.fullscreen ? 'Fullscreen' : 'Minimize';
      });
    }
    // Reset all filters
    const resetBtn = $('#radarResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.keys(RadarModule.filters).forEach(k => {
          RadarModule.filters[k] = true;
          const chip = document.querySelector(`.radar-filter-chip[data-filter="${k}"]`);
          if (chip) chip.classList.add('active');
        });
        RadarModule.range = 200;
        if (rangeSlider) rangeSlider.value = 200;
        if (rangeLabel) rangeLabel.textContent = '200m';
        // Exit fullscreen if active
        if (RadarModule.fullscreen) RadarModule.exitFullscreen();
        if (toggleBtn) toggleBtn.textContent = 'Toggle Radar';
      });
    }
  })();

  // Panel toggle (opens drawer on mobile, slides on desktop)
  $('#togglePanels').addEventListener('click', ()=>{
    state.panelsOpen = !state.panelsOpen;
    document.body.dataset.panels = state.panelsOpen ? 'open' : 'hidden';
    const panels = $('#missionPanels');
    if (state.panelsOpen) {
      $('#panelDrawerOverlay').classList.remove('hidden');
      // Default to compact snap on mobile
      if (panels && window.innerWidth <= 768) {
        panels.dataset.snap = 'compact';
      }
    } else {
      $('#panelDrawerOverlay').classList.add('hidden');
      if (panels) panels.dataset.snap = 'compact';
    }
  });

  // Panel drawer overlay click to close — only when clicking the overlay itself, not bubbled from drawer
  $('#panelDrawerOverlay').addEventListener('click', (e)=>{
    if (e.target !== e.currentTarget && !e.target.classList.contains('panel-drawer-overlay')) return;
    state.panelsOpen = false;
    document.body.dataset.panels = 'hidden';
    $('#panelDrawerOverlay').classList.add('hidden');
  });
  // Prevent drawer clicks from bubbling to overlay
  $('#missionPanels').addEventListener('click', (e)=>{
    e.stopPropagation();
  });

  // Mobile comms mini-bar: panels button
  const cmbPanels = $('#cmbPanelsBtn');
  if (cmbPanels) {
    cmbPanels.addEventListener('click', ()=>{
      state.panelsOpen = true;
      document.body.dataset.panels = 'open';
      $('#panelDrawerOverlay').classList.remove('hidden');
      // Switch to comms tab
      const commsTab = document.querySelector('.panel-tab[data-panel-tab="comms"]');
      if (commsTab) commsTab.click();
    });
  }
  // Mobile comms mini-bar: voice button
  const cmbVoice = $('#cmbVoiceBtn');
  if (cmbVoice) {
    cmbVoice.addEventListener('click', ()=>{
      const voiceBtn = $('#toggleVoice');
      if (voiceBtn) voiceBtn.click();
    });
  }

  // Panel tab switching
  $$('.panel-tab').forEach(tab => {
    tab.addEventListener('click', ()=>{
      $$('.panel-tab').forEach(t => t.classList.remove('active'));
      $$('.panel-view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      const view = document.querySelector(`[data-panel-view="${tab.dataset.panelTab}"]`);
      if (view) view.classList.add('active');
    });
  });

  // Drawer drag handle for snap points on mobile
  (function initDrawerDrag() {
    const handle = document.querySelector('#missionPanels .drawer-handle');
    const panels = $('#missionPanels');
    if (!handle || !panels) return;

    let startY = 0;
    let startSnap = 'compact';
    let isDragging = false;

    const onStart = (y) => {
      if (!state.panelsOpen) return;
      startY = y;
      startSnap = panels.dataset.snap || 'compact';
      isDragging = true;
      panels.style.transition = 'none';
    };

    const onMove = (y) => {
      if (!isDragging) return;
      const delta = startY - y; // positive = dragging up
      // Visual follow during drag (optional, simplified)
      if (delta > 40 && startSnap === 'compact') {
        // Will snap to expanded on release
      } else if (delta < -40 && startSnap === 'expanded') {
        // Will snap to compact on release
      }
    };

    const onEnd = (y) => {
      if (!isDragging) return;
      isDragging = false;
      panels.style.transition = '';
      const delta = startY - y;
      if (Math.abs(delta) < 30) {
        // Tap on handle: toggle between compact/expanded
        panels.dataset.snap = startSnap === 'compact' ? 'expanded' : 'compact';
        return;
      }
      if (delta > 0 && startSnap === 'compact') {
        panels.dataset.snap = 'expanded';
      } else if (delta < 0 && startSnap === 'expanded') {
        panels.dataset.snap = 'compact';
      }
    };

    handle.addEventListener('touchstart', (e) => {
      onStart(e.touches[0].clientY);
    }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      onMove(e.touches[0].clientY);
    }, { passive: true });
    handle.addEventListener('touchend', (e) => {
      onEnd(e.changedTouches[0].clientY);
    }, { passive: true });
    handle.addEventListener('mousedown', (e) => {
      onStart(e.clientY);
      const move = (ev) => onMove(ev.clientY);
      const up = (ev) => { onEnd(ev.clientY); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
  })();

  // GPS focus
  $('#focusGps').addEventListener('click', ()=>{
    const local = state.agents.find(a=>a.id===state.localAgentId);
    if (local) MapModule.setCenter(local.lat, local.lng, 16);
  });

  // HUD overflow menu toggle
  $('#hudOverflowToggle').addEventListener('click', (e)=>{
    e.stopPropagation();
    const menu = $('#hudOverflowMenu');
    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open');
    // Close on any click outside
    if (!isOpen) {
      const close = (ev) => {
        if (!ev.target.closest('#hudOverflow')) {
          menu.classList.remove('open');
          document.removeEventListener('click', close);
        }
      };
      // Delay to avoid immediate close from this click
      setTimeout(() => document.addEventListener('click', close), 10);
    }
  });

  // Floating GPS button
  $('#floatingGpsBtn').addEventListener('click', ()=>{
    const local = state.agents.find(a=>a.id===state.localAgentId);
    if (local) MapModule.setCenter(local.lat, local.lng, 16);
  });

  // GPS controls
  $('#startGps').addEventListener('click', ()=> MapModule.startGPS());
  $('#stopGps').addEventListener('click', ()=> MapModule.stopGPS());
  $('#toggleBatterySaver').addEventListener('click', ()=> BatteryAwareGPS.toggleSaver());
  $('#applyManualGps').addEventListener('click', ()=>{
    const lat = parseFloat($('#manualLat').value);
    const lng = parseFloat($('#manualLng').value);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180) {
      MapModule.setPlayerPosition(lat, lng);
      updateLocalAgentPosition(lat, lng, null);
    }
  });

  // Chat — sends locally AND broadcasts if multiplayer
  $('#chatForm').addEventListener('submit', e=>{
    e.preventDefault();
    const input = $('#chatInput');
    if (!input.value.trim()) return;
    const text = input.value.trim();
    addChat('Mission Control', text);
    SignalNet.sendChat(text);
    input.value = '';
  });

  // End mission button in HUD → show confirm dialog
  $('#endMissionBtn').addEventListener('click', ()=>{
    $('#confirmEndDialog').classList.remove('hidden');
  });

  // Confirm dialog
  $('#confirmEndYes').addEventListener('click', ()=>{
    $('#confirmEndDialog').classList.add('hidden');
    stopMissionClock();
    MapModule.stopGPS();
    state.status = 'Complete';
    setScreen('results');
    renderResults();
  });
  $('#confirmEndNo').addEventListener('click', ()=>{
    $('#confirmEndDialog').classList.add('hidden');
  });
  // Close confirm dialog on overlay click
  $('#confirmEndDialog').addEventListener('click', (e)=>{
    if (e.target === e.currentTarget) {
      $('#confirmEndDialog').classList.add('hidden');
    }
  });
}

function startMissionClock() {
  stopMissionClock();
  state.status = 'Live';
  state.remaining = state.duration * 60;
  state.missionStartTime = Date.now();
  SoundFX.missionStart();
  let lastTickMinute = Math.ceil(state.remaining / 60);
  timerId = setInterval(()=>{
    state.remaining = Math.max(0, state.remaining-1);
    // Extraction countdown tick
    if (state.extracting && state.extractCountdown > 0) {
      state.extractCountdown = Math.max(0, state.extractCountdown - 1);
      updateExtractionOverlay();
      // Tick sound: every second, last 5 seconds faster (every beat)
      if (state.extractCountdown <= 5) {
        SoundFX.timerTick();
      } else if (state.extractCountdown % 2 === 0) {
        SoundFX.timerTick();
      }
    }
    // Timer warnings at thresholds
    TimerWarnings.check(state.remaining);
    // Timer tick sound in last 60 seconds
    const currentMinute = Math.ceil(state.remaining / 60);
    if (state.remaining <= 60 && state.remaining > 0 && state.remaining % 5 === 0) {
      SoundFX.timerTick();
    }
    if (state.remaining <= 0) {
      stopMissionClock(); state.status='Complete';
      SoundFX.missionComplete();
      setScreen('results'); renderResults();
    }
    renderHUD();
    saveState();
  }, 1000);
  simId = setInterval(simulateWorld, 2500);
  renderHUD();
}

function stopMissionClock() {
  if (timerId) clearInterval(timerId); timerId = null;
  if (simId) clearInterval(simId); simId = null;
  state.extracting = false;
  state.extractCountdown = 0;
  $('#extractionOverlay')?.classList.add('hidden');
  TimerWarnings.stop();
}

function simulateWorld() {
  if (state.status !== 'Live') return;
  const center = getMissionCenter();

  // --- THREAT HUNTING ---
  state.threats.forEach((t, i)=>{
    const nearest = state.agents.reduce((best, a) => {
      const d = haversine(a, t);
      return d < (best.d || Infinity) ? { agent: a, d } : best;
    }, {}).agent;
    const nearestDist = nearest ? haversine(nearest, t) : Infinity;

    // Hunt mode: within detection range of a player (stealth reduces range)
    const detectRange = (nearest && nearest.id === state.localAgentId)
      ? StealthMode.getEffectiveDetectRange(400)
      : 400;
    if (nearestDist < detectRange && nearest) {
      t.mode = 'hunt';
      t.huntCooldown = Date.now() + 10000; // 10s hunt
      t.targetId = nearest.id;
    } else if (t.mode === 'hunt' && Date.now() > t.huntCooldown) {
      t.mode = 'patrol';
      t.targetId = null;
    }

    if (t.mode === 'hunt' && t.targetId) {
      // Move toward target at 2x speed
      const target = state.agents.find(a => a.id === t.targetId);
      if (target) {
        const dLat = target.lat - t.lat;
        const dLng = target.lng - t.lng;
        const dist = Math.sqrt(dLat*dLat + dLng*dLng);
        if (dist > 0.0001) {
          const huntSpeed = (t.speed || 0.00038) * 2;
          t.lat += (dLat / dist) * huntSpeed;
          t.lng += (dLng / dist) * huntSpeed;
        }
      } else {
        t.mode = 'patrol';
        t.targetId = null;
      }
    } else {
      // Patrol mode: orbit city center
      t.angle = (t.angle||0)+0.38+i*0.08;
      const orbit = t.speed||0.00038;
      t.lat += Math.sin(t.angle)*orbit;
      t.lng += Math.cos(t.angle*0.9)*orbit*1.25;
      // Drift back toward center if too far
      if (haversine({lat:t.lat, lng:t.lng}, {lat:center[0], lng:center[1]}) > 1450) {
        const [la, ln] = jitter(center, 0.01); t.lat=la; t.lng=ln;
      }
    }

    // Jamming logic (stealth reduces threat effective radius against local player)
    const exposed = state.agents.filter(a => {
      const d = haversine(a, t);
      if (a.id === state.localAgentId && state.stealth) {
        return d <= t.radius * StealthMode.DETECT_RANGE_MULT;
      }
      return d <= t.radius;
    });
    const wasAlert = t.alert;
    t.alert = exposed.length>0;
    if (t.alert && !wasAlert) {
      SoundFX.threatDetected();
    }
    if (exposed.length && Date.now() - (t.lastHit||0) > 9000) {
      exposed.forEach(a=>{ a.signal=clamp(a.signal-8,24,98); a.stamina=clamp(a.stamina-4,20,100); });
      t.lastHit = Date.now();
      addChat('AI Watch', `${t.name} jammed ${exposed.map(a=>a.name).join(', ')}.`);
    }
  });

  // --- EXTRACTION COUNTDOWN ---
  if (state.extracting) {
    const extractionObj = state.objectives.find(o => o.type==='Extraction');
    const local = state.agents.find(a=>a.id===state.localAgentId);
    if (!local || !extractionObj || haversine(local, extractionObj) > 80) {
      // Player left extraction zone — reset
      state.extracting = false;
      state.extractCountdown = 15;
      $('#extractionOverlay')?.classList.add('hidden');
      addChat('System', 'Extraction sequence aborted — you left the zone.');
      return;
    }
    // Threats move toward extraction during countdown
    state.threats.forEach(t => {
      const dLat = extractionObj.lat - t.lat;
      const dLng = extractionObj.lng - t.lng;
      const dist = Math.sqrt(dLat*dLat + dLng*dLng);
      if (dist > 0.0005) {
        const rushSpeed = (t.speed || 0.00038) * 1.5;
        t.lat += (dLat / dist) * rushSpeed;
        t.lng += (dLng / dist) * rushSpeed;
      }
      t.mode = 'hunt'; // All threats converge
    });
  }

  // Apply stealth movement penalty to local player
  const speedMult = StealthMode.getSpeedMultiplier();
  StealthMode.tick();
  BatteryAwareGPS.tick();

  state.agents.forEach(a=>{
    const isLocal = a.id === state.localAgentId;
    const mult = isLocal ? speedMult : 1.0;
    a.lat += (Math.random()-0.5)*0.0011 * mult;
    a.lng += (Math.random()-0.5)*0.0014 * mult;
    a.signal = clamp(a.signal + Math.round(Math.random()*10-5), 38, 98);
    a.stamina = clamp(a.stamina + Math.round(Math.random()*6-4), 35, 100);
  });
  state.objectives.forEach(o=>{
    if (!o.decoded || o.found) return;
    const nearest = nearestAgentDist(o);
    o.progress = clamp(o.progress + (nearest<180?8:2), 0, 100);
    if (nearest <= o.radius || o.progress >= 100) {
      o.found = true; o.progress = 100;
      ObjectiveAutoFocus.focusNext();
      // Score: award points to team of nearest agent
      const nearestAgent = state.agents.reduce((best, a) => {
        const d = haversine(a, o);
        return d < (best.d || Infinity) ? { agent: a, d } : best;
      }, {}).agent;
      if (nearestAgent && nearestAgent.team && state.scores[nearestAgent.team] !== undefined) {
        const pts = o.type === 'Extraction' ? 50 : o.type === 'Waypoint' ? 30 : 25;
        state.scores[nearestAgent.team] += pts;
        addChat('Score', `${nearestAgent.team} +${pts}pts for ${o.title}.`);
        SoundFX.scoreEvent();
      } else {
        addChat('Mission Control', `${o.title} complete.`);
        SoundFX.beaconCollected();
      }
    }
  });
  // Check mission completion: all objectives found + player near extraction
  const allFound = state.objectives.length && state.objectives.every(o=>o.found);
  const extractionObj = state.objectives.find(o => o.type==='Extraction');
  const local = state.agents.find(a=>a.id===state.localAgentId);
  let nearExtraction = false;
  if (extractionObj && local) {
    nearExtraction = haversine(local, extractionObj) <= 80; // 80m threshold
  }

  // Start extraction countdown if all found and near extraction
  if (allFound && nearExtraction && !state.extracting) {
    state.extracting = true;
    state.extractCountdown = 15;
    addChat('System', 'Extraction sequence initiated. Hold position for 15s...');
    showExtractionOverlay();
    return;
  }

  if (state.extracting && state.extractCountdown <= 0) {
    // Extraction complete!
    state.extracting = false;
    state.extractCountdown = 0;
    $('#extractionOverlay')?.classList.add('hidden');
    state.status = 'Complete';
    state.missionEndTime = Date.now();
    SoundFX.missionComplete();
    setScreen('results');
    renderResults();
    addChat('System', 'Extraction successful. Mission complete.');
    stopMissionClock();
    return;
  }

  if (allFound && !extractionObj) {
    stopMissionClock(); state.status='Complete';
    state.missionEndTime = Date.now();
    SoundFX.missionComplete();
    setScreen('results'); renderResults();
    addChat('System', 'All objectives complete. Signal restored.');
    return;
  }
  renderMissionMap();
  renderHUD();
  renderObjectivesList();
  renderRoleTools();
  ThreatProximity.update();
  saveState();
}

function nearestAgentDist(point) {
  if (!state.agents.length) return Infinity;
  return Math.min(...state.agents.map(a=>haversine(a, point)));
}

function showExtractionOverlay() {
  const overlay = $('#extractionOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    updateExtractionOverlay();
  }
}

function updateExtractionOverlay() {
  const progress = ((15 - state.extractCountdown) / 15) * 100;
  const bar = $('#extractionProgress');
  const timer = $('#extractionTimer');
  if (bar) bar.style.width = `${Math.min(100, progress)}%`;
  if (timer) {
    timer.textContent = state.extractCountdown;
    timer.classList.toggle('urgent', state.extractCountdown <= 5);
  }
}

function renderHUD() {
  $('#missionTimer').textContent = formatTime(state.remaining);
  $('#missionStatus').textContent = state.status;
  const avgSignal = state.agents.length ? Math.round(state.agents.reduce((s,a)=>s+a.signal,0)/state.agents.length) : 72;
  const avgStamina = state.agents.length ? Math.round(state.agents.reduce((s,a)=>s+a.stamina,0)/state.agents.length) : 85;
  const signalBar = $('#hudSignalBar');
  const staminaBar = $('#hudStaminaBar');
  if (signalBar) signalBar.style.width = `${avgSignal}%`;
  if (staminaBar) staminaBar.style.width = `${avgStamina}%`;
  $('#objCount').textContent = `${state.objectives.filter(o=>o.found).length}/${state.objectives.length}`;
  // Update stealth button state
  StealthMode._updateUI();
  // Render mobile drawer bars
  renderDrawerBars(avgSignal, avgStamina);
}

function renderDrawerBars(avgSignal, avgStamina) {
  // Only on mobile: inject signal/stamina bars into the drawer
  if (window.innerWidth > 768) return;
  const panels = $('#missionPanels');
  if (!panels) return;
  let bars = panels.querySelector('.panel-drawer-bars');
  if (!bars) {
    bars = document.createElement('div');
    bars.className = 'panel-drawer-bars';
    bars.innerHTML = `
      <div class="hud-bar-row">
        <span class="hud-bar-label">SIG</span>
        <div class="hud-bar-track"><div class="hud-bar-fill signal-fill" style="width:${avgSignal}%"></div></div>
      </div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">STA</span>
        <div class="hud-bar-track"><div class="hud-bar-fill stamina-fill" style="width:${avgStamina}%"></div></div>
      </div>
    `;
    const tabs = panels.querySelector('.panel-tabs');
    if (tabs && tabs.nextSibling) {
      panels.insertBefore(bars, tabs.nextSibling);
    } else if (tabs) {
      panels.appendChild(bars);
    }
  } else {
    const sigFill = bars.querySelector('.signal-fill');
    const staFill = bars.querySelector('.stamina-fill');
    if (sigFill) sigFill.style.width = `${avgSignal}%`;
    if (staFill) staFill.style.width = `${avgStamina}%`;
  }
}

function renderMissionMap() {
  MapModule.clearGameObjects();
  const center = getMissionCenter();
  MapModule.drawZone(center[0], center[1], 1000, '#ff5722');
  state.objectives.forEach((o, i)=>{
    if (o.type==='Extraction') MapModule.addExtraction(o.lat, o.lng, o.title);
    else MapModule.addBeacon(o.id, o.lat, o.lng, o.title);
    if (o.found) MapModule.collectBeacon(o.id);
  });
  state.agents.forEach(a=>{
    MapModule.addSquadMember(a.id, a.name, a.lat, a.lng, a.role, a.id===state.localAgentId, a.team);
  });
  MapModule.drawThreats(state.threats);
  MapModule.drawObjectives(state.objectives);
  MapModule.drawRoute(state.objectives);
}

function renderObjectivesList() {
  const el = $('#objectiveList');
  if (!el) return;
  const local = state.agents.find(a=>a.id===state.localAgentId);
  const nearestUndecoded = (state.objectives||[]).find(o => !o.decoded);
  el.innerHTML = (state.objectives||[]).map(o=>`
    <div class="objective-card ${o.found?'found':''} ${!o.decoded?'locked':''} ${!o.found && o.decoded && !nearestUndecoded?'current':''}">
      <strong>${escapeHtml(o.title)}</strong>
      <small>${o.decoded?`${escapeHtml(o.type)} / ${o.radius}m`:'Encrypted packet'}</small>
      <div class="progress"><b style="width:${o.progress}%"></b></div>
      <span>${o.found?'Found ✓':o.decoded?`${o.progress}%`:'Locked 🔒'}</span>
    </div>
  `).join('');
}

function renderRoleTools() {
  const local = state.agents.find(a=>a.id===state.localAgentId);
  const role = local?.role || 'Drone';
  $('#roleTitle').textContent = role;
  const tools = roleCatalog[role] || [];
  const now = Date.now();
  $('#roleTools').innerHTML = tools.map(t=>{
    const cdKey = `${role}:${t}`;
    const cdEnd = state.cooldowns[cdKey] || 0;
    const onCd = now < cdEnd;
    const remaining = onCd ? Math.ceil((cdEnd - now) / 1000) : 0;
    return `<button type="button" data-tool="${t}" ${onCd?'disabled':''}>${t}${onCd?` (${remaining}s)`:''}</button>`;
  }).join('');
  $('#roleTools').querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ executeTool(role, b.dataset.tool); });
  });
}

function executeTool(role, tool) {
  const local = state.agents.find(a=>a.id===state.localAgentId);
  if (!local) return;

  // Check cooldown
  const cdKey = `${role}:${tool}`;
  const now = Date.now();
  if (state.cooldowns[cdKey] && now < state.cooldowns[cdKey]) {
    const remaining = Math.ceil((state.cooldowns[cdKey] - now) / 1000);
    addChat(role, `${tool} on cooldown — ${remaining}s.`);
    renderRoleTools();
    return;
  }

  // Set 10-second cooldown
  state.cooldowns[cdKey] = now + 10000;

  if (role==='Drone' && tool.includes('Scan')) {
    // Scan pulse circle on map
    const m = MapModule.ensureMissionMap();
    if (m && local) {
      const pulseCircle = L.circle([local.lat, local.lng], {
        color: '#00bcd4', fillColor: '#00bcd4', fillOpacity: 0.15, weight: 2, radius: 200, className: 'sl-scan-circle', interactive: false
      }).addTo(m);
      setTimeout(() => { try { m.removeLayer(pulseCircle); } catch(e) {} }, 3000);
      addChat(role, 'Scan routes — pulse emitted.');
    }
    return;
  }
  if (role==='Mechanic' && tool.includes('Boost')) {
    state.agents.forEach(a=>a.signal=clamp(a.signal+15,0,100));
    // Flash effect on HUD
    const hud = document.querySelector('.mission-hud');
    if (hud) { hud.classList.remove('hud-flash-green'); void hud.offsetWidth; hud.classList.add('hud-flash-green'); }
    addChat(role, 'GPS mesh boosted for all agents.');
    renderHUD();
    return;
  }
  if (role==='Medic' && tool.includes('Call')) {
    state.agents.forEach(a=>a.stamina=clamp(a.stamina+20,0,100));
    const hud = document.querySelector('.mission-hud');
    if (hud) { hud.classList.remove('hud-flash-blue'); void hud.offsetWidth; hud.classList.add('hud-flash-blue'); }
    addChat(role, 'Regroup pulse restored squad stamina.');
    renderHUD();
    return;
  }
  if (role==='Decoder' && tool.includes('Decode')) {
    const next = state.objectives.find(o=>!o.decoded);
    if (next) { next.decoded=true; next.progress=Math.max(next.progress,18); addChat(role, `${next.title} decoded.`); }
    else addChat(role, 'All objective packets are open.');
    renderObjectivesList();
    // If this decoded objective is the next active one, focus it
    const firstDecoded = state.objectives.find(o => o.decoded && !o.found);
    if (firstDecoded) ObjectiveAutoFocus.panTo(firstDecoded.lat, firstDecoded.lng);
    return;
  }
  if (role==='Navigator' && tool.includes('Measure')) {
    const next = state.objectives.find(o=>o.decoded&&!o.found);
    if (next) {
      const dist = haversine(local, next);
      addChat(role, `Nearest objective: ${next.title} — ${formatDistance(dist)}.`);
      // Draw temporary line on map
      const m = MapModule.ensureMissionMap();
      if (m) {
        const line = L.polyline([[local.lat, local.lng], [next.lat, next.lng]], {
          color: '#79c0ff', opacity: 0.6, weight: 2, dashArray: '6,6', interactive: false
        }).addTo(m);
        setTimeout(() => { try { m.removeLayer(line); } catch(e) {} }, 5000);
      }
    } else {
      addChat(role, 'No open routes remain.');
    }
    return;
  }
  if (role==='Courier' && tool.includes('Deliver')) {
    const target = state.objectives.find(o => o.decoded && !o.found && haversine(local, o) <= 30);
    if (target) {
      target.found = true;
      target.progress = 100;
      ObjectiveAutoFocus.focusNext();
      const pts = target.type === 'Extraction' ? 50 : target.type === 'Waypoint' ? 30 : 25;
      if (local.team && state.scores[local.team] !== undefined) {
        state.scores[local.team] += pts;
        addChat('Score', `${local.team} +${pts}pts for ${target.title}.`);
      }
      SoundFX.scoreEvent();
      addChat(role, `${target.title} delivered!`);
    } else {
      addChat(role, 'No objective within 30m. Move closer.');
    }
    renderObjectivesList();
    return;
  }
  if (role==='Mission Control' && tool.includes('Track')) {
    const statuses = state.agents.map(a=>`${a.name}: SIG ${a.signal}% STA ${a.stamina}%`).join(' | ');
    addChat(role, `All agents — ${statuses}`);
    return;
  }
  if (role==='Mission Control' && tool.includes('Monitor')) {
    const avg = Math.round(state.agents.reduce((s,a)=>s+a.signal,0)/(state.agents.length||1));
    addChat(role, `Squad signal average: ${avg}%.`);
    return;
  }
  if (role==='Drone' && tool.includes('Ping')) {
    const nearest = state.threats.reduce((best, t) => {
      const d = haversine(local, t);
      return d < (best.d || Infinity) ? { threat: t, d } : best;
    }, {}).threat;
    if (nearest) {
      addChat(role, `${nearest.name} detected at ${formatDistance(haversine(local, nearest))}.`);
      // Flash threat indicator briefly
      ThreatProximity._forcePing?.(nearest);
    } else {
      addChat(role, 'No AI scouts in range.');
    }
    return;
  }
  if (role==='Mechanic' && tool.includes('Repair')) {
    const target = state.agents.reduce((best, a) => {
      if (a.id === local.id) return best;
      return a.signal < (best.signal || 100) ? a : best;
    }, { signal: 100 });
    if (target && target.id) {
      target.signal = clamp(target.signal + 25, 0, 100);
      addChat(role, `Repaired ${target.name}'s signal relay (+25%).`);
    } else {
      addChat(role, 'No damaged relays found.');
    }
    renderHUD();
    return;
  }
  if (role==='Medic' && tool.includes('Protect')) {
    const lowSignal = state.agents.filter(a => a.signal < 50);
    if (lowSignal.length) {
      lowSignal.forEach(a => { a.signal = clamp(a.signal + 15, 0, 100); });
      addChat(role, `Protected ${lowSignal.length} low-signal agent${lowSignal.length > 1 ? 's' : ''}.`);
    } else {
      addChat(role, 'All agents have stable signal.');
    }
    renderHUD();
    return;
  }
  if (role==='Decoder' && tool.includes('Validate')) {
    const decoded = state.objectives.filter(o => o.decoded && !o.found);
    if (decoded.length) {
      decoded.forEach(o => { o.progress = clamp(o.progress + 20, 0, 100); });
      addChat(role, `Validated ${decoded.length} intercepted signal${decoded.length > 1 ? 's' : ''}.`);
    } else {
      addChat(role, 'No decoded signals to validate.');
    }
    renderObjectivesList();
    return;
  }
  if (role==='Navigator' && tool.includes('Guide')) {
    const undecoded = state.objectives.find(o => !o.decoded);
    if (undecoded) {
      addChat(role, `Next target: ${undecoded.title} — ${formatDistance(haversine(local, undecoded))} away.`);
      ObjectiveAutoFocus.panTo(undecoded.lat, undecoded.lng);
    } else {
      const next = state.objectives.find(o => o.decoded && !o.found);
      if (next) {
        addChat(role, `Guide to ${next.title} — ${formatDistance(haversine(local, next))} away.`);
        ObjectiveAutoFocus.panTo(next.lat, next.lng);
      } else {
        addChat(role, 'All routes complete. Head to extraction.');
      }
    }
    return;
  }
  if (role==='Courier' && tool.includes('Trigger')) {
    const waypoint = state.objectives.find(o => o.type === 'Waypoint' && o.decoded && !o.found && haversine(local, o) <= 40);
    if (waypoint) {
      waypoint.found = true; waypoint.progress = 100;
      if (local.team && state.scores[local.team] !== undefined) {
        state.scores[local.team] += 30;
        addChat('Score', `${local.team} +30pts for ${waypoint.title}.`);
      }
      SoundFX.scoreEvent();
      addChat(role, `${waypoint.title} checkpoint triggered!`);
      ObjectiveAutoFocus.focusNext();
    } else {
      addChat(role, 'No checkpoint within 40m. Move closer.');
    }
    renderObjectivesList();
    return;
  }
  if (role==='Mission Control' && tool.includes('Deploy')) {
    const undecoded = state.objectives.find(o => !o.decoded);
    if (undecoded) {
      undecoded.decoded = true;
      undecoded.progress = Math.max(undecoded.progress, 18);
      addChat(role, `Deployed objective: ${undecoded.title}.`);
      renderObjectivesList();
    } else {
      addChat(role, 'All objectives are already deployed.');
    }
    return;
  }
  addChat(role, `${tool} executed.`);
}

function addChat(speaker, text) {
  state.chat.push([speaker, text, Date.now()]);
  state.chat = state.chat.slice(-50);
  renderChat();
  saveState();
}

function renderChat() {
  const el = $('#chatLog');
  const filtered = state.chat.slice(-12);
  el.innerHTML = filtered.map(([name,text])=>`<p><span>${escapeHtml(name)}</span>${escapeHtml(text)}</p>`).join('');
  el.scrollTop = el.scrollHeight;

  // Update mobile mini-bar with last message
  const cmb = $('#cmbMsg');
  if (cmb && state.chat.length) {
    const last = state.chat[state.chat.length - 1];
    cmb.innerHTML = `<span class="cmb-sender">${escapeHtml(last[0])}</span>${escapeHtml(last[1])}`;
  }
}

/* ========================== RESULTS ========================== */

function renderReplay() {
  const path = state.playerPath || [];
  const threats = state.threats || [];
  const objectives = state.objectives || [];

  // Path stats
  let totalDist = 0;
  for (let i = 1; i < path.length; i++) {
    totalDist += haversine(path[i-1], path[i]);
  }
  $('#replayDistance').textContent = totalDist > 0 ? formatDistance(totalDist) : '--';
  $('#replayWaypoints').textContent = path.length > 0 ? path.length.toLocaleString() : '--';

  const timeActive = state.missionStartTime && state.missionEndTime
    ? Math.round((state.missionEndTime - state.missionStartTime) / 1000)
    : (state.missionStartTime ? Math.round((Date.now() - state.missionStartTime) / 1000) : 0);
  $('#replayTimeActive').textContent = timeActive > 0 ? formatTime(timeActive) : '--';
  $('#replayAvgSpeed').textContent = timeActive > 0 && totalDist > 0
    ? `${(totalDist / timeActive * 3.6).toFixed(1)} km/h` : '--';

  // Threats encountered
  const threatList = $('#replayThreatList');
  if (threatList) {
    if (threats.length) {
      threatList.innerHTML = threats.map(t => {
        const local = state.agents.find(a=>a.id===state.localAgentId);
        const dist = local ? haversine(local, t) : 0;
        return `<div class="replay-threat-item"><span class="threat-name">${escapeHtml(t.name)}</span><span class="threat-dist">${formatDistance(dist)}</span></div>`;
      }).join('');
    } else {
      threatList.innerHTML = '<div class="replay-threat-item"><span class="threat-dist">No threats encountered</span></div>';
    }
  }

  // Score breakdown
  const sc = missionScore();
  $('#replayObjScore').textContent = (state.objectives.filter(o=>o.found).length * 140).toLocaleString();
  $('#replayProgScore').textContent = Math.round(state.objectives.reduce((s,o)=>s+(o.progress||0),0)/Math.max(state.objectives.length,1)).toLocaleString();
  $('#replayTimeScore').textContent = state.status==='Complete'?Math.round((state.remaining/Math.max(state.duration*60,1))*220).toLocaleString():'0';
  $('#replaySquadScore').textContent = Math.round((sc.avgSignal+sc.avgStamina)*1.2).toLocaleString();
  $('#replayThreatPenalty').textContent = `-${sc.threatPenalty}`;
  $('#replayTotalScore').textContent = sc.score.toLocaleString();

  // Render replay map
  if (replayMap) { replayMap.remove(); replayMap = null; }
  const mapEl = $('#replayMap');
  if (mapEl && window.L) {
    replayMap = L.map(mapEl, { zoomControl: false, attributionControl: false }).setView(getMissionCenter(), 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OSM &copy; CARTO' }).addTo(replayMap);
    L.control.zoom({ position: 'bottomright' }).addTo(replayMap);

    // Draw player path
    if (path.length > 1) {
      const pts = path.map(p => [p.lat, p.lng]);
      L.polyline(pts, { color: '#00bcd4', weight: 3, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }).addTo(replayMap);
    }
    // Draw objectives
    objectives.forEach(o => {
      const color = o.found ? '#4caf50' : o.decoded ? '#ff8b1f' : '#555';
      const icon = L.divIcon({ className: 'sl-map-icon', html: `<div style="width:20px;height:20px;background:${color};border:2px solid #fff;border-radius:50%;"></div>`, iconSize: [20,20], iconAnchor: [10,10] });
      L.marker([o.lat, o.lng], { icon }).addTo(replayMap).bindPopup(escapeHtml(o.title));
    });
    // Draw threats
    threats.forEach(t => {
      L.circleMarker([t.lat, t.lng], { radius: Math.max(6, t.radius/20), color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2 }).addTo(replayMap);
    });

    setTimeout(() => replayMap?.invalidateSize(), 100);
  }
}

function renderResults() {
  const sc = missionScore();
  $('#scoreGrade').textContent = scoreGrade(sc.score);
  $('#scoreValue').textContent = sc.score.toLocaleString();
  $('#scoreSummary').textContent = `${sc.found}/${sc.total} objectives found · ${formatTime(state.remaining)} remaining`;
  $('#resSignal').textContent = `${Math.round(sc.avgSignal)}%`;
  $('#resStamina').textContent = `${Math.round(sc.avgStamina)}%`;
  $('#resTime').textContent = formatTime(state.remaining);
  $('#resThreat').textContent = `-${sc.threatPenalty}`;

  const teams = teamScores();
  if (teams.length) {
    const topScore = teams[0].score;
    // Determine winner message
    const winner = teams.length > 1 && teams[0].score > (teams[1]?.score || 0) ? `${teams[0].team} Wins!` : 'Tied!';
    if (teams.length > 1) {
      document.querySelector('.results-header h1').textContent = winner;
    }
  }
  $('#teamList').innerHTML = teams.length
    ? teams.map(t=>{
        const isWinner = teams.length > 1 && t.score > 0 && t.score === teams[0].score && t.score > (teams[1]?.score || 0);
        return `<div class="team-item ${isWinner?'leading':''}"><strong>${escapeHtml(t.team)}</strong><span>${t.agents} agents · ${t.score.toLocaleString()} pts${isWinner?' 👑':''}</span></div>`;
      }).join('')
    : '<div class="team-item">No teams yet</div>';

  // Trigger animations
  ResultsAnimations.triggerEntranceAnimations();
  ResultsAnimations.animateScoreCounter(sc.score);
  const isWinner = teams.length > 0 && teams[0].score > 0 && teams[0].team === (state.agents.find(a=>a.id===state.localAgentId)?.team || '');
  ResultsAnimations.startConfetti(isWinner);
  ResultsAnimations.playCompleteSound(isWinner);
}

function missionScore() {
  const found = state.objectives.filter(o=>o.found).length;
  const total = Math.max(state.objectives.length,1);
  const objScore = found*140;
  const progScore = Math.round(state.objectives.reduce((s,o)=>s+(o.progress||0),0)/total);
  const timeScore = state.status==='Complete'?Math.round((state.remaining/Math.max(state.duration*60,1))*220):0;
  const avgSignal = state.agents.length?state.agents.reduce((s,a)=>s+a.signal,0)/state.agents.length:72;
  const avgStamina = state.agents.length?state.agents.reduce((s,a)=>s+a.stamina,0)/state.agents.length:92;
  const squadScore = state.agents.length?Math.round((avgSignal+avgStamina)*1.2):0;
  const threatPenalty = state.threats.filter(t=>t.alert).length*35;
  const score = Math.max(0, objScore+progScore+timeScore+squadScore-threatPenalty);
  return { score, found, total, avgSignal, avgStamina, threatPenalty };
}

function scoreGrade(s) {
  if (s>=1100) return 'S'; if (s>=850) return 'A'; if (s>=620) return 'B'; if (s>=380) return 'C'; return '--';
}

function teamScores() {
  const teams = {};
  state.agents.forEach(a=>{
    const t = a.team||'Unassigned';
    teams[t] ||= { team:t, agents:0, signal:0, stamina:0, score:0 };
    teams[t].agents++; teams[t].signal+=a.signal; teams[t].stamina+=a.stamina;
    // Add tracked score from state.scores
    teams[t].score = state.scores[t] || 0;
  });
  // Also add any tracked scores for teams without agents
  Object.keys(state.scores||{}).forEach(t => {
    if (!teams[t]) teams[t] = { team:t, agents:0, signal:0, stamina:0, score: state.scores[t] };
  });
  return Object.values(teams).sort((a,b)=>b.score-a.score);
}

function initResults() {
  $('#playAgain').addEventListener('click', ()=>{
    state.status = 'Lobby';
    state.objectives = [];
    state.threats = [];
    state.agents = [];
    state.localAgentId = '';
    state.cooldowns = {};
    state.extracting = false;
    state.extractCountdown = 0;
    state.chat = [['Mission Control','Create a game, join a role, then start the mission.'],['System','GPS ready. Waiting for mission start.']];
    MapModule.clearGameObjects();
    setScreen('lobby');
  });
  $('#revealMapRecap').addEventListener('click', ()=>{
    setScreen('replay');
    renderReplay();
  });
}

/* ========================== PWA INSTALL MODULE (5.2) ========================== */

const PWAInstall = {
  deferredPrompt: null,
  installBtn: null,

  init() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this._showInstallHint();
    });

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this._hideInstallHint();
    });

    // Check if already installed (display-mode: standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this._hideInstallHint();
    }
  },

  _showInstallHint() {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem('slv2_install_dismissed')) return;

    let hint = document.getElementById('pwaInstallHint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'pwaInstallHint';
      hint.className = 'pwa-install-hint';
      hint.innerHTML = `
        <div class="pwa-install-content">
          <span class="pwa-install-icon">📡</span>
          <span class="pwa-install-text">Install Signal Lost for offline play</span>
          <button class="pwa-install-btn" id="pwaInstallBtn">Install</button>
          <button class="pwa-install-close" id="pwaInstallClose" aria-label="Dismiss">×</button>
        </div>
      `;
      document.body.appendChild(hint);

      hint.querySelector('#pwaInstallBtn').addEventListener('click', () => this.promptInstall());
      hint.querySelector('#pwaInstallClose').addEventListener('click', () => this.dismissHint());
    }
    hint.classList.remove('hidden');
  },

  _hideInstallHint() {
    const hint = document.getElementById('pwaInstallHint');
    if (hint) hint.classList.add('hidden');
  },

  async promptInstall() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    if (outcome === 'accepted') {
      this._hideInstallHint();
    }
  },

  dismissHint() {
    sessionStorage.setItem('slv2_install_dismissed', '1');
    this._hideInstallHint();
  }
};

/* ========================== SERVICE WORKER ========================== */

const ServiceWorkerModule = {
  registered: false,

  init() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        this.registered = true;
        this._updateStatus('online');
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — could prompt user to refresh
                addChat('System', 'Update available. Refresh to load the latest version.');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
        this._updateStatus('error');
      });

    // Online/offline listeners
    window.addEventListener('online', () => this._updateStatus('online'));
    window.addEventListener('offline', () => this._updateStatus('offline'));
  },

  _updateStatus(status) {
    const el = document.getElementById('offlineIndicator');
    if (!el) return;
    if (status === 'offline') {
      el.classList.remove('hidden');
      el.textContent = 'Offline — cached mode';
    } else if (status === 'error') {
      el.classList.remove('hidden');
      el.textContent = 'Cache unavailable';
    } else {
      el.classList.add('hidden');
    }
  }
};

/* ========================== INIT ========================== */

/* ========================== SPLASH SCREEN ========================== */

const SplashScreen = {
  minDuration: 1800, // ms minimum splash display time
  maxDuration: 4500, // ms maximum before auto-dismiss
  dismissed: false,

  // Loading stages for the progress bar
  _stages: [
    { at: 0,    pct: 8,  text: 'Booting…' },
    { at: 250,  pct: 22, text: 'Loading assets…' },
    { at: 600,  pct: 45, text: 'Connecting…' },
    { at: 1100, pct: 68, text: 'Syncing comms…' },
    { at: 1600, pct: 85, text: 'Ready' },
    { at: 2100, pct: 100, text: 'Press any key or click to continue' }
  ],

  start() {
    this.dismissed = false;
    this._startTime = Date.now();
    document.body.dataset.screen = 'splash';

    this._fillEl = document.getElementById('splashLoadingFill');
    this._textEl = document.getElementById('splashProgressText');

    // Drive progress bar through stages
    this._stageTimers = this._stages.map(stage => {
      return setTimeout(() => {
        if (this.dismissed) return;
        if (this._fillEl) this._fillEl.style.width = stage.pct + '%';
        if (this._textEl) this._textEl.textContent = stage.text;
      }, stage.at);
    });

    // Auto-dismiss after maxDuration
    this._maxTimer = setTimeout(() => this.dismiss(), this.maxDuration);

    // Allow early dismiss on click/tap/keyboard (also triggers SoundFX init)
    this._clickHandler = (e) => {
      // Ignore clicks on non-interactive elements if needed, but splash is full-screen
      SoundFX.init();
      this.dismiss();
    };
    this._keyHandler = (e) => {
      SoundFX.init();
      this.dismiss();
    };
    document.addEventListener('click', this._clickHandler, { once: true });
    document.addEventListener('touchstart', this._clickHandler, { once: true });
    document.addEventListener('keydown', this._keyHandler, { once: true });

    // Minimum hold time before dismiss is allowed via timeout
    this._minTimer = setTimeout(() => {
      // Nothing special; dismiss() checks elapsed time
    }, this.minDuration);
  },

  dismiss() {
    if (this.dismissed) return;
    const elapsed = Date.now() - (this._startTime || Date.now());
    if (elapsed < this.minDuration) {
      // Wait until minimum duration
      setTimeout(() => this.dismiss(), this.minDuration - elapsed + 50);
      return;
    }
    this.dismissed = true;

    if (this._stageTimers) {
      this._stageTimers.forEach(t => clearTimeout(t));
      this._stageTimers = null;
    }
    if (this._maxTimer) { clearTimeout(this._maxTimer); this._maxTimer = null; }
    if (this._minTimer) { clearTimeout(this._minTimer); this._minTimer = null; }
    document.removeEventListener('click', this._clickHandler);
    document.removeEventListener('touchstart', this._clickHandler);
    document.removeEventListener('keydown', this._keyHandler);

    // Snap bar to 100%
    if (this._fillEl) this._fillEl.style.width = '100%';
    if (this._textEl) this._textEl.textContent = 'Entering…';

    // Also clear the inline failsafe
    var tapBtn = document.getElementById('splashTapToEnter');
    if (tapBtn) tapBtn.style.display = 'none';
    var keyHint = document.getElementById('splashKeyHint');
    if (keyHint) keyHint.style.display = 'none';

    const splashEl = document.getElementById('splashScreen');
    if (splashEl) {
      splashEl.classList.add('transition-out');
      setTimeout(() => {
        splashEl.classList.remove('transition-out');
        // Only init lobby if not already done (failsafe may have beaten us)
        if (document.body.dataset.screen !== 'lobby' || !window._lobbyInitialized) {
          state.screen = 'lobby';
          document.body.dataset.screen = 'lobby';
          initLobby();
          renderChat();
        }
      }, 600);
    } else {
      if (document.body.dataset.screen !== 'lobby' || !window._lobbyInitialized) {
        state.screen = 'lobby';
        document.body.dataset.screen = 'lobby';
        initLobby();
        renderChat();
        LobbyChat.render();
      }
    }
  }
};

function init() {
  loadProfile();
  loadState();
  normalizeModules();
  initTheme();
  initSetup();
  initRolesScreen();
  initMission();
  initResults();
  LobbyChat.init();
  ServiceWorkerModule.init();
  PWAInstall.init();
  BatteryAwareGPS.init();
  setTheme(state.themePalette);
  document.body.dataset.panels = state.panelsOpen ? 'open' : 'hidden';

  // Start with splash screen on fresh load; skip if restoring into a game
  const shouldSkipSplash = state.screen && state.screen !== 'splash' && state.screen !== 'lobby';
  if (shouldSkipSplash) {
    setScreen(state.screen || 'lobby');
    renderChat();
  } else {
    SplashScreen._startTime = Date.now();
    SplashScreen.start();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
