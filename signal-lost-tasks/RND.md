# Signal Lost — R&D Task Backlog

This file is the R&D team's active task list. When idle, work items are pulled from here automatically.

## Active Sprint

### Ready (Priority Order)
1. **AI Patrol Drone System** — Roaming quadcopters with searchlight cones. Pathfinding between waypoints, spot players = broadcast alert to enemies. Sniper/Hacker counters.
2. **Trap Placement System** — Demolitions role places landmines, tripwires, C4. Scout detects. Visible to own team (team-colored outline).
3. **Noise Radius Visualization** — Walking/running/shooting generates sound circles on map. Enemies in radius see direction indicator.
4. **Environmental Hazard Spawner** — Poison gas zones, EMP fields, random minefields. Spawn logic with safe zones.
5. **Loot Drop Markers** — "?" markers on map at buildings. Random gear spawns. Courier carries 3x capacity.

### In Progress
- ~~Canvas background crash on leaderboard~~ (FIXED)
- ~~Radar overlay on maps~~ (DONE)
- ~~Theme switcher null-safe~~ (DONE)
- ~~Mobile chat layout + button fixes~~ (DONE)
- **AI Drone patrol system** — Building Phase 2 environmental threats

### Pending
6. **Trap Mechanics** — Landmine, tripwire, C4 placement + detection
7. **Noise System** — Sound radius visualization on map
8. **Hazard Spawner** — Gas zones, EMP fields, decoy beacons
9. **Expansion Roles UI** — Sniper, Demolitions, Hacker, Scout, Leader, Engineer, Survivalist panels
10. **Loot System** — Drop markers, inventory, Courier capacity bonus
11. **Game Mode Framework** — Signal Hunt, Convoy, Last Squad Standing skeleton
12. **Score System** — Points for objectives, penalties for FF
13. **Audio System Audit** — Ensure `themeAudio` exists on all pages or design-flow.js handles absence gracefully.
14. **Performance Audit** — Check bundle size, image optimization, JS execution time.
15. **Dark Mode Variant** — A "night ops" theme with darker palette for low-light play.
16. **Multi-Language Support** — Norwegian + English toggle for Oslo playtesting.
17. **Accessibility Pass** — ARIA labels, keyboard navigation, color contrast audit.
18. **Multiplayer Backend** — DEFERRED. WebSocket, rooms, team isolation.

## Bug Backlog
- [ ] Leaflet popups sometimes render off-screen on mobile
- [ ] Radar scan line animation choppy at low frame rates
- [ ] Audio volume slider doesn't sync across pages
- [ ] Test data agents don't update positions in real-time on map

## Completed (Archive)
- ✅ OpenStreetMap on all pages
- ✅ Radar overlay on Mission Control
- ✅ Canvas background fix (null audio crash)
- ✅ 24/7 server with auto-restart
- ✅ Token dashboard page
- ✅ AI vs AI test arena
- ✅ Mobile command center with 7 role panels
- ✅ GPS tracking + maps on all map panels
- ✅ Game Design Document (DESIGN.md)

## R&D Meeting Minutes — 2026-05-03
**Attendees:** Morgan (Command), Kimi Claw (R&D Lead)

**Decisions:**
1. Multiplayer chat DEFERRED to Phase 5. Local demo sufficient for now.
2. Priority: AI threats + environmental hazards for "more action"
3. Expansion roles add depth without networking dependency
4. Game modes testable with AI squads first
5. Phase 2 (AI threats) starts immediately

**Action Items:**
- [IN PROGRESS] AI drone patrol system with pathfinding
- [PENDING] Trap placement + detection mechanics
- [PENDING] Noise radius visualization
- [PENDING] Hazard spawner (gas, EMP, mines)
- [PENDING] Loot drop markers

## R&D Team Rules
1. When idle >60s, auto-start the next Ready task
2. After completing a task, log results to memory/YYYY-MM-DD.md
3. Every 30 min, run AI vs AI match and log bugs found
4. Token budget warning at 80%, hard stop at 95%
5. All changes must preserve 1960s psychedelic design language
