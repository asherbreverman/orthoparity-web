import { createFileRoute } from '@tanstack/react-router';
import { procedureHead } from '@/lib/procedure-queries';
import { TeamCalculatorPage } from '@/components/team-pages';

export const Route = createFileRoute('/team_/calculator')({
  staticData: {sitemap: true},
  head: () => procedureHead('TEAM arithmetic for a device claim | OrthoParity', 'Work through the Medicare TEAM arithmetic behind a claimed device benefit. Runs in the browser; nothing typed is sent or stored.', '/team/calculator'),
  component: TeamCalculatorPage,
});
