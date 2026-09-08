# A beginner ramp and an adaptable 12-week roadmap

Use this as a sequence of increasingly demanding decisions. The twelve stages can form a weekly plan, but each may take several sessions or several weeks. Prior experience, setup problems, review availability, and task scope all affect the pace. There is no fixed-hours promise of job readiness or promotion. Move on when you can demonstrate a skill, not when its reading time is complete.

## Begin here if programming is new

Start with [Your first small, tested change](beginner-start.md). It explains editor and terminal basics, checks Windows commands safely, and uses `classifyGradeScore` to show how a test catches a one-character defect. No database setup or reset is needed. Finish by writing a similar boundary test without copying the example.

Next, work through [the five worked examples](worked-examples.md). They connect numbers, arrays, objects, conditions, dates, tests, and finally a request that writes data and queues work. If a step is unclear, repeat it with a smaller input rather than skipping to the architecture material.

The ramp is complete when you can locate a function, explain its input and return value, predict a new case, make one controlled edit, run a focused test, read the failure, and inspect your own changes. Use [the deliberate-practice readiness checks](deliberate-practice.md) to choose what to repeat. Needing help at this stage gives you a practice target; it is not a reason to abandon the program.

## Establish a baseline before studying

After the beginner ramp, or immediately if you already make small code changes, attempt this diagnostic without changing application behavior. Record what you can answer and where you need a source, a hint, or another person's help. It is acceptable to leave an advanced question unresolved and return after the relevant stage.

1. Find the function that changes a grade, the database record it writes, and the job it enqueues. Explain when the displayed aggregate can become current.
2. Predict the grade for one Graded submission worth 80/100 and one Missing submission worth 20 points. Then verify with the rule. Explain the denominator.
3. Find the boundary that converts unknown form values into validated data. Explain why a TypeScript annotation alone is insufficient.
4. Find a role gate and a student scope query. Explain the different questions they answer.
5. Read the seeded failed job. Predict its next two attempts without clicking Retry.
6. Identify one place where two individually correct requests might interact incorrectly. Draw their read/write interleaving.

Score each answer 0 for a guess, 1 for a plausible explanation, 2 for an explanation backed by the correct source, and 3 for a source-backed explanation with a meaningful test or counterexample. This is a personal diagnostic out of 18, not a hiring score. Record assistance and uncertainty alongside the score. Repeat the questions after stages 6 and 12 using fresh examples and the worked answers closed.

## Separate reading from independent delivery

For each stage, first read enough to make a prediction. Then do the exercise, inspect its result, and explain a changed example with the solution hidden. Record whether you read, reproduced, adapted, or independently produced the result. A copied test that passes is useful orientation; a test you selected to expose a real failure is stronger evidence of judgment.

Reading is complete when you can summarize the idea. Practice is complete when you can demonstrate the stage's exit check and state what your evidence does not prove. Independent ownership adds scope selection, failure handling, review, and follow-through. Do not mark all three as achieved merely because a page or checkpoint was completed.

## Working agreement for every stage

Choose one outcome that fits in a small review. Start with the problem and acceptance criteria, trace the affected path, and implement from the rule or data boundary outward. Before requesting review, read the complete diff and remove unrelated work. Record commands and observed outcomes accurately; a proposed test is not a passed test.

Use the definition of done in [CONTRIBUTING.md](../CONTRIBUTING.md): relevant acceptance checks, build, tests, role verification, and audit behavior for mutations. Run reseeding checks only against a disposable database. The existing test command runs files under `tests/*.test.ts`; it is not a browser or database integration suite.

## Twelve stages: a flexible weekly plan

| Stage | Focus and repository anchors | Deliverable and independent exit check |
| --- | --- | --- |
| 1 | Explore `src/app/actions.ts`, `prisma/schema.prisma`, and `src/packages/domain/rules/grades.ts` | Lab 1: a grading trace and worked arithmetic. Explain five layers without reading notes. |
| 2 | TypeScript and boundaries: `src/packages/shared/schemas.ts`, `tests/schemas.test.ts` | Lab 2: one boundary hardened with positive and negative evidence. Explain runtime validation versus static typing. |
| 3 | Rules and time: `coursework.ts`, `assignments.ts`, corresponding tests | A state table and boundary tests. Explain equality at the deadline and why terminal states matter. |
| 4 | Data and transactions: enrollment, publication, schema unique constraints | Lab 3: reproduce or model a publication failure and propose a recoverable change. Explain atomicity and uniqueness separately. |
| 5 | Authorization: `auth.ts`, `scope.ts`, `shared/index.ts`, actions | Lab 5: an action-and-resource authorization matrix and one protected mutation. Demonstrate allowed and denied direct requests. |
| 6 | Debugging and operations: `observability/jobs.ts`, `/jobs`, `/logs` | Lab 4: a complete seeded incident record. Repeat the baseline with new inputs and identify one independently improved skill and one unresolved gap. |
| 7 | Testing across layers: `tests/`, job claim, mutation side effects | Lab 6: an integration test of competing claims or rollback. State why mocks alone cannot establish the invariant. |
| 8 | Performance: dashboard queries, student scope, sweep limit | Lab 7: a measured query or pagination improvement with correctness checks. Compare before and after on identical fixtures. |
| 9 | Explainable automation: agent orchestrator, registry, diff | Lab 8: a deterministic replay and provenance review. Distinguish input change, policy change, and persistence change. |
| 10 | System design: jobs, digests, shared database | A short ADR for one design choice and a staged migration proposal from the design guide. Include rollback criteria. |
| 11 | Delivery and collaboration: one capstone across two or more layers | A small implementation PR, test plan, and reviewer response record. Explain one decision you revised after feedback. |
| 12 | Synthesis and communication | A five-minute demo, an incident or design walkthrough, and an evidence packet. Repeat baseline; choose the next skill from evidence. |

## Adapt the route to your starting point

If asynchronous JavaScript and relational modeling are new, spend extra time on stages 1 through 4. A promise represents a result that will be available later; a relation connects stored records. Draw the order of awaited operations and a relationship between two tables before introducing more abstractions. Implement one small rule change before attempting transaction recovery.

If you already ship ordinary features, compress syntax practice and spend time on concurrency, missing authorization, partial failures, and measuring performance. Your goal is to show that you can find the failure between individually reasonable components.

If you lead projects but are new to this stack, trace one complete workflow, then focus on scope selection, migration sequencing, and reviewer clarity. Ask another engineer to try the runbook without your help. Their stumbling points are evidence about the document, not about their ability.

## Capstone choices

Choose one; avoid combining all of them into a large rewrite.

- Reliable assignment publication: define a consistency contract, make publication and submission creation recoverable, and test failure after the state transition.
- Authorized grading: derive identity on the server, validate teacher ownership, record trustworthy audit provenance, and cover denial paths.
- Recoverable queue: introduce one explicitly designed recovery mechanism for stale Running jobs, with duplicate-side-effect analysis and a runbook.
- Complete coursework sweeps: process more than 500 overdue assignments with deterministic continuation and prove that later records are eventually visited.

The capstone is complete when another engineer can identify the problem, inspect the change, reproduce its evidence, and understand the remaining risks. If you cannot explain how to verify the whole change, reduce its scope while retaining one complete user outcome. Time spent is context for planning, not the acceptance criterion.

## A useful weekly rhythm

Begin with a question you cannot yet answer. Spend the first session tracing and writing a failing example; spend the next implementing and testing; spend the final session reviewing and explaining. Keep a short list of adjacent issues so you can finish your current story without forgetting them. Use [the weekly template](templates.md) and ask for feedback on one specific behavior, such as whether your rollback plan is actionable.
