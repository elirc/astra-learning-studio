# Your first small, tested change

You do not need to understand this entire application to begin. Start with one function that accepts a number and returns a label. You will read it, predict its output, run a test, deliberately break one comparison, and repair your own edit. This teaches the daily loop of software development with no database or browser setup.

Treat the first 30 minutes below as a small session outline, not a deadline. Installation may take longer. If a word or command is unfamiliar, pause at that step. The useful outcome is that you can explain what happened and repeat it, not that you finish quickly.

## Know the tools you are using

An **editor** changes text files. A **terminal** runs commands. The **repository** is this project folder and its recorded history. **Source code** is the program written by people. A **test** is a small program that checks an expected behavior. A **dependency** is another software package this project uses. **npm** installs those packages and runs the named commands in [package.json](../package.json).

You can read a linked source file in the Learning Studio, but its source reader does not edit files. Make the exercise changes in your editor. Keep the terminal in the project folder: the folder containing `package.json`, `src`, and `tests`.

## Check the Windows workspace safely

In PowerShell, run these commands separately. If your copy is in a different folder, replace only the path in the first command.

```powershell
Set-Location -LiteralPath 'C:\Users\E\Desktop\astralearn3\3buildagentteachgem'
Get-Location
Test-Path -LiteralPath .\package.json
node --version
npm.cmd --version
git status --short
```

`Get-Location` shows where commands will run. The file check should print `True`. The two version commands should print version numbers. If either executable is missing, record that exact error and resolve the local Node/npm setup before continuing. Do not guess by changing application files.

Use `npm.cmd` in these Windows instructions. It calls npm's Windows command file directly and avoids the PowerShell-script execution-policy error some setups encounter with `npm`. You do not need to change the machine's execution policy for these exercises.

`git status --short` lists local changes. An empty result means Git sees none. Existing changes may belong to you or someone working with you; note them before editing. A branch is a named line of work, not a backup of uncommitted edits. If this is your own practice checkout, read [CONTRIBUTING.md](../CONTRIBUTING.md) and create a practice branch using its naming convention. If this is a shared active workspace, use a separate checkout for experiments that deliberately break code.

## Install only when needed; leave the database alone

First try the focused test command:

```powershell
node --import tsx --test tests/grades.test.ts
```

If it runs, you already have what this exercise needs. If it cannot find an installed package such as `tsx`, stop any development server in this checkout with Ctrl+C, then install from the lockfile:

```powershell
npm.cmd ci
node --import tsx --test tests/grades.test.ts
```

`npm.cmd ci` rebuilds the installed dependency folder using the recorded dependency versions. Wait for it to finish before running another package command. If installation fails, save the first useful error; repeated installs or deleting unrelated files usually do not explain the cause.

These tests use plain values and need no database. Do not run `db:seed`: it deletes demo records. Do not run `db:push` as a general repair command against an existing database: it changes its schema. You can inspect whether a database already exists without modifying it:

```powershell
Test-Path -LiteralPath .\prisma\dev.db
```

Either result is compatible with this lesson. If you later want the browser app and this checkout already has a prepared demo database, use `npm.cmd run dev` and open the local address printed by the server. A missing-database error is a separate setup task; continue the database-free lessons while arranging a fresh disposable database. Do not reset an existing one just to see the learning pages.

## First session, part 1: read and predict

Open [src/packages/domain/rules/grades.ts](../src/packages/domain/rules/grades.ts) in your editor. Find `classifyGradeScore`. Ignore the longer functions below it for now.

```typescript
export function classifyGradeScore(percentage: number): GradeClassification {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 70) return 'Warning';
  return 'At Risk';
}
```

`percentage` is the input. `: number` is TypeScript's instruction that callers should supply a number. `>=` means greater than or equal to. Each `if` asks a yes-or-no question. `return` ends this call immediately with the value that follows it. `GradeClassification`, defined above the function, names the allowed labels. `export` lets another file import the function.

Without running anything, write the labels you expect for 69, 70, 89.5, 90, and 100. Explain why 95 does not reach the second comparison even though it is also greater than 80. This prediction gives you something to compare with the actual behavior.

## First session, part 2: add one focused check

In the editor, create `tests/first-step.test.ts` only if that filename is unused. If it exists, choose another unused filename ending in `.test.ts` and use that filename in the command below. Add:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyGradeScore } from '../src/packages/domain/rules/grades';

test('90 is the first Excellent score', () => {
  assert.equal(classifyGradeScore(89.5), 'Good');
  assert.equal(classifyGradeScore(90), 'Excellent');
});
```

The imports bring in the test runner, an assertion helper, and the real function. `test` names the behavior. The small `() => { ... }` function contains the checks to run. `assert.equal(actual, expected)` fails if the two values differ. The expectation comes from the stated boundary, not from copying the implementation's comparison.

Save the file and run:

```powershell
node --import tsx --test tests/first-step.test.ts
```

`tsx` lets Node execute this TypeScript test. `--test` selects the test runner. Read the named test result and failure count; do not rely only on colored text. The expected result is a passing test with no failures.

## First session, part 3: watch the test detect a mistake

On your practice branch, change only the first comparison in `classifyGradeScore` from `>= 90` to `> 90`. This is a deliberately introduced defect, not a proposed grading policy. Save the source and rerun the focused test.

Before looking at the output, predict which assertion will fail. With the defect, an input of 90 skips the first branch and returns `Good`. The test should report the disagreement between `Good` and `Excellent`.

Now repair your exact edit by changing `> 90` back to `>= 90`. Rerun the test and confirm it passes. Do not change the expected result to match the defect. Do not use a broad Git reset to undo one character, because it could remove unrelated work.

Run the original grade tests, then inspect your work:

```powershell
node --import tsx --test tests/grades.test.ts
git diff -- src/packages/domain/rules/grades.ts
git status --short
```

If that source file was initially unchanged, it should now have no diff. Your new test file should appear as untracked until you choose to add it to Git. Ordinary `git diff` does not show the contents of untracked files, so also read the new file in your editor. Keeping a small extra test is fine for practice; explain its overlap with existing tests before proposing it as a repository contribution.

## What to do when something fails

| Observation | Next useful step |
| --- | --- |
| `package.json` check is False | Correct the terminal's current folder. |
| A command is not recognized | Check the executable setup, not the grade function. |
| The error says a module is missing | Check whether dependency installation completed successfully. |
| A syntax error points to your test | Compare punctuation, quotes, braces, and imports with the example. |
| Actual and expected labels differ | Trace the comparisons using the failing input. |
| The deliberate defect does not fail the test | Confirm you saved the edited file and ran the test that imports it. |

Avoid making several guesses at once. Record the input, expected result, observed result, and one hypothesis. Change one thing that can distinguish that hypothesis from another explanation.

## Demonstrate the skill before moving on

Close this guide. Explain what the function accepts, what it returns, and why order matters. Add your own check for the 70 boundary without copying the earlier test, then run it. Explain how you know the database was not involved. If you can do that, continue to [worked examples](worked-examples.md). If not, repeat the same exercise with one different number and use [deliberate practice](deliberate-practice.md) to record exactly where help was needed.
