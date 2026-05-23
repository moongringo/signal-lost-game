# Signal Lost v2 — Next Cycle Plan (after quota reset)

## Phase 1: R&D — Database & Persistence Design
Design a persistent storage system that handles:
- Player settings (audio, graphics, controls, key rebinds)
- Favorite/default locations (faction, spawn zone preferences)
- Loadout presets and cosmetic selections
- Game progress, stats, match history
- Local multiplayer sync state

Currently the game uses localStorage for scattered things.
The R&D worker should design a unified storage layer.

Tech constraints: Must work client-side (no server DB).
Use: IndexedDB via idb-wrapper or a custom wrapper with localStorage fallback.

## Phase 2: Implement the Database Layer
After R&D produces the plan, a coder worker implements it.

## Phase 3: Dogfood QA — Automated Game Testing
Before you launch the game, a testing session runs:
1. Load the game in browser
2. Click through splash -> lobby
3. Fill in name/callsign
4. Click Host Mission — verify it transitions to setup screen
5. Check console for errors
6. Report any broken features

Run this every cycle until the game launches cleanly.

## Remaining Unbuilt Features
After storage + QA is done, finish these:
- P6-Task6: Cosmetic Items & Customization
- P7-Task7: Multiple Mission Maps
- P7-Task10: Map Editor / Custom Maps
- P8-Task1: Clans / Guilds System
- P8-Task10: Mobile Battery Optimization v2

## Phase 9+ Design
After Phases 5-8 are done:
- Phase 9: Endgame content, World events, Cross-platform
- Phase 11? Whatever the game needs next
