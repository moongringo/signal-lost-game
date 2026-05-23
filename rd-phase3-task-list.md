# Phase 3 — AI Behavior, Score System, Join Flow, Radar, Sound & Mobile

**Signal Lost v2** — 8,117-line monolithic game-v2.js
**Current state:** Phase 2 complete (Dynamic Mission Events, 3 new objective types, Team Loadout Screen, Fog of War fix). Deployable Drones are next but R&D recommends moving on to Phase 3 features that provide more gameplay value per line of code.

## Priority Ranking

| # | Feature | Effort | Impact | Lines |
|---|---------|--------|--------|-------|
| 1 | AI Threat Behavior | Medium | 5/5 | ~200-250 |
| 2 | Team Score Tracking | Small | 4/5 | ~100 |
| 3 | Full-Screen Radar Mode | Small | 4/5 | ~80 |
| 4 | Sound Effects (Web Audio) | Small | 4/5 | ~100 |
| 5 | Mobile Panel Drawers | Medium | 5/5 | ~200 |
| 6 | Deployable Drones (3 types) | Large | 5/5 | ~300-400 |

## Task 1 — AI Threat Behavior

Threats exist but need autonomous movement and proper jamming mechanics.

### Implementation
- Add `simulateThreats()` called every 2.5s in the mission loop
- Each threat orbits city center at its own speed/angle
- When threat is within radius of a player: jam them (reduce signal by 8, stamina by 4)
- Show "AI Watch" chat message when a player gets jammed
- Threat patrols drift back toward center if >1500m away
- Leaflet map: threat dots pulse red, get larger when alert
- Radar: threats show as red blips with pulse animation

### Where to insert (game-v2.js)
- After ~line 5300 in simulateWorld() tick loop: add `simulateThreats()`
- Add function after ~line 320 (with other simulation helpers)

## Task 2 — Team Score Tracking

Score tracked per team (North vs South), displayed in results.

### Implementation
- Score per team in state: `{ north: 0, south: 0 }`
- Collecting beacons gives team points based on beacon type
- Score display in results screen shows team breakdown
- Score events logged to chat ("North +140pts for Decode relay A17")
- Winning team highlighted in results

## Task 3 — Full-Screen Radar Mode

Toggle that makes the radar canvas cover the entire screen.

### Implementation
- Button in mission HUD with radar icon
- Canvas resizes to fill screen (fullscreen overlay)
- Range expands from 200m to 500m in fullscreen
- Blips scale proportionally
- Escape returns to mini-radar mode
- CSS transition for smooth resize
- "FULL MAP" / "MINI" label indicator

### Files: game-v2.js, styles-v2.css, index.html

## Task 4 — Sound Effects (Web Audio)

### Sounds needed
- Beacon collected: short ascending tone (2 notes)
- Threat detected: low warning pulse (200Hz, 0.2s sine)
- Mission start: 3 ascending notes
- Extraction ready: steady tone (440Hz triangle)
- Timer warning (last 60s): tick every second
- Mission complete: ascending arpeggio

### Implementation
- `SoundFX` utility with Web Audio API
- No external audio files needed — pure oscillator synthesis
- Init on first user interaction (AudioContext unlock)
- Wire into existing mission event calls

## Task 5 — Mobile Panel Drawers

Bottom sheet panels that slide up on mobile for objectives, comms, player list.

### Implementation
- Panel drawer CSS: fixed bottom, slide-up animation, handle bar
- Touch targets: all buttons min 44px
- Floating GPS button: 56px circle, bottom-right, shadow
- Panel tabs: swipeable horizontally
- Same pattern as the existing mobile HUD

## Task 6 — Deployable Drones (3 Types, Any Role)

**This is carried over from Phase 2 as a stretch goal.** Only implement if all Phase 3 tasks are done.

- Scout Drone: Auto-reveals Fog of War along patrol route for 120s
- Decoy Drone: Attracts nearby threats for 15s
- Shield Drone: Reduces jamming damage by 60% for 30s
- Each player gets 1 drone charge per mission
- UI: drone bar below ability hotbar, map-click deployment

## File Map

| Feature | Primary File | Insert Area |
|---------|-------------|-------------|
| AI Threats | game-v2.js | simulateWorld() loop + new function |
| Score Tracking | game-v2.js | state + results renderer |
| Full-Screen Radar | game-v2.js, styles-v2.css, index.html | RadarModule |
| Sound Effects | game-v2.js | new module + mission hooks |
| Mobile Panels | styles-v2.css, game-v2.js | HUD section |
| Deployable Drones | game-v2.js, styles-v2.css, index.html | new DroneSystem module |

## Execution Order

Build in priority order. After each task:
1. `node --check game-v2.js`
2. `git add -A && git commit -m "feat: [feature name]"`
3. Move to next task

Task 1 (AI Threats) should be done first — it adds the most gameplay value and enables proper threat-based balancing for all other features.
