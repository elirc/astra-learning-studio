# Engineering notes: learn the boundary, then the abstraction

These notes describe patterns and questions visible in this checkout. Improvement ideas are exercises, not statements that the application already provides those guarantees. Use [the labs](practice-labs.md) to turn a concept into evidence.

## TypeScript: static confidence has a boundary

[tsconfig.json](../tsconfig.json) enables strict mode. This helps expose nullable values and incompatible shapes while developing. It does not validate data arriving in a request, a cookie, a JSON string, or a plain string column in SQLite.

[schemas.ts](../src/packages/shared/schemas.ts) defines runtime enums with Zod and derives several unions with `z.infer`. This reduces duplicated lists. `parseInput` converts validation issues into a message. Compare this to `as UserRole` in [auth.ts](../src/packages/shared/auth.ts): the assertion tells TypeScript what to assume; it does not prove the stored role belongs to the union.

Treat an external value as `unknown` until you establish its shape. Narrow with parsing or explicit checks. `any` in agent snapshots and job payloads lets callers reach arbitrary properties without proof. A useful refactor replaces one such boundary with a schema, then derives the internal type. Avoid a broad replacement of every `any` before understanding which shapes actually vary.

`saveGradeInput` coerces a score into a number. Explore empty text, whitespace, infinity, negative values, and a valid zero. Decide whether a blank score should become zero or produce an error; do not let coercion accidentally choose product policy. An assignment-dependent maximum belongs after the assignment is loaded, as `saveGradeAction` demonstrates.

Discriminated unions make legal states clearer. `WaitlistPromotionResult` is either a successful selection with IDs or a refusal with a reason. After checking `result.promote`, TypeScript knows which fields exist. Compare that contract with `Promise<boolean>` from `runJob`, where false can mean a handler failed or no work was claimed. A richer result could improve queue summary accuracy, but would require updating callers and tests.

## Domain rules: arithmetic is policy

[grades.ts](../src/packages/domain/rules/grades.ts) includes Graded and Returned scores, includes Missing work as zero earned points, and excludes other ungraded work from the denominator. No counted possible points produces 100%. That default protects a new student's displayed grade from becoming zero, but it also makes no evidence look like excellent evidence if consumers ignore the counts.

For 80 points earned on a 100-point Graded item plus a Missing 20-point item, the result is 66.7%. Adding an ungraded Submitted 50-point item leaves that percentage unchanged. Replacing Missing with Graded at 10/20 produces 75%. Work through these examples before editing classifications or risk thresholds.

[risk.ts](../src/packages/domain/rules/risk.ts) combines grade, attendance, and missing-work assessments. Tardies contribute 0.3 to weighted absences. Multiple severe areas can produce Critical risk; low grades below the additional threshold or sufficiently many absences can also do so. The selected primary area prioritizes grades, then attendance, then engagement. That is a policy choice, not a mathematical inevitability.

Test around thresholds: one value below, exactly at, and one above. Also test interactions: a moderate grade concern with severe attendance; two severe categories; no graded work with multiple missing assignments. A test of one category cannot establish the combined policy.

## State transitions and time

[assignments.ts](../src/packages/domain/rules/assignments.ts) permits Draft to Published to Closed, with Closed terminal. The transition rule is pure; writing the new status and creating submission rows happens in the action. A correct state table cannot by itself make a multi-write operation atomic.

[coursework.ts](../src/packages/domain/rules/coursework.ts) accepts `now` explicitly. The overdue comparison is strict: time must be later than the deadline. Graded and Returned work is protected by the rule. The handler also excludes these statuses when reading candidates, but its later writes should be examined for races with a teacher grading between the read and update.

Dates compare instants; school deadlines also involve local calendar meaning. The current digest uses a UTC week boundary. A timezone feature must define what the school means by a day or week, how forms encode the deadline, how it is stored, and how the UI displays it. Changing a formatter alone does not resolve that contract.

## Data integrity: identify the invariant first

The unique Submission pair in [schema.prisma](../prisma/schema.prisma) prevents two rows for one student and assignment. The unique Enrollment pair prevents two memberships for one student and section. Neither ensures that publication creates every required submission or that a section never exceeds capacity.

Write the invariant in plain language, then identify all paths that can violate it. For capacity, two requests may both count one free seat before either creates its enrollment. For publication, the status update can succeed before submission creation fails. For promotion, the normal enrollment backfill may not run. These examples require different fixes even though all involve enrollment data.

A transaction groups related database changes into a commit or rollback. It still needs an isolation and concurrency strategy appropriate to the invariant. Moving a read-then-write sequence into a transaction without reasoning about competing transactions is not sufficient evidence. Use the actual database in a concurrency test and explain the observed behavior.

The current actions generally call mutation, audit, and enqueue helpers sequentially. [audit.ts](../src/packages/observability/audit.ts) catches persistence errors to preserve the active workflow. Its comments use strong language about transactional or tamper-evident history, but the implementation does not establish an atomic transaction with the business mutation or cryptographic tamper evidence. Document the actual guarantee and decide which changes need stronger audit durability.

## Security: four separate questions

Ask who the requester is, whether the role can perform the operation, whether that operation is permitted on this resource, and which fields the requester may see. The demo answers identity with a selectable cookie and an admin fallback. Treat this as a local teaching mechanism.

[shared/index.ts](../src/packages/shared/index.ts) centralizes permission names and roles. [scope.ts](../src/packages/shared/scope.ts) builds query restrictions: teachers see students linked through sections they teach, students see their own record, and parents match a guardian email. Advisor scope includes advisees and students with interventions the advisor created. Admin, SchoolManager, and Viewer are unscoped in this helper. These are current policies to review, not a recommended policy for every school.

Student scope and field visibility are different. An agent can load support notes and persist a snapshot; a run detail page can reveal that snapshot. Protecting the student list does not automatically protect agent-run pages, raw metadata, support note content, aggregates, or mutation endpoints.

Several actions parse client-provided `actorId`, `authorId`, or `createdById`. Validating that an identifier is nonempty does not establish identity. The authorization lab derives the actor from the session and checks permission and resource ownership within the mutation path. With mock authentication still enabled, this improves application structure without making the system production-authenticated.

For every denial test, assert no business write, no success audit, and no follow-up job. A hidden button is a usability behavior; direct invocation verifies the server boundary.

## Testing: choose evidence for the failure

[package.json](../package.json) runs Node's test runner through `tsx` over `tests/*.test.ts`. Existing files cover domain rules, schemas, and agent diffs. A passing suite establishes the behavior those cases exercise, not full authorization, browser usability, real database atomicity, or worker recovery.

Use pure unit tests for arithmetic, state tables, sorting, and fixed-clock rules. Use boundary tests for malformed shapes and invalid enum values. Use database integration tests for unique constraints, competing claims, rollback, and deduplication. Use a focused browser check when form wiring, role visibility, or visible error recovery is the risk.

Prefer a test named after a user or system invariant: "a missing assignment contributes possible points but earns zero" explains intent better than "returns expected object". A test should fail when the behavior becomes wrong, not merely when an internal helper is renamed. Avoid asserting full snapshots of unrelated UI text for a small arithmetic change.

Use fresh fixtures and explicit cleanup. Schema-level database tests must target an isolated database rather than delete records from a shared demo. Tests of time should pass a fixed clock rather than sleep. Record expected failures separately from regressions; the seeded AttendanceSummary failure is intentional.

## Performance: measure complete work

The dashboard and detail pages load relational data and calculate results. Before optimizing, record dataset size, query count, elapsed time, returned row count, and the user-visible operation. Measure the same fixture and environment before and after. A faster result that omits authorized students is a correctness regression.

Watch for one query per student, broad relation includes, unbounded job lists, repeated aggregate calculations, and logging overhead from database writes. A Map or Set can improve in-memory lookup, but may have little impact if the database fetch dominates. Request one experiment that distinguishes those explanations.

`CourseworkSweep` takes at most 500 overdue assignments. A cap bounds one run's work, but there is no continuation cursor in that query. Repeating a capped query does not prove that records beyond the cap are eventually visited. Design stable ordering and progress tracking, and test with more than the cap.

Caching introduces a freshness contract. Grading already defers aggregate recalculation to jobs, so adding cached risk data creates another place to invalidate or recompute. State how stale a page may be, how a user recognizes pending work, and how the system repairs a missed update before choosing a cache.
