import Link from 'next/link';
import { notFound } from 'next/navigation';
import { handbook, readHandbook } from '@/packages/learning/handbook';
import Markdown from '../../Markdown';
import '../../reading.css';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const doc = handbook.find(item => item.slug === params.slug);
  return { title: `${doc?.title ?? 'Guide not found'} | EduOps` };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const doc = await readHandbook(params.slug);
  if (!doc) notFound();
  const index = handbook.findIndex(item => item.slug === doc.slug);
  const next = handbook[index + 1];
  return <div className="reading-shell">
    <Link href="/learn/docs" className="reading-back">← All engineering guides</Link>
    <div className="reading-document-layout">
      <article className="reading-article"><Markdown content={doc.content} /></article>
      <aside className="reading-toc" aria-label="Engineering guides">
        <span className="reading-eyebrow">YOUR HANDBOOK</span>
        {handbook.map(item => <Link key={item.slug} href={`/learn/docs/${item.slug}`} aria-current={item.slug === doc.slug ? 'page' : undefined}>{item.title}</Link>)}
        <Link href="/learn" className="reading-return">Practice in Learning Studio →</Link>
      </aside>
    </div>
    {next && <Link className="reading-next" href={`/learn/docs/${next.slug}`}>Next guide: {next.title} →</Link>}
  </div>;
}
