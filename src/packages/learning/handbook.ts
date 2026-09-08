import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const handbook = [
  { slug: 'beginner-start', title: 'Start from your first small change', description: 'Plain-language setup, a code-reading glossary, and your first function and test.', category: 'Start here' },
  { slug: 'worked-examples', title: 'Predict, trace, change, and test', description: 'Step-by-step examples with expected results, hints, and independent variations.', category: 'Practice' },
  { slug: 'deliberate-practice', title: 'Build skills you can use independently', description: 'Retrieval practice, debugging habits, and evidence for moving to the next stage.', category: 'Growth' },
  { slug: 'roadmap', title: 'Your growth roadmap', description: 'A beginner ramp, an adaptable practice plan, and demonstrated skills for each stage.', category: 'Start here' },
  { slug: 'codebase-tour', title: 'Read the code with purpose', description: 'Trace requests, map the data model, and understand the boundaries in this app.', category: 'Foundations' },
  { slug: 'engineering-notes', title: 'Engineering field notes', description: 'Detailed notes on TypeScript, validation, rules, data, tests, permissions, and performance.', category: 'Reference' },
  { slug: 'practice-labs', title: 'Practice that produces evidence', description: 'Repository exercises with acceptance criteria, hints, and review prompts.', category: 'Practice' },
  { slug: 'system-design', title: 'System design and tradeoffs', description: 'Practice architecture decisions, safe migrations, scale, and reliable delivery.', category: 'Senior practice' },
  { slug: 'operations-playbook', title: 'Debugging and incident playbook', description: 'Investigate jobs, logs, and audits; rehearse an incident with the demo fixture.', category: 'Operations' },
  { slug: 'career-evidence', title: 'Show your engineering growth', description: 'A competency rubric, review habits, and a portfolio of verifiable work.', category: 'Growth' },
  { slug: 'templates', title: 'Working templates', description: 'Copyable learning notes, PRs, ADRs, test plans, incident reviews, and weekly retrospectives.', category: 'Toolkit' },
] as const;

export async function readHandbook(slug: string) {
  const document = handbook.find(item => item.slug === slug);
  if (!document) return null;
  // Only catalog entries become filesystem paths; URL text cannot select arbitrary files.
  const content = await readFile(path.join(process.cwd(), 'astra docs', `${document.slug}.md`), 'utf8');
  return { ...document, content };
}
