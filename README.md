# Astra Learning Studio

A **software engineering practice app** for progressing from your first function to independent feature ownership and senior engineering judgment. The home page opens the Learning Studio; the EduOps sample application at `/lab` supplies real code and workflows to investigate.

Students, teachers, courses, sections, enrollments, assignments, grades, attendance and
counselling interventions — wrapped in a production-shaped observability layer (structured
logs, audit events, a background job queue) and an **agent layer** of five deterministic
analysts that read the database, reason in traceable steps, and persist reports you can
inspect.

```
Next.js 14 (App Router) · React 18 Server Components · Prisma 5 · SQLite · TypeScript strict
```

---

## Why this repo exists

Two things are being taught here at once.

**1. How a real application is structured.** This is a *modular monolith*: five virtual
packages with an enforced dependency direction, business rules isolated as pure functions,
mutations that audit themselves, and slow work pushed to a queue.

**2. How real engineering work is delivered.** Every feature in this repo arrived through
a branch, a series of explained commits, and a pull request. The git history is not
exhaust — it is the curriculum. Read it:

```bash
git log --oneline --graph --all
```

Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), which documents the exact workflow every
commit here follows and why each convention exists.

---

## Quick start

```bash
npm install
npm run db:push      # creates prisma/dev.db from schema.prisma
npm run db:seed      # populates the demo scenario
npm run dev          # http://localhost:3000
```

Use these setup steps only for a fresh local demo. **`db:seed` resets existing data**; skip it when continuing with a database you want to keep. In Windows PowerShell, use `npm.cmd` if the `npm` shim is blocked.

`prisma/dev.db` is **not** in the repository
— it is a generated artefact. `db:push` and `db:seed` create a repeatable local demo from
the schema and seed. (It used to be committed. See
[`fabledocs/04-what-changed.md`](fabledocs/04-what-changed.md) for why that was a mistake.)

There is no login. Use the **role switcher in the top-right header** to become an Admin, a
School Manager, a Teacher, an Advisor, a Student or a Parent, and watch permissions and
visible data change underneath you.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | **The real gate.** Full strict TypeScript check. |
| `npm test` | Domain rule unit tests (`node:test`, no framework) |
| `npm run db:seed` | Reset to the known demo scenario |
| `npm run db:studio` | Browse the database in a GUI |

> After changing `prisma/schema.prisma`, run `npm run db:push` **and restart the dev
> server** — otherwise the generated Prisma types are stale.
>
> If a page fails with `The table main.X does not exist`, your database is behind the
> schema: run `npm run db:push`.

---

## The demo scenario

The seed builds a small school with a story in it:

- **Maya Johnson** is in crisis: missing Algebra assignments and a run of absences. She has
  an active intervention plan from advisor Clara Vance. The dashboard risk engine finds
  her without being told to.
- **A background job is deliberately broken.** The seeded `AttendanceSummary` job has
  `runDate: null` and throws a real `TypeError` when you retry it on `/jobs`. It exists so
  you can practise reading a stack trace in a job monitor — it is a fixture, not a defect.

---

## Architecture in one diagram

```mermaid
graph TD
  subgraph "src/app — Next.js App Router"
    Pages["Server Components<br/>(read)"]
    Actions["Server Actions<br/>(write)"]
  end

  subgraph "src/packages — virtual packages"
    Agents["@/agents<br/>orchestrator + 5 heuristics"]
    Obs["@/observability<br/>logs · audit · jobs · notifications"]
    Domain["@/domain<br/>PURE business rules"]
    Shared["@/shared<br/>permissions · scope · schemas"]
    DB["@/db<br/>Prisma singleton"]
  end

  Pages --> DB
  Pages --> Domain
  Pages --> Shared
  Pages --> Actions
  Actions --> Agents
  Actions --> Obs
  Actions --> Domain
  Actions --> DB
  Agents --> Domain
  Agents --> Obs
  Obs --> Domain
  Obs --> DB

  style Domain fill:#dcfce7,stroke:#16a34a
```

**The one rule:** `@/domain` imports nothing. Not Prisma, not Next.js, not the logger. It
takes plain values and returns plain objects, which is why it can be unit-tested in
milliseconds and why the same grading formula can be trusted by a page, an action, a job
and an agent simultaneously.

---

## The agent layer

Five analysts live in `src/packages/agents/registry/`. They are **deterministic
TypeScript**, not LLM calls — deliberately, so you can learn the *shape* of an agentic
system without an API key or non-determinism:

```
input snapshot → reasoning trace → structured output → persisted run → human review UI
```

| Agent | Target | What it produces |
| --- | --- | --- |
| `StudentProgressSummary` | Student | Narrative report with grade-trajectory analysis |
| `AtRiskStudentDetection` | Student | 0–100 risk score and escalation recommendations |
| `AssignmentFeedback` | Submission | Draft student feedback + private teacher notes |
| `AttendanceAnomaly` | Student / Section | Absence streaks; section-wide single-day drop-offs |
| `TeacherWorkloadInsight` | Teacher | Staffing redistribution advice |

Every run persists its input snapshot, its confidence score, its **self-reported
limitations**, and its full chain-of-thought trace. Open any run at `/agent-runs/[id]` to
see all of it, and compare it against a previous run to see what changed and why.

---

## Documentation

| Doc | What it covers |
| --- | --- |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | **The git workflow this repo teaches.** Branches, commit messages, PR bodies, review habits. |
| [`fabledocs/01-how-this-app-works.md`](fabledocs/01-how-this-app-works.md) | Full architecture walkthrough: data model, layers, request lifecycle, page map. |
| [`fabledocs/02-codebase-gotchas.md`](fabledocs/02-codebase-gotchas.md) | Verified quirks and traps, and which "bugs" are deliberate teaching fixtures. |
| [`fabledocs/03-user-stories.md`](fabledocs/03-user-stories.md) | The 19-ticket backlog this repo was built from — all shipped. |
| [`fabledocs/04-what-changed.md`](fabledocs/04-what-changed.md) | Which gotchas the build fixed, which still stand, and the PRs worth reading. |
| `docs/` | Earlier learning suites. Useful, but see the "documentation drift" section of the gotchas file first. |

---

## Suggested learning path

**[Astra Learning Studio](http://localhost:3000/learn)** turns this repository into
an active beginner → foundation → mid-level → senior engineering curriculum. Work through 24 missions,
read the linked source in the browser, save your checkpoint attempt before revealing explanations, and keep personal
notes and evidence against each mission's review rubric. Your notebook stays in this
browser, independently of the demo role switcher; export Markdown for review or JSON for
backup and transfer. Completed lessons return for retrieval practice after seven days. Completion records your evidence and self-review; it does not establish a job level.

Start with the [new engineering handbook](astra%20docs/README.md) or open
[/learn/docs](http://localhost:3000/learn/docs) in the app. Its eleven guides include a beginner ramp,
worked examples, deliberate practice, an adaptable roadmap, engineering notes, practice labs,
system design, operations, career evidence, and reusable templates.
The [upskilling review report](astra%20docs/upskilling-review.md) records the latest improvements and validation.

1. Start with [your first small change](astra%20docs/beginner-start.md) and the Beginner missions if functions, the terminal, or tests are unfamiliar.
2. Use [worked examples](astra%20docs/worked-examples.md): predict a result, run it, change one thing, and explain the difference.
3. Complete a focused Foundation change with a test and a reviewer handoff.
4. Use the Mid-level missions to own a feature across validation, permissions, persistence, and failure recovery.
5. Use the Senior missions to practice design decisions, migrations, incidents, and review with another engineer.
6. Return to completed work without hints, record gaps, and apply feedback to a new variation. Use [deliberate practice](astra%20docs/deliberate-practice.md) for stage exit exercises.
