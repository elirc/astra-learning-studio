'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { levels, missions, type Level, type Mission } from '@/packages/learning/curriculum';
import {
  STORAGE_KEY, MAX_BACKUP_BYTES, emptyProgress, getMissionProgress, parseImportedProgress,
  canCompleteMission, getNextMission, getProgressSummary, getDueReviews, buildNotebookMarkdown,
  type LearningProgress, type MissionProgress,
} from '@/packages/learning/progress';

const stageDescriptions: Record<Level, string> = {
  Beginner: 'Get comfortable with code, tools, and small wins.',
  Foundation: 'Read the system. Make a safe change.',
  'Mid-level': 'Own a feature from rule to recovery.',
  Senior: 'Reason about tradeoffs and system risk.',
};
const statusLabels: Record<MissionProgress['status'], string> = {
  'not-started': 'Ready to explore', 'in-progress': 'In progress', completed: 'Completed',
};

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LearningStudio() {
  const [progress, setProgress] = useState<LearningProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Loading your local notebook…');
  const [storageError, setStorageError] = useState(false);
  const [selectedId, setSelectedId] = useState(missions[0].id);
  const [stage, setStage] = useState<Level | 'All'>('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingImport, setPendingImport] = useState<LearningProgress | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastStorageRaw = useRef<string | null>(null);

  useEffect(() => {
    let restored = emptyProgress();
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      lastStorageRaw.current = stored;
      restored = stored === null ? emptyProgress() : parseImportedProgress(stored);
      setSaveStatus('Notebook loaded · saved on this browser');
    } catch {
      setStorageError(true);
      setSaveStatus('Saved notebook could not be loaded. Existing storage is untouched until you edit or import. Export new work before leaving.');
    }
    setProgress(restored);
    const readMission = () => {
      const id = new URL(window.location.href).searchParams.get('mission');
      setSelectedId(missions.find(item => item.id === id)?.id ?? getNextMission(restored)?.id ?? missions[0].id);
    };
    readMission();
    setReady(true);
    window.addEventListener('popstate', readMission);
    return () => window.removeEventListener('popstate', readMission);
  }, []);

  const mission = missions.find(item => item.id === selectedId) ?? missions[0];
  const entry = getMissionProgress(progress, mission.id);
  const summary = getProgressSummary(progress);
  const next = getNextMission(progress);
  const dueReviews = ready ? getDueReviews(progress) : [];
  const checkpointAnswers = entry.checkpointAnswers ?? [];
  const allCheckpointsAttempted = mission.checkpoints.length > 0
    && mission.checkpoints.every((_, index) => Boolean(checkpointAnswers[index]?.trim()));
  const query = search.trim().toLowerCase();
  const filtered = missions.filter(item => (stage === 'All' || item.level === stage)
    && [item.title, item.theme, item.summary, ...item.outcomes, ...item.concepts.map(concept => concept.title), ...item.codeRefs.map(ref => ref.path)]
      .some(value => value.toLowerCase().includes(query)));
  const prerequisites = mission.prerequisites.map(id => missions.find(item => item.id === id)).filter((item): item is Mission => item !== undefined);
  const missingPrerequisites = prerequisites.filter(item => getMissionProgress(progress, item.id).status !== 'completed');

  function persist(nextProgress: LearningProgress, replace = false): boolean {
    setProgress(nextProgress);
    try {
      if (!replace && window.localStorage.getItem(STORAGE_KEY) !== lastStorageRaw.current) {
        setStorageError(true);
        setSaveStatus('Another tab changed this notebook. Your edits are in memory only. Export them, then reload to load the other tab’s work.');
        return false;
      }
      const raw = JSON.stringify(nextProgress);
      window.localStorage.setItem(STORAGE_KEY, raw);
      lastStorageRaw.current = raw;
      setStorageError(false);
      setSaveStatus('All changes saved on this browser');
      return true;
    } catch {
      setStorageError(true);
      setSaveStatus('Changes are in memory only. Export your work before leaving.');
      return false;
    }
  }

  function updateEntry(patch: Partial<MissionProgress>) {
    if (!ready) return;
    const updated = { ...entry, ...patch, updatedAt: new Date().toISOString() };
    if (updated.status === 'not-started') updated.status = 'in-progress';
    if (updated.status === 'completed' && !canCompleteMission(mission, updated)) {
      updated.status = 'in-progress';
      updated.completedAt = null;
    }
    return persist({ ...progress, missions: { ...progress.missions, [mission.id]: updated } });
  }

  function selectMission(id: string, practiceFromMemory = false) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('mission', id);
    window.history.pushState(null, '', url);
    requestAnimationFrame(() => {
      if (practiceFromMemory) {
        document.querySelectorAll('.ls-checkpoints details[open]').forEach(details => details.removeAttribute('open'));
        document.getElementById('mission-checkpoints')?.focus();
      } else {
        headingRef.current?.focus();
      }
    });
  }

  async function previewImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPendingImport(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error(`Choose a notebook backup smaller than ${MAX_BACKUP_BYTES / 1_000_000} MB.`);
      const imported = parseImportedProgress(await file.text());
      setPendingImport(imported);
      setNotice('Backup checked. Review the replacement below before importing.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'This file could not be imported. Your notebook has not changed.');
    }
  }

  function exportNotebook(format: 'markdown' | 'json') {
    try {
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`eduops-notebook-${date}.${format === 'json' ? 'json' : 'md'}`,
        format === 'json' ? JSON.stringify(progress, null, 2) : buildNotebookMarkdown(progress),
        format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8');
      setNotice(`${format === 'json' ? 'JSON backup' : 'Markdown notebook'} download requested.`);
    } catch {
      setNotice('Download could not start. Your notebook has not changed.');
    }
  }

  return (
    <div className="ls-studio">
      <header className="ls-hero">
        <div className="ls-hero-copy">
          <div className="ls-eyebrow"><span className="ls-dot" /> THE ENGINEERING PRACTICE</div>
          <h1>Learn the code.<br /><span>Build the judgment.</span></h1>
          <p>Start with your first small code change and build toward independent engineering. Learn through this working app: predict what happens, try a change, and explain the result.</p>
          <div className="ls-actions">
            <Link href="/learn/docs" className="ls-button ls-button-primary">Open the field guide <span aria-hidden="true">↗</span></Link>
            <Link href="/learn/docs/roadmap" className="ls-text-link">Explore the roadmap <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="ls-hero-aside">
          <span className="ls-eyebrow">YOUR PRACTICE, AT A GLANCE</span>
          <div className="ls-big-number">{ready ? summary.completed : '—'}<span> / {summary.total}</span></div>
          <p>Missions backed by your evidence</p>
          <progress className="ls-progress" value={summary.completed} max={summary.total} aria-label="Overall mission completion" />
          <div className="ls-stat-line"><span>{ready ? summary.percent : 0}% complete</span><span>{ready ? summary.inProgress : 0} in progress</span></div>
          <span className="ls-local-note">A learning record, not a promotion credential.</span>
        </div>
      </header>

      <section className="ls-start-here" aria-labelledby="start-here-title">
        <div className="ls-start-copy">
          <span className="ls-eyebrow">NEW TO BUILDING SOFTWARE?</span>
          <h2 id="start-here-title">Start here. One small win is enough.</h2>
          <p>You do not need to understand the whole app today. Get it running, follow one worked example, and change one thing you can explain.</p>
          <div className="ls-actions">
            <Link href="/learn/docs/beginner-start" className="ls-button ls-button-primary">Start the beginner guide <span aria-hidden="true">→</span></Link>
            <Link href="/learn/docs/worked-examples" className="ls-text-link">Follow a worked example <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="ls-practice-loop">
          <h3>Your first 25-minute practice</h3>
          <p>Once the app runs, use this loop. Getting stuck is a useful observation to write down.</p>
          <ol>
            <li><strong>Predict</strong><span>3 min</span><p>What do you think the code will do?</p></li>
            <li><strong>Read</strong><span>5 min</span><p>Find the input, decision, and output.</p></li>
            <li><strong>Change</strong><span>7 min</span><p>Make one small, reversible edit.</p></li>
            <li><strong>Test</strong><span>7 min</span><p>Check your prediction and one edge case.</p></li>
            <li><strong>Explain</strong><span>3 min</span><p>Write what changed and how you know.</p></li>
          </ol>
        </div>
      </section>

      <section className="ls-stages" aria-label="Learning stages">
        {levels.map((level, index) => {
          const stageMissions = missions.filter(item => item.level === level);
          const completed = stageMissions.filter(item => getMissionProgress(progress, item.id).status === 'completed').length;
          return <button className={`ls-stage ${stage === level ? 'ls-stage-active' : ''}`} key={level} onClick={() => setStage(stage === level ? 'All' : level)} aria-pressed={stage === level}>
            <span className="ls-stage-number">0{index + 1}</span>
            <span className="ls-stage-copy"><strong>{level}</strong><span>{stageDescriptions[level]}</span><span className="ls-stage-count">{completed} of {stageMissions.length} complete</span></span>
          </button>;
        })}
      </section>

      <div className="ls-recommendation">
        <div><span className="ls-eyebrow">{next ? 'SUGGESTED NEXT STEP' : 'KEEP YOUR PRACTICE ALIVE'}</span><strong>{next ? next.title : 'Every mission completed. Revisit your evidence and stretch exercises.'}</strong><span>{next ? `${next.level} · ${next.minutes} min · ${next.theme}` : 'Use your notebook to discuss your decisions with a reviewer.'}</span></div>
        {next && <button className="ls-button ls-button-secondary" onClick={() => selectMission(next.id)} disabled={!ready}>Open mission <span aria-hidden="true">→</span></button>}
      </div>

      <section className="ls-review-queue" aria-labelledby="review-queue-title">
        <div className="ls-section-heading">
          <div><span className="ls-eyebrow">COME BACK TO WHAT YOU LEARNED</span><h2 id="review-queue-title">Practice from memory</h2></div>
          <span className="ls-review-count">{dueReviews.length} due</span>
        </div>
        <p>Completed missions return here after seven days. Try their questions without the explanation, then compare and record what you still need to work on.</p>
        {dueReviews.length > 0 ? <ul className="ls-review-list">
          {dueReviews.map(item => <li key={item.id}>
            <div><strong>{item.title}</strong><span>{item.level} · {item.checkpoints.length} questions to revisit</span></div>
            <button className="ls-button ls-button-secondary" onClick={() => selectMission(item.id, true)} aria-label={`Practice from memory: ${item.title}`}>Practice from memory <span aria-hidden="true">→</span></button>
          </li>)}
        </ul> : <p className="ls-review-empty">{!ready ? 'Loading your review schedule…' : summary.completed > 0 ? 'No reviews due yet. You can revisit the questions in any completed mission whenever you like.' : 'Your first completed mission will appear here when it is time to revisit it.'}</p>}
      </section>

      <div className="ls-workspace">
        <aside className="ls-curriculum" aria-label="Mission curriculum">
          <div className="ls-section-heading"><h2>Your curriculum</h2><span>{missions.length} missions</span></div>
          <label className="ls-field-label" htmlFor="mission-search">Find a topic or code path</label>
          <input id="mission-search" className="ls-input" type="search" placeholder="Try permissions, testing…" value={search} onChange={event => setSearch(event.target.value)} />
          <label className="ls-field-label" htmlFor="stage-filter">Engineering stage</label>
          <select id="stage-filter" className="ls-input" value={stage} onChange={event => setStage(event.target.value as Level | 'All')}>
            <option value="All">All stages</option>{levels.map(level => <option key={level}>{level}</option>)}
          </select>
          <p className="ls-result-count" aria-live="polite">{filtered.length} of {missions.length} missions shown</p>
          <nav className="ls-mission-list" aria-label="Choose a mission">
            {filtered.map(item => {
              const status = getMissionProgress(progress, item.id).status;
              return <button key={item.id} className={`ls-mission-item ${item.id === mission.id ? 'ls-mission-selected' : ''}`} onClick={() => selectMission(item.id)} aria-current={item.id === mission.id ? 'true' : undefined}>
                <span className={`ls-mission-index ls-status-${status}`} aria-label={statusLabels[status]}>{status === 'completed' ? '✓' : String(missions.indexOf(item) + 1).padStart(2, '0')}</span>
                <span><span className="ls-mission-meta">{item.level} · {item.minutes} min</span><strong>{item.title}</strong><span className="ls-mission-theme">{status === 'in-progress' ? 'In progress · ' : ''}{item.theme}</span></span>
              </button>;
            })}
          </nav>
          {filtered.length === 0 && <div className="ls-empty"><p>No missions match that search.</p><button className="ls-text-link" onClick={() => { setSearch(''); setStage('All'); }}>Clear filters</button></div>}
          <div className="ls-sidebar-note"><strong>Follow the code, then question it.</strong><p>Stages suggest a sequence. Every mission is open, so you can follow the problem you want to understand.</p><Link href="/learn/docs">Browse all engineering notes →</Link></div>
        </aside>

        <article className="ls-mission-detail" aria-labelledby="mission-title" key={mission.id}>
          <header className="ls-mission-header">
            <div className="ls-mission-topline"><span className="ls-eyebrow">MISSION {String(missions.indexOf(mission) + 1).padStart(2, '0')} / {mission.level.toUpperCase()}</span><span className={`ls-status-pill ls-status-${entry.status}`}>{statusLabels[entry.status]}</span></div>
            <h2 id="mission-title" ref={headingRef} tabIndex={-1}>{mission.title}</h2>
            <p>{mission.summary}</p>
            <div className="ls-mission-metadata"><span>{mission.minutes} min guided practice</span><span>{mission.theme}</span>{entry.status === 'not-started' && <button className="ls-text-link" disabled={!ready} onClick={() => updateEntry({ status: 'in-progress' })}>Start mission →</button>}</div>
            <nav className="ls-jump-links" aria-label="Mission sections"><a href="#mission-understand">01 Understand</a><a href="#mission-practice">02 Practice</a><a href="#mission-notebook">03 Reflect & record</a></nav>
          </header>

          {prerequisites.length > 0 && <div className="ls-prerequisites"><strong>{missingPrerequisites.length ? 'Helpful preparation' : 'Preparation completed'}</strong><p>{missingPrerequisites.length ? 'These missions build the context for this one. You can still explore now.' : 'You have recorded evidence for all suggested prerequisites.'}</p><div>{prerequisites.map(item => <button key={item.id} className="ls-text-link" onClick={() => selectMission(item.id)}>{getMissionProgress(progress, item.id).status === 'completed' ? '✓ ' : ''}{item.title} →</button>)}</div></div>}

          <section id="mission-understand" className="ls-content-section">
            <span className="ls-eyebrow">01 / UNDERSTAND</span><h3>What you’ll learn to explain</h3>
            <ul className="ls-outcomes">{mission.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
            <div className="ls-concepts">{mission.concepts.map((concept, index) => <div className="ls-concept" key={concept.title}><span className="ls-concept-number">{String(index + 1).padStart(2, '0')}</span><div><h4>{concept.title}</h4><p>{concept.body}</p></div></div>)}</div>
            <div className="ls-code-map"><h4>Find it in this codebase</h4><p>Read the source here, then open it in your editor to make your change. Follow the callers and tests as you read.</p>{mission.codeRefs.map(ref => <div className="ls-code-ref" key={ref.path}><Link href={`/learn/source?path=${encodeURIComponent(ref.path)}`}><code>{ref.path}</code> <span aria-hidden="true">↗</span></Link><span>{ref.reason}</span></div>)}</div>
          </section>

          <section id="mission-practice" className="ls-content-section">
            <span className="ls-eyebrow">02 / PRACTICE</span><h3>{mission.lab.title}</h3>
            <p>Work in a local feature branch. Keep the change focused enough for someone else to review.</p>
            <ol className="ls-lab-steps">{mission.lab.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
            <div className="ls-deliverable"><span className="ls-eyebrow">YOUR DELIVERABLE</span><p>{mission.lab.deliverable}</p></div>
            <h4 className="ls-checkpoint-heading" id="mission-checkpoints" tabIndex={-1}>Pause. Explain it in your own words.</h4>
            <p>Try an answer before opening the explanation. An unfinished thought or “I’m unsure because…” is a useful starting point. Your answers save with this mission.</p>
            <span className={`ls-save-status ${storageError ? 'ls-save-error' : ''}`}>{saveStatus}</span>
            <div className="ls-checkpoints">{mission.checkpoints.map((checkpoint, index) => {
              const questionId = `question-${mission.id}-${index}`;
              const answerId = `answer-${mission.id}-${index}`;
              return <section className="ls-checkpoint" key={checkpoint.question} aria-labelledby={questionId}>
                <h4 id={questionId}><span className="ls-checkpoint-number">Q{index + 1}</span>{checkpoint.question}</h4>
                <label className="ls-field-label" htmlFor={answerId}>Your answer before the explanation <span className="ls-answer-index">· checkpoint {index + 1}</span></label>
                <textarea id={answerId} aria-describedby={questionId} className="ls-input ls-textarea ls-checkpoint-answer" rows={4} maxLength={5000} disabled={!ready} value={checkpointAnswers[index] ?? ''} placeholder="My prediction or explanation is… The part I’m unsure about is…" onChange={event => {
                  const answers = mission.checkpoints.map((_, answerIndex) => checkpointAnswers[answerIndex] ?? '');
                  answers[index] = event.target.value;
                  updateEntry({ checkpointAnswers: answers });
                }} />
                <details>
                  <summary><span>Compare with a model answer<small>Try your own explanation first</small></span></summary>
                  <div><strong>Model answer</strong><p>{checkpoint.answer}</p><p className="ls-compare-prompt">Compare with your answer: what did you get right, what is missing, and what would you test to check your understanding? Add the gap and your next step to your answer above.</p></div>
                </details>
              </section>;
            })}</div>
            {entry.status === 'completed' && <div className="ls-retrieval-record">
              <h4>Record a return to this idea</h4>
              <p>Try every question from memory before rereading your saved answers or opening the explanations. Then update your answers with what you recalled and any gaps. Recording this practice schedules another reminder in seven days.</p>
              {entry.reviewedAt && <p className="ls-review-date">Last retrieval practice: <time dateTime={entry.reviewedAt}>{new Date(entry.reviewedAt).toLocaleDateString()}</time></p>}
              <button className="ls-button ls-button-secondary" disabled={!ready || !allCheckpointsAttempted} aria-describedby="retrieval-practice-help" onClick={() => {
                const saved = updateEntry({ reviewedAt: new Date().toISOString() });
                setNotice(saved ? 'Retrieval practice recorded. Revisit this mission in seven days.' : 'Retrieval practice recorded in memory only. Export your work before leaving.');
              }}>Record retrieval practice</button>
              <p id="retrieval-practice-help" className="ls-field-help">{allCheckpointsAttempted ? 'Record this after you have tried each question again. This logs practice, not a mastery assessment.' : 'Add an answer to each question before recording retrieval practice.'}</p>
            </div>}
            <details className="ls-stretch"><summary>Go further: stretch exercise <span aria-hidden="true">↗</span></summary><p>{mission.stretch}</p></details>
          </section>

          <section id="mission-notebook" className="ls-content-section ls-notebook">
            <div className="ls-section-heading"><div><span className="ls-eyebrow">03 / REFLECT & RECORD</span><h3>Your engineering notebook</h3></div><span className="ls-notebook-tag">LOCAL TO YOU</span></div>
            <p>Capture the reasoning you want to keep: assumptions, surprises, rejected options, and what you would verify next.</p>
            <span className={`ls-save-status ${storageError ? 'ls-save-error' : ''}`} role="status">{saveStatus}</span>
            <label className="ls-field-label" htmlFor={`notes-${mission.id}`}>Personal notes & checkpoint answers</label>
            <textarea id={`notes-${mission.id}`} className="ls-input ls-textarea" rows={7} maxLength={50000} value={entry.notes} disabled={!ready} onChange={event => updateEntry({ notes: event.target.value })} placeholder="I expected… I found… The tradeoff I made was…" />
            <label className="ls-field-label" htmlFor={`evidence-${mission.id}`}>Evidence of your work <span className="ls-required">required to complete</span></label>
            <p className="ls-field-help" id="evidence-help">Add a commit or PR reference, test output, or a concrete explanation of what you built and verified.</p>
            <textarea id={`evidence-${mission.id}`} aria-describedby="evidence-help" className="ls-input ls-textarea" rows={4} maxLength={20000} value={entry.evidence} disabled={!ready} onChange={event => updateEntry({ evidence: event.target.value })} placeholder={'Change: …\nVerification: …\nEvidence or reference: …'} />
            <fieldset className="ls-rubric" disabled={!ready}><legend>Self-review checklist</legend><p>Check each item only when your evidence supports it.</p>{mission.rubric.map((criterion, index) => <label key={criterion}><input type="checkbox" checked={entry.checkedCriteria.includes(index)} onChange={event => updateEntry({ checkedCriteria: event.target.checked ? [...entry.checkedCriteria, index] : entry.checkedCriteria.filter(value => value !== index) })} /><span>{criterion}</span></label>)}</fieldset>
            <div className="ls-completion"><div><strong>{entry.status === 'completed' ? 'Mission evidence recorded' : `${entry.checkedCriteria.length} of ${mission.rubric.length} criteria reviewed`}</strong><p>{entry.status === 'completed' ? 'Revisit your notes any time. Removing evidence or a criterion reopens this mission.' : 'Review every criterion and add evidence to mark this mission complete.'}</p></div><button className="ls-button ls-button-primary" disabled={!ready || entry.status === 'completed' || !canCompleteMission(mission, entry)} onClick={() => { updateEntry({ status: 'completed', completedAt: new Date().toISOString() }); setNotice('Mission complete. Your evidence is recorded in your notebook.'); }}>{entry.status === 'completed' ? '✓ Completed' : 'Complete mission'}</button></div>
          </section>

          {mission.resources.length > 0 && <section className="ls-content-section ls-resources"><h3>Keep reading</h3><ul>{mission.resources.map(resource => <li key={resource.href}><Link href={resource.href}>{resource.label} <span aria-hidden="true">↗</span></Link></li>)}</ul></section>}
        </article>
      </div>

      <section className="ls-notebook-tools" aria-label="Notebook backup and export">
        <div><h2>Take your learning with you.</h2><p>Notes and progress stay in this browser, independent of the role switcher. Export Markdown for review or a JSON backup to restore elsewhere.</p><span className={`ls-save-status ${storageError ? 'ls-save-error' : ''}`} role="status">{saveStatus}</span></div>
        <div className="ls-actions"><button className="ls-button ls-button-secondary" disabled={!ready} onClick={() => exportNotebook('markdown')}>Export Markdown</button><button className="ls-button ls-button-secondary" disabled={!ready} onClick={() => exportNotebook('json')}>Back up JSON</button><button className="ls-text-link" disabled={!ready} onClick={() => fileRef.current?.click()}>Import backup</button><input ref={fileRef} className="ls-file-input" type="file" accept=".json,application/json" aria-label="Choose JSON notebook backup" onChange={previewImport} disabled={!ready} /></div>
        {pendingImport && <div className="ls-import-preview"><strong>Replace this browser’s notebook?</strong><p>The backup contains {getProgressSummary(pendingImport).completed} completed and {getProgressSummary(pendingImport).inProgress} in-progress missions. Replacing overwrites your current notes and progress. Download a backup above if you want to keep them.</p><div className="ls-actions"><button className="ls-button ls-button-primary" onClick={() => { const saved = persist(pendingImport, true); setPendingImport(null); setNotice(saved ? 'Notebook imported and saved on this browser.' : 'Notebook imported into memory only. Export your work before leaving.'); }}>Replace notebook with backup</button><button className="ls-button ls-button-secondary" onClick={() => { setPendingImport(null); setNotice('Import canceled. Your notebook has not changed.'); }}>Cancel</button></div></div>}
        {notice && <p className="ls-notice" role="status">{notice}</p>}
      </section>
    </div>
  );
}
