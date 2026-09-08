# Build evidence of engineering growth

Progress toward mid-level or senior work is visible in the scope you can own and the quality of your decisions. It is not established by finishing a reading list, accumulating commits, or using advanced terminology. This repository can produce strong practice evidence when you clearly label what was simulated, measured locally, reviewed by another person, and actually implemented.

## A competency ladder for self-review

| Dimension | Developing foundations | Reliable feature ownership | Broader technical judgment |
| --- | --- | --- | --- |
| Problem framing | Restates the requested UI change | Defines behavior and acceptance criteria | Resolves ambiguity and chooses scope using impact and constraints |
| Code understanding | Finds the relevant function | Traces callers, writes, and side effects | Spots cross-path inconsistencies and changing assumptions |
| Implementation | Makes a happy path work | Handles boundaries and preserves invariants | Chooses staged changes that others can extend and operate |
| Testing | Adds examples for intended behavior | Selects unit, boundary, and integration evidence | Finds failure modes between layers and tests the key risk efficiently |
| Security | Uses validation and role controls | Enforces identity and resource authorization at writes | Reviews data exposure across snapshots, logs, aggregates, and evolving policy |
| Operations | Reads an error and retries | Correlates evidence and recovers deliberately | Designs detection, recovery, and prevention into the change |
| Communication | Describes what changed | Explains why and records checks honestly | Makes tradeoffs reviewable and improves decisions through feedback |
| Collaboration | Responds to review | Requests focused feedback and closes the loop | Helps others reason and reduces ambiguity across the work |

These columns are reflection prompts, not universal job-level definitions. Expectations differ between teams. Use specific examples and feedback rather than assigning yourself a title from this table.

## Create a small evidence packet

Keep five artifacts: one request trace, one reviewed implementation, one failure investigation, one design decision, and one retrospective. Link each to exact source paths and meaningful test evidence. For a code change, include the behavior before and after, a rejected alternative, validation, and a limitation. For a design proposal, state explicitly that it remains a proposal.

A useful example is: "In a local concurrency fixture, I demonstrated that a conditional job claim had one winner, then identified that it did not cover recovery after a crash. I proposed attempt ownership and documented duplicate-effect risk." An inflated version would claim that the exercise delivered exactly-once processing for a production fleet. Avoid the latter even if the former sounds less dramatic.

## Record measurements responsibly

Capture the fixture size and environment alongside timing or query counts. A percentage improvement without a workload definition is hard to evaluate. Do not turn local simulated users into customer adoption, a seeded failure into an actual outage, or a review exercise into a team leadership claim.

You can still describe the work confidently: "Implemented server-side grading authorization in the demo, with denied-role and cross-section integration checks" is concrete if you actually completed those checks. "Designed a migration from email-linked guardians to explicit relationships" is accurate for a reviewed design even when no migration shipped.

## Conduct a weekly self-review

Choose one decision you made well, one point where you guessed, and one piece of feedback you acted on. Ask whether your test would catch the original problem and whether your explanation lets another person reproduce the result. Identify a next action small enough to complete in a week.

Seek feedback on a specific question: whether the authorization matrix covers a resource boundary, whether a transaction proposal handles concurrent requests, or whether the runbook is usable without your help. General requests such as "Is this senior-level?" usually yield less actionable evidence.

## Practice a five-minute technical walkthrough

Spend one minute on the problem and reproduction, two on the decision and implementation, one on validation, and one on limitations and feedback. Use a single workflow: publication, grading, queue recovery, or sweep progress. Be ready to explain what would change at a larger scale and which part you would measure before redesigning.

For an interview-style discussion, separate what you observed from what you infer. If asked about a production system you have not operated, use the local exercise as a reasoning example and name its limits. Clear uncertainty is a useful professional skill when paired with a concrete way to resolve it.
