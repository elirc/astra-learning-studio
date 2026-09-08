import Link from 'next/link';
import { handbook } from '@/packages/learning/handbook';
import '../reading.css';

export const metadata = { title: 'Engineering handbook | EduOps' };

export default function HandbookPage() {
  return <div className="reading-shell">
    <Link href="/learn" className="reading-back">← Learning Studio</Link>
    <header className="reading-header">
      <span className="reading-eyebrow">ASTRA / ENGINEERING HANDBOOK</span>
      <h2>Build the judgment behind the code.</h2>
      <p>Start with your first function and test, then work toward owning features and explaining system tradeoffs. Each guide gives you something to try in this repository and evidence to capture in your notebook.</p>
    </header>
    <div className="reading-grid">
      {handbook.map((doc, index) => <Link key={doc.slug} href={`/learn/docs/${doc.slug}`} className="reading-card">
        <span className="reading-eyebrow">{String(index + 1).padStart(2, '0')} / {doc.category}</span>
        <h3>{doc.title}</h3><p>{doc.description}</p><span className="reading-card-action">Read guide →</span>
      </Link>)}
    </div>
    <p className="reading-footnote">These guides also live in the repository’s <code>astra docs</code> folder. Exercises describe work to practice; they do not imply that the demo has production guarantees.</p>
  </div>;
}
