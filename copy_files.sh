#!/bin/bash
set -e
FILES=(
  "design-system.css"
  "design-system.js"
  "design-flow.css"
  "design-flow-setup.html"
  "design-flow-roles.html"
  "design-flow-control.html"
  "action-center.html"
  "design-test.html"
  "login.html"
  "server-browser.html"
  "map-selection.html"
  "role-selection.html"
  "matchmaking.html"
  "player-profile.html"
  "career-stats.html"
  "match-result.html"
  "post-match-report.html"
  "kill-cam.html"
  "death-recap.html"
  "spectator-mode.html"
  "replay-viewer.html"
  "tournament-bracket.html"
  "emote-wheel.html"
  "store.html"
  "friends.html"
  "squad.html"
  "clan-wars.html"
  "patch-notes.html"
  "token-dashboard.html"
  "daily-challenges.html"
  "inventory.html"
  "loadout-builder.html"
  "battle-pass.html"
  "loot-crate.html"
  "ai-battle-arena.html"
  "admin-dashboard.html"
  "leaderboard.html"
  "settings.html"
  "design-system.html"
  "design-lab.html"
  "shader-library.html"
  "scroll-animations.html"
  "page-transitions.html"
  "mobile-ui-kit.html"
  "mobile-radar.html"
  "gps-tracker.html"
  "shader-bg-module.js"
)

for file in "${FILES[@]}"; do
  if [ -f "signal-lost-tasks/$file" ]; then
    cp "signal-lost-tasks/$file" "$file"
    echo "Copied: $file"
  else
    echo "Missing: signal-lost-tasks/$file"
  fi
done

# Handle R&D-INDEX.html separately
cp "signal-lost-tasks/R&D-INDEX.html" "R&D-INDEX.html" 2>/dev/null || echo "R&D-INDEX.html not found"

# Copy index.html
if [ -f "signal-lost-tasks/design-flow-setup.html" ]; then
  cp "signal-lost-tasks/design-flow-setup.html" "index.html"
  echo "Copied index.html"
fi
