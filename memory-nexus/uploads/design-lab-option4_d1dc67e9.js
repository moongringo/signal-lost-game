const canvas = document.querySelector("#patternCanvas");
const context = canvas.getContext("2d");
const backgroundSelect = document.querySelector("#backgroundSelect");
const fontSelect = document.querySelector("#fontSelect");
const buttonStyleSelect = document.querySelector("#buttonStyleSelect");
const motionRange = document.querySelector("#motionRange");
const audio = document.querySelector("#themeAudio");
const audioToggle = document.querySelector("#audioToggle");
const audioStatus = document.querySelector("#audioStatus");

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

function drawBlueBlocks(speed) {
  const colors = palettes["blue-blocks"];
  context.fillStyle = colors[0];
  context.fillRect(0, 0, width, height);
  const tile = 132;
  const shift = (time * 0.012 * speed) % tile;
  let index = 0;
  for (let y = -tile; y < height + tile; y += tile) {
    for (let x = -tile; x < width + tile; x += tile) {
      const px = x + ((Math.round(y / tile) % 2) * tile) / 2 - shift;
      const py = y + Math.sin(time * 0.0008 + index) * 8 * speed;
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
  const colors = palettes[backgroundSelect.value] || palettes["psychedelic-waves"];
  context.fillStyle = colors[0];
  context.fillRect(0, 0, width, height);
  const band = 52;
  for (let i = -2; i < width / band + 8; i += 1) {
    context.beginPath();
    const color = colors[Math.abs(i) % colors.length];
    context.fillStyle = color;
    const baseX = i * band + Math.sin(time * 0.00055 * speed + i) * 45;
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

function draw(timestamp) {
  time = timestamp;
  const speed = Math.max(0.1, Number(motionRange.value) / 58);
  const mode = backgroundSelect.value;
  if (mode === "blue-blocks") drawBlueBlocks(speed);
  else if (mode === "teal-sonar") drawTealSonar(speed);
  else if (mode === "paisley") drawPaisley(speed);
  else drawWaves(speed);
  requestAnimationFrame(draw);
}

function syncControls() {
  document.body.dataset.background = backgroundSelect.value;
  document.body.dataset.font = fontSelect.value;
  document.body.dataset.buttonStyle = buttonStyleSelect.value;
}

async function toggleAudio() {
  if (audio.paused) {
    await audio.play();
  } else {
    audio.pause();
  }
  renderAudio();
}

function renderAudio() {
  const live = !audio.paused;
  audioToggle.textContent = live ? "Pause Theme" : "Play Theme";
  audioStatus.textContent = live ? "Theme live" : "Theme idle";
  document.body.classList.toggle("theme-live", live);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / Math.max(1, width);
  pointerY = event.clientY / Math.max(1, height);
});
backgroundSelect.addEventListener("change", syncControls);
fontSelect.addEventListener("change", syncControls);
buttonStyleSelect.addEventListener("change", syncControls);
audioToggle.addEventListener("click", () => {
  toggleAudio().catch(() => {
    audioStatus.textContent = "Tap again to allow audio";
  });
});
audio.addEventListener("play", renderAudio);
audio.addEventListener("pause", renderAudio);

resizeCanvas();
syncControls();
renderAudio();
requestAnimationFrame(draw);