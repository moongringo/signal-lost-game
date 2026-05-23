# Signal Lost AI Collaboration Start Here

This file is the first stop for any AI or human collaborator joining the Signal Lost prototype.

## Project Location

Primary working folder:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\signal-lost-game
```

Backup/collaboration copies may exist beside it:

```text
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy2
C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\Signal lost GPT 5.5 copy3
```

## Current Game

Signal Lost is a real-time multiplayer GPS adventure game prototype. One organizer runs Mission Control while field players use phone/tablet views, GPS/manual coordinates, clues, modules, custom markers, roles, comms, and radar to complete an outdoor or simulated mission.

## Run The Prototype

From the project folder:

```powershell
node server.js
```

Default local URL:

```text
http://127.0.0.1:5186/
```

Useful design pages:

```text
http://127.0.0.1:5186/design-flow-setup.html
http://127.0.0.1:5186/design-flow-roles.html
http://127.0.0.1:5186/design-flow-control.html
http://127.0.0.1:5186/design-lab-option3.html
```

If port `5186` is busy, set a different port:

```powershell
$env:PORT=5190
node server.js
```

## Read These Next

1. `README.md` for what exists and how to open it.
2. `SIGNAL_LOST_GAME_GUIDE.md` for game rules, roles, screens, and player flow.
3. `TASK_QUEUE.md` for current done/next work.
4. `SHARED_AI_MEMORY.md` for the current collaboration state.
5. `BACKUP_AND_RECOVERY.md` before risky edits.
6. `AI_TASK_BOARD.md` for suggested tasks other AI systems can pick up.

## Current Direction

The current design direction is:

- Setup first.
- Roles second.
- Mission Control third.
- Mission Control is its own role.
- Two-player games can allow multi-role stacking.
- Background theme selection belongs on Setup.
- Mission Control should use the option 3 warm 1960s glossy style, not a separate dark sci-fi style.
- Keep design prototypes separate until the user approves them for the main game.

## Rules For Collaborators

- Do not overwrite older design labs or variant folders.
- Do not delete files without explicit user approval.
- Keep new experiments in separate pages/files until approved.
- Update `TASK_QUEUE.md` and `SHARED_AI_MEMORY.md` after meaningful changes.
- Update `SIGNAL_LOST_GAME_GUIDE.md` after game rules, screens, roles, features, or roadmap change.
- Run syntax checks before handing off:

```powershell
node --check app.js
node --check server.js
node --check sw.js
node --check overview.js
```

Also check any edited JavaScript file, such as:

```powershell
node --check design-flow.js
```

## Safe Collaboration Pattern

Use small slices:

1. Read the current task.
2. Edit only the needed files.
3. Run checks.
4. Browser-test the changed page when possible.
5. Update docs/memory.
6. Summarize changed files, verification, risk, and next priority.

## How To Avoid Breaking The Main Game

- Treat `index.html`, `app.js`, `game.css`, `server.js`, and `sw.js` as live app files.
- Treat `design-flow-*` and `design-lab-*` as safe experiment surfaces.
- If unsure, create a new experiment page instead of changing the main game.
- Bump `sw.js` cache name and asset query versions when browser assets change.