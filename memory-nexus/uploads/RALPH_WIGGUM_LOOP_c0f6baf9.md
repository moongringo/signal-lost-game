# Ralph Wiggum Loop

This is the project cost-control loop. It is a workflow name only, not a character voice.

## Loop Rules

1. Pick one small task from `TASK_QUEUE.md`.
2. Read only the files needed for that task.
3. Patch the smallest useful slice.
4. Run the quickest relevant checks.
5. Update `SIGNAL_LOST_GAME_GUIDE.md` when the build changes gameplay, roles, setup, rules, features, or roadmap status.
6. Update automation memory with the result and the next task.
7. Treat the next run like a reset: start from memory plus `TASK_QUEUE.md`, not from a full re-read.

## Task Shape

Each task should fit in one short build pass:

- Goal: one user-visible improvement.
- Touch: usually one to five files.
- Verify: syntax checks plus static smoke; browser visual when available.
- Handoff: changed files, checks, risk, next task.

## Current Focus

Keep improving the playable prototype in this order:

1. Make setup customization richer.
2. Make Mission Control easier to operate.
3. Make role pages feel like real pre-mission readiness.
4. Make multiplayer/session moderation safer.
5. Tune visual map/Radar feedback after browser verification.