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
  screen: "lobby",
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
  joinCallsign: ""
};

let timerId = null;
let simId = null;
let gpsWatchId = null;

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
  range: 500,
  open: true,
  fullscreen: true,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.enterFullscreen();
    this.startLoop();
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
    if (this.animationId) return;
    const loop = () => {
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  },

  stopLoop() {
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
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
    (state.objectives || []).filter(o => o.type !== 'Extraction').forEach(o => {
      const pos = worldToRadar(o.lat, o.lng);
      if (!pos) return;
      const color = o.found ? '#4caf50' : '#ff9800';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

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

    // Draw squad (team-colored dots)
    (state.agents || []).filter(a => a.id !== state.localAgentId).forEach(a => {
      const pos = worldToRadar(a.lat, a.lng);
      if (!pos) return;
      ctx.fillStyle = a.team === 'North' ? '#4fc3f7' : '#ff8a65';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

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
  } // end toggle()

}; // end RadarModule

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
    const center = opts.center || cities[state.city].center;
    const zoom = opts.zoom || CFG.defaultZoom;
    const m = L.map(el, { zoomControl: false, attributionControl: false }).setView(center, zoom);
    L.tileLayer(CFG.tileUrl, { maxZoom: CFG.maxZoom, subdomains: CFG.tileSubdomains, attribution: CFG.tileAttribution }).addTo(m);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    if (opts.onClick) m.on('click', e => opts.onClick(e.latlng.lat, e.latlng.lng));
    return m;
  }

  function ensureMissionMap() {
    if (!map && window.L) {
      map = initMap('#missionMap', { onClick: null });
      if (map) setTimeout(() => map.invalidateSize(), 80);
    }
    return map;
  }

  function ensureSetupMap() {
    if (!setupMap && window.L) {
      setupMap = initMap('#setupMap', {
        zoom: 11,
        onClick: (lat, lng) => {
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
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };
    navigator.geolocation.getCurrentPosition(p => handlePos(p), e => console.warn('GPS init error', e.message), opts);
    gpsWatchId = navigator.geolocation.watchPosition(handlePos, e => console.warn('GPS watch error', e.message), opts);
    gpsActive = true;
    updateGpsUi('granted', 'Live GPS tracking');
    return true;
  }

  function stopGPS() {
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId = null; }
    gpsActive = false;
    if (playerMarker && playerMarker._pulseInterval) {
      clearInterval(playerMarker._pulseInterval);
      playerMarker._pulseInterval = null;
    }
    updateGpsUi('manual', 'GPS stopped');
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
    } else {
      const marker = L.marker([lat, lng], { icon: getPlayerIcon(color, isSelf) }).addTo(m);
      marker.bindPopup('<div class="sl-popup"><strong>'+(isSelf?'⭐ ':'')+escapeHtml(name)+'</strong><br>'+escapeHtml(role)+(team?' · '+escapeHtml(team):'')+'</div>');
      squad[id] = { id, name, lat, lng, role, isSelf, team, marker };
    }
  }

  function removeSquadMember(id) {
    if (squad[id]) { map?.removeLayer(squad[id].marker); delete squad[id]; }
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
    getGPSData: () => ({ position: currentPos, active: gpsActive })
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
  // Stop radar when leaving mission
  if (state.screen === 'mission' && name !== 'mission') {
    RadarModule.stopLoop();
  }
  state.screen = name;
  document.body.dataset.screen = name;
  if (name === 'setup') {
    setTimeout(() => { MapModule.ensureSetupMap(); MapModule.setCenter(...cities[state.city].center, 11); }, 40);
  }
  if (name === 'roles') {
    renderRolesScreen();
  }
  if (name === 'mission') {
    setTimeout(() => {
      MapModule.ensureMissionMap();
      MapModule.setCenter(...cities[state.city].center, 14);
      renderMissionMap();
      RadarModule.init('missionRadar');
    }, 40);
  }
  saveState();
}

/* ========================== LOBBY ========================== */

function initLobby() {
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
    state.isHost = true;
    state.code = generateCode();
    state.localProfile.name = cleanText($('#hostName').value, 'Morgan', 22);
    state.localProfile.callsign = cleanText($('#hostCallsign').value, 'Raven', 14);
    saveProfile();
    state.status = 'Lobby';
    state.remaining = state.duration * 60;
    populateSetup();
    setScreen('setup');
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
    state.isHost = false;
    state.code = codeInput;
    state.localProfile.name = nameInput;
    state.localProfile.callsign = callsignInput;
    state.joinCode = codeInput;
    state.joinName = nameInput;
    state.joinCallsign = callsignInput;
    try { localStorage.setItem('slv2_joinCode', codeInput); } catch {}
    saveProfile();
    joinAgentFromLobby();
    // Skip setup — go directly to roles screen
    populateRoles();
    setScreen('roles');
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
    MapModule.setCenter(...cities[state.city].center, 11);
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
    setScreen('roles');
  });

  $('#backToLobby').addEventListener('click', ()=> setScreen('lobby'));
  $('#backToSetup').addEventListener('click', ()=> setScreen('setup'));
}

function renderSetupMarkersOnMap() {
  const m = MapModule.ensureSetupMap(); if (!m) return;
  // Track custom marker layers to remove only those
  if (!m._setupMarkerLayers) m._setupMarkerLayers = [];
  m._setupMarkerLayers.forEach(l => m.removeLayer(l));
  m._setupMarkerLayers = [];
  const center = cities[state.city].center;
  const hq = L.marker(center, { icon: L.divIcon({className:'', html:'<span style="background:#ffd965;color:#000;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">HQ</span>', iconSize:[40,20], iconAnchor:[20,10]}) }).addTo(m);
  m._setupMarkerLayers.push(hq);
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
    const [lat, lng] = jitter(cities[state.city].center, 0.004);
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
      const [ba, bn] = jitter(cities[state.city].center, 0.009);
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
  const [lat, lng] = jitter(cities[state.city].center, 0.004);
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
    const [la, ln] = jitter(cities[state.city].center, 0.009);
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
  const center = cities[state.city].center;
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
  return haversine({lat:m.lat, lng:m.lng}, {lat:cities[state.city].center[0], lng:cities[state.city].center[1]}) <= 1800;
}

function generateThreats() {
  const center = cities[state.city].center;
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

  // Panel toggle (opens drawer on mobile, slides on desktop)
  $('#togglePanels').addEventListener('click', ()=>{
    state.panelsOpen = !state.panelsOpen;
    document.body.dataset.panels = state.panelsOpen ? 'open' : 'hidden';
    if (state.panelsOpen) {
      $('#panelDrawerOverlay').classList.remove('hidden');
    } else {
      $('#panelDrawerOverlay').classList.add('hidden');
    }
  });

  // Panel drawer overlay click to close
  $('#panelDrawerOverlay').addEventListener('click', ()=>{
    state.panelsOpen = false;
    document.body.dataset.panels = 'hidden';
    $('#panelDrawerOverlay').classList.add('hidden');
  });

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

  // GPS focus
  $('#focusGps').addEventListener('click', ()=>{
    const local = state.agents.find(a=>a.id===state.localAgentId);
    if (local) MapModule.setCenter(local.lat, local.lng, 16);
  });

  // Floating GPS button
  $('#floatingGpsBtn').addEventListener('click', ()=>{
    const local = state.agents.find(a=>a.id===state.localAgentId);
    if (local) MapModule.setCenter(local.lat, local.lng, 16);
  });

  // GPS controls
  $('#startGps').addEventListener('click', ()=> MapModule.startGPS());
  $('#stopGps').addEventListener('click', ()=> MapModule.stopGPS());
  $('#applyManualGps').addEventListener('click', ()=>{
    const lat = parseFloat($('#manualLat').value);
    const lng = parseFloat($('#manualLng').value);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180) {
      MapModule.setPlayerPosition(lat, lng);
      updateLocalAgentPosition(lat, lng, null);
    }
  });

  // Chat
  $('#chatForm').addEventListener('submit', e=>{
    e.preventDefault();
    const input = $('#chatInput');
    if (!input.value.trim()) return;
    addChat('Mission Control', input.value.trim());
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
}

function simulateWorld() {
  if (state.status !== 'Live') return;
  const center = cities[state.city].center;

  // --- THREAT HUNTING ---
  state.threats.forEach((t, i)=>{
    const nearest = state.agents.reduce((best, a) => {
      const d = haversine(a, t);
      return d < (best.d || Infinity) ? { agent: a, d } : best;
    }, {}).agent;
    const nearestDist = nearest ? haversine(nearest, t) : Infinity;

    // Hunt mode: within 400m of a player
    if (nearestDist < 400 && nearest) {
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

    // Jamming logic
    const exposed = state.agents.filter(a=>haversine(a,t)<=t.radius);
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

  state.agents.forEach(a=>{
    a.lat += (Math.random()-0.5)*0.0011;
    a.lng += (Math.random()-0.5)*0.0014;
    a.signal = clamp(a.signal + Math.round(Math.random()*10-5), 38, 98);
    a.stamina = clamp(a.stamina + Math.round(Math.random()*6-4), 35, 100);
  });
  state.objectives.forEach(o=>{
    if (!o.decoded || o.found) return;
    const nearest = nearestAgentDist(o);
    o.progress = clamp(o.progress + (nearest<180?8:2), 0, 100);
    if (nearest <= o.radius || o.progress >= 100) {
      o.found = true; o.progress = 100;
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
    SoundFX.missionComplete();
    setScreen('results');
    renderResults();
    addChat('System', 'Extraction successful. Mission complete.');
    stopMissionClock();
    return;
  }

  if (allFound && !extractionObj) {
    stopMissionClock(); state.status='Complete';
    SoundFX.missionComplete();
    setScreen('results'); renderResults();
    addChat('System', 'All objectives complete. Signal restored.');
    return;
  }
  renderMissionMap();
  renderHUD();
  renderObjectivesList();
  renderRoleTools();
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
}

function renderMissionMap() {
  MapModule.clearGameObjects();
  const center = cities[state.city].center;
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
}

/* ========================== RESULTS ========================== */

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
    setScreen('mission');
    renderMissionMap();
  });
}

/* ========================== INIT ========================== */

function init() {
  loadProfile();
  loadState();
  normalizeModules();
  initTheme();
  initLobby();
  initSetup();
  initRolesScreen();
  initMission();
  initResults();
  setTheme(state.themePalette);
  document.body.dataset.panels = state.panelsOpen ? 'open' : 'hidden';
  setScreen(state.screen || 'lobby');
  renderChat();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
