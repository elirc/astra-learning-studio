import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { missions, levels } from '../src/packages/learning/curriculum';
import { handbook, readHandbook } from '../src/packages/learning/handbook';
import {
  emptyProgress, getMissionProgress, canCompleteMission, parseProgress,
  parseImportedProgress, getNextMission, getProgressSummary, buildNotebookMarkdown, getDueReviews,
} from '../src/packages/learning/progress';

const completedEntry = (index = 0) => ({
  ...getMissionProgress(emptyProgress(), missions[index].id),
  status: 'completed' as const,
  evidence: 'Traced the action and recorded a test that catches the boundary failure.',
  checkedCriteria: missions[index].rubric.map((_, i) => i),
  completedAt: '2026-09-07T12:00:00.000Z', updatedAt: '2026-09-07T12:00:00.000Z',
});

describe('curriculum integrity', () => {
  test('every stage has substantial missions and prerequisites point backward', () => {
    assert.ok(missions.length >= 24);
    assert.equal(missions[0].level, 'Beginner');
    for (const level of levels) assert.ok(missions.filter(m => m.level === level).length >= 6);
    const seen = new Set<string>();
    for (const mission of missions) {
      assert.ok(!seen.has(mission.id), `Duplicate ${mission.id}`);
      for (const prerequisite of mission.prerequisites) assert.ok(seen.has(prerequisite), `Invalid prerequisite ${prerequisite}`);
      seen.add(mission.id);
      assert.ok(mission.concepts.length >= 2);
      assert.ok(mission.checkpoints.length >= 2);
      assert.ok(mission.lab.steps.length >= 3);
      assert.ok(mission.rubric.length >= 3);
      assert.ok(mission.minutes > 0);
    }
  });

  test('source references and handbook links resolve to real material', () => {
    for (const mission of missions) {
      for (const ref of mission.codeRefs) {
        assert.ok(!ref.path.includes('..') && !path.isAbsolute(ref.path));
        assert.ok(existsSync(ref.path), `Missing ${ref.path}`);
      }
      for (const resource of mission.resources) {
        if (resource.href.startsWith('/learn/docs/')) {
          assert.ok(handbook.some(doc => resource.href === `/learn/docs/${doc.slug}`), `Unknown ${resource.href}`);
        }
      }
    }
    for (const doc of handbook) assert.ok(readFileSync(path.join('astra docs', `${doc.slug}.md`), 'utf8').length > 1000);
  });

  test('document lookup rejects traversal and unknown slugs', async () => {
    assert.equal(await readHandbook('../../package'), null);
    assert.equal(await readHandbook('missing'), null);
    assert.ok((await readHandbook('roadmap'))?.content.includes('#'));
  });
});

describe('learner evidence and progression', () => {
  test('completion requires both evidence and every rubric criterion', () => {
    const mission = missions[0];
    const entry = completedEntry();
    assert.equal(canCompleteMission(mission, entry), true);
    assert.equal(canCompleteMission(mission, { ...entry, evidence: ' \n ' }), false);
    assert.equal(canCompleteMission(mission, { ...entry, checkedCriteria: entry.checkedCriteria.slice(1) }), false);
  });

  test('new learner gets the first mission; completed work advances the suggestion', () => {
    const progress = emptyProgress();
    assert.equal(getNextMission(progress)?.id, missions[0].id);
    progress.missions[missions[0].id] = completedEntry();
    const next = getNextMission(progress);
    assert.notEqual(next?.id, missions[0].id);
    assert.ok(next?.prerequisites.every(id => progress.missions[id]?.status === 'completed'));
    assert.equal(getProgressSummary(progress).completed, 1);
  });

  test('in-progress work with unmet prerequisites is not the recommended next mission', () => {
    const progress = emptyProgress();
    const blocked = missions.find(mission => mission.prerequisites.length > 0)!;
    progress.missions[blocked.id] = { ...getMissionProgress(progress, blocked.id), status: 'in-progress' };
    assert.notEqual(getNextMission(progress)?.id, blocked.id);
  });

  test('all completed missions have no further recommendation', () => {
    const progress = emptyProgress();
    missions.forEach((mission, i) => { progress.missions[mission.id] = completedEntry(i); });
    assert.equal(getNextMission(progress), undefined);
    assert.equal(getProgressSummary(progress).percent, 100);
  });
});

describe('notebook persistence and recovery', () => {
  test('existing version-1 notebooks retain evidence and gain empty retrieval fields', () => {
    const originalMissionIndex = missions.findIndex(mission => mission.id === 'trace-a-request');
    assert.ok(originalMissionIndex >= 0);
    const { checkpointAnswers, reviewedAt, ...legacyEntry } = completedEntry(originalMissionIndex);
    const legacy = { version: 1, missions: { 'trace-a-request': legacyEntry } };
    assert.deepEqual(parseImportedProgress(JSON.stringify(legacy)).missions['trace-a-request'], completedEntry(originalMissionIndex));
  });

  test('checkpoint attempts and review date survive backup and Markdown export', () => {
    const progress = emptyProgress();
    const entry = { ...completedEntry(), checkpointAnswers: ['My prediction: 70 takes the >= 70 branch.', 'I would test 69.99 too.'], reviewedAt: '2026-09-14T12:00:00.000Z' };
    progress.missions[missions[0].id] = entry;
    assert.deepEqual(parseImportedProgress(JSON.stringify(progress)), progress);
    const markdown = buildNotebookMarkdown(progress);
    assert.ok(markdown.includes(entry.checkpointAnswers[0]));
    assert.ok(markdown.includes(missions[0].checkpoints[0].question));
    assert.ok(markdown.includes(entry.reviewedAt));
  });

  test('invalid retrieval records cannot replace existing notes', () => {
    const backup = (patch: Record<string, unknown>) => JSON.stringify({ version: 1, missions: { [missions[0].id]: { ...completedEntry(), ...patch } } });
    for (const checkpointAnswers of [null, 'answer', [42], ['a'.repeat(5_001)], Array(missions[0].checkpoints.length + 1).fill('extra')]) {
      assert.throws(() => parseImportedProgress(backup({ checkpointAnswers })));
    }
    assert.throws(() => parseImportedProgress(backup({ reviewedAt: 'tomorrow' })));
    assert.throws(() => parseImportedProgress(backup({ reviewedAt: [] })));
  });

  test('valid backup preserves notes, evidence, and completion', () => {
    const progress = emptyProgress();
    progress.missions[missions[0].id] = { ...completedEntry(), notes: 'Hypothesis → test → observation\n日本語' };
    assert.deepEqual(parseImportedProgress(JSON.stringify(progress)), progress);
    const markdown = buildNotebookMarkdown(progress);
    assert.ok(markdown.includes('日本語'));
    assert.ok(markdown.includes('- [x]'));
    assert.ok(markdown.includes(progress.missions[missions[0].id].evidence));
  });

  test('bad local data cannot crash the studio; invalid imports fail explicitly', () => {
    for (const raw of ['{', 'null', '[]', '{"version":2,"missions":{}}', '{"version":1,"missions":[]}']) {
      assert.deepEqual(parseProgress(raw), emptyProgress());
      assert.throws(() => parseImportedProgress(raw));
    }
    assert.deepEqual(parseProgress(null), emptyProgress());
  });

  test('rejects invalid rubric indexes, unsupported IDs, and false completion claims', () => {
    const backup = (entry: unknown) => JSON.stringify({ version: 1, missions: { [missions[0].id]: entry } });
    const entry = completedEntry();
    assert.throws(() => parseImportedProgress(backup({ ...entry, checkedCriteria: [999] })));
    assert.throws(() => parseImportedProgress(backup({ ...entry, evidence: '' })));
    assert.throws(() => parseImportedProgress(backup({ ...entry, completedAt: null })));
    assert.throws(() => parseImportedProgress(backup({ ...entry, updatedAt: 'not a date' })));
    assert.throws(() => parseImportedProgress(backup({ ...entry, notes: 'a'.repeat(50_001) })));
    assert.throws(() => parseImportedProgress(backup({ ...entry, status: ['completed'] })));
    assert.throws(() => parseImportedProgress('{"version":1,"missions":{"__proto__":{}}}'));
  });

  test('deduplicates rubric checks and keeps fresh mission defaults independent', () => {
    const progress = emptyProgress();
    const entry = completedEntry();
    progress.missions[missions[0].id] = { ...entry, checkedCriteria: [...entry.checkedCriteria, 0] };
    assert.deepEqual(parseImportedProgress(JSON.stringify(progress)).missions[missions[0].id].checkedCriteria, entry.checkedCriteria);
    getMissionProgress(emptyProgress(), missions[0].id).checkedCriteria.push(0);
    assert.deepEqual(getMissionProgress(emptyProgress(), missions[0].id).checkedCriteria, []);
    getMissionProgress(emptyProgress(), missions[0].id).checkpointAnswers.push('Draft');
    assert.deepEqual(getMissionProgress(emptyProgress(), missions[0].id).checkpointAnswers, []);
  });

  test('a full notebook with multibyte notes can round-trip through its JSON backup', () => {
    const progress = emptyProgress();
    missions.forEach((mission, i) => {
      progress.missions[mission.id] = { ...completedEntry(i), notes: '語'.repeat(50_000), evidence: '語'.repeat(20_000) };
    });
    const backup = JSON.stringify(progress);
    assert.ok(new TextEncoder().encode(backup).byteLength > 2_000_000);
    assert.deepEqual(parseImportedProgress(backup), progress);
  });
});

describe('retrieval practice reminders', () => {
  test('a completed mission becomes due at exactly seven days', () => {
    const progress = emptyProgress();
    progress.missions[missions[0].id] = completedEntry();
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-14T11:59:59.999Z')), []);
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-14T12:00:00.000Z')).map(m => m.id), [missions[0].id]);
  });

  test('retrieval practice postpones the reminder; reopened work is excluded', () => {
    const progress = emptyProgress();
    progress.missions[missions[0].id] = { ...completedEntry(), reviewedAt: '2026-09-14T12:00:00.000Z' };
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-20T12:00:00.000Z')), []);
    assert.equal(getDueReviews(progress, new Date('2026-09-21T12:00:00.000Z')).length, 1);
    progress.missions[missions[0].id].status = 'in-progress';
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-30T12:00:00.000Z')), []);
  });

  test('oldest practice is first and a previous review cannot predate renewed completion', () => {
    const progress = emptyProgress();
    progress.missions[missions[0].id] = { ...completedEntry(), reviewedAt: '2026-09-14T12:00:00.000Z' };
    progress.missions[missions[1].id] = completedEntry(1);
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-21T12:00:00.000Z')).map(m => m.id), [missions[1].id, missions[0].id]);
    progress.missions[missions[0].id].completedAt = '2026-09-20T12:00:00.000Z';
    assert.deepEqual(getDueReviews(progress, new Date('2026-09-21T12:00:00.000Z')).map(m => m.id), [missions[1].id]);
  });
});
