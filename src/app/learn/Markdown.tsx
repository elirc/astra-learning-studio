import React from 'react';
import Link from 'next/link';
import { safeHref } from '@/packages/learning/links';

/** A deliberately small renderer for trusted repository guides. Raw HTML stays text. */
function inline(value: string): React.ReactNode[] {
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const output: React.ReactNode[] = [];
  let start = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index! > start) output.push(value.slice(start, match.index));
    const token = match[0];
    const key = match.index;
    if (token.startsWith('`')) output.push(<code key={key}>{token.slice(1, -1)}</code>);
    else if (token.startsWith('**')) output.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*')) output.push(<em key={key}>{token.slice(1, -1)}</em>);
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const href = safeHref(link[2]);
      output.push(href ? <Link key={key} href={href}>{inline(link[1])}</Link> : <span key={key}>{inline(link[1])}</span>);
    }
    start = match.index! + token.length;
  }
  output.push(value.slice(start));
  return output;
}

const startsBlock = (line: string) => /^(#{1,6} |```|\s*[-*] |\s*\d+\. |> |\|)|^---+$/.test(line);
export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  const headings = new Map<string, number>();
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    const key = i;
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(<div className="reading-code" key={key}>{language && <span>{language}</span>}<pre><code>{code.join('\n')}</code></pre></div>);
      continue;
    }
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      const base = heading[2].toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const count = headings.get(base) ?? 0;
      headings.set(base, count + 1);
      const id = `${base}${count ? `-${count}` : ''}`;
      // The application shell has the page's h1; guide titles begin at h2.
      const Tag = `h${Math.min(heading[1].length + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      blocks.push(<Tag key={key} id={id}>{inline(heading[2])}</Tag>); i++; continue;
    }
    if (/^---+$/.test(line)) { blocks.push(<hr key={key} />); i++; continue; }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i++].replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
        if (!row.every(cell => /^:?-+:?$/.test(cell))) rows.push(row);
      }
      blocks.push(<div className="reading-table-wrap" key={key}><table><thead><tr>{rows[0]?.map((cell, col) => <th scope="col" key={col}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, r) => <tr key={r}>{row.map((cell, col) => <td key={col}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: React.ReactNode[] = [];
      const pattern = ordered ? /^\s*\d+\. (.*)$/ : /^\s*[-*] (.*)$/;
      while (i < lines.length && pattern.test(lines[i])) {
        let text = lines[i++].replace(pattern, '$1');
        while (i < lines.length && /^\s+\S/.test(lines[i]) && !startsBlock(lines[i])) text += ` ${lines[i++].trim()}`;
        items.push(<li key={i}>{inline(text)}</li>);
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>); continue;
    }
    if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2));
      blocks.push(<blockquote key={key}>{inline(quote.join(' '))}</blockquote>); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) paragraph.push(lines[i++]);
    blocks.push(<p key={key}>{inline(paragraph.join(' '))}</p>);
  }
  return <>{blocks}</>;
}
