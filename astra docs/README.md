# Astra engineering handbook

This is a practical curriculum for a complete beginner learning to read and test a function, a junior engineer learning to deliver a feature, and an experienced engineer practicing broader ownership. The classroom is this education operations application: rosters, coursework, grades, attendance, support notes, deterministic agents, jobs, and their audit trail. Start small, then learn to trace a workflow, make a bounded change, test its risks, and explain the result to another engineer.

The exercises are proposed learning work. Their acceptance criteria describe what you should build or demonstrate; they are not a claim that these improvements have already shipped. Existing behavior is described separately and linked to source.

## Choose a starting point

| Guide | What you will produce |
| --- | --- |
| [Beginner start](beginner-start.md) | A safe Windows setup check and your first small test-and-repair exercise, without a database reset |
| [Worked examples](worked-examples.md) | Predictions, code traces, practice changes, and verified results from simple arithmetic to a workflow |
| [Deliberate practice](deliberate-practice.md) | Independent attempts, spaced reviews, focused debugging, and readiness evidence |
| [12-week roadmap](roadmap.md) | A baseline assessment and an adaptable weekly delivery plan |
| [Codebase tour](codebase-tour.md) | Request traces, a data map, and questions for unfamiliar code |
| [Engineering notes](engineering-notes.md) | Working knowledge of TypeScript, rules, data, security, tests, and performance |
| [Practice labs](practice-labs.md) | Reviewable changes with acceptance criteria and reasoning prompts |
| [System design](system-design.md) | Decisions, failure analysis, and a staged migration proposal |
| [Operations playbook](operations-playbook.md) | A reproducible job incident investigation and recovery exercise |
| [Career evidence](career-evidence.md) | An honest portfolio of engineering decisions and outcomes |
| [Templates](templates.md) | Copyable PR, ADR, incident, test plan, and learning records |
| [Upskilling review](upskilling-review.md) | The beginner-to-senior improvements and latest verification |
| [Initial change report](report.md) | The original Learning Studio implementation and verification record |

If code and terminal commands are new, begin with the beginner guide, then do the worked examples in order. If you already make small code changes, use the roadmap diagnostic to choose your starting stage. Reading a solution, reproducing it, and solving a changed problem independently are different outcomes; the deliberate-practice guide helps you record which you achieved. Keep a learning record for each completed piece of work, whatever its duration.

## Ground rules

Read [CONTRIBUTING.md](../CONTRIBUTING.md) before creating an implementation branch. It teaches small changes, explicit reasoning, self-review, and the branch-to-review workflow. Follow the conventions available in your checkout; inspect history rather than assuming every historical branch or pull request remains available.

The beginner lessons run without a database. For later data exercises, use disposable demo data. `npm run db:seed` deletes application records and rebuilds the scenario; do not run it against an existing database you want to preserve. Save any investigation evidence before a deliberate reset. The schema uses SQLite at `prisma/dev.db`; this curriculum does not require a production database or real student information. On Windows PowerShell, the setup guide uses `npm.cmd` to call npm directly.

The role switcher uses a `mock_user_id` cookie and defaults to the admin account. It is a teaching convenience, not production authentication. Permission labels and disabled buttons do not prove that a server mutation enforces authorization. Several labs deliberately investigate this boundary.

The five agents are deterministic TypeScript heuristics. Their recommendation text, confidence values, and stored traces are outputs of ordinary code, not LLM calls or statistically validated predictions. Guardian digest approval records a local status change; it does not send an email. Some job handlers simulate work.

## How to use the handbook well

Before reading a hint, predict the behavior and write a counterexample. When a test passes, explain what it proves and what it cannot prove. When a comment and executable code disagree, treat that disagreement as a question to investigate. When you finish, ask someone to review the reasoning, including a rejected alternative and a remaining limitation.

There is no time-served promotion guarantee here. A completed curriculum can show progress and create credible evidence. Professional scope also depends on repeated delivery, judgment under real constraints, collaboration, and feedback from people who have worked with you.
