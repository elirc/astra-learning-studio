# User Story Build Path

Welcome to your first sprint. This suite contains a progressive set of 10 user stories—real features that a user of the Agentic Education Operations platform would actually want.

> **Verified against the code, 2026-10-06 — read before starting a story.**
> Three stories describe a schema that doesn't exist (full table in
> `fabledocs/02-codebase-gotchas.md` §F):
>
> - **Story 5** references `Enrollment.absences` — no such field; count
>   absences from the `Attendance` table.
> - **Story 7** references `InterventionPlan.advisorId` — the model has
>   `createdById`; it's the *Student* that has `advisorId`.
> - **Story 3** asks whether `NoteVisibility` is an enum — it never is:
>   this schema has zero Prisma enums; every status is a `String`.
>
> Rule of thumb: when a story and `prisma/schema.prisma` disagree, the
> schema wins — grep before you build. Also note `fabledocs/03-user-stories.md`
> holds 19 further stories that are **already built** (see
> `fabledocs/04-what-changed.md`); don't pick one of those expecting
> greenfield work.

## How to Use These Stories
You are no longer reading or tracing code. You are writing it. 

The stories progress from Easy to Expert:
- **Easy (1-3):** Modifying existing UI, adding small fields.
- **Medium (4-7):** Adding new UI that reads existing data, adding simple state or new endpoints.
- **Hard (8-9):** Full-stack features touching UI, Actions, and the Database schema.
- **Expert (10):** A significant architectural feature.

## When Is A Story "Done"?
A story is not done when the code compiles. A story is done when:
1. Every Acceptance Criterion is independently verifiable and met.
2. You have manually tested the UI in the browser.
3. You have run `npm run build` and it passes with Exit Code 0 (meaning strict TypeScript checks pass).
4. You have checked the audit logs (`http://localhost:3000/logs`) to ensure your mutation was recorded.

## Getting Unstuck (Using AI)
If you get stuck, do not ask Claude or ChatGPT to write the code for you. That defeats the purpose of the training. Use this exact prompt:

> "I'm working on Story X. I'm stuck on Y. Here is what I've tried: Z. Don't give me the solution — ask me questions that help me figure it out."

Good luck. Your first ticket awaits in `01-stories.md`.
