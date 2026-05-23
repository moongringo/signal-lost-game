# Signal Lost v2 — HUD Layout & Visual Design System

## 1. Color Palette

### Primary UI
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0b0f14` | Page background |
| `--bg-elevated` | `#111820` | Cards, panels |
| `--bg-card` | `#141c26` | Elevated cards |
| `--border` | `#1e2a38` | Borders, dividers |
| `--text` | `#dbeafe` | Primary text |
| `--text-dim` | `#8aa3bf` | Secondary text |

### Role Accents
| Role | Color | Glow |
|------|-------|------|
| Drone | `#58a6ff` | `#58a6ff40` |
| Mechanic | `#f0883e` | `#f0883e40` |
| Medic | `#3fb950` | `#3fb95040` |
| Decoder | `#d2a8ff` | `#d2a8ff40` |
| Navigator | `#79c0ff` | `#79c0ff40` |
| Courier | `#ffa657` | `#ffa65740` |
| Mission Control | `#ffd965` | `#ffd96540` |

### Threat Colors
| State | Color |
|-------|-------|
| Safe / Found | `#4caf50` |
| Caution / Warning | `#ff9800` |
| Danger / Hunt | `#ef4444` |

### Text Colors
| Context | Color |
|---------|-------|
| Body on dark | `#e0e0e0` |
| Monospace data | `#00bcd4` with glow |
| Role highlights | Role accent color |

## 2. Screen Layouts

### Lobby / Setup / Roles / Briefing
- Dark glass-morphism panels: `backdrop-filter: blur(8px)`
- Subtle gradient overlays on background
- Cards with `--bg-card` + `--border`
- Max content width: 920px centered

### Mission Screen
- Minimal chrome: HUD is semi-transparent
- Map fills entire viewport (z-index 0)
- Radar canvas overlay (z-index 1)
- Particle canvas overlay (z-index 1)
- HUD bar at top (z-index 2)
- Panels drawer on right / bottom on mobile
- Ability hotbar bottom-center (z-index 3)

### Results Screen
- Clean data display with role-colored stat highlights
- Trophy + grade large centered
- Cards stagger-animate in

## 3. Typography

| Element | Font | Weight | Transform | Letter-spacing |
|---------|------|--------|-----------|----------------|
| Headers | system-ui | 800 | uppercase | 2–4px |
| Timer / coords | ui-monospace | 700 | — | 1px |
| Body | system-ui | 400 | — | 0 |
| Labels / pills | system-ui | 600 | uppercase | 0.5px |
| Numbers | ui-monospace | 700 | — | 0.5px |

## 4. Effects System

### ParticleSystem Enhancements
- Trails: fading line behind each particle
- Glow: `shadowBlur` on canvas context
- Scaling: start big, shrink over lifetime
- Color cycling: shift through role palette
- Burst impulse: explosion force on first frame

### ScreenJuice Enhancements
- Screen flash on damage (white/red overlay 200ms)
- Critical health pulse (red border when STA < 25%)
- Kill feed slide-in/slide-out DOM elements
- Ability ready glow pulse on icons

### Role-specific HUD Effects
| Role | Effect |
|------|--------|
| Decoder | Hex code rain background (10% opacity) |
| Navigator | Compass widget pulses near objective |
| Courier | Speed lines on edges when moving fast |
| Mechanic | Gear rotation on ability icons |
| Medic | Cross pulse on heal |
| Drone | Ring expansion on scout abilities |
| Mission Control | Scan line on HUD |

### Ambient Background
- Scan lines overlay (CSS `repeating-linear-gradient`)
- Edge vignette (`radial-gradient` dark corners)
- Data screen flicker (occasional 100ms opacity glitch)

## 5. Animation Timing

| Effect | Duration | Easing |
|--------|----------|--------|
| Screen transitions | 350ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Splash logo in | 700ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Card slide-up | 450ms | ease-out |
| Ability pulse | 2s | ease-in-out infinite |
| Threat vignette | 1.2s | ease-in-out infinite |
| Event log in/out | 350ms / 400ms | back / ease-in |

## 6. Responsive Breakpoints

| Breakpoint | Key Changes |
|------------|-------------|
| ≤768px | Bottom drawer panels, compact HUD, hide center bars |
| ≤480px | Smaller radar (80px), tiny threat indicators, single-col roles |
| ≤380px | Single-column role grid |
