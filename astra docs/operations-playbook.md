# Operations playbook: investigate a job, preserve evidence, recover deliberately

This runbook uses the demo application's seeded failure as a local incident drill. It does not imply a real outage or real student impact. Use a disposable database, and record observations before changing anything. `npm run db:seed` deletes application data and rebuilds the scenario; it is a reset, not an incident recovery command.

## First response

Open `/jobs` and identify the affected job by ID, type, status, attempts, maximum attempts, payload, error, and timestamps. Correlate that ID in `/logs`. Use `/audits` for attributed decisions such as a human requeue, and `/notifications` for relevant dead-letter notifications. These views serve different purposes: a log describes execution, an audit describes a recorded action, and a notification brings an event to a user.

Write a two-sentence status update: what is failing and what is known about impact. For this drill, a suitable statement is: "The seeded AttendanceSummary job has failed with a null-date error. The job handler is a teaching stub, so this demonstrates queue failure behavior rather than a confirmed missing production attendance report."

Do not infer the number of affected students from the existence of one error row. Determine which business operation is implemented and which records changed.

## Seeded failure facts

[prisma/seed.ts](../prisma/seed.ts) creates an AttendanceSummary job with status Failed, attempts 1, maximum attempts 3, and this payload shape:

```json
{
  "sectionId": "some-invalid-id",
  "runDate": null
}
```

The linked `classSectionId` on the job is set separately to the seeded math section. That relational field does not correct the JSON payload's `sectionId`.

The error contains an illustrative path, `C:\packages\jobs\attendance.ts:42:25`. The current handler is actually the AttendanceSummary case in [src/packages/observability/jobs.ts](../src/packages/observability/jobs.ts). It deliberately throws a TypeError when `runDate` is null or undefined. It only checks that `sectionId` is present; it does not load and validate that section or generate a real summary.

This is an exercise in reading the current implementation instead of chasing an embedded stack string as if it were a source location in your checkout.

## Predict the state transitions before clicking

| Starting state | Operation | Expected result for unchanged seeded payload |
| --- | --- | --- |
| Failed, attempts 1/3 | Retry | Claim increments attempts to 2; handler fails; status returns to Failed |
| Failed, attempts 2/3 | Retry | Claim increments attempts to 3; handler fails; status becomes DeadLettered |
| DeadLettered, attempts 3/3 | Direct retry | Execution refused; no new handler attempt |
| DeadLettered, attempts 3/3 | Requeue | Status Queued; attempts reset to 0; error and execution timestamps cleared |
| Queued, attempts 0/3 | Retry or queue processing | A new execution occurs and evaluates the current payload |

If you use Process Queue, other runnable jobs can execute too. Prefer the individual Retry action while learning one job's behavior. Queue processing takes a snapshot of candidates; jobs created during that drain may require a later drain.

## Controlled recovery exercise

1. Copy the job's original fields into the incident template, including the full error and payload. Record the exact time of your observation.
2. Confirm the code path and reproduce the next expected failure. Record observed state rather than assuming the UI refreshed successfully.
3. Reach DeadLettered and verify that a direct retry does not spend another attempt. Inspect available notifications and execution logs.
4. In the disposable demo database, use `npm run db:studio` to inspect the BackgroundJob row. For a repair exercise, replace the payload section ID with the job's real linked section ID and provide an explicit valid ISO date string for `runDate`. Record before and after values. This manual payload edit is a drill step and is not automatically an audited application action.
5. Requeue through `/jobs`. Verify attempts are zero and a `job.requeue` audit event appears. Requeueing should not execute the handler.
6. Execute the job once. Verify the status and attempts. The current handler should pass its minimal checks; record that this proves the stub completed, not that an attendance report was generated.
7. Propose a lasting fix as a separate change: a typed payload boundary, a real date check, section lookup, and meaningful handler output, with tests. Decide whether invalid payloads should consume transient retries at all.

Keep the original evidence even after recovery. Resetting the database would remove the story you are trying to understand.

## Other symptoms to investigate

| Symptom | Inspect first | Do not assume |
| --- | --- | --- |
| Grade changed but aggregate is stale | Submission, GradeRecalculation job, enrollment grade | That a page refresh executes the queue |
| Job remains Running | Start time, logs, whether the executing process stopped | That the current queue has a lease or automatic recovery |
| Queue summary reports failure during contention | `runJob` boolean result and claim logs | That every false result represents handler failure |
| Sweep misses later assignments | Candidate query, limit of 500, ordering and continuation | That bounded work implies complete work |
| No audit row after a mutation | `recordAuditEvent` error path and console output | That a helper named audit guarantees atomic history |
| Missing database logs during a database error | Process console output | That absence of persisted logs means no failure occurred |

## A stale Running job is a design question

There is no lease-expiry recovery in the current job model. Before resetting a Running row, determine whether the previous worker may still execute and whether side effects might already have happened. A future lease design should identify the attempt owner and prevent an expired worker from committing as the current owner. Repeated business effects still require idempotency or reconciliation.

For a learning experiment, interrupt only your own isolated worker at a known point, save the state, and describe recovery as a proposal before manipulating it. Never describe an arbitrary timeout reset as a complete reliability solution.

## Close the drill with an actionable incident record

Separate trigger, contributing conditions, detection, mitigation, and prevention. For the seeded scenario, the trigger is deliberate malformed input; the retry policy repeats a deterministic failure; the handler is intentionally incomplete. A useful follow-up has an owner, a verifiable acceptance criterion, and a reason it reduces recurrence or diagnosis time. "Add more logs" is weaker than "record validated payload version and job ID so operators can distinguish malformed work before retrying."
