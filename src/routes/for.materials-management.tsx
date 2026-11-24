import { createFileRoute, Link } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { AudiencePage } from '@/components/site-pages';

export const Route = createFileRoute('/for/materials-management')({
  staticData: { sitemap: true },
  head: () => procedureHead('For materials management | OrthoParity', 'What OrthoParity can answer for materials management teams loading, stocking and paying for orthopedic implants, from public FDA and CMS records.', '/for/materials-management'),
  component: Page,
});
function Page() {
  return <AudiencePage current="/for/materials-management" title="For materials management" lead="What OrthoParity can answer for materials management teams loading, stocking and paying for orthopedic implants, from public FDA and CMS records." cards={[
    { tag: 'VS', title: 'Compare a list of parts', text: 'Paste up to 50 part numbers, add your price, and download every GUDID match as a CSV. Your prices stay in your browser.', link: <Link to="/" search={{ level: 'part', compare: '' }}>Compare parts ›</Link> },
    { tag: 'PRT', title: 'Part number lookup', text: 'The device behind a catalog number and every FDA number it’s listed under. Try 213-65-05.', link: <Link to="/" search={{ part: '213-65-05' }}>Look up a part ›</Link> },
    { tag: 'PRD', title: 'Catalog size and distribution', text: 'How many catalog items sit under a product, and how many are still in distribution. Try K140881.', link: <Link to="/" search={{ k: 'K140881' }}>Open a product ›</Link> },
    { tag: 'CAT', title: 'Discontinued brands by company', text: 'Brands with no devices left in commercial distribution, on every company page.', link: <Link to="/" search={{ v: 'zimmer_biomet' }}>Open a company ›</Link> },
    { tag: 'DRG', title: 'Medicare and ASC payments', text: 'What Medicare pays for the procedures a product is used in, including ASC rates and device portions.', link: <Link to="/procedures">Medicare by procedure ›</Link> },
  ]} />;
}
