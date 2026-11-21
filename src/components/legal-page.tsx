import type { ReactNode } from 'react';

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <article className="legal-page"><section className="result-header"><h1 className="result-title">{title}</h1><p className="section-caption">Effective November 20, 2026</p></section>{children}</article>;
}
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="brief-section"><h2>{title}</h2>{children}</section>;
}