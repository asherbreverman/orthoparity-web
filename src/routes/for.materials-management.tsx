import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/materials-management')({
  staticData: { sitemap: true },
  head: () => procedureHead('For materials management | OrthoParity', 'What OrthoParity can answer for materials management teams, from public FDA and CMS records.', '/for/materials-management'),
  component: Page,
});
function Page() {
  return <AudiencePage title="For materials management" lead="What OrthoParity can answer for materials management teams, from public FDA and CMS records." items={[
    <>Find the product behind a catalog or model number, for example <Link className="brief-link" to="/" search={{ part: '213-65-05' }}>213-65-05</Link>.</>,
    <>Review catalog size and distribution on company pages, for example <Link className="brief-link" to="/" search={{ v: 'zimmer_biomet' }}>Zimmer Biomet</Link>.</>,
    <>See every FDA record in a category: <Link className="brief-link" to="/browse">browse by category</Link>.</>,
    <>Check Medicare and ASC payments by procedure: <Link className="brief-link" to="/procedures">procedure pages</Link>.</>,
    <>Compare products behind part numbers and download a CSV from the <Link className="brief-link" to="/" search={{ level: 'part', compare: '' }}>part comparison search</Link>.</>,
  ]} />;
}
