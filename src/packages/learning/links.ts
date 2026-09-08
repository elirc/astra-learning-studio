import { handbook } from './handbook';
import { sourcePaths } from './source-catalog';

/** Resolve trusted guide links only to known local material or HTTP(S) URLs. */
export function safeHref(href: string): string | null {
  if (href.includes('\\') || /[\u0000-\u0020\u007f]/.test(href)) return null;
  if (/^https?:\/\//.test(href)) {
    try {
      const url = new URL(href);
      return url.hostname ? href : null;
    } catch { return null; }
  }
  if (/^#[\w-]+$/.test(href)) return href;

  const match = href.match(/^([^#]+)(#[\w-]+)?$/);
  if (!match) return null;
  const [, target, fragment = ''] = match;
  if (target === '/learn' || target === '/learn/docs') return target + fragment;

  const localDoc = target.match(/^(?:\.\/)?([a-z-]+|README)\.md$/);
  if (localDoc?.[1] === 'README') return '/learn/docs' + fragment;
  const slug = localDoc?.[1] ?? target.match(/^\/learn\/docs\/([a-z-]+)$/)?.[1];
  if (slug) return handbook.some(document => document.slug === slug)
    ? `/learn/docs/${slug}${fragment}` : null;

  const source = target.replace(/^\.\.\//, '');
  if (sourcePaths.includes(source)) {
    return `/learn/source?path=${encodeURIComponent(source)}${fragment}`;
  }
  if (target.startsWith('/learn/source?')) {
    const params = new URLSearchParams(target.slice('/learn/source?'.length));
    const filePath = params.get('path');
    if ([...params.keys()].length === 1 && filePath && sourcePaths.includes(filePath)) {
      return `/learn/source?path=${encodeURIComponent(filePath)}${fragment}`;
    }
  }
  return null;
}
