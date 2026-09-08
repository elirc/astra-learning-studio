# Practice labs with reviewable outcomes

Each lab is a proposed exercise. Use a new branch and disposable fixtures for implementation. Start with the acceptance criteria, write your prediction, and attempt the work before consulting the hints. Submit the result with [a test plan and PR description](templates.md). A design-only result is valid where explicitly offered, but do not present it as a shipped fix.

## Lab 1: explain a grade from request to stored aggregate

**Timebox:** 90 minutes. **Anchors:** `src/app/sections/[id]/gradebook/page.tsx`, `src/app/actions.ts`, `src/packages/domain/rules/grades.ts`, `src/packages/observability/jobs.ts`.

Trace a grade submission through validation, persistence, audit, queue, recalculation, and rendering. Use a tiny hand-written fixture containing Graded, Missing, and Submitted items. Make a table of points earned and points counted, then compare your prediction with the pure function.

**Acceptance criteria:** Your trace names the actual functions and written records. Arithmetic is correct to the rule's rounding precision. You explain why queueing and recalculation are separate. You identify the authority for the actor ID and one partial failure point. No implementation change is required.

**Hint:** Path invalidation causes future rendering to fetch fresh data; it does not establish that a deferred aggregate has been recomputed.

**Model reasoning:** The submission is the immediate fact; the enrollment aggregate is a derived view updated later. To investigate a stale grade, compare the fact, the queued job, and the aggregate before changing rendering code.

## Lab 2: make blank grades an explicit policy

**Timebox:** two to three hours. **Anchors:** `src/packages/shared/schemas.ts`, `tests/schemas.test.ts`, `saveGradeAction`.

Inspect numeric coercion at the grade boundary. Write down intended behavior for zero, empty text, whitespace, negative values, nonnumeric text, infinity, and a score greater than the assignment maximum. Choose an explicit blank-input policy and implement the smallest change that supports it.

**Acceptance criteria:** Valid zero remains valid. Blank and malformed inputs behave according to the written policy. Boundary tests verify transformed values as well as success or failure. Assignment-dependent limits remain enforced after loading the assignment. The user-facing error identifies the score problem.

**Hint:** A coercion that produces a valid number may erase the distinction between a user entering zero and not entering anything.

**Model reasoning:** Runtime validation should establish both shape and intended meaning. The schema can decide whether an input was provided; the action has the database facts needed to decide whether the score exceeds the maximum.

## Lab 3: make assignment publication recoverable

**Timebox:** four to six hours; split design and implementation if needed. **Anchors:** `publishAssignmentAction`, `src/packages/domain/rules/assignments.ts`, Submission uniqueness in `prisma/schema.prisma`.

Draw the current publication steps and place a failure between the assignment status update and submission creation. Define whether the operation should roll back as a unit or resume safely after partial progress. Implement one bounded solution, or submit a design with a reproducible failure case if transaction setup exceeds your current skill.

**Acceptance criteria:** After success, each currently enrolled student has exactly one submission; waitlisted and dropped students have none created by publication. Failure does not leave an unexplained Published assignment with missing work rows. Repeating or competing publication has a specified outcome. Tests distinguish unique-row protection from complete-roster coverage. Existing Closed behavior remains explicit.

**Hint:** The current retry first evaluates the state transition. Existing-row filtering later in the function cannot help if the retry is refused before reaching it.

**Model reasoning:** The invariant is completeness plus uniqueness plus state consistency. A pure transition test proves only the state policy. Choose a transaction for a small atomic fan-out or a recoverable publication process for larger fan-out, and explain the operational cost of your choice.

## Lab 4: investigate the seeded AttendanceSummary incident

**Timebox:** two hours. **Anchors:** [operations playbook](operations-playbook.md), `prisma/seed.ts`, `src/packages/observability/jobs.ts`.

Capture the seeded Failed job before retrying. Predict and observe its attempt budget. Use source inspection to distinguish the embedded example stack path from the real handler. Reach DeadLettered, inspect evidence, then perform a controlled repair on disposable data and requeue.

**Acceptance criteria:** Record the original payload, job ID, status, attempt count, and timestamps. Explain why retrying unchanged input repeats the failure. Verify a direct retry cannot execute DeadLettered work. Explain that requeue resets budget but does not execute. A successful rerun is reported as completion of the current stub, not proof of a real attendance report.

**Hint:** The payload has both a null `runDate` and an invalid-looking section ID; the actual handler's checks determine which is detected.

**Model reasoning:** Diagnose from persisted facts before changing data. A malformed payload needs correction or rejection, not more retries. Successful status is only as meaningful as the handler's implemented work.

## Lab 5: protect one grading mutation at the server boundary

**Timebox:** four to six hours. **Anchors:** `saveGradeAction`, `src/packages/shared/auth.ts`, `src/packages/shared/index.ts`, `src/packages/shared/scope.ts`.

Choose and document the allowed grading policy using the current permission table as a starting point. Derive identity inside the action. Check permission and section ownership before mutation. Ignore or remove caller-supplied actor provenance. Keep this exercise scoped to one mutation and record other unprotected actions as follow-ups.

**Acceptance criteria:** An allowed teacher grades work in their section. A teacher cannot grade another section. A denied role cannot bypass the UI through direct invocation. The audit actor comes from the server session. Denials write no grade and enqueue no recalculation job. Tests include a guessed submission ID and a spoofed actor field. The result still states that the cookie-based session is mock authentication.

**Hint:** A role gate answers whether someone may grade in general. You need the submission's assignment and section to answer whether this is their work.

**Model reasoning:** Authorization must be applied where the write is coordinated, with resource facts loaded on the server. A shared helper is useful when it encodes that invariant clearly; an abstraction that hides the policy can make review harder.

## Lab 6: prove one job wins a competing claim

**Timebox:** three to four hours. **Anchors:** `claimJob`, `runJob`, `processQueue` in `src/packages/observability/jobs.ts`.

Create an isolated database fixture with one runnable job. Launch competing claim attempts and observe their results and the persisted row. Then inspect how `runJob` communicates skipped versus failed work to `processQueue`. Propose a discriminated result type if you find the summary ambiguous.

**Acceptance criteria:** Exactly one claim succeeds in the test scenario; attempts increment once; the persisted status is Running. A terminal job cannot be claimed. The test uses the database write condition, not a mocked array. Your write-up distinguishes successful claim exclusion from recovery after a worker crash and from exactly-once business effects.

**Hint:** The decisive condition belongs in the update's `where`, not only in a read before it. Set up a disposable database connection explicitly; the main schema hardcodes the demo database path.

**Model reasoning:** Atomic claim is one narrow guarantee. A worker can still crash after changing business data and before marking success. Recovery and idempotent side effects require separate design.

## Lab 7: finish a sweep beyond its first page

**Timebox:** four to six hours. **Anchors:** CourseworkSweep handler, `resolveSubmissionStatus`, `tests/coursework.test.ts`.

Create more than 500 overdue assignments with controlled dates and statuses. Demonstrate what the existing query visits. Design stable pagination or explicit continuation, then verify that later eligible records are eventually processed. Also consider a teacher grading an item between the candidate read and update.

**Acceptance criteria:** Work per batch is bounded and progress is observable. Every eligible fixture is eventually visited. Graded and Returned work remains protected at the write boundary under your tested race. Repeating a completed sweep does not produce new status changes. Recalculation is scheduled per affected section according to your documented policy. Measure total queries and elapsed time before and after on the same fixture.

**Hint:** A limit prevents a large scan in one invocation but says nothing about fairness between records. A candidate read condition can become stale before the write.

**Model reasoning:** Performance and correctness meet at progress guarantees. A smaller batch that repeatedly visits the same records can be fast and permanently incomplete. Use deterministic order plus continuation, then choose a conditional update to preserve a teacher's newer decision.

## Lab 8: distinguish replay, diff, and policy change

**Timebox:** three hours. **Anchors:** `src/packages/agents/core/orchestrator.ts`, registry files, `src/packages/agents/core/diff.ts`, `tests/agent-diff.test.ts`.

Run a registry function twice with an identical input object. Change exactly one fact and explain its output effect. Construct two metadata arrays of equal length with different content and inspect the current diff. Propose a version field that would distinguish a heuristic policy change from an input change.

**Acceptance criteria:** Identical inputs produce equivalent registry output. The changed fact is named and connected to a rule. The write-up describes the shallow diff's limitations. Recommendations are treated as suggestions for review, and confidence is not described as an experimentally calibrated probability. Snapshot visibility is included in the privacy review.

**Hint:** Running the full orchestrator twice can generate new IDs and timestamps or load different data. Replay the same pure registry inputs when establishing determinism.

**Model reasoning:** Determinism is conditional on the same implementation and same input. Persisting both input and policy version strengthens explanations. A visual diff is an aid for a human, not a proof that all semantically relevant data is equal.

## Review questions for every lab

Can another person reproduce the result? Which check would fail if the original problem returned? What happens after a partial failure? What did you deliberately leave for later? What did you learn from reviewer feedback? Use your answers to build [career evidence](career-evidence.md), with simulated scenarios clearly labeled.
