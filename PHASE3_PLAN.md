# Signal Lost v2 — Phase 3: Gameplay, Radar, Mobile & Join Flow

## Priority Tasks

### 1. AI Threat Behavior (game-v2.js)
Currently threats exist but don't move autonomously. Add:
- `simulateThreats()` function called every 2.5s via the mission loop
- Each threat orbits the city center at its own speed and angle
- When a threat is within radius of a player → jams them (reduce signal by 8, stamina by 4)
- Show "AI Watch" chat message when a player gets jammed
- Threat patrols drift back toward city center if they go too far (>1500m)
- On the Leaflet map: threat dots pulse red, get larger when alert
- On the radar: threats show as red blips with pulse animation

### 2. Team Score Tracking (game-v2.js)
- Score is tracked per team (North vs South)
- When a player collects a beacon → team gets points (based on beacon type)
- Score display in the results screen shows team breakdown
- Score events logged to chat ("North +140pts for Decode relay A17")
- Winning team highlighted in results

### 3. Player Join Flow via Code (game-v2.js + index.html)
- The "Join a Game" flow on the lobby needs to work end-to-end:
  - Enter a join code (e.g. "FIELD-RADAR-46")
  - Enter name + callsign
  - Click "Link Up"
  - Goes directly to ROLE SELECTION screen (skip setup)
  - Player can pick a role, then when "Ready" goes to existing mission
- Add code validation: 2-4 uppercase words separated by hyphens, or alphanumeric
- If the game is private (not public), show "Access code required" in the join card
- Store join code in localStorage so returning players see their last code

### 4. Full-Screen Radar Mode (index.html + styles-v2.css + game-v2.js)
Add a toggle that makes the radar canvas cover the entire screen:
- Add a button in the mission HUD with an icon (like 📡 or a radar icon)
- When tapped, the radar canvas resizes to fill the entire screen (fullscreen overlay)
- The radar `range` expands from 200m to 500m in fullscreen mode
- Blips scale proportionally
- Tap again or press Escape to return to mini-radar mode
- CSS transition for smooth resize animation
- Add a "FULL MAP" / "MINI" label indicator

Implementation:
```javascript
RadarModule.toggleFullscreen = function() {
  this.fullscreen = !this.fullscreen;
  const canvas = this.canvas;
  if (this.fullscreen) {
    canvas.classList.add('radar-fullscreen');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.range = 500;
  } else {
    canvas.classList.remove('radar-fullscreen');
    canvas.width = 160;
    canvas.height = 160;
    this.range = 200;
  }
  // Center point changes based on mode
};
```

CSS:
```css
#missionRadar.radar-fullscreen {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
  border-radius: 0;
  border: none;
}
```

### 5. Sound Effects (game-v2.js)
Add simple Web Audio API sound effects:
- **Beacon collected**: short ascending tone (2 notes)
- **Threat detected**: low warning pulse (sine wave, 200Hz, 0.2s)
- **Mission start**: short fanfare (3 ascending notes)
- **Extraction ready**: steady tone
- **Timer warning** (last 60 seconds): tick every second
- **Mission complete**: victory sound (ascending arpeggio)

Sound utility:
```javascript
const SoundFX = {
  ctx: null,
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  play(freq, duration, type = 'sine') {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  beaconCollected() { this.play(523, 0.1); setTimeout(() => this.play(659, 0.1), 100); },
  threatDetected() { this.play(200, 0.2, 'sawtooth'); },
  missionStart() { this.play(523, 0.15); setTimeout(() => this.play(659, 0.15), 150); setTimeout(() => this.play(784, 0.2), 300); },
  extractionReady() { this.play(440, 0.3, 'triangle'); },
  timerTick() { this.play(1000, 0.05, 'square'); },
  missionComplete() { this.play(523, 0.1); setTimeout(() => this.play(659, 0.1), 100); setTimeout(() => this.play(784, 0.1), 200); setTimeout(() => this.play(1047, 0.3), 350); }
};
```

Wire it up:
- `SoundFX.init()` on first user interaction (button click)
- Call sounds at appropriate mission events

### 6. Mobile Interface Polish (styles-v2.css + game-v2.js)
- Mission: panel drawer bottom sheet slides up with smooth animation
- Radar toggle: icon changed to show fullscreen/mini state
- Touch targets: all buttons min 44px
- Floating GPS button: 56px circle, bottom-right, shadow
- Panel tabs: swipeable horizontally on mobile (touch drag)
- Setup: sticky Launch Mission button, map adjusts
- Roles: 2-column grid on mobile, compact cards
- Results: full-width sticky Play Again button

## Files to Modify
- index.html — Add radar fullscreen toggle button, sound init
- styles-v2.css — Fullscreen radar CSS, mobile polish, sound button
- game-v2.js — All the above features

## Do NOT Change
- The lobby layout (Host/Join cards) — keep exactly as designed
- The setup card styles — keep current layout
- The role selection card styles — keep current design
- Theme system — must keep working (Classic/Sunset/Signal/Night)
