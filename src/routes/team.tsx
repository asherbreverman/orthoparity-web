import { createFileRoute } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { TeamLookupPage } from '@/components/team-pages';

export const Route = createFileRoute('/team')({
  staticData: {sitemap: true},
  head: () => procedureHead('Medicare TEAM lookup | OrthoParity', "Check whether a hospital is in Medicare's TEAM episode model, whether a code starts an episode, and CMS's 2027 preliminary target prices.", '/team'),
  component: TeamLookupPage,
});
