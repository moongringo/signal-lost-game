import os, re

# Update quemello-v2 design-system-subdir.css to override dark inline styles
quemello_css = '''/* Quemello v2 — Warm Frosted Glass Overrides */
:root {
  --ink: #201116;
  --muted: #704a41;
  --cream: #fff0c7;
  --cream-soft: #fff8dc;
  --peach: #ffc0a0;
  --gold: #ffd965;
  --orange: #ff8b1f;
  --pink: #e82663;
  --teal: #008c94;
  --blue: #18364b;
  --panel-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.58), inset 0 -24px 34px rgba(116, 45, 17, 0.13), 0 12px 0 rgba(0, 140, 148, 0.56), 0 24px 48px rgba(58, 24, 13, 0.28);
  --display-font: "Cooper Black", "Cooper Std Black", "Bookman Old Style", Georgia, serif;
  --body-font: "Bookman Old Style", "Trebuchet MS", Georgia, serif;
  --bg-card: rgba(255, 240, 199, 0.72) !important;
  --bg-elevated: rgba(255, 248, 220, 0.85) !important;
  --text: var(--ink) !important;
  --text-dim: var(--muted) !important;
  --text-muted: #a08070 !important;
  --border: rgba(255, 217, 101, 0.25) !important;
  --border-hover: rgba(255, 217, 101, 0.45) !important;
  --danger: var(--pink) !important;
  --success: var(--teal) !important;
  --warning: var(--orange) !important;
  --info: var(--blue) !important;
  --gold-dim: rgba(255, 217, 101, 0.15) !important;
  --coral: var(--pink) !important;
  --coral-light: #ff6b8a !important;
  --coral-dim: rgba(232, 38, 99, 0.15) !important;
  --teal-dim: rgba(0, 140, 148, 0.15) !important;
  --charcoal: var(--cream) !important;
  --charcoal-light: var(--cream-soft) !important;
  --charcoal-elevated: var(--cream-soft) !important;
}

/* Override dark backgrounds in quemello pages */
html, body {
  background: var(--cream) !important;
  color: var(--ink) !important;
}

/* Force frosted glass on all card/window elements */
.dash-card, .recent-card, .mobile-card, .mob-card,
.q-card, .role-card, .q-team-member,
.mobile-header, .mobile-nav, .status-bar,
.mobile-menu, .cmd-btn, .weapon-cell,
.q-equip-cell, .q-stat-box, .q-btn,
.q-nav, .q-pill, .q-radar-box,
.inventory-grid .inv-item, .chat-bubble,
.objective-item, .metric-row, .gps-status,
.match-timer, .score-pill, .join-code,
.module-card, .flow-panel, .flow-card,
.map-stage, .song-console, .theme-console,
.radar-console, .phone-preview {
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}

/* Override dark card backgrounds to warm glass */
.dash-card, .recent-card, .mobile-card, .mob-card,
.q-card, .role-card, .q-team-member,
.inventory-grid .inv-item, .chat-bubble.them,
.objective-item, .metric-row, .gps-status {
  background: rgba(255, 240, 199, 0.65) !important;
  border-color: rgba(255, 217, 101, 0.3) !important;
}

/* Active/nav items */
.mobile-nav a.active, .q-btn.primary {
  background: linear-gradient(135deg, rgba(255, 217, 101, 0.8), rgba(255, 192, 160, 0.8)) !important;
  color: var(--ink) !important;
}

/* Buttons — warm gold glass */
.q-btn, .cmd-btn, .mobile-btn {
  background: rgba(255, 248, 220, 0.6) !important;
  border: 1px solid rgba(255, 217, 101, 0.4) !important;
  color: var(--ink) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
}

.q-btn:hover, .cmd-btn:hover, .mobile-btn:hover {
  border-color: var(--gold) !important;
  box-shadow: 0 0 20px rgba(255, 217, 101, 0.3) !important;
}

.q-btn.primary, .mobile-btn.primary, .cmd-btn.fire {
  background: linear-gradient(135deg, rgba(255, 217, 101, 0.8), rgba(255, 139, 31, 0.7)) !important;
  color: var(--ink) !important;
  border-color: transparent !important;
}

.q-btn.danger, .mobile-btn.danger {
  background: linear-gradient(135deg, rgba(232, 38, 99, 0.7), rgba(107, 63, 160, 0.6)) !important;
  color: white !important;
}

/* Nav bar */
.q-nav, .mobile-header {
  background: rgba(255, 240, 199, 0.7) !important;
  border-bottom-color: rgba(255, 217, 101, 0.3) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

/* Radar/console dark elements */
.q-radar, .reference-radar, .mobile-map {
  background: rgba(0, 0, 0, 0.15) !important;
}

/* Leaflet overrides */
.leaflet-container { background: var(--cream) !important; }
.leaflet-popup-content-wrapper {
  background: rgba(255, 248, 220, 0.9) !important;
  color: var(--ink) !important;
  border: 1px solid rgba(255, 217, 101, 0.3) !important;
  backdrop-filter: blur(10px) !important;
}
'''

# Write to both subdirectories
for path in [
    'signal-lost-tasks/quemello-v2/design-system-subdir.css',
    'signal-lost-tasks/design-system-subdir.css'
]:
    with open(path, 'w') as f:
        f.write(quemello_css)
    print(f"Wrote {path}")

print("Done!")
