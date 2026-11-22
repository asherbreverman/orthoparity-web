import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { printBrief } from '@/lib/brief-print';

export function ProductDownloadMenu() {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button>Download brief<ChevronDown size={14} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => void printBrief()}>Full brief</DropdownMenuItem><DropdownMenuItem onSelect={() => void printBrief('summary')}>One-page summary</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}