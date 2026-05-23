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

const $ = (selector) => document.querySelector(selector);

function init() {
  restoreTheme();
  renderAgents();
  renderObjectives();
  renderRoles("Drone");
  renderChat();
  bindEvents();
  initMap();
  tick();
  setInterval(simulate, 2800);
  setInterval(tick, 1000);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
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
  $("#objectiveCount").textContent = objectives.length;
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

  renderAgents();
  renderObjectives();
  drawMapMarkers();
}

function tick() {
  secondsRemaining = Math.max(0, secondsRemaining - 1);
  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");
  $("#missionClock").textContent = `${minutes}:${seconds}`;
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

function restoreTheme() {
  const theme = localStorage.getItem("signalLostTheme") || "white";
  document.body.dataset.theme = theme === "white" ? "" : theme;
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.themeChoice === theme);
  });
}

init();