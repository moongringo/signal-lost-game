# Signal Lost v2 — Build Plan

## Goal
Build a clean, self-contained version of Signal Lost that flows from **Lobby → Setup → Mission → Results** using the **real OpenStreetMap** with GPS. One `index.html` page with screen routing, minimal dependencies, no login.

## Architecture
Single-page app (SPA) with 4 screens controlled by `document.body.dataset.screen`:
- `data-screen="lobby"` — Create or join
- `data-screen="setup"` — Configure mission (host only)
- `data-screen="mission"` — Main gameplay with live map
- `data-screen="results"` — End-of-game summary

## Files to Create
All in `/media/quemello/Back up2/signal-lost-game-dev/signal-lost-game-v2/`:

### 1. `index.html` — Main HTML entry point
- Full HTML structure with all 4 screens as div containers
- Loads Leaflet CSS from CDN
- Loads `game-v2.js`, `styles-v2.css`, and Leaflet JS

### 2. `styles-v2.css` — All styling
- Dark theme (matching existing Signal Lost aesthetic)
- 4 screen states via `body[data-screen]` CSS
- Responsive layout (mobile-first for GPS phones)
- Map container fills main area, panels slide from sides
- Animated transitions between screens

### 3. `game-v2.js` — All game logic in one file
Merges the best from: `app.js`, `game-map.js`, `game-engine.js`

#### === SCREEN 1: LOBBY ===
State: `data-screen="lobby"`
- "Host a Game" button — generates unique code (e.g. `AQUA-RADAR-42`), sets host flag, goes to setup screen
- "Join a Game" input — enter code, set name/callsign, goes directly to mission screen
- Organizer identity (name + callsign) — saved to localStorage
- Clean, centered UI — two cards side by side on desktop, stacked on mobile

#### === SCREEN 2: SETUP ===
State: `data-screen="setup"`
- Organizer only (the player who clicked "Host")
- Country + city selection dropdowns (real world cities from `cities` object)
- Duration slider (30-120 min)
- Player count slider (2-8)
- Access mode: Private (code required) or Public
- **Real OpenStreetMap preview** using Leaflet (import from game-map.js style)
  - Click on map → add markers: Safehouse, Cache, Danger, Extraction
  - Marker list with edit/remove
  - Use CartoDB dark tiles like game-map.js
- Mission module toggles: Ciphers, Treasure, Waypoints, Voice
- Theme selector (same 4 palettes: Classic, Sunset, Signal, Night)
- "Launch Mission" button → generates objectives from markers → switches to mission screen

#### === SCREEN 3: MISSION (GAMEPLAY) ===
State: `data-screen="mission"`
- This is the main game screen
- **Real OpenStreetMap** fills most of the screen
- **GPS integration**: "Start GPS" button uses browser geolocation, shows player dot on map
- **Squad tracking**: Other team members shown as colored dots with name labels
- **Beacon markers**: Numbered beacons from setup, with collection status
- **Extraction zone**: Green zone on map
- **Timer**: Countdown from duration
- **Signal/Stamina bars**: Squad average readout
- **Objectives panel**: List of objectives with decode/found status
- **Chat panel**: Simple chat with role-based messages
- **Role tools**: Quick action buttons per role (decode, scan, etc.)
- **Threat patrols**: Animated threat markers moving on map (from app.js threat system)
- **GPS manual fallback**: Manual lat/lng input if GPS unavailable

#### === SCREEN 4: RESULTS ===
State: `data-screen="results"`
- Score display with grade (S/A/B/C)
- Objectives found / total
- Squad stats (avg signal, stamina)
- Teams/score comparison
- "Play Again" (back to lobby) and "Reveal Map Recap" buttons

## Key Data Objects

### State Object
```javascript
const state = {
  screen: "lobby",          // current screen
  code: "AQUA-RADAR-42",    // unique game code
  isHost: false,            // is this player the organizer?
  localProfile: { name: "Morgan", callsign: "Raven" },
  
  // Setup
  city: "oslo",
  country: "norway", 
  duration: 60,
  maxPlayers: 6,
  isPublic: false,
  enabledModules: { ciphers: true, treasure: true, waypoints: true, voice: false },
  customMarkers: [],        // { id, type, lat, lng, title, taskState }
  
  // Mission
  status: "Lobby",          // Lobby, Live, Complete
  remaining: 3600,
  agents: [],               // { id, name, role, team, lat, lng, signal, stamina }
  objectives: [],           // { id, title, type, lat, lng, decoded, found, progress }
  threats: [],              // { id, name, radius, lat, lng, speed, angle }
  localAgentId: "",
  chat: []
};
```

### Cities
```javascript
const cities = {
  oslo: { name: "Oslo", country: "norway", center: [59.9139, 10.7522] },
  bergen: { name: "Bergen", country: "norway", center: [60.3913, 5.3221] },
  trondheim: { name: "Trondheim", country: "norway", center: [63.4305, 10.3951] },
  london: { name: "London", country: "uk", center: [51.5072, -0.1276] },
  newyork: { name: "New York", country: "usa", center: [40.7128, -74.006] },
  paris: { name: "Paris", country: "france", center: [48.8566, 2.3522] },
  tokyo: { name: "Tokyo", country: "japan", center: [35.6762, 139.6503] },
  sydney: { name: "Sydney", country: "australia", center: [-33.8688, 151.2093] }
};
const countries = { norway: "Norway", uk: "United Kingdom", usa: "United States", france: "France", japan: "Japan", australia: "Australia" };
```

### Role Catalog
```javascript
const roleCatalog = {
  Drone: ["Scan routes", "Mark safe corridor", "Ping AI scout"],
  Mechanic: ["Boost GPS mesh", "Repair relay", "Stabilize signal"],
  Medic: ["Find nearest agent", "Call regroup", "Protect low-signal players"],
  Decoder: ["Decode cipher", "Reveal clue", "Validate intercepted signal"],
  Navigator: ["Set waypoint", "Measure proximity", "Guide squad"],
  Courier: ["Carry key shard", "Deliver objective", "Trigger checkpoint"],
  "Mission Control": ["Track all agents", "Deploy objectives", "Monitor signal strength"]
};
```

### Mission Packs
```javascript
const missionPacks = {
  ciphers: [["Decode relay A17", "Cipher", 25, "Break the first packet and reveal the signal route."], ["Bypass false beacon", "Puzzle", 22, "Compare beacon timing and reject the decoy pulse."]],
  treasure: [["Recover GPS shard", "Treasure", 18, "Find the dropped shard before AI Watch triangulates it."], ["Claim cache marker", "Treasure", 20, "Secure the field cache and carry its key phrase forward."]],
  waypoints: [["Restore north uplink", "Waypoint", 30, "Stand inside the relay zone until the uplink stabilizes."], ["Trace safe corridor", "Waypoint", 32, "Move through the corridor to open the extraction vector."]],
  extraction: [["Extract final signal", "Extraction", 35, "Bring the decoded route, shard, and relay lock to final extraction."]]
};
```

### Marker Types
```javascript
const customMarkerTypeBehaviors = {
  Clue: { label: "Decode clue", detail: "Reveals story text or a code word.", radiusOffset: 0, objective: true },
  Cache: { label: "Recover cache", detail: "Rewards signal and stamina.", radiusOffset: 8, objective: true },
  Waypoint: { label: "Route checkpoint", detail: "Movement checkpoint.", radiusOffset: 12, objective: true },
  Danger: { label: "Hazard zone", detail: "Jams nearby agents.", radiusOffset: 20, objective: false },
  Extraction: { label: "Final extraction", detail: "High-priority objective.", radiusOffset: 15, objective: true }
};
```

### Theme Palettes
```javascript
const themePalettes = { classic: "Classic Signal", sunset: "Tangerine Static", signal: "Signal Candy", night: "Night Static" };
```

## Game Map Module (to be built into game-v2.js)
The map module from game-map.js should be merged directly. Key functions:
- `initMap(containerId, options)` — Create Leaflet map with dark CartoDB tiles
- `startGPS()` — Browser geolocation with watchPosition
- `stopGPS()` — Clear geolocation watch
- `setPlayerPosition(lat, lng)` — Manual position update
- `addBeacon(id, lat, lng, label)` — Drop numbered beacon with circle
- `collectBeacon(beaconId, playerId)` — Mark beacon collected, change icon
- `addExtraction(lat, lng, label)` — Add extraction zone
- `addSquadMember(id, lat, lng, name, color)` — Add/update squad marker
- `removeSquadMember(id)` — Remove squad marker
- `setSafeZone(center, radius)` — Draw safe zone boundary
- `focusOnPlayer()` — Pan map to player position

## Implementation Notes

1. Keep it in ONE HTML file (index.html), ONE CSS file (styles-v2.css), ONE JS file (game-v2.js)
2. All data persists in `localStorage` for now (no server needed)
3. The map uses Leaflet with CartoDB dark tiles (same as game-map.js)
4. GPS requires HTTPS — the app will detect and show a warning on HTTP
5. Theme pattern canvas animation from app.js should be included
6. Mobile-first: touch-friendly buttons, map resizes to fill available space
7. Extraction triggers game end when squad reaches it
8. Chat is local only (no Socket.io in v2, that's for v3)

## Priorities
1. Lobby screen (create/join) — must work for GPS testing tomorrow
2. Mission screen with real GPS map — must work on phone
3. Setup screen with marker placement
4. Results screen
5. Objectives, threats simulation
6. Chat, role tools, theme
