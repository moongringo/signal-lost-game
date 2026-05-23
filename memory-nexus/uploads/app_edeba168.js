const agents = [
  { name: "Ada", role: "Drone", team: "North", status: "online", signal: 82, lat: 59.9139, lng: 10.7522 },
  { name: "Mika", role: "Medic", team: "North", status: "online", signal: 76, lat: 59.9152, lng: 10.7446 },
  { name: "Rune", role: "Mechanic", team: "North", status: "warning", signal: 54, lat: 59.9107, lng: 10.7597 },
  { name: "Liv", role: "Decoder", team: "North", status: "online", signal: 91, lat: 59.9181, lng: 10.7554 },
  { name: "Echo-1", role: "AI Scout", team: "AI", status: "online", signal: 68, lat: 59.9084, lng: 10.7481 },
  { name: "Echo-2", role: "AI Jammer", team: "AI", status: "warning", signal: 47, lat: 59.9165, lng: 10.7631 },
  { name: "Nora", role: "Navigator", team: "South", status: "online", signal: 73, lat: 59.9119, lng: 10.7398 },
  { name: "Jon", role: "Courier", team: "South", status: "online", signal: 79, lat: 59.9204, lng: 10.7495 }
];

const objectives = [
  { title: "Decode relay A17", type: "Signal", radius: 10, progress: 72, lat: 59.9147, lng: 10.7511 },
  { title: "Recover GPS shard", type: "Treasure", radius: 8, progress: 45, lat: 59.9188, lng: 10.7599 },
  { title: "Bypass false beacon", type: "Puzzle", radius: 12, progress: 28, lat: 59.9092, lng: 10.7441 },
  { title: "Restore north uplink", type: "Waypoint", radius: 15, progress: 63, lat: 59.9211, lng: 10.7538 },
  { title: "Intercept AI route", type: "AI", radius: 20, progress: 35, lat: 59.9121, lng: 10.7654 }
];

const roles = {
  Drone: {
    Focus: "High view reconnaissance",
    Tools: "Live route scans, safe corridors, enemy pings",
    Alert: "AI jammer crossing objective B"
  },
  Mechanic: {
    Focus: "Repair GPS and power systems",
    Tools: "Signal strength, battery status, unlock timers",
    Alert: "Relay A17 needs calibration"
  },
  Medic: {
    Focus: "Team stability and rescue",
    Tools: "Player condition, distance to support, regroup calls",
    Alert: "Rune has weak signal near river"
  },
  Decoder: {
    Focus: "Encrypted tasks and patterns",
    Tools: "Cipher board, intercepted text, clue history",
    Alert: "New substitution key detected"
  }
};

const chatSeed = [
  ["Mission Control", "Signal is stable. Move north toward relay A17."],
  ["Ada", "Drone view confirms two possible paths."],
  ["Echo-1", "AI team started a decoy route."],
  ["Liv", "Cipher group ready. Send the next packet."]
];

let map;
let agentMarkers = [];
let objectiveMarkers = [];
let secondsRemaining = 2672;
let tickCount = 0;
const history = {
  signal: [72, 74, 69, 76, 71, 73, 70, 68, 75, 72],
  crew: [85, 83, 86, 82, 84, 81, 80, 83, 85, 84],
  threat: [24, 28, 31, 29, 34, 36, 32, 35, 31, 33],
  sat: [78, 81, 79, 83, 85, 82, 86, 84, 87, 88],
  gps: [64, 66, 68, 67, 72, 70, 73, 76, 74, 77],
  time: [90, 88, 86, 84, 83, 81, 80, 78, 76, 74]
};

const systemEvents = [
  "Satellite link established",
  "Perimeter scan initiated",
  "Unknown signal detected",
  "Signal strength degrading",
  "AI route prediction updated",
  "Attempting reconnection"
];

const $ = (selector) => document.querySelector(selector);

function init() {
  restoreTheme();
  renderAgents();
  renderObjectives();
  renderRoles("Drone");
  renderChat();
  renderHudStats();
  renderRadarTargets();
  bindEvents();
  initAudio();
  initMap();
  tick();
  setInterval(simulate, 2800);
  setInterval(tick, 1000);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function initAudio() {
  const audio = $("#themeAudio");
  const toggle = $("#audioToggle");
  const volume = $("#volumeSlider");
  const status = $("#audioStatus");
  const time = $("#audioTime");
  if (!audio || !toggle || !volume || !status || !time) return;

  audio.volume = Number(volume.value) / 100;

  const renderAudio = () => {
    document.body.classList.toggle("theme-playing", !audio.paused);
    toggle.setAttribute("aria-label", audio.paused ? "Play theme song" : "Pause theme song");
    status.textContent = audio.paused ? "Theme idle" : "Theme live";
    time.textContent = formatAudioTime(audio.currentTime || 0);
  };

  toggle.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        status.textContent = "Tap to enable";
      }
    } else {
      audio.pause();
    }
    renderAudio();
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value) / 100;
  });

  audio.addEventListener("timeupdate", renderAudio);
  audio.addEventListener("play", renderAudio);
  audio.addEventListener("pause", renderAudio);
  audio.addEventListener("loadedmetadata", renderAudio);
  renderAudio();
}

function formatAudioTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function bindEvents() {
  $("#sessionCode").addEventListener("click", () => {
    $("#sessionCode").textContent = generateSessionCode();
  });

  $("#createObjective").addEventListener("click", () => {
    const next = {
      title: `Manual marker ${objectives.length + 1}`,
      type: "Waypoint",
      radius: 10,
      progress: 0,
      lat: 59.908 + Math.random() * 0.016,
      lng: 10.739 + Math.random() * 0.028
    };
    objectives.unshift(next);
    persistObjectives();
    renderObjectives();
    drawMapMarkers();
  });

  $("#decodeNext").addEventListener("click", () => {
    objectives.forEach((objective, index) => {
      objective.progress = Math.min(100, objective.progress + (index === 0 ? 18 : 7));
    });
    persistObjectives();
    renderObjectives();
  });

  $("#shuffleRoles").addEventListener("click", () => {
    const roleNames = Object.keys(roles);
    agents.forEach((agent) => {
      if (agent.team !== "AI") {
        agent.role = roleNames[Math.floor(Math.random() * roleNames.length)];
      }
    });
    renderAgents();
  });

  $("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#chatInput");
    if (!input.value.trim()) return;
    chatSeed.push(["Mission Control", input.value.trim()]);
    input.value = "";
    renderChat();
  });

  document.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-map-mode]").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      const wrap = document.querySelector(".map-wrap");
      wrap.classList.toggle("radar-only", button.dataset.mapMode === "radar");
      wrap.classList.toggle("hybrid", button.dataset.mapMode === "hybrid");
      setTimeout(() => map?.invalidateSize(), 50);
    });
  });

  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-theme-choice]").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      const theme = button.dataset.themeChoice;
      document.body.dataset.theme = theme === "white" ? "" : theme;
      localStorage.setItem("signalLostTheme", theme);
      setTimeout(() => map?.invalidateSize(), 50);
    });
  });

  $("#collapseButton").addEventListener("click", () => {
    document.body.classList.toggle("panels-collapsed");
    setTimeout(() => map?.invalidateSize(), 150);
  });

  $("#citySearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = event.currentTarget.value.trim().toLowerCase();
    const known = {
      oslo: [59.9139, 10.7522],
      bergen: [60.3913, 5.3221],
      trondheim: [63.4305, 10.3951],
      london: [51.5072, -0.1276],
      "new york": [40.7128, -74.006]
    };
    const target = known[value];
    if (target && map) map.setView(target, 14);
  });
}

function renderAgents() {
  $("#playerCount").textContent = agents.length;
  $("#signalStrength").textContent = `${Math.round(agents.reduce((sum, agent) => sum + agent.signal, 0) / agents.length)}%`;
  $("#agentList").innerHTML = agents
    .map(
      (agent) => `
        <article class="agent-card">
          <span class="avatar">${agent.name.slice(0, 1)}</span>
          <div>
            <strong>${agent.name}</strong>
            <small>${agent.role} / ${agent.team}</small>
            <div class="progress" style="--value: ${agent.signal}%"><b></b></div>
          </div>
          <span class="status-pill ${agent.status}">${agent.signal}%</span>
        </article>
      `
    )
    .join("");
}

function renderObjectives() {
  const stored = JSON.parse(localStorage.getItem("signalLostObjectives") || "null");
  if (stored?.length && objectives.length === 5) {
    objectives.splice(0, objectives.length, ...stored);
  }
  $("#objectiveCount").textContent = `${objectives.length} objectives`;
  $("#objectiveList").innerHTML = objectives
    .slice(0, 5)
    .map(
      (objective) => `
        <article class="objective-card">
          <div>
            <strong>${objective.title}</strong>
            <small>${objective.type} / ${objective.radius}m proximity</small>
            <div class="objective-meta">
              <span class="pill">${objective.progress}%</span>
              <span class="pill">${formatDistance(distanceToNearestAgent(objective))}</span>
            </div>
          </div>
          <div class="progress" style="--value: ${objective.progress}%"><b></b></div>
        </article>
      `
    )
    .join("");
}

function renderRoles(selected) {
  $("#roleTabs").innerHTML = Object.keys(roles)
    .map(
      (role) => `
        <button type="button" role="tab" aria-selected="${role === selected}" data-role="${role}">${role}</button>
      `
    )
    .join("");

  $("#roleTabs").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => renderRoles(button.dataset.role));
  });

  $("#roleDetail").innerHTML = Object.entries(roles[selected])
    .map(
      ([label, value]) => `
        <div class="role-detail-row">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function renderChat() {
  $("#chatLog").innerHTML = chatSeed
    .slice(-8)
    .map(
      ([name, message]) => `
        <div class="chat-message">
          <span>${name}</span>
          <p>${message}</p>
        </div>
      `
    )
    .join("");
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

function initMap() {
  if (!window.L) {
    $("#mapFallback").style.zIndex = 3;
    return;
  }

  map = L.map("map", {
    zoomControl: false,
    attributionControl: true
  }).setView([59.9139, 10.7522], 14);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  drawMapMarkers();
}

function drawMapMarkers() {
  if (!map) return;

  agentMarkers.forEach((marker) => marker.remove());
  objectiveMarkers.forEach((marker) => marker.remove());
  agentMarkers = agents.map((agent) =>
    L.marker([agent.lat, agent.lng], {
      icon: L.divIcon({
        className: "",
        html: `<span class="player-marker">${agent.name.slice(0, 1)}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    })
      .bindPopup(`<strong>${agent.name}</strong><br>${agent.role} / ${agent.team}<br>Signal ${agent.signal}%`)
      .addTo(map)
  );

  objectiveMarkers = objectives.map((objective) =>
    L.marker([objective.lat, objective.lng], {
      icon: L.divIcon({
        className: "",
        html: '<span class="objective-marker">+</span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    })
      .bindPopup(`<strong>${objective.title}</strong><br>${objective.type}<br>${objective.radius}m radius`)
      .addTo(map)
  );
}

function simulate() {
  agents.forEach((agent) => {
    agent.lat += (Math.random() - 0.5) * 0.0012;
    agent.lng += (Math.random() - 0.5) * 0.0016;
    agent.signal = Math.max(38, Math.min(98, agent.signal + Math.round((Math.random() - 0.5) * 8)));
    agent.status = agent.signal < 58 ? "warning" : "online";
  });

  objectives.forEach((objective) => {
    const distance = distanceToNearestAgent(objective);
    if (distance < objective.radius && objective.progress < 100) {
      objective.progress = Math.min(100, objective.progress + 12);
    }
  });

  updateHistories();
  renderAgents();
  renderObjectives();
  renderHudStats();
  renderRadarTargets();
  drawMapMarkers();
}

function tick() {
  tickCount += 1;
  secondsRemaining = Math.max(0, secondsRemaining - 1);
  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");
  $("#missionClock").textContent = `${minutes}:${seconds}`;
  if (tickCount % 5 === 0) {
    updateHistories();
    renderHudStats();
  }
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

function distanceToNearestAgent(objective) {
  return Math.min(...agents.map((agent) => haversine(agent, objective)));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function persistObjectives() {
  localStorage.setItem("signalLostObjectives", JSON.stringify(objectives));
}

function generateSessionCode() {
  const words = ["BLUE", "NORTH", "SIGNAL", "ECHO", "RIVER", "TOWER", "RADAR", "ORBIT"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}-${pick()}-${Math.floor(10 + Math.random() * 89)}`;
}

function updateHistories() {
  const averageSignal = Math.round(agents.reduce((sum, agent) => sum + agent.signal, 0) / agents.length);
  const aiThreat = calculateThreatLevel();
  const crewVital = Math.round(
    agents
      .filter((agent) => agent.team !== "AI")
      .reduce((sum, agent) => sum + Math.min(100, agent.signal + 10), 0) /
      agents.filter((agent) => agent.team !== "AI").length
  );
  const satLink = Math.min(99, Math.max(62, averageSignal + Math.round(Math.random() * 12 - 3)));
  const gpsStability = Math.min(96, Math.max(45, 100 - objectives.length * 3 + Math.round(Math.random() * 8 - 4)));
  const timePressure = Math.round((secondsRemaining / (90 * 60)) * 100);

  pushHistory("signal", averageSignal);
  pushHistory("threat", aiThreat);
  pushHistory("crew", crewVital);
  pushHistory("sat", satLink);
  pushHistory("gps", gpsStability);
  pushHistory("time", timePressure);
}

function pushHistory(key, value) {
  history[key].push(value);
  if (history[key].length > 26) history[key].shift();
}

function calculateThreatLevel() {
  const aiSignals = agents.filter((agent) => agent.team === "AI").map((agent) => agent.signal);
  const aiAverage = aiSignals.reduce((sum, value) => sum + value, 0) / aiSignals.length;
  const unfinishedObjectives = objectives.filter((objective) => objective.progress < 100).length;
  return Math.round(Math.min(96, Math.max(8, aiAverage * 0.55 + unfinishedObjectives * 7)));
}

function renderHudStats() {
  const averageSignal = Math.round(agents.reduce((sum, agent) => sum + agent.signal, 0) / agents.length);
  const threat = calculateThreatLevel();
  const lowSignalCount = agents.filter((agent) => agent.signal < 58).length;

  $("#signalStrength").textContent = `${averageSignal}%`;
  $("#threatLevel").textContent = `${threat}%`;
  $("#threatBadge").textContent = `Threat ${threat}%`;
  $("#systemStatus").textContent = lowSignalCount > 1 ? "Warning" : "Online";
  $("#satLink").textContent = averageSignal < 60 ? "Unstable" : "Active";
  $("#signalWarningTitle").textContent = averageSignal < 64 ? "Signal Lost" : "Signal Degrading";

  renderSparkline("signalSpark", history.signal, "signal");
  renderSparkline("threatSpark", history.threat, "danger");
  renderSparkline("crewSpark", history.crew, "crew");
  renderSparkline("satSpark", history.sat, "sat");
  renderSparkline("gpsSpark", history.gps, "gps");
  renderSparkline("timeSpark", history.time, "time");
  renderWarningGraph();
  renderSystemLog();
}

function renderSparkline(id, values, mode) {
  const svg = document.getElementById(id);
  if (!svg) return;
  const path = smoothPath(values, 120, 34, 4);
  const area = `${path} L116 31 L4 31 Z`;
  const lastPoint = pointFor(values, values.length - 1, 120, 34, 4);
  const bars = sparkBars(values, 120, 34, 4);
  const gradId = `${id}Gradient`;
  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.28"></stop>
        <stop offset="72%" stop-color="currentColor" stop-opacity="0.04"></stop>
        <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <path class="spark-grid" d="M4 10 H116 M4 22 H116"></path>
    <g class="spark-bars ${mode}">${bars}</g>
    <path class="spark-area ${mode}" d="${area}" fill="url(#${gradId})"></path>
    <path class="spark-line ${mode}" d="${path}"></path>
    <circle class="spark-dot ${mode}" cx="${lastPoint.x}" cy="${lastPoint.y}" r="2.3"></circle>
  `;
}

function renderWarningGraph() {
  const svg = document.getElementById("warningGraph");
  if (!svg) return;
  const signalPath = smoothPath(history.signal, 320, 82, 9);
  const threatPath = smoothPath(history.threat, 320, 82, 9);
  const signalPoint = pointFor(history.signal, history.signal.length - 1, 320, 82, 9);
  const threatPoint = pointFor(history.threat, history.threat.length - 1, 320, 82, 9);
  svg.innerHTML = `
    <defs>
      <linearGradient id="warningThreatFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#ff6a2b" stop-opacity="0.28"></stop>
        <stop offset="76%" stop-color="#ff6a2b" stop-opacity="0.04"></stop>
      </linearGradient>
      <linearGradient id="warningSignalFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#a8f5c6" stop-opacity="0.18"></stop>
        <stop offset="80%" stop-color="#a8f5c6" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <path class="warning-grid" d="M0 20 H320 M0 41 H320 M0 62 H320 M64 0 V82 M128 0 V82 M192 0 V82 M256 0 V82"></path>
    <path class="warning-threshold" d="M0 31 H320"></path>
    <path class="warning-fill signal-fill" d="${signalPath} L311 73 L9 73 Z"></path>
    <path class="warning-fill threat-fill" d="${threatPath} L311 73 L9 73 Z"></path>
    <path class="warning-line signal" d="${signalPath}"></path>
    <path class="warning-line threat" d="${threatPath}"></path>
    <circle class="warning-dot signal" cx="${signalPoint.x}" cy="${signalPoint.y}" r="3.4"></circle>
    <circle class="warning-dot threat" cx="${threatPoint.x}" cy="${threatPoint.y}" r="3.4"></circle>
    <text class="warning-label signal" x="12" y="15">SIGNAL</text>
    <text class="warning-label threat" x="252" y="15">THREAT</text>
  `;
}

function sparkPath(values, width, height, padding) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
      const normalized = (value - min) / spread;
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function smoothPath(values, width, height, padding) {
  const points = values.map((_, index) => pointFor(values, index, width, height, padding));
  if (!points.length) return "";
  return points
    .map((point, index) => {
      if (index === 0) return `M${point.x} ${point.y}`;
      const previous = points[index - 1];
      const controlX = ((previous.x + point.x) / 2).toFixed(1);
      return `C${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");
}

function pointFor(values, index, width, height, padding) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const value = values[index];
  const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
  const normalized = (value - min) / spread;
  const y = height - padding - normalized * (height - padding * 2);
  return { x: x.toFixed(1), y: y.toFixed(1) };
}

function sparkBars(values, width, height, padding) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const stride = (width - padding * 2) / Math.max(1, values.length - 1);
  return values
    .map((value, index) => {
      const x = padding + index * stride - 1;
      const normalized = (value - min) / spread;
      const barHeight = Math.max(3, normalized * (height - padding * 2));
      const y = height - padding - barHeight;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="1.4" height="${barHeight.toFixed(1)}"></rect>`;
    })
    .join("");
}

function renderRadarTargets() {
  const holder = document.getElementById("radarTargets");
  if (!holder) return;
  const center = { lat: 59.9139, lng: 10.7522 };
  const targets = [...agents.slice(0, 5), ...objectives.slice(0, 2)].map((target, index) => {
    const distance = haversine(center, target);
    const bearing = Math.atan2(target.lng - center.lng, target.lat - center.lat);
    const radius = Math.min(42, Math.max(12, distance / 8));
    const x = 50 + Math.sin(bearing) * radius;
    const y = 50 - Math.cos(bearing) * radius;
    const isObjective = Boolean(target.title);
    const label = isObjective ? target.title.split(" ").slice(0, 2).join(" ") : target.name;
    return `
      <span class="radar-blip ${isObjective ? "objective-blip" : ""}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--delay:${index * 0.35}s">
        <b></b>
        <em>${label}<small>RNG ${Math.round(distance)}m</small></em>
      </span>
    `;
  });
  holder.innerHTML = targets.join("");
}

function renderSystemLog() {
  const log = document.getElementById("systemLog");
  if (!log) return;
  const baseTime = 16320 - secondsRemaining;
  const lines = systemEvents.map((event, index) => {
    const minutes = Math.floor((baseTime + index * 14) / 60).toString().padStart(2, "0");
    const seconds = ((baseTime + index * 14) % 60).toString().padStart(2, "0");
    const danger = event.toLowerCase().includes("degrading") || event.toLowerCase().includes("unknown");
    return `<p class="${danger ? "danger" : ""}"><span>${minutes}:${seconds}</span>${event}</p>`;
  });
  log.innerHTML = lines.join("");
}

function restoreTheme() {
  const theme = localStorage.getItem("signalLostTheme") || "white";
  document.body.dataset.theme = theme === "white" ? "" : theme;
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.themeChoice === theme);
  });
}

init();