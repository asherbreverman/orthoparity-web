import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/supply-chain')({
  staticData: {sitemap: true},
  head: () => procedureHead('For supply chain and sourcing | OrthoParity', 'What OrthoParity can answer for supply chain and sourcing teams, from public FDA and CMS records.', '/for/supply-chain'),
  component: Page,
});
function Page() {
  return <AudiencePage current="/for/supply-chain" title="For supply chain and sourcing" lead="What OrthoParity can answer for supply chain and sourcing teams, from public FDA and CMS records." cards={[
    {tag: 'CO', title: 'Company record', text: 'Ownership history, distribution, supplier sites and inspections, recalls and adverse event reports.', link: <Link to="/" search={{v: 'zimmer_biomet'}}>Open Zimmer Biomet ›</Link>},
    {tag: 'CAT', title: 'Every company in a product code', text: 'Each FDA product code with its companies, records and latest decision.', link: <Link to="/browse">Browse by category ›</Link>},
    {tag: 'PRT', title: 'Part number lookup', text: 'Find the product behind a catalog number. Try 213-65-05.', link: <Link to="/" search={{part: '213-65-05'}}>Look up a part ›</Link>},
    {tag: 'VS', title: 'Compare two companies', text: 'Where two companies hold FDA records in the same product codes, and where they don’t.', link: <Link to="/" search={{v: 'zimmer_biomet', compare: 'stryker'}}>Zimmer Biomet and Stryker ›</Link>},
    {tag: 'TM', title: 'Medicare episode exposure', text: 'Whether a hospital is in Medicare’s TEAM model and its 2027 target prices.', link: <Link to="/team">TEAM lookup ›</Link>},
  ]} />;
}
