import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { handbook } from '../src/packages/learning/handbook';
import { safeHref } from '../src/packages/learning/links';
import { sourcePaths } from '../src/packages/learning/source-catalog';
import { readSource } from '../src/packages/learning/source';

describe('learning guide links and source access', () => {
  test('reads every cataloged source through the bounded source helper', async () => {
    for (const source of sourcePaths) {
      assert.equal(await readSource(source), readFileSync(source, 'utf8'), `Unreadable ${source}`);
    }
  });

  test('source helper refuses unknown and traversal paths before reading', async () => {
    for (const source of [
      '', '.env', 'README.md', 'src/unknown.ts', '../package.json',
      'src/../package.json', 'src/../../.env', '/package.json',
      'prisma/dev.db', 'src%2F..%2F.env', 'C:\\Users\\E\\.env',
    ]) assert.equal(await readSource(source), null, `Accepted ${source}`);
  });

  test('every cataloged source is a unique existing relative file', () => {
    assert.equal(sourcePaths.length, new Set(sourcePaths).size);
    for (const source of sourcePaths) {
      assert.ok(!path.isAbsolute(source) && !source.includes('..') && !source.includes('\\'));
      assert.ok(existsSync(source), `Missing public source: ${source}`);
    }
  });

  test('every link in the published handbook resolves to an existing route or source', () => {
    for (const document of handbook) {
      const content = readFileSync(path.join('astra docs', `${document.slug}.md`), 'utf8');
      for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const resolved = safeHref(match[1]);
        assert.ok(resolved, `Unresolved ${match[1]} in ${document.slug}`);
        if (/^https?:\/\//.test(resolved) || resolved.startsWith('#')) continue;
        const url = new URL(resolved, 'https://learning.invalid');
        if (url.pathname === '/learn/source') {
          assert.ok(sourcePaths.includes(url.searchParams.get('path') ?? ''));
        } else if (url.pathname !== '/learn' && url.pathname !== '/learn/docs') {
          assert.ok(handbook.some(item => url.pathname === `/learn/docs/${item.slug}`));
        }
      }
    }
  });

  test('resolves guide index, known slugs, configuration files, and source anchors', () => {
    assert.equal(safeHref('README.md'), '/learn/docs');
    assert.equal(safeHref('./README.md'), '/learn/docs');
    assert.equal(safeHref('roadmap.md#choose-your-pace'), '/learn/docs/roadmap#choose-your-pace');
    assert.equal(safeHref('../tsconfig.json'), '/learn/source?path=tsconfig.json');
    assert.equal(safeHref('../package.json'), '/learn/source?path=package.json');
    assert.equal(safeHref('../src/packages/domain/rules/digest.ts#L10'),
      '/learn/source?path=src%2Fpackages%2Fdomain%2Frules%2Fdigest.ts#L10');
    assert.equal(safeHref('https://example.com/docs'), 'https://example.com/docs');
  });

  test('refuses unknown files and guides, traversal, unsafe URLs, and duplicate parameters', () => {
    for (const href of [
      '../../package.json', '../src/../package.json', '../.env', 'src/unknown.ts',
      'missing.md', '/learn/docs/missing', '/learn/../../package.json',
      '/learn/docs/%2e%2e/package.json', '/learn/source?path=..%2F.env',
      '/learn/source?path=package.json&path=.env', '/learn/source?path=package.json&other=1',
      'javascript:alert(1)', 'data:text/html,test', 'file:///C:/secret', '//example.com',
      'https://example.com\\@evil.test', 'https://example.com\n', '/learnevil',
    ]) assert.equal(safeHref(href), null, `Accepted ${href}`);
  });
});
