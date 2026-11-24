import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/asc')({
  staticData: {sitemap: true},
  head: () => procedureHead('For ambulatory surgery centers | OrthoParity', 'What OrthoParity can answer for an ambulatory surgery center weighing an orthopedic product, from public FDA and CMS records.', '/for/asc'),
  component: Page,
});
function Page() {
  return <AudiencePage title="For ambulatory surgery centers" lead="What OrthoParity can answer for an ambulatory surgery center weighing an orthopedic product, from public FDA and CMS records." items={[
    <>Medicare CY 2027 ASC rates and device portions appear in each product's Medicare box, for example <Link className="brief-link" to="/" search={{k: 'K241487'}}>K241487</Link>.</>,
    <>What Medicare pays for common orthopedic procedures: <Link className="brief-link" to="/procedures">procedure pages</Link>.</>,
    <>Look up a catalog part number from the search box, for example <Link className="brief-link" to="/" search={{part: '213-65-05'}}>213-65-05</Link>.</>,
    <>Registered clinical trials and the supplier record (sites, inspections, warning letters) on each product page.</>,
    <>Set a vendor packet's claim next to the public record with a <Link className="brief-link" to="/packet-check">packet check</Link>.</>,
  ]} />;
}
