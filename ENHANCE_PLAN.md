# Signal Lost v2 — Enhancement Plan

## Current state (working):
- Lobby screen: Host or Join game, name/callsign inputs, theme picker
- Setup screen: Country/city, duration, players, mission packs, Leaflet map with marker placement, theme
- Mission screen: Full-screen Leaflet map, GPS, timer, HUD, objectives, chat, role tools
- Results screen: Score grade, squad stats, team standings, Play Again
- Theme palette system (Classic, Sunset, Signal, Night)
- Role system (7 roles with tools)
- Threat patrols orbiting city center
- Objective progression system

## What needs enhancement:

### 1. Role Selection Screen (NEW screen between Setup and Mission)
Currently roles are auto-assigned. Need a dedicated role selection screen where players pick their role.
- After "Launch Mission" → show role selection screen
- Display all 7 role cards with descriptions and duties
- Player selects one role
- Shows who's on which team (North/South)
- "Ready" button when all roles filled → continues to Mission screen

### 2. Setup Screen: Marker Placement on Map Click
The marker system needs work:
- Clicking the map should open a mini-dialog at the click location
- Dialog: marker type (Clue/Cache/Waypoint/Danger/Extraction), title, optional note
- Marker appears on the map with correct color-coded icon
- Marker list below map with remove buttons
- Extraction marker auto-creates the extraction zone

### 3. Mission Screen: Full Gameplay
- GPS start/stop fully wired
- Player dot shows on map with accuracy circle
- Squad member dots show (color coded by team)
- Beacon markers show with numbers
- Extraction zone shows on map
- Threat patrols orbit and show with red pulsing
- Click objective in panel → "Decode" button → revealed
- Proximity-based objective collection
- When all objectives found AND player at extraction → mission complete
- End mission button → results

### 4. Results Screen
- Grade letter (S/A/B/C) with glow
- Objective count
- Team scores comparison
- Time bonus
- Threat penalty
- Play Again resets everything

### 5. Mobile Responsiveness
- Touch-friendly buttons (min 44px tap targets)
- Map fills screen on mobile, HUD overlays are slide-in panels
- Setup screen stacks vertically on mobile
- Lobby cards stack on mobile

## IMPLEMENTATION: 3 files to modify

### File 1: index.html
Add role selection screen:
- data-screen="roles"
- Role cards grid (7 roles)
- Team assignment display
- Ready button

### File 2: styles-v2.css
Add role selection screen styles:
- Role cards with hover/select states
- Role color accents per role
- Animated selection
- Team indicators

### File 3: game-v2.js
Major enhancements:
- Add role selection screen routing
- Wire marker click on setup map → add marker with type/title
- Wire GPS fully (startGPS(), stopGPS(), player dot, accuracy circle)
- Wire extraction zone on mission map
- Wire squad dots on mission map
- Wire threat patrols with red pulsing markers
- Wire endpoint detection (all objectives + extraction)
- Wire mission completion → results
- Add decode tool for objectives
- Fix any bugs found
