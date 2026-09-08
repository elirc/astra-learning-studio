import Link from 'next/link';
import { notFound } from 'next/navigation';
import { missions } from '@/packages/learning/curriculum';
import { readSource } from '@/packages/learning/source';
import '../reading.css';

export const metadata = { title: 'Read the source | EduOps' };

export default async function SourcePage({ searchParams }: { searchParams: { path?: string } }) {
  const filePath = searchParams.path;
  if (!filePath) notFound();
  const source = await readSource(filePath);
  if (source === null) notFound();
  const related = missions.filter(mission => mission.codeRefs.some(ref => ref.path === filePath));
  return <div className="reading-shell">
    <Link href="/learn" className="reading-back">← Learning Studio</Link>
    <header className="reading-header"><span className="reading-eyebrow">READ THE IMPLEMENTATION</span>
      <h2 className="reading-filename">{filePath}</h2>
      <p>Follow the inputs, decisions, and side effects. Use your editor to make changes and run the tests.</p>
    </header>
    <div className="reading-source"><pre><code>{source.replace(/\r\n/g, '\n').split('\n').map((line, index) => <span className="reading-source-line" id={`L${index + 1}`} key={index}><a href={`#L${index + 1}`} aria-label={`Line ${index + 1}`}>{index + 1}</a><span>{line || ' '}</span>{'\n'}</span>)}</code></pre></div>
    <div className="reading-related"><h3>Practice with this file</h3>{related.map(mission => <Link key={mission.id} href={`/learn?mission=${mission.id}`}>{mission.title} →</Link>)}</div>
  </div>;
}
