# Signal Lost Game Guide

Living document for the Signal Lost prototype. Update this after every build when features, rules, roles, setup flow, or roadmap direction changes.

Last updated: 2026-05-02, RWL-039.

## Game Pitch

Signal Lost is a real-time multiplayer GPS adventure game. One organizer runs a mission from Mission Control while field agents move through a real or simulated city map, decode objective packets, avoid signal hunters, recover clues, and restore the lost signal chain before time runs out.

The prototype is designed for local multiplayer testing first. It runs in a browser, supports shared local sessions through `server.js`, and still has offline fallbacks for map/radar play when live map tiles are unavailable.

## Core Fantasy

The players are a field squad sent into a city where navigation, comms, and GPS signals have been disrupted. Mission Control sees the full operation, while field agents use a mobile-style Field Kit to follow proximity cues, protect signal/stamina, and complete physical or simulated objectives.

The organizer can customize the game with country/city selection, map markers, mission packs, saved templates, live GM interventions, and moderation tools.

## How To Play

1. Open the shared-session server:
   `http://127.0.0.1:5186/`
2. Pick a visual palette if desired. Each browser can keep its own Classic Signal, Tangerine Static, Signal Candy, or Night Static theme.
3. On Mission Setup, choose country, city, duration, max players, lobby visibility, map layer, and mission modules.
4. Add custom markers on the setup map if desired. Markers can become clues, caches, danger zones, waypoints, or extraction locations.
5. Check the Preflight Review in Mission Templates. Required checks make sure identity, packs, clue text, and map bounds are ready.
6. Continue to Roles. Each player picks a role, team, and agent name.
7. Enter Mission Control and start the mission.
8. Field agents use device GPS or manual coordinates to publish live positions.
9. Mission Control watches map/radar, objective progress, AI Watch threats, team scores, comms, and the organizer event trail.
10. Complete decoded objectives and reach extraction before time expires.

## Main Screens

### Global Theme Palette

The main game now has a persistent palette dropdown. It is a per-browser preference, so one player can use Night Static while another uses Classic Signal without changing the shared session state. The non-classic palettes use the same living canvas pattern family as the design lab: rounded tile fields, inner outlines, oval centers, glow, drift, and pointer-responsive motion.

Current palettes:
- Classic Signal.
- Tangerine Static.
- Signal Candy.
- Night Static.

### Mission Setup

Mission Setup is where the organizer builds the game before players enter Mission Control.

Current setup features:
- Country and city selection.
- Public, private, and locked lobby modes.
- Session access code settings and trusted host-key metadata.
- Mission duration and max player count.
- Street, Tactical Grid, and Terrain Scan map layers.
- Setup map with custom marker placement.
- Saved templates for reusable games.
- Template preflight review with required and optional checks.
- Module toggles for ciphers, treasure hunt, waypoints, and voice relay.

### Role Assignment

Role Assignment makes players choose their identity before entering the main control room.

Current role setup features:
- Agent name, team, and role selection.
- Access-code check before joining protected sessions.
- Role cards showing each role fantasy.
- Readiness checks tied to enabled mission packs and organizer markers.
- Back navigation to setup.

### Mission Control

Mission Control is the main live operations screen.

Current Mission Control features:
- Session code and join link.
- Host, Field, and Radar view modes.
- Mission map with players, objectives, threats, routes, and custom markers.
- Map zoom and layer controls.
- Team scoring and mission recap.
- Objective cards with progress and behavior notes.
- AI Watch threat panel.
- Chat with channel filters.
- Organizer Event Trail with channel filters.
- Live GM Console for intervention tools.
- Organizer moderation and session import/export tools.

### Field Kit

Field Kit is the field-agent dashboard.

Current Field Kit features:
- Local agent identity, role, and team.
- Signal and stamina.
- Objective distance and threat distance.
- Proximity cue states with visual pulses, vibration, and short audio pings.
- Coordinate sync status.
- Squad list.
- Device GPS and manual coordinate fallback.
- Agent join verification through the current session access code when required.

### Overview Page

The overview page is the project status board.

Current overview features:
- Build pulse.
- Done, ongoing, upcoming, and R&D sections.
- Current RWL trail synced from `TASK_QUEUE.md`.
- Research and design inputs from R&D notes.
- AI handoff status now lives in `AI_HANDOFF_START_HERE.md`, `SHARED_AI_MEMORY.md`, `AI_COLLABORATION_TASKS.md`, and `BACKUP_AND_RECOVERY.md`.

### Design Lab

The design lab is a separate HTTP page for trying visual directions before changing the main game UI.

Open it at:
`http://127.0.0.1:5186/design-lab.html`

Open option 2 at:
`http://127.0.0.1:5186/design-lab-option2.html`

Open option 3 at:
`http://127.0.0.1:5186/design-lab-option3.html`

Open option 4 at:
`http://127.0.0.1:5186/design-lab-option4.html`

Open the setup-first flow design at:
`http://127.0.0.1:5186/design-flow-setup.html`

Open the role flow design at:
`http://127.0.0.1:5186/design-flow-roles.html`

Open the Mission Control flow design at:
`http://127.0.0.1:5186/design-flow-control.html`

Current design-lab experiment:
- A 1960s-inspired warm pattern background with procedural rounded tiles.
- Animated tile drift, glow, pointer response, haze, scan grid, and route pulses.
- Palette, font mode, speed, glow, drift, and pause controls.
- Font mode experiments for Carousel Poster, Bubble Mod, Operator Mono, and Clean Tactical.
- Mission Control/Radar preview for testing 1960s radar rings, sweep, blips, session cards, and event feed styling.
- Option 2 as a separate page with solid glossy panels, softer rounded Mission Control, candy-style buttons, warmer supporting typography, and heavier poster-style display text.
- Option 3 as a separate page with stronger opaque glossy panel colors from the background palette and a live button-style dropdown for Candy Gloss, Soft Pebble, Mod Switch, and Cream Chrome.
- Option 4 as a separate page with multiple moving background engines, 1960s-inspired font modes, retro CRT/glass radar console, theme-song controls, and a VU meter.
- Flow design pages as separate layout prototypes for the preferred direction: setup first, roles second, Mission Control third, mod-switch buttons, fixed option 3 style fonts, selectable moving background themes including Sunset Grid, Signal Candy, and Night Static with option-3-matched motion, world-map setup staging, compact audio controls, and a reference-style Mission Control dashboard/radar in the same color/font scheme.
- Preview components for mission glass, role cards, map badges, and field cues.
- Navigation back to the main game, overview, and guide.

## Roles

### Drone

The Drone role scouts routes, pings AI Watch threats, and helps the squad avoid jamming arcs.

Tools:
- Scan routes.
- Mark safe corridor.
- Ping AI scout.

### Mechanic

The Mechanic role protects the GPS mesh and restores signal health when the squad is being jammed.

Tools:
- Boost GPS mesh.
- Repair relay.
- Stabilize signal.

### Medic

The Medic role watches stamina, calls regroup pulses, and helps agents recover from danger or exhaustion.

Tools:
- Find nearest agent.
- Call regroup.
- Protect low-signal players.

### Decoder

The Decoder role opens encrypted objective packets and keeps the next coordinates flowing.

Tools:
- Decode cipher.
- Reveal clue.
- Validate intercepted signal.

### Navigator

The Navigator role owns route planning, waypoint order, and proximity guidance.

Tools:
- Set waypoint.
- Measure proximity.
- Guide squad.

### Courier

The Courier role carries objective progress through the final meters and triggers close checkpoints.

Tools:
- Carry key shard.
- Deliver objective.
- Trigger checkpoint.

## Mission Modules

### Cipher Tasks

Encrypted packets reveal location data and push the Decoder into a central coordination role.

### Treasure Hunt

Physical or simulated caches, shards, clue props, and artifact text create object-recovery missions.

### Waypoints

Waypoint chains route agents through relays before extraction opens.

### Voice Relay

Browser speech synthesis can read key comms aloud when available.

## Custom Markers

Organizers can add custom markers during setup.

Marker types:
- Clue: creates a clue objective and can include a riddle, code word, or task.
- Cache: restores squad signal and stamina when resolved.
- Danger: becomes a live hazard zone that jams nearby agents.
- Waypoint: creates a wider navigation checkpoint.
- Extraction: marks the final extraction lane.

Marker states:
- Planned: saved as a draft, not live.
- Armed: active in the mission.
- Complete: resolved or intentionally inactive.

## Organizer Tools

Current organizer tools:
- Session access-code gate for protected joins.
- Trusted host-key indicator for the browser that created the session.
- Lobby visibility controls.
- Roster review.
- Lock/unlock lobby.
- Remove agents.
- Clear inactive remote agents.
- Export, import, and remove shared sessions.
- Event Trail filters.
- GM Console interventions.

GM Console actions:
- Reveal Clue.
- Jam Zone.
- Drop Cache.
- Reroute Extraction.
- Broadcast operator message.

## Multiplayer And Sync

The shared-session server runs locally on port `5186`.

Current backend-backed systems:
- Session persistence in local JSON.
- Active games list.
- Chat append endpoint.
- Player heartbeat endpoint.
- Live coordinate locations endpoint.
- Shared stale/active status.
- Server revision tracking for position-only updates.
- Access-required metadata in active game summaries.

Static fallback:
- `http://127.0.0.1:5185/`
- File/offline mode keeps the tactical grid usable when live map assets are blocked.

## Map And Radar

The prototype uses live Leaflet/OpenStreetMap tiles when available and falls back to custom offline tactical maps when not.

Map layers:
- Street Map: roads, labels, districts.
- Tactical Grid: sectors, scan lanes, threat read.
- Terrain Scan: elevation, water, cover feel.

Both setup and mission maps support zoom controls. File mode avoids blocked OpenStreetMap tile behavior and keeps Radar playable offline.

## Winning And Scoring

Agents complete decoded objectives by getting close enough or advancing progress. Team scoring tracks objective progress, role actions, cache support, threat pressure, and completion state. When all objectives are complete, Signal Lost marks the mission complete and builds a recap.

## Current Prototype Status

The game is playable as a local browser prototype with shared-session support. It is not yet a production online service.

Strong areas:
- Setup flow.
- Role flow.
- Custom markers.
- Shared local multiplayer.
- Field Kit proximity play.
- Organizer live tools.
- Documentation and overview trail.
- Visual theme exploration in the separate design lab.
- Per-browser theme palette selection in the main game.
- Living canvas background patterns for the non-classic game themes.
- Design-lab font and Mission Control/Radar style experiments.
- Separate flow-design pages for reducing interface crowding before promoting layout changes into the main game.
- Multi-AI handoff docs and prepared experiment copies so outside AI work can happen without disturbing the canonical game.

Still in progress:
- Full authenticated organizer/player accounts beyond the current local access-code groundwork.
- Richer locked/private moderation.
- Stronger production backend.
- More polished mobile field-agent UX.
- Promotion of the selected flow-design direction into the live app.
- More mission templates and narrative content.
- Clear merge discipline for work produced in external AI copies.

## R&D Direction

Current R&D direction favors:
- Modern tactical UI with clear operational density.
- Map-first mission authoring.
- Better organizer power tools inspired by live game-master/moderator workflows.
- Field-agent mobile ergonomics.
- Stronger multiplayer/session persistence.
- Accessibility and reduced-motion support.