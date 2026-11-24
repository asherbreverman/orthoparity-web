import { Children, isValidElement, type ReactNode } from 'react';
import { PageHead } from './op-controls';

const slug = (title: string) => title.toLowerCase().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const sections = Children.toArray(children).flatMap(child => isValidElement<{ title?: unknown }>(child) && child.type === LegalSection && typeof child.props.title === 'string' ? [child.props.title] : []);
  return <article className="legal-page">
    <PageHead eyebrow="About" title={title} lead="Effective November 20, 2026" />
    <div className="op-wrap op-section legal-layout">
      <nav className="legal-toc" aria-label="On this page"><p className="op-eyebrow">On this page</p><ol>{sections.map(t => <li key={t}><a href={`#${slug(t)}`}>{t}</a></li>)}</ol></nav>
      <div className="legal-body op-prose">{children}</div>
    </div>
  </article>;
}
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section id={slug(title)} className="brief-section legal-section"><h2 className="op-h3">{title}</h2>{children}</section>;
}
