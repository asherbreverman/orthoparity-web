import { createFileRoute } from '@tanstack/react-router';
import { LegalPage, LegalSection } from '@/components/legal-page';
import { procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';

export const Route = createFileRoute('/terms')({
  staticData: { sitemap: true },
  head: () => procedureHead(pageTitle("Terms of Use"), "Terms for using OrthoParity, a free, open-source orthopedic device and vendor research website.", '/terms'),
  component: LegalContent,
});
function LegalContent() {
  return <LegalPage title="Terms of Use">
<section className="brief-section legal-intro"><p className="section-lead">{"OrthoParity (www.orthoparity.com) is a free, open-source website that benchmarks orthopedic devices and vendors using public data from the U.S. Food and Drug Administration (FDA) and the Centers for Medicare & Medicaid Services (CMS). By using the site, you agree to these terms."}</p></section>
<LegalSection title="1. Free and open source">
<p className="section-lead">{"The site is free to use. Its code is open source under the MIT License at "}<a className="brief-link" href="https://github.com/asherbreverman/orthoparity-data" target="_blank" rel="noopener noreferrer">{"github.com/asherbreverman/orthoparity-data"}</a>{". The underlying FDA and CMS data are public government data."}</p>
</LegalSection>
<LegalSection title="2. Information only">
<p className="section-lead">{"OrthoParity provides information, not advice. Nothing on the site is medical, clinical, regulatory, legal, financial or purchasing advice, and nothing on it recommends or rates a device, company, hospital, group purchasing organization or clinician. A payment, recall, adverse event report or inspection result shown on the site is a fact from a public record, not a judgment about safety, quality or conduct. Make decisions using the primary sources, your organization's own processes and qualified professionals."}</p>
</LegalSection>
<LegalSection title="3. Accuracy and limitations">
<p className="section-lead">{"The site is built from public records that can contain errors, gaps and delays. Some steps, such as reading 510(k) summaries and matching company and product names across data sets, are automated and can be wrong. Entries still awaiting human review are labeled as drafts. Every page shows the date of the data it uses, and the About and limitations section lists known limitations. Check important facts against the linked FDA and CMS sources. To report an error, open an issue at "}<a className="brief-link" href="https://github.com/asherbreverman/orthoparity-data/issues" target="_blank" rel="noopener noreferrer">{"github.com/asherbreverman/orthoparity-data/issues"}</a>{"."}</p>
</LegalSection>
<LegalSection title="4. No affiliation">
<p className="section-lead">{"OrthoParity is not affiliated with, endorsed by or sponsored by FDA, CMS or any manufacturer, distributor, hospital, health system or group purchasing organization. It is the author's personal work and does not speak for any employer."}</p>
</LegalSection>
<LegalSection title="5. Names and trademarks">
<p className="section-lead">{"Product and company names on the site belong to their owners. They appear only to identify the products and companies that public records describe."}</p>
</LegalSection>
<LegalSection title="6. Acceptable use">
<p className="section-lead">{"Please don't use the site in a way that disrupts it for others, such as automated requests at a rate that slows it down. The full data set is available as a download on GitHub, so you don't need to scrape the site. Don't present OrthoParity's pages as official FDA or CMS publications, and don't use the site to identify, profile or target individual people."}</p>
</LegalSection>
<LegalSection title="7. No warranty">
<p className="section-lead">{"The site and its data are provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including accuracy, completeness, fitness for a particular purpose and non-infringement."}</p>
</LegalSection>
<LegalSection title="8. Limitation of liability">
<p className="section-lead">{"To the fullest extent the law allows, the author is not liable for any direct, indirect, incidental, consequential or other damages arising from use of, or inability to use, the site or its data, including decisions made using it."}</p>
</LegalSection>
<LegalSection title="9. Changes">
<p className="section-lead">{"These terms may change. The effective date at the top shows when they last changed. Continuing to use the site after a change means you accept the updated terms."}</p>
</LegalSection>
<LegalSection title="10. Governing law">
<p className="section-lead">{"These terms are governed by the laws of the State of Arizona, United States, without regard to conflict-of-law rules."}</p>
</LegalSection>
<LegalSection title="11. Contact">
<p className="section-lead">{"Questions about these terms: open an issue at "}<a className="brief-link" href="https://github.com/asherbreverman/orthoparity-data/issues" target="_blank" rel="noopener noreferrer">{"github.com/asherbreverman/orthoparity-data/issues"}</a>{"."}</p>
</LegalSection>
</LegalPage>;
}
