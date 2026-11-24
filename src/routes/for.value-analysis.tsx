import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/value-analysis')({
  staticData: {sitemap: true},
  head: () => procedureHead('For value analysis committees | OrthoParity', 'What OrthoParity can answer for a value analysis committee reviewing an orthopedic product request, from public FDA and CMS records.', '/for/value-analysis'),
  component: Page,
});
function Page() {
  return <AudiencePage current="/for/value-analysis" title="For value analysis committees" lead="What OrthoParity can answer for a value analysis committee reviewing an orthopedic product request, from public FDA and CMS records." cards={[
    {tag: 'PRD', title: 'A 12-question product brief', text: 'Search an FDA number for the brief, with questions for the vendor. Try K241487.', link: <Link to="/" search={{k: 'K241487'}}>Open a product ›</Link>},
    {tag: 'VS', title: 'Compare products', text: 'Up to 50 products side by side, with your own prices kept in your browser and a CSV download.', link: <Link to="/" search={{k: 'K241487', compare: 'K181947'}}>Compare two products ›</Link>},
    {tag: 'PKT', title: 'Packet check', text: 'Set a vendor packet’s claims next to the FDA record and the trial registry.', link: <Link to="/packet-check">Check a packet ›</Link>},
    {tag: 'CAT', title: 'Every record in a category', text: 'All FDA records in a product code, with companies and dates.', link: <Link to="/browse">Browse by category ›</Link>},
    {tag: 'TM', title: 'Medicare TEAM', text: 'Whether a hospital is in TEAM and which codes start an episode.', link: <Link to="/team">TEAM lookup ›</Link>},
  ]} />;
}
