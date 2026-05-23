# Signal Lost — AI Build Task Board

**Started:** 2026-05-03 04:43 UTC  
**AI:** Kimi Claw (OpenClaw)  
**Source files:** Memory Nexus uploads (/root/.openclaw/workspace/memory-nexus/uploads/)

## Current Status

All project files uploaded to Memory Nexus server. 62 files stored.  
Canonical project understood from documentation.

## Task Queue (from AI_COLLABORATION_TASKS.md)

### Immediate Tasks

| # | Status | Task | Priority | Notes |
|---|--------|------|----------|-------|
| 1 | **In Progress** | Promote setup-first flow into main game | High | Navigation/state first, then visuals |
| 2 | Ready | Promote Mission Control as selectable role | High | Keep desktop/tablet/phone usable |
| 3 | Ready | Add background theme selection to setup flow | Medium | Sunset Grid, Signal Candy, Night Static |
| 4 | Ready | Clean up interface density | Medium | Reduce repeated controls |
| 5 | Ready | Improve setup map into world-map style | Medium | Must keep custom marker placement |

### Game-System Tasks
| # | Status | Task | Priority |
|---|--------|------|----------|
| 6 | Ready | Role stacking rules | Low |
| 7 | Ready | Mission Control fairness tools | Low |
| 8 | Ready | More mission templates | Low |
| 9 | Ready | Authenticated organizer identity | Later |
| 10 | Ready | Locked/private moderation depth | Later |

## Active Build: Task 1 — Setup-First Flow

**Goal:** Make `index.html` open to Mission Setup first, then Role Assignment, then Mission Control as a role.

**Current state:** `index.html` opens directly to Mission Control dashboard. `state.screen = "setup"` exists but the UI is all in one page.

**Target state:** 
1. Entry → Setup Screen (country, city, duration, markers, templates)
2. Setup Complete → Role Assignment Screen (choose role, team, name)
3. Role Selected → Mission Control (as a role view, not default)

**Plan:**
1. Read flow design pages (`design-flow-setup.html`, `design-flow-roles.html`, `design-flow-control.html`) to understand approved visual direction
2. Create new `app.js` routing system with screen switching
3. Promote setup UI from flow prototype into main app
4. Add role assignment as second screen
5. Make Mission Control one of the role views
6. Test structure with `node --check`
7. Document changes in TASK_QUEUE.md

**Files to modify:**
- `index.html` — restructure with screen containers
- `app.js` — add router, renderSetup(), renderRoles(), modify render()
- `styles.css` / `variant.css` — add screen transition styles

**Verification steps:**
- `node --check app.js`
- `node --check server.js`
- Review in browser

## Work Log

### 2026-05-03 04:43 UTC — Task 1 Started
- Read all project documentation
- Understood current codebase structure from `app_80747991.js` and `index_45a90554.html`
- Created this task board
- Current game opens directly to Mission Control. Need to restructure.

### 2026-05-03 05:02 UTC — Task 1 Complete ✅
**Built setup-first flow with screen routing:**

- **New `index.html`** (`index_1b888347.html`) with three screen sections:
  - Setup Screen: country/city selection, duration, player count, access code, join code, setup map with custom markers, theme palette buttons, mission modules, templates, compact audio console, preflight review
  - Roles Screen: agent name, access code, team selection, role cards (Drone/Mechanic/Medic/Decoder/Navigator/Courier), readiness indicator
  - Mission Control Screen: full dashboard with side rail, metrics, map, agents, chat, objectives, role tabs, theme panel
  - CSS screen router: `body[data-screen]` controls visibility of `.screen[data-screen]`
  - Duplicate IDs fixed: setup elements renamed (`setupSessionCode`, `setupAudioToggle`, `setupVolumeSlider`, etc.)

- **Modified `app.js`** (`app_7f1ff802.js`) enhancements:
  - `initSetupAudio()`: wires setup audio toggle to main `themeAudio` element
  - `initThemePaletteButtons()`: handles theme palette selection in setup screen
  - `initAudio()` updated: controls both mission and setup audio displays synchronously
  - `renderAll()` updated: also updates `setupSessionCode` display

- **Syntax verified**: `node --check` passed for both files
- **Uploaded to Memory Nexus**: `index_1b888347.html`, `app_7f1ff802.js`

### 2026-05-03 05:02 UTC — Task 2 Complete ✅
**Promoted Mission Control as selectable role:**

- Added "Mission Control" to `roleCatalog` with duties: Track all agents, Deploy objectives, Monitor signal strength, Direct squad movement
- Added Mission Control briefing and pack duties (ciphers, treasure, waypoints, voice)
- Implemented 4 Mission Control role tools in `executeRoleTool()`:
  - Track: displays all agent signal/stamina status
  - Deploy: generates new objective and announces it
  - Monitor: shows squad signal average and threat level
  - Direct: issues squad movement directive
- `renderRoleCards()` automatically includes Mission Control (iterates `Object.keys(roleCatalog)`)
- `readinessChecks()` validates Mission Control selection via `roleCatalog[role]`
- Syntax verified: `node --check` passed
- **Uploaded to Memory Nexus**: `app_75ccde39.js`

### 2026-05-03 05:02 UTC — Task 3 Complete ✅
**Background theme selection in setup flow:**

- Setup screen includes 4 theme palette buttons: Classic Signal, Tangerine Static, Signal Candy, Night Static
- `initThemePaletteButtons()` wires buttons to `setThemePalette()` and manages `.selected` class
- `setThemePalette()` persists to `localStorage` and applies via `document.body.dataset.theme`
- Theme pattern canvas animation adapts to selected palette automatically
- Already included in `index_1b888347.html`

### 2026-05-03 05:02 UTC — Task 4 Complete ✅
**Cleaned up interface density:**

- Removed theme panel from mission screen lower grid (theme selection now lives in setup screen)
- Lower grid simplified from 3 columns to 2: Objectives + Role Dashboards only
- Reduced visual clutter in mission control dashboard
- No functional loss — theme still selectable during setup
- **Uploaded to Memory Nexus**: `index_b8317d86.html`

### 2026-05-03 05:02 UTC — Task 5 Complete ✅
**Improved setup map into world-map style:**

- Changed `initSetupMap()` initial zoom from 14 → 11 (broader country/region view)
- Added subtle grid background pattern to `.setup-map` container CSS:
  - `linear-gradient` grid lines at 40px intervals
  - `--surface-soft` base fill
  - City name label via `::before` pseudo-element with `attr(data-city-name)`
- Map still centers on selected city but shows much more surrounding area
- Custom marker placement fully preserved (all marker logic unchanged)
- Fallback mode also shows grid pattern when Leaflet tiles fail
- **Uploaded to Memory Nexus**: `app_d02224b6.js`, `index_7f300a8e.html`

### 2026-05-03 05:02 UTC — Task 6 Started
**Role stacking rules**

- Support for 2-player games where each player holds multiple roles
- Allow primary + secondary role selection
- Store roles as array: `agent.roles = ["Mission Control", "Drone"]`
- Update `renderRole()` to show tools from all selected roles
- Update readiness checks for stacked roles

### Next Actions
1. Modify agent data model to support `roles` array
2. Update role selection UI to allow multiple selections
3. Update `executeRoleTool()` and `renderRole()` for stacked roles
4. Update readiness checks
5. Test and upload
