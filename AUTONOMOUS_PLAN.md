# Signal Lost v2 — Autonomous Development Plan

## Current State
Single-file game (index.html, styles-v2.css, game-v2.js) with:
- Lobby → Setup → Role Selection → Mission → Results flow
- Leaflet OSM map with CartoDB dark tiles
- Fullscreen canvas radar overlay
- 7 roles with abilities and cooldowns
- AI threats with patrol/hunt behavior
- Team score tracking (North vs South)
- Sound effects (Web Audio API)
- Mobile-responsive UI with bottom drawer
- GPS integration via watchPosition
- Extraction countdown sequence
- Self-signed HTTPS on port 4434

## Development Approach

**CRITICAL RULE: Each Kimi run must make TARGETED EDITS only.** Never rewrite the entire game-v2.js. Identify the specific functions or sections to modify and use `patch` or targeted `write_file` to change only those parts. After each change, run `node --check game-v2.js` to verify syntax.

## Enhancement Backlog (Priority Order)

### Phase 1 — Core Fixes & Missing Features
- [x] **1.1 Squad Location History Trail** — Draw a fading trail line behind each squad member on the map. Add this as a new module or extend the render loop. Each team member's last 20 positions form a polyline that fades from opaque (latest) to transparent (oldest).
- [x] **1.2 Proximity Warning Refinement** — The threat vignette exists but needs refinement: add directional indicator (red glow from threat direction), audio pulse that speeds up as threat gets closer.
- [x] **1.3 Join Code UX** — Better error messages when entering invalid join codes. Show typing validation (auto-uppercase, only allow valid characters), show connecting/joined/failed states.

### Phase 2 — Visual & UX Polish
- [x] **2.1 Splash Screen Polish** — The splash/loading animation exists. Make it smoother — add version number, loading progress bar, keyboard/mouse hint to continue.
- [ ] **2.2 HUD Refinement** — Add role ability hotbar with cooldown visuals (circular progress on each ability icon). Show active effects/buffs next to HUD.
- [ ] **2.3 Map Legend** — Add a small overlay legend showing what markers mean (squad members, threats, objectives, extraction point).
- [ ] **2.4 Animated Extraction Countdown** — The extraction sequence works. Add dramatic clock animation, countdown numbers that pulse faster below 30s.

### Phase 3 — Multiplayer & Social
- [ ] **3.1 Game Server Script** — Create `server.js` with proper Socket.IO multiplayer. Handle player join/leave, position sync, objective state sync, extraction sync. Use port 4434 for HTTPS, 8081 for HTTP fallback.
- [ ] **3.2 Lobby Chat System** — WebSocket-based text chat in lobby. Show system messages (player joined, player left), team chat during mission.
- [ ] **3.3 Spectator Mode** — Allow non-GPS users to watch a match from overhead map view. Spectators see all player positions, threat positions, objective progress.

### Phase 4 — AI & Game Balance
- [ ] **4.1 Smarter AI Threats** — Threats currently patrol/hunt. Add: threat respawn after being evaded, threat patrol routes that adapt to player positions, threat difficulty scaling based on squad size.
- [ ] **4.2 Objective Variety** — Add more objective types beyond "reach location": data upload (stand in area for X seconds), signal triangulation (visit 3 points in order), asset recovery (carry item to extraction).
- [ ] **4.3 Role Ability Balancing** — Review cooldowns and effects for all 7 roles. Add ability descriptions to role selection screen. Show available/cooldown state in mission HUD.

### Phase 5 — Infrastructure & Quality
- [ ] **5.1 Git-Based Version Control** — Initialize git repo in game directory, set up automated commits after each successful change. Track what changed and why.
- [ ] **5.2 Automated Browser Testing** — Open the game in headless browser after each change, check for console errors, verify all screens render.
- [ ] **5.3 Performance Monitoring** — Add FPS counter to debug overlay, detect frame drops below 30fps, log slow operations.
- [ ] **5.4 Deployment Script** — Create `deploy.sh` that builds, validates, and restarts game servers. Can be triggered by cron.

## Self-Directed Mode (When Backlog is Empty)

When ALL features in the plan are completed, Kimi enters **self-directed mode** for the remaining cycles. In this mode:

1. **Identify something to improve** — play the game mentally (check all 5 screens, features, interactions). What feels incomplete? What could be more polished?
2. **Propose a new feature** — think of something that adds real value: new game mechanics, visual polish, UI improvements, performance optimization, code cleanup, new roles/abilities, map features, sound design, etc.
3. **Implement it** — same rules apply: targeted edits, no full rewrites, verify syntax.
4. **Update this file** — append the new feature to the Enhancement Backlog under a new Phase 6+ section.

Examples of things Kimi could create autonomously:
- New role types with unique abilities
- Weather effects on the map (rain, fog)
- Kill feed / event log overlay
- Tutorial tooltips for new players
- Leaderboard or stats tracking
- Custom map markers / POI system
- Sound design improvements (ambient audio, radio chatter)
- Animated threat indicators
- Mission briefing screen with map overview
- After-action report with statistics

## Implementation Rules for Kimi

1. **NEVER** rewrite game-v2.js from scratch. Always make targeted edits.
2. Before each feature, search the codebase to understand existing patterns.
3. After each change, run `node --check game-v2.js` to verify syntax.
4. Update this file by changing `[ ]` to `[x]` when a feature is done.
5. If in self-directed mode (backlog empty), add new features to the plan as you create them.
6. Never remove existing functionality — only add and refine.
