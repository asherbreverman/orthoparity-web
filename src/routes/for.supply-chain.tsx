import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/supply-chain')({
  staticData: {sitemap: true},
  head: () => procedureHead('For supply chain and sourcing | OrthoParity', 'What OrthoParity can answer for supply chain and sourcing teams, from public FDA and CMS records.', '/for/supply-chain'),
  component: Page,
});
function Page() {
  return <AudiencePage title="For supply chain and sourcing" lead="What OrthoParity can answer for supply chain and sourcing teams, from public FDA and CMS records." items={[
    <>Company pages with ownership history, distribution, supplier sites and inspections, recalls and adverse event reports, for example <Link className="brief-link" to="/" search={{v: 'zimmer_biomet'}}>Zimmer Biomet</Link>.</>,
    <>Every company in a product code: <Link className="brief-link" to="/browse">category directories</Link>.</>,
    <>Look up a catalog part number from the search box, for example <Link className="brief-link" to="/" search={{part: '213-65-05'}}>213-65-05</Link>.</>,
    <>Compare two companies: <Link className="brief-link" to="/" search={{v: 'zimmer_biomet', compare: 'stryker'}}>Zimmer Biomet and Stryker</Link>.</>,
    <>Medicare episode exposure by hospital: <Link className="brief-link" to="/team">TEAM lookup</Link>.</>,
  ]} />;
}
