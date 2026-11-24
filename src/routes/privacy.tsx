import { createFileRoute } from '@tanstack/react-router';
import { LegalPage, LegalSection } from '@/components/legal-page';
import { procedureHead } from '@/lib/procedure-queries';
import { pageTitle } from '@/lib/benchmark-brand';

export const Route = createFileRoute('/privacy')({
  staticData: { sitemap: true },
  head: () => procedureHead(pageTitle("Privacy Policy"), "How OrthoParity handles visit statistics, service providers, browser settings and public FDA and CMS records.", '/privacy'),
  component: LegalContent,
});
function LegalContent() {
  return <LegalPage title="Privacy Policy">
<section className="brief-section legal-intro"><p className="section-lead">{"OrthoParity is a free website with no accounts, no sign-up and no forms. This page explains what happens to information when you visit."}</p></section>
<LegalSection title="What we don't collect">
<p className="section-lead">{"You can use every part of the site without giving your name, email or any other personal information. The site has no logins, no comment boxes and no advertising, and we don't sell visitor information. The service providers described below receive the information needed to run the site."}</p>
</LegalSection>
<LegalSection title="Visitor analytics">
<p className="section-lead">{"The site is hosted on Lovable, which collects visit statistics for us. Its analytics uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors or recognise returning visitors."}</p>
<p className="section-lead">{"Button and link clicks are recorded for every visitor. Page visits, time on page, page speed and errors are also recorded for every visitor, without cookies and without identifying anyone. The site has no consent banner."}</p>
<p className="section-lead">{"The statistics include pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, and button and link clicks. We use these statistics to understand use of the site and find problems. Detailed data is kept for 90 days and daily summaries for a year."}</p>
<p className="section-lead">{"Lovable collects this data for us. Lovable's privacy policy at "}<a className="brief-link" href="https://lovable.dev/privacy" target="_blank" rel="noopener noreferrer">{"lovable.dev/privacy"}</a>{" explains how it handles it. Its cookie policy is at "}<a className="brief-link" href="https://lovable.dev/cookie-policy" target="_blank" rel="noopener noreferrer">{"lovable.dev/cookie-policy"}</a>{"."}</p>
</LegalSection>
<LegalSection title="Service providers">
<p className="section-lead">{"When you load a page, your browser connects to the services that run the site, and like any web server they may log your IP address and browser details:"}</p>
<ul className="section-lead list-disc pl-6 space-y-2"><li><strong>{"Lovable"}</strong>{" hosts the website."}</li><li><strong>{"Supabase"}</strong>{" stores and serves the database the pages read from."}</li><li><strong>{"Google Fonts"}</strong>{" receives preconnections from your browser to Google's font services, which may expose your IP address and browser details. The site currently uses system typefaces from your device, not downloaded Google Fonts."}</li></ul>
<p className="section-lead">{"Lovable and Supabase receive page and public-data requests, which can include the selected device or company. Each provider handles connection information under its own privacy policy. The site has no sign-in, advertising pixels or embedded third-party media."}</p>
<p className="section-lead">{"What you type in the search box (a 510(k) number, device or company name) is sent to our database host to load results, and like any web request it may appear in that host's standard request logs. Page addresses include the 510(k) or vendor you looked up, so the visit statistics described above record which pages were viewed, without identifying you. Prices you type in the procedure worksheet never leave your browser tab."}</p>
</LegalSection>
<LegalSection title="What happens to what you type">
<p className="section-lead">{"Prices you enter in a compare or part list, and everything in packet check and the calculators, stay in your browser. Searches for FDA numbers, part numbers, companies, codes and hospitals go to OrthoParity's database to return results."}</p>
</LegalSection>
<LegalSection title="Stored on your device">
<p className="section-lead">{"Your browser keeps a few settings on your own device, such as your light or dark theme choice and your scroll position. They aren't sent to us. You can clear them at any time in your browser settings."}</p>
</LegalSection>
<LegalSection title="Data about people in the public records">
<p className="section-lead">{"The site is built from public FDA and CMS records about devices and companies. CMS Open Payments data is loaded without surgeon names or National Provider Identifier (NPI) numbers, and the site never shows them."}</p>
</LegalSection>
<LegalSection title="Downloads">
<p className="section-lead">{"The \"Download brief\" button prints a page in your own browser. Nothing is uploaded to us."}</p>
</LegalSection>
<LegalSection title="Children">
<p className="section-lead">{"The site is for professionals and isn't directed to children under 13."}</p>
</LegalSection>
<LegalSection title="Changes">
<p className="section-lead">{"If this policy changes, the effective date at the top will change too."}</p>
</LegalSection>
<LegalSection title="Contact">
<p className="section-lead">{"Questions about privacy: open an issue at "}<a className="brief-link" href="https://github.com/asherbreverman/orthoparity-data/issues" target="_blank" rel="noopener noreferrer">{"github.com/asherbreverman/orthoparity-data/issues"}</a>{"."}</p>
</LegalSection>
</LegalPage>;
}
