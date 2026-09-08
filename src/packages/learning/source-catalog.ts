import { missions } from './curriculum';

// This explicit catalog is the public source-reading boundary. Handbook links
// may name files beyond the missions, but never grant access to a directory.
export const sourcePaths: readonly string[] = Object.freeze([...new Set([
  ...missions.flatMap(mission => mission.codeRefs.map(reference => reference.path)),
  'tsconfig.json',
  'package.json',
  'src/app/agent-runs/[id]/page.tsx',
  'src/packages/domain/rules/digest.ts',
  'src/packages/domain/rules/risk.ts',
  'src/packages/domain/rules/assignments.ts',
  'src/packages/domain/rules/coursework.ts',
])]);
