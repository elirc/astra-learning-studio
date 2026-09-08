# Astra upskilling review and improvements

Date: 7 September 2026

## Purpose

This pass focuses the app on one outcome: helping a complete beginner or junior software engineer build the skills to own changes independently, then practice the wider decisions and responsibilities associated with mid-level and senior work. Three GPT-6 Astra subagents developed and reviewed the curriculum, teaching material, and learning interface alongside the coordinating agent.

The school application is the practice environment. Its operational features provide code and failure scenarios to investigate; the learner's development is the main experience.

## Review findings and changes

| Finding | Improvement | Why it helps |
| --- | --- | --- |
| The first lesson assumed familiarity with functions, Git, tests, and asynchronous code. | Added six Beginner missions before the existing Foundation path. | Gives a new learner smaller steps before tracing server actions or reasoning about transactions. |
| The app opened on school operations. | `/` now opens `/learn`; the original dashboard lives at `/lab`. Navigation and branding put learning first, with sample application links inside an expandable practice-lab section. | Makes the intended activity clear and reduces unrelated choices at the start. |
| Explanations were available without a dedicated place to attempt the question. | Every checkpoint now has a saved answer field before its collapsed explanation. | Supports prediction, comparison, and recording gaps in reasoning. |
| Completion did not suggest when to revisit a skill. | Completed missions become due for retrieval practice after seven days, ordered by oldest practice. | Encourages returning to material after a gap and explaining it again. |
| A true beginner needed concrete examples of the development loop. | Added three guides with approximately 4,300 words, including five worked lessons. | Shows actual inputs, expected results, small edits, failing tests, and independently chosen variations. |
| A reading schedule could be mistaken for readiness. | Revised the roadmap and added stage exit exercises and assistance-level reflection. | Distinguishes reading, reproducing, adapting, independently solving, and acting on review. |

## What to use

The curriculum now contains **24 missions across four stages**, with six missions in each stage:

| Stage | Practice |
| --- | --- |
| Beginner | Terminal and Git; values and functions; branches and types; arrays, objects, and null; async work and errors; a first function and regression test. |
| Foundation | Request tracing, input validation, pure rules, data modeling, meaningful tests, and a reviewer handoff. |
| Mid-level | Authorization, database invariants, concurrency, retry safety, performance measurement, observability, and deterministic agent evaluation. |
| Senior | Threat modeling, architecture decisions, schema evolution, incidents, durable delivery, and ownership of a complete feature. |

Mission estimates total approximately 32 guided hours. They are planning estimates for the exercises, not a schedule for attaining a job level. Implementation, repetition, feedback, and work in a team require additional practice.

The handbook now has **11 guides**. Start with:

- [Your first small, tested change](beginner-start.md): Windows commands, terminology, and a database-free first exercise.
- [Worked examples](worked-examples.md): averages, grade semantics, time boundaries, enrollment eligibility, and a full grade-saving workflow.
- [Deliberate practice](deliberate-practice.md): using hints, debugging with competing explanations, independent variations, and readiness exercises.
- [Updated roadmap](roadmap.md): selecting a starting point and gradually increasing scope.

The new examples were checked against the repository's actual grade, coursework, and enrollment functions. Proposed application changes and integration tests remain explicitly identified as exercises.

## Learning record and compatibility

Checkpoint answers and the last retrieval-practice date are part of the existing browser notebook. They survive reloads and JSON backup/restore, and are included in Markdown exports. Recording a retrieval practice requires a completed mission and a nonempty attempt at each checkpoint. The app records the learner's report; it does not automatically assess answer correctness.

Existing version-1 notebooks remain supported. The original 18 mission IDs and rubric arrays are unchanged. Older records receive empty checkpoint answers and no retrieval date. Adding the Beginner stage changes the curriculum denominator to 24; existing completions remain completed. Beginners are recommended first for an incomplete path, while all lessons remain accessible.

The import limit is now 16 MB to accommodate the expanded curriculum and answers. The allowed field lengths are unchanged for notes and evidence; checkpoint answers allow 5,000 characters each. A maximum-size escaped notebook covering all 24 missions was independently checked at approximately 11.53 MB. Browser storage can still run out before this import limit; the interface preserves edits in memory and offers export when saving fails.

The existing protections against malformed imports, accidental replacement, and stale-tab overwrites remain. A retrieval date postpones the reminder by seven days; reopening a mission excludes it from completed-work reviews until it is completed again. A later completion takes precedence over an older review date.

The dashboard route retains its original behavior. Existing action paths also invalidate `/lab` so the relocated practice dashboard can refresh after relevant mutations. No school policy, database schema, seed record, or dependency version was changed in this pass.

## Verification

The following checks ran against the completed changes.

| Check | Result |
| --- | --- |
| Focused learning tests | **24 passed**, including legacy import, retrieval fields, review timing, curriculum integrity, and handbook/source links. Rechecked after the final guide-link edits. [Output](verification/upskilling-learning-tests.txt). |
| Independent Astra review | All original 18 mission IDs and rubric arrays preserved; legacy completions, sparse-answer handling, maximum backup size, review dates, and example outputs checked. |
| Full test suite | **153 passed, 0 failed**. [Full output](verification/upskilling-unit-tests.txt). |
| TypeScript | **Passed**: `npm.cmd run typecheck`. |
| Production build | **Passed** on the final implementation, including strict TypeScript and all routes. [Output](verification/upskilling-build-final.txt). |
| Production document tracing | All three new guides are included in the handbook route's runtime file manifest. |
| Whitespace check | Passed with `cr-at-eol` enabled for the repository's existing CRLF files. |
| Real browser checks | **13 scenario groups passed, exit 0**, using Microsoft Edge against the final production build. No browser page errors or horizontal overflow at 390px. [Output](verification/upskilling-browser.txt). |

Browser checks cover the home-page redirect and Beginner entry point, legacy notebook import, answering the second checkpoint first and reloading, explicit explanation disclosure, completion/evidence gates, role switching, filters, JSON and Markdown exports including answers, simulated seven-day reviews, reopening work, stale-tab preservation, all eleven guides, source/unknown-path handling, the relocated lab dashboard, and mobile rendering.

Visual evidence: [desktop](verification/upskilling-desktop.png), [mobile](verification/upskilling-mobile.png), and [checkpoint practice](verification/upskilling-checkpoints.png). The desktop and checkpoint views were visually inspected; the mobile view renders in one column and passes the width check. Test notebooks and cookies were isolated from the learner's browser.

## Practical learning limits

The app supports practice, reflection, and evidence collection. It does not execute submitted exercise code, automatically grade free-text answers, verify that work was completed without help, or certify professional seniority. Use a reviewer and changed requirements to challenge your understanding.

Notes remain local to the browser and origin, including the port. Export a JSON backup before switching machines or origins. The learning pages still share the sample app's server layout, so the browser app requires a prepared local demo database. The beginner function-and-test exercises work without one and do not ask the learner to reset existing data.

The original implementation and its earlier verification are preserved in [the first change report](report.md). This report describes the subsequent beginner-to-senior refinement.
