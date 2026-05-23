const cities = {
  oslo: { name: "Oslo", country: "norway", center: [59.9139, 10.7522] },
  bergen: { name: "Bergen", country: "norway", center: [60.3913, 5.3221] },
  trondheim: { name: "Trondheim", country: "norway", center: [63.4305, 10.3951] },
  london: { name: "London", country: "uk", center: [51.5072, -0.1276] },
  newyork: { name: "New York", country: "usa", center: [40.7128, -74.006] }
};

const countries = {
  norway: "Norway",
  uk: "United Kingdom",
  usa: "United States"
};

const roleCatalog = {
  Drone: ["Scan routes", "Mark safe corridor", "Ping AI scout"],
  Mechanic: ["Boost GPS mesh", "Repair relay", "Stabilize signal"],
  Medic: ["Find nearest agent", "Call regroup", "Protect low-signal players"],
  Decoder: ["Decode cipher", "Reveal clue", "Validate intercepted signal"],
  Navigator: ["Set waypoint", "Measure proximity", "Guide squad"],
  Courier: ["Carry key shard", "Deliver objective", "Trigger checkpoint"],
  "Mission Control": ["Track all agents", "Deploy objectives", "Monitor signal strength", "Direct squad movement"]
};

const roleBriefings = {
  Drone: "Scout the route, ping AI patrols, and keep the squad out of jamming arcs.",
  Mechanic: "Watch signal health and boost the GPS mesh when the squad starts dropping.",
  Medic: "Track stamina, call regroup pulses, and pull weak agents out of danger.",
  Decoder: "Open encrypted packets and keep the next coordinates flowing.",
  Navigator: "Measure proximity, name the next route, and keep everyone moving together.",
  Courier: "Carry objective progress across the final meters and trigger close checkpoints.",
  "Mission Control": "Oversee the entire operation. Track all agents, deploy objectives, and keep the squad coordinated from command."
};

const rolePackDuties = {
  Drone: {
    ciphers: ["Beacon sweep", "Scan for false beacon timing before Decoder opens packets."],
    treasure: ["Cache overwatch", "Mark a safe approach for shard and cache recoveries."],
    waypoints: ["Corridor scan", "Check relay lanes before the squad enters each waypoint."],
    voice: ["Air callouts", "Keep voice relay updates short enough for moving players."]
  },
  Mechanic: {
    ciphers: ["Signal bypass", "Stabilize the mesh before encrypted packets are opened."],
    treasure: ["Tracker check", "Confirm cache props and GPS shards do not split the squad signal."],
    waypoints: ["Relay toolkit", "Prepare a repair plan for relay and uplink failures."],
    voice: ["Comms gain", "Balance voice relay with live signal status."]
  },
  Medic: {
    ciphers: ["Low-signal watch", "Keep tired agents clear while the Decoder holds position."],
    treasure: ["Recovery plan", "Assign regroup points before cache and shard searches."],
    waypoints: ["Regroup pulse", "Pick a stamina checkpoint along the route chain."],
    voice: ["Care callouts", "Reserve voice relay for hazard and regroup alerts."]
  },
  Decoder: {
    ciphers: ["Cipher console", "Own the first encrypted packet and validate decoded coordinates."],
    treasure: ["Artifact clues", "Translate cache words, riddles, and shard text into field orders."],
    waypoints: ["Relay phrase", "Check waypoint handoff phrases before extraction opens."],
    voice: ["Packet narration", "Read only decoded updates over voice relay."]
  },
  Navigator: {
    ciphers: ["Coordinate lock", "Plot decoded packets into the active map layer."],
    treasure: ["Cache route", "Route the squad through cache sites without losing extraction time."],
    waypoints: ["Route chain", "Own waypoint order, spacing, and final extraction direction."],
    voice: ["Route callouts", "Use voice relay for turn-by-turn movement only."]
  },
  Courier: {
    ciphers: ["Packet handoff", "Carry decoded instructions to the next physical task."],
    treasure: ["Shard carrier", "Own GPS shards, cache props, and delivery confirmation."],
    waypoints: ["Checkpoint runner", "Trigger close checkpoints and confirm relay contact."],
    voice: ["Delivery callouts", "Confirm objective delivery over voice relay."]
  },
  "Mission Control": {
    ciphers: ["Packet distribution", "Route decoded intel to the right field agents."],
    treasure: ["Asset allocation", "Assign cache recovery priorities to squads."],
    waypoints: ["Extraction planning", "Coordinate final extraction timing and rally points."],
    voice: ["Command net", "Maintain centralized comms and relay orders to all teams."]
  }
};

const coreModules = [
  ["GPS Tracking", "Simulated position updates and player map markers."],
  ["Proximity", "Haversine distance checks trigger found events."],
  ["AI Watch", "Signal hunters patrol the map and jam exposed agents."],
  ["Session Codes", "Jackbox-style code for local multiplayer flow."],
  ["Persistent Sessions", "Shared games survive local server restarts."],
  ["Organizer Tools", "Export, import, and remove shared session records."],
  ["Role Dashboards", "Each role exposes different tactical actions."]
];

const moduleCatalog = [
  ["ciphers", "Cipher Tasks", "Decode encrypted packets to reveal location data.", true],
  ["treasure", "Treasure Hunt", "Recover GPS shards and physical clue rewards.", true],
  ["waypoints", "Waypoints", "Route teams through relays before extraction.", true],
  ["voice", "Voice Relay", "Read new comms aloud when the browser allows it.", false]
];

const mapLayers = {
  street: "Street Map",
  tactical: "Tactical Grid",
  terrain: "Terrain Scan"
};

const mapLayerDetails = {
  street: ["Street Map", "Roads, labels, districts"],
  tactical: ["Tactical Grid", "Sectors, scan lanes, threat read"],
  terrain: ["Terrain Scan", "Elevation, water, cover"]
};

const chatFilterCatalog = ["All", "Mission Control", "System", "AI Watch", "Decoder", "Organizer", "Roles"];
const auditFilterCatalog = ["All", "Mission", "Roster", "Objective", "GM Console", "Moderation", "Identity", "Lobby"];
const sessionModes = {
  private: {
    label: "Private",
    detail: "Hidden from Active Games. Join link or code required."
  },
  public: {
    label: "Public",
    detail: "Listed in Active Games and open to new agents."
  },
  locked: {
    label: "Locked",
    detail: "Listed for status, but closed to new agents."
  }
};

const customMarkerTaskStates = {
  planned: "Planned",
  armed: "Armed",
  complete: "Complete"
};

const templateStorageKey = "signalLostMissionTemplates";
const identityStorageKey = "signalLostIdentityProfile";
const hostKeyStorageKey = "signalLostHostKey";
const themeStorageKey = "signalLostThemePalette";
const themePalettes = {
  classic: "Classic Signal",
  sunset: "Tangerine Static",
  signal: "Signal Candy",
  night: "Night Static"
};

const themePatternPalettes = {
  sunset: {
    base: "#fff2c4",
    colors: ["#e82663", "#ff4f69", "#ff8b1f", "#ffd14d", "#efeccf", "#f06a20"],
    line: "#fff6d8",
    speed: 0.58,
    glow: 0.64,
    drift: 0.46
  },
  signal: {
    base: "#ffe8b3",
    colors: ["#ff2d55", "#ff7a1a", "#ffc53d", "#fff0c7", "#00a9c7", "#f14170"],
    line: "#fff8df",
    speed: 0.62,
    glow: 0.7,
    drift: 0.5
  },
  night: {
    base: "#26151c",
    colors: ["#ff4f69", "#ff8b1f", "#ffd14d", "#682c84", "#006c71", "#efebcf"],
    line: "#ffd14d",
    speed: 0.48,
    glow: 0.72,
    drift: 0.36
  }
};

const customMarkerTypeBehaviors = {
  Clue: {
    label: "Decode clue",
    detail: "Reveals story text or a code word for the next move.",
    radiusOffset: 0,
    objective: true
  },
  Cache: {
    label: "Recover cache",
    detail: "Rewards the squad with signal and stamina when secured.",
    radiusOffset: 8,
    objective: true
  },
  Waypoint: {
    label: "Route checkpoint",
    detail: "Creates a movement checkpoint with a wider activation zone.",
    radiusOffset: 12,
    objective: true
  },
  Danger: {
    label: "Hazard zone",
    detail: "Jams nearby agents instead of becoming a live objective.",
    radiusOffset: 20,
    objective: false
  },
  Extraction: {
    label: "Final extraction",
    detail: "Acts as a high-priority objective near the end of the chain.",
    radiusOffset: 15,
    objective: true
  }
};

const missionPacks = {
  ciphers: [
    ["Decode relay A17", "Cipher", 25, "Break the first packet and reveal the signal route."],
    ["Bypass false beacon", "Puzzle", 22, "Compare beacon timing and reject the decoy pulse."]
  ],
  treasure: [
    ["Recover GPS shard", "Treasure", 18, "Find the dropped shard before AI Watch triangulates it."],
    ["Claim cache marker", "Treasure", 20, "Secure the field cache and carry its key phrase forward."]
  ],
  waypoints: [
    ["Restore north uplink", "Waypoint", 30, "Stand inside the relay zone until the uplink stabilizes."],
    ["Trace safe corridor", "Waypoint", 32, "Move through the corridor to open the extraction vector."]
  ],
  extraction: [
    ["Extract final signal", "Extraction", 35, "Bring the decoded route, shard, and relay lock to final extraction."]
  ]
};

let map;
let setupMap;
let playerMarkers = [];
let objectiveMarkers = [];
let routeLayers = [];
let customMarkersLayer = [];
let setupMapMarkers = [];
let setupDraftMarker;
let timerId;
let simulationId;
let heartbeatId;
let syncId;
let sessionsId;
let presenceId;
let locationsId;
let gpsWatchId;
let isApplyingRemote = false;
let lastSyncedRevision = 0;
let threatMarkers = [];
let useFallbackMap = false;
let mapFallbackReason = "";
let lastSpokenChat = "";
let fieldCueMemory = { objectiveZone: "none", threatZone: "none", lastAt: 0 };
let fieldCueAudioContext;
let themePatternCanvas;
let themePatternContext;
let themePatternWidth = 0;
let themePatternHeight = 0;
let themePatternTime = 0;
let themePatternPointerX = 0.5;
let themePatternPointerY = 0.5;
let themePatternAnimationId = 0;
let themePatternReducedMotion = false;

const state = {
  status: "Lobby",
  code: "AQUA-RADAR-42",
  revision: 1,
  serverRevision: 0,
  updatedAt: Date.now(),
  clientId: "",
  screen: "setup",
  country: "norway",
  city: "oslo",
  duration: 60,
  remaining: 3600,
  maxPlayers: 6,
  isPublic: false,
  sessionMode: "private",
  organizer: {
    name: "Morgan",
    callsign: "Raven",
    clientId: ""
  },
  auth: {
    accessCode: "",
    requireAccessCode: true,
    hostKey: "",
    organizerClientId: ""
  },
  localProfile: {
    name: "Morgan",
    callsign: "Raven"
  },
  activeView: "host",
  mapLayer: "street",
  mapZoom: 1,
  themePalette: "classic",
  selectedTemplateId: "",
  editingMarkerId: "",
  localAgentId: "",
  agents: [],
  objectives: [],
  threats: [],
  customMarkers: [],
  enabledModules: {},
  chatFilter: "All",
  auditFilter: "All",
  chat: [
    ["Mission Control", "Create a game, join a role, then start the mission."],
    ["System", "GPS simulator armed. Real GPS can be added behind this interface."]
  ],
  audit: []
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

function init() {
  initIdentity();
  loadState();
  loadThemePreference();
  normalizeEnabledModules();
  loadCodeFromUrl();
  initControls();
  initThemePattern();
  initAudio();
  initSetupAudio();
  initThemePaletteButtons();
  initGpsPermissionState();
  initMap();
  initSetupMap();
  renderAll();
  initSync();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function initSetupAudio() {
  const setupToggle = $("#setupAudioToggle");
  const themeAudio = $("#themeAudio");
  if (!setupToggle || !themeAudio) return;
  setupToggle.addEventListener("click", () => {
    if (themeAudio.paused) { themeAudio.play().catch(() => {}); }
    else { themeAudio.pause(); }
  });
  const setupSlider = $("#setupVolumeSlider");
  if (setupSlider) {
    setupSlider.addEventListener("input", (e) => {
      themeAudio.volume = e.target.value / 100;
      $("#volumeSlider").value = e.target.value;
    });
  }
}

function initThemePaletteButtons() {
  document.querySelectorAll("[data-theme-palette]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const palette = btn.dataset.themePalette;
      setThemePalette(palette);
      document.querySelectorAll("[data-theme-palette]").forEach((b) => b.classList.toggle("selected", b === btn));
      $("#themePaletteSelect").value = palette;
    });
  });
}

function initControls() {
  $("#roleSelect").innerHTML = Object.keys(roleCatalog).map((role) => `<option>${role}</option>`).join("");
  $("#themePaletteSelect").innerHTML = Object.entries(themePalettes).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");
  $("#themePaletteSelect").addEventListener("change", (event) => setThemePalette(event.target.value));
  renderCountryOptions();
  renderRoleCards();
  $("#roleSelect").addEventListener("change", () => {
    renderRoleCards();
    renderRole();
    renderRoleReadiness();
  });
  $("#setupStep").addEventListener("click", () => setScreen("setup"));
  $("#rolesStep").addEventListener("click", () => setScreen("roles"));
  $("#controlStep").addEventListener("click", () => setScreen("mission"));
  $("#continueToRoles").addEventListener("click", () => setScreen("roles"));
  $("#openControlFromSetup").addEventListener("click", () => setScreen("mission"));
  $("#backToSetup").addEventListener("click", () => setScreen("setup"));
  $("#enterMissionControl").addEventListener("click", enterMissionControl);
  $("#organizerNameInput").addEventListener("input", updateOrganizerIdentity);
  $("#organizerCallsignInput").addEventListener("input", updateOrganizerIdentity);
  $("#organizerAccessCodeInput").addEventListener("input", updateSessionAuth);
  $("#requireAccessCodeToggle").addEventListener("change", updateSessionAuth);
  $("#roleAgentName").addEventListener("input", (event) => {
    $("#agentName").value = event.target.value;
    updateLocalProfile({ name: event.target.value });
    renderRoleReadiness();
  });
  $("#roleAccessCodeInput").addEventListener("input", (event) => {
    $("#agentAccessCodeInput").value = event.target.value;
    renderRoleReadiness();
  });
  $("#roleTeamSelect").addEventListener("change", (event) => {
    $("#teamSelect").value = event.target.value;
    renderRoleReadiness();
  });
  $("#setupCountrySelect").addEventListener("change", (event) => {
    state.country = event.target.value;
    const nextCity = cityKeysForCountry(state.country)[0];
    if (nextCity) state.city = nextCity;
    resetMissionArea();
  });
  $("#setupCitySelect").addEventListener("change", (event) => {
    state.city = event.target.value;
    state.country = cities[state.city].country;
    resetMissionArea();
  });
  $("#setupMapPreview").addEventListener("click", setMarkerFromSetupMap);
  $("#useCityCenterMarker").addEventListener("click", () => {
    const [lat, lng] = cities[state.city].center;
    renderCustomMarkerInputs(lat, lng);
  });
  $("#addCustomMarker").addEventListener("click", addCustomMarker);
  $("#cancelMarkerEdit").addEventListener("click", cancelCustomMarkerEdit);
  $("#setupDurationInput").addEventListener("input", (event) => {
    state.duration = Number(event.target.value);
    state.remaining = state.duration * 60;
    renderAll();
    commitState();
  });
  $("#setupPlayerSlider").addEventListener("input", (event) => {
    state.maxPlayers = Number(event.target.value);
    renderAll();
    commitState();
  });
  $("#setupPublicToggle").addEventListener("change", (event) => {
    setSessionMode(event.target.checked ? "public" : "private");
  });
  $("#setupSessionMode").addEventListener("change", (event) => {
    setSessionMode(event.target.value);
  });
  $("#saveTemplate").addEventListener("click", saveMissionTemplate);
  $("#loadTemplate").addEventListener("click", loadSelectedMissionTemplate);
  $("#removeTemplate").addEventListener("click", removeSelectedMissionTemplate);
  $("#templateNameInput").addEventListener("input", () => updateTemplateStatus("Template ready."));
  $("#templateList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-template-id]");
    if (!button) return;
    state.selectedTemplateId = button.dataset.templateId;
    $("#templateNameInput").value = button.dataset.templateName || "";
    renderTemplates();
    saveState();
  });
  $("#durationInput").addEventListener("input", (event) => {
    state.duration = Number(event.target.value);
    state.remaining = state.duration * 60;
    renderAll();
    commitState();
  });
  $("#playerSlider").addEventListener("input", (event) => {
    state.maxPlayers = Number(event.target.value);
    renderAll();
    commitState();
  });
  $("#publicToggle").addEventListener("change", (event) => {
    setSessionMode(event.target.checked ? "public" : "private");
  });
  $("#sessionModeSelect").addEventListener("change", (event) => {
    setSessionMode(event.target.value);
  });
  $("#citySelect").addEventListener("change", (event) => {
    state.city = event.target.value;
    state.country = cities[state.city].country;
    resetMissionArea();
  });
  $("#sessionCode").addEventListener("click", () => {
    state.code = generateCode();
    renderAll();
    commitState();
  });
  $("#copyJoinLink").addEventListener("click", copyJoinLink);
  $("#returnToSetup").addEventListener("click", () => setScreen("setup"));
  $("#returnToRoles").addEventListener("click", () => setScreen("roles"));
  $("#startGame").addEventListener("click", startMission);
  $("#resetGame").addEventListener("click", resetMission);
  $("#toggleLobbyLock").addEventListener("click", toggleLobbyLock);
  $("#clearInactiveAgents").addEventListener("click", clearInactiveAgents);
  $("#moderationRoster").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-agent]");
    if (!button) return;
    removeAgent(button.dataset.removeAgent);
  });
  $("#gmRevealClue").addEventListener("click", gmRevealClue);
  $("#gmJamZone").addEventListener("click", gmJamZone);
  $("#gmDropCache").addEventListener("click", gmDropCache);
  $("#gmRerouteExtraction").addEventListener("click", gmRerouteExtraction);
  $("#gmBroadcastForm").addEventListener("submit", (event) => {
    event.preventDefault();
    gmBroadcast();
  });
  $("#auditFilterBar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-audit-filter]");
    if (!button) return;
    setAuditFilter(button.dataset.auditFilter);
  });
  $("#joinGame").addEventListener("click", joinAgent);
  $("#agentName").addEventListener("input", (event) => {
    $("#roleAgentName").value = event.target.value;
    updateLocalProfile({ name: event.target.value });
    renderRoleReadiness();
  });
  $("#agentAccessCodeInput").addEventListener("input", (event) => {
    $("#roleAccessCodeInput").value = event.target.value;
    renderRoleReadiness();
  });
  $("#decodeObjective").addEventListener("click", decodeNextObjective);
  $("#hostView").addEventListener("click", () => setView("host"));
  $("#fieldView").addEventListener("click", () => setView("field"));
  $("#radarView").addEventListener("click", () => setView("radar"));
  $("#mapLayerControl").querySelectorAll("[data-map-layer]").forEach((button) => {
    button.addEventListener("click", () => setMapLayer(button.dataset.mapLayer));
  });
  $("#mapZoomOut").addEventListener("click", () => setMapZoom(state.mapZoom - 0.15));
  $("#mapZoomIn").addEventListener("click", () => setMapZoom(state.mapZoom + 0.15));
  $("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#chatInput");
    if (!input.value.trim()) return;
    sendChatMessage("Mission Control", input.value.trim());
    input.value = "";
  });
  $("#chatFilterBar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-filter]");
    if (!button) return;
    setChatFilter(button.dataset.chatFilter);
  });
  $("#syncNow").addEventListener("click", () => syncNow(true));
  $("#refreshSessions").addEventListener("click", fetchActiveSessions);
  $("#exportSession").addEventListener("click", exportSession);
  $("#importSession").addEventListener("click", importSession);
  $("#removeSession").addEventListener("click", removeSession);
  $("#useDeviceGps").addEventListener("click", useDeviceGps);
  $("#applyManualGps").addEventListener("click", applyManualGps);
}

function loadCodeFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (!code) return;
  state.code = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40) || state.code;
}

function loadThemePreference() {
  const stored = localStorage.getItem(themeStorageKey);
  state.themePalette = themePalettes[stored] ? stored : state.themePalette || "classic";
  applyThemePalette(state.themePalette);
}

function setThemePalette(theme) {
  state.themePalette = themePalettes[theme] ? theme : "classic";
  localStorage.setItem(themeStorageKey, state.themePalette);
  applyThemePalette(state.themePalette);
  saveState();
}

function applyThemePalette(theme) {
  const nextTheme = themePalettes[theme] ? theme : "classic";
  document.body.dataset.theme = nextTheme;
  const select = $("#themePaletteSelect");
  if (select) select.value = nextTheme;
  ensureThemePatternLoop();
}

function initThemePattern() {
  themePatternCanvas = $("#themePatternCanvas");
  if (!themePatternCanvas) return;
  themePatternContext = themePatternCanvas.getContext("2d");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  themePatternReducedMotion = motionQuery.matches;
  motionQuery.addEventListener?.("change", (event) => {
    themePatternReducedMotion = event.matches;
    ensureThemePatternLoop();
  });
  resizeThemePatternCanvas();
  window.addEventListener("resize", resizeThemePatternCanvas);
  window.addEventListener("pointermove", (event) => {
    themePatternPointerX = event.clientX / Math.max(1, themePatternWidth);
    themePatternPointerY = event.clientY / Math.max(1, themePatternHeight);
  });
  ensureThemePatternLoop();
}

function resizeThemePatternCanvas() {
  if (!themePatternCanvas || !themePatternContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  themePatternWidth = window.innerWidth;
  themePatternHeight = window.innerHeight;
  themePatternCanvas.width = Math.floor(themePatternWidth * ratio);
  themePatternCanvas.height = Math.floor(themePatternHeight * ratio);
  themePatternCanvas.style.width = `${themePatternWidth}px`;
  themePatternCanvas.style.height = `${themePatternHeight}px`;
  themePatternContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function ensureThemePatternLoop() {
  if (!themePatternCanvas || !themePatternContext) return;
  if (!themePatternPalettes[state.themePalette]) {
    themePatternContext.clearRect(0, 0, themePatternWidth, themePatternHeight);
    if (themePatternAnimationId) {
      cancelAnimationFrame(themePatternAnimationId);
      themePatternAnimationId = 0;
    }
    return;
  }
  if (!themePatternAnimationId) themePatternAnimationId = requestAnimationFrame(drawThemePattern);
}

function roundedThemeRect(ctx, x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + size - r, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + r);
  ctx.lineTo(x + size, y + size - r);
  ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
  ctx.lineTo(x + r, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawThemeTile(x, y, size, index, palette, pulse, glow) {
  const colors = palette.colors;
  const wobble = Math.sin(themePatternTime * 0.0016 + index * 0.7) * 7 * pulse;
  const offset = Math.cos(themePatternTime * 0.0012 + index * 0.4) * 5 * pulse;
  const inset = size * 0.09;
  themePatternContext.save();
  themePatternContext.translate(x + wobble, y + offset);
  themePatternContext.shadowBlur = glow * 18;
  themePatternContext.shadowColor = colors[(index + 1) % colors.length];

  themePatternContext.fillStyle = colors[index % colors.length];
  roundedThemeRect(themePatternContext, 0, 0, size, size * 0.18);
  themePatternContext.fill();

  themePatternContext.shadowBlur = 0;
  themePatternContext.strokeStyle = colors[(index + 2) % colors.length];
  themePatternContext.lineWidth = Math.max(3, size * 0.035);
  roundedThemeRect(themePatternContext, inset, inset, size - inset * 2, size * 0.15);
  themePatternContext.stroke();

  themePatternContext.strokeStyle = palette.line;
  themePatternContext.globalAlpha = 0.72;
  themePatternContext.lineWidth = Math.max(2, size * 0.022);
  roundedThemeRect(themePatternContext, inset * 1.85, inset * 1.85, size - inset * 3.7, size * 0.12);
  themePatternContext.stroke();

  themePatternContext.globalAlpha = 1;
  themePatternContext.fillStyle = colors[(index + 3) % colors.length];
  themePatternContext.beginPath();
  themePatternContext.ellipse(
    size * 0.52 + Math.sin(themePatternTime * 0.002 + index) * size * 0.06 * pulse,
    size * 0.52 + Math.cos(themePatternTime * 0.0018 + index) * size * 0.05 * pulse,
    size * 0.23,
    size * 0.25,
    Math.sin(themePatternTime * 0.0008 + index) * 0.2,
    0,
    Math.PI * 2
  );
  themePatternContext.fill();
  themePatternContext.restore();
}

function drawThemePattern(timestamp) {
  themePatternAnimationId = 0;
  const palette = themePatternPalettes[state.themePalette];
  if (!palette || !themePatternContext) return;
  themePatternTime = themePatternReducedMotion ? 0 : timestamp;
  const speed = palette.speed;
  const glow = palette.glow;
  const drift = palette.drift;
  const pulse = 0.45 + speed * 1.15;
  const tile = Math.max(118, Math.min(178, themePatternWidth / 7));
  const spacing = tile * 0.96;
  const driftX = Math.sin(themePatternTime * 0.00018 * (1 + speed * 2)) * spacing * drift;
  const driftY = Math.cos(themePatternTime * 0.00014 * (1 + speed * 2)) * spacing * drift;
  const pointerDriftX = (themePatternPointerX - 0.5) * 32 * drift;
  const pointerDriftY = (themePatternPointerY - 0.5) * 32 * drift;

  themePatternContext.fillStyle = palette.base;
  themePatternContext.fillRect(0, 0, themePatternWidth, themePatternHeight);

  let index = 0;
  for (let y = -spacing * 1.5; y < themePatternHeight + spacing; y += spacing) {
    for (let x = -spacing * 1.5; x < themePatternWidth + spacing; x += spacing) {
      const rowOffset = Math.round(y / spacing) % 2 === 0 ? spacing * 0.12 : -spacing * 0.06;
      drawThemeTile(x + rowOffset + driftX + pointerDriftX, y + driftY + pointerDriftY, tile, index, palette, pulse, glow);
      index += 1;
    }
  }

  themePatternContext.save();
  themePatternContext.globalCompositeOperation = "overlay";
  const gradient = themePatternContext.createRadialGradient(
    themePatternWidth * themePatternPointerX,
    themePatternHeight * themePatternPointerY,
    0,
    themePatternWidth * themePatternPointerX,
    themePatternHeight * themePatternPointerY,
    Math.max(themePatternWidth, themePatternHeight) * 0.75
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.32)");
  gradient.addColorStop(0.5, "rgba(255,139,31,0.1)");
  gradient.addColorStop(1, "rgba(232,38,99,0.18)");
  themePatternContext.fillStyle = gradient;
  themePatternContext.fillRect(0, 0, themePatternWidth, themePatternHeight);
  themePatternContext.restore();

  if (!themePatternReducedMotion) themePatternAnimationId = requestAnimationFrame(drawThemePattern);
}

function setScreen(screen) {
  state.screen = screen;
  document.body.dataset.screen = screen;
  ["setup", "roles", "mission"].forEach((item) => {
    $(`#${item === "mission" ? "control" : item}Step`)?.classList.toggle("selected", item === screen);
  });
  $("#onboardingTitle").textContent = screen === "roles" ? "Role Assignment" : "Mission Setup";
  if (screen === "mission") setTimeout(() => map?.invalidateSize(), 80);
  if (screen === "setup") setTimeout(() => setupMap?.invalidateSize(), 80);
  saveState();
}

function setSessionMode(mode) {
  const previous = state.sessionMode;
  state.sessionMode = sessionModes[mode] ? mode : "private";
  state.isPublic = state.sessionMode !== "private";
  state.chat.push(["Organizer", `Lobby visibility set to ${sessionModes[state.sessionMode].label}.`]);
  if (previous !== state.sessionMode) logAudit("Lobby", `${sessionModes[state.sessionMode].label} visibility`, state.organizer?.callsign || "Organizer");
  renderAll();
  commitState();
}

function resetMissionArea() {
  state.editingMarkerId = "";
  resetCustomMarkerForm();
  generateObjectives();
  generateThreats();
  centerMap();
  renderAll();
  commitState();
}

function initIdentity() {
  let clientId = localStorage.getItem("signalLostClientId");
  if (!clientId) {
    clientId = `c${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("signalLostClientId", clientId);
  }
  let hostKey = localStorage.getItem(hostKeyStorageKey);
  if (!hostKey) {
    hostKey = `host-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(hostKeyStorageKey, hostKey);
  }
  state.clientId = clientId;
  state.localHostKey = hostKey;
  state.localAgentId = `agent-${clientId}`;
  state.localProfile = readIdentityProfile();
  state.organizer = {
    ...state.organizer,
    name: state.localProfile.name,
    callsign: state.localProfile.callsign,
    clientId
  };
  state.auth = {
    accessCode: generateAccessCode(state.localProfile.callsign),
    requireAccessCode: true,
    hostKey,
    organizerClientId: clientId
  };
}

function readIdentityProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(identityStorageKey) || "null");
    if (stored && typeof stored === "object") {
      return {
        name: cleanIdentityText(stored.name, "Morgan", 22),
        callsign: cleanIdentityText(stored.callsign, "Raven", 14)
      };
    }
  } catch {
    localStorage.removeItem(identityStorageKey);
  }
  return { name: "Morgan", callsign: "Raven" };
}

function writeIdentityProfile(profile) {
  state.localProfile = {
    name: cleanIdentityText(profile.name, "Morgan", 22),
    callsign: cleanIdentityText(profile.callsign, "Raven", 14)
  };
  localStorage.setItem(identityStorageKey, JSON.stringify(state.localProfile));
}

function cleanIdentityText(value, fallback, maxLength) {
  return String(value || fallback)
    .replace(/[^\w \-.]/g, "")
    .trim()
    .slice(0, maxLength) || fallback;
}

function cleanAccessCode(value, fallback = "") {
  return String(value || fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 18);
}

function generateAccessCode(seed = "RAVEN") {
  const prefix = cleanAccessCode(seed, "RAVEN").replace(/-/g, "").slice(0, 7) || "RAVEN";
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function updateLocalProfile(patch) {
  writeIdentityProfile({ ...state.localProfile, ...patch });
}

function updateOrganizerIdentity() {
  const name = cleanIdentityText($("#organizerNameInput").value, "Morgan", 22);
  const callsign = cleanIdentityText($("#organizerCallsignInput").value, "Raven", 14);
  writeIdentityProfile({ name, callsign });
  state.organizer = {
    name,
    callsign,
    clientId: state.clientId
  };
  state.auth.organizerClientId = state.clientId;
  state.auth.hostKey = state.localHostKey || state.auth.hostKey;
  state.chat.push(["Organizer", `${callsign} updated the host profile.`]);
  logAudit("Identity", `Host profile set to ${callsign}`, name);
  renderAll();
  commitState();
}

function updateSessionAuth() {
  const accessCode = cleanAccessCode($("#organizerAccessCodeInput").value, state.auth?.accessCode || generateAccessCode(state.organizer?.callsign));
  state.auth = {
    ...state.auth,
    accessCode,
    requireAccessCode: $("#requireAccessCodeToggle").checked,
    hostKey: state.auth?.hostKey || state.localHostKey || "",
    organizerClientId: state.organizer?.clientId || state.clientId
  };
  $("#roleAccessCodeInput").value = accessCode;
  $("#agentAccessCodeInput").value = accessCode;
  state.chat.push(["Organizer", state.auth.requireAccessCode ? "Agent access code required for joins." : "Agent access code made optional."]);
  logAudit("Identity", state.auth.requireAccessCode ? "Enabled agent access code gate" : "Disabled agent access code gate", state.organizer?.callsign || "Organizer");
  renderAll();
  commitState();
}

function initAudio() {
  const audio = $("#themeAudio");
  const toggle = $("#audioToggle");
  const volume = $("#volumeSlider");
  const status = $("#audioStatus");
  const time = $("#audioTime");
  const setupStatus = $("#setupAudioStatus");
  const setupTime = $("#setupAudioTime");
  const setupToggle = $("#setupAudioToggle");
  const setupVolume = $("#setupVolumeSlider");
  audio.volume = Number(volume.value) / 100;
  const render = () => {
    document.body.classList.toggle("theme-playing", !audio.paused);
    const statusText = audio.paused ? "Theme idle" : "Theme live";
    const timeText = formatTime(audio.currentTime || 0);
    status.textContent = statusText;
    time.textContent = timeText;
    if (setupStatus) setupStatus.textContent = statusText;
    if (setupTime) setupTime.textContent = timeText;
  };
  const doToggle = async () => {
    if (audio.paused) {
      try { await audio.play(); }
      catch { status.textContent = "Tap to enable"; }
    } else { audio.pause(); }
    render();
  };
  toggle.addEventListener("click", doToggle);
  if (setupToggle) setupToggle.addEventListener("click", doToggle);
  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value) / 100;
    if (setupVolume) setupVolume.value = volume.value;
  });
  if (setupVolume) {
    setupVolume.addEventListener("input", () => {
      audio.volume = Number(setupVolume.value) / 100;
      volume.value = setupVolume.value;
    });
  }
  audio.addEventListener("timeupdate", render);
  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  render();
}

function initMap() {
  if (location.protocol === "file:") {
    useFallbackMap = true;
    mapFallbackReason = "file";
    return;
  }
  if (!window.L) {
    useFallbackMap = true;
    mapFallbackReason = "library";
    return;
  }
  map = L.map("map", { zoomControl: false }).setView(cities[state.city].center, leafletZoomLevel());
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  })
    .on("tileerror", () => {
      useFallbackMap = true;
      mapFallbackReason = "tiles";
      renderFallbackMap();
    })
    .addTo(map);
}

function initSetupMap() {
  const node = $("#setupLeafletMap");
  if (!node || location.protocol === "file:" || !window.L) return;
  setupMap = L.map(node, {
    attributionControl: false,
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true
  }).setView(cities[state.city].center, 14);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  })
    .on("tileerror", () => {
      setupMap = null;
      $("#setupMapPreview")?.classList.remove("real-map");
      renderSetupMap();
    })
    .addTo(setupMap);
  setupMap.on("click", (event) => renderCustomMarkerInputs(event.latlng.lat, event.latlng.lng));
}

function startMission() {
  if (!state.objectives.length) generateObjectives();
  if (!state.threats.length) generateThreats();
  if (!state.agents.length) joinAgent();
  state.status = "Live";
  state.remaining = state.duration * 60;
  state.chat.push(["System", "Mission clock started. Restore GPS by decoding the signal chain."]);
  logAudit("Mission", `Started ${state.duration} minute run`, state.organizer?.callsign || "Organizer");
  clearInterval(timerId);
  clearInterval(simulationId);
  clearInterval(heartbeatId);
  timerId = setInterval(() => {
    state.remaining = Math.max(0, state.remaining - 1);
    if (state.remaining === 0) {
      state.status = "Complete";
      stopMissionLoops();
      commitState();
    } else if (state.remaining % 5 === 0) {
      commitState();
    }
    renderStatus();
  }, 1000);
  simulationId = setInterval(simulateWorld, 2500);
  heartbeatId = setInterval(() => commitState(), 5000);
  renderAll();
  commitState();
}

function resetMission() {
  stopMissionLoops();
  state.status = "Lobby";
  state.remaining = state.duration * 60;
  state.objectives = [];
  generateObjectives();
  generateThreats();
  state.agents.forEach((agent, index) => {
    const [lat, lng] = jitter(cities[state.city].center, index === 0 ? 0.004 : 0.009);
    agent.lat = lat;
    agent.lng = lng;
    agent.signal = clamp(agent.signal || 78, 62, 92);
    agent.stamina = clamp(agent.stamina || 92, 70, 100);
  });
  state.chat.push(["System", "Mission reset. Squad ready in the lobby."]);
  logAudit("Mission", "Reset mission to lobby", state.organizer?.callsign || "Organizer");
  renderAll();
  commitState();
}

function joinAgent() {
  const name = cleanIdentityText($("#agentName").value, state.localProfile?.name || "Agent", 18);
  const role = $("#roleSelect").value;
  const team = $("#teamSelect").value;
  const existing = state.agents.find((agent) => agent.id === state.localAgentId);
  if (!agentAccessValid() && !existing) {
    state.chat.push(["System", `${name} needs the current session access code before joining.`]);
    logAudit("Identity", `Blocked join for ${name}: access code mismatch`, "System");
    renderAll();
    commitState();
    return;
  }
  if (state.sessionMode === "locked" && !existing) {
    state.chat.push(["System", "Session is locked. Organizer must unlock the lobby before new agents can join."]);
    renderAll();
    commitState();
    return;
  }
  const manual = getManualCoordinates();
  const [lat, lng] = manual || jitter(cities[state.city].center, 0.004);
  const agent = existing || {
    id: state.localAgentId,
    name,
    role,
    team,
    lat,
    lng,
    signal: 78,
    stamina: 92
  };
  Object.assign(agent, {
    name,
    role,
    team,
    clientId: state.clientId,
    identity: {
      name,
      callsign: state.localProfile?.callsign || "",
      accessVerifiedAt: Date.now(),
      joinedAt: agent.identity?.joinedAt || Date.now()
    },
    lastSeen: Date.now()
  });
  if (!existing) state.agents.push(agent);
  while (state.agents.length < Math.min(4, state.maxPlayers)) {
    const aiRole = Object.keys(roleCatalog)[state.agents.length % Object.keys(roleCatalog).length];
    const [aiLat, aiLng] = jitter(cities[state.city].center, 0.009);
    state.agents.push({
      id: `bot-${state.agents.length}`,
      name: ["Ada", "Mika", "Rune", "Liv"][state.agents.length - 1] || `Bot ${state.agents.length}`,
      role: aiRole,
      team: state.agents.length % 2 ? "North" : "South",
      lat: aiLat,
      lng: aiLng,
      signal: 62 + Math.round(Math.random() * 30),
      stamina: 70 + Math.round(Math.random() * 25),
      bot: true,
      lastSeen: Date.now()
    });
  }
  state.chat.push(["System", `${name} joined as ${role}.`]);
  logAudit("Roster", `${existing ? "Updated" : "Joined"} ${name} as ${role}`, team);
  renderManualCoordinates(agent.lat, agent.lng);
  renderAll();
  commitState();
  sendPresenceHeartbeat();
}

function agentAccessValid() {
  if (!state.auth?.requireAccessCode) return true;
  const supplied = cleanAccessCode($("#agentAccessCodeInput")?.value || $("#roleAccessCodeInput")?.value || "");
  return Boolean(supplied && supplied === state.auth.accessCode);
}

function generateObjectives() {
  const center = cities[state.city].center;
  const types = [
    ...enabledMissionPack("ciphers"),
    ...enabledMissionPack("treasure"),
    ...enabledMissionPack("waypoints"),
    ...customMarkerPack(),
    ...missionPacks.extraction
  ];
  state.objectives = types.map(([title, type, radius, brief, meta = {}], index) => {
    const marker =
      meta.source === "custom"
        ? state.customMarkers.find((item) => item.id === meta.markerId && markerInMissionArea(item) && markerIsArmed(item))
        : null;
    const [lat, lng] = marker ? [marker.lat, marker.lng] : jitter(center, 0.006 + index * 0.0018);
    return {
      id: `obj-${index}`,
      title,
      type,
      brief,
      radius,
      lat,
      lng,
      source: meta.source || "pack",
      markerId: meta.markerId || "",
      behavior: meta.behavior || "",
      behaviorLabel: meta.behaviorLabel || "",
      decoded: index === 0,
      found: false,
      progress: index === 0 ? 22 : 0
    };
  });
}

function generateThreats() {
  const center = cities[state.city].center;
  const seeds = [
    ["Jammer Kestrel", 135, 0.008, 0.00042],
    ["Hunter Relay", 115, 0.011, 0.00034],
    ["False Beacon", 95, 0.0065, 0.0005]
  ];
  state.threats = seeds.map(([name, radius, spread, speed], index) => {
    const [lat, lng] = jitter(center, spread);
    return {
      id: `threat-${index}`,
      name,
      radius,
      lat,
      lng,
      angle: Math.random() * Math.PI * 2,
      speed,
      alert: false,
      lastHit: 0
    };
  });
}

function decodeNextObjective() {
  const next = state.objectives.find((objective) => !objective.decoded);
  if (!next) {
    state.chat.push(["Decoder", "All objective packets are open. Move to extraction."]);
    logAudit("Objective", "All objective packets already open", "Decoder");
    renderAll();
    commitState();
    return;
  }
  next.decoded = true;
  next.progress = Math.max(next.progress, 18);
  state.chat.push(["Decoder", `${next.title} decoded. Coordinates revealed.`]);
  logAudit("Objective", `${next.title} decoded`, "Decoder");
  renderAll();
  commitState();
}

function simulateWorld() {
  if (state.status !== "Live") return;
  updateThreats();
  applyCustomMarkerHazards();
  state.agents.forEach((agent) => {
    agent.lat += (Math.random() - 0.5) * 0.0011;
    agent.lng += (Math.random() - 0.5) * 0.0014;
    agent.signal = clamp(agent.signal + Math.round(Math.random() * 10 - 5), 38, 98);
    agent.stamina = clamp(agent.stamina + Math.round(Math.random() * 6 - 4), 35, 100);
  });
  state.objectives.forEach((objective) => {
    if (!objective.decoded || objective.found) return;
    const nearest = nearestAgentDistance(objective);
    objective.progress = clamp(objective.progress + (nearest < 180 ? 8 : 2), 0, 100);
    if (nearest <= objective.radius || objective.progress >= 100) {
      objective.found = true;
      objective.progress = 100;
      resolveObjectiveReward(objective);
      state.chat.push(["Mission Control", `${objective.title} complete.`]);
      logAudit("Objective", `${objective.title} completed`, "Mission Control");
    }
  });
  if (state.objectives.length && state.objectives.every((objective) => objective.found)) {
    state.status = "Complete";
    state.chat.push(["System", "Signal restored. Extraction route is clear."]);
    logAudit("Mission", "Signal restored and extraction route cleared", "System");
    stopMissionLoops();
  }
  renderAll();
  commitState();
}

function updateThreats() {
  if (!state.threats.length) generateThreats();
  const center = cities[state.city].center;
  const now = Date.now();
  state.threats.forEach((threat, index) => {
    threat.angle = Number(threat.angle || 0) + 0.38 + index * 0.08;
    const orbit = Number(threat.speed || 0.00038);
    threat.lat += Math.sin(threat.angle) * orbit;
    threat.lng += Math.cos(threat.angle * 0.9) * orbit * 1.25;
    const drift = haversine({ lat: threat.lat, lng: threat.lng }, { lat: center[0], lng: center[1] });
    if (drift > 1450) {
      const [lat, lng] = jitter(center, 0.01);
      threat.lat = lat;
      threat.lng = lng;
    }
    const exposed = state.agents.filter((agent) => haversine(agent, threat) <= threat.radius);
    threat.alert = exposed.length > 0;
    if (exposed.length && now - Number(threat.lastHit || 0) > 9000) {
      exposed.forEach((agent) => {
        agent.signal = clamp(agent.signal - 8, 24, 98);
        agent.stamina = clamp(agent.stamina - 4, 20, 100);
      });
      threat.lastHit = now;
      state.chat.push(["AI Watch", `${threat.name} jammed ${exposed.map((agent) => agent.name).join(", ")}.`]);
    }
  });
}

function applyCustomMarkerHazards() {
  const now = Date.now();
  state.customMarkers
    .filter(markerInMissionArea)
    .filter(markerIsArmed)
    .filter((marker) => marker.type === "Danger")
    .forEach((marker) => {
      const radius = markerObjectiveRadius(marker);
      const exposed = state.agents.filter((agent) => haversine(agent, marker) <= radius);
      if (!exposed.length || now - Number(marker.lastHit || 0) < 12000) return;
      exposed.forEach((agent) => {
        agent.signal = clamp(agent.signal - 6, 18, 98);
        agent.stamina = clamp(agent.stamina - 3, 15, 100);
      });
      marker.lastHit = now;
      state.chat.push(["Organizer", `${marker.title} hazard hit ${exposed.map((agent) => agent.name).join(", ")}.`]);
    });
}

function resolveObjectiveReward(objective) {
  if (objective.source !== "custom") return;
  const marker = state.customMarkers.find((item) => item.id === objective.markerId);
  if (!marker || marker.rewardedAt) return;
  if (marker.type === "Cache") {
    state.agents.forEach((agent) => {
      agent.signal = clamp(agent.signal + 6, 0, 100);
      agent.stamina = clamp(agent.stamina + 6, 0, 100);
    });
    state.chat.push(["Organizer", `${marker.title} cache restored squad signal and stamina.`]);
  }
  if (marker.type === "Extraction") {
    state.chat.push(["Organizer", `${marker.title} opened the extraction lane.`]);
  }
  marker.taskState = "complete";
  marker.rewardedAt = Date.now();
}

function setView(view) {
  state.activeView = view;
  document.body.dataset.view = view;
  ["host", "field", "radar"].forEach((item) => {
    $(`#${item}View`).classList.toggle("selected", item === view);
  });
  setTimeout(() => map?.invalidateSize(), 80);
}

function setMapLayer(layer) {
  if (!mapLayers[layer]) return;
  state.mapLayer = layer;
  renderMapLayerControls();
  drawMap();
  renderMapSourceLabel();
  renderMapLayerBadge();
  commitState();
}

function setMapZoom(zoom) {
  state.mapZoom = clamp(Number(zoom) || 1, 0.7, 1.9);
  if (map && !useFallbackMap) map.setZoom(leafletZoomLevel());
  renderMapZoomControls();
  drawMap();
  commitState();
}

function renderMapLayerControls() {
  $("#mapLayerControl")?.querySelectorAll("[data-map-layer]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.mapLayer === state.mapLayer);
  });
  document.body.dataset.mapLayer = state.mapLayer;
  renderMapLayerBadge();
}

function renderMapZoomControls() {
  const value = $("#mapZoomValue");
  if (value) value.textContent = `${Math.round(state.mapZoom * 100)}%`;
  $("#mapZoomOut")?.toggleAttribute("disabled", state.mapZoom <= 0.71);
  $("#mapZoomIn")?.toggleAttribute("disabled", state.mapZoom >= 1.89);
}

function leafletZoomLevel() {
  return clamp(Math.round(14 + (Number(state.mapZoom) - 1) * 4), 12, 18);
}

function mapZoomScale() {
  return clamp(Number(state.mapZoom) || 1, 0.7, 1.9);
}

function renderAll() {
  if (!Array.isArray(state.customMarkers)) state.customMarkers = [];
  if (!Array.isArray(state.audit)) state.audit = [];
  if (!state.objectives.length || state.objectives.some((objective) => !objective.brief)) generateObjectives();
  if (!Array.isArray(state.threats) || !state.threats.length) generateThreats();
  if (!["setup", "roles", "mission"].includes(state.screen)) state.screen = "setup";
  if (!mapLayers[state.mapLayer]) state.mapLayer = "street";
  if (typeof state.selectedTemplateId !== "string") state.selectedTemplateId = "";
  if (!chatFilterCatalog.includes(state.chatFilter)) state.chatFilter = "All";
  if (!auditFilterCatalog.includes(state.auditFilter)) state.auditFilter = "All";
  if (!sessionModes[state.sessionMode]) state.sessionMode = state.isPublic ? "public" : "private";
  state.isPublic = state.sessionMode !== "private";
  normalizeIdentityState();
  normalizeAuthState();
  state.mapZoom = clamp(Number(state.mapZoom) || 1, 0.7, 1.9);
  state.themePalette = themePalettes[state.themePalette] ? state.themePalette : "classic";
  applyThemePalette(state.themePalette);
  document.body.dataset.mapLayer = state.mapLayer;
  state.country = cities[state.city]?.country || state.country || "norway";
  renderCityOptions();
  $("#setupCountrySelect").value = state.country;
  $("#setupCitySelect").value = state.city;
  $("#setupDurationInput").value = state.duration;
  $("#setupDurationValue").textContent = `${state.duration} min`;
  $("#setupPlayerSlider").value = state.maxPlayers;
  $("#setupPlayerValue").textContent = `${state.maxPlayers} players`;
  $("#setupPublicToggle").checked = state.isPublic;
  $("#setupSessionMode").value = state.sessionMode;
  $("#organizerNameInput").value = state.organizer.name;
  $("#organizerCallsignInput").value = state.organizer.callsign;
  $("#organizerAccessCodeInput").value = state.auth.accessCode;
  $("#requireAccessCodeToggle").checked = Boolean(state.auth.requireAccessCode);
  $("#organizerClientPill").textContent = state.organizer.clientId === state.clientId ? "This browser" : "Remote host";
  if (!$("#agentName").value.trim()) $("#agentName").value = state.localProfile.name;
  $("#roleAgentName").value = $("#agentName").value || state.localProfile.name;
  if (state.auth.hostKey && state.auth.hostKey === state.localHostKey) {
    if (!$("#roleAccessCodeInput").value.trim() && state.auth.accessCode) $("#roleAccessCodeInput").value = state.auth.accessCode;
    if (!$("#agentAccessCodeInput").value.trim() && state.auth.accessCode) $("#agentAccessCodeInput").value = state.auth.accessCode;
  }
  $("#roleTeamSelect").value = $("#teamSelect").value;
  $("#citySelect").value = state.city;
  $("#durationInput").value = state.duration;
  $("#durationValue").textContent = `${state.duration} min`;
  $("#playerSlider").value = state.maxPlayers;
  $("#playerValue").textContent = `${state.maxPlayers} players`;
  $("#publicToggle").checked = state.isPublic;
  $("#sessionModeSelect").value = state.sessionMode;
  $("#privacyPill").textContent = sessionModes[state.sessionMode].label;
  $("#privacyPill").title = sessionModes[state.sessionMode].detail;
  $("#sessionCode").textContent = state.code;
  const setupSessionCode = $("#setupSessionCode");
  if (setupSessionCode) setupSessionCode.textContent = state.code;
  $("#copyJoinLink").textContent = "Copy Join Link";
  renderMapSourceLabel();
  renderMapLayerControls();
  renderMapZoomControls();
  $("#mapTitle").textContent = `${cities[state.city].name} Mission Area`;
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  if (local) renderManualCoordinates(local.lat, local.lng);
  renderStatus();
  renderMissionRecap();
  renderAuditLog();
  renderSetupSummary();
  renderIdentitySummary();
  renderModeration();
  renderGMConsole();
  renderTemplates();
  renderMissionReview();
  renderSetupModules();
  renderSetupMap();
  renderCustomMarkerList();
  renderMarkerEditorMode();
  renderRoleCards();
  renderRoleReadiness();
  renderModules();
  renderFieldDashboard();
  renderCoordinateSync();
  renderThreats();
  renderObjectives();
  renderRole();
  renderChat();
  drawMap();
  setView(state.activeView);
  setScreen(state.screen);
}

function normalizeIdentityState() {
  state.localProfile = {
    name: cleanIdentityText(state.localProfile?.name, "Morgan", 22),
    callsign: cleanIdentityText(state.localProfile?.callsign, "Raven", 14)
  };
  state.organizer = {
    name: cleanIdentityText(state.organizer?.name, state.localProfile.name, 22),
    callsign: cleanIdentityText(state.organizer?.callsign, state.localProfile.callsign, 14),
    clientId: state.organizer?.clientId || state.clientId
  };
}

function normalizeAuthState() {
  const auth = state.auth && typeof state.auth === "object" ? state.auth : {};
  state.auth = {
    accessCode: cleanAccessCode(auth.accessCode, generateAccessCode(state.organizer?.callsign || state.localProfile?.callsign)),
    requireAccessCode: auth.requireAccessCode !== false,
    hostKey: auth.hostKey || state.localHostKey || "",
    organizerClientId: auth.organizerClientId || state.organizer?.clientId || state.clientId
  };
}

async function copyJoinLink() {
  const button = $("#copyJoinLink");
  const url = new URL(location.href);
  url.searchParams.set("code", state.code);
  try {
    await navigator.clipboard.writeText(url.toString());
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  }
  setTimeout(() => {
    button.textContent = "Copy Join Link";
  }, 1800);
}

function useDeviceGps() {
  const status = $("#gpsStatus");
  if (!navigator.geolocation) {
    updateGpsPermissionUi("unavailable", "Device GPS unavailable", "Manual coordinates are still supported.");
    return;
  }
  if (!gpsSecureContext()) {
    updateGpsPermissionUi("blocked", "GPS needs HTTPS or localhost", "Use the local server or manual coordinates.");
    return;
  }
  updateGpsPermissionUi("prompt", "Requesting GPS permission", "Approve the browser prompt to start live tracking.");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateLocalAgentPosition(position.coords.latitude, position.coords.longitude, "Device GPS locked", position.coords.accuracy);
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = navigator.geolocation.watchPosition(
        (next) => updateLocalAgentPosition(next.coords.latitude, next.coords.longitude, "Live GPS tracking", next.coords.accuracy),
        () => {
          updateGpsPermissionUi("prompt", "Live GPS paused", "Retry GPS or use manual coordinates.");
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    },
    (error) => {
      const denied = error.code === error.PERMISSION_DENIED;
      updateGpsPermissionUi(denied ? "denied" : "blocked", denied ? "GPS permission denied" : "GPS lock failed", "Use manual coordinates, or retry after enabling location access.");
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
  );
}

function applyManualGps() {
  const manual = getManualCoordinates();
  if (!manual) {
    updateGpsPermissionUi("manual", "Enter valid coordinates", "Latitude must be -90..90 and longitude -180..180.");
    return;
  }
  updateLocalAgentPosition(manual[0], manual[1], "Manual GPS applied");
}

function getManualCoordinates() {
  const lat = Number($("#manualLat").value);
  const lng = Number($("#manualLng").value);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

function updateLocalAgentPosition(lat, lng, message, accuracy) {
  let local = state.agents.find((agent) => agent.id === state.localAgentId);
  if (!local) {
    joinAgent();
    local = state.agents.find((agent) => agent.id === state.localAgentId);
  }
  if (!local) return;
  local.lat = lat;
  local.lng = lng;
  local.signal = Math.max(local.signal || 78, 82);
  local.gpsAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : local.gpsAccuracy || null;
  updateGpsPermissionUi(message.includes("Manual") ? "manual" : "granted", message, local.gpsAccuracy ? `Accuracy approx ${local.gpsAccuracy}m` : "Position ready.");
  renderManualCoordinates(lat, lng);
  drawMap();
  renderStatus();
  renderFieldDashboard();
  renderCoordinateSync();
  commitState();
}

function renderManualCoordinates(lat, lng) {
  $("#manualLat").value = Number(lat).toFixed(6);
  $("#manualLng").value = Number(lng).toFixed(6);
}

async function initGpsPermissionState() {
  if (!navigator.geolocation) {
    updateGpsPermissionUi("unavailable", "Device GPS unavailable", "Manual coordinates are still supported.");
    return;
  }
  if (!gpsSecureContext()) {
    updateGpsPermissionUi("blocked", "GPS needs HTTPS or localhost", "Manual coordinates are available for testing.");
    return;
  }
  if (!navigator.permissions?.query) {
    updateGpsPermissionUi("prompt", "GPS permission available", "Tap Use Device GPS when ready.");
    return;
  }
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    updateGpsPermissionUi(permission.state, gpsPermissionLabel(permission.state), gpsPermissionHelp(permission.state));
    permission.onchange = () => updateGpsPermissionUi(permission.state, gpsPermissionLabel(permission.state), gpsPermissionHelp(permission.state));
  } catch {
    updateGpsPermissionUi("prompt", "GPS permission available", "Tap Use Device GPS when ready.");
  }
}

function gpsSecureContext() {
  return window.isSecureContext || ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
}

function gpsPermissionLabel(stateName) {
  if (stateName === "granted") return "GPS permission granted";
  if (stateName === "denied") return "GPS permission blocked";
  return "GPS permission not requested";
}

function gpsPermissionHelp(stateName) {
  if (stateName === "granted") return "Tap Use Device GPS to start or refresh live tracking.";
  if (stateName === "denied") return "Enable location in browser settings or use manual coordinates.";
  return "Tap Use Device GPS when the field agent is ready.";
}

function updateGpsPermissionUi(mode, statusText, helpText) {
  const status = $("#gpsStatus");
  const pill = $("#gpsPermissionPill");
  const accuracy = $("#gpsAccuracyReadout");
  const help = $("#gpsHelpText");
  const control = $(".gps-control");
  if (status) status.textContent = statusText;
  if (pill) {
    pill.textContent = gpsPermissionPillText(mode);
    pill.dataset.mode = mode;
  }
  if (accuracy) accuracy.textContent = helpText;
  if (help) help.textContent = helpText;
  if (control) control.dataset.gpsMode = mode;
}

function gpsPermissionPillText(mode) {
  if (mode === "granted") return "Live ready";
  if (mode === "manual") return "Manual";
  if (mode === "denied") return "Blocked";
  if (mode === "blocked") return "Unavailable";
  if (mode === "unavailable") return "No device GPS";
  return "Ask on tap";
}

function renderStatus() {
  $("#gameStatus").textContent = state.status;
  $("#missionTimer").textContent = formatTime(state.remaining);
  const averageSignal = state.agents.length
    ? Math.round(state.agents.reduce((sum, agent) => sum + agent.signal, 0) / state.agents.length)
    : 72;
  $("#signalValue").textContent = `${averageSignal}%`;
  $("#playerCount").textContent = `${state.agents.length}/${state.maxPlayers}`;
  $("#foundCount").textContent = `${state.objectives.filter((objective) => objective.found).length}/${state.objectives.length}`;
  const nearest = state.objectives.length ? Math.min(...state.objectives.filter((objective) => !objective.found).map(nearestAgentDistance)) : 0;
  $("#nearestDistance").textContent = Number.isFinite(nearest) ? formatDistance(nearest) : "--";
}

function missionScore() {
  const found = state.objectives.filter((objective) => objective.found).length;
  const total = Math.max(state.objectives.length, 1);
  const objectiveScore = found * 140;
  const progressScore = Math.round(state.objectives.reduce((sum, objective) => sum + Number(objective.progress || 0), 0) / total);
  const timeScore = state.status === "Complete" ? Math.round((state.remaining / Math.max(state.duration * 60, 1)) * 220) : 0;
  const avgSignal = state.agents.length ? state.agents.reduce((sum, agent) => sum + Number(agent.signal || 0), 0) / state.agents.length : 72;
  const avgStamina = state.agents.length ? state.agents.reduce((sum, agent) => sum + Number(agent.stamina || 0), 0) / state.agents.length : 92;
  const squadScore = state.agents.length ? Math.round((avgSignal + avgStamina) * 1.2) : 0;
  const threatPenalty = state.threats.filter((threat) => threat.alert).length * 35;
  const score = Math.max(0, objectiveScore + progressScore + timeScore + squadScore - threatPenalty);
  return { score, found, total, avgSignal, avgStamina, threatPenalty };
}

function teamScores() {
  const base = missionScore();
  const teams = {};
  state.agents.forEach((agent) => {
    const team = agent.team || "Unassigned";
    teams[team] ||= { team, agents: 0, signal: 0, stamina: 0, score: 0 };
    teams[team].agents += 1;
    teams[team].signal += Number(agent.signal || 0);
    teams[team].stamina += Number(agent.stamina || 0);
  });
  return Object.values(teams)
    .map((team) => {
      const avgSignal = team.agents ? team.signal / team.agents : 0;
      const avgStamina = team.agents ? team.stamina / team.agents : 0;
      return {
        ...team,
        score: Math.round(base.score / Math.max(Object.keys(teams).length, 1) + avgSignal + avgStamina + team.agents * 12)
      };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreGrade(score) {
  if (score >= 1100) return "S";
  if (score >= 850) return "A";
  if (score >= 620) return "B";
  if (score >= 380) return "C";
  return "--";
}

function renderMissionRecap() {
  const score = missionScore();
  const teams = teamScores();
  const complete = state.status === "Complete";
  $("#recapTitle").textContent = complete ? "Mission Recap" : "Live Recap";
  $("#scoreValue").textContent = score.score.toLocaleString();
  $("#scoreGrade").textContent = scoreGrade(score.score);
  $("#teamLeadValue").textContent = teams[0]?.team || "--";
  $("#teamScoreList").innerHTML = teams.length
    ? teams
        .map(
          (team) => `
            <article class="${team.team === teams[0].team ? "leading" : ""}">
              <strong>${escapeHtml(team.team)}</strong>
              <span>${team.agents} agents / ${team.score.toLocaleString()} pts</span>
            </article>
          `
        )
        .join("")
    : `<article><strong>No teams yet</strong><span>Join agents to start scoring.</span></article>`;
  $("#recapSummary").textContent = complete
    ? `${score.found}/${score.total} objectives complete with ${formatTime(state.remaining)} left. Avg signal ${Math.round(score.avgSignal)}%, stamina ${Math.round(score.avgStamina)}%.`
    : `${score.found}/${score.total} objectives found. Score updates live from progress, squad health, time, and threat pressure.`;
}

function renderModules() {
  normalizeEnabledModules();
  const core = coreModules
    .map(([name, detail]) => `<article class="module-card"><strong>${name}</strong><span>${detail}</span></article>`)
    .join("");
  const toggles = moduleCatalog
    .map(
      ([key, name, detail]) => `
        <article class="module-card module-toggle-card ${moduleEnabled(key) ? "enabled" : ""}">
          <div>
            <strong>${name}</strong>
            <span>${detail}</span>
          </div>
          <button class="ghost-button compact-button" type="button" data-module-key="${key}">
            ${moduleEnabled(key) ? "On" : "Off"}
          </button>
        </article>
      `
    )
    .join("");
  $("#moduleList").innerHTML = core + toggles;
  $("#moduleList").querySelectorAll("[data-module-key]").forEach((button) => {
    button.addEventListener("click", () => toggleModule(button.dataset.moduleKey));
  });
}

function renderSetupSummary() {
  const enabled = moduleCatalog.filter(([key]) => moduleEnabled(key)).map(([, name]) => name);
  $("#setupSummary").innerHTML = `
    <article><span>City</span><strong>${cities[state.city].name}</strong></article>
    <article><span>Runtime</span><strong>${state.duration} min</strong></article>
    <article><span>Squad</span><strong>${state.maxPlayers} agents</strong></article>
    <article><span>Packs</span><strong>${enabled.length}</strong></article>
  `;
}

function renderIdentitySummary() {
  const holder = $("#identitySummary");
  if (!holder) return;
  const joined = state.agents.some((agent) => agent.clientId === state.clientId || agent.id === state.localAgentId);
  const trustedHost = state.auth?.hostKey && state.auth.hostKey === state.localHostKey;
  const access = state.auth?.requireAccessCode ? "Code required" : "Open join";
  holder.innerHTML = `
    <article>
      <span>Host</span>
      <strong>${escapeHtml(state.organizer.callsign)}</strong>
      <small>${escapeHtml(state.organizer.name)}</small>
    </article>
    <article>
      <span>Local player</span>
      <strong>${escapeHtml(state.localProfile.name)}</strong>
      <small>${joined ? "Joined this lobby" : "Not joined yet"}</small>
    </article>
    <article>
      <span>Access</span>
      <strong>${escapeHtml(access)}</strong>
      <small>${state.auth?.accessCode ? "Session code set" : "No code"}</small>
    </article>
    <article>
      <span>Host key</span>
      <strong>${trustedHost ? "Trusted" : "Remote"}</strong>
      <small>${escapeHtml((state.auth?.hostKey || "pending").slice(-10))}</small>
    </article>
  `;
}

function logAudit(type, message, actor = "") {
  if (!Array.isArray(state.audit)) state.audit = [];
  const last = state.audit[state.audit.length - 1];
  const next = {
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    type,
    actor,
    message
  };
  if (last && last.type === next.type && last.message === next.message && Date.now() - Number(last.at || 0) < 1200) return;
  state.audit.push(next);
  state.audit = state.audit.slice(-80);
}

function renderAuditLog() {
  const holder = $("#auditLog");
  const pill = $("#auditCountPill");
  const filterBar = $("#auditFilterBar");
  if (!holder || !pill) return;
  const allEvents = Array.isArray(state.audit) ? state.audit : [];
  const filtered = state.auditFilter === "All" ? allEvents : allEvents.filter((event) => event.type === state.auditFilter);
  const events = filtered.slice(-8).reverse();
  pill.textContent = state.auditFilter === "All" ? `${allEvents.length} events` : `${filtered.length}/${allEvents.length} events`;
  if (filterBar) {
    filterBar.innerHTML = auditFilterCatalog
      .map((filter) => {
        const count = filter === "All" ? allEvents.length : allEvents.filter((event) => event.type === filter).length;
        return `<button class="${state.auditFilter === filter ? "selected" : ""}" type="button" data-audit-filter="${escapeHtml(filter)}">${escapeHtml(auditFilterLabel(filter))}<b>${count}</b></button>`;
      })
      .join("");
  }
  holder.innerHTML = events.length
    ? events
        .map(
          (event) => `
            <article>
              <b>${escapeHtml(event.type || "Event")}</b>
              <span>${escapeHtml(event.message || "")}</span>
              <small>${escapeHtml(event.actor || "System")} / ${formatAuditTime(event.at)}</small>
            </article>
          `
        )
        .join("")
    : `<article><b>No audit events yet</b><span>${state.auditFilter === "All" ? "Organizer actions will appear here." : `No ${state.auditFilter} events match this filter.`}</span><small>Standby</small></article>`;
}

function setAuditFilter(filter) {
  if (!auditFilterCatalog.includes(filter)) return;
  state.auditFilter = filter;
  renderAuditLog();
  saveState();
}

function auditFilterLabel(filter) {
  return filter === "GM Console" ? "GM" : filter;
}

function formatAuditTime(value) {
  const date = new Date(Number(value || Date.now()));
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderModeration() {
  const count = $("#moderationCount");
  const roster = $("#moderationRoster");
  const lockButton = $("#toggleLobbyLock");
  if (!roster || !count || !lockButton) return;
  count.textContent = `${state.agents.length}/${state.maxPlayers} agents`;
  lockButton.textContent = state.sessionMode === "locked" ? "Unlock Public" : "Lock Lobby";
  lockButton.classList.toggle("danger-button", state.sessionMode !== "locked");
  $("#clearInactiveAgents").toggleAttribute("disabled", inactiveAgents().length === 0);
  roster.innerHTML = state.agents.length
    ? state.agents
        .map((agent) => {
          const isLocal = agent.id === state.localAgentId;
          const isBot = botAgent(agent);
          const stale = agentIsInactive(agent);
          const label = isLocal ? "Leave" : "Remove";
          const meta = [
            agent.team || "No team",
            agent.identity?.callsign || agent.role || "Agent",
            isBot ? "sim" : stale ? "inactive" : `active ${formatPresenceAge(agent.lastSeen)}`
          ].join(" / ");
          return `
            <article class="${isLocal ? "local" : ""} ${stale ? "inactive" : ""}">
              <div>
                <b>${escapeHtml(agent.name)}</b>
                <span>${escapeHtml(meta)}</span>
              </div>
              <button class="ghost-button compact-button ${isLocal || stale ? "danger-button" : ""}" type="button" data-remove-agent="${escapeHtml(agent.id)}">${label}</button>
            </article>
          `;
        })
        .join("")
    : `<article><div><b>No agents yet</b><span>Joined players appear here.</span></div></article>`;
}

function toggleLobbyLock() {
  const nextMode = state.sessionMode === "locked" ? "public" : "locked";
  setSessionMode(nextMode);
  updateModerationStatus(nextMode === "locked" ? "Lobby locked to new agents." : "Lobby reopened as public.");
}

function removeAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;
  const action = agent.id === state.localAgentId ? "leave this squad" : `remove ${agent.name}`;
  if (!window.confirm(`Organizer moderation will ${action} from this session. Continue?`)) return;
  state.agents = state.agents.filter((item) => item.id !== agentId);
  if (agent.id === state.localAgentId) state.localAgentId = `agent-${state.clientId}`;
  state.chat.push(["Organizer", `${agent.name} removed from the squad roster.`]);
  logAudit("Moderation", `${agent.name} removed from roster`, state.organizer?.callsign || "Organizer");
  updateModerationStatus(`${agent.name} removed.`);
  renderAll();
  commitState();
}

function clearInactiveAgents() {
  const inactive = inactiveAgents();
  if (!inactive.length) {
    updateModerationStatus("No inactive remote agents to clear.");
    return;
  }
  if (!window.confirm(`Remove ${inactive.length} inactive remote agent${inactive.length === 1 ? "" : "s"} from this session?`)) return;
  const inactiveIds = new Set(inactive.map((agent) => agent.id));
  state.agents = state.agents.filter((agent) => !inactiveIds.has(agent.id));
  state.chat.push(["Organizer", `${inactive.length} inactive agent${inactive.length === 1 ? "" : "s"} cleared from the roster.`]);
  logAudit("Moderation", `${inactive.length} inactive remote agent${inactive.length === 1 ? "" : "s"} cleared`, state.organizer?.callsign || "Organizer");
  updateModerationStatus(`${inactive.length} inactive cleared.`);
  renderAll();
  commitState();
}

function inactiveAgents() {
  return state.agents.filter((agent) => agentIsInactive(agent) && agent.id !== state.localAgentId && !botAgent(agent));
}

function agentIsInactive(agent) {
  if (!agent || botAgent(agent) || agent.id === state.localAgentId) return false;
  const lastSeen = Number(agent.lastSeen || agent.identity?.joinedAt || 0);
  return !lastSeen || Date.now() - lastSeen > 120_000;
}

function formatPresenceAge(value) {
  const lastSeen = Number(value || 0);
  if (!lastSeen) return "no heartbeat";
  const seconds = Math.max(0, Math.round((Date.now() - lastSeen) / 1000));
  if (seconds < 3) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function botAgent(agent) {
  return Boolean(agent?.bot || String(agent?.id || "").startsWith("bot-"));
}

function updateModerationStatus(text) {
  const node = $("#moderationStatus");
  if (node) node.textContent = text;
}

function renderGMConsole() {
  const pill = $("#gmStatusPill");
  if (!pill) return;
  const lockedObjectives = state.objectives.filter((objective) => !objective.decoded).length;
  const openObjectives = state.objectives.filter((objective) => objective.decoded && !objective.found).length;
  const extraction = extractionObjective();
  pill.textContent = state.status === "Live" ? "Live Ops" : state.status;
  $("#gmRevealClue").toggleAttribute("disabled", lockedObjectives === 0);
  $("#gmJamZone").toggleAttribute("disabled", !state.threats.length && !state.agents.length);
  $("#gmDropCache").toggleAttribute("disabled", !state.agents.length);
  $("#gmRerouteExtraction").toggleAttribute("disabled", !extraction || extraction.found);
  const status = $("#gmStatusText");
  if (status) status.textContent = `${lockedObjectives} encrypted / ${openObjectives} active / ${state.agents.length} agents.`;
}

function gmRevealClue() {
  const next = state.objectives.find((objective) => !objective.decoded);
  if (!next) {
    updateGMStatus("No encrypted clues remain.");
    return;
  }
  next.decoded = true;
  next.progress = Math.max(next.progress || 0, 30);
  state.chat.push(["Organizer", `GM revealed ${next.title}.`]);
  logAudit("GM Console", `Revealed clue: ${next.title}`, state.organizer?.callsign || "Organizer");
  updateGMStatus(`${next.title} revealed.`);
  renderAll();
  commitState();
}

function gmJamZone() {
  const target = state.threats.find((threat) => !threat.alert) || state.threats[0];
  if (!target) {
    updateGMStatus("No jammer is available.");
    return;
  }
  target.alert = true;
  target.lastHit = Date.now();
  const exposed = state.agents.filter((agent) => haversine(agent, target) <= Number(target.radius || 0) + 180);
  exposed.forEach((agent) => {
    agent.signal = clamp(agent.signal - 10, 18, 98);
    agent.stamina = clamp(agent.stamina - 4, 12, 100);
  });
  const detail = exposed.length ? `${target.name} jammed ${exposed.map((agent) => agent.name).join(", ")}.` : `${target.name} forced an area-wide signal sweep.`;
  state.chat.push(["Organizer", `GM jam zone: ${detail}`]);
  logAudit("GM Console", `Jammed zone with ${target.name}`, state.organizer?.callsign || "Organizer");
  updateGMStatus("Jam zone fired.");
  renderAll();
  commitState();
}

function gmDropCache() {
  if (!state.agents.length) {
    updateGMStatus("Join agents before dropping a cache.");
    return;
  }
  state.agents.forEach((agent) => {
    agent.signal = clamp(agent.signal + 12, 0, 100);
    agent.stamina = clamp(agent.stamina + 12, 0, 100);
  });
  state.chat.push(["Organizer", "GM cache drop restored squad signal and stamina."]);
  logAudit("GM Console", "Dropped emergency cache", state.organizer?.callsign || "Organizer");
  updateGMStatus("Emergency cache dropped.");
  renderAll();
  commitState();
}

function gmRerouteExtraction() {
  const extraction = extractionObjective();
  if (!extraction) {
    updateGMStatus("No extraction objective found.");
    return;
  }
  const [lat, lng] = jitter(cities[state.city].center, 0.0105);
  Object.assign(extraction, {
    lat,
    lng,
    decoded: true,
    progress: Math.max(extraction.progress || 0, 20),
    brief: "Organizer rerouted extraction. Follow the new route pulse."
  });
  state.chat.push(["Organizer", `${extraction.title} rerouted by Mission Control.`]);
  logAudit("GM Console", `Rerouted extraction to ${lat.toFixed(4)}, ${lng.toFixed(4)}`, state.organizer?.callsign || "Organizer");
  updateGMStatus("Extraction rerouted.");
  centerMap();
  renderAll();
  commitState();
}

function gmBroadcast() {
  const input = $("#gmBroadcastInput");
  const text = input.value.trim();
  if (!text) {
    updateGMStatus("Broadcast needs a message.");
    return;
  }
  input.value = "";
  sendChatMessage("Organizer", `GM broadcast: ${text}`);
  logAudit("GM Console", `Broadcast: ${text}`, state.organizer?.callsign || "Organizer");
  updateGMStatus("Broadcast sent.");
  renderAll();
  commitState();
}

function extractionObjective() {
  return [...state.objectives].reverse().find(isExtractionObjective) || null;
}

function updateGMStatus(text) {
  const node = $("#gmStatusText");
  if (node) node.textContent = text;
}

function readMissionTemplates() {
  try {
    const templates = JSON.parse(localStorage.getItem(templateStorageKey) || "[]");
    return Array.isArray(templates) ? templates.filter((template) => template?.id && template?.name && template?.setup) : [];
  } catch {
    localStorage.removeItem(templateStorageKey);
    return [];
  }
}

function writeMissionTemplates(templates) {
  localStorage.setItem(templateStorageKey, JSON.stringify(templates.slice(0, 12)));
}

function currentTemplatePayload(name) {
  const review = missionReviewSummary();
  return {
    id: state.selectedTemplateId || `tpl-${Date.now().toString(36)}`,
    name: name.trim().slice(0, 34),
    savedAt: Date.now(),
    review,
    setup: {
      country: state.country,
      city: state.city,
      duration: state.duration,
      maxPlayers: state.maxPlayers,
      sessionMode: state.sessionMode,
      mapLayer: state.mapLayer,
      mapZoom: state.mapZoom,
      enabledModules: { ...state.enabledModules },
      customMarkers: state.customMarkers.map((marker) => ({
        id: marker.id,
        title: marker.title,
        type: marker.type,
        taskState: markerTaskState(marker),
        radius: marker.radius,
        lat: marker.lat,
        lng: marker.lng,
        artifact: marker.artifact || "",
        brief: marker.brief || ""
      }))
    }
  };
}

function saveMissionTemplate() {
  const input = $("#templateNameInput");
  const name = input.value.trim() || `${cities[state.city].name} ${moduleCatalog.filter(([key]) => moduleEnabled(key)).length}-pack mission`;
  const templates = readMissionTemplates();
  const payload = currentTemplatePayload(name);
  const index = templates.findIndex((template) => template.id === payload.id);
  if (index >= 0) templates[index] = payload;
  else templates.unshift(payload);
  state.selectedTemplateId = payload.id;
  input.value = payload.name;
  writeMissionTemplates(templates);
  renderTemplates();
  renderMissionReview();
  updateTemplateStatus(`${payload.name} saved with ${payload.review.ready}/${payload.review.total} review checks ready.`);
  saveState();
}

function loadSelectedMissionTemplate() {
  const template = selectedMissionTemplate();
  if (!template) {
    updateTemplateStatus("Select a template to load.");
    return;
  }
  applyMissionTemplate(template);
  updateTemplateStatus(`${template.name} loaded.`);
}

function removeSelectedMissionTemplate() {
  const template = selectedMissionTemplate();
  if (!template) {
    updateTemplateStatus("Select a template to remove.");
    return;
  }
  if (!window.confirm(`Remove mission template "${template.name}" from this browser?`)) return;
  const templates = readMissionTemplates().filter((item) => item.id !== template.id);
  writeMissionTemplates(templates);
  state.selectedTemplateId = templates[0]?.id || "";
  $("#templateNameInput").value = templates[0]?.name || "";
  renderTemplates();
  updateTemplateStatus(`${template.name} removed.`);
  saveState();
}

function selectedMissionTemplate() {
  return readMissionTemplates().find((template) => template.id === state.selectedTemplateId) || null;
}

function applyMissionTemplate(template) {
  const setup = template.setup || {};
  state.country = countries[setup.country] ? setup.country : "norway";
  state.city = cities[setup.city] ? setup.city : cityKeysForCountry(state.country)[0] || "oslo";
  state.country = cities[state.city].country;
  state.duration = clamp(Number(setup.duration) || 60, 20, 120);
  state.remaining = state.duration * 60;
  state.maxPlayers = clamp(Number(setup.maxPlayers) || 6, 2, 10);
  state.sessionMode = sessionModes[setup.sessionMode] ? setup.sessionMode : "private";
  state.isPublic = state.sessionMode !== "private";
  state.mapLayer = mapLayers[setup.mapLayer] ? setup.mapLayer : "street";
  state.mapZoom = clamp(Number(setup.mapZoom) || 1, 0.7, 1.9);
  state.enabledModules = { ...setup.enabledModules };
  normalizeEnabledModules();
  state.customMarkers = Array.isArray(setup.customMarkers)
    ? setup.customMarkers.map((marker, index) => ({
        id: marker.id || `marker-${Date.now()}-${index}`,
        title: marker.title || `Template Marker ${index + 1}`,
        type: customMarkerTypeBehaviors[marker.type] ? marker.type : "Clue",
        taskState: customMarkerTaskStates[marker.taskState] ? marker.taskState : "armed",
        radius: clamp(Number(marker.radius) || 25, 10, 80),
        lat: Number(marker.lat) || cities[state.city].center[0],
        lng: Number(marker.lng) || cities[state.city].center[1],
        artifact: marker.artifact || "",
        brief: marker.brief || ""
      }))
    : [];
  state.editingMarkerId = "";
  resetCustomMarkerForm();
  generateObjectives();
  generateThreats();
  centerMap();
  renderAll();
  commitState();
}

function renderTemplates() {
  const templates = readMissionTemplates();
  const holder = $("#templateList");
  const count = $("#templateCountPill");
  if (count) count.textContent = `${templates.length} saved`;
  if (!holder) return;
  if (state.selectedTemplateId && !templates.some((template) => template.id === state.selectedTemplateId)) {
    state.selectedTemplateId = templates[0]?.id || "";
  }
  holder.innerHTML = templates.length
    ? templates
        .map((template) => {
          const setup = template.setup || {};
          const markers = Array.isArray(setup.customMarkers) ? setup.customMarkers.length : 0;
          const selected = template.id === state.selectedTemplateId ? "selected" : "";
          const review = template.review ? ` / Review ${template.review.ready || 0}/${template.review.total || "?"}` : "";
          return `
            <button class="template-item ${selected}" type="button" data-template-id="${template.id}" data-template-name="${escapeHtml(template.name)}">
              <strong>${escapeHtml(template.name)}</strong>
              <span>${cityName(setup.city)} / ${setup.duration || 60} min / ${markers} markers${review}</span>
            </button>
          `;
        })
        .join("")
    : `<article class="template-empty"><strong>No templates saved</strong><span>Save the current mission setup to reuse it later.</span></article>`;
}

function missionReviewChecks() {
  const enabledPacks = activeMissionPackKeys();
  const activeMarkers = state.customMarkers.filter(markerInMissionArea);
  const armedMarkers = activeMarkers.filter(markerIsArmed);
  const outOfAreaArmed = state.customMarkers.filter((marker) => !markerInMissionArea(marker) && markerIsArmed(marker));
  const clueMarkers = armedMarkers.filter((marker) => ["Clue", "Cache"].includes(marker.type));
  const emptyClues = clueMarkers.filter((marker) => !String(marker.artifact || "").trim());
  const extractionCount = armedMarkers.filter((marker) => marker.type === "Extraction").length;
  return [
    {
      label: "Identity",
      ready: Boolean(state.organizer?.name && state.organizer?.callsign),
      detail: state.organizer?.callsign ? `${state.organizer.callsign} hosting` : "Add organizer name and callsign.",
      required: true
    },
    {
      label: "Objective Packs",
      ready: enabledPacks.length > 0,
      detail: enabledPacks.length ? `${enabledPacks.length} pack${enabledPacks.length === 1 ? "" : "s"} enabled.` : "Enable at least one mission pack.",
      required: true
    },
    {
      label: "Markers",
      ready: armedMarkers.length > 0,
      detail: armedMarkers.length ? `${armedMarkers.length} armed marker${armedMarkers.length === 1 ? "" : "s"} in range.` : "Optional, but custom games need at least one armed marker.",
      required: false
    },
    {
      label: "Clue Text",
      ready: emptyClues.length === 0,
      detail: emptyClues.length ? `${emptyClues.length} clue/cache marker${emptyClues.length === 1 ? "" : "s"} need artifact text.` : "Clue and cache markers have usable artifact text.",
      required: true
    },
    {
      label: "Map Bounds",
      ready: outOfAreaArmed.length === 0,
      detail: outOfAreaArmed.length ? `${outOfAreaArmed.length} armed marker${outOfAreaArmed.length === 1 ? "" : "s"} outside mission area.` : `${cities[state.city].name} mission area clean.`,
      required: true
    },
    {
      label: "Extraction",
      ready: extractionCount <= 1,
      detail: extractionCount > 1 ? "Use one final extraction marker." : extractionCount === 1 ? "Custom extraction lane set." : "Pack extraction fallback ready.",
      required: false
    }
  ];
}

function missionReviewSummary() {
  const checks = missionReviewChecks();
  const required = checks.filter((check) => check.required);
  return {
    ready: checks.filter((check) => check.ready).length,
    total: checks.length,
    requiredReady: required.filter((check) => check.ready).length,
    requiredTotal: required.length,
    status: required.every((check) => check.ready) ? "ready" : "review",
    savedAt: Date.now()
  };
}

function renderMissionReview() {
  const holder = $("#missionReviewList");
  const pill = $("#missionReviewPill");
  const title = $("#missionReviewTitle");
  if (!holder || !pill || !title) return;
  const checks = missionReviewChecks();
  const summary = missionReviewSummary();
  title.textContent = summary.status === "ready" ? "Ready to save and run" : "Needs organizer review";
  pill.textContent = `${summary.requiredReady}/${summary.requiredTotal} required`;
  pill.classList.toggle("danger", summary.status !== "ready");
  holder.innerHTML = checks
    .map((check) => {
      const status = check.ready ? "ready" : check.required ? "blocked" : "warn";
      const statusText = check.ready ? "Ready" : check.required ? "Fix" : "Optional";
      return `
        <article class="mission-review-item ${status}">
          <b>${statusText}</b>
          <div>
            <strong>${escapeHtml(check.label)}</strong>
            <span>${escapeHtml(check.detail)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateTemplateStatus(text) {
  const node = $("#templateStatus");
  if (node) node.textContent = text;
}

function renderCountryOptions() {
  const options = Object.entries(countries).map(([key, name]) => `<option value="${key}">${name}</option>`).join("");
  $("#setupCountrySelect").innerHTML = options;
}

function renderCityOptions() {
  const options = cityKeysForCountry(state.country)
    .map((key) => `<option value="${key}">${cities[key].name}, ${countries[cities[key].country]}</option>`)
    .join("");
  $("#setupCitySelect").innerHTML = options;
  $("#citySelect").innerHTML = options;
}

function cityKeysForCountry(country) {
  return Object.keys(cities).filter((key) => cities[key].country === country);
}

function renderSetupModules() {
  $("#setupModuleList").innerHTML = moduleCatalog
    .map(
      ([key, name, detail]) => `
        <button class="setup-module-card ${moduleEnabled(key) ? "enabled" : ""}" type="button" data-setup-module="${key}">
          <strong>${name}</strong>
          <span>${detail}</span>
          <b>${moduleEnabled(key) ? "Enabled" : "Disabled"}</b>
        </button>
      `
    )
    .join("");
  $("#setupModuleList").querySelectorAll("[data-setup-module]").forEach((button) => {
    button.addEventListener("click", () => toggleModule(button.dataset.setupModule));
  });
}

function renderSetupMap() {
  const mapNode = $("#setupMapPreview");
  if (!mapNode) return;
  const center = cities[state.city].center;
  mapNode.querySelectorAll(".setup-map-marker, .setup-map-draft").forEach((node) => node.remove());
  const activeMarkers = state.customMarkers.filter(markerInMissionArea);
  if (setupMap) {
    renderSetupLeafletMap(mapNode, center, activeMarkers);
    renderSetupMapCaption(activeMarkers);
    return;
  }
  mapNode.classList.remove("real-map");
  const centerNode = document.createElement("div");
  centerNode.className = "setup-map-marker center";
  centerNode.style.left = "50%";
  centerNode.style.top = "50%";
  centerNode.textContent = "HQ";
  mapNode.appendChild(centerNode);
  activeMarkers.forEach((marker) => {
    const point = projectToFallback(marker, center);
    const node = document.createElement("div");
    const editing = state.editingMarkerId === marker.id ? "editing" : "";
    node.className = `setup-map-marker custom ${markerTaskState(marker)} ${markerTypeClass(marker)} ${editing}`;
    node.style.left = `${point.left}%`;
    node.style.top = `${point.top}%`;
    node.textContent = marker.type.slice(0, 1);
    node.title = `${marker.title} / ${marker.type} / ${customMarkerTaskStates[markerTaskState(marker)]}`;
    mapNode.appendChild(node);
  });
  const draft = getDraftMarkerCoordinates();
  if (draft) {
    const point = projectToFallback({ lat: draft[0], lng: draft[1] }, center);
    const node = document.createElement("div");
    node.className = "setup-map-draft";
    node.style.left = `${point.left}%`;
    node.style.top = `${point.top}%`;
    node.textContent = "+";
    mapNode.appendChild(node);
  }
  renderSetupMapCaption(activeMarkers);
}

function renderSetupLeafletMap(mapNode, center, activeMarkers) {
  mapNode.classList.add("real-map");
  setupMapMarkers.forEach((marker) => marker.remove());
  setupMapMarkers = [];
  if (setupDraftMarker) {
    setupDraftMarker.remove();
    setupDraftMarker = null;
  }
  setupMap.setView(center, setupMap.getZoom() || 14, { animate: false });
  setTimeout(() => setupMap?.invalidateSize(), 40);
  setupMapMarkers.push(
    L.marker(center, {
      title: "Mission HQ",
      icon: L.divIcon({
        className: "",
        html: `<span class="setup-leaflet-marker center">HQ</span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      })
    }).addTo(setupMap)
  );
  activeMarkers.forEach((marker) => {
    const editing = state.editingMarkerId === marker.id ? "editing" : "";
    setupMapMarkers.push(
      L.marker([marker.lat, marker.lng], {
        title: `${marker.title} / ${marker.type} / ${customMarkerTaskStates[markerTaskState(marker)]}`,
        icon: L.divIcon({
          className: "",
          html: `<span class="setup-leaflet-marker custom ${markerTaskState(marker)} ${markerTypeClass(marker)} ${editing}">${escapeHtml(marker.type.slice(0, 1))}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        })
      })
        .bindPopup(
          `<strong>${escapeHtml(marker.title)}</strong><br>${escapeHtml(marker.type)} / ${customMarkerTaskStates[markerTaskState(marker)]}<br>${markerObjectiveRadius(marker)}m activation`
        )
        .addTo(setupMap)
    );
  });
  const draft = getDraftMarkerCoordinates();
  if (draft) {
    setupDraftMarker = L.marker(draft, {
      title: "Draft marker",
      icon: L.divIcon({
        className: "",
        html: `<span class="setup-leaflet-draft">+</span>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      })
    }).addTo(setupMap);
  }
}

function renderSetupMapCaption(activeMarkers) {
  const inactiveCount = state.customMarkers.length - activeMarkers.length;
  $("#setupMapCaption").textContent = inactiveCount
    ? `${cities[state.city].name} / ${activeMarkers.length} active, ${inactiveCount} outside area`
    : `${cities[state.city].name}, ${countries[state.country]} / ${activeMarkers.length} custom markers`;
}

function renderCustomMarkerInputs(lat, lng) {
  $("#markerLat").value = Number(lat).toFixed(6);
  $("#markerLng").value = Number(lng).toFixed(6);
  const point = { lat: Number(lat), lng: Number(lng) };
  const distance = missionAreaDistance(point);
  const marker = currentEditingMarker();
  $("#markerDraftStatus").textContent =
    distance <= 1800
      ? `${marker ? `${marker.title} moved` : "Marker staged"} at ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}.`
      : `${marker ? `${marker.title} moved` : "Marker staged"} outside ${cities[state.city].name}; it will stay inactive until moved.`;
  renderSetupMap();
}

function setMarkerFromSetupMap(event) {
  if (event.target.closest("button")) return;
  if (setupMap && event.target.closest("#setupLeafletMap")) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const left = ((event.clientX - rect.left) / rect.width) * 100;
  const top = ((event.clientY - rect.top) / rect.height) * 100;
  const [lat, lng] = fallbackToCoordinates(left, top, cities[state.city].center);
  renderCustomMarkerInputs(lat, lng);
}

function addCustomMarker() {
  const marker = currentEditingMarker();
  const title = $("#markerTitle").value.trim() || `Custom Marker ${state.customMarkers.length + 1}`;
  const type = customMarkerTypeBehaviors[$("#markerType").value] ? $("#markerType").value : "Clue";
  const taskState = customMarkerTaskStates[$("#markerTaskState")?.value] ? $("#markerTaskState").value : "armed";
  const radius = clamp(Number($("#markerRadius").value) || 25, 10, 80);
  const lat = Number($("#markerLat").value);
  const lng = Number($("#markerLng").value);
  const artifact = $("#markerArtifact")?.value.trim() || "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const [centerLat, centerLng] = cities[state.city].center;
    renderCustomMarkerInputs(centerLat, centerLng);
    return;
  }
  const active = markerInMissionArea({ lat, lng });
  const updates = {
    title,
    type,
    radius,
    lat,
    lng,
    taskState,
    artifact,
    brief: artifact
      ? `Organizer ${type.toLowerCase()}: ${artifact}`
      : markerObjectiveBrief({ type, artifact: "" })
  };
  if (marker) {
    Object.assign(marker, updates);
    marker.rewardedAt = taskState === "complete" ? marker.rewardedAt || Date.now() : 0;
    marker.lastHit = 0;
    state.editingMarkerId = "";
  } else {
    state.customMarkers.push({
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      ...updates
    });
  }
  resetCustomMarkerForm();
  $("#markerDraftStatus").textContent = active
    ? `${title} ${marker ? "updated" : "added"} on the mission map.`
    : `${title} saved but inactive outside the ${cities[state.city].name} mission area.`;
  generateObjectives();
  renderAll();
  commitState();
}

function resetCustomMarkerForm() {
  $("#markerTitle").value = "";
  $("#markerType").value = "Clue";
  $("#markerTaskState").value = "armed";
  $("#markerRadius").value = 25;
  $("#markerLat").value = "";
  $("#markerLng").value = "";
  if ($("#markerArtifact")) $("#markerArtifact").value = "";
}

function getDraftMarkerCoordinates() {
  const latValue = $("#markerLat")?.value;
  const lngValue = $("#markerLng")?.value;
  if (latValue === "" || lngValue === "") return null;
  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function missionAreaDistance(point) {
  const center = cities[state.city].center;
  return haversine({ lat: Number(point.lat), lng: Number(point.lng) }, { lat: center[0], lng: center[1] });
}

function markerInMissionArea(marker) {
  if (!marker || !Number.isFinite(Number(marker.lat)) || !Number.isFinite(Number(marker.lng))) return false;
  return missionAreaDistance(marker) <= 1800;
}

function markerTaskState(marker) {
  return customMarkerTaskStates[marker?.taskState] ? marker.taskState : "armed";
}

function markerIsArmed(marker) {
  return markerTaskState(marker) === "armed";
}

function markerVisibleOnMissionMap(marker) {
  return markerTaskState(marker) !== "planned";
}

function markerTypeBehavior(marker) {
  return customMarkerTypeBehaviors[marker?.type] || customMarkerTypeBehaviors.Clue;
}

function markerObjectiveRadius(marker) {
  return clamp(Number(marker.radius || 25) + Number(markerTypeBehavior(marker).radiusOffset || 0), 10, 110);
}

function markerObjectiveBrief(marker) {
  const behavior = markerTypeBehavior(marker);
  const artifact = marker.artifact ? ` Task: ${marker.artifact}` : "";
  return `${behavior.label}: ${behavior.detail}${artifact}`;
}

function markerTypeClass(marker) {
  return `marker-type-${String(marker?.type || "clue").toLowerCase()}`;
}

function currentEditingMarker() {
  if (!state.editingMarkerId) return null;
  return state.customMarkers.find((marker) => marker.id === state.editingMarkerId) || null;
}

function renderMarkerEditorMode() {
  const marker = currentEditingMarker();
  if (state.editingMarkerId && !marker) state.editingMarkerId = "";
  const saveButton = $("#addCustomMarker");
  const cancelButton = $("#cancelMarkerEdit");
  if (!saveButton || !cancelButton) return;
  saveButton.textContent = marker ? "Save Marker" : "Add Marker";
  cancelButton.hidden = !marker;
}

function renderCustomMarkerList() {
  const holder = $("#customMarkerList");
  if (!holder) return;
  holder.innerHTML = state.customMarkers.length
    ? state.customMarkers
        .map((marker) => {
          const active = markerInMissionArea(marker);
          const taskState = markerTaskState(marker);
          const behavior = markerTypeBehavior(marker);
          const editing = state.editingMarkerId === marker.id;
          const artifact = marker.artifact ? `<span class="marker-artifact">Clue: ${escapeHtml(marker.artifact)}</span>` : "";
          return `
            <article class="custom-marker-card ${active ? "" : "out-of-area"} ${taskState} ${editing ? "editing" : ""}">
              <div>
                <strong>${escapeHtml(marker.title)} <b class="marker-state-pill">${customMarkerTaskStates[taskState]}</b></strong>
                <span>${escapeHtml(marker.type)} / ${markerObjectiveRadius(marker)}m / ${Number(marker.lat).toFixed(4)}, ${Number(marker.lng).toFixed(4)}</span>
                <span class="marker-behavior">${escapeHtml(behavior.label)} - ${escapeHtml(behavior.detail)}</span>
                ${artifact}
                ${active ? markerTaskHint(marker, taskState) : `<span class="marker-warning">Outside ${escapeHtml(cities[state.city].name)} mission area; not used as a live objective.</span>`}
              </div>
              <div class="marker-card-actions">
                <div class="marker-state-actions" aria-label="Marker task state">
                  <button type="button" data-marker-state="${marker.id}:planned">Plan</button>
                  <button type="button" data-marker-state="${marker.id}:armed">Arm</button>
                  <button type="button" data-marker-state="${marker.id}:complete">Done</button>
                </div>
                <button class="ghost-button compact-button" type="button" data-edit-marker="${marker.id}">${editing ? "Editing" : "Edit"}</button>
                <button class="ghost-button compact-button danger-button" type="button" data-remove-marker="${marker.id}">Remove</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<article class="custom-marker-card empty"><strong>No custom markers yet</strong><span>Click the setup map or use city center, then add a marker.</span></article>`;
  holder.querySelectorAll("[data-remove-marker]").forEach((button) => {
    button.addEventListener("click", () => removeCustomMarker(button.dataset.removeMarker));
  });
  holder.querySelectorAll("[data-edit-marker]").forEach((button) => {
    button.addEventListener("click", () => editCustomMarker(button.dataset.editMarker));
  });
  holder.querySelectorAll("[data-marker-state]").forEach((button) => {
    button.addEventListener("click", () => {
      const [id, taskState] = button.dataset.markerState.split(":");
      setCustomMarkerTaskState(id, taskState);
    });
  });
}

function markerTaskHint(marker, taskState) {
  if (taskState === "planned") return `<span class="marker-warning neutral">Planned only; arm it to add it to live objectives.</span>`;
  if (taskState === "complete") return `<span class="marker-warning complete">Completed; hidden from live objectives.</span>`;
  if (markerTypeBehavior(marker).objective === false) return `<span class="marker-warning armed">Armed as a live hazard zone.</span>`;
  return `<span class="marker-warning armed">Armed for live objectives.</span>`;
}

function editCustomMarker(id) {
  const marker = state.customMarkers.find((item) => item.id === id);
  if (!marker) return;
  state.editingMarkerId = id;
  $("#markerTitle").value = marker.title || "";
  $("#markerType").value = customMarkerTypeBehaviors[marker.type] ? marker.type : "Clue";
  $("#markerTaskState").value = markerTaskState(marker);
  $("#markerRadius").value = clamp(Number(marker.radius) || 25, 10, 80);
  $("#markerArtifact").value = marker.artifact || "";
  renderCustomMarkerInputs(marker.lat, marker.lng);
  $("#markerDraftStatus").textContent = `${marker.title} loaded for editing. Map clicks will move this marker.`;
  renderCustomMarkerList();
  renderMarkerEditorMode();
}

function cancelCustomMarkerEdit() {
  state.editingMarkerId = "";
  resetCustomMarkerForm();
  $("#markerDraftStatus").textContent = "Click the map or use city center to set coordinates.";
  renderSetupMap();
  renderCustomMarkerList();
  renderMarkerEditorMode();
}

function setCustomMarkerTaskState(id, taskState) {
  if (!customMarkerTaskStates[taskState]) return;
  const marker = state.customMarkers.find((item) => item.id === id);
  if (!marker) return;
  marker.taskState = taskState;
  if (taskState !== "complete") marker.rewardedAt = 0;
  if (state.editingMarkerId === id && $("#markerTaskState")) $("#markerTaskState").value = taskState;
  generateObjectives();
  renderAll();
  commitState();
}

function removeCustomMarker(id) {
  const marker = state.customMarkers.find((item) => item.id === id);
  if (!marker || !window.confirm(`Remove custom marker ${marker.title}?`)) return;
  state.customMarkers = state.customMarkers.filter((item) => item.id !== id);
  if (state.editingMarkerId === id) {
    state.editingMarkerId = "";
    resetCustomMarkerForm();
  }
  generateObjectives();
  renderAll();
  commitState();
}

function renderRoleCards() {
  const selected = $("#roleSelect")?.value || "Drone";
  const holder = $("#roleCardList");
  if (!holder) return;
  holder.innerHTML = Object.keys(roleCatalog)
    .map(
      (role) => `
        <button class="role-card ${role === selected ? "selected" : ""}" type="button" data-role-card="${role}">
          <strong>${role}</strong>
          <span>${roleBriefings[role]}</span>
          <em>${rolePackSummary(role)}</em>
          <b>${roleCatalog[role].join(" / ")}</b>
        </button>
      `
    )
    .join("");
  holder.querySelectorAll("[data-role-card]").forEach((button) => {
    button.addEventListener("click", () => selectRole(button.dataset.roleCard));
  });
}

function selectRole(role) {
  $("#roleSelect").value = role;
  renderRoleCards();
  renderRole();
  renderRoleReadiness();
}

function rolePackSummary(role) {
  const active = activeMissionPackKeys()
    .map((key) => rolePackDuties[role]?.[key]?.[0])
    .filter(Boolean);
  if (active.length) return active.slice(0, 3).join(" / ");
  return "Core role prep";
}

function activeMissionPackKeys() {
  return moduleCatalog.filter(([key]) => moduleEnabled(key)).map(([key]) => key);
}

function readinessChecks() {
  const agentName = ($("#roleAgentName")?.value || $("#agentName")?.value || "").trim();
  const role = $("#roleSelect")?.value || "Drone";
  const team = $("#roleTeamSelect")?.value || $("#teamSelect")?.value || "North";
  const accessReady = !state.auth?.requireAccessCode || cleanAccessCode($("#roleAccessCodeInput")?.value || $("#agentAccessCodeInput")?.value || "") === state.auth.accessCode;
  const activeMarkers = state.customMarkers.filter(markerInMissionArea).filter(markerIsArmed).length;
  const enabledPacks = activeMissionPackKeys();
  const baseChecks = [
    ["Agent identity", Boolean(agentName), agentName || "Add an agent name", true],
    ["Access code", accessReady, state.auth?.requireAccessCode ? "Enter the current session access code" : "Open join enabled", true],
    ["Role selected", Boolean(roleCatalog[role]), roleCatalog[role] ? `${role} tools armed` : "Pick a role", true],
    ["Team channel", Boolean(team), `${team} team selected`, true],
    ["Mission packs", enabledPacks.length > 0, `${enabledPacks.length} objective packs enabled`, true],
    ["Map layer", Boolean(mapLayers[state.mapLayer]), `${mapLayers[state.mapLayer] || "Street Map"} at ${Math.round(state.mapZoom * 100)}%`, true],
    ["Custom markers", activeMarkers > 0, activeMarkers ? `${activeMarkers} organizer markers active` : "Optional: add custom setup markers", false]
  ];
  return [...baseChecks, ...roleMissionChecks(role, activeMarkers)];
}

function roleMissionChecks(role, activeMarkers) {
  const duties = rolePackDuties[role] || {};
  const packChecks = activeMissionPackKeys().map((key) => {
    const [, name = key] = moduleCatalog.find(([item]) => item === key) || [key, key];
    const [label, detail] = duties[key] || [`${name} duty`, `Review ${name} before launch.`];
    const ready = key !== "voice" || !moduleEnabled("voice") || "speechSynthesis" in window;
    const support = key === "voice" && !ready ? "Voice relay is enabled, but this browser does not expose speech synthesis." : detail;
    return [`${name}: ${label}`, ready, support, true];
  });
  const hazardMarkers = state.customMarkers
    .filter(markerInMissionArea)
    .filter(markerIsArmed)
    .filter((marker) => marker.type === "Danger").length;
  const customDetail = hazardMarkers
    ? `${role} must brief ${hazardMarkers} organizer hazard zone${hazardMarkers === 1 ? "" : "s"}.`
    : `${role} has ${activeMarkers} organizer marker${activeMarkers === 1 ? "" : "s"} to review.`;
  if (activeMarkers > 0) {
    packChecks.push(["Organizer markers", true, customDetail, true]);
  }
  if (!packChecks.length) {
    packChecks.push(["Core patrol brief", true, `${role} is ready for the base GPS and AI Watch loop.`, true]);
  }
  return packChecks;
}

function renderRoleReadiness() {
  const holder = $("#roleReadinessList");
  if (!holder) return;
  const checks = readinessChecks();
  const required = checks.filter(([, , , isRequired]) => isRequired);
  const readyRequired = required.filter(([, ready]) => ready).length;
  $("#roleReadinessPill").textContent = `${readyRequired}/${required.length} ready`;
  holder.innerHTML = checks
    .map(([label, ready, detail, isRequired]) => {
      const stateLabel = ready ? "Ready" : isRequired ? "Needed" : "Optional";
      return `
        <article class="readiness-card ${ready ? "ready" : isRequired ? "needed" : "optional"}">
          <b>${stateLabel}</b>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(detail)}</span>
        </article>
      `;
    })
    .join("");
}

function enterMissionControl() {
  const checks = readinessChecks();
  const required = checks.filter(([, , , isRequired]) => isRequired);
  const missing = required.filter(([, ready]) => !ready);
  if (missing.length) {
    $("#roleReadinessPill").textContent = `${required.length - missing.length}/${required.length} ready`;
    state.chat.push(["System", `Role setup blocked: ${missing.map(([label]) => label).join(", ")}.`]);
    renderRoleReadiness();
    commitState();
    return;
  }
  $("#agentName").value = $("#roleAgentName").value.trim() || $("#agentName").value;
  $("#teamSelect").value = $("#roleTeamSelect").value;
  joinAgent();
  setScreen("mission");
}

function renderFieldDashboard() {
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  const next = nextObjective();
  const nearestThreatItem = local ? nearestThreat(local) : null;
  const objectiveDistance = local && next ? haversine(local, next) : Infinity;
  const threatDistance = local && nearestThreatItem ? haversine(local, nearestThreatItem) : Infinity;
  const objectiveZone = fieldObjectiveZone(objectiveDistance, next);
  const threatZone = fieldThreatZone(threatDistance, nearestThreatItem);
  $("#fieldAgentTitle").textContent = local ? local.name : "No Agent Linked";
  $("#fieldAgentRole").textContent = local ? `${local.role} / ${local.team}` : "Standby";
  $("#fieldSignal").textContent = local ? `${local.signal}%` : "--";
  $("#fieldStamina").textContent = local ? `${local.stamina}%` : "--";
  $("#fieldObjectiveDistance").textContent = local && next ? formatDistance(objectiveDistance) : "--";
  $("#fieldThreatDistance").textContent = local && nearestThreatItem ? formatDistance(threatDistance) : "--";
  $("#fieldObjectiveTitle").textContent = fieldObjectiveLabel(next);
  $("#fieldRoleCue").textContent = local ? fieldCueLine(local, next, nearestThreatItem, objectiveZone, threatZone) : "Pick a role, join, then switch to Field view.";
  renderFieldCueState(local, objectiveZone, threatZone);
  processFieldCues(local, next, nearestThreatItem, objectiveZone, threatZone);
  $("#fieldSquadList").innerHTML = state.agents.length
    ? state.agents
        .map(
          (agent) => `
            <article class="${agent.id === state.localAgentId ? "local" : ""}">
              <b>${agent.name}</b>
              <span>${agent.role} / ${agent.signal}% / ${agent.stamina}%</span>
            </article>
          `
        )
        .join("")
    : `<article><b>No squad linked</b><span>Join as an agent to populate the field roster.</span></article>`;
}

function renderCoordinateSync() {
  const card = $(".coordinate-sync-card");
  const status = $("#coordinateSyncStatus");
  const detail = $("#coordinateSyncDetail");
  if (!card || !status || !detail) return;
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  card.classList.remove("is-live", "is-stale");
  if (!local) {
    status.textContent = "No local agent";
    detail.textContent = "Join to publish live position.";
    return;
  }
  const age = Date.now() - Number(local.lastSeen || 0);
  const live = Number.isFinite(age) && age <= 12_000;
  card.classList.add(live ? "is-live" : "is-stale");
  status.textContent = live ? "Publishing live" : "Position stale";
  detail.textContent = `${Number(local.lat).toFixed(4)}, ${Number(local.lng).toFixed(4)} / ${formatPresenceAge(local.lastSeen)}`;
}

function fieldObjectiveZone(distance, objective) {
  if (!objective || !Number.isFinite(distance)) return "none";
  if (distance <= Number(objective.radius || 25)) return "inside";
  if (distance <= 80) return "hot";
  if (distance <= 180) return "near";
  return "far";
}

function fieldThreatZone(distance, threat) {
  if (!threat || !Number.isFinite(distance)) return "none";
  if (distance <= Number(threat.radius || 0)) return "contact";
  if (distance <= Number(threat.radius || 0) + 70) return "danger";
  if (distance <= 280) return "watch";
  return "clear";
}

function fieldCueLine(local, objective, threat, objectiveZone, threatZone) {
  if (threatZone === "contact") return `${threat.name} is jamming your position. Move out of the radius.`;
  if (threatZone === "danger") return `${threat.name} is close. Break line and keep moving.`;
  if (objectiveZone === "inside") return `${objective.title} is in range. Hold position and complete the task.`;
  if (objectiveZone === "hot") return `${objective.title} is very close. Slow down and scan.`;
  if (objectiveZone === "near") return `${objective.title} is nearby. Follow the route pulse.`;
  return roleBriefings[local.role] || "Coordinate with Mission Control.";
}

function renderFieldCueState(local, objectiveZone, threatZone) {
  const dashboard = $(".field-dashboard");
  const objectiveVital = $("#fieldObjectiveVital");
  const threatVital = $("#fieldThreatVital");
  const status = $("#fieldCueStatus");
  if (!dashboard || !objectiveVital || !threatVital || !status) return;
  dashboard.dataset.objectiveZone = local ? objectiveZone : "none";
  dashboard.dataset.threatZone = local ? threatZone : "none";
  objectiveVital.dataset.zone = local ? objectiveZone : "none";
  threatVital.dataset.zone = local ? threatZone : "none";
  status.textContent = local ? fieldCueStatusText(objectiveZone, threatZone) : "Field cues standby";
}

function fieldCueStatusText(objectiveZone, threatZone) {
  if (threatZone === "contact") return "Cue: threat contact";
  if (threatZone === "danger") return "Cue: threat close";
  if (objectiveZone === "inside") return "Cue: objective in range";
  if (objectiveZone === "hot") return "Cue: objective hot";
  if (objectiveZone === "near") return "Cue: objective near";
  return "Cue: scanning";
}

function processFieldCues(local, objective, threat, objectiveZone, threatZone) {
  if (!local || state.activeView !== "field") {
    fieldCueMemory.objectiveZone = objectiveZone;
    fieldCueMemory.threatZone = threatZone;
    return;
  }
  const now = Date.now();
  const threatChanged = threatZone !== fieldCueMemory.threatZone && ["watch", "danger", "contact"].includes(threatZone);
  const objectiveChanged = objectiveZone !== fieldCueMemory.objectiveZone && ["near", "hot", "inside"].includes(objectiveZone);
  if ((threatChanged || objectiveChanged) && now - fieldCueMemory.lastAt > 4500) {
    const kind = threatChanged && ["danger", "contact"].includes(threatZone) ? "threat" : "objective";
    pulseFieldCue(kind);
    fieldCueMemory.lastAt = now;
  }
  fieldCueMemory.objectiveZone = objectiveZone;
  fieldCueMemory.threatZone = threatZone;
}

function pulseFieldCue(kind) {
  if ("vibrate" in navigator) {
    navigator.vibrate(kind === "threat" ? [90, 40, 130] : [45, 35, 45]);
  }
  playFieldCue(kind);
}

function playFieldCue(kind) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    fieldCueAudioContext ||= new AudioContext();
    if (fieldCueAudioContext.state === "suspended") fieldCueAudioContext.resume();
    const oscillator = fieldCueAudioContext.createOscillator();
    const gain = fieldCueAudioContext.createGain();
    const now = fieldCueAudioContext.currentTime;
    oscillator.type = kind === "threat" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(kind === "threat" ? 180 : 620, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "threat" ? 95 : 920, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain).connect(fieldCueAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  } catch {
    fieldCueAudioContext = null;
  }
}

function renderObjectives() {
  $("#objectiveList").innerHTML = state.objectives
    .map(
      (objective) => `
        <article class="objective-card ${objective.found ? "found" : ""} ${!objective.decoded ? "locked" : ""}">
          <div>
            <strong>${escapeHtml(objective.title)}</strong>
            <small>${objective.decoded ? `${escapeHtml(objective.type)} / ${objective.radius}m radius` : "Encrypted packet"}</small>
            ${objective.decoded && objective.behaviorLabel ? `<b class="objective-behavior-pill">${escapeHtml(objective.behaviorLabel)}</b>` : ""}
            ${objective.decoded && objective.brief ? `<em>${escapeHtml(objective.brief)}</em>` : ""}
          </div>
          <span>${objective.found ? "Found" : objective.decoded ? `${objective.progress}%` : "Locked"}</span>
          <div class="progress"><b style="width:${objective.progress}%"></b></div>
        </article>
      `
    )
    .join("");
}

function renderThreats() {
  const level = threatLevel();
  $("#threatLevel").textContent = level;
  $("#threatLevel").classList.toggle("danger", level === "Contact");
  $("#threatList").innerHTML = state.threats
    .map((threat) => {
      const nearest = nearestAgentDistance(threat);
      const distance = Number.isFinite(nearest) ? formatDistance(nearest) : "--";
      return `
        <article class="threat-card ${threat.alert ? "alert" : ""}">
          <div>
            <strong>${threat.name}</strong>
            <small>${threat.alert ? "Jamming active" : "Patrolling"} / ${threat.radius}m radius</small>
          </div>
          <span>${distance}</span>
        </article>
      `;
    })
    .join("");
}

function renderRole() {
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  const role = local?.role || $("#roleSelect").value || "Drone";
  $("#roleTitle").textContent = role;
  $("#roleState").textContent = local ? local.team : "Not joined";
  $("#roleTools").innerHTML = roleCatalog[role]
    .map((tool, index) => `<button type="button" data-tool="${index}">${tool}</button>`)
    .join("");
  $("#roleTools").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      executeRoleTool(role, button.textContent);
      renderAll();
      commitState();
    });
  });
}

function executeRoleTool(role, tool) {
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  if (role === "Mission Control" && tool.includes("Track")) {
    const statuses = state.agents.map((a) => `${a.name}: signal ${a.signal}%, stamina ${a.stamina}%`).join(" | ");
    state.chat.push([role, `Agent status — ${statuses}`]);
    return;
  }
  if (role === "Mission Control" && tool.includes("Deploy")) {
    generateObjectives();
    state.chat.push([role, `New objective deployed: ${state.objectives[state.objectives.length - 1]?.title || "Signal trace"}`]);
    return;
  }
  if (role === "Mission Control" && tool.includes("Monitor")) {
    const avgSignal = Math.round(state.agents.reduce((s, a) => s + a.signal, 0) / (state.agents.length || 1));
    state.chat.push([role, `Squad signal average: ${avgSignal}%. Threat level: ${state.threatLevel}%.`]);
    return;
  }
  if (role === "Mission Control" && tool.includes("Direct")) {
    state.chat.push([role, "Squad directive issued — maintain formation and advance to next waypoint."]);
    return;
  }
  if (role === "Drone" && tool.includes("Ping")) {
    const nearest = nearestThreat(local);
    if (nearest) {
      nearest.alert = true;
      state.chat.push([role, `${nearest.name} pinged at ${formatDistance(nearestAgentDistance(nearest))}.`]);
      return;
    }
  }
  if (role === "Mechanic" && tool.includes("Boost")) {
    state.agents.forEach((agent) => {
      agent.signal = clamp(agent.signal + 10, 0, 100);
    });
    state.chat.push([role, "GPS mesh boosted for all agents."]);
    return;
  }
  if (role === "Medic" && tool.includes("Call")) {
    state.agents.forEach((agent) => {
      agent.stamina = clamp(agent.stamina + 8, 0, 100);
    });
    state.chat.push([role, "Regroup pulse restored squad stamina."]);
    return;
  }
  if (role === "Decoder" && tool.includes("Decode")) {
    decodeNextObjective();
    return;
  }
  if (role === "Navigator" && tool.includes("Measure")) {
    const next = state.objectives.find((objective) => objective.decoded && !objective.found);
    state.chat.push([role, next ? `Nearest route is ${formatDistance(nearestAgentDistance(next))}.` : "No open routes remain."]);
    return;
  }
  if (role === "Courier" && tool.includes("Deliver")) {
    const next = state.objectives.find((objective) => objective.decoded && !objective.found);
    if (next && nearestAgentDistance(next) < next.radius * 2) {
      next.progress = clamp(next.progress + 24, 0, 100);
      state.chat.push([role, `${next.title} delivery advanced to ${next.progress}%.`]);
      return;
    }
  }
  state.chat.push([role, `${tool} executed.`]);
}

function setChatFilter(filter) {
  if (!chatFilterCatalog.includes(filter)) return;
  state.chatFilter = filter;
  renderChat();
  commitState();
}

function chatChannel(name) {
  if (chatFilterCatalog.includes(name)) return name;
  if (roleCatalog[name]) return "Roles";
  return "Mission Control";
}

function chatMatchesFilter([name], filter = state.chatFilter) {
  if (filter === "All") return true;
  return chatChannel(name) === filter;
}

function chatFilterCounts() {
  const counts = Object.fromEntries(chatFilterCatalog.map((filter) => [filter, 0]));
  state.chat.forEach((entry) => {
    counts.All += 1;
    const channel = chatChannel(entry[0]);
    counts[channel] = Number(counts[channel] || 0) + 1;
  });
  return counts;
}

function renderChatFilters() {
  const holder = $("#chatFilterBar");
  if (!holder) return;
  const counts = chatFilterCounts();
  holder.innerHTML = chatFilterCatalog
    .map(
      (filter) => `
        <button class="${state.chatFilter === filter ? "selected" : ""}" type="button" data-chat-filter="${filter}">
          <span>${escapeHtml(filter)}</span>
          <b>${counts[filter] || 0}</b>
        </button>
      `
    )
    .join("");
  const active = $("#chatFilterPill");
  if (active) active.textContent = state.chatFilter === "All" ? `${counts.All} events` : `${state.chatFilter} / ${counts[state.chatFilter] || 0}`;
}

function renderChat() {
  renderChatFilters();
  const log = $("#chatLog");
  const filtered = state.chat.filter((entry) => chatMatchesFilter(entry)).slice(-12);
  log.innerHTML = filtered.length
    ? filtered
        .map(([name, text]) => `<p class="chat-channel-${chatChannel(name).toLowerCase().replace(/\s+/g, "-")}"><span>${escapeHtml(name)}</span>${escapeHtml(text)}</p>`)
        .join("")
    : `<p class="chat-empty"><span>${escapeHtml(state.chatFilter)}</span>No events in this channel yet.</p>`;
  log.scrollTop = log.scrollHeight;
  voiceRelay();
}

async function sendChatMessage(speaker, text) {
  const cleanText = String(text || "").trim().slice(0, 140);
  if (!cleanText) return;
  const entry = [speaker, cleanText, Date.now(), state.clientId];
  state.chat.push(entry);
  renderChat();
  saveState();
  if (!isApiServer()) {
    commitState();
    return;
  }
  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        speaker,
        text: cleanText,
        clientId: state.clientId
      })
    });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.entry)) {
      state.chat[state.chat.length - 1] = data.entry;
      state.revision = Math.max(Number(state.revision || 0), Number(data.session?.revision || 0));
      saveState();
      renderChat();
    }
    updateSyncStatus("Chat live", "online");
  } catch {
    updateSyncStatus("Sync online", "online");
  }
}

function drawMap() {
  if (!map || useFallbackMap) {
    renderFallbackMap();
    return;
  }
  toggleFallbackMap(false);
  renderMapSourceLabel();
  renderMapLayerBadge();
  playerMarkers.forEach((marker) => marker.remove());
  objectiveMarkers.forEach((marker) => marker.remove());
  routeLayers.forEach((layer) => layer.remove());
  threatMarkers.forEach((marker) => marker.remove());
  customMarkersLayer.forEach((marker) => marker.remove());
  routeLayers = drawRouteLayers();
  playerMarkers = state.agents.map((agent) =>
    L.marker([agent.lat, agent.lng], {
      icon: L.divIcon({
        className: "",
        html: `<span class="agent-marker">${agent.name.slice(0, 1)}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    })
      .bindPopup(`<strong>${agent.name}</strong><br>${agent.role} / ${agent.team}<br>Signal ${agent.signal}%`)
      .addTo(map)
  );
  objectiveMarkers = state.objectives
    .filter((objective) => objective.decoded && objective.source !== "custom")
    .map((objective) =>
      L.marker([objective.lat, objective.lng], {
        icon: L.divIcon({
          className: "",
          html: `<span class="objective-marker ${objective.found ? "done" : ""}">${objective.found ? "OK" : "+"}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        })
      })
        .bindPopup(`<strong>${objective.title}</strong><br>${objective.type}<br>${objective.radius}m radius`)
        .addTo(map)
    );
  threatMarkers = state.threats.map((threat) =>
    L.circle([threat.lat, threat.lng], {
      radius: threat.radius,
      color: threat.alert ? "#e45b4d" : "#12313d",
      fillColor: threat.alert ? "#e45b4d" : "#ff8b45",
      fillOpacity: threat.alert ? 0.16 : 0.09,
      weight: threat.alert ? 2 : 1
    })
      .bindPopup(`<strong>${threat.name}</strong><br>${threat.alert ? "Jamming active" : "Patrolling"}<br>${threat.radius}m radius`)
      .addTo(map)
  );
  customMarkersLayer = state.customMarkers
    .filter(markerInMissionArea)
    .filter(markerVisibleOnMissionMap)
    .map((marker) =>
      L.marker([marker.lat, marker.lng], {
        icon: L.divIcon({
          className: "",
          html: `<span class="custom-map-marker ${markerTypeClass(marker)}">${escapeHtml(marker.type.slice(0, 1))}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        })
      })
        .bindPopup(
          `<strong>${escapeHtml(marker.title)}</strong><br>${escapeHtml(marker.type)} / ${customMarkerTaskStates[markerTaskState(marker)]}<br>${marker.radius}m custom marker${marker.artifact ? `<br>${escapeHtml(marker.artifact)}` : ""}`
        )
        .addTo(map)
    );
}

function drawRouteLayers() {
  if (!map || useFallbackMap) return [];
  const points = missionRoutePoints();
  if (points.length < 2) return [];
  const latLngs = points.map((point) => [point.lat, point.lng]);
  const glow = L.polyline(latLngs, {
    color: "#ffffff",
    opacity: 0.72,
    weight: 10,
    lineCap: "round",
    lineJoin: "round",
    interactive: false
  }).addTo(map);
  const route = L.polyline(latLngs, {
    color: "#ff8b45",
    opacity: 0.92,
    weight: 4,
    dashArray: "10 10",
    lineCap: "round",
    lineJoin: "round",
    interactive: false
  }).addTo(map);
  return [glow, route];
}

function missionRoutePoints() {
  if (!Array.isArray(state.objectives) || !state.objectives.length) return [];
  const unresolved = state.objectives.filter((objective) => !objective.found);
  const active = unresolved.filter((objective) => objective.decoded);
  const next = active.length ? active : unresolved.slice(0, 1);
  const extraction = [...unresolved].reverse().find((objective) => isExtractionObjective(objective));
  const route = [...next];
  if (extraction && !route.some((objective) => objective.id === extraction.id)) route.push(extraction);
  return route.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function isExtractionObjective(objective) {
  return /extraction|extract/i.test(`${objective?.type || ""} ${objective?.title || ""} ${objective?.behavior || ""}`);
}

function centerMap() {
  if (map && !useFallbackMap) {
    map.setView(cities[state.city].center, leafletZoomLevel());
    return;
  }
  renderFallbackMap();
}

function nextObjective() {
  return state.objectives.find((objective) => objective.decoded && !objective.found) || null;
}

function fieldObjectiveLabel(objective) {
  if (!state.agents.length) return "Join a squad to receive field orders.";
  if (!objective) return "All decoded objectives are complete.";
  return `${objective.title} / ${objective.progress}%`;
}

function nearestAgentDistance(objective) {
  if (!state.agents.length) return Infinity;
  return Math.min(...state.agents.map((agent) => haversine(agent, objective)));
}

function nearestThreat(agent) {
  if (!agent || !state.threats.length) return null;
  return state.threats.reduce((nearest, threat) => {
    if (!nearest) return threat;
    return haversine(agent, threat) < haversine(agent, nearest) ? threat : nearest;
  }, null);
}

function threatLevel() {
  if (!state.threats.length) return "Quiet";
  if (state.threats.some((threat) => threat.alert)) return "Contact";
  const nearest = Math.min(...state.threats.map(nearestAgentDistance));
  if (nearest < 220) return "Close";
  return "Quiet";
}

function haversine(a, b) {
  const radius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function jitter(center, amount) {
  return [center[0] + (Math.random() - 0.5) * amount, center[1] + (Math.random() - 0.5) * amount * 1.5];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopMissionLoops() {
  clearInterval(timerId);
  clearInterval(simulationId);
  clearInterval(heartbeatId);
}

function generateCode() {
  const words = ["AQUA", "RADAR", "SIGNAL", "ECHO", "ORBIT", "TOWER", "NOVA", "FIELD"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}`;
}

function normalizeEnabledModules() {
  if (!state.enabledModules || typeof state.enabledModules !== "object") state.enabledModules = {};
  moduleCatalog.forEach(([key, , , enabledByDefault]) => {
    if (typeof state.enabledModules[key] !== "boolean") state.enabledModules[key] = enabledByDefault;
  });
}

function enabledMissionPack(key) {
  return moduleEnabled(key) ? missionPacks[key] || [] : [];
}

function customMarkerPack() {
  if (!Array.isArray(state.customMarkers)) return [];
  return state.customMarkers
    .filter(markerInMissionArea)
    .filter(markerIsArmed)
    .filter((marker) => markerTypeBehavior(marker).objective)
    .map((marker) => [
      marker.title,
      marker.type,
      markerObjectiveRadius(marker),
      marker.artifact ? markerObjectiveBrief(marker) : marker.brief || markerObjectiveBrief(marker),
      {
        source: "custom",
        markerId: marker.id,
        behavior: marker.type,
        behaviorLabel: markerTypeBehavior(marker).label
      }
    ]);
}

function moduleEnabled(key) {
  normalizeEnabledModules();
  return state.enabledModules[key] !== false;
}

function toggleModule(key) {
  if (!moduleCatalog.some(([item]) => item === key)) return;
  state.enabledModules[key] = !moduleEnabled(key);
  state.chat.push(["Organizer", `${moduleName(key)} ${state.enabledModules[key] ? "enabled" : "disabled"}.`]);
  generateObjectives();
  renderAll();
  commitState();
}

function moduleName(key) {
  return moduleCatalog.find(([item]) => item === key)?.[1] || key;
}

function voiceRelay() {
  if (!moduleEnabled("voice") || !("speechSynthesis" in window)) return;
  const latest = state.chat[state.chat.length - 1];
  if (!latest) return;
  const message = voicePrompt(latest);
  if (message === lastSpokenChat) return;
  lastSpokenChat = message;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  } catch {
    lastSpokenChat = "";
  }
}

function voicePrompt([speaker, text]) {
  if (speaker === "AI Watch") return `Alert. ${text}`;
  if (speaker === "Decoder") return `Decoder update. ${text}`;
  if (speaker === "Mission Control") return `Mission Control. ${text}`;
  if (speaker === "Organizer") return `Organizer update. ${text}`;
  return `${speaker}. ${text}`;
}

function saveState() {
  localStorage.setItem("signalLostGameState", JSON.stringify(state));
}

function commitState() {
  if (isApplyingRemote) return;
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  if (local) local.lastSeen = Date.now();
  state.revision = Number(state.revision || 0) + 1;
  state.updatedAt = Date.now();
  saveState();
  pushRemote();
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem("signalLostGameState") || "null");
    if (stored) {
      Object.assign(state, stored, {
        clientId: state.clientId,
        localAgentId: state.localAgentId,
        localProfile: state.localProfile
      });
    }
  } catch {
    localStorage.removeItem("signalLostGameState");
  }
}

function initSync() {
  updateSyncStatus("Checking sync", "offline");
  syncNow(false);
  fetchActiveSessions();
  clearInterval(syncId);
  clearInterval(sessionsId);
  clearInterval(presenceId);
  clearInterval(locationsId);
  syncId = setInterval(() => syncNow(false), 1400);
  sessionsId = setInterval(fetchActiveSessions, 5000);
  presenceId = setInterval(sendPresenceHeartbeat, 8000);
  locationsId = setInterval(fetchRemoteLocations, 2500);
}

async function sendPresenceHeartbeat() {
  const local = state.agents.find((agent) => agent.id === state.localAgentId);
  if (!local) return;
  local.lastSeen = Date.now();
  saveState();
  if (!isApiServer()) return;
  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: local.id,
        clientId: state.clientId,
        lat: local.lat,
        lng: local.lng,
        signal: local.signal,
        stamina: local.stamina
      })
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.lastSeen) local.lastSeen = data.lastSeen;
    if (data.session?.serverRevision) state.serverRevision = data.session.serverRevision;
    updateSyncStatus("Presence live", "online");
    renderModeration();
    renderCoordinateSync();
  } catch {
    updateSyncStatus("Sync online", "online");
  }
}

async function fetchRemoteLocations() {
  if (!isApiServer()) return;
  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}/locations`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    mergeRemoteAgentPositions({
      serverRevision: data.serverRevision,
      agents: data.agents
    });
  } catch {
    // Full session sync remains the fallback path.
  }
}

async function syncNow(forcePush) {
  if (!isApiServer()) {
    updateSyncStatus("Static local", "offline");
    return;
  }

  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}`, { cache: "no-store" });
    if (response.status === 404 || forcePush) {
      await pushRemote();
      updateSyncStatus("Sync online", "online");
      return;
    }
    if (!response.ok) throw new Error("Sync unavailable");
    const data = await response.json();
    if (data.session) {
      const remoteRevision = Number(data.session.revision || 0);
      const remoteServerRevision = Number(data.session.serverRevision || 0);
      if (remoteRevision > Number(state.revision || 0)) {
        applyRemoteState(data.session);
      } else if (remoteServerRevision > Number(state.serverRevision || 0)) {
        mergeRemoteAgentPositions(data.session);
      }
    }
    updateSyncStatus("Sync online", "online");
  } catch {
    updateSyncStatus("Sync offline", "offline");
  }
}

async function pushRemote() {
  if (!isApiServer()) {
    updateSyncStatus("Static local", "offline");
    return;
  }
  if (lastSyncedRevision === state.revision) return;

  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(serializableState())
    });
    if (!response.ok) throw new Error("Push failed");
    lastSyncedRevision = state.revision;
    updateSyncStatus("Sync online", "online");
  } catch {
    updateSyncStatus("Sync offline", "offline");
  }
}

function applyRemoteState(remote) {
  isApplyingRemote = true;
  const identity = {
    clientId: state.clientId,
    localAgentId: state.localAgentId,
    localProfile: state.localProfile,
    activeView: state.activeView
  };
  Object.assign(state, remote, identity);
  state.serverRevision = Number(remote.serverRevision || state.serverRevision || 0);
  saveState();
  renderAll();
  lastSyncedRevision = state.revision;
  isApplyingRemote = false;
}

function mergeRemoteAgentPositions(remote) {
  if (!Array.isArray(remote?.agents)) return;
  const localById = new Map(state.agents.map((agent) => [agent.id, agent]));
  let changed = false;
  remote.agents.forEach((remoteAgent) => {
    if (!remoteAgent?.id) return;
    const localAgent = localById.get(remoteAgent.id);
    if (!localAgent) {
      state.agents.push(remoteAgent);
      changed = true;
      return;
    }
    if (localAgent.id === state.localAgentId && remoteAgent.clientId !== state.clientId) return;
    const remoteSeen = Number(remoteAgent.lastSeen || remoteAgent.identity?.joinedAt || 0);
    const localSeen = Number(localAgent.lastSeen || localAgent.identity?.joinedAt || 0);
    if (remoteSeen && remoteSeen >= localSeen) {
      ["lat", "lng", "signal", "stamina", "gpsAccuracy", "lastSeen", "clientId"].forEach((key) => {
        if (remoteAgent[key] !== undefined) localAgent[key] = remoteAgent[key];
      });
      changed = true;
    }
  });
  state.serverRevision = Number(remote.serverRevision || state.serverRevision || 0);
  if (!changed) return;
  saveState();
  drawMap();
  renderStatus();
  renderFieldDashboard();
  renderCoordinateSync();
  renderModeration();
}

function serializableState() {
  return {
    status: state.status,
    code: state.code,
    revision: state.revision,
    serverRevision: state.serverRevision,
    updatedAt: state.updatedAt,
    city: state.city,
    duration: state.duration,
    remaining: state.remaining,
    maxPlayers: state.maxPlayers,
    isPublic: state.isPublic,
    sessionMode: state.sessionMode,
    organizer: state.organizer,
    auth: state.auth,
    mapLayer: state.mapLayer,
    mapZoom: state.mapZoom,
    agents: state.agents,
    objectives: state.objectives,
    threats: state.threats,
    customMarkers: state.customMarkers,
    enabledModules: state.enabledModules,
    audit: state.audit.slice(-80),
    chatFilter: state.chatFilter,
    auditFilter: state.auditFilter,
    chat: state.chat.slice(-50)
  };
}

function isApiServer() {
  return location.protocol.startsWith("http") && location.port !== "5185";
}

function updateSyncStatus(text, mode) {
  const node = $("#syncStatus");
  if (!node) return;
  node.textContent = text;
  node.classList.toggle("online", mode === "online");
  node.classList.toggle("offline", mode === "offline");
}

function renderMapSourceLabel() {
  const node = $("#mapSourceLabel");
  if (!node) return;
  const layerName = mapLayers[state.mapLayer] || mapLayers.street;
  node.textContent = useFallbackMap || !map ? `Offline ${layerName} + Simulated GPS` : `OpenStreetMap + ${layerName} Overlay`;
}

function renderMapLayerBadge() {
  const node = $("#mapLayerBadge");
  if (!node) return;
  const [title, detail] = mapLayerDetails[state.mapLayer] || mapLayerDetails.street;
  const source = useFallbackMap || !map ? "Offline" : "Live tiles";
  node.innerHTML = `<strong>${source} ${title}</strong><span>${detail}</span>`;
}

function renderFallbackMap() {
  const fallback = $("#mapFallback");
  if (!fallback) return;
  toggleFallbackMap(true);
  fallback.dataset.layer = state.mapLayer;
  fallback.dataset.zoom = Math.round(state.mapZoom * 100);
  const center = cities[state.city].center;
  renderFallbackMapLabels(fallback);
  renderFallbackRoute(fallback, center);
  const markers = [
    ...state.threats.map((threat) => ({ kind: "threat", ...projectToFallback(threat, center, true), threat })),
    ...state.customMarkers
      .filter(markerInMissionArea)
      .filter(markerVisibleOnMissionMap)
      .map((marker) => ({ kind: "custom", ...projectToFallback(marker, center, true), marker })),
    ...state.objectives
      .filter((objective) => objective.decoded && objective.source !== "custom")
      .map((objective) => ({ kind: "objective", ...projectToFallback(objective, center, true), objective })),
    ...state.agents.map((agent) => ({ kind: "agent", ...projectToFallback(agent, center, true), agent }))
  ];
  fallback.querySelectorAll(".fallback-marker").forEach((node) => node.remove());
  markers.forEach((item) => {
    const node = document.createElement("div");
    node.className = `fallback-marker ${item.kind}`;
    node.style.left = `${item.left}%`;
    node.style.top = `${item.top}%`;
    if (item.kind === "objective") {
      node.innerHTML = `<span class="objective-marker ${item.objective.found ? "done" : ""}">${item.objective.found ? "OK" : "+"}</span>`;
      node.title = `${item.objective.title} (${item.objective.progress}%)`;
    } else if (item.kind === "threat") {
      node.innerHTML = `<span class="threat-marker ${item.threat.alert ? "alert" : ""}">AI</span>`;
      node.title = `${item.threat.name} / ${item.threat.radius}m`;
    } else if (item.kind === "custom") {
      node.innerHTML = `<span class="custom-map-marker ${markerTypeClass(item.marker)}">${escapeHtml(item.marker.type.slice(0, 1))}</span>`;
      node.title = `${item.marker.title} / ${item.marker.type} / ${customMarkerTaskStates[markerTaskState(item.marker)]} / ${item.marker.radius}m`;
    } else {
      node.innerHTML = `<span class="agent-marker">${item.agent.name.slice(0, 1)}</span>`;
      node.title = `${item.agent.name} / ${item.agent.role} / ${item.agent.team}`;
    }
    fallback.appendChild(node);
  });
  const notice = $("#mapNotice");
  renderMapSourceLabel();
  renderMapLayerBadge();
  if (notice) {
    const layerLabel = state.mapLayer === "street" ? "offline street map" : state.mapLayer === "terrain" ? "terrain scan" : "tactical grid";
    notice.textContent =
      mapFallbackReason === "tiles"
        ? `Map tiles blocked / ${layerLabel} active`
        : mapFallbackReason === "file"
          ? `File mode / ${layerLabel}`
          : isApiServer()
            ? `${layerLabel} active`
            : layerLabel;
  }
}

function renderFallbackRoute(fallback, center) {
  fallback.querySelectorAll(".fallback-route-map").forEach((node) => node.remove());
  const points = missionRoutePoints().map((point) => projectToFallback(point, center, true));
  if (points.length < 2) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("fallback-route-map");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const routePoints = points.map((point) => `${point.left.toFixed(2)},${point.top.toFixed(2)}`).join(" ");
  const glow = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  glow.setAttribute("class", "fallback-route-glow");
  glow.setAttribute("points", routePoints);
  const route = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  route.setAttribute("class", "fallback-route-line");
  route.setAttribute("points", routePoints);
  svg.append(glow, route);
  fallback.appendChild(svg);
}

function renderFallbackMapLabels(fallback) {
  fallback
    .querySelectorAll(
      ".fallback-map-label, .fallback-map-road, .fallback-map-river, .fallback-map-block, .fallback-map-park, .fallback-map-water, .fallback-map-contour, .fallback-route-map"
    )
    .forEach((node) => node.remove());
  const layer = state.mapLayer || "street";
  if (layer === "terrain") {
    renderFallbackTerrainLayer(fallback);
    return;
  }
  if (layer === "street") {
    renderFallbackStreetLayer(fallback);
    return;
  }
  renderFallbackTacticalLayer(fallback);
}

function renderFallbackTacticalLayer(fallback) {
  [
    ["fallback-map-label north", "North route"],
    ["fallback-map-label center", `${cities[state.city].name} core`],
    ["fallback-map-label south", "Extraction edge"]
  ].forEach(([className, text]) => {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    fallback.appendChild(node);
  });
  ["road-a", "road-b", "road-c"].forEach((name) => {
    const road = document.createElement("div");
    road.className = `fallback-map-road ${name}`;
    fallback.appendChild(road);
  });
  const river = document.createElement("div");
  river.className = "fallback-map-river";
  fallback.appendChild(river);
}

function renderFallbackStreetLayer(fallback) {
  [
    ["fallback-map-label north", "Market district"],
    ["fallback-map-label center", `${cities[state.city].name} center`],
    ["fallback-map-label south", "Transit edge"]
  ].forEach(([className, text]) => {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    fallback.appendChild(node);
  });
  ["road-a", "road-b", "road-c", "street-d", "street-e", "street-f"].forEach((name) => {
    const road = document.createElement("div");
    road.className = `fallback-map-road ${name}`;
    fallback.appendChild(road);
  });
  const water = document.createElement("div");
  water.className = "fallback-map-water";
  fallback.appendChild(water);
  [
    [12, 14, 16, 13],
    [34, 12, 18, 15],
    [61, 13, 19, 14],
    [15, 42, 20, 16],
    [43, 39, 15, 19],
    [69, 43, 15, 16],
    [20, 72, 17, 13],
    [50, 70, 18, 14],
    [75, 70, 13, 15]
  ].forEach(([left, top, width, height]) => {
    const block = document.createElement("div");
    block.className = "fallback-map-block";
    Object.assign(block.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
    fallback.appendChild(block);
  });
  [
    [7, 57, 14, 11],
    [83, 25, 10, 13]
  ].forEach(([left, top, width, height]) => {
    const park = document.createElement("div");
    park.className = "fallback-map-park";
    Object.assign(park.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
    fallback.appendChild(park);
  });
}

function renderFallbackTerrainLayer(fallback) {
  [
    ["fallback-map-label north", "High ground"],
    ["fallback-map-label center", `${cities[state.city].name} basin`],
    ["fallback-map-label south", "Low route"]
  ].forEach(([className, text]) => {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    fallback.appendChild(node);
  });
  const water = document.createElement("div");
  water.className = "fallback-map-water terrain-water";
  fallback.appendChild(water);
  [
    [18, 12, 66, 66],
    [28, 22, 46, 46],
    [39, 33, 25, 25]
  ].forEach(([left, top, width, height]) => {
    const contour = document.createElement("div");
    contour.className = "fallback-map-contour";
    Object.assign(contour.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
    fallback.appendChild(contour);
  });
  [
    [9, 15, 18, 22],
    [70, 58, 20, 18]
  ].forEach(([left, top, width, height]) => {
    const park = document.createElement("div");
    park.className = "fallback-map-park terrain-park";
    Object.assign(park.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
    fallback.appendChild(park);
  });
}

function toggleFallbackMap(show) {
  const mapNode = $("#map");
  const fallback = $("#mapFallback");
  if (mapNode) {
    mapNode.style.opacity = show ? "0" : "1";
    mapNode.style.pointerEvents = show ? "none" : "auto";
  }
  if (fallback) fallback.style.display = show ? "block" : "none";
}

function projectToFallback(point, center, useZoom = false) {
  const lngScale = Math.cos((center[0] * Math.PI) / 180) || 1;
  const zoomScale = useZoom ? mapZoomScale() : 1;
  const offsetX = (((point.lng - center[1]) * lngScale) / 0.022) * zoomScale;
  const offsetY = ((point.lat - center[0]) / 0.016) * zoomScale;
  return {
    left: clamp(50 + offsetX * 100, 8, 92),
    top: clamp(50 - offsetY * 100, 10, 90)
  };
}

function fallbackToCoordinates(left, top, center) {
  const lngScale = Math.cos((center[0] * Math.PI) / 180) || 1;
  const lat = center[0] + ((50 - top) / 100) * 0.016;
  const lng = center[1] + (((left - 50) / 100) * 0.022) / lngScale;
  return [clamp(lat, -90, 90), clamp(lng, -180, 180)];
}

async function fetchActiveSessions() {
  const holder = $("#activeGames");
  if (!holder) return;
  if (!isApiServer()) {
    holder.innerHTML = `<article class="active-game-card"><strong>Shared server offline</strong><span>Open http://127.0.0.1:5186/ for active games.</span></article>`;
    return;
  }

  try {
    const response = await fetch("/api/sessions", { cache: "no-store" });
    if (!response.ok) throw new Error("No sessions");
    const data = await response.json();
    if (!data.sessions.length) {
      holder.innerHTML = `<article class="active-game-card"><strong>No active games yet</strong><span>Start or sync this session to publish it.</span></article>`;
      return;
    }
    holder.innerHTML = data.sessions
      .map(
        (session) => `
          <button class="active-game-card ${session.code === state.code ? "selected" : ""} ${session.sessionMode === "locked" ? "locked" : ""} ${session.stale ? "stale" : ""}" type="button" data-session-code="${session.code}">
            <strong>${session.code}</strong>
            <span>Host ${escapeHtml(session.organizerCallsign || session.organizerName || "Unclaimed")} / ${escapeHtml(session.organizerName || "Organizer")}</span>
            <span>${cityName(session.city)} / ${session.status || "Lobby"} / ${session.players || 0}/${session.maxPlayers || "?"} players</span>
            <span>${session.activePlayers ?? session.players ?? 0} active field agents</span>
            <span>${session.accessRequired ? "Access code required" : "Open join"}</span>
            <span>${session.chatCount ?? 0} comms events</span>
            <span>${session.found || 0}/${session.objectives || 0} objectives found</span>
            <small>Rev ${session.revision || 0} / ${session.stale ? "stale" : "live"} / ${formatSessionAge(session.ageMs)}</small>
            <b>${session.sessionMode === "locked" ? "Locked" : session.stale ? "Stale" : "Public"}</b>
          </button>
        `
      )
      .join("");
    holder.querySelectorAll("[data-session-code]").forEach((button) => {
      button.addEventListener("click", () => {
        state.code = button.dataset.sessionCode;
        renderAll();
        syncNow(false);
      });
    });
  } catch {
    holder.innerHTML = `<article class="active-game-card"><strong>Session list unavailable</strong><span>Server may be restarting.</span></article>`;
  }
}

async function exportSession() {
  if (!isApiServer()) {
    updateSessionToolStatus("Open the shared server to export.");
    return;
  }
  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Session not found");
    const data = await response.json();
    $("#sessionPayload").value = JSON.stringify(data.session, null, 2);
    updateSessionToolStatus(`${state.code} exported.`);
  } catch {
    updateSessionToolStatus("Export failed.");
  }
}

async function importSession() {
  if (!isApiServer()) {
    updateSessionToolStatus("Open the shared server to import.");
    return;
  }
  try {
    const incoming = JSON.parse($("#sessionPayload").value || "{}");
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(incoming)
    });
    if (!response.ok) throw new Error("Import failed");
    const data = await response.json();
    const code = data.imported?.[0];
    if (code) {
      state.code = code;
      await syncNow(false);
    }
    await fetchActiveSessions();
    updateSessionToolStatus(data.imported?.length ? `${data.imported.length} session imported.` : "No valid sessions found.");
  } catch {
    updateSessionToolStatus("Import needs valid session JSON.");
  }
}

async function removeSession() {
  if (!isApiServer()) {
    updateSessionToolStatus("Open the shared server to remove sessions.");
    return;
  }
  if (!window.confirm(`Remove shared session ${state.code}? Local browser state stays available.`)) return;
  try {
    const response = await fetch(`/api/session/${encodeURIComponent(state.code)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Remove failed");
    const data = await response.json();
    await fetchActiveSessions();
    updateSessionToolStatus(data.removed ? `${state.code} removed from server.` : `${state.code} was not on the server.`);
  } catch {
    updateSessionToolStatus("Remove failed.");
  }
}

function updateSessionToolStatus(text) {
  const node = $("#sessionToolStatus");
  if (node) node.textContent = text;
}

function formatSessionAge(ageMs) {
  if (!Number.isFinite(ageMs)) return "unknown sync";
  if (ageMs < 1000) return "just now";
  if (ageMs < 60_000) return `${Math.round(ageMs / 1000)}s ago`;
  if (ageMs < 3_600_000) return `${Math.round(ageMs / 60_000)}m ago`;
  return `${Math.round(ageMs / 3_600_000)}h ago`;
}

function cityName(key) {
  return cities[key]?.name || key || "Unknown";
}

init();