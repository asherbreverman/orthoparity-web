import { createFileRoute } from '@tanstack/react-router';
import { GlossaryPage } from '@/components/glossary-page';
import { procedureHead } from '@/lib/procedure-queries';

export const Route = createFileRoute('/glossary')({
  staticData: { sitemap: true },
  head: () => procedureHead('Glossary | OrthoParity', 'Plain-English definitions of the FDA and CMS terms on OrthoParity.', '/glossary'),
  component: GlossaryPage,
});
