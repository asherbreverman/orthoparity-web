import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DecisionCard, View } from '@/lib/signals';
import { Term } from './op-controls';

export function StoryReveal({children,className = ''}: {children: ReactNode;className?: string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){node.dataset['revealed']='true';observer.disconnect();}},{threshold:0.08});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`story-reveal ${className}`}>{children}</div>;
}
export function evidenceItems(node: ReactNode): ReactNode[] { return isValidElement<{children?:ReactNode}>(node) ? Children.toArray(node.props.children) : Children.toArray(node); }
export function ExtraEvidence({sections,cards}: {sections:ReactNode;cards:DecisionCard[]}) {const used=new Set(cards.map(c=>c.evidence));if(used.has('alternatives'))used.add('category');return <div className="extra-evidence">{evidenceItems(sections).filter(node=>isValidElement<{id?:string}>(node)&&!used.has(node.props.id ?? ''))}</div>;}

function railLabel(card: DecisionCard): ReactNode {
  if (card.evidence === 'research') return 'Studies';
  if (card.evidence === 'supplier') return 'Suppliers';
  if (card.evidence === 'procedures') return 'Medicare';
  if (card.evidence === 'addon') return 'Add-ons';
  if (card.evidence === 'predicates' && !card.short) return <Term term="Predicate">Predicate</Term>;
  return card.short ?? card.question;
}

export function LocalBar({name,cards,vendor=false,ancestry=true,view,onView,onOpen}: {name:string;cards:DecisionCard[];vendor?:boolean;ancestry?:boolean;view:View;onView:(view:View)=>void;onOpen?:(id:string)=>void}) {
  const [active,setActive]=useState('');
  const rail=useRef<HTMLElement>(null);
  useEffect(()=>{
    const element=rail.current;
    if(!element)return;
    const measure=()=>document.documentElement.style.setProperty('--record-rail-height',`${element.getBoundingClientRect().height}px`);
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(element);
    return()=>{observer.disconnect();document.documentElement.style.removeProperty('--record-rail-height');};
  },[]);
  useEffect(()=>{const ids=[...cards.map(c=>`chapter-${c.key}`),'all-questions',...(!vendor&&ancestry?['ancestry']:[])];const update=()=>{let next='';for(const id of ids){const node=document.getElementById(id);if(node&&node.getBoundingClientRect().top<=220)next=id;}setActive(next);};update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[cards,vendor,ancestry]);
  return <nav ref={rail} className="op-rail local-bar no-print" aria-label={`Chapters for ${name}`}><div className="op-wrap local-bar-inner"><div className="rail-links">{cards.map(c=><a aria-current={active===`chapter-${c.key}`?'location':undefined} key={c.key} href={`#chapter-${c.key}`} onClick={()=>onOpen?.(c.evidence)}>{railLabel(c)}</a>)}</div><details className="op-more"><summary>More<ChevronDown size={14} /></summary><div className="op-more-menu"><a href="#all-questions" aria-current={active==='all-questions'?'location':undefined}>All questions</a>{!vendor&&ancestry&&<a href="#ancestry" aria-current={active==='ancestry'?'location':undefined}>Ancestry</a>}<button type="button" role="switch" aria-checked={view==='analyst'} onClick={()=>onView(view==='analyst'?'brief':'analyst')}>Analyst detail</button></div></details></div></nav>;
}
