#!/usr/bin/env python3
"""Count remaining unbuilt features in rd-phase2-task-list.md"""
import re, sys

path = "/media/quemello/Back up2/signal-lost-game-dev/signal-lost-game-v2/rd-phase2-task-list.md"
if len(sys.argv) > 1:
    path = sys.argv[1]

with open(path) as f:
    content = f.read()

# Count ## Task entries (these are the unbuilt features)
tasks = re.findall(r'^## Task \d+', content, re.MULTILINE)
print(f"TASKS_REMAINING:{len(tasks)}")
for t in tasks:
    print(t)
