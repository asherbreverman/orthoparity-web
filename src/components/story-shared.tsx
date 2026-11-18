import { Children, isValidElement, useEffect, useRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import type { DecisionCard } from '@/lib/signals';

export function StoryReveal({children,className = ''}: {children: ReactNode;className?: string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){node.dataset['revealed']='true';observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`story-reveal ${className}`}>{children}</div>;
}
export function evidenceItems(node: ReactNode): ReactNode[] { return isValidElement<{children?:ReactNode}>(node) ? Children.toArray(node.props.children) : Children.toArray(node); }
export function ExtraEvidence({sections,cards}: {sections:ReactNode;cards:DecisionCard[]}) {const used=new Set(cards.map(c=>c.evidence));return <div className="extra-evidence">{evidenceItems(sections).filter(node=>isValidElement<{id?:string}>(node)&&!used.has(node.props.id ?? ''))}</div>;}
export function LocalBar({name,cards,vendor=false}: {name:string;cards:DecisionCard[];vendor?:boolean}) {
  const labels:Record<string,string>=vendor?{breadth:'Portfolio',momentum:'Recent',ownership:'Ownership',payments:'Ties',evidence:'Evidence',supply:'Stocking',recalls:'Recalls'}:{novelty:'New?',alternatives:'Alternatives',payments:'Ties',evidence:'Evidence',catalog:'Stocking',recalls:'Recalls'};
  return <nav className="local-bar no-print" aria-label="Chapters"><strong title={name}>{name}</strong><div>{cards.map(c=><a key={c.key} href={`#chapter-${c.key}`}>{labels[c.key] ?? c.question}</a>)}</div><Button onClick={()=>window.print()}>Get brief</Button></nav>;
}
export function ComparisonSheet({open,onClose,children}: {open:boolean;onClose:()=>void;children:ReactNode}) {
  return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose();}}><Dialog.Portal><Dialog.Overlay className="comparison-overlay"/><Dialog.Content className="comparison-sheet" aria-describedby={undefined}><Dialog.Title className="sr-only">Compare vendors</Dialog.Title><Dialog.Close asChild><Button variant="secondary" size="icon" className="sheet-close" aria-label="Close comparison"><X/></Button></Dialog.Close>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}