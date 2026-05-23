# AI Handoff Start Here

Signal Lost is a browser-based real-time multiplayer GPS adventure prototype. This document is the first stop for any AI or human collaborator joining the project.

## Canonical Project

Canonical folder:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\signal-lost-game
```

Prepared experiment copies:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy2
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy3
```

Use the canonical folder for accepted work. Use the copies for experiments with other AIs, local models, or risky design branches.

## Read Order

1. `README.md` - how to run and what exists.
2. `SIGNAL_LOST_GAME_GUIDE.md` - game concept, rules, roles, and feature guide.
3. `TASK_QUEUE.md` - current roadmap and completed build trail.
4. `SHARED_AI_MEMORY.md` - current user preferences, design direction, and coordination notes.
5. `AI_COLLABORATION_TASKS.md` - task board for multiple AIs.
6. `BACKUP_AND_RECOVERY.md` - restore and safety steps.

## Run The Game

From the project folder:

```powershell
node server.js
```

Open:

```text
http://127.0.0.1:5186/
```

Useful prototype pages:

```text
http://127.0.0.1:5186/design-flow-setup.html
http://127.0.0.1:5186/design-flow-roles.html
http://127.0.0.1:5186/design-flow-control.html
http://127.0.0.1:5186/design-lab-option3.html
```

## Collaboration Rules

- Preserve existing UI variant builds and design pages. Never overwrite an older design option unless the user explicitly asks.
- Keep accepted game work in `signal-lost-game`; use `copy2` and `copy3` for experiments.
- Make one clear task change at a time.
- After every meaningful change, update `TASK_QUEUE.md`, `SIGNAL_LOST_GAME_GUIDE.md`, and `SHARED_AI_MEMORY.md`.
- If an experiment in a copy should be merged back, record exactly which files changed and why.
- Do not delete user work, generated design pages, local data, or `.signal-lost-data` without explicit permission.
- Prefer small verifiable patches over broad rewrites.

## Current Direction

The user wants the game to open with Mission Setup first, then Role Assignment, then Mission Control. Mission Control is becoming its own role, and smaller groups should be able to stack multiple roles on one player.

The preferred visual direction is currently closest to `design-lab-option3.html` and the new flow pages: 1960s-inspired animated pattern backgrounds, solid glossy mod-switch controls, warm candy panels, cleaner layout density, and theme-song controls on every page.

## Before You Finish A Task

Run at least the lightweight checks that fit your change:

```powershell
node --check app.js
node --check server.js
node --check design-flow.js
node --check sw.js
```

Then update the handoff notes with:

- What changed.
- What was verified.
- What risks remain.
- What task should happen next.