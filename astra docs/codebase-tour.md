# Trace the system before changing it

The app combines Next.js pages and server actions with Prisma over SQLite. The packages are source directories with TypeScript import aliases, not separately deployed services. Read [tsconfig.json](../tsconfig.json) to resolve `@/domain`, `@/agents`, `@/db`, `@/observability`, and `@/shared`. Do not assume an alias proves its directory exists; inspect the checkout.

## Map of responsibilities

| Location | Responsibility | First question |
| --- | --- | --- |
| `src/app/` | Route pages, server-rendered views, form wiring | Which user and resource can reach this view? |
| `src/app/actions.ts` | Input parsing, mutation coordination, audit calls, enqueueing, invalidation | What is trusted, and what happens if step three fails? |
| `src/packages/domain/rules/` | Grade, enrollment, risk, assignment, coursework, workload, digest decisions | Can I explain the rule with plain inputs and outputs? |
| `src/packages/shared/schemas.ts` | Zod validation and derived types | What values actually arrive at runtime? |
| `src/packages/shared/auth.ts` and `scope.ts` | Mock identity and student query restrictions | Is this identity trustworthy, and whose rows are selected? |
| `src/packages/shared/index.ts` | Permission table and shared formatting/parsing helpers | Is a permission enforced at the mutation boundary? |
| `src/packages/agents/` | Context loading, deterministic heuristics, stored runs and diffs | Which input facts support each recommendation? |
| `src/packages/observability/` | Jobs, logs, audit events, notifications, timeline | What evidence survives a partial failure? |
| `prisma/schema.prisma` and `seed.ts` | Data contract and resettable demo scenario | Which invariants does the database enforce? |
| `tests/` | Node test runner cases for rules, schemas, and agent diff | Which integration behavior is outside this suite? |

## Trace 1: grade a submission

Start at [the gradebook page](../src/app/sections/[id]/gradebook/page.tsx). Find the form handler and follow it to `saveGradeAction` in [actions.ts](../src/app/actions.ts).

The action parses `saveGradeInput`, loads the submission with its assignment, and rejects a score larger than `pointsPossible`. It writes the score, feedback, Graded status, grader ID, and timestamp. It calls `recordAuditEvent` with before and after state, optionally including the agent run and whether the draft was accepted verbatim. It then enqueues a GradeRecalculation job and invalidates several paths.

Follow `GradeRecalculation` into [jobs.ts](../src/packages/observability/jobs.ts) and then [grades.ts](../src/packages/domain/rules/grades.ts). Write down exactly which aggregate record the handler updates. Finally, find which view reads that aggregate and which view calculates from submission rows. This distinction explains why two views can briefly represent different freshness levels.

Questions to carry through the trace: Who supplied `actorId`? Where is teacher ownership checked? If the grade write succeeds but enqueueing fails, what state remains? Does invalidating a path execute the queued job? What does the audit helper do when its insert fails? Answer from code rather than from a reassuring function name.

## Trace 2: fill a class, then promote a waitlisted student

Read [enrollment.ts](../src/packages/domain/rules/enrollment.ts), then `enrollStudentAction`, `dropStudentAction`, and `promoteFromWaitlist` in actions.ts. Enrollment checks duplicate membership, student eligibility, section state, teacher state, and capacity. Full sections may produce a Waitlisted row.

Promotion selects eligible candidates by queued time and then enrollment ID, updates the existing enrollment row, records an audit event, and queues follow-up work. The database has a unique pair of student ID and class section ID. This prevents duplicate membership rows; it does not express a maximum number of Enrolled students.

Compare ordinary enrollment's published-work backfill with the promotion path. They are separate code paths, so behavior in one does not establish behavior in the other. A strong review asks whether a promoted student receives the submission rows that a direct late enrollee receives. Write a regression scenario before proposing a shared helper.

## Trace 3: run a deterministic agent

Follow `runAgentAction` into [orchestrator.ts](../src/packages/agents/core/orchestrator.ts). It creates a Pending run, loads context according to the agent and target, calls a registry function, and persists evidence about the run. The five registry modules implement StudentProgressSummary, AtRiskStudentDetection, AssignmentFeedback, AttendanceAnomaly, and TeacherWorkloadInsight.

For AtRiskStudentDetection, inspect the loaded submissions, grade calculation, absence and tardy counts, active intervention count, and keyword matching over notes. The registry transforms those facts into structured findings and recommendations. Compare that heuristic with `calculateStudentRisk` used elsewhere; do not assume all risk presentations share a single scoring policy.

Then read [diff.ts](../src/packages/agents/core/diff.ts) and [the run detail page](../src/app/agent-runs/[id]/page.tsx). Recommendation identity is based on action text. Metadata comparison is shallow and summarizes arrays by length. An unchanged diff is useful evidence, but equal array lengths do not prove equal array content.

## Trace 4: generate a guardian digest

`generateDigestsAction` queues one GuardianDigest job per active student. The handler loads enrollment, coursework, attendance, upcoming assignments, Shared support notes, and an active plan, then calls [digest.ts](../src/packages/domain/rules/digest.ts). It upserts by student and week. Regeneration returns an existing digest to Draft and clears its sent timestamp.

`approveDigestAction` changes status to Sent and records an audit event. There is no mail transport behind that status. Discuss what a real delivery lifecycle would need: approval, content version, attempted delivery, provider acknowledgment, and failure evidence.

## Data relationships to sketch

Draw User to Student and Teacher, Course to ClassSection, and the Enrollment join between Student and ClassSection. Then add Assignment to ClassSection and Submission to Assignment plus Student. Attendance relates a student, section, and date. SupportNote and InterventionPlan attach context to a student. Jobs and agent runs connect operations to entity identifiers; logs and audits preserve different kinds of evidence.

In [schema.prisma](../prisma/schema.prisma), locate uniqueness for enrollment, submission, attendance, weekly digest, and notification deduplication. Mark status columns stored as strings and JSON stored as text. The schema is part of the application contract, but comments listing legal states do not validate incoming values.

## Reading habits that prevent wrong fixes

Search the symbol, then every caller, then the stored fields it uses. For example:

```powershell
rg -n "saveGradeAction|GradeRecalculation" src tests
rg -n "calculateSectionGrade" src tests
rg -n "canPerformAction|buildStudentScope" src/app
git log -p --follow src/packages/domain/rules/enrollment.ts
```

The first three commands show current code relationships. The last can explain historical intent if that history is present. Old documents and comments are hypotheses: verify them against current executable behavior. `compareByRiskSeverity`, for example, describes an ID tie-break in its comment but its function compares severity, grade, and absences. Identify whether a caller supplies the final tie-break before declaring the overall sort unstable.
