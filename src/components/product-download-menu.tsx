import { ChevronDown, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { printBrief } from '@/lib/brief-print';

export function ProductDownloadMenu() {
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="op-btn op-btn-sm"><Download size={15} />Download brief<ChevronDown size={14} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => void printBrief()}>Full brief</DropdownMenuItem><DropdownMenuItem onSelect={() => void printBrief('summary')}>One-page summary</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
