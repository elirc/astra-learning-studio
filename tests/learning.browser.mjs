// Optional real-browser smoke check. Run against a seeded, running app:
// LEARNING_BASE_URL=http://localhost:3100 node tests/learning.browser.mjs
// Requires Playwright available to Node, or PLAYWRIGHT_MODULE_PATH pointing to it.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const baseURL = process.env.LEARNING_BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true });
const errors = [];
context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
const page = await context.newPage();
const visit = url => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
const waitNotebook = target => target.waitForFunction(() => {
  const field = document.querySelector('textarea');
  return Boolean(field && !field.disabled);
});
const key = 'eduops.astra.learning.v1';
const first = 'trace-a-request';
const beginner = 'beginner-safe-workflow';
const notebook = () => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
const notes = () => page.getByLabel('Personal notes & checkpoint answers');
const complete = () => page.getByRole('button', { name: 'Complete mission', exact: true });
const answers = () => page.locator('.ls-checkpoint-answer');
try {
  await visit(`${baseURL}/`);
  await page.waitForURL(url => url.pathname === '/learn');
  await waitNotebook(page);
  assert.equal(await page.locator('.ls-mission-item').count(), 24);
  assert.match(await page.locator('.ls-mission-selected .ls-mission-meta').innerText(), /^Beginner/);
  assert.equal(await page.locator('#mission-title').innerText(), 'Get comfortable in the terminal and Git');
  assert.equal(await page.getByRole('link', { name: 'Start the beginner guide' }).getAttribute('href'), '/learn/docs/beginner-start');
  assert.equal(await page.getByRole('link', { name: 'Follow a worked example' }).getAttribute('href'), '/learn/docs/worked-examples');
  console.log('PASS home redirects to Beginner learning with accessible starting guides');

  await visit(`${baseURL}/learn?mission=${first}`);
  await notes().waitFor();
  await waitNotebook(page);
  const input = page.getByLabel('Choose JSON notebook backup');
  const legacy = { version: 1, missions: { [first]: {
    status: 'in-progress', notes: 'Observed the action boundary, then verified the persisted result.',
    evidence: '', checkedCriteria: [], completedAt: null, updatedAt: new Date().toISOString(),
  } } };
  await input.setInputFiles({ name: 'legacy-notebook.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
  await page.getByRole('button', { name: 'Replace notebook with backup' }).click();
  assert.equal(await notes().inputValue(), legacy.missions[first].notes);
  assert.deepEqual((await notebook()).missions[first].checkpointAnswers, []);
  assert.equal((await notebook()).missions[first].reviewedAt, null);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  assert.equal(await notes().inputValue(), legacy.missions[first].notes);
  console.log('PASS legacy backup imports notes with compatible defaults for new fields');

  const answerCount = await answers().count();
  assert.ok(answerCount >= 2, 'the test mission must have at least two checkpoint questions');
  assert.deepEqual(await page.locator('.ls-checkpoints details').evaluateAll(details => details.map(item => item.open)), Array(answerCount).fill(false));
  assert.equal(await page.getByText('Model answer', { exact: true }).first().isVisible(), false);
  await answers().nth(1).fill('Second checkpoint attempt: trace the action and verify its observable result.');
  const secondFirst = (await notebook()).missions[first].checkpointAnswers;
  assert.equal(secondFirst.length, answerCount);
  assert.equal(secondFirst[0], '');
  assert.ok(secondFirst.every(answer => typeof answer === 'string'), 'later-first answers must serialize as dense strings, never null');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  assert.equal(await answers().first().inputValue(), '');
  assert.match(await answers().nth(1).inputValue(), /Second checkpoint attempt/);
  await answers().first().fill('First checkpoint attempt: predict the input, decision, and saved output.');
  for (let index = 2; index < answerCount; index++) await answers().nth(index).fill(`Attempt for checkpoint ${index + 1}: explain the behavior and a useful verification.`);
  assert.equal(await page.getByText('Model answer', { exact: true }).first().isVisible(), false);
  await page.locator('.ls-checkpoints summary').first().click();
  assert.ok(await page.getByText('Model answer', { exact: true }).first().isVisible());
  assert.ok(await page.locator('.ls-compare-prompt').first().isVisible());
  console.log('PASS second-answer-first persistence, dense arrays, and deliberate explanation disclosure');

  assert.ok(await complete().isDisabled());
  await notes().fill('Observed the action boundary, then verified the persisted result.');
  for (const checkbox of await page.locator('.ls-rubric input').all()) await checkbox.check();
  assert.ok(await complete().isDisabled(), 'rubric alone must not complete a mission');
  await page.getByLabel('Evidence of your work').fill('Trace diagram + negative test output: verified actor and data flow.');
  await complete().click();
  assert.equal((await notebook()).missions[first].status, 'completed');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  assert.match(await notes().inputValue(), /Observed the action boundary/);
  assert.ok(await page.getByRole('button', { name: '✓ Completed', exact: true }).isDisabled());
  console.log('PASS completion gating, notes, and reload persistence');

  const switcher = page.locator('header.app-header select');
  const student = await switcher.locator('option').evaluateAll(options => options.find(option => option.textContent.includes('(Student)'))?.value);
  assert.ok(student);
  await switcher.selectOption(student);
  await page.waitForFunction(id => document.cookie.split(';').some(cookie => cookie.trim() === `mock_user_id=${id}`), student);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  assert.match(await notes().inputValue(), /Observed the action boundary/);
  assert.equal(await switcher.inputValue(), student);
  console.log('PASS notebook survives demo role switch');

  await page.getByLabel('Engineering stage', { exact: true }).selectOption('Senior');
  assert.equal(await page.locator('.ls-mission-item').count(), 6);
  await page.getByLabel('Find a topic or code path').fill('no-such-learning-topic-90210');
  assert.equal(await page.locator('.ls-mission-item').count(), 0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  assert.equal(await page.locator('.ls-mission-item').count(), 24);
  await page.locator('.ls-checkpoints summary').first().click();
  assert.ok(await page.getByText('Model answer', { exact: true }).first().isVisible());
  console.log('PASS stage filters, search recovery, checkpoint disclosure');

  const saved = await notebook();
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await page.getByText('Choose a valid JSON notebook backup.', { exact: true }).waitFor();
  assert.deepEqual(await notebook(), saved);
  await input.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.getByRole('button', { name: 'Replace notebook with backup' }).waitFor();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.deepEqual(await notebook(), saved);
  await input.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.getByRole('button', { name: 'Replace notebook with backup' }).click();
  assert.deepEqual(await notebook(), saved);
  for (const name of ['Export Markdown', 'Back up JSON']) {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), name === 'Back up JSON' ? /^eduops-notebook-\d{4}-\d{2}-\d{2}\.json$/ : /^eduops-notebook-\d{4}-\d{2}-\d{2}\.md$/);
    const downloaded = await readFile(await download.path(), 'utf8');
    if (name === 'Back up JSON') {
      const exported = JSON.parse(downloaded);
      assert.deepEqual(exported, saved);
      assert.match(exported.missions[first].checkpointAnswers[1], /Second checkpoint attempt/);
    } else {
      assert.match(downloaded, /Observed the action boundary/);
      assert.match(downloaded, /First checkpoint attempt/);
      assert.match(downloaded, /Second checkpoint attempt/);
    }
  }
  console.log('PASS invalid import preservation, import preview/cancel/replace, notes and answers in both exports');

  // This browser context owns its local notebook; changing its dates avoids waiting a week.
  const oldCompletion = await page.evaluate(({ storageKey, missionId }) => {
    const state = JSON.parse(localStorage.getItem(storageKey));
    const completedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    state.missions[missionId] = { ...state.missions[missionId], completedAt, reviewedAt: null, checkpointAnswers: [] };
    localStorage.setItem(storageKey, JSON.stringify(state));
    return completedAt;
  }, { storageKey: key, missionId: first });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  const dueQueue = page.locator('.ls-review-queue');
  assert.equal(await dueQueue.locator('.ls-review-list li').count(), 1);
  const missionTitle = await page.locator('#mission-title').innerText();
  await page.locator('.ls-checkpoints summary').first().click();
  await dueQueue.getByRole('button', { name: `Practice from memory: ${missionTitle}`, exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'mission-checkpoints');
  assert.equal(new URL(page.url()).searchParams.get('mission'), first);
  assert.deepEqual(await page.locator('.ls-checkpoints details').evaluateAll(details => details.map(item => item.open)), Array(answerCount).fill(false));
  const recordPractice = page.getByRole('button', { name: 'Record retrieval practice', exact: true });
  assert.ok(await recordPractice.isDisabled());
  await answers().first().fill('From memory: identify the boundary, inputs, and observable output.');
  assert.ok(await recordPractice.isDisabled(), 'one attempted answer must not record all checkpoint practice');
  for (let index = 1; index < answerCount; index++) await answers().nth(index).fill(`Retrieval attempt ${index + 1}: recall the behavior, then identify a gap to check.`);
  await recordPractice.click();
  const reviewed = (await notebook()).missions[first];
  assert.equal(reviewed.status, 'completed');
  assert.ok(Number.isFinite(Date.parse(reviewed.reviewedAt)) && Date.parse(reviewed.reviewedAt) > Date.parse(oldCompletion));
  assert.equal(await dueQueue.locator('.ls-review-list li').count(), 0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitNotebook(page);
  assert.equal((await notebook()).missions[first].reviewedAt, reviewed.reviewedAt);
  assert.equal(await dueQueue.locator('.ls-review-list li').count(), 0);
  console.log('PASS seven-day review queue, answer gating, retrieval date persistence, and due-item removal');
  await mkdir('astra docs/verification', { recursive: true });
  await page.locator('.ls-checkpoints').screenshot({ path: 'astra docs/verification/upskilling-checkpoints.png' });

  await page.locator('.ls-rubric input').first().uncheck();
  assert.equal((await notebook()).missions[first].status, 'in-progress');
  assert.equal((await notebook()).missions[first].completedAt, null);
  console.log('PASS removing a criterion reopens completed work');

  const secondTab = await context.newPage();
  await secondTab.goto(`${baseURL}/learn?mission=${first}`, { waitUntil: 'domcontentloaded' });
  await waitNotebook(secondTab);
  await page.bringToFront();
  await waitNotebook(page);
  await notes().fill('Newer notes written by the first tab.');
  await secondTab.bringToFront();
  await secondTab.getByLabel('Personal notes & checkpoint answers').fill('Unsaved conflicting work in the second tab.');
  assert.equal((await notebook()).missions[first].notes, 'Newer notes written by the first tab.');
  assert.match(await secondTab.locator('.ls-notebook .ls-save-status').innerText(), /Another tab changed/);
  assert.equal(await secondTab.getByLabel('Personal notes & checkpoint answers').inputValue(), 'Unsaved conflicting work in the second tab.');
  await secondTab.close();
  console.log('PASS stale tab cannot overwrite another tab’s notebook');

  await visit(`${baseURL}/learn/docs`);
  assert.equal(await page.locator('.reading-card').count(), 11);
  const guides = await page.locator('.reading-card').evaluateAll(links => links.map(link => link.getAttribute('href')));
  for (const guide of guides) {
    const response = await visit(`${baseURL}${guide}`);
    assert.equal(response.status(), 200, guide);
    assert.ok((await page.locator('.reading-article').innerText()).length > 1000);
  }
  await visit(`${baseURL}/learn/source?path=src%2Fapp%2Factions.ts`);
  assert.ok(await page.locator('.reading-source').isVisible());
  assert.equal((await visit(`${baseURL}/learn/source?path=..%2Fpackage.json`)).status(), 404);
  assert.equal((await visit(`${baseURL}/learn/docs/not-a-guide`)).status(), 404);
  console.log('PASS every handbook guide, source reader, and unknown-path 404s');
  assert.equal((await visit(`${baseURL}/lab`)).status(), 200);
  console.log('PASS practice lab remains available at /lab');

  await visit(`${baseURL}/learn?mission=${beginner}`);
  await notes().waitFor();
  await waitNotebook(page);
  await mkdir('astra docs/verification', { recursive: true });
  await page.screenshot({ path: 'astra docs/verification/upskilling-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'astra docs/verification/upskilling-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile page must not overflow horizontally');
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  console.log('PASS desktop/mobile rendering without browser errors');
} catch (error) {
  console.error('Browser pages at failure:', context.pages().map(tab => tab.url()));
  console.error('Page errors:', errors);
  console.error('Visible page:', await page.locator('body').innerText({ timeout: 5000 }).then(text => text.slice(0, 1800)).catch(() => 'Page body unavailable'));
  await mkdir('astra docs/verification', { recursive: true });
  await page.screenshot({ path: 'astra docs/verification/upskilling-browser-failure.png', timeout: 10000 }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
