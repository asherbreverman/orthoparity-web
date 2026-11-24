import { Link } from '@tanstack/react-router';
import { glossaryTerms } from '@/lib/glossary';

export function GlossaryPage() {
  return <>
    <section className="op-band">
      <div className="op-wrap op-pagehead">
        <p className="op-eyebrow">Trust</p>
        <h1 className="op-title">Glossary</h1>
        <p className="op-lead op-prose">Plain-English definitions of the FDA and CMS terms on OrthoParity. Dotted-underlined words across the site link here.</p>
      </div>
    </section>
    <section className="op-wrap op-section" aria-label="Glossary terms">
      <nav className="op-row op-glossary-chips" aria-label="Common glossary terms">
        {glossaryTerms.slice(0, 9).map(entry => <Link key={entry.id} className="op-chip" to="/glossary" hash={entry.id}>{entry.term}</Link>)}
      </nav>
      <div className="op-table-wrap op-glossary-table">
        <table className="op-table">
          <thead><tr><th scope="col">Term</th><th scope="col">What it means</th></tr></thead>
          <tbody>{glossaryTerms.map(entry => <tr key={entry.id} id={entry.id}><td className="nw"><b>{entry.term}</b></td><td>{entry.definition}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </>;
}
