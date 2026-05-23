const fs = require("fs");
const path = require("path");

const files = [
  "index.html",
  "roles.html", 
  "control.html",
  "leaderboard.html",
  "dashboard.html"
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let html = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // 1. Add Leaflet CSS if missing
  if (!html.includes("leaflet@1.9.4")) {
    html = html.replace(
      "</head>",
      '  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />\n</head>'
    );
    modified = true;
    console.log(`[${file}] Added Leaflet CSS`);
  }

  // 2. Add Leaflet JS if missing
  if (!html.includes("leaflet@1.9.4/dist/leaflet.js")) {
    html = html.replace(
      "</head>",
      '  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>\n</head>'
    );
    modified = true;
    console.log(`[${file}] Added Leaflet JS`);
  }

  // 3. Add game scripts before </body>
  const gameScripts = `
  <script src="./game-engine.js?v=6"></script>
  <script src="./ai-threats.js?v=13"></script>
  <script src="./shared-game-hud.js?v=1"></script>`;

  if (!html.includes("shared-game-hud.js")) {
    html = html.replace("</body>", gameScripts + "\n</body>");
    modified = true;
    console.log(`[${file}] Added game scripts`);
  }

  // 4. Bump CSS cache
  html = html.replace(/design-flow\.css\?v=\d+/, 'design-flow.css?v=4');

  if (modified) {
    fs.writeFileSync(filePath, html);
    console.log(`[${file}] ✓ Patched`);
  } else {
    console.log(`[${file}] ℹ Already had scripts`);
  }
});

console.log("\nAll pages patched with Signal Lost game engine + HUD");
