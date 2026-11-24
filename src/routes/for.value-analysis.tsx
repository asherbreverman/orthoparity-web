import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/value-analysis')({
  staticData: {sitemap: true},
  head: () => procedureHead('For value analysis committees | OrthoParity', 'What OrthoParity can answer for a value analysis committee reviewing an orthopedic product request, from public FDA and CMS records.', '/for/value-analysis'),
  component: Page,
});
function Page() {
  return <AudiencePage title="For value analysis committees" lead="What OrthoParity can answer for a value analysis committee reviewing an orthopedic product request, from public FDA and CMS records." items={[
    <>Open a product's 12-question brief with questions for the vendor: search an FDA number, for example <Link className="brief-link" to="/" search={{k: 'K241487'}}>K241487</Link>.</>,
    <>Compare up to 50 products side by side and download a CSV: <Link className="brief-link" to="/" search={{k: 'K241487', compare: 'K181947'}}>compare two products</Link>.</>,
    <>Set a vendor packet's claim next to the public record with a <Link className="brief-link" to="/packet-check">packet check</Link>.</>,
    <>See every FDA record in a category: <Link className="brief-link" to="/browse">browse by category</Link>.</>,
    <>Check whether a hospital is in Medicare's TEAM model and which codes start an episode: <Link className="brief-link" to="/team">TEAM lookup</Link>.</>,
  ]} />;
}
