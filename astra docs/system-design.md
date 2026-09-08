# System design through concrete tradeoffs

A design exercise starts with a user outcome, a workload, and an invariant. It ends with a decision someone can implement and operate. This repository provides a useful starting point: one Next.js application, one SQLite database, deterministic agents, and a job queue that is processed from the app. The designs below are proposed extensions, not capabilities already shipped.

## Describe the current system in one page

Draw a browser request reaching a page or server action. Add the Prisma database connection, pure domain functions, audit and log writes, queued jobs, and the worker function. Show which steps occur before the request returns. Label the database as shared by operational data and observability. Mark the mock session boundary and any actor IDs supplied by callers.

Then describe the failure of each edge. A database error can affect both business writes and persisted logs. A job can be claimed and remain Running after an interruption. An action can write a grade and fail before enqueueing recalculation. An agent snapshot can preserve sensitive source facts after the original view's scope changes. These failure paths are more informative than a diagram containing only successful arrows.

## Decision 1: calculate grades and risk now or maintain projections?

The code contains direct calculations over submission facts and a GradeRecalculation job that updates derived grades. Inspect [jobs.ts](../src/packages/observability/jobs.ts) and callers of [grades.ts](../src/packages/domain/rules/grades.ts) before proposing a single source of displayed truth.

| Option | Benefit | Cost and failure mode |
| --- | --- | --- |
| Calculate from current facts per request | Simple freshness model; fewer derived records to repair | Query and calculation cost grows with data volume |
| Maintain a stored projection through jobs | Predictable reads and a place to precompute summaries | Delayed freshness, missed jobs, versioning, reconciliation |
| Cache computed results for a bounded period | Can reduce repeated work without a new domain table | Invalidation, role-aware cache keys, stale data explanations |

Exercise: choose an explicitly hypothetical workload, such as 5,000 students and 50 concurrent dashboard viewers. State that these are planning assumptions, not measured traffic. Define a freshness target and response-time target. Measure a representative local fixture before selecting a design. Specify how a user sees pending recalculation and how an operator repairs a missed update.

## Decision 2: keep jobs in the application database or add a worker service?

The current `claimJob` uses a conditional database write so competing callers cannot both claim the same runnable row. `processQueue` takes a finite set of candidates and runs them sequentially. There is no separate persistent worker deployment in this checkout.

A first extension can keep the database queue and move processing to a dedicated process. This separates job duration from browser requests while preserving inspectable job records. Before adding more workers, define leases, attempt ownership, graceful shutdown, and stale Running recovery. A simple status reset after a timeout can repeat work performed before a crash.

A broker is another option, but creates a second system to operate and a handoff from database commits to messages. Explain what problem justifies that cost. If database mutation and message publication must both happen, design an outbox: commit business state and an outbox record together, then dispatch that record with retry and deduplication. Do not call the whole flow exactly once merely because the dispatcher has a unique key.

Exercise: trace a grade save followed by a process crash before the recalculation job is created. Propose a repair for this precise gap. Define who owns retries, what identifies the work, and how reconciliation detects missing work.

## Decision 3: replace email matching with guardian relationships

[scope.ts](../src/packages/shared/scope.ts) matches Parent sessions using `guardianEmail`. Email is a free-text link in the student model. A relationship design should account for multiple guardians, multiple children, changed contact information, verification, and revoked access.

A staged proposal could add a GuardianStudent relation, populate candidate links from demo email matches, require ambiguous matches to be reviewed, and add comparison telemetry between old and new scope results. After validating the mapping, switch reads to the relation while retaining a temporary rollback path. Remove the old access dependency only after compatibility and recovery have been demonstrated.

Exercise: create fixtures for email case differences, a changed email, two guardians, and a revoked link. Specify how access changes become effective. Do not silently broaden access during backfill to make row counts match.

## A concrete migration plan exercise

Use assignment publication or guardian relationships as the subject. Write an ADR using [the template](templates.md), then produce these stages:

1. **Observe:** inventory reads, writes, counts, and invariants; add only the evidence needed to compare behavior.
2. **Expand:** add compatible schema or API fields without requiring all callers to change simultaneously.
3. **Backfill:** process bounded batches with recorded progress; define restart behavior and a way to identify ambiguous records.
4. **Verify:** compare old and new interpretations using the same fixtures, including denied access and partial failures.
5. **Switch:** move a controlled set of callers to the new path; state success and rollback thresholds before switching.
6. **Contract:** remove obsolete fields and compatibility code only when the rollback window and data validation permit it.

For this demo, `db:push` synchronizes a disposable schema. A deployment proposal must explain its migration history and data-preservation process; resetting with `db:seed` is not a production migration strategy. Any database-provider change needs a separate rehearsal of schema, queries, concurrency assumptions, and data conversion.

## Capacity planning without invented certainty

Estimate workload from dimensions: students times assignments yields possible submission rows; attendance grows by students times sections times dates; agent snapshots and log retention can grow with every operation. Write the unit next to each estimate. Distinguish average load from bursts such as publishing to a whole roster or generating all digests.

Then identify the first likely constraint and an experiment. For example, generating digests queues one job per active student, and each handler performs multiple reads. Measure one student's cost, then test a batch; do not assume linear scaling or claim a throughput number without a run. Report fixture size, hardware or environment, and observed variability.

## Review a design as an operator and a teammate

Ask what happens when the process stops at the least convenient point. Ask how to tell that it happened. Ask what action recovers it without destroying evidence. Ask whether the proposed abstraction reduces the next engineer's work or simply relocates complexity. A strong design can explain why a smaller first step is sufficient and what observation would justify the next one.
