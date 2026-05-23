# Shared AI Memory - Signal Lost

Last updated: 2026-05-02, RWL-039.

This file is the common project memory for AIs collaborating on Signal Lost. Update it after every accepted change or important experiment.

## Project Snapshot

Signal Lost is a real-time multiplayer GPS adventure game prototype. One organizer creates a mission, players choose roles, and the group completes map-based objectives while Mission Control manages radar, comms, threats, clues, and live game-runner actions.

Current canonical project:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\signal-lost-game
```

Current prepared AI experiment copies:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy2
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy3
```

## User Preferences

- Keep building continuously, but use small loops with verification.
- Preserve old design pages. New visual directions should be separate pages until approved.
- Theme song controls should exist on every page.
- Setup page can have a richer theme-song console; other pages should use compact play/pause and volume.
- Background themes should be selectable by the user on setup.
- Preferred design direction is option 3: 1960s pattern motion, warm glossy panels, mod-switch buttons, and less clutter.
- The setup map should feel like a real world map, not only an abstract radar panel.
- Mission Control should be its own role.
- Two-player games should support role stacking.

## Current Build State

Latest completed build marker: RWL-039.

Recent work:

- Added multi-AI handoff documentation.
- Prepared two exact project copies for external AI/local AI experiments.
- Existing flow prototypes include setup-first, roles, and Mission Control pages.
- Mission Control flow uses the option-3 visual direction with communications on the right side and compact audio controls in the top bar.

## Active Design Decision

The next major product decision is how much of the flow prototype should be promoted into the main game:

- Mission Setup should become the first screen.
- Role Assignment should follow setup.
- Mission Control should become one selected role/page rather than the default destination for everyone.
- The user wants the interface cleaned up and less crowded before promotion.

## Copy Sync Rule

If an AI works inside `Signal lost GPT 5.5 copy2` or `Signal lost GPT 5.5 copy3`, it should write a short merge note before the experiment is considered:

```text
Experiment folder:
AI/model:
Date:
Files changed:
Reason:
Verification:
Recommended merge action:
Risks:
```

Do not silently merge copy work into the canonical folder.

## Known Risks

- Browser/service-worker cache can show stale UI. Use a query string like `?test=vNext` or hard refresh.
- Live map tiles may be blocked in file mode or by network/privacy settings. Keep offline map fallback working.
- The current backend is local prototype storage, not production auth or cloud sync.
- Copies can drift quickly. Keep merge notes and task ownership clear.

## Next Recommended Task

Review `design-flow-setup.html`, `design-flow-roles.html`, and `design-flow-control.html`, then promote the approved setup-first flow into `index.html`, `app.js`, and `game.css` in small steps.