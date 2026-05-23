# Signal Lost — Modern Tactical Design System

## R&D Synthesis from 50 Design Variants

After creating 50 variant explorations across radar, loading, and chat interfaces, this document distills the best ideas into a coherent **modern tactical design language** for Signal Lost v2.

---

## Design Philosophy

> **"Tactical clarity, not visual noise."**

Every pixel serves the operator. The interface feels like military-grade equipment: purpose-built, information-dense, but never cluttered. Inspired by: Ghost Recon Breakpoint HUD, Modern Warfare UI, ARMA 3's tactical interface, and real military comms systems.

### Core Principles

1. **Information Hierarchy** — The most critical info is the most visible
2. **Dark Military** — Deep charcoal (#0a0a0f), tactical green (#00ff88), alert red (#ff3344), comms blue (#4488ff)
3. **Glow with Purpose** — Light/emission only to draw attention to critical elements
4. **Touch-First** — Large hit targets, thumb-zone placement, gesture-friendly
5. **Device Agnostic** — Same design language on phone, tablet, or desktop

---

## RADAR — Unified Tactical View

**Winner concept:** Blend of isometric 3D (v2) + AR overlay (v13) + command view (v11)

### Layout
```
┌─────────────────────────────────────────────┐
│  ⬤ MISSION TIME  │  ⬤ 6/8 OPERATIVES  ⬤ GPS│
├─────────────────────────────────────────────┤
│                                             │
│              TACTICAL MAP                    │
│     (3D isometric, 60% opacity)              │
│     ● Ally dots  ● Enemy dots               │
│     ■ Buildings   ▲ Objectives              │
│     Grid overlay with distance scale         │
│                                             │
├─────────────────────────────────────────────┤
│  [MINIMAP]     [TEAM STATUS]     [COMMS]    │
└─────────────────────────────────────────────┘
```

### Key Features
- 3D isometric camera (45°), can switch to 2D top-down
- Player dots with health ring around them (color shifts green→yellow→red)
- Enemy dots with directional movement trail (2s history)
- Objective markers with distance and bearing text
- Terrain elevation shown via subtle contour lines
- Pinch to zoom, two-finger rotate
- Semi-transparent, overlaid on game viewport

### Color System
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Ally | Tactical Green | `#00ff88` | Team members |
| Enemy | Alert Red | `#ff3344` | Hostiles |
| Objective | Comms Blue | `#4488ff` | Mission targets |
| Extraction | Amber | `#ffaa00` | Evac point |
| Terrain | Dim Green | `#0d1a10` | Map ground |
| Grid | Subtle Line | `#1a2a1a` | Navigation |

---

## LOADING — Pre-Mission Briefing

**Winner concept:** Blend of military briefing (v5) + squad assembly (v13) + map generation (v12)

### Flow
1. **CONNECTING** — Secure link animation (1s)
2. **AUTHENTICATING** — Operator ID verification (1s)
3. **BRIEFING** — Mission details type in (2s):
   - OP NAME: [dynamic]
   - LOCATION: [dynamic]
   - THREAT LEVEL: [dynamic]
   - OBJECTIVE: [dynamic]
   - TEAM: [6 OPERATIVES]
4. **LOADING** — Tactical map generates with progress bar (3s)
5. **READY** — "MISSION READY" + pulse + proceed button

### Visual
- Clean briefing dossier aesthetic
- Blurred battlefield photo background (CSS gradient simulation)
- Text types out with cursor blink
- Progress bar is a thin glowing line that fills bottom-to-top
- Each phase has a distinct visual transition
- At 100%: brief camera shake + green flash

---

## CHAT — Tactical Comms System

**Winner concept:** Blend of command center terminal (v4) + radio comms (v1) + modern bubbles (v6)

### Layout
```
┌─────────────────────────────────────────┐
│  ◄ ⬤ TACTICAL COMMS    🔒 ENCRYPTED   │
│─────────────────────────────────────────│
│                                         │
│ [ALL][TEAM][SQUAD][SYSTEM]              │
│─────────────────────────────────────────│
│ 08:42 GHOST │ Enemy spotted sector 7   │
│ 08:43 VIPER │ Copy. Moving to assist.  │
│ 08:44 ⚠ SYSTEM │ Objective A captured │
│ 08:45 RAVEN │ Need backup, taking fire │
│                                         │
│─────────────────────────────────────────│
│ [CMD] │ ________________________ [SEND] │
└─────────────────────────────────────────┘
```

### Key Features
- Top bar: back button, channel name, encryption status
- Tab navigation: ALL / TEAM / SQUAD / SYSTEM
- Each message: timestamp (compact), sender tag with color, message text
- System messages get a warning icon and amber color
- Squad status panel collapsible on right side
- Command wheel with 12 pre-set tactical commands
- Audio visualizer when someone is speaking
- Compact timestamp: only show full time on first message, then ":42" style

### Message Format
```
[08:42] GHOST │ Enemy spotted sector 7
[08:43] VIPER │ Copy. Moving to assist.
[08:44] ⚠ SYS │ Objective A captured by allies
```

### Quick Commands
| Category | Commands |
|----------|----------|
| Combat | ENEMY SPOTTED, NEED BACKUP, ENEMY DOWN, SUPPRESSING |
| Movement | MOVING TO OBJ, COVER ME, REGROUP, FALL BACK |
| Status | AMMO LOW, RELOADING, I'M HIT, REVIVE ME |
| Tactical | WATCH FLANK, ON MY WAY, HOLD POSITION, AREA CLEAR |

---

## Implementation Notes

### File Structure
```
test-pages/
  modern-radar.html    — Production-ready tactical radar
  modern-loading.html  — Production-ready loading sequence
  modern-chat.html     — Production-ready comms system
  index.html           — Browse all 50 variants + modern designs
```

### Technology
- All procedural — no external assets
- Canvas 2D for radar (performance on mobile)
- CSS animations for loading
- Vanilla JS for chat (no frameworks)
- Three.js only for radar 3D toggle (optional enhancement)

### Mobile Performance Budget
- Radar: < 100 draw calls per frame
- Loading: < 50ms frame time
- Chat: < 30 DOM nodes visible at once
- Total: 60fps on mid-range Android

---

**R&D Document v1.0**
**2026-05-18**
