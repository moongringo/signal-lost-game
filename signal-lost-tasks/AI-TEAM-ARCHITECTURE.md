# 🤖 Signal Lost — AI Team Architecture
## Autonomous R&D Team Design

### Team Structure
```
┌─────────────────────────────────────────┐
│           Morgan (Human Lead)            │
│     Strategic decisions, approvals       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Project Manager Agent            │
│    Task allocation, progress tracking    │
│    Meeting facilitation, reporting      │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐
│Design │ │Code │ │Test   │
│Agent  │ │Agent│ │Agent  │
│       │ │     │ │       │
└───┬───┘ └──┬──┘ └───┬───┘
    │        │        │
    └────────┼────────┘
             │
    ┌────────▼────────┐
    │  Integration    │
    │     Agent       │
    │ (merges + deploy)│
    └─────────────────┘
```

### Agent Roles & Responsibilities

#### 1. Project Manager Agent
- **Tasks:** Sprint planning, task allocation, deadline tracking
- **Meetings:** Facilitates 4x daily standups
- **Reports:** Daily delivery reports to Morgan
- **Files:** `meeting-scheduler.sh`, `R&D-MEETINGS.md`, `R&D-DELIVERY-REPORT.md`

#### 2. Design Agent
- **Research:** Web trends, typography, color theory, UX patterns
- **Deliverables:** Design system, component library, style guides
- **Tools:** Figma (if available), CSS, WebGL shaders
- **Files:** `design-system.html`, `design-lab.html`, `RD-*-REPORT.md`

#### 3. Code Agent
- **Implementation:** HTML/CSS/JS, WebGL, animation libraries
- **Optimization:** Performance, bundle size, lazy loading
- **Integration:** Apply design system to production pages
- **Files:** All `*-enhanced.html`, `design-system.css`, `design-system.js`

#### 4. Test Agent
- **QA:** Automated testing, visual regression, performance audits
- **Accessibility:** WCAG compliance, screen reader testing
- **Mobile:** Responsive testing, touch target validation
- **Files:** `qa-dashboard.html`, `ACCESSIBILITY-AUDIT.md`, `PERFORMANCE-GUIDE.md`

#### 5. Integration Agent
- **Merge:** Combine work from Design + Code + Test agents
- **Deploy:** GitHub sync, CDN deployment, version tagging
- **Monitor:** Error tracking, analytics, user feedback
- **Files:** `R&D-INDEX.html`, deployment scripts

### Communication Protocol

#### Meeting Cadence (4x Daily)
```
09:00 — Morning Sync
  └─ PM Agent distributes today's tasks
  └─ Each agent reports blockers from yesterday

13:00 — Midday Standup  
  └─ Progress check: % complete per task
  └─ Demo working components
  └─ Re-prioritize if needed

17:00 — Afternoon Review
  └─ Code review: design agent reviews code output
  └─ Test agent reports bugs found
  └─ Integration agent plans merges

21:00 — Evening Wrap
  └─ Daily report generated
  └─ Tomorrow's tasks queued
  └─ Long-term notes added to MEMORY.md
```

#### Task Assignment Format
```markdown
## Task: [Brief description]
**Assigned to:** [Agent name]
**Priority:** P0/P1/P2
**ETA:** [Time estimate]
**Dependencies:** [Other tasks needed first]
**Deliverable:** [File name + description]
```

### Swarm Coordination

#### Parallel Execution
- Design agent researches next trend while Code agent implements current
- Test agent audits yesterday's work while Code agent builds today's
- Integration agent deploys stable builds continuously

#### Conflict Resolution
1. Design agent's vision vs. Code agent's technical constraints → PM decides
2. Performance vs. Visual fidelity → Test agent measures, PM decides threshold
3. Scope creep → PM checks against sprint goals, Morgan approves changes

### Memory & Knowledge Sharing

#### Shared Resources
- `MEMORY.md` — Long-term decisions, preferences, lessons learned
- `memory/YYYY-MM-DD.md` — Daily work logs from all agents
- `signal-lost-tasks/` — All deliverables, indexed by `R&D-INDEX.html`

#### Agent-Specific Notes
- Design agent: `TOOLS.md` (camera names, SSH, preferences)
- Code agent: `AGENTS.md` (workspace conventions, safety rules)
- Test agent: `PERFORMANCE-GUIDE.md`, `ACCESSIBILITY-AUDIT.md`
- PM agent: `R&D-MEETINGS.md`, `R&D-DELIVERY-REPORT.md`

### Scraping & Intelligence Agents

#### Design Intelligence Agent (Background)
- **Frequency:** Weekly crawl of Awwwards, CSS Design Awards, SiteInspire
- **Output:** Trend report with screenshots, technique breakdowns
- **Trigger:** When design agent requests fresh inspiration
- **Storage:** `signal-lost-tasks/trend-reports/YYYY-MM-DD.md`

#### Asset Harvester Agent (Background)
- **Task:** Extract CSS patterns, animation keyframes, shader code from top sites
- **Output:** Snippet library with attribution
- **Storage:** `signal-lost-tasks/snippet-library/`

#### Competitive Analysis Agent (Background)
- **Task:** Track competitor games/products, feature comparison
- **Output:** Feature gap analysis, opportunity identification
- **Trigger:** Before major feature planning

### Autonomous Decision Matrix

| Decision Type | Authority | Escalation |
|--------------|-----------|------------|
| Color tweak | Design agent | Morgan if palette change |
| Animation timing | Code agent | Test agent if <60fps |
| New component | PM agent | Morgan if >4hrs work |
| Bug fix priority | Test agent | PM agent if conflicting |
| Deploy to prod | Integration agent | Morgan for major release |
| Architecture change | PM agent | Morgan always |

### Current Sprint: Morgan's Directives

1. ✅ Research web effects 2015-2025
2. ✅ Research fonts & typography
3. ✅ Research button designs
4. ✅ Build test page (design-lab.html)
5. 🔄 Apply approved effects to production pages
6. 📋 Build mobile UI for all roles
7. 📋 Fix GPS grey tiles
8. 📋 Fix missing radar
9. 📋 Performance audit
10. 📋 Accessibility audit

---

*Architecture document — R&D Team v1.0*
*Updated: 2026-05-04 07:30 CST*
