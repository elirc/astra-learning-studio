# Worked examples: predict, trace, change, verify

These lessons move from one arithmetic function to a change that spans stored data and background work. Complete [the beginner start](beginner-start.md) first if imports, tests, or terminal commands are new. Work in a practice checkout and leave existing demo data unchanged.

For each example, write a prediction before reading the explanation. Then trace the executable code, make the proposed exercise change, and test the contract: the behavior you promised to preserve or introduce. The explanations below are available for checking your reasoning; reading them is not evidence that you could produce the solution yourself.

## Example 1: calculate an average without hiding the steps

**Question:** What does `calculateClassAverage([90, 60])` return, and what does it return for an empty list? Find the function at the bottom of [grades.ts](../src/packages/domain/rules/grades.ts). An array such as `[90, 60]` is an ordered collection of values.

**Predict:** Write both answers and show the arithmetic. Then predict `[80, 81, 81]`. Do not run the function yet.

**Trace:** The function first checks the array's length. For a nonempty array, `reduce` accumulates a total starting from zero. It divides the total by the number of values and rounds to one decimal place. `Math.round(value * 10) / 10` performs that rounding here.

**Change:** Replace only the `reduce` expression with an explicit loop in your practice branch. Keep the empty-list check and return expression unchanged. This is a **refactor**: a structural change that should preserve behavior. A possible loop shape is:

```typescript
let total = 0;
for (const percentage of studentPercentages) {
  total += percentage;
}
```

**Test:** Add cases to a separate practice test file or the existing [grade tests](../tests/grades.test.ts), using the existing import of `calculateClassAverage` where applicable:

```typescript
assert.equal(calculateClassAverage([90, 60]), 75);
assert.equal(calculateClassAverage([]), 0);
assert.equal(calculateClassAverage([80, 81, 81]), 80.7);
assert.equal(calculateClassAverage([0]), 0);
```

Run `node --import tsx --test tests/grades.test.ts` if you changed that test file. If you created a new file, run it too. The expected outputs are 75, 0, 80.7, and 0. Check the diff: a refactor should not quietly change the empty case or rounding.

**Reasoning check:** The loop and `reduce` are two ways to accumulate the same numbers. You have not shown that one is faster; you have shown the tested behavior remains the same. Now write the accumulator values after each step for `[20, 40, 60]` without opening the explanation.

## Example 2: a missing assignment changes the denominator

**Question:** Why does adding work sometimes change a student's grade and sometimes leave it alone? Read `calculateSectionGrade` in [grades.ts](../src/packages/domain/rules/grades.ts). A submission is represented by an object: named values such as `status`, `score`, and `pointsPossible`. `null` means no score is stored; it is different from a scored zero.

**Predict:** Use these inputs. The first item earned 80 of 100 possible points. The second was not handed in. The third was submitted and has not been graded.

```typescript
const work = [
  { status: 'Graded', score: 80, pointsPossible: 100 },
  { status: 'Missing', score: null, pointsPossible: 20 },
  { status: 'Submitted', score: null, pointsPossible: 50 },
];
```

Write expected earned points, counted possible points, percentage, graded count, and missing count. The **denominator** is the number below the division bar: the possible points used when calculating the percentage.

**Trace:** Make one row per input and follow the additions and subtractions. Graded contributes 80 earned and 100 possible. Missing contributes zero earned and 20 possible. Submitted is excluded from possible points after entering the ungraded branch. The results are 80 earned, 120 possible, 66.7%, one graded, and one missing.

**Change:** Change the second fixture item to `{ status: 'Graded', score: 10, pointsPossible: 20 }`. This models a teacher recording a grade. Keep production code unchanged: changing a fixture is enough to learn this behavior. Predict every result again before running.

**Test:** Assert named fields instead of comparing only whether a result exists:

```typescript
const result = calculateSectionGrade(work);
assert.equal(result.totalPointsEarned, 80);
assert.equal(result.totalPointsPossible, 120);
assert.equal(result.percentage, 66.7);
assert.equal(result.gradedCount, 1);
assert.equal(result.missingCount, 1);
```

For the modified fixture, expected earned points become 90, possible points stay 120, percentage becomes 75, graded count becomes two, and missing count becomes zero. Keep both cases as separate tests so the original behavior remains checked.

**Reasoning check:** Adding a 50-point Submitted item does not penalize ungraded work under this policy. An empty input returns 100% with no counted points. Explain why a UI should show that there is no graded evidence, instead of treating the fallback as proof of strong performance. This is the difference between understanding a number and understanding its meaning.

## Example 3: exactly at the deadline

**Question:** Is work overdue at precisely the due time? Open [coursework.ts](../src/packages/domain/rules/coursework.ts). `isPastDue` compares two `Date` values after converting them to millisecond timestamps. `resolveSubmissionStatus` uses the current status and timestamps to decide whether a write is needed. A returned `null` means leave the record alone.

**Predict:** For NotStarted work, fill in the expected result one millisecond before the deadline, exactly at it, and one millisecond after. Also predict Graded work one day after the deadline.

**Trace:** The current policy uses `>` rather than `>=`. Before and at the deadline return `null`; one millisecond after returns `Missing`. Graded work returns `null` because a teacher's decision is protected before time is checked. Notice that `resolveSubmissionStatus` repeats the overdue comparison even though `isPastDue` exists below it.

**Change:** Replace only this line in `resolveSubmissionStatus`:

```typescript
const isOverdue = now.getTime() > dueDate.getTime();
```

with:

```typescript
const isOverdue = isPastDue(now, dueDate);
```

This exercise centralizes the NotStarted overdue comparison without changing the policy. The helper takes `now` first and `dueDate` second; swapping them reverses the question. Do not change the Submitted branch to use the current time: its lateness depends on when the student submitted.

**Test:** Run the existing boundary cases:

```powershell
node --import tsx --test tests/coursework.test.ts
```

Then add a test of two successive evaluations. First evaluate NotStarted work after the deadline and expect Missing. Evaluate again with current status Missing and expect `null`. This is **idempotent** status behavior: repeating the operation after its change does not request another change.

**Hint:** Build dates from explicit strings ending in `Z`, or add milliseconds to one fixed deadline. Do not wait for the wall clock to cross a real deadline.

**Reasoning check:** The helper is pure: its result depends on supplied values, and it does not write to a database. These unit tests cannot show that a database update protects a grade written by another request after the candidate was read. That is a later integration question.

## Example 4: eligibility comes before the waitlist offer

**Question:** Should a withdrawn student be offered a waitlist place just because the section is full? Read [enrollment.ts](../src/packages/domain/rules/enrollment.ts) and [its tests](../tests/enrollment.test.ts).

**Predict:** Start with an Active student, an Active section, an Active teacher, five enrolled students, capacity 20, and no existing enrollment. Then vary one fact at a time: count 20; student Withdrawn; both count 20 and student Withdrawn; existing enrollment true as well. Write `isValid`, `canWaitlist`, and the reason category for each.

**Trace:** The first failing check returns immediately. A full section offers a waitlist only after other eligibility checks pass. Withdrawn plus full is rejected without a waitlist offer. An existing enrollment is reported before the student's status. That order is deliberate behavior worth preserving with tests.

**Change:** In a new practice test, create the withdrawn-and-full combination. Temporarily move the capacity check above student eligibility in your practice branch, then rerun the enrollment tests. This deliberately changes the rejection priority. Observe the failure, explain the incorrect waitlist offer, and restore only your own movement before continuing.

**Test:** The combined case must assert both `isValid === false` and `canWaitlist === false`. Checking only rejection would miss the harmful offer. Run:

```powershell
node --import tsx --test tests/enrollment.test.ts
```

**Independent variation:** Test `selectWaitlistPromotion` with an early Withdrawn candidate and two eligible candidates sharing a timestamp. Reverse the input order. The earliest eligible choice should remain stable, with enrollment ID breaking a tie. Follow the existing test helper's fields rather than inventing a new input shape.

**Reasoning check:** Pure validation answers whether the supplied facts permit enrollment. It does not reserve the seat. Two requests can each see one free seat and both pass. Draw their reads and writes before proposing a database change.

## Example 5: a saved grade is not the end of the workflow

**Question:** A teacher saves a grade, but an aggregate still looks old. Where do you investigate? This exercise changes your trace and test plan; implementation is an optional next step once you can explain the path.

**Predict:** Before opening the code, list what you think `saveGradeAction` does. Mark guesses. Then read it in [actions.ts](../src/app/actions.ts), follow its schema in [schemas.ts](../src/packages/shared/schemas.ts), and find GradeRecalculation in [jobs.ts](../src/packages/observability/jobs.ts).

**Trace:** The action parses the request, loads the submission and assignment, checks the maximum score, writes the submission, records an audit event, enqueues recalculation, and invalidates paths. A **background job** is stored work to be executed later; enqueueing records the work but does not perform it. Recalculation updates an enrollment's stored final grade.

**Change:** Turn your guessed list into an evidence-backed sequence. Add a failure marker immediately after the submission write and before enqueueing. State what may already exist and what may never have been created. Then inspect the client-supplied actor ID: shape validation does not prove who made the request.

**Test plan:** Specify three separate observations: the Submission has the new score, a GradeRecalculation job exists for the section, and the enrollment grade becomes correct after executing that work. Add a failure case for interrupted enqueueing and a denied cross-section request. Mark these as proposed until you run them in an isolated setup.

**Expected reasoning:** A stale aggregate does not imply the grade write failed. A job may be waiting, may have failed, or may not have been created. Querying the source record, queue record, and aggregate distinguishes these possibilities. A passing pure grade test does not establish action authorization or reliable enqueueing.

When you can explain those distinctions without this page, choose [the authorized grading or publication lab](practice-labs.md). You are moving from editing a function to owning a workflow with multiple failure points.
