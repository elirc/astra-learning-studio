# Practice until you can do it independently

Reading makes a solution familiar. Engineering requires producing and checking a solution when the answer is not already visible. Use the guides as support, then gradually remove that support. A difficult attempt is useful when it reveals exactly what to learn next; repeating the same guess without new evidence is not.

## Use checkpoints in three passes

First, answer with the solution hidden. Write a concrete prediction and your reason, even if uncertain. A checkpoint about stale grades should name a record or operation, not just say "check the backend." Record whether you used source code, documentation, a hint, another person, or an assistant.

Second, consult the smallest useful help. Find the relevant function before revealing an entire worked answer. Compare your reasoning with the code, then run a small experiment. If you ask an assistant, request a question or counterexample first: "My prediction is X because Y. Show me an input that would challenge it without giving the full solution."

Third, close the explanation and solve a nearby problem. After the 90-point classification boundary, try 70. After one Missing submission, try two differently weighted items. After one failed job, ask what happens if the worker stops while Running. This checks **transfer**: whether you can use the idea in a changed situation.

The studio's completion record is your report of learning evidence. A checkmark is not independent proof of competence. Keep it connected to a test, trace, reviewed patch, or explanation you can reproduce.

## Record the assistance level

| Level | What you actually did | Next useful action |
| --- | --- | --- |
| Read | Followed an explanation and recognized the result | Predict a new case before looking at its answer. |
| Reproduced | Copied or closely followed a worked solution | Repeat with the solution hidden. |
| Adapted | Solved a changed example with occasional help | Explain why the original solution needed to change. |
| Independent | Chose an approach, implemented it, and verified it without a solution | Ask someone to challenge an assumption. |
| Reviewed ownership | Another person could reproduce and assess your complete result | Apply the skill to a different workflow or constraint. |

These are descriptions of a particular attempt, not labels for you as a person. You may independently understand grade arithmetic while needing help with database fixtures. Record those separately so the next practice session targets the real gap.

## Return to a skill after a gap

Try a short review at the next session, again a few sessions later, and once more after working on another topic. Adjust that spacing to what you remember; this is a practice schedule, not a scientifically calibrated retention claim. Start the review without rereading your notes.

For the first review, reconstruct the function's contract and one boundary test. For the second, change the input or requirement. For the third, connect it to another layer: explain how a validated grade becomes stored data or how a pure enrollment decision can still race. If you need the answer immediately, reread only the missing part and schedule another independent attempt.

A useful notebook entry contains the question, prediction, evidence, mistake, assistance used, and next variation. Use [the weekly template](templates.md); a few precise sentences are enough. Copying whole lessons into your notebook adds volume without showing recall.

## Debug with competing explanations

When a result is wrong, write down what you expected and what happened. Create the smallest input that still shows the difference. Then name two explanations and an observation that distinguishes them.

For example: "90 returns Good." Hypothesis A: the Excellent comparison excludes equality. Hypothesis B: I edited one file but am executing another. Inspect the condition and confirm the test import and saved file. Change one thing, rerun the same case, and record the outcome. Avoid changing expectations simply to make a failing test pass.

For a stale section average, distinguish source data, queued work, and derived data. A fresh page may still read a stale derived grade. The [worked workflow example](worked-examples.md) shows the trace, and the [operations playbook](operations-playbook.md) expands it into an investigation.

Ask for help when you cannot state the next discriminating observation, rather than spending the entire session making unrelated edits. A strong help request includes the command, first useful error, smallest reproduction, expected behavior, and what you already ruled out. Remove private data from shared examples.

## Readiness exercise A: foundational code fluency

With the worked answers closed, read [grades.ts](../src/packages/domain/rules/grades.ts). Calculate a result containing Graded, Missing, and Submitted work. Explain every counted point. Add a boundary test you chose yourself, deliberately introduce a relevant defect on a practice branch, show that the test fails, and restore your edit.

You are ready to move on when you can explain the input, output, branch order, expected value, and failure message without copying the guide. If syntax is the obstacle, return to [the beginner lesson](beginner-start.md). If arithmetic or status meaning is the obstacle, repeat the second worked example with new numbers.

## Readiness exercise B: junior feature ownership

Choose a small behavior in assignment or coursework rules. Write acceptance criteria before coding: examples that a reviewer can check. Implement the smallest change, verify boundary and refusal cases, inspect your diff, and write a short PR draft explaining why the change is useful.

Ask a reviewer to change one requirement. Explain which tests and callers need attention before editing. Readiness here means you can carry a bounded change from request to evidence and respond to feedback; it does not mean every unfamiliar task becomes easy.

## Readiness exercise C: work across system boundaries

Trace grading or enrollment from request to database and follow-up work. Identify the identity source, role permission, resource ownership, database invariant, and one partial-failure window. Choose one demonstrated gap and build an integration check using disposable data. A **database invariant** is a statement that must remain true, such as one submission per student and assignment.

You should be able to distinguish which guarantee comes from input validation, a pure rule, a database constraint, or a conditional write. If your explanation relies on "the UI prevents it," attempt a direct-request test in the isolated demo. Move on when another engineer can follow your evidence and you can name its limits.

## Readiness exercise D: growing toward broader ownership

Take a capstone problem from [the roadmap](roadmap.md). Define the intended outcome, constraints, alternatives, failure behavior, rollout, and recovery. Implement a coherent slice and have someone else follow the test plan or runbook without your assistance. Revise the unclear parts. State which observation would make you revisit the design.

This is practice toward senior responsibilities, not a title certification. Professional seniority involves repeated judgment, collaboration, delivery, and consequences in a real team. Use [career evidence](career-evidence.md) to describe your actual work without turning a local exercise into invented production impact.

## End each session with a next action

Write one thing you can now do independently, one unresolved question, and one small experiment for next time. Choose depth over checking off more pages. A session that replaces "I think retries are safe" with a precise explanation of the remaining crash window is meaningful progress, even if it produces no new feature.
