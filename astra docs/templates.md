# Copyable engineering templates

Keep each template proportional to the work. A small change needs a short explanation; a risky migration needs enough detail for another person to review and operate it. Replace placeholders with facts. Mark proposed checks as pending until they have actually run. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) for the repository's contribution workflow.

## Pull request

```markdown
## What and why
When [concrete trigger], the current behavior is [problem].
This change makes [observable result] so that [user or system benefit].

## Approach
The invariant is [plain-language rule].
I changed [relevant boundaries] because [reason].
I considered [alternative] and rejected it because [specific tradeoff].

## Validation
- [Command or click path]: [observed result and fixture].
- Allowed role/resource: [observed behavior].
- Denied role/resource: [observed behavior and absence of side effects].
- Failure or retry case: [observed behavior].

## Risks and follow-ups
[Remaining limitation and practical impact.]
[Follow-up with bounded scope, if needed.]

## Review focus
Please examine [one or two decisions that need another perspective].
```

## Architecture decision record

```markdown
# ADR: [short decision title]

Status: Proposed / Accepted / Superseded
Date: [date]
Related source: [paths]

## Context
[Problem, affected users, current behavior, workload assumptions.]

## Required properties
- [Invariant or measurable outcome.]
- [Recovery, privacy, or compatibility requirement.]

## Options
| Option | Benefit | Cost or failure mode |
| --- | --- | --- |
| A | ... | ... |
| B | ... | ... |

## Decision
[Chosen option and why these constraints favor it.]

## Consequences
[New complexity, behavior changes, operational responsibilities.]

## Rollout and rollback
[Compatible first step, validation gate, switch, rollback trigger.]

## Revisit when
[Observation that would invalidate an assumption or justify the next step.]
```

## Incident or local failure drill

```markdown
# [Incident title]

Type: Local drill / Actual incident
Date and timezone: [value]
Owner: [person]
Status: Investigating / Mitigated / Resolved

## Impact
[Observed effect and affected scope; distinguish unknowns.]

## Evidence
- Job/entity ID: [value]
- Original status and attempts: [value]
- Original payload/error: [relevant data, with sensitive fields omitted]
- Related logs/audits: [references]

## Timeline
| Time | Observation or action | Evidence |
| --- | --- | --- |
| ... | ... | ... |

## Cause and contributing conditions
[Trigger, failure mechanism, and why safeguards did not contain it.]

## Mitigation and verification
[Action taken, resulting state, and how success was checked.]

## Follow-ups
| Action | Owner | Acceptance criterion | Target date |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Learning
[What improved diagnosis and what made it harder.]
```

## Test plan

```markdown
# Test plan: [behavior]

## Contract
[Invariant in one sentence.]

## Scope and fixtures
[Affected layers; isolated data setup; explicit clock if relevant.]

| Scenario | Input or setup | Expected behavior | Best test layer |
| --- | --- | --- | --- |
| Happy path | ... | ... | ... |
| Boundary | ... | ... | ... |
| Denied request | ... | No business write or success side effect | ... |
| Duplicate or competing request | ... | ... | ... |
| Failure between steps | ... | ... | ... |
| Retry or recovery | ... | ... | ... |

## Observed results
[Commands, fixture size, outcome, and any failure still unresolved.]

## Limits
[What these tests cannot prove and the remaining manual check.]
```

## Weekly learning record

```markdown
# Week [number]: [question or outcome]

## Starting question
[What I could not confidently explain.]

## Prediction
[Expected behavior before running the experiment.]

## Work and evidence
- Source traced: [paths and functions]
- Experiment or change: [bounded description]
- Observed result: [test, measurement, or review evidence]

## Decision
[Chosen approach, alternative, and reason.]

## Feedback
[Who reviewed which question; what I changed or still disagree with and why.]

## Reflection
One improvement: [specific behavior]
One gap: [specific behavior]
Next week: [small outcome and exit check]
```

## Source trace worksheet

```markdown
# Trace: [user operation]

Entry route and form: [path]
Server action: [function]
Identity source: [how established]
Runtime validation: [schema/check]
Role and resource authorization: [where enforced or gap observed]
Domain decision: [function and invariant]
Database reads: [facts required]
Database writes: [records and order]
Audit/log behavior: [what survives failures]
Queued work: [type, payload, handler]
Visible result: [view and freshness]
Partial failure to investigate: [step and resulting state]
```

## Reviewer checklist

- Can I reproduce the original problem from the description?
- Does the implementation enforce the stated invariant at the relevant boundary?
- Are identity, permission, and resource ownership distinct and explicit?
- What happens when two requests overlap or a process stops between writes?
- Do the checks exercise the actual risk without coupling to incidental structure?
- Are operational evidence and recovery behavior adequate for the change?
- Are claims about performance, security, or completion supported by observed results?
- Is the change small enough to review, and are follow-ups concrete?
