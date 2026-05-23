const canvas = document.querySelector("#patternCanvas");
const context = canvas.getContext("2d");
const backgroundSelect = document.querySelector("#backgroundSelect");
const audio = document.querySelector("#themeAudio");
const audioToggle = document.querySelector("#audioToggle");
const audioStatus = document.querySelector("#audioStatus");
const volumeControl = document.querySelector("#volumeControl");

let width = 0;
let height = 0;
let time = 0;
let pointerX = 0.5;
let pointerY = 0.5;

const palettes = {
  "blue-blocks": ["#18364b", "#24506c", "#8ca4a0", "#1f1d18", "#f4d8ad"],
  "psychedelic-waves": ["#f2b84b", "#e96d28", "#df1f2d", "#711119", "#2db9b2", "#69a43b", "#f4e4c5"],
  hourglass: ["#f4a184", "#e96d28", "#df1f2d", "#f2b84b", "#f4d8ad"],
  "teal-sonar": ["#06172b", "#0b7881", "#0d5665", "#e8c792", "#06394a"],
  paisley: ["#111111", "#3d4249", "#d9c5bd", "#ec7a29", "#c03843", "#6f2830"]
};

const optionThreePalettes = {
  "sunset-grid": {
    base: "#fff2c4",
    colors: ["#e82663", "#ff4f69", "#ff8b1f", "#ffd14d", "#efeccf", "#f06a20"],
    line: "#fff6d8"
  },
  "signal-candy": {
    base: "#ffe8b3",
    colors: ["#ff2d55", "#ff7a1a", "#ffc53d", "#fff0c7", "#00a9c7", "#f14170"],
    line: "#fff8df"
  },
  "night-static": {
    base: "#26151c",
    colors: ["#ff4f69", "#ff8b1f", "#ffd14d", "#682c84", "#006c71", "#efebcf"],
    line: "#ffd14d"
  }
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + w - radius, y);
  context.quadraticCurveTo(x + w, y, x + w, y + radius);
  context.lineTo(x + w, y + h - radius);
  context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  context.lineTo(x + radius, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
}

function drawOptionThreeTile(x, y, size, index, palette, pulse, glow) {
  const colors = palette.colors;
  const wobble = Math.sin(time * 0.0016 + index * 0.7) * 7 * pulse;
  const offset = Math.cos(time * 0.0012 + index * 0.4) * 5 * pulse;
  const inset = size * 0.09;
  context.save();
  context.translate(x + wobble, y + offset);
  context.shadowBlur = glow * 18;
  context.shadowColor = colors[(index + 1) % colors.length];

  context.fillStyle = colors[index % colors.length];
  roundedRect(0, 0, size, size, size * 0.18);
  context.fill();

  context.shadowBlur = 0;
  context.strokeStyle = colors[(index + 2) % colors.length];
  context.lineWidth = Math.max(3, size * 0.035);
  roundedRect(inset, inset, size - inset * 2, size - inset * 2, size * 0.15);
  context.stroke();

  context.strokeStyle = palette.line;
  context.globalAlpha = 0.72;
  context.lineWidth = Math.max(2, size * 0.022);
  roundedRect(inset * 1.85, inset * 1.85, size - inset * 3.7, size - inset * 3.7, size * 0.12);
  context.stroke();

  context.globalAlpha = 1;
  context.fillStyle = colors[(index + 3) % colors.length];
  context.beginPath();
  context.ellipse(
    size * 0.52 + Math.sin(time * 0.002 + index) * size * 0.06 * pulse,
    size * 0.52 + Math.cos(time * 0.0018 + index) * size * 0.05 * pulse,
    size * 0.23,
    size * 0.25,
    Math.sin(time * 0.0008 + index) * 0.2,
    0,
    Math.PI * 2
  );
  context.fill();
  context.restore();
}

function drawRoundedTiles(speed) {
  const palette = optionThreePalettes[getCurrentBackground()] || optionThreePalettes["sunset-grid"];
  const pulse = 0.45 + speed * 1.15;
  const glow = 0.64;
  const drift = 0.46;
  const tile = Math.max(118, Math.min(178, width / 7));
  const spacing = tile * 0.96;
  const driftX = Math.sin(time * 0.00018 * (1 + speed * 2)) * spacing * drift;
  const driftY = Math.cos(time * 0.00014 * (1 + speed * 2)) * spacing * drift;
  const pointerDriftX = (pointerX - 0.5) * 32 * drift;
  const pointerDriftY = (pointerY - 0.5) * 32 * drift;

  context.fillStyle = palette.base;
  context.fillRect(0, 0, width, height);

  let index = 0;
  for (let y = -spacing * 1.5; y < height + spacing; y += spacing) {
    for (let x = -spacing * 1.5; x < width + spacing; x += spacing) {
      const rowOffset = Math.round(y / spacing) % 2 === 0 ? spacing * 0.12 : -spacing * 0.06;
      drawOptionThreeTile(x + rowOffset + driftX + pointerDriftX, y + driftY + pointerDriftY, tile, index, palette, pulse, glow);
      index += 1;
    }
  }

  context.save();
  context.globalCompositeOperation = "overlay";
  const gradient = context.createRadialGradient(width * pointerX, height * pointerY, 0, width * pointerX, height * pointerY, Math.max(width, height) * 0.75);
  gradient.addColorStop(0, "rgba(255,255,255,0.32)");
  gradient.addColorStop(0.5, "rgba(255,139,31,0.1)");
  gradient.addColorStop(1, "rgba(232,38,99,0.18)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawBlueBlocks(speed) {
  const colors = palettes["blue-blocks"];
  context.fillStyle = colors[0];
  context.fillRect(0, 0, width, height);
  const tile = 128;
  const shift = (time * 0.014 * speed) % tile;
  let index = 0;
  for (let y = -tile; y < height + tile; y += tile) {
    for (let x = -tile; x < width + tile; x += tile) {
      const px = x + ((Math.round(y / tile) % 2) * tile) / 2 - shift;
      const py = y + Math.sin(time * 0.0009 + index) * 8 * speed;
      context.fillStyle = colors[(index % (colors.length - 1)) + 1];
      roundedRect(px + 10, py + 10, 100, 100, 20);
      context.fill();
      context.lineWidth = 9;
      context.strokeStyle = colors[3];
      context.stroke();
      context.fillStyle = colors[(index + 2) % colors.length];
      roundedRect(px + 30, py + 30, 56, 56, 14);
      context.fill();
      context.fillStyle = colors[4];
      roundedRect(px + 58, py + 54, 34, 34, 8);
      context.fill();
      index += 1;
    }
  }
}

function drawWaves(speed) {
  const mode = getCurrentBackground();
  const colors = palettes[mode] || palettes["psychedelic-waves"];
  context.fillStyle = colors[0];
  context.fillRect(0, 0, width, height);
  const band = mode === "hourglass" ? 58 : 52;
  for (let i = -3; i < width / band + 8; i += 1) {
    context.beginPath();
    context.fillStyle = colors[Math.abs(i) % colors.length];
    const baseX = i * band + Math.sin(time * 0.00055 * speed + i) * 44;
    context.moveTo(baseX, -80);
    for (let y = -80; y <= height + 120; y += 34) {
      const x = baseX + Math.sin(y * 0.006 + time * 0.0008 * speed + i) * 78;
      context.lineTo(x, y);
    }
    for (let y = height + 120; y >= -80; y -= 34) {
      const x = baseX + band + Math.sin(y * 0.006 + time * 0.0008 * speed + i + 1.8) * 78;
      context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
  }
}

function drawTealSonar(speed) {
  const colors = palettes["teal-sonar"];
  context.fillStyle = colors[0];
  context.fillRect(0, 0, width, height);
  const gap = 160;
  const offset = (time * 0.018 * speed) % gap;
  for (let y = -gap; y < height + gap; y += gap) {
    for (let x = -gap; x < width + gap; x += gap) {
      const cx = x + offset;
      const cy = y + Math.sin(time * 0.0009 + x) * 10;
      for (let r = 58; r > 8; r -= 12) {
        context.beginPath();
        context.fillStyle = colors[(r / 12) % colors.length | 0];
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  context.lineWidth = 38;
  context.strokeStyle = colors[3];
  for (let y = -80; y < height + 120; y += gap) {
    context.beginPath();
    for (let x = -80; x < width + 120; x += 30) {
      const waveY = y + Math.sin(x * 0.012 + time * 0.001 * speed) * 42;
      x === -80 ? context.moveTo(x, waveY) : context.lineTo(x, waveY);
    }
    context.stroke();
  }
}

function drawPaisley(speed) {
  const colors = palettes.paisley;
  context.fillStyle = colors[4];
  context.fillRect(0, 0, width, height);
  const tile = 210;
  const drift = (time * 0.012 * speed) % tile;
  let index = 0;
  for (let y = -tile; y < height + tile; y += tile) {
    for (let x = -tile; x < width + tile; x += tile) {
      const cx = x + (index % 2 ? tile * 0.45 : 0) + drift;
      const cy = y + Math.sin(time * 0.001 + index) * 14;
      context.save();
      context.translate(cx, cy);
      context.rotate(Math.sin(time * 0.00035 + index) * 0.16);
      colors.forEach((color, layer) => {
        context.fillStyle = color;
        context.beginPath();
        context.ellipse(54 - layer * 3, 70, 40 + layer * 10, 98 - layer * 8, 0.48, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
      index += 1;
    }
  }
}

function getCurrentBackground() {
  return backgroundSelect?.value || localStorage.getItem("signalLostFlowBackground") || document.body.dataset.background || "sunset-grid";
}

function draw(timestamp) {
  time = timestamp;
  const speed = 0.9;
  const mode = getCurrentBackground();
  if (mode === "sunset-grid" || mode === "signal-candy" || mode === "night-static") drawRoundedTiles(speed);
  else if (mode === "blue-blocks") drawBlueBlocks(speed);
  else if (mode === "teal-sonar") drawTealSonar(speed);
  else if (mode === "paisley") drawPaisley(speed);
  else drawWaves(speed);
  requestAnimationFrame(draw);
}

function syncBackground() {
  if (backgroundSelect) {
    document.body.dataset.background = backgroundSelect.value;
    localStorage.setItem("signalLostFlowBackground", backgroundSelect.value);
  } else {
    document.body.dataset.background = getCurrentBackground();
  }
}

function renderAudio() {
  if (!audio || !audioToggle) return;
  const live = !audio.paused;
  const compact = audioToggle.closest(".compact-audio");
  audioToggle.textContent = live ? (compact ? "Pause" : "Pause Theme") : (compact ? "Play" : "Play Theme");
  if (audioStatus) audioStatus.textContent = live ? (compact ? "Live" : "Theme live on this page") : (compact ? "Idle" : "Theme idle");
  document.body.classList.toggle("theme-live", live);
}

function renderVolume() {
  if (!volumeControl || !audio) return;
  const vol = Math.round(audio.volume * 100);
  volumeControl.value = vol;
  // Update any volume display labels
  const volLabels = document.querySelectorAll('.volume-label, .vol-display');
  volLabels.forEach(l => l.textContent = vol + '%');
}

async function toggleAudio() {
  if (!audio) return;
  if (audio.paused) {
    await audio.play();
  } else {
    audio.pause();
  }
  renderAudio();
}

async function ensureAudioContext() {
  // Some browsers need user gesture before audio works
  if (audio && audio.paused) {
    try {
      await audio.play();
    } catch (e) {
      // Autoplay blocked, will need explicit play click
    }
  }
}

const savedBackground = localStorage.getItem("signalLostFlowBackground");
if (backgroundSelect && savedBackground && backgroundSelect.querySelector(`[value="${savedBackground}"]`)) {
  backgroundSelect.value = savedBackground;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / Math.max(1, width);
  pointerY = event.clientY / Math.max(1, height);
});
backgroundSelect?.addEventListener("change", syncBackground);
if (volumeControl && audio) {
  audio.volume = Number(volumeControl.value) / 100;
  volumeControl.addEventListener("input", () => {
    audio.volume = Number(volumeControl.value) / 100;
    renderVolume();
    // If audio was paused, try to start it on user interaction
    if (audio.paused) {
      audio.play().catch(() => {
        // Autoplay blocked — user needs to click Play first
      });
    }
  });
}
audioToggle?.addEventListener("click", () => {
  toggleAudio().catch(() => {
    if (audioStatus) audioStatus.textContent = "Tap again to allow audio";
  });
});
audio?.addEventListener("play", renderAudio);
audio?.addEventListener("pause", renderAudio);

resizeCanvas();
syncBackground();
renderAudio();
requestAnimationFrame(draw);