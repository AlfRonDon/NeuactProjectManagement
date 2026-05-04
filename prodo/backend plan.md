# Behavioral Specification — Portfolio Overview Dashboard

---

## HEADER STRIP

**"36%" portfolio progress chip · "8 of 22 tasks across 5 projects" · "Next deadline in 27 days"**

1. **Purpose:** Gives the viewer a single-glance read on whether the entire portfolio is healthy enough to ignore for the rest of the day.
2. **What it Represents:** The combined completion state of every active project the user owns or follows, plus the urgency horizon (closest deadline).
3. **How it is Calculated:** A weighted average of completion across all projects, where projects with closer deadlines or higher task counts pull the number more strongly. The deadline number is the soonest unmet milestone across all five projects.
4. **Trigger Conditions:** Recalculates whenever a task changes status (done, blocked, reopened), a new task is added, or a deadline is moved.
5. **User Interaction:**
   - *Clicked:* Expands into a portfolio-level breakdown showing per-project contribution.
   - *Hovered:* Reveals which project is closest to the 27-day deadline.
   - *Ignored:* Stays passive; does not nag.
6. **Downstream Impact:** When this number drops sharply, the AI Morning Brief becomes more aggressive (it surfaces risks instead of saying "all clear").

---

## A. PORTFOLIO OVERVIEW CARDS (Command Center v5 · NeuactReport v3 · Spot Particle)

Each card shares the same anatomy: project name, completion %, risk label, days left, micro-trend line, status sub-line, and percentage delta.

### A1. Progress %

1. **Purpose:** Tells you how much of the project is behind you vs. ahead of you.
2. **What it Represents:** The share of total committed scope that has been finished.
3. **How it is Calculated:** Tasks marked "done" divided by total tasks in scope. Tasks added mid-sprint count against the total — this is what makes scope creep visible.
4. **Trigger Conditions:** Updates the moment any task closes, reopens, or is added.
5. **User Interaction:**
   - *Clicked:* Drills into the project panel (e.g., the CCv5 panel below).
   - *Hovered:* Shows the raw "done / total" count.
   - *Ignored:* No effect.
6. **Downstream Impact:** Feeds the portfolio-level 36% chip and the risk label on the same card.

### A2. Risk Label — On Track / At Risk / Critical

1. **Purpose:** Translates raw numbers into a verdict so the user does not have to do the math.
2. **What it Represents:** Whether the project will land on time at the current rate of progress.
3. **How it is Calculated:** A comparison between actual pace and required pace.
   - **On Track:** actual pace ≥ required pace; no active blockers older than a threshold.
   - **At Risk:** pace is slipping, OR a non-blocking issue (slow reviews, missing owner) has appeared, OR completion is trailing the planned curve.
   - **Critical:** there is at least one unresolved blocker, OR the deadline is too close to recover at current pace, OR pace has dropped sharply (negative delta combined with low days-left).
4. **Trigger Conditions:** Re-evaluated on any pace change, blocker creation, or deadline shift. A blocker that crosses an "aging" threshold (e.g., unresolved past a few days) can promote At Risk → Critical without anything else changing.
5. **User Interaction:**
   - *Clicked:* Opens the diagnostic explanation — *why* it is at this level.
   - *Hovered:* Surfaces the primary reason ("blocked," "pace slipping," etc.).
   - *Ignored:* Critical labels age into escalations in the Blockers panel.
6. **Downstream Impact:** Critical projects get pulled into the Sprint Diagnostic root-cause panel. They also bias the Workload Calendar — tasks in critical projects get visual priority weight.

### A3. Days Left

1. **Purpose:** Anchors urgency. "97d" feels different from "5d."
2. **What it Represents:** Calendar days until the project's committed end date.
3. **How it is Calculated:** End-of-project deadline minus today.
4. **Trigger Conditions:** Counts down daily; jumps if the deadline is rescheduled.
5. **User Interaction:** Clicking opens the project's timeline; hovering shows the actual target date.
6. **Downstream Impact:** When days-left shrinks below the time required to finish remaining work at current pace, the risk label automatically escalates.

### A4. Trend Line + Delta (↑4%, ↓3%, ↓5%)

1. **Purpose:** Shows momentum — not where the project is, but where it is *heading*.
2. **What it Represents:** Velocity change over a recent window (typically the last week).
3. **How it is Calculated:** Compares this period's completion rate to the previous period. Up = speeding up. Down = slowing down.
4. **Trigger Conditions:** Recomputes as tasks close. Sharp drops happen when blockers land or a key contributor stops moving work.
5. **User Interaction:**
   - *Clicked:* Expands into the full burndown for that project.
   - *Hovered:* Reveals which event likely caused the swing (e.g., "blocker hit Apr 5").
6. **Downstream Impact:** A negative trend on a Critical-labeled card is what tips the AI suggestion engine into action — the "Top risk" and "AI suggestion" lines below are written against this signal.

---

## B. PROJECT PANEL — CCv5

### B1. Overall Progress Bar (5 done · 3 active · 1 blocked, with the green/amber/red split)

1. **Purpose:** Shows not just *how much* is done but *what shape* the remaining work is in.
2. **What it Represents:** The current state distribution of every task in the project.
3. **How it is Calculated:** Each task is in exactly one bucket — done, active (in progress), or blocked (waiting on something it cannot resolve itself).
4. **Trigger Conditions:** Updates instantly on any state change.
5. **User Interaction:**
   - *Clicked:* Filters the task list by the bar segment you tap.
   - *Hovered:* Shows the count and names in that segment.
6. **Downstream Impact:** The size of the red (blocked) segment directly drives the "Top risk" line below and feeds the Blockers panel.

### B2. Stage Pipeline — Research / Design / Build / Test / Ship

1. **Purpose:** Shows where work is currently piling up in the delivery flow.
2. **What it Represents:** Each stage is a gate. A task must clear earlier stages before entering later ones.
3. **How Work Moves Between Stages:** Movement is intentional, not automatic — a task advances when its owner marks the current stage complete and the acceptance criteria for the next stage are met (e.g., design must have an approved spec before Build accepts it).
4. **What Qualifies as "Blocked" in a Stage:** A task is blocked at a stage when it cannot progress for a reason the owner cannot resolve alone — missing dependency, unresolved review, environment failure, or upstream owner unavailable. Note: Ship shows "0/2 · 2 blocked" — both Ship-stage tasks exist but neither can advance.
5. **Trigger Conditions:** Stage counts update on stage transitions. A stage goes red when blocked count > 0.
6. **User Interaction:**
   - *Clicked on a stage:* Filters the project task list to that stage.
   - *Clicked on "View blockers →":* Opens the Blockers panel scoped to this project.
   - *Ignored:* If a stage stays blocked past a threshold, it begins contributing to the "Missing Owner" or "Ext. Deps" scores in the Sprint Diagnostic.
7. **Downstream Impact:** A stage with growing inventory (many active, few moving out) becomes the "bottleneck" surfaced in the Top Risk line.

### B3. Required Pace (0.1 tasks/day)

1. **Purpose:** Tells the team the minimum rate they must hit to finish on time.
2. **What it Represents:** Remaining tasks divided by remaining days.
3. **How it is Calculated:** As days shrink or scope grows, required pace rises. As tasks close, it can fall.
4. **Trigger Conditions:** Recomputes daily and on every task or deadline change.
5. **Downstream Impact:** Compared against actual pace to determine the project's risk label.

### B4. "Next Action" Line

1. **Purpose:** Removes ambiguity about *what to do right now*.
2. **What it Represents:** The single highest-leverage move the project owner could make today.
3. **How it is Selected:** The system picks the action whose resolution would unblock the most downstream work or recover the most days. Unblocking a stage that has 4 dependent tasks beats finishing a single isolated task.
4. **Trigger Conditions:** Reselects whenever the dependency graph changes — a new blocker, a closed task, or a reassignment.
5. **User Interaction:** Clicking it jumps to the relevant blocker, task, or stage.
6. **Downstream Impact:** Acting on it usually moves the project's risk label and trend line within the next refresh cycle.

### B5. "Top Risk" Line

1. **Purpose:** Names the thing most likely to cause this project to miss its date.
2. **What it Represents:** The single dependency, person, or stage most strongly correlated with the current slip.
3. **How it is Calculated:** The system looks at where blocked tasks cluster, how long they've been stuck, and how many downstream tasks rely on them. The largest cluster wins.
4. **Trigger Conditions:** Updates as blockers form, age, or resolve.
5. **Downstream Impact:** Feeds the AI suggestion below and surfaces in the Sprint Diagnostic radar.

### B6. "AI Suggestion" Line

1. **Purpose:** Offers a concrete intervention, not a diagnosis.
2. **What it Represents:** A proposed change to ownership, scope, or sequencing predicted to recover time.
3. **When AI Suggestions Appear:** Only when the system can identify both a problem (Top Risk) and a credible action that would meaningfully change the outcome — e.g., spare capacity exists elsewhere, or a task can be safely descoped.
4. **Trigger Conditions:** Reappears when the underlying risk persists for more than one refresh cycle.
5. **User Interaction:**
   - *Clicked:* Pre-fills the proposed reassignment for one-tap acceptance.
   - *Ignored:* Suggestion remains visible but does not act on its own. If the same suggestion is ignored repeatedly while the project worsens, it gets escalated into the Blockers panel.

---

## C. SPRINT TIMELINE CHART (Sprint 12 · Apr 1–20)

### C1. Planned, Actual, Forecast Lines

1. **Purpose:** Shows the gap between commitment, reality, and projection.
2. **What They Represent:**
   - **Planned (dashed):** the burndown assumed at sprint start — "if we close the same number of tasks every day, we land here."
   - **Actual (solid blue):** what actually happened up to today.
   - **Forecast (extension of actual):** where the sprint will end if the *current* pace continues.
3. **What Causes the Forecast to Shift:** Any change in actual pace bends the forecast. A few good closing days pulls the line in; a stalled day pushes it out. New tasks added mid-sprint raise the entire actual curve, which also pushes the forecast right.
4. **Trigger Conditions:** Forecast recalculates daily based on a rolling window of recent pace, not lifetime average — this is why a single bad week can flip a sprint.

### C2. Blocked Region (the pink shaded band)

1. **Purpose:** Visually marks the period where work could not progress, separating "we were slow" from "we were stopped."
2. **What it Represents:** A continuous span of days during which one or more critical-path tasks were blocked.
3. **Trigger Conditions:** The band starts when a blocker is logged on a critical task and ends when it resolves.
4. **Downstream Impact:** Days inside this band are excluded from "fair pace" calculations in some diagnostics — the system can distinguish a team that is slow from a team that is stuck.

### C3. "Ships Apr 24 · +4 days late"

1. **Purpose:** Translates the forecast curve into a calendar promise.
2. **What it Represents:** The day all remaining tasks are projected to finish at current pace, compared to the originally planned end date.
3. **When a Sprint Becomes "Late":** The moment forecast end > planned end. The "+4 days" is simply the gap.
4. **Downstream Impact:** Drives the Critical/At Risk label on the parent project card.

### C4. Pace (0.4/d ↓ from 1.2)

1. **Purpose:** Shows how fast the team is actually closing tasks vs. how fast they were closing them.
2. **What "Pace" Actually Means:** Number of tasks closed per active workday, averaged over a recent window.
3. **What the Arrow Means:** "↓ from 1.2" says current pace is one-third of what it was earlier in the sprint — a strong slowdown signal.
4. **Trigger Conditions:** Recalculates daily. A long blocked region typically explains a sharp drop.
5. **Downstream Impact:** Pace is the primary input into the forecast line, the days-late number, and the project risk label.

### C5. Remaining / Days Left (6 tasks · 11 days)

1. **Purpose:** Anchors the math: enough room to recover, or not?
2. **Behavioral rule:** If remaining ÷ days-left exceeds current pace, the system knows the sprint cannot land naturally — that is the trigger for the AI to start proposing reassignments or descopes.

---

## D. BLOCKERS PANEL

### D1. What Qualifies as a Blocker

A task becomes a blocker when:
- Its owner has explicitly marked it stuck, **or**
- An automated signal indicates progress is impossible (CI failure, missing dependency, overdue handoff), **or**
- It has had no movement for longer than its stage's expected dwell time *and* it sits on the critical path.

Casual delays do not count — only things that stop downstream work.

### D2. When a Blocker Becomes Critical

A blocker is promoted to Critical when **any** of the following are true:
- It has aged past a threshold (the longer it sits, the more downstream work it stalls).
- The number of tasks waiting on it exceeds a count threshold.
- The project's deadline is close enough that the blocker's remaining lifespan would consume the safety margin.
- It is the named cause behind the project's "Top Risk" line.

Both visible blockers (CI Bot timeout, Dependency unresolved) qualify — they have measurable age (34m, 12m visible; 2 days, 3 days in the body text) and they sit on active work.

### D3. Action Buttons — Behavioral Effects

**Escalate**
- *Effect on behavior:* Raises the visibility of this blocker beyond its current owner — surfaces it to the project lead, reweights it in the diagnostic, and increases how often it appears in summaries.
- *Cause it triggers:* The blocker now competes with top-of-portfolio attention, not just project-level attention.

**Snooze**
- *Effect on behavior:* Temporarily suppresses surfacing of the blocker. The system still tracks it, but it stops counting against active-attention metrics until the snooze expires.
- *Important rule:* Snoozing does not pause aging — if the deadline approaches while snoozed, it can wake up already Critical.
- *If misused:* Repeated snoozing on the same blocker is itself a signal — it counts toward the "Missing Owner" diagnostic score.

**Reassign**
- *Effect on behavior:* Transfers ownership. The blocker's age clock keeps running, but its escalation path resets to the new owner's chain. Workload calendar updates for both old and new owner.

### D4. Overdue · 2

1. **Purpose:** Distinct from blockers — these are tasks past their due date that are *not necessarily* stuck. They could be in progress and just slow.
2. **Behavioral difference from a blocker:** Overdue + no progress over time → eventually reclassified as a blocker. Overdue + active progress → stays overdue but does not escalate as fast.

---

## E. SPRINT DIAGNOSTIC — Root Cause Panel

The radar chart shows six dimensions. Beneath it, the system claims **~61% of the sprint gap traces to the top 3 friction sources**, with each dimension carrying a score and a recent change.

### E1. How Each Issue is Identified

| Friction Source | What Triggers a High Score |
|---|---|
| **Scope Creep (88, +23)** | Tasks were added to the sprint after it started, especially after the midpoint. The score rises with both the count and the lateness of the additions. |
| **Slow Reviews (82, +4)** | Tasks sit in a "review" or "approval" state past expected dwell time. Score reflects total review-wait hours across the sprint. |
| **Missing Owner (70, +10)** | Tasks exist without a clear single responsible person, or the named owner has not engaged in a long time. |
| **External Dependencies (65, +15)** | Work is waiting on another team or system that this sprint does not control. |
| **Context Switching (55, −15, on track)** | Individuals are juggling many concurrent tasks. Falling here means people have been allowed to focus. |
| **Tech Debt (35, −5, on track)** | Tasks tagged as remediation/cleanup proportional to feature work. Low score here is healthy. |

### E2. How Contribution % is Assigned

The system asks: *"If this single source were eliminated, how many days of slip would we recover?"* Sources are ranked by recoverable days, and the top three sum to the headline percentage (~61% here). The bar widths under the scores show this proportion visually — wider = more responsible for the gap.

### E3. Why Some Issues Matter More Than Others

Not all issues are weighted equally. The system favors issues that:
- Affect tasks on the **critical path** over isolated tasks.
- Are **trending up** (the +23 on Scope Creep is more dangerous than a static 88).
- Are **actionable** — issues with a clear intervention available rank higher in the gap attribution because resolving them moves the number.

This is why "Tech Debt 35, −5" is shown as on-track and quiet, while "Scope Creep 88, +23" dominates the panel.

### E4. Action Buttons — What They Change

**Lock backlog** (paired with Scope Creep)
- Behaviorally prevents new tasks from entering the current sprint without explicit approval.
- Does not remove existing tasks — just stops the bleeding.

**Set review SLA** (paired with Slow Reviews)
- Establishes a maximum time a task can sit in review before it triggers an alert and counts as a soft blocker.

**Assign DRIs** (paired with Missing Owner)
- Forces every active task to have a single named responsible person before it can advance to the next stage.

**Escalate** (paired with External Deps)
- Raises the unresolved dependency to a level above the project — same behavior as escalating a blocker, but applied at the dependency category level.

### E5. "Fix from the left to recover the most velocity"

This caption encodes the rule that the panel is sorted by recovery impact: act on the leftmost issue first because it returns the most days. Tackling Tech Debt (rightmost) when Scope Creep (leftmost) is +23 wastes effort.

---

## F. WORKLOAD CALENDAR — Next 4 Weeks

The grid shows people on the left, weeks across the top, and tasks as colored bars whose **length = total workload** and whose **row height encodes how many tasks** are stacked.

### F1. How Workload is Judged: Light / Busy / Full / Over

The capacity verdict per person per week is determined by total committed hours vs. that person's available hours that week:
- **Light:** comfortably under capacity — room to absorb new work.
- **Busy:** approaching capacity but still within healthy range.
- **Full:** at capacity — any additional work pushes them over.
- **Over:** committed hours exceed available hours. This is the trigger condition for risk.

The cell width represents hours that week (not calendar width), so a wider cell is a heavier week even if the calendar week is the same length.

### F2. How Tasks are Distributed

Tasks land on a person's row when:
- They are explicitly assigned, **or**
- They are reassigned via an AI suggestion the user accepted, **or**
- They are pulled in via the "+ pull work to here" affordance — a manual signal that this person has spare capacity.

Tasks naturally span across weeks if their estimated duration crosses week boundaries (e.g., "Phase B — Fill/RAG" stretches multiple weeks for Rohith).

### F3. What Happens When Overload Occurs

When a person's week tips into "Over":
- The cell turns red.
- Their row's total hours indicator (e.g., "+19h") flags the surplus over baseline.
- The Sprint Diagnostic's "Context Switch" or "Missing Owner" scores can rise depending on whether the overload is from too many concurrent tasks or from inheriting unowned tasks.
- The AI suggestion engine begins proposing redistribution to "Light" cells.

### F4. The "+ pull work to here" Affordance

Behaviorally, this is the inverse of overload — a slot the system has identified as having spare capacity. Dragging a task there manually moves it onto that person's load and updates both the source and destination capacity verdicts immediately.

---

## G. ACTIVITY FEED + AI MORNING BRIEF

### G1. AI Morning Brief — "All clear -- no unread notifications"

1. **Purpose:** A daily one-line synthesis that tells the user whether they need to engage today or can move on.
2. **What it Represents:** The net result of running every blocker, overdue, risk, and pace signal through a "does the user need to act?" filter.
3. **What Gets Included:** Items that meet a relevance threshold — something the user owns or follows, that has changed since the last brief, and that requires a decision only this user can make.
4. **What Gets Ignored:**
   - Routine status changes on tasks not on the critical path.
   - Self-resolving items (things that closed without intervention).
   - Issues already snoozed and not yet awake.
   - Repeated occurrences of an already-surfaced item.
5. **When the AI Writes a Summary:** It runs once per session start and again whenever a material change occurs (new Critical, new blocker on a watched project). In a quiet state it produces the "all clear" version. In an active state it produces a prioritized list.

### G2. Blockers · 2 / Overdue · 2 Counters

1. **Purpose:** Quick-glance counts that bypass the prose summary.
2. **What They Represent:** Items that *would have been* in the summary if the user had not muted, snoozed, or already seen them.
3. **Trigger Conditions:** Increment when a new blocker/overdue appears; decrement on resolution, snooze, or reassignment to a non-watched owner.
4. **Downstream Impact:** A non-zero counter while the brief says "all clear" is the system's way of distinguishing *important to know* from *important to act on now*.

---

## CROSS-CUTTING BEHAVIORS

A few rules tie the surfaces together:

**Blockers feed risk labels.** Any unresolved blocker on a critical-path task can promote a project from On Track → At Risk → Critical without any other signal changing.

**Pace feeds forecast feeds risk.** Pace is the central number — it bends the forecast line, which sets the days-late count, which sets the risk label, which feeds the AI brief.

**The diagnostic is the "why," everything else is the "what."** Cards and timelines tell you the project is slipping. The radar tells you which behavior of the team is causing it. Action buttons there change behavior; action buttons elsewhere change individual items.

**Ignoring is a signal.** Repeatedly snoozed blockers, repeatedly dismissed AI suggestions, and persistently ignored Top Risks all increase the diagnostic scores — the system treats inaction as data.

**The user is never required to act.** Every surface offers actions but the dashboard remains read-only by default. The only thing that happens automatically is recalculation; everything that *changes the world* requires a click.