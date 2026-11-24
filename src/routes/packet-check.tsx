import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import { procedureHead } from '@/lib/procedure-queries';
import { PacketCheckPage } from '@/components/packet-check';

export const Route = createFileRoute('/packet-check')({
  staticData: {sitemap: true},
  validateSearch: zodValidator(z.object({k: z.string().optional()})),
  head: () => procedureHead('Packet check: a vendor packet against the public record | OrthoParity', "Set a vendor packet's claim next to the FDA record, the ClinicalTrials.gov registry and Medicare's TEAM episode. Typed fields stay in the browser.", '/packet-check'),
  component: PacketCheck,
});
function PacketCheck() { const {k} = Route.useSearch(); return <PacketCheckPage key={k ?? ''} initialK={k ?? ''} />; }
