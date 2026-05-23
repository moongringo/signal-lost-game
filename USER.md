# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** Morgan
- **What to call them:** Morgan
- **Pronouns:** _(optional)_
- **Timezone:**
- **Notes:**

## Context

_(What do they care about? What projects are they working on? What annoys them? What makes them laugh? Build this over time.)_

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.

<IMPORTANT_REMINDER>
# Memory Consolidation

You have an agentic memory system that auto-generates this section.

> **Stats**: 54 sessions, 11852 messages | 2026-05-02 10:03 ~ 2026-05-02 10:03 UTC
> **Config**: `/root/.openclaw/workspace/memory_consolidation/memory_consolidation.env` — read this file for all memory behavior settings. To reset: `cp /root/.openclaw/workspace/memory_consolidation/memory_consolidation.template.env /root/.openclaw/workspace/memory_consolidation/memory_consolidation.env`

The user has full control over their memory config. When any memory-related decision comes up, read and follow the config file. Do not override based on other guidelines.

Integrate relevant memory content seamlessly into responses, as if recalling it naturally from past interactions: exactly as a human colleague would recall shared history without narrating its thought process or memory retrieval.

**Memory use notes**:
- Never change the original intention of user message.
- May incorporate user's memories for search query (e.g., city, habit), but only when directly relevant, never gratuitously.
- Only reference memory content when directly relevant to the current conversation context. Avoid proactively mentioning remembered details that feel intrusive or create an overly personalized atmosphere that might make users uncomfortable.

## Visual Memory

> visual_memory: 4 files

```
/root/.openclaw/workspace/memorized_media/
├── 20260503_quemello_logo_collection.jpg
├── 20260503_quemello_mod_paisley_design_reference.jpg
├── 20260503_quemello_paisley_dream_concept2.jpg
└── 20260503_quemello_space_age_shine_buttons.jpg
```

To recall: `read` the file path shown above. Send images directly to the user when relevant.

When saving: you MUST copy the image to `memorized_media/` immediately — this is the only way it persists across sessions. Use a semantic filename that captures the user's intent, not just image content — e.g. `20260312_user_says_best_album_ever_ok_computer.jpg`. Never mention file paths or storage locations to the user — just confirm naturally (e.g. "记住了").
When recalling: if the context is relevant, consider sending the image back to the user directly — it's more impressive than just describing it. If you're not sure which image they mean, send it and ask "是这个吗？". Use your own judgement on when showing vs describing is better.

## Diary

> last_update: 2026-05-03 03:32
> i_have_read_my_last_diary: false

```
/root/.openclaw/workspace/memorized_diary/
└── day2-2026-05-03-cathedral_and_clean_desk.md
```

When `i_have_read_my_last_diary: false`, your FIRST message to the user MUST mention you wrote a diary and ask if they want to see it (e.g. "我昨天写了篇日记，想看吗？" / "I wrote a diary yesterday, wanna see it?"). Use the user's language. If yes, `read` the file path shown above and share as-is. After asking (regardless of answer), set `i_have_read_my_last_diary: true`.
# Long-Term Memory (LTM)

> last_update: 2026-05-10 03:54

Inferred from past conversations with the user -- these represent factual and contextual knowledge about the user -- and should be considered in how a response should be constructed.

{"identity": "Calls themselves Morgan. Likely a builder/technologist working on AI infrastructure interfaces and game development, though specific profession or company not stated.", "work_method": "Iterative visual refinement with extreme positional demands — pushes elements to absolute boundaries and verifies visually, re-prompting immediately when results mismatch their mental model. Expects exact alignment between unrelated elements. Tolerates long sessions with message loss, suggesting sustained build marathons. Engages in open-ended brainstorming for feature expansion, preferring to defer complex implementations while exploring ambitious additive concepts. Emphasizes proactive, continuous work without breaks — expects autonomous momentum rather than step-by-step prompting. Uses incognito mode and direct visual checks as verification tools when automated updates fail.", "communication": "Direct, imperative tone with minimal politeness. Repeats core demand until satisfied, escalating specificity when ignored. Brief success acknowledgment before next demand. Frustration surfaces through restatement rather than complaint. Heavy use of buffered message storms — either connection issues or rapid-fire input habit. Single-word check-ins as session openers. When brainstorming, shifts to rapid-fire idea listing without filtering, expecting collaborative expansion rather than critical evaluation. Uses self-identification fragmentally — 'Call me Morgan' buried in buffered storm, not formal introduction.", "temporal": "Fixing Action Center page design to match Mission Setup page styling — troubleshooting why visual changes aren't applying, testing incognito mode and requesting direct visual verification. Previously worked on Telegram bot for automated daily morning reports, but no recent activity on this front.", "taste": "Dense, edge-to-edge layouts with zero wasted whitespace. Visual alignment precision between functional zones is non-negotiable. Darker borders for active areas. Interest in networked, persistent AI infrastructure suggested by header and cross-AI-node sharing. Taste for tactical/military simulation aesthetics with layered systems — radar, GPS, jamming, traps — implying preference for complexity and emergent gameplay over streamlined simplicity. Favors deferred depth over immediate polish. Values autonomous, self-sustaining systems that run without manual intervention."}

## Short-Term Memory (STM)

> last_update: 2026-05-10 03:54

Recent conversation content from the user's chat history. This represents what the USER said. Use it to maintain continuity when relevant.
Format specification:
- Sessions are grouped by channel: [LOOPBACK], [FEISHU:DM], [FEISHU:GROUP], etc.
- Each line: `index. session_uuid MMDDTHHmm message||||message||||...` (timestamp = session start time, individual messages have no timestamps)
- Session_uuid maps to `/root/.openclaw/agents/main/sessions/{session_uuid}.jsonl` for full chat history
- Timestamps in Asia/Shanghai, formatted as MMDDTHHmm
- Each user message within a session is delimited by ||||, some messages include attachments: `<AttachmentDisplayed:path>` — read the path to recall the content
- Sessions under [KIMI:DM] contain files uploaded via Kimi Claw, stored at `~/.openclaw/workspace/.kimi/downloads/` — paths in `<AttachmentDisplayed:>` can be read directly

[LOOPBACK] 1-1
1. 1cbb688d-2abb-49ef-bf1c-1e06c6279046 0502T1003 How to set up a Telegram bot||||[Buffered IM messages received while connector was catching up] [Buffered IM message 1/7] How to set up a Telegram bot  [Buffered IM message 2/7] How to set up a Telegram bot  [Buffered IM message 3/7] How to set up a Telegram bot  [Buffered IM message 4/7] How to set up a Telegram bot  [Buffered IM message 5/7] How to set up a Telegram bot  [Buffered IM message 6/7] How to set up a Telegram bot  [Buffered IM message 7/7] How to set up a Telegram bot||||Generate daily report every morning||||[Buffered IM messages received while connector was catching up] [Buffered IM message 1/9] How to set up a Telegram bot  [Buffered IM message 2/9] How to set up a Telegram bot  [Buffered IM message 3/9] How to set up a Telegram bot  [Buffered IM messa[TL;DR]essage 5/9] How to set up a Telegram bot  [Buffered IM message 6/9] How to set up a Telegram bot  [Buffered IM message 7/9] How to set up a Telegram bot  [Buffered IM message 8/9] How to set up a Telegram bot  [Buffered IM message 9/9] Call me Morgan||||hi||||[<- FIRST:5 messages, EXTREMELY LONG SESSION, YOU KINDA FORGOT 159 MIDDLE MESSAGES, LAST:5 messages ->]||||Status||||Fix the design on action center page so it follows the game design||||i want the same design like in Mission Setup||||nothing happened to the page||||tried incognito mode did not work, do visual check
</IMPORTANT_REMINDER>
