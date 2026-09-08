import { missions, type Mission } from './curriculum';

export type MissionStatus = 'not-started' | 'in-progress' | 'completed';
export interface MissionProgress {
  status: MissionStatus;
  notes: string;
  evidence: string;
  checkedCriteria: number[];
  checkpointAnswers: string[];
  reviewedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
}
export interface LearningProgress {
  version: 1;
  missions: Record<string, MissionProgress>;
}

// This notebook belongs to the learner, not the mock school account in the header.
export const STORAGE_KEY = 'eduops.astra.learning.v1';
// Covers every permitted note/evidence field, including multibyte text and JSON escaping.
export const MAX_BACKUP_BYTES = 16_000_000;
export const emptyProgress = (): LearningProgress => ({ version: 1, missions: {} });
export const getMissionProgress = (progress: LearningProgress, id: string): MissionProgress =>
  progress.missions[id] ?? {
    status: 'not-started', notes: '', evidence: '', checkedCriteria: [],
    completedAt: null, updatedAt: null, checkpointAnswers: [], reviewedAt: null,
  };

export function canCompleteMission(mission: Mission, entry: MissionProgress): boolean {
  return entry.evidence.trim().length > 0
    && mission.rubric.every((_, index) => entry.checkedCriteria.includes(index));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validDate(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= 40
    && Number.isFinite(Date.parse(value)));
}

/** Reject bad backups before the UI offers to replace a learner's existing work. */
export function parseImportedProgress(raw: string): LearningProgress {
  if (raw.length > MAX_BACKUP_BYTES || new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('Notebook must be smaller than 16 MB.');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Choose a valid JSON notebook backup.'); }
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.missions)) {
    throw new Error('This is not a supported EduOps notebook (version 1).');
  }
  const result = emptyProgress();
  for (const [id, value] of Object.entries(parsed.missions)) {
    const mission = missions.find(item => item.id === id);
    if (!mission || !isRecord(value)) throw new Error(`Unknown or invalid mission: ${id.slice(0, 80)}.`);
    if (typeof value.status !== 'string' || !['not-started', 'in-progress', 'completed'].includes(value.status)
      || typeof value.notes !== 'string' || value.notes.length > 50_000
      || typeof value.evidence !== 'string' || value.evidence.length > 20_000
      || !Array.isArray(value.checkedCriteria)
      || !value.checkedCriteria.every(index => Number.isInteger(index) && index >= 0 && index < mission.rubric.length)
      || !validDate(value.completedAt) || !validDate(value.updatedAt)
      || (value.checkpointAnswers !== undefined && (!Array.isArray(value.checkpointAnswers)
        || value.checkpointAnswers.length > mission.checkpoints.length
        || !value.checkpointAnswers.every(answer => typeof answer === 'string' && answer.length <= 5_000)))
      || (value.reviewedAt !== undefined && !validDate(value.reviewedAt))) {
      throw new Error(`Invalid progress for ${mission.title}.`);
    }
    const entry: MissionProgress = {
      status: value.status as MissionStatus, notes: value.notes, evidence: value.evidence,
      checkedCriteria: [...new Set(value.checkedCriteria as number[])],
      completedAt: value.completedAt, updatedAt: value.updatedAt,
      // Older version-1 backups predate retrieval practice and remain importable.
      checkpointAnswers: [...(value.checkpointAnswers as string[] | undefined ?? [])],
      reviewedAt: value.reviewedAt as string | null | undefined ?? null,
    };
    if (entry.status === 'completed' && (!canCompleteMission(mission, entry) || !entry.completedAt)) {
      throw new Error(`Completed mission ${mission.title} needs evidence, all rubric checks, and a completion date.`);
    }
    if (entry.status !== 'completed') entry.completedAt = null;
    result.missions[id] = entry;
  }
  return result;
}

/** A corrupt local cache must never break rendering; imports use the strict parser. */
export function parseProgress(raw: string | null): LearningProgress {
  if (!raw) return emptyProgress();
  try { return parseImportedProgress(raw); } catch { return emptyProgress(); }
}

export function getNextMission(progress: LearningProgress): Mission | undefined {
  const available = missions.filter(mission => getMissionProgress(progress, mission.id).status !== 'completed'
    && mission.prerequisites.every(id => getMissionProgress(progress, id).status === 'completed'));
  return available.find(mission => getMissionProgress(progress, mission.id).status === 'in-progress') ?? available[0];
}

export function getProgressSummary(progress: LearningProgress) {
  const completed = missions.filter(mission => getMissionProgress(progress, mission.id).status === 'completed').length;
  const inProgress = missions.filter(mission => getMissionProgress(progress, mission.id).status === 'in-progress').length;
  return { total: missions.length, completed, inProgress, percent: Math.round(completed / missions.length * 100) };
}

const REVIEW_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** A simple weekly reminder, based on practice dates rather than a mastery score. */
export function getDueReviews(progress: LearningProgress, now = new Date()): Mission[] {
  return missions.filter(mission => {
    const entry = getMissionProgress(progress, mission.id);
    if (entry.status !== 'completed' || !entry.completedAt) return false;
    const lastPractice = Math.max(Date.parse(entry.completedAt), Date.parse(entry.reviewedAt ?? entry.completedAt));
    return now.getTime() - lastPractice >= REVIEW_INTERVAL_MS;
  }).sort((left, right) => {
    const lastPractice = (id: string) => {
      const entry = getMissionProgress(progress, id);
      return Math.max(Date.parse(entry.completedAt!), Date.parse(entry.reviewedAt ?? entry.completedAt!));
    };
    return lastPractice(left.id) - lastPractice(right.id);
  });
}

export function buildNotebookMarkdown(progress: LearningProgress): string {
  const summary = getProgressSummary(progress);
  const lines = ['# My engineering learning notebook', '',
    `${summary.completed}/${summary.total} missions completed. Self-assessment backed by my evidence; not a professional credential.`, ''];
  for (const mission of missions) {
    const entry = getMissionProgress(progress, mission.id);
    if (entry.status === 'not-started' && !entry.notes && !entry.evidence && entry.checkedCriteria.length === 0
      && !entry.checkpointAnswers.some(answer => answer.trim())) continue;
    lines.push(`## ${mission.title}`, '', `${mission.level} | ${entry.status}`, '',
      '### Notes', '', entry.notes || '_No notes yet._', '',
      '### Checkpoint attempts', '',
      ...mission.checkpoints.flatMap((checkpoint, index) => [
        `**${checkpoint.question}**`, '', entry.checkpointAnswers[index] || '_Not attempted yet._', '',
      ]),
      `Last retrieval practice: ${entry.reviewedAt ?? 'Not recorded'}`, '',
      '### Evidence', '', entry.evidence || '_No evidence yet._', '', '### Self-review', '',
      ...mission.rubric.map((criterion, index) => `- [${entry.checkedCriteria.includes(index) ? 'x' : ' '}] ${criterion}`), '',
      `Completed: ${entry.completedAt ?? 'Not yet'}`, '');
  }
  return lines.join('\n');
}
