# Astra change report

This is the initial Learning Studio delivery record. See [the subsequent upskilling review](upskilling-review.md) for the expanded Beginner stage, 24-mission curriculum, new guides, retrieval practice, and latest verification.

Date: 7 September 2026

## Outcome

EduOps now includes a dedicated engineering Learning Studio at `/learn`, designed to help a junior SWE practice the implementation skills, independent delivery, and system judgment expected at mid-level and senior levels. Three parallel GPT-6 Astra subagents developed the curriculum, interface, and handbook; the coordinating agent integrated navigation, progress rules, document/source reading, and verification.

The existing school operations application supplies the problems to investigate. The new material distinguishes current behavior from proposed exercises, so a learner can identify a gap without assuming it has already been fixed.

## What changed in the app

| Capability | What you can do |
| --- | --- |
| Learning Studio | Search 18 missions by subject or code path and filter Foundation, Mid-level, or Senior work. |
| Suggested next mission | Continue available work based on recorded completion and prerequisites. All content remains open for exploration. |
| Mission guidance | Read outcomes and concepts, follow source references, execute a lab, and compare checkpoint reasoning with expandable answers. |
| Evidence notebook | Save personal notes, checkpoint answers, and verification evidence for each mission. |
| Completion rules | Mark a mission complete after adding evidence and reviewing every rubric item. Removing a criterion or evidence reopens it. |
| Portable learning record | Export Markdown for discussion or JSON for backup. Imports are validated and previewed before replacement. |
| Engineering handbook | Read eight substantial guides directly at `/learn/docs`, also available as Markdown in this folder. |
| Source reader | Open curriculum and handbook source references in the browser, with line links and related missions. Only explicitly listed repository files can be read. |
| Discoverability | Open the studio from the dashboard and the new engineering-growth navigation. |
| Responsive access | Use the learning pages on a narrow screen; keyboard users have labels, visible focus, and a skip-to-content link. |

## Curriculum inventory

The 18 missions contain approximately 27.5 hours of estimated guided practice. Estimates are planning aids; implementation, review, and stretch work may take longer. The handbook suggests an adaptable 12-week routine for spreading practice and revision over time.

| Stage | Missions |
| --- | --- |
| Foundation | Trace a request; validate at the boundary; extract pure rules; model grades and relations; prove behavior with tests; ship a reviewable change. |
| Mid-level | Enforce permission and scope; protect enrollment transactions; make jobs retry-safe; measure and remove N+1 queries; build an evidence trail; evaluate deterministic agents. |
| Senior | Threat-model trust boundaries; write an architecture decision; plan a safe migration; lead an incident; design reliable delivery; own a feature in the capstone. |

Each mission includes at least two detailed concepts, a multistep lab with a deliverable, two checkpoint questions with model reasoning, a self-review rubric, a stretch exercise, and direct code/handbook references. Prerequisites form a progression with no cycles.

## New documentation

The handbook's nine files, including its index, add approximately 9,500 words:

- [Start here](README.md): how to use the app, handbook, and notebook together.
- [Roadmap](roadmap.md): baseline assessment, weekly cadence, and stage evidence.
- [Codebase tour](codebase-tour.md): package map and four request/workflow traces.
- [Engineering notes](engineering-notes.md): practical TypeScript, validation, business rules, relational data, tests, permissions, performance, and agent evaluation notes.
- [Practice labs](practice-labs.md): eight deeper exercises with acceptance criteria, hints, model reasoning, and stretch work.
- [System design](system-design.md): concrete tradeoffs, reliability boundaries, and a staged migration exercise.
- [Operations playbook](operations-playbook.md): the deliberately failing AttendanceSummary job, debugging steps, evidence collection, and incident review.
- [Career evidence](career-evidence.md): competency criteria and a portfolio of observable engineering work.
- [Templates](templates.md): learning notes, PR, ADR, test plan, incident review, and weekly retrospective templates.

## Implementation decisions

The curriculum is typed data in `src/packages/learning/curriculum.ts`. This keeps mission content consistent across search, progression, the source reader, and tests. Notebook parsing and progression live in `src/packages/learning/progress.ts`, independently of the React interface.

Progress belongs to the learner's browser, independently of the school role selected in the header. It uses a versioned localStorage document. There is no schema migration or server mutation for learning notes. Storage errors remain visible and in-memory work can still be exported. JSON imports reject malformed records, unsupported versions, unknown missions, invalid status values, impossible rubric indexes, and completion without evidence. Unicode backups use a shared byte limit.

The handbook is rendered from the actual Markdown files in `astra docs`. The renderer supports this handbook's headings, paragraphs, links, emphasis, lists, tables, blockquotes, and fenced code. It treats raw HTML as text. Document slugs and source paths are allowlisted before filesystem reads.

No runtime dependency was added. A `typecheck` script provides a direct compiler check; the full Next.js build remains the integration gate. The optional real-browser smoke script uses Playwright supplied by the verification environment.

## Validation

| Check | Result |
| --- | --- |
| Unit and integrity suite | **147 passed, 0 failed** (`node --import tsx --test tests/*.test.ts`). Full output: [unit test log](verification/unit-tests.txt). |
| Independent Astra review | Curriculum source references, prerequisites, handbook claims, renderer compatibility, import validation, and source path boundaries reviewed. Findings were corrected. |
| Git whitespace check | `git diff --check` passed. |
| Fresh dependency install | `npm.cmd ci` succeeded. The shared machine was CPU/memory constrained and installation took 19 minutes. |
| Database setup and seed | Schema push and demo seeding succeeded. See the Windows setup note below. |
| TypeScript and production build | **Passed** on the final implementation: `npm.cmd run build` (Next.js 14.2.35), including strict TypeScript and generation of all routes. Full output: [build log](verification/build.txt). |
| Production file tracing | Verified source and handbook route manifests include the teaching files, including the linked historical user-story document. |
| Browser smoke check | **Passed** against the production server in Microsoft Edge: completion/reopening rules, persistence after reload, Admin-to-Student role switching, filters, model answers, invalid/valid imports, both export formats and their contents, stale-tab protection, all eight guides, source reading, 404 boundaries, and mobile overflow. No browser JavaScript errors. [Results](verification/browser-smoke.txt). |

Checks cover curriculum/source integrity, prerequisite ordering, evidence gating, progression, strict backup validation, Unicode round trips, and document path rejection, alongside the existing domain tests. Browser verification exercises completion, reload persistence, role switching, filters, checkpoint disclosure, import/export, guide/source pages, and mobile layout.

The first browser run timed out while returning to a background tab. Adding explicit tab focus and requiring a mounted, enabled notebook before interacting resolved that automation issue; the final run passed every assertion and exited successfully. The optional script is `tests/learning.browser.mjs`; it accepts `LEARNING_BASE_URL`, `PLAYWRIGHT_MODULE_PATH`, and `PLAYWRIGHT_CHANNEL` when Playwright/browser tooling is supplied separately.

Visual evidence: [desktop preview](verification/learning-studio-desktop.png) and [mobile preview](verification/learning-studio-mobile.png). Screenshots use an isolated test notebook. The desktop was visually inspected; the 390px mobile viewport passed the horizontal-overflow check.

## Practical limits and follow-up learning

Completion records your own assessment; the app does not execute your submitted code, judge evidence quality, or certify seniority. Ask another engineer to review selected artifacts and revisit them after feedback.

Browser storage does not synchronize across devices and can be cleared. Export backups regularly. A stale tab detects when stored work has changed, keeps its new edits in memory, and asks the learner to export before reloading; it does not silently replace the other tab's saved work. This is not a collaborative editor. The notes are learner-local and therefore do not generate school AuditEvents. A server-backed notebook with real identity, conflict handling, and retention would be a separate feature.

This remains a demo with mock cookie identity, deterministic analyst agents, and a simulated job runner. The handbook identifies current limitations such as action authorization boundaries, transaction gaps, audit durability, and bounded sweeps as practice material. Those production-hardening exercises are not represented as shipped fixes.

The unchanged dependency baseline reports four npm audit vulnerabilities (one low, three high) during installation. Dependency upgrades need their own compatibility review; this learning feature does not claim to resolve them.

The original `docs` and `fabledocs` suites remain historical references. New guides check the current implementation and avoid relying on stale line numbers. The seeded AttendanceSummary failure remains intentional.

## Start using it

Notebook storage is scoped to the browser and site origin, including the port. Use a JSON export/import when moving between the production preview on port 3100 and a development server on port 3000.

Run the normal setup from the repository README, start the app, and open `/learn`. Begin with the roadmap and the first request-tracing mission. Write your own checkpoint reasoning, attach an artifact or concrete test result, and use the rubric to decide what needs another pass.

On Windows PowerShell environments that block npm's PowerShell shim, use `npm.cmd` in place of `npm`; no execution-policy change is needed. `db:seed` resets the demo database, so reserve it for a disposable learning dataset.

In this validation environment, the first schema push returned a blank Prisma `Schema engine error` before the SQLite file existed. We created the absent `prisma/dev.db` as an empty file and retried with `TOKIO_WORKER_THREADS=1` and `RAYON_NUM_THREADS=1`; schema push and seeding then succeeded. These worker settings applied only to validation processes. Preserve an existing database; creating an empty file is only appropriate when the generated local file is absent.
