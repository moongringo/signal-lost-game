# Signal Lost — Game Design Document

## Overview
Signal Lost is a **real-world location-based tactical squad game** played on mobile devices. Players take on specialized roles, navigate actual terrain, and complete objectives while managing threats, resources, and team coordination.

## Core Pillars
1. **Real terrain** — The world is your map
2. **Role dependency** — No one player can do everything
3. **High stakes** — Downed players need rescue; resources are limited
4. **Psychedelic sci-fi aesthetic** — 1960s Cold War paranoia meets retro-future tech

---

## Win Conditions

### Signal Hunt (Primary Mode)
- Squad must locate and decode 3 signal beacons scattered across real-world terrain
- Beacons are GPS-tagged and appear only within 100m radius
- After all 3 are decoded, extraction point unlocks
- First squad to extract wins, or highest score when timer expires

### Last Squad Standing (PvPvE)
- Safe zone shrinks every 5 minutes (GPS radius)
- AI patrols + environmental hazards
- Last squad alive wins

### Convoy (Asymmetric)
- Escort team moves vehicle across 2km
- Ambush team sets traps and defends choke points
- Vehicle has HP; Mechanic repairs under fire

---

## Role System (12 Roles)

### Core Squad (Original 7)
| Role | Symbol | Primary Function |
|------|--------|------------------|
| Mission Control | 🎖️ | Strategic oversight, issues directives |
| Navigator | 🧭 | GPS, waypoints, route planning |
| Decoder | 🔓 | Signal decryption, intel analysis |
| Drone Operator | 🛸 | UAV recon, target marking |
| Medic | 🏥 | Triage, revives, supply management |
| Mechanic | 🔧 | Equipment repair, vehicle maintenance |
| Courier | 📦 | Logistics, package delivery, resupply |

### Expansion Roles
| Role | Symbol | Primary Function | Unique Gear |
|------|--------|------------------|-------------|
| **Sniper/Recon** | 🎯 | Overwatch, long-range elimination | Bolt rifle, range finder, ghillie suit |
| **Demolitions** | 💣 | Traps, breaching, area denial | Claymores, C4, remote detonator, mine detector |
| **Hacker/EW** | 💻 | Electronic warfare, signal manipulation | Laptop, signal jammer, frequency scanner |
| **Scout** | 👁️ | Stealth recon, pathfinding, trap detection | Suppressed pistol, thermal binoculars, NVG |
| **Squad Leader** | ⭐ | Coordination, morale, airstrike call | Red smoke, sidearm, tactical radio |
| **Engineer** | 🏗️ | Fortification, heavy repair, auto-turrets | Toolbox, portable turret, welding kit |
| **Survivalist** | 🎒 | Resource gathering, crafting | Machete, crafting kit, water purifier |

**Squad Composition:** 4-6 players per squad. Recommended: 1 Leader, 1 Medic, 1 Navigator, + 2-3 flex roles.

---

## Environmental Hazards & AI Threats

### AI Threats
| Threat | Behavior | Counter |
|--------|----------|---------|
| **Patrol Drone** | Roams set path, red searchlight cone. Spotted = alert broadcast to all enemies in 500m. | Sniper (1 shot), Hacker (hijack), Scout (detect from 200m) |
| **Sniper Nest** | Static AI, red laser visible. 1-shot down. Fires every 8 seconds. | Drone recon spots first. Smoke blocks LoS. Flanking eliminates. |
| **Mortar Team** | Fires on last known position. Warning siren 5s before impact. | Sprint to cover. Navigator predicts impact zones. |
| **Hunter Drone** | Fast, follows spotted players. Cannot be hijacked. | Must be destroyed by Sniper or Engineer turret. |

### Environmental Hazards
| Hazard | Trigger | Effect | Counter |
|--------|---------|--------|---------|
| **Landmine** | Proximity (1m) | Instant down (bleed out in 2min) | Scout detects 5m away. Mechanic disarms. |
| **Tripwire Flashbang** | Tripwire | Blind 10s, loud alert | Scout spots wire. Anyone can cut. |
| **Poison Gas** | Random spawn zone | DoT, zero visibility | Medic gas mask (3 uses). Courier delivers spares. |
| **EMP Field** | Hacker-deployed | Disables drone, fuzzy GPS, garbled chat for 60s | Mechanic signal booster. Hacker counter-hack. |
| **Decoy Beacon** | Enemy-placed | Fake SOS lure into ambush | Decoder verifies signal (takes 30s). |
| **Signal Jammer** | Static objective | Prevents decoding within 100m | Hacker disables or Engineer destroys. |

---

## Communication System

| Channel | Audience | Range | Cooldown |
|---------|----------|-------|----------|
| Squad Comms | Your squad only | Unlimited | None |
| Emergency SOS | Entire squad + map ping | Unlimited | 10 minutes |
| Command Net | Squad Leaders only | Unlimited | None |
| Signal Intercept | Decoder taps enemy (garbled) | Within 200m of enemy | 2 minutes |
| Dead Drop | Physical message at GPS point | Anyone who finds it | — |

**Chat limitations:**
- Text-only (no voice to reduce bandwidth)
- Message queue: max 50 messages, auto-deletes oldest
- SOS cooldown enforced server-side
- Intercepted messages show as `•••EXTRACT•••` with keywords visible

---

## Rules & Mechanics

### Health & Damage
- **Healthy** → 🟢 Full mobility
- **Injured** → 🟡 -30% speed, can't sprint
- **Critical** → 🔴 Bleeding out, 2-minute timer. Medic must revive.
- **Downed** → Spectate mode. Can still chat but can't act.
- **Permadeath per match** — no respawns. Promotes caution.

### Friendly Fire
- **ON** by default
- Adds tension, makes Medic essential
- Accidental TK tracked in post-match stats

### Noise System
| Action | Noise Radius | Duration |
|--------|-------------|----------|
| Walking | 10m | Continuous |
| Running | 30m | Continuous |
| Gunshot | 100m | Instant |
| Vehicle | 150m | Continuous |
| Explosion | 200m | Instant |

Enemies in noise radius see approximate direction (not exact position).

### Stamina
- Sprint drains stamina bar (10 seconds max)
- Regenerates in 15 seconds of walking/standing
- Survivalist energy bars: instant +50% stamina

### Weather Integration
- Real weather API integration
- Rain: quieter movement, foggy maps
- Night: need NVG or flashlight (gives away position)
- Fog: 50% vision reduction, drone range halved

### Loot & Economy
- Players spawn with **basic kit** (pistol, 2 bandages, radio)
- **Loot drops** at buildings, marked on map as "?"
- Courier can carry 3x more loot than other roles
- Heavy weapons require 2 hands — can't use drone while carrying

---

## Scoring System

| Action | Points |
|--------|--------|
| Beacon decoded | +100 |
| Objective captured | +200 |
| Enemy downed | +50 |
| Enemy eliminated | +100 |
| Teammate revived | +75 |
| Trap disarmed | +25 |
| Drone hijacked | +50 |
| Extraction completed | +500 |

**Penalties:**
| Action | Points |
|--------|--------|
| Friendly fire | -50 |
| False SOS | -100 |
| Team member dies | -25 |

---

## Implementation Phases

### Phase 1 — Core Squad (DONE-ish)
- ✅ 7 original roles with UI
- ✅ Maps + GPS tracking
- ✅ Radar overlay
- ✅ Squad chat (local demo)
- ✅ SOS button
- ✅ Theme system + background

### Phase 2 — AI Threats
- [ ] Patrol drone AI with pathfinding
- [ ] Sniper nest placement system
- [ ] Landmine / tripwire placement + detection
- [ ] Poison gas zone spawning
- [ ] EMP jammer mechanics
- [ ] Noise radius visualization on map

### Phase 3 — Expansion Roles
- [ ] Sniper/Recon role + gear
- [ ] Demolitions role + trap placement
- [ ] Hacker/EW role + jamming/hijacking
- [ ] Scout role + thermal vision
- [ ] Squad Leader role + airstrike
- [ ] Engineer role + fortifications
- [ ] Survivalist role + crafting

### Phase 4 — Game Modes
- [ ] Signal Hunt (primary, needs beacon placement)
- [ ] Last Squad Standing (safe zone shrinking)
- [ ] Convoy (vehicle HP, asymmetric teams)
- [ ] Hostage Extraction
- [ ] Zombie Signal (PvE horde)

### Phase 5 — Multiplayer Backend
- [ ] WebSocket server
- [ ] Room/lobby system
- [ ] Team isolation
- [ ] Signal intercept mechanics
- [ ] Leaderboard persistence

### Phase 6 — Polish
- [ ] Real weather API
- [ ] Sound design (themed audio)
- [ ] Accessibility pass
- [ ] Localization (EN/NO)
- [ ] Performance optimization

---

## R&D Meeting Notes

**Next session priorities:**
1. Build AI drone patrol system (Phase 2 starter)
2. Add trap placement mechanics for Demolitions
3. Implement noise radius visualization
4. Create hazard spawn system (gas, EMP, mines)
5. Design loot drop markers on map

**Questions to resolve:**
- Should traps be visible to the team that placed them? (Yes, with team-colored outline)
- Should drone hijacking require the Hacker to be within range of the drone? (Yes, 50m)
- Should friendly fire be toggleable per match? (Yes, in lobby settings)
- How many squads per match? (2-4 squads, 4-6 players each = 8-24 players)

**Notes from brainstorm with Morgan:**
- "Wait with multiplayer chat for now" — Phase 5 deferred
- Environmental hazards + AI threats are priority for "more action"
- Expansion roles add depth without needing networking
- Game modes can be tested with AI squads first
