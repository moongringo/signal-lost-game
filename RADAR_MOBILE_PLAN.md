# Signal Lost v2 — Radar & Mobile Design

## 1. Radar Screen (Mission HUD Overlay)

Add a radar overlay to the mission screen that shows nearby threats, beacons, and squad members relative to the player's position.

**Design:**
- Circular radar display (like a sonar) in the bottom-left corner of the mission screen
- Center dot = player position
- Scan line rotates clockwise (CSS animation)
- Range rings at 25%, 50%, 75%, 100%
- Blips appear for:
  - Beacons (orange dots)
  - Threats (red dots, pulsing)
  - Squad members (team-colored dots)
  - Extraction (green diamond)
- Tap/click the radar to toggle between open and minimized
- When no GPS signal, show "NO SIGNAL" overlay

**Position:** Bottom-left, overlaid on the map, 160px x 160px circular, movable toggle

**Implementation:**
1. Canvas-based radar (fast, no additional dependencies)
2. State: `radarRange: 200` (meters visible radius), `radarOpen: true`
3. Render loop syncs with world simulation tick
4. Player always at center, everything else positioned relative to player heading

## 2. Mobile Interface Redesign

Make every screen work beautifully on a phone screen (375px - 430px wide).

### Lobby (Mobile)
- Cards stack vertically (already done)
- Bigger touch targets: buttons min 48px height
- Keyboard-friendly input order
- Theme picker as swipeable row

### Setup (Mobile)
- Single column layout on mobile
- Map height: 240px on mobile (vs 420px desktop)
- Marker toolbar wraps correctly
- Sliders are full-width, touch-draggable
- "Launch Mission" button sticky at bottom

### Roles (Mobile)
- Role cards in 2-column grid on phone (vs 3-4 columns desktop)
- Compact role card: emoji, name, 1-line duty — tap to expand for full duties
- Roster is a collapsible strip at top

### Mission (Mobile) — THE BIG ONE
- Map fills entire screen
- **HUD bar** at top: timer, signal/stamina, 3 icon buttons (Radar, Panels, GPS)
- **Radar** bottom-left, semi-transparent, toggleable
- **Panel drawer** slides up from bottom when "Panels" tapped:
  - Shows: Objectives | Chat | Role Tools | GPS
  - Swipeable tabs or horizontal scroll
  - Dismiss by tapping map or swiping down
- **GPS button** floating bottom-right (blue circle with crosshair icon)
- **End Mission** button hidden in a menu (long-press or settings icon top-right)

### Results (Mobile)
- Single column, scrollable
- Grade large and centered
- Stats in cards
- Play Again button full-width sticky at bottom

## 3. Implementation Priority

1. Canvas radar on mission screen (high visual impact)
2. Mobile mission layout (map fullscreen, floating buttons, bottom panel drawer)
3. Mobile setup/roles/responsive tweaks
4. Radar blip animations and polish

## 4. Radar Canvas Spec

```javascript
function drawRadar(ctx, cx, cy, radius, range, heading, beacons, threats, agents, extraction) {
  // Background
  ctx.fillStyle = 'rgba(11,15,20,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Range rings
  for (let r = 1; r <= 4; r++) {
    ctx.strokeStyle = r === 4 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, (radius / 4) * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Crosshairs
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
  ctx.stroke();
  
  // Scan line (rotating)
  const angle = (Date.now() / 2000) % (Math.PI * 2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(radius * 1.2, 0);
  ctx.strokeStyle = 'rgba(0,188,212,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Scan wedge gradient
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, 'rgba(0,188,212,0.15)');
  gradient.addColorStop(1, 'rgba(0,188,212,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, -0.3, 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  // Player dot (center)
  ctx.fillStyle = '#00bcd4';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00bcd480';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
  
  // Blips: convert world distance+heading to radar coordinates
  // Scale: range pixels = 200 meters
  // ...
}
```
