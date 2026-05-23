# Signal Lost v2 — Game Logic Framework

## Core Concept
Signal Lost is a **multi-squad extraction game** on a **shared persistent map**. Squads deploy with their own objectives, compete indirectly (and sometimes directly), and try to extract. AI threats add environmental pressure. The big map means movement takes time — no rushing across the map in 30 seconds.

---

## 1. Map & Deployments (Instanced + Open World)

**Dual mode:**
- **Quick Match (Instanced):** Squad launches into their own map instance. Only their squad + AI threats. Good for fast games or when no other squads are online.
- **Open World (Persistent):** All squads deploy into the same shared map instance. You'll see other squads' markers, compete for objectives, and maybe run into each other. AI threats scale with total players on the map.

**How it works:**
- Map is divided into **zones** (urban, forest, industrial, river, mountain).
- Zones are large — crossing from one end to the other takes 10-15 minutes on foot.
- Each squad spawns at a **different zone edge** (not the same location).
- The server tracks all squads on the same instance.

**Why both:**
- Quick Match for casual play, practice, or when few friends are online.
- Open World for the real experience — competition, danger, emergent stories.

---

## 2. PvP — Indirect Combat (Not Direct Shooting)

Players cannot directly shoot each other. Combat between squads is **tactical and indirect**:

| Method | What it does | Counterplay |
|--------|-------------|-------------|
| **Sniper** | Set up a sniper position. When enemy squad enters your sightline, you can tag them — they take signal damage (not health), get marked on map, and their position is revealed to all squads for 30s. No kills, just intel + pressure. | Stay in cover, use smoke, move at night, use Decoder to detect sniper positions |
| **Drones** | Deploy a recon drone that follows an enemy squad for 60s. Reveals their position to your squad in real-time. Can also drop audio decoys to lure AI threats toward them. | Mechanic can hack enemy drones, Navigator can spot drone contrails |
| **Traps** | Place proximity traps (audio tripwires, signal jammers, false objective markers). When an enemy squad steps within range, they get: slowed signal (comm blackout for 20s), a fake objective appears on their map wasting their time, or their position gets pinged. | Drone can scan terrain ahead to reveal traps, Courier moves fast enough to trigger-and-evade |
| **Sabotage** | Hack an enemy squad's extraction point — it moves to a different location. Or steal one of their completed caches. | Mission Control can detect sabotage attempts, Mechanic can reinforce your extraction point |

**No direct kills.** The goal is intel advantage, time wasting, and disruption — not elimination. You "win" by extracting before the other squad, not by wiping them out.

---

## 3. Squad Structure — 1 Squad or 2 Teams

A squad can be organized in two ways:

### Option A: Single Team Squad (Co-op)
- All players on the same team, sharing the same squad name.
- All work together toward shared objectives.
- Best for 1-4 players.
- Example: Squad "Vanguard" — 4 players, all on Team Vanguard.

### Option B: Two-Team Squad (Internal Competition)
- The squad splits into two internal teams with different names.
- Each team has their own set of objectives on the same map.
- They share a game code but compete against each other for extraction.
- Best for 4-8 players.
- Example: Squad "AQUA-RADAR-42" — Team "Vanguard" (3 players) vs Team "Reaper" (3 players).

**On the join screen:**
- Host creates the squad and picks: "Co-op Squad" (1 team) or "Competitive Squad" (2 teams).
- If 2 teams: host names Team A, then players pick which team to join.
- If 1 team: all players are on the same team.

**In Open World:**
- If your squad has 2 teams, you're still one "squad" in the world.
- Other squads see you as one squad — they don't know you're competing internally.

---

## 4. AI Threats — Patrol, Hunt, Escape

### Types of AI Threats

| Threat | Origin | Why They're There | How They Behave |
|--------|--------|-------------------|-----------------|
| **Patrol Drone** | Deployed from static **Drone Bays** scattered across the map | Automated perimeter security — runs a fixed route between checkpoints | Slow, predictable route, visually scans. If it spots you, it pings your last known position to nearby threats |
| **Ground Sentry** | Stationary units at **Infrastructure Points** (bridges, power stations, relay towers) | Guards key infrastructure. Doesn't move. | Scans 150m radius. Tags you with a "SIGNAL LOST" debuff — your position blips on the map every 10s for 30s |
| **Hunt Drone** | Launched from **Active Radar Towers** (marked on map) | Interceptor unit — deploys when a patrol drone or sentry detects you | Fast, follows your last pinged position for 2 minutes, then returns to base. Can be outrun or jammed |
| **Static Turret** | Around **High-Value Zones** (cache locations, extraction points) | Point defense. Protects valuable assets. | Fires suppression rounds in a 100m arc. Slows movement, damages signal strength. Can be disabled by Mechanic |

### How AI Threats Cooperate (Local Zone Network)

AI threats cooperate **within the same zone only**. They don't have a global command center — they're all part of the same defense grid, but each zone is its own sub-network.

**Why they cooperate:** They share the same communication protocol. When one detects something, it broadcasts to nearby units. But it's more like a security alarm system, not an intelligent squad.

**Local Awareness Only:**
- If a patrol drone spots you in **Industrial Zone**, it tells other threats in Industrial Zone only
- It does NOT tell threats in Forest Zone or Urban Zone
- Reason: old automated systems, limited radio range, no central command

**Tiered Response (within zone):**

| Step | What happens | Who acts |
|------|-------------|----------|
| 1. Detection | Patrol drone visually spots you | That drone only |
| 2. Alert | Drone pings your position to zone network | All threats in zone get "TARGET @ coordinates" |
| 3. Investigation | Sentries increase scan radius (+50m), other patrol drones adjust routes toward your last position | Zone threats only |
| 4. Pursuit | Radar Tower launches Hunt Drone if available | Tower in same zone only |
| 5. Loss | You escape / break LoS for 15s | All threats in zone return to normal |
| 6. Cooldown | Same zone has reduced sensitivity for 120s (false alarm cooldown) | Entire zone |

**Cross-Zone Coordination (Limited):**
- Only happens if a squad crosses a zone boundary while being pursued
- The pursuing drone **hands off** to the next zone's network
- If the next zone's network already has active alarms, handoff fails (drone returns)
- **Exception:** Radar Towers have long-range antennas and can launch Hunt Drones to adjacent zones — but it takes 60s for the drone to arrive

**Practical Effect:**
- Trigger alarm in Industrial → whole Industrial Zone becomes dangerous for 2 min, but Forest stays safe
- Run from Industrial to Forest → Hunt Drone follows for its 2-min tether, but Forest Zone's native threats don't know about you
- Two squads in same zone → share the same threat network. Squad A's alarm becomes Squad B's problem.
- Radar Towers are strategic targets — disable them to create a safe region

### Player Escape Logic
- Break line of sight (buildings, forest, terrain) → AI loses pursuit in 15s
- Outrun for 60s → drone gives up, returns to route
- Use role ability (Decoder signal cloak, Mechanic EMP burst) → instant break
- Run into another squad's zone → AI may switch targets to closer squad

### Spawning Logic (Never On Top of Players)
1. Scan map for all Drone Bays, Radar Towers, Infrastructure Points, High-Value Zones
2. Activate threats in zones that are **not near player spawns** (minimum 400m)
3. Remaining threats activate when a player enters their zone
4. Total threat count: 60% minimum (even solo), scaling up to 100% with more squads
5. Threat density per zone stays constant — more squads doesn't mean more threats in the same zone

---

## 5. Mechanic — Hacking Radar Towers

The Mechanic has a unique ability: **hack a Radar Tower** and turn it against another squad.

### How It Works
1. Mechanic locates a Radar Tower on the map (they're marked, visible to all)
2. Approaches within 50m — hacking prompt appears
3. Hacking takes 15 seconds (must stand still, interact prompt visible to nearby squad members)
4. If interrupted (hit by trap, detected by patrol, damaged) — hack fails, 60s cooldown before retry

### What the Hack Does
Once hacked, the Mechanic chooses one of three effects for the next 3 minutes:

| Effect | What happens | Cost |
|--------|-------------|------|
| **Redirect Drones** | All patrol drones and Hunt Drones from this tower prioritize the TARGET squad instead of your squad. AI literally ignores you and hunts them. Works best if the target squad is in the same zone. | 1 use, 5 min cooldown after |
| **Squad Scan** | The tower reveals the TARGET squad's position on your map for 60s. They know they're scanned (warning: "SIGNAL INTERCEPTED"). | 1 use, 3 min cooldown after |
| **Disable Zone** | Disable the tower entirely for 5 minutes. No drones launch from this zone. Safe passage for everyone, including enemy squads. | 1 use, 3 min cooldown after |

### Counterplay
- **Target squad gets warned:** "Radar Tower [name] has been compromised"
- **Mission Control** can detect the hack in progress and ping the tower location to all squads
- **Another Mechanic** can counter-hack the tower to restore it (takes 10 seconds)
- **Destroy the tower** permanently (any player, takes 30s, makes noise = attracts AI)

### Why This Works
- The Mechanic is exposed during the hack (standing still for 15s in a dangerous position)
- The hack has counterplay from other squads
- It creates dynamic objectives: "protect our Radar Tower" vs "hack theirs"

---

## 6. Custom Missions — Anywhere in the World

Players can create custom missions anywhere on the map, not just at predefined locations.

### How It Works
On the setup screen, there's a **Custom Mission** tab next to the standard options:

1. **Pick a real location** — use the Leaflet map to drop a pin anywhere in the world (your current GPS coordinates, a specific city, or click on the map)
2. **Name the mission** — free text, e.g. "Downtown Extraction", "Bridge Crossing"
3. **Pick mission type** (see below)
4. **Set parameters** (duration, difficulty, squad size constraints)
5. **Launch** — the server generates the mission around that location

### What Gets Generated
- Threat patrol routes around the pin location
- Objective locations (caches, upload points, waypoints) within a 2km radius
- Extraction point on the opposite side of the zone
- Zone boundaries auto-generated from real terrain (roads, rivers, buildings)

### Mission Types

| Type | Description | Duration | Best for |
|------|-------------|----------|----------|
| **Extraction** | Standard: reach objectives, extract | 30-60 min | Default, balanced |
| **Data Heist** | Steal intel from a fortified location. One big objective instead of many small ones. More turrets, fewer patrols. | 20-30 min | Quick games, high risk/reward |
| **Search & Rescue** | Find and extract a downed asset (NPC beacon). The asset moves periodically. AI pursues you more aggressively. | 40-50 min | Teamwork focus |
| **Scout Run** | Mark 5 locations by getting within 100m of each. No extraction needed — finish when all 5 marked. Short, intense, low commitment. | 10-15 min | Learning the map, quick sessions |
| **Night Op** | Same as Extraction but with reduced visibility. AI has shorter detection range. Your GPS signal degrades faster in the dark. | 30-40 min | Stealth gameplay |
| **Race** | Squads start at opposite ends of the zone. First to collect 3 caches and extract wins. Pure competition. | 20-30 min | Competitive squads |
| **Holdout** | Defend a position for 15 minutes while waves of AI approach. Extract when timer hits zero. No PvP — pure PvE. | 20-25 min | Co-op squads |
| **Free Roam** | No objectives, no timer, no extraction needed. Explore the map, test equipment, practice. AI still patrols but doesn't hunt. | Unlimited | Practice, exploration |

### Duration Logic
- Timer is set by the host (15-90 min range)
- Mission type has a default duration but can be overridden
- If timer expires: forced extraction begins (2 min countdown), all squads must extract or lose
- Custom missions default to 45 min (middle ground)

### Why Custom Missions Matter
- **Anywhere in the world** — your hometown, a famous landmark, your current GPS location
- GPS mode: deploy at your real location, objectives generated around you
- Creates personal, memorable experiences — "remember when we extracted from Central Park?"
- Allows competitive play in familiar locations
- The real map is your playground, not a virtual level

---

## 7. Win Conditions — Both Race + Points

Squads can win by:

### Extraction Race (Primary)
- First squad to reach their extraction point and complete the extraction sequence wins.
- Extraction takes 30 seconds to complete (stand in zone, defend).
- If interrupted, extraction fails and must restart.
- Timer: configured per mission (default 45 min). If no one extracts, all squads are extracted by force (no winner).

### Points System (Secondary / Tiebreaker)
- Points earned during mission:
  - Complete an objective: +100
  - Secure a cache: +50
  - Sabotage an enemy extraction attempt: +75
  - Evade a hunt drone: +25
  - Extract successfully: +200
  - First to extract: +150 bonus

- If two squads extract at the same time, points decide the winner.
- Points also feed into leaderboards and season rankings.

---

## 8. Squad Alliances (Optional)

Squads can form **temporary alliances**:
- Share extraction points.
- Share objective locations on map.
- Cannot attack each other (even indirectly) while allied.
- Alliance breaks automatically if one squad extracts (the other is on their own).

**Cost:** Must be in the same Open World instance. Alliances are announced to all squads on the map.

---

## 9. Flow Summary

```
Lobby
  → Pick squad name
  → Pick mode: Quick Match / Open World
  → Pick structure: Co-op / Competitive
  → Pick mission: Standard / Custom (choose location + type + duration)
  → Join / Launch
    → Deploy on map
      → Complete objectives
      → Avoid AI threats
      → Compete with other squads (indirect)
      → Extract first to win
```

**For the host:**
1. Enter name, callsign, squad name
2. Pick game mode: Quick Match (single squad) or Open World (multi-squad)
3. Pick squad structure: Co-op (1 team) or Competitive (2 teams)
4. If competitive: name Team A, Team B
5. Pick mission: Standard or Custom
6. If custom: drop pin on map, name mission, pick type, set duration
7. Launch — game code generated, friends can join
8. Squad picks roles, deploys to map
9. Mission in progress — objectives, AI, competition
10. Extract before timer runs out
