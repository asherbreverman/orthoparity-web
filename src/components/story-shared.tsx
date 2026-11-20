import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import type { DecisionCard } from '@/lib/signals';
import type { View } from '@/lib/signals';

export function StoryReveal({children,className = ''}: {children: ReactNode;className?: string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){node.dataset['revealed']='true';observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`story-reveal ${className}`}>{children}</div>;
}
export function evidenceItems(node: ReactNode): ReactNode[] { return isValidElement<{children?:ReactNode}>(node) ? Children.toArray(node.props.children) : Children.toArray(node); }
export function ExtraEvidence({sections,cards}: {sections:ReactNode;cards:DecisionCard[]}) {const used=new Set(cards.map(c=>c.evidence));if(used.has('alternatives'))used.add('category');if(used.has('recalls')){used.add('maude');used.add('supplier');}return <div className="extra-evidence">{evidenceItems(sections).filter(node=>isValidElement<{id?:string}>(node)&&!used.has(node.props.id ?? ''))}</div>;}
export function LocalBar({name,cards,vendor=false,view,onView}: {name:string;cards:DecisionCard[];vendor?:boolean;view:View;onView:(view:View)=>void}) {
  const [active,setActive]=useState('');
  useEffect(()=>{const ids=[...cards.map(c=>`chapter-${c.key}`),'all-questions',...(!vendor?['ancestry']:[])];const update=()=>{let next='';for(const id of ids){const node=document.getElementById(id);if(node&&node.getBoundingClientRect().top<=220)next=id;}setActive(next);};update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[cards,vendor]);
  return <nav className="local-bar no-print" aria-label={`Chapters for ${name}`}><div className="local-bar-inner"><div className="rail-links">{cards.map((c,i)=><a className={`question-hue-${c.key==='recalls'?7:i+1} ${active===`chapter-${c.key}`?'is-active':''}`} aria-current={active===`chapter-${c.key}`?'location':undefined} key={c.key} href={`#chapter-${c.key}`}>{c.short ?? c.question}</a>)}<a href="#all-questions" className={active==='all-questions'?'is-active':''}>All questions</a>{!vendor&&<a href="#ancestry" className={active==='ancestry'?'is-active':''}>Ancestry</a>}</div><Button variant="secondary" className="analyst-switch" role="switch" aria-checked={view==='analyst'} onClick={()=>onView(view==='analyst'?'brief':'analyst')}>Analyst detail</Button></div></nav>;
}
export function ComparisonSheet({open,onClose,children}: {open:boolean;onClose:()=>void;children:ReactNode}) {
  return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose();}}><Dialog.Portal><Dialog.Overlay className="comparison-overlay"/><Dialog.Content className="comparison-sheet" aria-describedby={undefined}><Dialog.Title className="sr-only">Compare vendors</Dialog.Title><Dialog.Close asChild><Button variant="secondary" size="icon" className="sheet-close" aria-label="Close comparison"><X/></Button></Dialog.Close>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}