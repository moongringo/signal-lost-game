# Prompt For Other AI Workers

You are helping build Signal Lost, a real-time multiplayer GPS adventure game prototype.

Start by reading these files in order:

1. `AI_COLLABORATION_START_HERE.md`
2. `SHARED_AI_MEMORY.md`
3. `TASK_QUEUE.md`
4. `SIGNAL_LOST_GAME_GUIDE.md`
5. `BACKUP_AND_RECOVERY.md`

Follow these rules:

- Work in small, reviewable tasks.
- Preserve existing design variants and prototype pages.
- Do not delete or overwrite files without explicit user approval.
- Do not port design prototypes into the main game unless the user has approved the direction.
- After changes, update `SHARED_AI_MEMORY.md` and `TASK_QUEUE.md`.
- Run the relevant `node --check` commands before handoff.
- Summarize changed files, tests, risks, and next task.

Current preferred direction:

- Setup page first.
- Roles page second.
- Mission Control third.
- Mission Control is its own role.
- Small groups can stack multiple roles.
- Theme/background selection is part of setup.
- Keep the option 3 warm glossy 1960s look.
- Use separate design pages for visual experiments.

Suggested first task:

Review `design-flow-setup.html`, `design-flow-roles.html`, and `design-flow-control.html`, then recommend which parts should be ported into the live game.